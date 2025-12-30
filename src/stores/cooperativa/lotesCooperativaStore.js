// src/stores/cooperativa/lotesCooperativaStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSessionStore } from '../sessionStore.js'
import rutaApi from '../../assets/rutaApi.js'

export const useLotesCooperativaStore = defineStore('lotesCooperativa', () => {
  const sessionStore = useSessionStore()
  
  // State
  const lotesPendientes = ref([])
  const loteDetalle = ref(null)
  const transportistasDisponibles = ref([])
  const loading = ref(false)
  const loadingDetalle = ref(false)
  const loadingTransportistas = ref(false)
  const error = ref(null)

  // Computed
  const totalPendientes = computed(() => lotesPendientes.value.length)
  
  const lotesPorTipoOperacion = computed(() => {
    return {
      procesamiento: lotesPendientes.value.filter(l => l.tipoOperacion === 'procesamiento_planta').length,
      ventaDirecta: lotesPendientes.value.filter(l => l.tipoOperacion === 'venta_directa').length
    }
  })

  const lotesPorTipoMineral = computed(() => {
    return {
      complejo: lotesPendientes.value.filter(l => l.tipoMineral === 'complejo').length,
      concentrado: lotesPendientes.value.filter(l => l.tipoMineral === 'concentrado').length
    }
  })

  /**
   * Obtener lotes pendientes de aprobación
   */
  const fetchLotesPendientes = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/cooperativa/lotes/pendientes`, {
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
      const response = await fetch(`${rutaApi}/cooperativa/lotes/${loteId}/detalle`, {
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
   * Obtener transportistas disponibles
   */
  const fetchTransportistasDisponibles = async () => {
    loadingTransportistas.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/cooperativa/lotes/transportistas-disponibles`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar transportistas')
      }

      transportistasDisponibles.value = data.data
      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      console.error('Error fetching transportistas:', err)
      return { success: false, error: err.message }
    } finally {
      loadingTransportistas.value = false
    }
  }

  /**
   * Aprobar lote y asignar transportistas
   */
  const aprobarLote = async (loteId, aprobacionData) => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/cooperativa/lotes/${loteId}/aprobar`, {
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
      const response = await fetch(`${rutaApi}/cooperativa/lotes/${loteId}/rechazar`, {
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
    transportistasDisponibles.value = []
    loading.value = false
    loadingDetalle.value = false
    loadingTransportistas.value = false
    error.value = null
  }

  return {
    // State
    lotesPendientes,
    loteDetalle,
    transportistasDisponibles,
    loading,
    loadingDetalle,
    loadingTransportistas,
    error,
    
    // Computed
    totalPendientes,
    lotesPorTipoOperacion,
    lotesPorTipoMineral,
    
    // Actions
    fetchLotesPendientes,
    fetchLoteDetalle,
    fetchTransportistasDisponibles,
    aprobarLote,
    rechazarLote,
    limpiarDetalle,
    reset
  }
})