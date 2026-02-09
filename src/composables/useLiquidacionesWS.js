// src/composables/useLiquidacionesWS.js
import { useWebSocket } from './useWebSocket'
import { useSessionStore } from '@/stores/sessionStore'

/**
 * Composable para WebSocket de Liquidaciones
 */
export function useLiquidacionesWS() {
  const ws = useWebSocket()
  const sessionStore = useSessionStore()

  const suscribirCola = async (callback) => {
    await ws.conectar()
    
    const userId = sessionStore.user.id
    const destino = `/user/queue/liquidaciones`
    const id = `liquidaciones-cola-${userId}`

    ws.suscribirse(destino, (data) => {
      console.log('📥 Mensaje en cola de liquidaciones:', data.evento, data)
      if (callback) callback(data)
    }, id)
    
    console.log(`✅ Suscrito a cola de liquidaciones del usuario ${userId}`)
  }

  const suscribirLiquidacion = async (liquidacionId, callback) => {
    await ws.conectar()
    
    const destino = `/topic/liquidacion/${liquidacionId}`
    const id = `liquidacion-${liquidacionId}`

    ws.suscribirse(destino, (data) => {
      console.log(`📥 Actualización de liquidación ${liquidacionId}:`, data.evento, data)
      if (callback) callback(data)
    }, id)
    
    console.log(`✅ Suscrito a liquidación ${liquidacionId}`)
  }

  const desuscribirCola = () => {
    const userId = sessionStore.user?.id
    if (userId) {
      const id = `liquidaciones-cola-${userId}`
      ws.desuscribirse(id)
      console.log('🔕 Desuscrito de cola de liquidaciones')
    }
  }

  const desuscribirLiquidacion = (liquidacionId) => {
    const id = `liquidacion-${liquidacionId}`
    ws.desuscribirse(id)
    console.log(`🔕 Desuscrito de liquidación ${liquidacionId}`)
  }

  const limpiarSuscripciones = () => {
    desuscribirCola()
    const suscripciones = ws.getSuscripcionesActivas()
    suscripciones
      .filter(id => id.startsWith('liquidacion-'))
      .forEach(id => ws.desuscribirse(id))
    console.log('🧹 Suscripciones de liquidaciones limpiadas')
  }

  return {
    isConectado: ws.isConectado,
    suscribirCola,
    desuscribirCola,
    suscribirLiquidacion,
    desuscribirLiquidacion,
    limpiarSuscripciones
  }
}