// src/stores/cooperativa/lotesCooperativaGeneralStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUIStore } from '../uiStore'
import { useSessionStore } from '../sessionStore'
import rutaApi from '../../assets/rutaApi.js'

export const useLotesCooperativaGeneralStore = defineStore('lotesCooperativaGeneral', () => {
  const uiStore = useUIStore()
  const sessionStore = useSessionStore()
  
  // State
  const lotes = ref([])
  const loteDetalle = ref(null)
  const loadingDetalle = ref(false) // 🆕 Agregado
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

  const fetchLotes = async (nuevosFiltros = {}) => {
    uiStore.showLoading('Cargando lotes...')
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
      uiStore.showError(err.message, 'Error al Cargar Lotes')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  const cambiarPagina = async (nuevaPagina) => {
    filtros.value.page = nuevaPagina
    await fetchLotes()
  }

  const cambiarTamanoPagina = async (nuevoTamano) => {
    filtros.value.size = nuevoTamano
    filtros.value.page = 0
    await fetchLotes()
  }

  const aplicarFiltros = async (nuevosFiltros) => {
    filtros.value = { ...filtros.value, ...nuevosFiltros, page: 0 }
    await fetchLotes()
  }

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
   * 🆕 Modificado para usar loadingDetalle
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
      uiStore.showError(err.message, 'Error al Cargar Detalle')
      return { success: false, error: err.message }

    } finally {
      loadingDetalle.value = false
    }
  }

  const setLoteDetalle = (detalle) => {
    loteDetalle.value = detalle
  }

  const limpiarDetalle = () => {
    loteDetalle.value = null
  }

  const reset = () => {
    lotes.value = []
    loteDetalle.value = null
    loadingDetalle.value = false // 🆕
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
    error.value = null
  }

  return {
    // State
    lotes,
    loteDetalle,
    loadingDetalle, // 🆕
    paginacion,
    filtros,
    error,
    
    // Computed
    lotesPendientes,
    lotesEnProceso,
    lotesCompletados,
    lotesRechazados,
    
    // Actions
    fetchLotes,
    fetchLoteDetalle,
    setLoteDetalle,
    cambiarPagina,

    cambiarTamanoPagina,
    aplicarFiltros,
    limpiarFiltros,
    limpiarDetalle,
    reset
  }
})