// src/composables/useConcentradoWS.js
import { useWebSocket } from './useWebSocket'
import { useSessionStore } from '@/stores/sessionStore'

/**
 * Composable para WebSocket de Concentrados
 * Usa el cliente global único
 */
export function useConcentradoWS() {
  const ws = useWebSocket()
  const sessionStore = useSessionStore()

  /**
   * Suscribirse a cola personal de concentrados
   * Recibe actualizaciones cuando se crean/modifican concentrados del usuario
   */
  const suscribirCola = async (callback) => {
    // Conectar al WebSocket global si no está conectado
    await ws.conectar()
    
    const userId = sessionStore.user.id
    const destino = `/user/queue/concentrados`
    const id = `concentrados-cola-${userId}`

    // Suscribirse (evita duplicados automáticamente)
    ws.suscribirse(destino, (data) => {
      console.log('📥 Mensaje en cola de concentrados:', data)
      if (callback) callback(data)
    }, id)
    
    console.log('✅ Suscrito a cola de concentrados')
  }

  /**
   * Suscribirse a topic de concentrado específico
   * Recibe actualizaciones en tiempo real del concentrado
   */
  const suscribirConcentrado = async (concentradoId, callback) => {
    await ws.conectar()
    
    const destino = `/topic/concentrado/${concentradoId}/updates`
    const id = `concentrado-${concentradoId}`

    ws.suscribirse(destino, (data) => {
      console.log(`📥 Actualización de concentrado ${concentradoId}:`, data.evento)
      if (callback) callback(data)
    }, id)
    
    console.log(`✅ Suscrito a concentrado ${concentradoId}`)
  }

  /**
   * Desuscribirse de cola personal
   */
  const desuscribirCola = () => {
    const userId = sessionStore.user?.id
    if (userId) {
      const id = `concentrados-cola-${userId}`
      ws.desuscribirse(id)
      console.log('🔕 Desuscrito de cola de concentrados')
    }
  }

  /**
   * Desuscribirse de concentrado específico
   */
  const desuscribirConcentrado = (concentradoId) => {
    const id = `concentrado-${concentradoId}`
    ws.desuscribirse(id)
    console.log(`🔕 Desuscrito de concentrado ${concentradoId}`)
  }

  /**
   * Limpiar todas las suscripciones de concentrados
   */
  const limpiarSuscripciones = () => {
    desuscribirCola()
    
    // Desuscribirse de todos los concentrados específicos
    const suscripciones = ws.getSuscripcionesActivas()
    suscripciones
      .filter(id => id.startsWith('concentrado-'))
      .forEach(id => ws.desuscribirse(id))
    
    console.log('🧹 Suscripciones de concentrados limpiadas')
  }

  return {
    // Estado
    isConectado: ws.isConectado,
    
    // Acciones
    suscribirCola,
    suscribirConcentrado,
    desuscribirCola,
    desuscribirConcentrado,
    limpiarSuscripciones
  }
}