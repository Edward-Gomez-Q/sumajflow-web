// src/stores/destino/lotesDestinoStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUIStore } from '../uiStore'
import { useSessionStore } from '../sessionStore'
import rutaApi from '../../assets/rutaApi.js'

export const useLotesDestinoStore = defineStore('lotesDestino', () => {
  const uiStore = useUIStore()
  const sessionStore = useSessionStore()
  
  // State
  const lotesPendientes = ref([])
  const loteDetalle = ref(null)
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
    uiStore.showLoading('Cargando lotes pendientes...')
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
      uiStore.showError(err.message, 'Error al Cargar Lotes Pendientes')
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
   * Aprobar lote
   */
  const aprobarLote = async (loteId, aprobacionData) => {
    const confirmed = await uiStore.showConfirm(
      '¿Estás seguro de aprobar este lote? Esta acción permitirá continuar con el proceso.',
      'Confirmar Aprobación'
    )

    if (!confirmed) {
      return { success: false, cancelled: true }
    }

    uiStore.showLoading('Aprobando lote...')
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

      await fetchLotesPendientes()

      uiStore.showSuccess(
        data.message || 'Lote aprobado exitosamente',
        'Lote Aprobado'
      )

      return { success: true, data: data.data, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Aprobar Lote')
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
      `¿Estás seguro de rechazar este lote? ${rechazoData.motivo ? 'Motivo: ' + rechazoData.motivo : ''}`,
      'Confirmar Rechazo'
    )

    if (!confirmed) {
      return { success: false, cancelled: true }
    }

    uiStore.showLoading('Rechazando lote...')
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

      await fetchLotesPendientes()

      uiStore.showSuccess(
        data.message || 'Lote rechazado exitosamente',
        'Lote Rechazado'
      )

      return { success: true, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Rechazar Lote')
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
    error.value = null
    tipoDestino.value = null
  }

  return {
    // State
    lotesPendientes,
    loteDetalle,
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
    setLoteDetalle,
    aprobarLote,
    rechazarLote,
    limpiarDetalle,
    reset
  }
})