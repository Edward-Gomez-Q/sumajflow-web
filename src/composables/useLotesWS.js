// src/composables/useLotesWS.js
import { useWebSocket } from './useWebSocket'
import { useSessionStore } from '@/stores/sessionStore'

/**
 * Composable para WebSocket de Lotes
 * Usa el cliente global único
 * 
 * Arquitectura:
 * - /user/queue/lotes → Actualizaciones de lista (payload ligero)
 * - /topic/lote/{loteId} → Actualizaciones de detalle (payload completo)
 */
export function useLotesWS() {
  const ws = useWebSocket()
  const sessionStore = useSessionStore()

  /**
   * Suscribirse a cola personal de lotes
   * Recibe actualizaciones cuando hay cambios en lotes relevantes para el usuario
   * (creación, aprobación, rechazo, etc.)
   */
  const suscribirCola = async (callback) => {
    await ws.conectar()
    
    const userId = sessionStore.user.id
    const destino = `/user/queue/lotes`  // ✅ Spring agrega automáticamente el userId
    const id = `lotes-cola-${userId}`

    ws.suscribirse(destino, (data) => {
      console.log('📥 Mensaje en cola de lotes:', data.evento, data)
      if (callback) callback(data)
    }, id)
    
    console.log(`✅ Suscrito a cola de lotes del usuario ${userId}`)
  }

  /**
   * Suscribirse a topic de lote específico
   * Recibe actualizaciones en tiempo real del lote (para modal de detalle)
   */
  const suscribirLote = async (loteId, callback) => {
    await ws.conectar()
    
    const destino = `/topic/lote/${loteId}`
    const id = `lote-${loteId}`

    ws.suscribirse(destino, (data) => {
      console.log(`📥 Actualización de lote ${loteId}:`, data.evento, data)
      if (callback) callback(data)
    }, id)
    
    console.log(`✅ Suscrito a lote ${loteId}`)
  }

  /**
   * Desuscribirse de cola personal
   */
  const desuscribirCola = () => {
    const userId = sessionStore.user?.id
    if (userId) {
      const id = `lotes-cola-${userId}`
      ws.desuscribirse(id)
      console.log('🔕 Desuscrito de cola de lotes')
    }
  }

  /**
   * Desuscribirse de lote específico
   */
  const desuscribirLote = (loteId) => {
    const id = `lote-${loteId}`
    ws.desuscribirse(id)
    console.log(`🔕 Desuscrito de lote ${loteId}`)
  }

  /**
   * Limpiar todas las suscripciones de lotes
   */
  const limpiarSuscripciones = () => {
    desuscribirCola()
    
    // Desuscribirse de todos los lotes específicos
    const suscripciones = ws.getSuscripcionesActivas()
    suscripciones
      .filter(id => id.startsWith('lote-'))
      .forEach(id => ws.desuscribirse(id))
    
    console.log('🧹 Suscripciones de lotes limpiadas')
  }

  return {
    isConectado: ws.isConectado,
    suscribirCola,
    desuscribirCola,
    suscribirLote,
    desuscribirLote,
    limpiarSuscripciones
  }
}