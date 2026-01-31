// src/stores/socio/concentradosSocioStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUIStore } from '../uiStore'
import { useSessionStore } from '../sessionStore'
import rutaApi from '../../assets/rutaApi.js'

export const useConcentradosSocioStore = defineStore('concentradosSocio', () => {
  const uiStore = useUIStore()
  const sessionStore = useSessionStore()
  
  // Concentrados
  const concentrados = ref([])
  const concentradoDetalle = ref(null)
  const estadisticas = ref(null)
  const loadingDetalle = ref(false)
  
  // Kanban (solo lectura)
  const kanban = ref(null)
  const loadingKanban = ref(false)
  
  // Paginación y filtros
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
    mineralPrincipal: null,
    fechaDesde: null,
    fechaHasta: null,
    page: 0,
    size: 10
  })
  
  const error = ref(null)

  // ==================== COMPUTED ====================
  
  const concentradosEnProceso = computed(() => 
    concentrados.value.filter(c => c.estado === 'en_proceso')
  )

  const concentradosEsperandoReporte = computed(() => 
    concentrados.value.filter(c => c.estado === 'esperando_reporte_quimico')
  )

  const concentradosPendientePago = computed(() => 
    concentrados.value.filter(c => 
      c.estado.includes('liquidado') && !c.estado.includes('pagado')
    )
  )

  const concentradosListoVenta = computed(() => 
    concentrados.value.filter(c => c.estado === 'listo_para_venta')
  )

  // ==================== ACTIONS - CONCENTRADOS ====================

  /**
   * Fetch mis concentrados con paginación y filtros
   * GET /socio/concentrados
   */
  const fetchConcentrados = async (nuevosFiltros = {}) => {
    uiStore.showLoading('Cargando concentrados...')
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

      const response = await fetch(`${rutaApi}/socio/concentrados?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar concentrados')
      }

      concentrados.value = data.data
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
   * Obtener detalle completo del concentrado
   * GET /socio/concentrados/{id}
   */
  const fetchConcentradoDetalle = async (id) => {
    loadingDetalle.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/socio/concentrados/${id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar detalle del concentrado')
      }

      concentradoDetalle.value = data.data
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
   * Obtener dashboard de estadísticas personales
   * GET /socio/concentrados/dashboard
   */
  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${rutaApi}/socio/concentrados/dashboard`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar dashboard')
      }

      estadisticas.value = data.data
      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    }
  }

  // ==================== ACTIONS - KANBAN (SOLO LECTURA) ====================

  /**
   * Obtener procesos del Kanban (solo lectura)
   * GET /socio/concentrados/{concentradoId}/procesos
   */
  const fetchProcesos = async (concentradoId) => {
    loadingKanban.value = true
    error.value = null

    try {
      const response = await fetch(
        `${rutaApi}/socio/concentrados/${concentradoId}/procesos`,
        {
          headers: {
            'Authorization': `Bearer ${sessionStore.token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar procesos')
      }

      kanban.value = data.data
      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Cargar Procesos')
      return { success: false, error: err.message }

    } finally {
      loadingKanban.value = false
    }
  }

  // ==================== ACTIONS - LIQUIDACIONES ====================

  /**
   * Solicitar liquidación de servicio al ingenio
   * POST /socio/concentrados/{id}/solicitar-liquidacion-servicio
   */
  const solicitarLiquidacionServicio = async (concentradoId, observaciones) => {
    const confirmed = await uiStore.showConfirm(
      '¿Está seguro que desea solicitar la liquidación del servicio de procesamiento?',
      'Confirmar Solicitud'
    )

    if (!confirmed) {
      return { success: false, cancelled: true }
    }

    uiStore.showLoading('Enviando solicitud...')
    error.value = null

    try {
      const response = await fetch(
        `${rutaApi}/socio/concentrados/${concentradoId}/solicitar-liquidacion-servicio`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionStore.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ observaciones })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al solicitar liquidación')
      }

      await fetchConcentradoDetalle(concentradoId)
      await fetchConcentrados()

      uiStore.showSuccess(
        data.message || 'Solicitud de liquidación enviada exitosamente',
        'Solicitud Enviada'
      )

      return { success: true, data: data.data, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Solicitar')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Solicitar venta a comercializadora
   * POST /socio/concentrados/{id}/solicitar-venta
   */
  const solicitarVenta = async (concentradoId, comercializadoraId, observaciones) => {
    const confirmed = await uiStore.showConfirm(
      '¿Está seguro que desea solicitar la venta de este concentrado?',
      'Confirmar Solicitud de Venta'
    )

    if (!confirmed) {
      return { success: false, cancelled: true }
    }

    uiStore.showLoading('Enviando solicitud...')
    error.value = null

    try {
      const response = await fetch(
        `${rutaApi}/socio/concentrados/${concentradoId}/solicitar-venta`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionStore.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            comercializadoraId,
            observaciones 
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al solicitar venta')
      }

      await fetchConcentradoDetalle(concentradoId)
      await fetchConcentrados()

      uiStore.showSuccess(
        data.message || 'Solicitud de venta enviada exitosamente',
        'Solicitud Enviada'
      )

      return { success: true, data: data.data, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Solicitar Venta')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Ver mis liquidaciones
   * GET /socio/concentrados/liquidaciones
   */
  const fetchLiquidaciones = async () => {
    try {
      const response = await fetch(`${rutaApi}/socio/concentrados/liquidaciones`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar liquidaciones')
      }

      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Cargar Liquidaciones')
      return { success: false, error: err.message }
    }
  }

  // ==================== UTILITIES ====================

  const cambiarPagina = async (nuevaPagina) => {
    filtros.value.page = nuevaPagina
    await fetchConcentrados()
  }

  const cambiarTamanoPagina = async (nuevoTamano) => {
    filtros.value.size = nuevoTamano
    filtros.value.page = 0
    await fetchConcentrados()
  }

  const aplicarFiltros = async (nuevosFiltros) => {
    filtros.value = { ...filtros.value, ...nuevosFiltros, page: 0 }
    await fetchConcentrados()
  }

  const limpiarFiltros = async () => {
    filtros.value = {
      estado: null,
      mineralPrincipal: null,
      fechaDesde: null,
      fechaHasta: null,
      page: 0,
      size: 10
    }
    await fetchConcentrados()
  }

  const limpiarDetalle = () => {
    concentradoDetalle.value = null
  }

  const limpiarKanban = () => {
    kanban.value = null
  }

  const reset = () => {
    concentrados.value = []
    concentradoDetalle.value = null
    kanban.value = null
    estadisticas.value = null
    loadingDetalle.value = false
    loadingKanban.value = false
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
      mineralPrincipal: null,
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
    concentrados,
    concentradoDetalle,
    kanban,
    estadisticas,
    loadingDetalle,
    loadingKanban,
    paginacion,
    filtros,
    error,
    
    // Computed
    concentradosEnProceso,
    concentradosEsperandoReporte,
    concentradosPendientePago,
    concentradosListoVenta,
    
    // Actions - Concentrados
    fetchConcentrados,
    fetchConcentradoDetalle,
    fetchDashboard,
    
    // Actions - Kanban (solo lectura)
    fetchProcesos,
    
    // Actions - Liquidaciones y Ventas
    solicitarLiquidacionServicio,
    solicitarVenta,
    fetchLiquidaciones,
    
    // Utilities
    cambiarPagina,
    cambiarTamanoPagina,
    aplicarFiltros,
    limpiarFiltros,
    limpiarDetalle,
    limpiarKanban,
    reset
  }
})