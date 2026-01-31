// src/composables/useTrackingWS.js
import { reactive } from 'vue'
import { useWebSocket } from './useWebSocket'
import { useSessionStore } from '@/stores/sessionStore'

/**
 * Composable para WebSocket de Tracking de Camiones
 * Usa el cliente global único
 */
export function useTrackingWS() {
  const ws = useWebSocket()
  const sessionStore = useSessionStore()
  
  // Almacenar datos de tracking por asignacionCamionId
  const trackingData = reactive({})
  
  // Timestamp de última recepción de mensaje por camión
  const ultimosTimestamps = reactive({})
  
  // Timeouts de offline por camión
  const timeoutsOffline = reactive({})
  
  // IDs de suscripciones activas (para cleanup)
  const suscripcionesActivas = reactive({
    lotes: new Set(),
    camiones: new Set()
  })

  /**
   * Iniciar monitoreo de offline para un camión
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
      console.log(`⚠️ Camión ${asignacionCamionId} sin mensajes por 40s → offline`)
      
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
   * Reiniciar monitoreo de offline (llamar cada vez que llega un mensaje)
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
   * Limpiar monitoreo de offline para un camión
   */
  const limpiarMonitoreoOffline = (asignacionCamionId) => {
    if (timeoutsOffline[asignacionCamionId]) {
      clearTimeout(timeoutsOffline[asignacionCamionId])
      delete timeoutsOffline[asignacionCamionId]
    }
    delete ultimosTimestamps[asignacionCamionId]
  }

  /**
   * Suscribirse a tracking de un lote
   */
  const suscribirLote = async (loteId) => {
    await ws.conectar()

    if (suscripcionesActivas.lotes.has(loteId)) {
      console.log(`ℹ️ Ya estás suscrito al lote ${loteId}`)
      return
    }

    const destino = `/topic/tracking/lote/${loteId}`
    const id = `tracking-lote-${loteId}`

    ws.suscribirse(destino, (data) => {
      console.log(`📥 Tracking de lote ${loteId} actualizado`)
      
      if (data.asignacionCamionId) {
        // Actualizar datos de tracking
        trackingData[data.asignacionCamionId] = data
        
        // Reiniciar monitoreo de offline
        reiniciarMonitoreoOffline(data.asignacionCamionId)
      }
    }, id)

    suscripcionesActivas.lotes.add(loteId)
    console.log(`✅ Suscrito a tracking de lote ${loteId}`)
  }

  /**
   * Desuscribirse de tracking de un lote
   */
  const desuscribirLote = (loteId) => {
    if (suscripcionesActivas.lotes.has(loteId)) {
      const id = `tracking-lote-${loteId}`
      ws.desuscribirse(id)
      suscripcionesActivas.lotes.delete(loteId)
      console.log(`🔕 Desuscrito de tracking de lote ${loteId}`)
    }
  }

  /**
   * Suscribirse a tracking de un camión específico
   */
  const suscribirCamion = async (asignacionCamionId) => {
    await ws.conectar()

    if (suscripcionesActivas.camiones.has(asignacionCamionId)) {
      console.log(`ℹ️ Ya estás suscrito al camión ${asignacionCamionId}`)
      return
    }

    const destino = `/topic/tracking/camion/${asignacionCamionId}`
    const id = `tracking-camion-${asignacionCamionId}`

    ws.suscribirse(destino, (data) => {
      console.log(`📥 Tracking de camión ${asignacionCamionId} actualizado`)
      
      // Actualizar datos de tracking
      trackingData[asignacionCamionId] = data
      
      // Reiniciar monitoreo de offline
      reiniciarMonitoreoOffline(asignacionCamionId)
    }, id)

    // Iniciar monitoreo de offline
    iniciarMonitoreoOffline(asignacionCamionId)

    suscripcionesActivas.camiones.add(asignacionCamionId)
    console.log(`✅ Suscrito a tracking de camión ${asignacionCamionId}`)
  }

  /**
   * Desuscribirse de tracking de un camión
   */
  const desuscribirCamion = (asignacionCamionId) => {
    if (suscripcionesActivas.camiones.has(asignacionCamionId)) {
      const id = `tracking-camion-${asignacionCamionId}`
      ws.desuscribirse(id)
      
      // Limpiar monitoreo de offline
      limpiarMonitoreoOffline(asignacionCamionId)
      
      suscripcionesActivas.camiones.delete(asignacionCamionId)
      console.log(`🔕 Desuscrito de tracking de camión ${asignacionCamionId}`)
    }
  }

  /**
   * Limpiar datos de tracking
   */
  const limpiarTracking = () => {
    Object.keys(trackingData).forEach(key => delete trackingData[key])
    console.log('🧹 Datos de tracking limpiados')
  }

  /**
   * Limpiar todas las suscripciones de tracking
   */
  const limpiarSuscripciones = () => {
    // Desuscribirse de todos los lotes
    suscripcionesActivas.lotes.forEach(loteId => {
      desuscribirLote(loteId)
    })
    
    // Desuscribirse de todos los camiones
    suscripcionesActivas.camiones.forEach(camionId => {
      desuscribirCamion(camionId)
    })
    
    // Limpiar todos los monitoreos de offline
    Object.keys(timeoutsOffline).forEach(id => {
      limpiarMonitoreoOffline(parseInt(id))
    })
    
    console.log('🧹 Todas las suscripciones de tracking limpiadas')
  }

  return {
    // State
    trackingData,
    isConectado: ws.isConectado,
    suscripcionesActivas,
    
    // Actions - Lotes
    suscribirLote,
    desuscribirLote,
    
    // Actions - Camiones
    suscribirCamion,
    desuscribirCamion,
    
    // Utilities
    limpiarTracking,
    limpiarSuscripciones
  }
}