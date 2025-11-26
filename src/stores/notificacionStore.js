// src/stores/notificacionStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import rutaApi from '../assets/rutaApi.js'
import { useSessionStore } from './sessionStore'

export const useNotificacionStore = defineStore('notificacion', () => {
  const notificaciones = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const stompClient = ref(null)
  const isConnected = ref(false)

  const API_URL = rutaApi
  const WS_URL = rutaApi

  // Computed
  const unreadCount = computed(() => 
    notificaciones.value.filter(n => !n.leido).length
  )

  const ultimasTres = computed(() => 
    notificaciones.value.slice(0, 3)
  )

  /**
   * Conectar al WebSocket
   */
  const connectWebSocket = () => {
    const sessionStore = useSessionStore()
    
    if (!sessionStore.isAuthenticated || !sessionStore.user?.id) {
      console.warn('Usuario no autenticado, no se conectará WebSocket')
      return
    }

    // Si ya está conectado, no reconectar
    if (isConnected.value && stompClient.value?.connected) {
      console.log('WebSocket ya está conectado')
      return
    }

    console.log('🔌 Conectando al WebSocket...')

    try {
      // Crear cliente STOMP
      const client = new Client({
        webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
        
        connectHeaders: {
          // Puedes agregar headers si necesitas autenticación
        },

        debug: (str) => {
          console.log('STOMP: ' + str)
        },

        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        onConnect: () => {
          console.log('✅ WebSocket conectado')
          isConnected.value = true
          
          // Suscribirse al canal de notificaciones del usuario
          const userId = sessionStore.user.id
          
          client.subscribe(`/user/${userId}/queue/notificaciones`, (message) => {
            console.log('📬 Nueva notificación recibida:', message.body)
            
            try {
              const notificacion = JSON.parse(message.body)
              
              // Agregar al inicio del array
              notificaciones.value.unshift(notificacion)
              
              // Mostrar notificación nativa del navegador (opcional)
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
          console.error('Detalles:', frame.body)
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
   * Obtener todas las notificaciones
   */
  const fetchNotificaciones = async (soloNoLeidas = false) => {
    isLoading.value = true
    error.value = null

    try {
      const sessionStore = useSessionStore()
      const params = soloNoLeidas ? '?soloNoLeidas=true' : ''
      
      const response = await fetch(`${API_URL}/notificaciones${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStore.token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener notificaciones')
      }

      notificaciones.value = data.data || []
      return { success: true, data: data.data }
    } catch (err) {
      error.value = err.message
      console.error('Error al obtener notificaciones:', err)
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Obtener contador de no leídas
   */
  const fetchUnreadCount = async () => {
    try {
      const sessionStore = useSessionStore()
      
      const response = await fetch(`${API_URL}/notificaciones/no-leidas/count`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStore.token}`
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
      const sessionStore = useSessionStore()
      
      const response = await fetch(`${API_URL}/notificaciones/${notificacionId}/leer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStore.token}`
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
      const sessionStore = useSessionStore()
      
      const response = await fetch(`${API_URL}/notificaciones/leer-todas`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStore.token}`
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
      const sessionStore = useSessionStore()
      
      const response = await fetch(`${API_URL}/notificaciones/${notificacionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStore.token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar notificación')
      }

      // Eliminar localmente
      notificaciones.value = notificaciones.value.filter(n => n.id !== notificacionId)

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
    error.value = null
    disconnectWebSocket()
  }

  return {
    // State
    notificaciones,
    isLoading,
    error,
    isConnected,
    
    // Computed
    unreadCount,
    ultimasTres,
    
    // Actions
    connectWebSocket,
    disconnectWebSocket,
    fetchNotificaciones,
    fetchUnreadCount,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    requestNotificationPermission,
    reset
  }
})