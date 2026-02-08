// src/stores/socio/ventaConcentradoStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUIStore } from '../uiStore'
import { useSessionStore } from '../sessionStore'
import rutaApi from '../../assets/rutaApi.js'

export const useVentaConcentradoStore = defineStore('ventaConcentrado', () => {
  const uiStore = useUIStore()
  const sessionStore = useSessionStore()

  // State
  const ventas = ref([])
  const ventaDetalle = ref(null)
  const estadisticas = ref(null)
  const concentradosDisponibles = ref([])
  const comercializadoras = ref([])

  const loadingDetalle = ref(false)
  const loadingCrear = ref(false)
  const loadingCerrar = ref(false)
  const loadingReporte = ref(false)

  const lotesDisponibles = ref([])
  const loadingCrearLote = ref(false)

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
  const ventasAprobadas = computed(() =>
    ventas.value.filter(v => v.estado === 'aprobado' || v.estado === 'esperando_reportes')
  )
  const ventasEsperandoCierre = computed(() =>
    ventas.value.filter(v => v.estado === 'esperando_cierre_venta')
  )
  const ventasCerradas = computed(() =>
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

  // ==================== ACTIONS - VENTAS ====================

  /**
   * Listar ventas del socio
   * GET /socio/ventas
   */
  const fetchVentas = async (nuevosFiltros = {}) => {
    uiStore.showLoading('Cargando ventas...')
    error.value = null

    if (Object.keys(nuevosFiltros).length > 0) {
      filtros.value = { ...filtros.value, ...nuevosFiltros }
    }

    try {
      const response = await fetch(`${rutaApi}/socio/ventas?${_buildParams()}`, {
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
   * GET /socio/ventas/{id}
   */
  const fetchVentaDetalle = async (id) => {
    loadingDetalle.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/socio/ventas/${id}`, {
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
   * GET /socio/ventas/estadisticas
   */
  const fetchEstadisticas = async () => {
    try {
      const response = await fetch(`${rutaApi}/socio/ventas/estadisticas`, {
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

  // ==================== ACTIONS - CREAR VENTA ====================

  /**
   * Concentrados disponibles para venta
   * GET /socio/ventas/concentrados-disponibles
   */
  const fetchConcentradosDisponibles = async () => {
    try {
      const response = await fetch(`${rutaApi}/socio/ventas/concentrados-disponibles`, {
        headers: _headers()
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Error al cargar concentrados')
      concentradosDisponibles.value = data.data
      return { success: true, data: data.data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    }
  }

  /**
   * Comercializadoras disponibles
   * GET /socio/ventas/comercializadoras
   */
  const fetchComercializadoras = async () => {
    try {
      const response = await fetch(`${rutaApi}/socio/ventas/comercializadoras`, {
        headers: _headers()
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Error al cargar comercializadoras')
      comercializadoras.value = data.data
      return { success: true, data: data.data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    }
  }

  /**
   * Crear venta de concentrado
   * POST /socio/ventas/concentrado
   */
  const crearVentaConcentrado = async (createData) => {
    loadingCrear.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/socio/ventas/concentrado`, {
        method: 'POST',
        headers: _headers(),
        body: JSON.stringify(createData)
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.message || 'Error al crear venta')

      uiStore.showSuccess(data.message || 'Venta creada exitosamente', 'Venta Creada')
      return { success: true, data: data.data }
    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Crear Venta')
      return { success: false, error: err.message }
    } finally {
      loadingCrear.value = false
    }
  }

  // ==================== ACTIONS - REPORTE QUÍMICO ====================

  /**
   * Subir reporte químico
   * POST /socio/ventas/{id}/reporte-quimico
   */
  const subirReporteQuimico = async (liquidacionId, reporteData) => {
    loadingReporte.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/socio/ventas/${liquidacionId}/reporte-quimico`, {
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

  // ==================== ACTIONS - CERRAR VENTA ====================

  /**
   * Cerrar venta con cotización y deducciones
   * POST /socio/ventas/{id}/cerrar
   */
  const cerrarVenta = async (liquidacionId, cierreData) => {
  loadingCerrar.value = true
  error.value = null

  try {
    // Solo enviamos las observaciones (opcional)
    const payload = {
      observaciones: cierreData.observaciones || ''
    }

    const response = await fetch(`${rutaApi}/socio/ventas/${liquidacionId}/cerrar`, {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify(payload)
    })
    const data = await response.json()

    if (!response.ok) throw new Error(data.message || 'Error al cerrar venta')

    if (ventaDetalle.value?.id === liquidacionId) {
      ventaDetalle.value = data.data
    }

    uiStore.showSuccess(data.message || 'Venta cerrada exitosamente', 'Venta Cerrada')
    return { success: true, data: data.data }
  } catch (err) {
    error.value = err.message
    uiStore.showError(err.message, 'Error al Cerrar Venta')
    return { success: false, error: err.message }
  } finally {
    loadingCerrar.value = false
  }
}

const fetchLotesDisponibles = async () => {
  try {
    const response = await fetch(`${rutaApi}/socio/ventas/lotes-disponibles`, {
      headers: _headers()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Error al cargar lotes')
    lotesDisponibles.value = data.data
    return { success: true, data: data.data }
  } catch (err) {
    error.value = err.message
    return { success: false, error: err.message }
  }
}

/**
 * Crear venta de lote complejo
 * POST /socio/ventas/lote-complejo
 */
const crearVentaLote = async (createData) => {
  loadingCrearLote.value = true
  error.value = null

  try {
    const response = await fetch(`${rutaApi}/socio/ventas/lote-complejo`, {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify(createData)
    })
    const data = await response.json()

    if (!response.ok) throw new Error(data.message || 'Error al crear venta de lote')

    uiStore.showSuccess(data.message || 'Venta de lote creada exitosamente', 'Venta Creada')
    return { success: true, data: data.data }
  } catch (err) {
    error.value = err.message
    uiStore.showError(err.message, 'Error al Crear Venta')
    return { success: false, error: err.message }
  } finally {
    loadingCrearLote.value = false
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
    concentradosDisponibles.value = []
    comercializadoras.value = []
    loadingDetalle.value = false
    loadingCrear.value = false
    loadingCerrar.value = false
    lotesDisponibles.value = []
loadingCrearLote.value = false
    loadingReporte.value = false
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
    concentradosDisponibles, comercializadoras,
    loadingDetalle, loadingCrear, loadingCerrar, loadingReporte,
    paginacion, filtros, error,

    lotesDisponibles, loadingCrearLote,
fetchLotesDisponibles, crearVentaLote,
    // Computed
    ventasPendientes, ventasAprobadas, ventasEsperandoCierre, ventasCerradas, ventasPagadas,
    // Actions
    fetchVentas, fetchVentaDetalle, fetchEstadisticas,
    fetchConcentradosDisponibles, fetchComercializadoras,
    crearVentaConcentrado, subirReporteQuimico, cerrarVenta,
    // Utilities
    cambiarPagina, cambiarTamanoPagina, aplicarFiltros, limpiarFiltros, limpiarDetalle, reset
  }
})