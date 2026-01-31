// src/composables/useConcentradoWebSocket.js
import { ref, onUnmounted } from 'vue'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useSessionStore } from '@/stores/sessionStore'
import rutaApi from '@/assets/rutaApi.js'

export function useConcentradoWebSocket() {
  const sessionStore = useSessionStore()
  
  const stompClient = ref(null)
  const isConectado = ref(false)
  
  // Callbacks registrados
  const callbacks = {
    onConcentradoActualizado: null,
    onKanbanActualizado: null
  }

  const conectar = () => {
    return new Promise((resolve, reject) => {
      if (!sessionStore.isAuthenticated || !sessionStore.user?.id) {
        reject(new Error('Usuario no autenticado'))
        return
      }

      if (isConectado.value && stompClient.value?.connected) {
        resolve()
        return
      }

      console.log('🔌 Conectando al Concentrado WebSocket...')

      try {
        const client = new Client({
          webSocketFactory: () => new SockJS(`${rutaApi}/ws`),
          
          debug: (str) => {
            console.log('🔷 STOMP Concentrado: ' + str)
          },

          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,

          onConnect: () => {
            console.log('✅ Concentrado WebSocket conectado')
            isConectado.value = true
            resolve()
          },

          onStompError: (frame) => {
            console.error('❌ Error STOMP Concentrado:', frame.headers['message'])
            isConectado.value = false
            reject(new Error(frame.headers['message']))
          },

          onDisconnect: () => {
            console.log('🔌 Concentrado WebSocket desconectado')
            isConectado.value = false
          }
        })

        client.activate()
        stompClient.value = client

      } catch (err) {
        console.error('❌ Error al conectar Concentrado WebSocket:', err)
        reject(err)
      }
    })
  }

  const desconectar = () => {
    if (stompClient.value) {
      console.log('🔌 Desconectando Concentrado WebSocket...')
      stompClient.value.deactivate()
      stompClient.value = null
      isConectado.value = false
    }
  }

  /**
   * Suscribirse a cola personal para actualizaciones de lista
   */
  const suscribirCola = (onMensaje) => {
    if (!stompClient.value || !isConectado.value) {
      console.warn('⚠️ No se puede suscribir: WebSocket no conectado')
      return
    }

    const userId = sessionStore.user.id
    const destino = `/user/${userId}/queue/concentrados`

    console.log(`📡 Suscribiendo a cola personal: ${destino}`)

    try {
      const subscription = stompClient.value.subscribe(destino, (message) => {
        console.log(`📥 Mensaje recibido en cola personal`)
        
        try {
          const data = JSON.parse(message.body)
          if (onMensaje) onMensaje(data)
        } catch (e) {
          console.error('❌ Error al parsear mensaje:', e)
        }
      })

      console.log(`✅ Suscrito exitosamente a cola personal`)
      return subscription

    } catch (error) {
      console.error(`❌ Error al suscribirse a cola:`, error)
    }
  }

  /**
   * Suscribirse a topic de concentrado específico para detalle
   */
  const suscribirConcentrado = (concentradoId, onMensaje) => {
    if (!stompClient.value || !isConectado.value) {
      console.warn('⚠️ No se puede suscribir: WebSocket no conectado')
      return
    }

    const destino = `/topic/concentrado/${concentradoId}/updates`

    console.log(`📡 Suscribiendo a concentrado: ${destino}`)

    try {
      const subscription = stompClient.value.subscribe(destino, (message) => {
        console.log(`📥 Actualización recibida para concentrado ${concentradoId}`)
        
        try {
          const data = JSON.parse(message.body)
          
          // Llamar callback según el tipo de evento
          if (data.evento === 'kanban_actualizado' && callbacks.onKanbanActualizado) {
            callbacks.onKanbanActualizado(data.procesos)
          } else if (callbacks.onConcentradoActualizado) {
            callbacks.onConcentradoActualizado(data.concentrado)
          }

          if (onMensaje) onMensaje(data)
        } catch (e) {
          console.error('❌ Error al parsear mensaje:', e)
        }
      })

      console.log(`✅ Suscrito exitosamente a concentrado ${concentradoId}`)
      return subscription

    } catch (error) {
      console.error(`❌ Error al suscribirse al concentrado:`, error)
    }
  }

  // Registrar callbacks
  const onConcentradoActualizado = (callback) => {
    callbacks.onConcentradoActualizado = callback
  }

  const onKanbanActualizado = (callback) => {
    callbacks.onKanbanActualizado = callback
  }

  // Cleanup
  onUnmounted(() => {
    desconectar()
  })

  return {
    isConectado,
    conectar,
    desconectar,
    suscribirCola,
    suscribirConcentrado,
    onConcentradoActualizado,
    onKanbanActualizado
  }
}