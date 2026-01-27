// src/composables/useTrackingWebSocket.js
import { ref, reactive } from 'vue'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useSessionStore } from '@/stores/sessionStore'
import rutaApi from '@/assets/rutaApi.js'

export function useTrackingWebSocket() {
  const sessionStore = useSessionStore()
  
  const stompClient = ref(null)
  const isConectado = ref(false)
  
  // Almacenar datos de tracking por asignacionCamionId
  const trackingData = reactive({})
  
  // 🆕 Timestamp de última recepción de mensaje por camión
  const ultimosTimestamps = reactive({})
  
  // 🆕 Timeouts de offline por camión
  const timeoutsOffline = reactive({})
  
  // Suscripciones activas
  const suscripcionesActivas = reactive({
    lotes: new Set(),
    camiones: new Set()
  })

  /**
   * 🆕 Iniciar monitoreo de offline para un camión
   */
  const iniciarMonitoreoOffline = (asignacionCamionId) => {
    // Limpiar timeout anterior si existe
    if (timeoutsOffline[asignacionCamionId]) {
      clearTimeout(timeoutsOffline[asignacionCamionId])
    }

    // Marcar timestamp actual
    ultimosTimestamps[asignacionCamionId] = Date.now()

    // Configurar timeout de 40 segundos
    timeoutsOffline[asignacionCamionId] = setTimeout(() => {
      console.log(`⚠️ Camión ${asignacionCamionId} sin mensajes WebSocket por 40 segundos, marcando offline`)
      
      // Actualizar estado de conexión a offline
      if (trackingData[asignacionCamionId]) {
        trackingData[asignacionCamionId] = {
          ...trackingData[asignacionCamionId],
          estadoConexion: 'offline'
        }
      }
    }, 40000) // 40 segundos
  }

  /**
   * 🆕 Reiniciar monitoreo de offline (llamar cada vez que llega un mensaje)
   */
  const reiniciarMonitoreoOffline = (asignacionCamionId) => {
    // Marcar como online
    if (trackingData[asignacionCamionId]) {
      trackingData[asignacionCamionId] = {
        ...trackingData[asignacionCamionId],
        estadoConexion: 'online'
      }
    }

    // Reiniciar el timeout
    iniciarMonitoreoOffline(asignacionCamionId)
  }

  /**
   * 🆕 Limpiar monitoreo de offline para un camión
   */
  const limpiarMonitoreoOffline = (asignacionCamionId) => {
    if (timeoutsOffline[asignacionCamionId]) {
      clearTimeout(timeoutsOffline[asignacionCamionId])
      delete timeoutsOffline[asignacionCamionId]
    }
    delete ultimosTimestamps[asignacionCamionId]
  }

  const conectar = () => {
    return new Promise((resolve, reject) => {
      if (!sessionStore.isAuthenticated || !sessionStore.user?.id) {
        console.warn('⚠️ Usuario no autenticado, no se puede conectar tracking WebSocket')
        reject(new Error('Usuario no autenticado'))
        return
      }

      if (isConectado.value && stompClient.value?.connected) {
        console.log('✅ Tracking WebSocket ya está conectado')
        resolve()
        return
      }

      console.log('🔌 Conectando al Tracking WebSocket...')

      try {
        const client = new Client({
          webSocketFactory: () => new SockJS(`${rutaApi}/ws`),
          
          debug: (str) => {
            console.log('🔷 STOMP Tracking: ' + str)
          },

          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,

          onConnect: () => {
            console.log('✅ Tracking WebSocket conectado')
            isConectado.value = true
            resolve()
          },

          onStompError: (frame) => {
            console.error('❌ Error STOMP Tracking:', frame.headers['message'])
            isConectado.value = false
            reject(new Error(frame.headers['message']))
          },

          onDisconnect: () => {
            console.log('🔌 Tracking WebSocket desconectado')
            isConectado.value = false
          }
        })

        client.activate()
        stompClient.value = client

      } catch (err) {
        console.error('❌ Error al conectar Tracking WebSocket:', err)
        reject(err)
      }
    })
  }

  const desconectar = () => {
    if (stompClient.value) {
      console.log('🔌 Desconectando Tracking WebSocket...')
      
      // 🆕 Limpiar todos los monitoreos de offline
      Object.keys(timeoutsOffline).forEach(id => {
        limpiarMonitoreoOffline(parseInt(id))
      })
      
      suscripcionesActivas.lotes.clear()
      suscripcionesActivas.camiones.clear()
      
      stompClient.value.deactivate()
      stompClient.value = null
      isConectado.value = false
    }
  }

  const suscribirLote = (loteId) => {
    if (!stompClient.value || !isConectado.value) {
      console.warn('⚠️ No se puede suscribir: WebSocket no conectado')
      return
    }

    if (suscripcionesActivas.lotes.has(loteId)) {
      console.log(`ℹ️ Ya estás suscrito al lote ${loteId}`)
      return
    }

    console.log(`📡 Suscribiendo a tracking del lote ${loteId}`)

    try {
      const subscription = stompClient.value.subscribe(
        `/topic/tracking/lote/${loteId}`,
        (message) => {
          console.log(`📥 Mensaje WebSocket recibido para lote ${loteId}`)
          
          try {
            const data = JSON.parse(message.body)
            
            if (data.asignacionCamionId) {
              // Actualizar datos de tracking
              trackingData[data.asignacionCamionId] = data
              
              // 🆕 Reiniciar monitoreo de offline
              reiniciarMonitoreoOffline(data.asignacionCamionId)
              
              console.log(`✅ Tracking actualizado para camión ${data.asignacionCamionId}`)
            }
          } catch (e) {
            console.error('❌ Error al parsear mensaje de tracking:', e)
          }
        }
      )

      suscripcionesActivas.lotes.add(loteId)
      console.log(`✅ Suscrito exitosamente a lote ${loteId}`)

    } catch (error) {
      console.error(`❌ Error al suscribirse al lote ${loteId}:`, error)
    }
  }

  const desuscribirLote = (loteId) => {
    if (suscripcionesActivas.lotes.has(loteId)) {
      console.log(`🔕 Desuscribiendo de lote ${loteId}`)
      suscripcionesActivas.lotes.delete(loteId)
    }
  }

  const suscribirCamion = (asignacionCamionId) => {
    if (!stompClient.value || !isConectado.value) {
      console.warn('⚠️ No se puede suscribir: WebSocket no conectado')
      return
    }

    if (suscripcionesActivas.camiones.has(asignacionCamionId)) {
      console.log(`ℹ️ Ya estás suscrito al camión ${asignacionCamionId}`)
      return
    }

    console.log(`📡 Suscribiendo a tracking del camión ${asignacionCamionId}`)

    try {
      const subscription = stompClient.value.subscribe(
        `/topic/tracking/camion/${asignacionCamionId}`,
        (message) => {
          console.log(`📥 Mensaje WebSocket recibido para camión ${asignacionCamionId}`)
          
          try {
            const data = JSON.parse(message.body)
            
            // Actualizar datos de tracking
            trackingData[asignacionCamionId] = data
            
            // 🆕 Reiniciar monitoreo de offline
            reiniciarMonitoreoOffline(asignacionCamionId)
            
            console.log(`✅ Tracking actualizado para camión ${asignacionCamionId}`)
          } catch (e) {
            console.error('❌ Error al parsear mensaje de tracking del camión:', e)
          }
        }
      )

      // 🆕 Iniciar monitoreo de offline
      iniciarMonitoreoOffline(asignacionCamionId)

      suscripcionesActivas.camiones.add(asignacionCamionId)
      console.log(`✅ Suscrito exitosamente a camión ${asignacionCamionId}`)

    } catch (error) {
      console.error(`❌ Error al suscribirse al camión ${asignacionCamionId}:`, error)
    }
  }

  const desuscribirCamion = (asignacionCamionId) => {
    if (suscripcionesActivas.camiones.has(asignacionCamionId)) {
      console.log(`🔕 Desuscribiendo de camión ${asignacionCamionId}`)
      
      // 🆕 Limpiar monitoreo de offline
      limpiarMonitoreoOffline(asignacionCamionId)
      
      suscripcionesActivas.camiones.delete(asignacionCamionId)
    }
  }

  const limpiarTracking = () => {
    Object.keys(trackingData).forEach(key => delete trackingData[key])
    console.log('🧹 Datos de tracking limpiados')
  }

  return {
    // State
    trackingData,
    isConectado,
    suscripcionesActivas,
    
    // Actions
    conectar,
    desconectar,
    suscribirLote,
    desuscribirLote,
    suscribirCamion,
    desuscribirCamion,
    limpiarTracking
  }
}