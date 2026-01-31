// src/composables/useWebSocket.js
import { ref, readonly } from 'vue'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useSessionStore } from '@/stores/sessionStore'
import rutaApi from '@/assets/rutaApi.js'

const stompClient = ref(null)
const isConectado = ref(false)
const connectionPromise = ref(null)
const subscriptions = new Map()

let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5

/**
 * Composable para el WebSocket global único
 */
export function useWebSocket() {
  const sessionStore = useSessionStore()

  /**
   * Conectar al WebSocket (solo una vez)
   */
  const conectar = () => {
    // Si ya está conectado, resolver inmediatamente
    if (isConectado.value && stompClient.value?.connected) {
      console.log('✅ WebSocket ya está conectado')
      return Promise.resolve()
    }

    // Si hay una conexión en proceso, esperar
    if (connectionPromise.value) {
      console.log('⏳ Esperando conexión en proceso...')
      return connectionPromise.value
    }

    // Validar autenticación
    if (!sessionStore.isAuthenticated || !sessionStore.user?.id) {
      const error = new Error('Usuario no autenticado')
      console.warn('⚠️', error.message)
      return Promise.reject(error)
    }

    console.log('🔌 Iniciando conexión WebSocket global...')

    connectionPromise.value = new Promise((resolve, reject) => {
      try {
        const client = new Client({
          webSocketFactory: () => new SockJS(`${rutaApi}/ws`),
          connectHeaders:{
            Authorization: `Bearer ${sessionStore.token}`
          },
          
          debug: (str) => {
            // Solo en desarrollo
            if (import.meta.env.DEV) {
              console.log('🔷 STOMP:', str)
            }
          },

          reconnectDelay: 5000,
          heartbeatIncoming: 20000,
          heartbeatOutgoing: 20000,

          onConnect: (frame) => {
            console.log('✅ WebSocket Global CONECTADO')
            isConectado.value = true
            reconnectAttempts = 0
            connectionPromise.value = null
            resolve()
          },

          onStompError: (frame) => {
            console.error('❌ Error STOMP:', frame.headers['message'])
            isConectado.value = false
            connectionPromise.value = null
            reject(new Error(frame.headers['message'] || 'Error STOMP'))
          },

          onDisconnect: () => {
            console.log('🔌 WebSocket Global DESCONECTADO')
            isConectado.value = false
            connectionPromise.value = null
            
            // Limpiar todas las suscripciones
            subscriptions.forEach((sub, id) => {
              console.log(`🔕 Limpiando suscripción: ${id}`)
            })
            subscriptions.clear()
          },

          onWebSocketClose: (evt) => {
            console.warn('⚠️ WebSocket cerrado:', evt.code, evt.reason)
            
            // Auto-reconexión limitada
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              reconnectAttempts++
              console.log(`🔄 Intento de reconexión ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`)
            } else {
              console.error('❌ Máximo de intentos de reconexión alcanzado')
            }
          }
        })

        client.activate()
        stompClient.value = client

      } catch (err) {
        console.error('❌ Error al crear cliente WebSocket:', err)
        connectionPromise.value = null
        reject(err)
      }
    })

    return connectionPromise.value
  }

  /**
   * Desconectar WebSocket
   */
  const desconectar = () => {
    if (stompClient.value) {
      console.log('🔌 Desconectando WebSocket Global...')
      
      // Desuscribirse de todo
      subscriptions.forEach((sub, id) => {
        try {
          sub.unsubscribe()
          console.log(`🔕 Desuscrito de: ${id}`)
        } catch (err) {
          console.error(`❌ Error al desuscribirse de ${id}:`, err)
        }
      })
      subscriptions.clear()
      
      stompClient.value.deactivate()
      stompClient.value = null
      isConectado.value = false
      connectionPromise.value = null
      reconnectAttempts = 0
      
      console.log('✅ WebSocket desconectado completamente')
    }
  }

  /**
   * Suscribirse a un destino (queue o topic)
   */
  const suscribirse = (destino, callback, identificador = null) => {
    if (!stompClient.value || !isConectado.value) {
      console.warn('⚠️ No se puede suscribir: WebSocket no conectado')
      return null
    }

    const id = identificador || destino
    
    // Evitar duplicados
    if (subscriptions.has(id)) {
      console.log(`ℹ️ Ya existe suscripción: ${id}`)
      return subscriptions.get(id)
    }

    console.log(`📡 Suscribiendo a: ${destino} (ID: ${id})`)

    try {
      const subscription = stompClient.value.subscribe(destino, (message) => {
        try {
          const data = JSON.parse(message.body)
          callback(data)
        } catch (err) {
          console.error(`❌ Error al parsear mensaje de ${destino}:`, err)
        }
      })

      subscriptions.set(id, subscription)
      console.log(`✅ Suscrito exitosamente: ${id}`)
      
      return subscription

    } catch (error) {
      console.error(`❌ Error al suscribirse a ${destino}:`, error)
      return null
    }
  }

  /**
   * Desuscribirse de un destino específico
   */
  const desuscribirse = (identificador) => {
    const subscription = subscriptions.get(identificador)
    
    if (subscription) {
      try {
        subscription.unsubscribe()
        subscriptions.delete(identificador)
        console.log(`🔕 Desuscrito de: ${identificador}`)
        return true
      } catch (err) {
        console.error(`❌ Error al desuscribirse de ${identificador}:`, err)
        return false
      }
    }
    
    return false
  }

  /**
   * Verificar si existe una suscripción
   */
  const tieneSuscripcion = (identificador) => {
    return subscriptions.has(identificador)
  }

  /**
   * Obtener lista de suscripciones activas
   */
  const getSuscripcionesActivas = () => {
    return Array.from(subscriptions.keys())
  }

  return {
    // State (readonly)
    isConectado: readonly(isConectado),
    
    // Actions
    conectar,
    desconectar,
    suscribirse,
    desuscribirse,
    
    // Utilities
    tieneSuscripcion,
    getSuscripcionesActivas
  }
}