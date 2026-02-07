// src/stores/comercializadora/ventaComercializadoraStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUIStore } from '../uiStore'
import { useSessionStore } from '../sessionStore'
import rutaApi from '../../assets/rutaApi.js'

export const useVentaComercializadoraStore = defineStore('ventaComercializadora', () => {
  const uiStore = useUIStore()
  const sessionStore = useSessionStore()

  // State
  const ventas = ref([])
  const ventaDetalle = ref(null)
  const estadisticas = ref(null)

  const loadingDetalle = ref(false)
  const loadingAccion = ref(false)
  const loadingReporte = ref(false)
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
    tipoLiquidacion: null,
    fechaDesde: null,
    fechaHasta: null,
    page: 0,
    size: 10
  })

  const error = ref(null)

  // ==================== COMPUTED ====================

  const ventasPendientes = computed(() =>
    ventas.value.filter(v => v.estado === 'pendiente_aprobacion')
  )
  const ventasActivas = computed(() =>
    ventas.value.filter(v =>
      ['aprobado', 'esperando_reportes', 'esperando_cierre_venta'].includes(v.estado)
    )
  )
  const ventasPendientePago = computed(() =>
    ventas.value.filter(v => v.estado === 'cerrado')
  )
  const ventasPagadas = computed(() =>
    ventas.value.filter(v => v.estado === 'pagado')
  )

  // ==================== HELPERS ====================

  const _headers = () => ({
    'Authorization': `Bearer ${sessionStore.token}`,
    'Content-Type': 'application/json'
  })

  const _buildParams = () => {
    const params = new URLSearchParams()
    Object.entries(filtros.value).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') params.append(k, v)
    })
    return params.toString()
  }

  // ==================== ACTIONS - LISTAR ====================

  /**
   * Listar ventas de la comercializadora
   * GET /comercializadora/ventas
   */
  const fetchVentas = async (nuevosFiltros = {}) => {
    uiStore.showLoading('Cargando ventas...')
    error.value = null

    if (Object.keys(nuevosFiltros).length > 0) {
      filtros.value = { ...filtros.value, ...nuevosFiltros }
    }

    try {
      const response = await fetch(`${rutaApi}/comercializadora/ventas?${_buildParams()}`, {
        headers: _headers()
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.message || 'Error al cargar ventas')

      ventas.value = data.data
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
   * Detalle de venta
   * GET /comercializadora/ventas/{id}
   */
  const fetchVentaDetalle = async (id) => {
    loadingDetalle.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/comercializadora/ventas/${id}`, {
        headers: _headers()
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.message || 'Error al cargar detalle')

      ventaDetalle.value = data.data
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
   * Estadísticas
   * GET /comercializadora/ventas/estadisticas
   */
  const fetchEstadisticas = async () => {
    try {
      const response = await fetch(`${rutaApi}/comercializadora/ventas/estadisticas`, {
        headers: _headers()
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Error al cargar estadísticas')
      estadisticas.value = data.data
      return { success: true, data: data.data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    }
  }

  // ==================== ACTIONS - APROBAR / RECHAZAR ====================

  /**
   * Aprobar venta
   * POST /comercializadora/ventas/{id}/aprobar
   */
  const aprobarVenta = async (liquidacionId) => {
    loadingAccion.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/comercializadora/ventas/${liquidacionId}/aprobar`, {
        method: 'POST',
        headers: _headers()
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.message || 'Error al aprobar venta')

      if (ventaDetalle.value?.id === liquidacionId) {
        ventaDetalle.value = data.data
      }

      uiStore.showSuccess(data.message || 'Venta aprobada exitosamente', 'Venta Aprobada')
      return { success: true, data: data.data }
    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Aprobar')
      return { success: false, error: err.message }
    } finally {
      loadingAccion.value = false
    }
  }

  /**
   * Rechazar venta
   * POST /comercializadora/ventas/{id}/rechazar
   */
  const rechazarVenta = async (liquidacionId, motivo) => {
    loadingAccion.value = true
    error.value = null

    try {
      const url = new URL(`${rutaApi}/comercializadora/ventas/${liquidacionId}/rechazar`)
      if (motivo) url.searchParams.set('motivo', motivo)

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: _headers()
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.message || 'Error al rechazar venta')

      if (ventaDetalle.value?.id === liquidacionId) {
        ventaDetalle.value = data.data
      }

      uiStore.showSuccess(data.message || 'Venta rechazada', 'Venta Rechazada')
      return { success: true, data: data.data }
    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Rechazar')
      return { success: false, error: err.message }
    } finally {
      loadingAccion.value = false
    }
  }

  // ==================== ACTIONS - REPORTE QUÍMICO ====================

  /**
   * Subir reporte químico
   * POST /comercializadora/ventas/{id}/reporte-quimico
   */
  const subirReporteQuimico = async (liquidacionId, reporteData) => {
    loadingReporte.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/comercializadora/ventas/${liquidacionId}/reporte-quimico`, {
        method: 'POST',
        headers: _headers(),
        body: JSON.stringify(reporteData)
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.message || 'Error al subir reporte')

      if (ventaDetalle.value?.id === liquidacionId) {
        ventaDetalle.value = data.data
      }

      uiStore.showSuccess(data.message || 'Reporte subido exitosamente', 'Reporte Subido')
      return { success: true, data: data.data }
    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Subir Reporte')
      return { success: false, error: err.message }
    } finally {
      loadingReporte.value = false
    }
  }

  // ==================== ACTIONS - CONFIRMAR PAGO ====================

  /**
   * Confirmar pago
   * POST /comercializadora/ventas/{id}/pagar
   */
  const confirmarPago = async (liquidacionId, pagoData) => {
    loadingPago.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/comercializadora/ventas/${liquidacionId}/pagar`, {
        method: 'POST',
        headers: _headers(),
        body: JSON.stringify(pagoData)
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.message || 'Error al confirmar pago')

      if (ventaDetalle.value?.id === liquidacionId) {
        ventaDetalle.value = data.data
      }

      uiStore.showSuccess(data.message || 'Pago confirmado exitosamente', 'Pago Confirmado')
      return { success: true, data: data.data }
    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Confirmar Pago')
      return { success: false, error: err.message }
    } finally {
      loadingPago.value = false
    }
  }

  // ==================== UTILITIES ====================

  const cambiarPagina = async (nuevaPagina) => {
    filtros.value.page = nuevaPagina
    await fetchVentas()
  }

  const cambiarTamanoPagina = async (nuevoTamano) => {
    filtros.value.size = nuevoTamano
    filtros.value.page = 0
    await fetchVentas()
  }

  const aplicarFiltros = async (nuevosFiltros) => {
    filtros.value = { ...filtros.value, ...nuevosFiltros, page: 0 }
    await fetchVentas()
  }

  const limpiarFiltros = async () => {
    filtros.value = {
      estado: null, tipoLiquidacion: null,
      fechaDesde: null, fechaHasta: null,
      page: 0, size: 10
    }
    await fetchVentas()
  }

  const limpiarDetalle = () => { ventaDetalle.value = null }

  const reset = () => {
    ventas.value = []
    ventaDetalle.value = null
    estadisticas.value = null
    loadingDetalle.value = false
    loadingAccion.value = false
    loadingReporte.value = false
    loadingPago.value = false
    paginacion.value = {
      totalElementos: 0, totalPaginas: 0, paginaActual: 0,
      elementosPorPagina: 10, tieneSiguiente: false, tieneAnterior: false
    }
    filtros.value = {
      estado: null, tipoLiquidacion: null,
      fechaDesde: null, fechaHasta: null, page: 0, size: 10
    }
    error.value = null
  }

  return {
    // State
    ventas, ventaDetalle, estadisticas,
    loadingDetalle, loadingAccion, loadingReporte, loadingPago,
    paginacion, filtros, error,
    // Computed
    ventasPendientes, ventasActivas, ventasPendientePago, ventasPagadas,
    // Actions
    fetchVentas, fetchVentaDetalle, fetchEstadisticas,
    aprobarVenta, rechazarVenta, subirReporteQuimico, confirmarPago,
    // Utilities
    cambiarPagina, cambiarTamanoPagina, aplicarFiltros, limpiarFiltros, limpiarDetalle, reset
  }
})