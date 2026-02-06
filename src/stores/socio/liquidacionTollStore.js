// src/stores/socio/liquidacionTollStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUIStore } from '../uiStore'
import { useSessionStore } from '../sessionStore'
import rutaApi from '../../assets/rutaApi.js'

export const useLiquidacionTollStore = defineStore('liquidacionToll', () => {
  const uiStore = useUIStore()
  const sessionStore = useSessionStore()
  
  const liquidaciones = ref([])
  const liquidacionDetalle = ref(null)
  const estadisticas = ref(null)
  const loadingDetalle = ref(false)
  const loadingPago = ref(false)
  
  const paginacion = ref({
    totalElementos: 0,
    totalPaginas: 0,
    paginaActual: 0,
    elementosPorPagina: 10,
    tieneSiguiente: false,
    tieneAnterior: false
  })
  
  const filtros = ref({
    estado: null,
    fechaDesde: null,
    fechaHasta: null,
    page: 0,
    size: 10
  })
  
  const error = ref(null)

  // ==================== ACTIONS ====================

  /**
   * Listar liquidaciones de Toll del socio
   * GET /socio/liquidaciones/toll
   */
  const fetchLiquidaciones = async (nuevosFiltros = {}) => {
    uiStore.showLoading('Cargando liquidaciones...')
    error.value = null

    if (Object.keys(nuevosFiltros).length > 0) {
      filtros.value = { ...filtros.value, ...nuevosFiltros }
    }

    try {
      const params = new URLSearchParams()
      
      Object.keys(filtros.value).forEach(key => {
        if (filtros.value[key] !== null && filtros.value[key] !== undefined && filtros.value[key] !== '') {
          params.append(key, filtros.value[key])
        }
      })

      const response = await fetch(`${rutaApi}/socio/liquidaciones/toll?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar liquidaciones')
      }

      liquidaciones.value = data.data
      paginacion.value = {
        totalElementos: data.totalElements,
        totalPaginas: data.totalPages,
        paginaActual: data.currentPage,
        elementosPorPagina: data.pageSize,
        tieneSiguiente: data.currentPage < data.totalPages - 1,
        tieneAnterior: data.currentPage > 0
      }

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
   * Obtener detalle de liquidación de Toll
   * GET /socio/liquidaciones/toll/{id}
   */
  const fetchLiquidacionDetalle = async (id) => {
    loadingDetalle.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/socio/liquidaciones/toll/${id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar detalle de la liquidación')
      }

      liquidacionDetalle.value = data.data
      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Cargar Detalle')
      return { success: false, error: err.message }

    } finally {
      loadingDetalle.value = false
    }
  }

  /**
   * Registrar pago de liquidación de Toll
   * POST /socio/liquidaciones/toll/{id}/pagar
   */
  const registrarPago = async (id, pagoData) => {
    loadingPago.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/socio/liquidaciones/toll/${id}/pagar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pagoData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar el pago')
      }

      // Actualizar la liquidación detalle si está cargada
      if (liquidacionDetalle.value?.id === id) {
        liquidacionDetalle.value = data.data
      }

      uiStore.showSuccess(data.message || 'Pago registrado exitosamente', 'Pago Registrado')
      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Registrar Pago')
      return { success: false, error: err.message }

    } finally {
      loadingPago.value = false
    }
  }

  /**
   * Obtener estadísticas de liquidaciones de Toll
   * GET /socio/liquidaciones/toll/estadisticas
   */
  const fetchEstadisticas = async () => {
    try {
      const response = await fetch(`${rutaApi}/socio/liquidaciones/toll/estadisticas`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar estadísticas')
      }

      estadisticas.value = data.data
      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    }
  }

  // ==================== UTILITIES ====================

  const cambiarPagina = async (nuevaPagina) => {
    filtros.value.page = nuevaPagina
    await fetchLiquidaciones()
  }

  const cambiarTamanoPagina = async (nuevoTamano) => {
    filtros.value.size = nuevoTamano
    filtros.value.page = 0
    await fetchLiquidaciones()
  }

  const aplicarFiltros = async (nuevosFiltros) => {
    filtros.value = { ...filtros.value, ...nuevosFiltros, page: 0 }
    await fetchLiquidaciones()
  }

  const limpiarFiltros = async () => {
    filtros.value = {
      estado: null,
      fechaDesde: null,
      fechaHasta: null,
      page: 0,
      size: 10
    }
    await fetchLiquidaciones()
  }

  const limpiarDetalle = () => {
    liquidacionDetalle.value = null
  }

  const reset = () => {
    liquidaciones.value = []
    liquidacionDetalle.value = null
    estadisticas.value = null
    loadingDetalle.value = false
    loadingPago.value = false
    paginacion.value = {
      totalElementos: 0,
      totalPaginas: 0,
      paginaActual: 0,
      elementosPorPagina: 10,
      tieneSiguiente: false,
      tieneAnterior: false
    }
    filtros.value = {
      estado: null,
      fechaDesde: null,
      fechaHasta: null,
      page: 0,
      size: 10
    }
    error.value = null
  }

  // ==================== RETURN ====================

  return {
    // State
    liquidaciones,
    liquidacionDetalle,
    estadisticas,
    loadingDetalle,
    loadingPago,
    paginacion,
    filtros,
    error,
    
    // Actions
    fetchLiquidaciones,
    fetchLiquidacionDetalle,
    registrarPago,
    fetchEstadisticas,
    
    // Utilities
    cambiarPagina,
    cambiarTamanoPagina,
    aplicarFiltros,
    limpiarFiltros,
    limpiarDetalle,
    reset
  }
})