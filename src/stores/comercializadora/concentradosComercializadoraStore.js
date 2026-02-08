// src/stores/comercializadora/concentradosComercializadoraStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUIStore } from '../uiStore'
import { useSessionStore } from '../sessionStore'
import rutaApi from '../../assets/rutaApi.js'

export const useConcentradosComercializadoraStore = defineStore('concentradosComercializadora', () => {
  const uiStore = useUIStore()
  const sessionStore = useSessionStore()
  
  // State
  const concentrados = ref([])
  const concentradoDetalle = ref(null)
  const estadisticas = ref(null)
  const loadingDetalle = ref(false)
  
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
  
  const concentradosListoVenta = computed(() => 
    concentrados.value.filter(c => c.estado === 'listo_para_venta')
  )

  const concentradosEnVenta = computed(() => 
    concentrados.value.filter(c => c.estado === 'venta_solicitada' || c.estado === 'en_venta')
  )

  const concentradosVendidos = computed(() => 
    concentrados.value.filter(c => c.estado === 'vendido')
  )

  // ==================== ACTIONS ====================

  /**
   * Fetch concentrados aprobados de la comercializadora
   * GET /comercializadora/ventas/concentrados
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

      const response = await fetch(`${rutaApi}/comercializadora/concentrados?${params.toString()}`, {
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
   * GET /comercializadora/ventas/concentrados/{id}
   */
  const fetchConcentradoDetalle = async (id) => {
    loadingDetalle.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/comercializadora/concentrados/${id}`, {
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

  const reset = () => {
    concentrados.value = []
    concentradoDetalle.value = null
    estadisticas.value = null
    loadingDetalle.value = false
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
    estadisticas,
    loadingDetalle,
    paginacion,
    filtros,
    error,
    
    // Computed
    concentradosListoVenta,
    concentradosEnVenta,
    concentradosVendidos,
    
    // Actions
    fetchConcentrados,
    fetchConcentradoDetalle,
    
    // Utilities
    cambiarPagina,
    cambiarTamanoPagina,
    aplicarFiltros,
    limpiarFiltros,
    limpiarDetalle,
    reset
  }
})