// src/stores/notificacionStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useWebSocket } from '@/composables/useWebSocket' // ⬅️ NUEVO
import { useUIStore } from './uiStore'
import { useSessionStore } from './sessionStore'
import rutaApi from '../assets/rutaApi.js'

export const useNotificacionStore = defineStore('notificacion', () => {
  const uiStore = useUIStore()
  const sessionStore = useSessionStore()
  const ws = useWebSocket() // ⬅️ USAR WEBSOCKET GLOBAL

  // State
  const notificaciones = ref([])
  const paginacion = ref({
    totalElementos: 0,
    totalPaginas: 0,
    paginaActual: 0,
    elementosPorPagina: 20,
    tieneSiguiente: false,
    tieneAnterior: false
  })
  const filtros = ref({
    soloNoLeidas: false,
    tipo: null,
    page: 0,
    size: 20
  })
  const error = ref(null)

  // Computed
  const unreadCount = computed(() => 
    notificaciones.value.filter(n => !n.leido).length
  )

  const ultimasTres = computed(() => 
    notificaciones.value.slice(0, 3)
  )

  // Ruta base dinámica según el rol
  const getBaseUrl = () => {
    const userRole = sessionStore.userRole
    if (!userRole) {
      throw new Error('Rol de usuario no definido')
    }
    return `${rutaApi}/${userRole}/notificaciones`
  }

  /**
   * Conectar al WebSocket y suscribirse a notificaciones
   */
  const connectWebSocket = async () => {
    if (!sessionStore.isAuthenticated || !sessionStore.user?.id) {
      console.warn('⚠️ Usuario no autenticado, no se conectará WebSocket')
      return
    }

    try {
      // Conectar al WebSocket global
      await ws.conectar()
      
      const userId = sessionStore.user.id
      const destino = `/user/queue/notificaciones`
      const id = `notificaciones-${userId}`

      // Suscribirse si no existe ya
      if (!ws.tieneSuscripcion(id)) {
        ws.suscribirse(destino, (notificacion) => {
          console.log('🔔 Nueva notificación recibida:', notificacion)
          
          // Agregar al inicio del array
          notificaciones.value.unshift(notificacion)
          
          // Mostrar notificación del navegador
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notificacion.titulo, {
              body: notificacion.mensaje,
              icon: '/favicon.ico'
            })
          }
        }, id)

        console.log('✅ Suscrito a notificaciones WebSocket')
      } else {
        console.log('ℹ️ Ya estaba suscrito a notificaciones')
      }

    } catch (err) {
      console.error('❌ Error al conectar WebSocket de notificaciones:', err)
      error.value = err.message
    }
  }

  /**
   * Desconectar del WebSocket (solo desuscribirse)
   */
  const disconnectWebSocket = () => {
    const userId = sessionStore.user?.id
    if (userId) {
      const id = `notificaciones-${userId}`
      ws.desuscribirse(id)
      console.log('🔕 Desuscrito de notificaciones')
    }
  }

  /**
   * Obtener notificaciones paginadas con filtros
   */
  const fetchNotificaciones = async (nuevosFiltros = {}) => {
    uiStore.showLoading('Cargando notificaciones...')
    error.value = null

    // Actualizar filtros si se pasaron nuevos
    if (Object.keys(nuevosFiltros).length > 0) {
      filtros.value = { ...filtros.value, ...nuevosFiltros }
    }

    try {
      const baseUrl = getBaseUrl()
      
      // Construir query params
      const params = new URLSearchParams()
      if (filtros.value.soloNoLeidas) params.append('soloNoLeidas', 'true')
      if (filtros.value.tipo) params.append('tipo', filtros.value.tipo)
      params.append('page', filtros.value.page)
      params.append('size', filtros.value.size)

      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener notificaciones')
      }

      notificaciones.value = data.data.notificaciones
      paginacion.value = {
        totalElementos: data.data.totalElementos,
        totalPaginas: data.data.totalPaginas,
        paginaActual: data.data.paginaActual,
        elementosPorPagina: data.data.elementosPorPagina,
        tieneSiguiente: data.data.tieneSiguiente,
        tieneAnterior: data.data.tieneAnterior
      }

      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Cargar')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Cambiar página
   */
  const cambiarPagina = async (nuevaPagina) => {
    filtros.value.page = nuevaPagina
    await fetchNotificaciones()
  }

  /**
   * Aplicar filtros
   */
  const aplicarFiltros = async (nuevosFiltros) => {
    filtros.value = { ...filtros.value, ...nuevosFiltros, page: 0 }
    await fetchNotificaciones()
  }

  /**
   * Limpiar filtros
   */
  const limpiarFiltros = async () => {
    filtros.value = {
      soloNoLeidas: false,
      tipo: null,
      page: 0,
      size: 20
    }
    await fetchNotificaciones()
  }

  /**
   * Obtener contador de no leídas
   */
  const fetchUnreadCount = async () => {
    try {
      const baseUrl = getBaseUrl()
      
      const response = await fetch(`${baseUrl}/count`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        return data.count || 0
      }
      return 0
    } catch (err) {
      console.error('Error al obtener contador:', err)
      return 0
    }
  }

  /**
   * Marcar notificación como leída
   */
  const marcarComoLeida = async (notificacionId) => {
    error.value = null

    try {
      const baseUrl = getBaseUrl()
      
      const response = await fetch(`${baseUrl}/${notificacionId}/leer`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al marcar como leída')
      }

      // Actualizar localmente
      const notificacion = notificaciones.value.find(n => n.id === notificacionId)
      if (notificacion) {
        notificacion.leido = true
      }

      return { success: true }

    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    }
  }

  /**
   * Marcar todas como leídas
   */
  const marcarTodasComoLeidas = async () => {
    uiStore.showLoading('Marcando notificaciones como leidas...')
    error.value = null

    try {
      const baseUrl = getBaseUrl()
      
      const response = await fetch(`${baseUrl}/leer-todas`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al marcar todas como leídas')
      }

      // Actualizar localmente
      notificaciones.value.forEach(n => n.leido = true)

      uiStore.showSuccess(
        data.message || 'Notificaciones marcadas como leidas',
        'Actualizado Exitosamente'
      )

      return { success: true }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Actualizar')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Eliminar notificación
   */
  const eliminarNotificacion = async (notificacionId) => {
    const confirmed = await uiStore.showDeleteConfirm('esta notificacion')
    
    if (!confirmed) {
      return { success: false, cancelled: true }
    }

    uiStore.showLoading('Eliminando notificacion...')
    error.value = null

    try {
      const baseUrl = getBaseUrl()
      
      const response = await fetch(`${baseUrl}/${notificacionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar notificación')
      }

      // Eliminar localmente y recargar
      await fetchNotificaciones()

      uiStore.showSuccess(
        data.message || 'Notificacion eliminada exitosamente',
        'Eliminada Exitosamente'
      )

      return { success: true }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Eliminar')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Solicitar permisos de notificaciones del navegador
   */
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }

  /**
   * Reset del store
   */
  const reset = () => {
    notificaciones.value = []
    paginacion.value = {
      totalElementos: 0,
      totalPaginas: 0,
      paginaActual: 0,
      elementosPorPagina: 20,
      tieneSiguiente: false,
      tieneAnterior: false
    }
    filtros.value = {
      soloNoLeidas: false,
      tipo: null,
      page: 0,
      size: 20
    }
    error.value = null
    disconnectWebSocket() // ⬅️ Solo desuscribirse, no desconectar el WebSocket global
  }

  return {
    // State
    notificaciones,
    paginacion,
    filtros,
    error,
    
    // Computed
    unreadCount,
    ultimasTres,
    isConnected: ws.isConectado, // ⬅️ EXPONER ESTADO GLOBAL
    
    // Actions
    connectWebSocket,
    disconnectWebSocket,
    fetchNotificaciones,
    cambiarPagina,
    aplicarFiltros,
    limpiarFiltros,
    fetchUnreadCount,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    requestNotificationPermission,
    reset
  }
})