// src/stores/notificacionStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import rutaApi from '../assets/rutaApi.js'
import { useSessionStore } from './sessionStore'

export const useNotificacionStore = defineStore('notificacion', () => {
  const sessionStore = useSessionStore()

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
  const loading = ref(false)
  const error = ref(null)
  const stompClient = ref(null)
  const isConnected = ref(false)

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
   * Conectar al WebSocket
   */
  const connectWebSocket = () => {
    if (!sessionStore.isAuthenticated || !sessionStore.user?.id) {
      console.warn('Usuario no autenticado, no se conectará WebSocket')
      return
    }

    if (isConnected.value && stompClient.value?.connected) {
      console.log('WebSocket ya está conectado')
      return
    }

    console.log('🔌 Conectando al WebSocket...')

    try {
      const client = new Client({
        webSocketFactory: () => new SockJS(`${rutaApi}/ws`),
        
        debug: (str) => {
          console.log('STOMP: ' + str)
        },

        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        onConnect: () => {
          console.log('✅ WebSocket conectado')
          isConnected.value = true
          
          const userId = sessionStore.user.id
          
          client.subscribe(`/user/${userId}/queue/notificaciones`, (message) => {
            console.log('📬 Nueva notificación recibida:', message.body)
            
            try {
              const notificacion = JSON.parse(message.body)
              notificaciones.value.unshift(notificacion)
              
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(notificacion.titulo, {
                  body: notificacion.mensaje,
                  icon: '/favicon.ico'
                })
              }
            } catch (e) {
              console.error('Error al parsear notificación:', e)
            }
          })
        },

        onStompError: (frame) => {
          console.error('❌ Error STOMP:', frame.headers['message'])
          isConnected.value = false
        },

        onDisconnect: () => {
          console.log('🔌 WebSocket desconectado')
          isConnected.value = false
        }
      })

      client.activate()
      stompClient.value = client

    } catch (err) {
      console.error('Error al conectar WebSocket:', err)
      error.value = err.message
    }
  }

  /**
   * Desconectar del WebSocket
   */
  const disconnectWebSocket = () => {
    if (stompClient.value) {
      console.log('🔌 Desconectando WebSocket...')
      stompClient.value.deactivate()
      stompClient.value = null
      isConnected.value = false
    }
  }

  /**
   * Obtener notificaciones paginadas con filtros
   */
  const fetchNotificaciones = async (nuevosFiltros = {}) => {
    loading.value = true
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
      console.error('Error al obtener notificaciones:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
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
      console.error('Error al marcar como leída:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Marcar todas como leídas
   */
  const marcarTodasComoLeidas = async () => {
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

      return { success: true }
    } catch (err) {
      console.error('Error al marcar todas como leídas:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Eliminar notificación
   */
  const eliminarNotificacion = async (notificacionId) => {
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

      return { success: true }
    } catch (err) {
      console.error('Error al eliminar notificación:', err)
      return { success: false, error: err.message }
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
    disconnectWebSocket()
  }

  return {
    // State
    notificaciones,
    paginacion,
    filtros,
    loading,
    error,
    isConnected,
    
    // Computed
    unreadCount,
    ultimasTres,
    
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