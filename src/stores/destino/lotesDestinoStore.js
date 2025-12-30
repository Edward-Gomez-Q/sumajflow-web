// src/stores/destino/lotesDestinoStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSessionStore } from '../sessionStore.js'
import rutaApi from '../../assets/rutaApi.js'

export const useLotesDestinoStore = defineStore('lotesDestino', () => {
  const sessionStore = useSessionStore()
  
  // State
  const lotesPendientes = ref([])
  const loteDetalle = ref(null)
  const loading = ref(false)
  const loadingDetalle = ref(false)
  const error = ref(null)
  const tipoDestino = ref(null) // 'ingenio' o 'comercializadora'

  // Computed
  const totalPendientes = computed(() => lotesPendientes.value.length)
  
  const lotesPorTipoMineral = computed(() => {
    return {
      complejo: lotesPendientes.value.filter(l => l.tipoMineral === 'complejo').length,
      concentrado: lotesPendientes.value.filter(l => l.tipoMineral === 'concentrado').length
    }
  })

  const lotesHoy = computed(() => {
    const hoy = new Date().toDateString()
    return lotesPendientes.value.filter(l => {
      const fechaCreacion = new Date(l.fechaCreacion).toDateString()
      return fechaCreacion === hoy
    }).length
  })

  /**
   * Configurar tipo de destino
   */
  const setTipoDestino = (tipo) => {
    tipoDestino.value = tipo
  }

  /**
   * Obtener endpoint base según el tipo de destino
   */
  const getBaseEndpoint = () => {
    if (!tipoDestino.value) {
      throw new Error('Tipo de destino no configurado')
    }
    return `${rutaApi}/${tipoDestino.value}/lotes`
  }

  /**
   * Obtener lotes pendientes de aprobación
   */
  const fetchLotesPendientes = async () => {
    loading.value = true
    error.value = null

    try {
      const endpoint = getBaseEndpoint()
      const response = await fetch(`${endpoint}/pendientes`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar lotes pendientes')
      }

      lotesPendientes.value = data.data
      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      console.error('Error fetching lotes pendientes:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtener detalle completo de un lote
   */
  const fetchLoteDetalle = async (loteId) => {
    loadingDetalle.value = true
    error.value = null

    try {
      const endpoint = getBaseEndpoint()
      const response = await fetch(`${endpoint}/${loteId}/detalle`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar detalle del lote')
      }

      loteDetalle.value = data.data
      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      console.error('Error fetching lote detalle:', err)
      return { success: false, error: err.message }
    } finally {
      loadingDetalle.value = false
    }
  }

  /**
   * Aprobar lote
   */
  const aprobarLote = async (loteId, aprobacionData) => {
    loading.value = true
    error.value = null

    try {
      const endpoint = getBaseEndpoint()
      const response = await fetch(`${endpoint}/${loteId}/aprobar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(aprobacionData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al aprobar lote')
      }

      // Actualizar lista de pendientes
      await fetchLotesPendientes()

      return { success: true, data: data.data, message: data.message }

    } catch (err) {
      error.value = err.message
      console.error('Error aprobando lote:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Rechazar lote
   */
  const rechazarLote = async (loteId, rechazoData) => {
    loading.value = true
    error.value = null

    try {
      const endpoint = getBaseEndpoint()
      const response = await fetch(`${endpoint}/${loteId}/rechazar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rechazoData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al rechazar lote')
      }

      // Actualizar lista de pendientes
      await fetchLotesPendientes()

      return { success: true, message: data.message }

    } catch (err) {
      error.value = err.message
      console.error('Error rechazando lote:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Limpiar detalle
   */
  const limpiarDetalle = () => {
    loteDetalle.value = null
  }

  /**
   * Reset completo
   */
  const reset = () => {
    lotesPendientes.value = []
    loteDetalle.value = null
    loading.value = false
    loadingDetalle.value = false
    error.value = null
    tipoDestino.value = null
  }

  return {
    // State
    lotesPendientes,
    loteDetalle,
    loading,
    loadingDetalle,
    error,
    tipoDestino,
    
    // Computed
    totalPendientes,
    lotesPorTipoMineral,
    lotesHoy,
    
    // Actions
    setTipoDestino,
    fetchLotesPendientes,
    fetchLoteDetalle,
    aprobarLote,
    rechazarLote,
    limpiarDetalle,
    reset
  }
})