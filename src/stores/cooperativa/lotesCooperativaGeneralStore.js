// src/stores/cooperativa/lotesCooperativaGeneralStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSessionStore } from '../sessionStore.js'
import rutaApi from '../../assets/rutaApi.js'

export const useLotesCooperativaGeneralStore = defineStore('lotesCooperativaGeneral', () => {
  const sessionStore = useSessionStore()
  
  // State
  const lotes = ref([])
  const loteDetalle = ref(null)
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
    tipoOperacion: null,
    tipoMineral: null,
    fechaDesde: null,
    fechaHasta: null,
    socioId: null,
    minaId: null,
    sectorId: null,
    page: 0,
    size: 10,
    sortBy: 'fechaCreacion',
    sortDir: 'desc'
  })
  const loading = ref(false)
  const loadingDetalle = ref(false)
  const error = ref(null)

  // Computed
  const lotesPendientes = computed(() => 
    lotes.value.filter(l => l.estado.includes('Pendiente'))
  )

  const lotesEnProceso = computed(() => 
    lotes.value.filter(l => 
      !l.estado.includes('Pendiente') && 
      l.estado !== 'Completado' &&
      l.estado !== 'Rechazado'
    )
  )

  const lotesCompletados = computed(() => 
    lotes.value.filter(l => l.estado === 'Completado')
  )

  const lotesRechazados = computed(() => 
    lotes.value.filter(l => l.estado === 'Rechazado')
  )

  /**
   * Fetch lotes con paginación y filtros
   */
  const fetchLotes = async (nuevosFiltros = {}) => {
    loading.value = true
    error.value = null

    // Actualizar filtros si se pasaron nuevos
    if (Object.keys(nuevosFiltros).length > 0) {
      filtros.value = { ...filtros.value, ...nuevosFiltros }
    }

    try {
      // Construir query params
      const params = new URLSearchParams()
      
      Object.keys(filtros.value).forEach(key => {
        if (filtros.value[key] !== null && filtros.value[key] !== undefined && filtros.value[key] !== '') {
          params.append(key, filtros.value[key])
        }
      })

      const response = await fetch(`${rutaApi}/cooperativa/lotes?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar lotes')
      }

      lotes.value = data.data.lotes
      paginacion.value = {
        totalElementos: data.data.totalElements,
        totalPaginas: data.data.totalPages,
        paginaActual: data.data.currentPage,
        elementosPorPagina: data.data.pageSize,
        tieneSiguiente: data.data.hasNext,
        tieneAnterior: data.data.hasPrevious
      }

      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      console.error('Error fetching lotes cooperativa:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Cambiar página
   */
  const cambiarPagina = async (nuevaPagina) => {
    filtros.value.page = nuevaPagina
    await fetchLotes()
  }

  /**
   * Cambiar tamaño de página
   */
  const cambiarTamanoPagina = async (nuevoTamano) => {
    filtros.value.size = nuevoTamano
    filtros.value.page = 0
    await fetchLotes()
  }

  /**
   * Aplicar filtros
   */
  const aplicarFiltros = async (nuevosFiltros) => {
    filtros.value = { ...filtros.value, ...nuevosFiltros, page: 0 }
    await fetchLotes()
  }

  /**
   * Limpiar filtros
   */
  const limpiarFiltros = async () => {
    filtros.value = {
      estado: null,
      tipoOperacion: null,
      tipoMineral: null,
      fechaDesde: null,
      fechaHasta: null,
      socioId: null,
      minaId: null,
      sectorId: null,
      page: 0,
      size: 10,
      sortBy: 'fechaCreacion',
      sortDir: 'desc'
    }
    await fetchLotes()
  }

    /**
   * Obtener detalle completo del lote
   */
  const fetchLoteDetalle = async (id) => {
    loadingDetalle.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/cooperativa/lotes/${id}/detalle`, {
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
   * Limpiar detalle
   */
  const limpiarDetalle = () => {
    loteDetalle.value = null
  }

  /**
   * Reset completo
   */
  const reset = () => {
    lotes.value = []
    loteDetalle.value = null
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
      tipoOperacion: null,
      tipoMineral: null,
      fechaDesde: null,
      fechaHasta: null,
      socioId: null,
      minaId: null,
      sectorId: null,
      page: 0,
      size: 10,
      sortBy: 'fechaCreacion',
      sortDir: 'desc'
    }
    loading.value = false
    loadingDetalle.value = false
    error.value = null
  }

  return {
    // State
    lotes,
    loteDetalle,
    paginacion,
    filtros,
    loading,
    loadingDetalle,
    error,
    
    // Computed
    lotesPendientes,
    lotesEnProceso,
    lotesCompletados,
    lotesRechazados,
    
    // Actions
    fetchLotes,
    fetchLoteDetalle,
    cambiarPagina,
    cambiarTamanoPagina,
    aplicarFiltros,
    limpiarFiltros,
    limpiarDetalle,
    reset
  }
})