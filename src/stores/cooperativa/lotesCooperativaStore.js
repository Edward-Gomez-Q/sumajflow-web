// src/stores/cooperativa/lotesCooperativaStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUIStore } from '../uiStore'
import { useSessionStore } from '../sessionStore'
import rutaApi from '../../assets/rutaApi.js'

export const useLotesCooperativaStore = defineStore('lotesCooperativa', () => {
  const uiStore = useUIStore()
  const sessionStore = useSessionStore()
  
  // State
  const lotesPendientes = ref([])
  const loteDetalle = ref(null)
  const transportistasDisponibles = ref([])
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
    uiStore.showLoading('Cargando lotes pendientes...')
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
      uiStore.showError(err.message, 'Error al Cargar')
      return { success: false, error: err.message }
    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Obtener detalle completo de un lote
   */
  const fetchLoteDetalle = async (loteId) => {
    uiStore.showLoading('Cargando detalle del lote...')
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/cooperativa/lotes/pendientes/${loteId}/detalle`, {
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
      uiStore.showError(err.message, 'Error al Cargar Detalle')
      return { success: false, error: err.message }
    } finally {
      uiStore.hideLoading()
    }
  }

  const setLoteDetalle = (detalle) => {
    loteDetalle.value = detalle
  }

  /**
   * Obtener transportistas disponibles
   */
  const fetchTransportistasDisponibles = async () => {
    uiStore.showLoading('Cargando transportistas disponibles...')
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
      uiStore.showError(err.message, 'Error al Cargar')
      return { success: false, error: err.message }
    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Aprobar lote y asignar transportistas
   */
  const aprobarLote = async (loteId, aprobacionData) => {
    const confirmed = await uiStore.showConfirm(
      'Esta seguro que desea aprobar este lote?',
      'Confirmar Aprobacion'
    )

    if (!confirmed) {
      return { success: false, cancelled: true }
    }

    uiStore.showLoading('Aprobando lote...')
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

      uiStore.showSuccess(
        data.message || 'Lote aprobado exitosamente',
        'Aprobado Exitosamente'
      )

      return { success: true, data: data.data, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Aprobar')
      return { success: false, error: err.message }
    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Rechazar lote
   */
  const rechazarLote = async (loteId, rechazoData) => {
    const confirmed = await uiStore.showConfirm(
      'Esta seguro que desea rechazar este lote?',
      'Confirmar Rechazo'
    )

    if (!confirmed) {
      return { success: false, cancelled: true }
    }

    uiStore.showLoading('Rechazando lote...')
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

      uiStore.showSuccess(
        data.message || 'Lote rechazado exitosamente',
        'Rechazado Exitosamente'
      )

      return { success: true, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Rechazar')
      return { success: false, error: err.message }
    } finally {
      uiStore.hideLoading()
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
    error.value = null
  }

  return {
    // State
    lotesPendientes,
    loteDetalle,
    transportistasDisponibles,
    error,
    
    // Computed
    totalPendientes,
    lotesPorTipoOperacion,
    lotesPorTipoMineral,
    
    // Actions
    fetchLotesPendientes,
    fetchLoteDetalle,
    setLoteDetalle,
    fetchTransportistasDisponibles,
    aprobarLote,
    rechazarLote,
    limpiarDetalle,
    reset
  }
})