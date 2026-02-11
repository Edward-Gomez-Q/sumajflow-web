// src/stores/comercializadora/lotesComercializadoraStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUIStore } from '../uiStore'
import { useSessionStore } from '../sessionStore'
import rutaApi from '../../assets/rutaApi.js'

export const useLotesComercializadoraStore = defineStore('lotesComercializadora', () => {
  const uiStore = useUIStore()
  const sessionStore = useSessionStore()
  
  // State
  const lotes = ref([])
  const loteDetalle = ref(null)
  const loadingDetalle = ref(false)
  const paginacion = ref({
    totalElementos: 0,
    totalPaginas: 0,
    paginaActual: 0,
    elementosPorPagina: 20,
    tieneSiguiente: false,
    tieneAnterior: false
  })
  const filtros = ref({
    estado: null,
    tipoMineral: null,
    cooperativaNombre: null,
    fechaDesde: null,
    fechaHasta: null,
    page: 0,
    size: 20,
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
      l.estado !== 'Vendido a comercializadora' &&
      l.estado !== 'Rechazado'
    )
  )

  const lotesCompletados = computed(() => 
    lotes.value.filter(l => l.estado === 'Vendido a comercializadora' || l.estado === 'Completado')
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

      const response = await fetch(`${rutaApi}/comercializadora/lotes?${params.toString()}`, {
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
      uiStore.showError(err.message, 'Error al Cargar')
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
      tipoMineral: null,
      cooperativaNombre: null,
      fechaDesde: null,
      fechaHasta: null,
      page: 0,
      size: 20,
      sortBy: 'fechaCreacion',
      sortDir: 'desc'
    }
    await fetchLotes()
  }
  const fetchLoteDetalle = async (id) => {
    loadingDetalle.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/comercializadora/lotes/${id}/detalle`, {
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

  const aprobarLote = async (loteId, aprobacionData) => {
    const confirmed = await uiStore.showConfirm(
      '¿Está seguro que desea aprobar este lote?',
      'Confirmar Aprobación'
    )

    if (!confirmed) {
      return { success: false, cancelled: true }
    }

    uiStore.showLoading('Aprobando lote...')
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/comercializadora/lotes/${loteId}/aprobar`, {
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

      await fetchLotes()

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

  const rechazarLote = async (loteId, rechazoData) => {
    const confirmed = await uiStore.showConfirm(
      '¿Está seguro que desea rechazar este lote?',
      'Confirmar Rechazo'
    )

    if (!confirmed) {
      return { success: false, cancelled: true }
    }

    uiStore.showLoading('Rechazando lote...')
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/comercializadora/lotes/${loteId}/rechazar`, {
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

      await fetchLotes()

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

  const limpiarDetalle = () => {
    loteDetalle.value = null
  }

  const reset = () => {
    lotes.value = []
    loteDetalle.value = null
    loadingDetalle.value = false
    paginacion.value = {
      totalElementos: 0,
      totalPaginas: 0,
      paginaActual: 0,
      elementosPorPagina: 20,
      tieneSiguiente: false,
      tieneAnterior: false
    }
    filtros.value = {
      estado: null,
      tipoMineral: null,
      cooperativaNombre: null,
      fechaDesde: null,
      fechaHasta: null,
      page: 0,
      size: 20,
      sortBy: 'fechaCreacion',
      sortDir: 'desc'
    }
    error.value = null
  }

  return {
    // State
    lotes,
    loteDetalle,
    loadingDetalle,
    paginacion,
    filtros,
    error,
    
    // Computed
    lotesPendientes,
    lotesEnProceso,
    lotesCompletados,
    
    // Actions
    fetchLotes,
    fetchLoteDetalle,
    setLoteDetalle,
    cambiarPagina,
    cambiarTamanoPagina,
    aplicarFiltros,
    limpiarFiltros,
    aprobarLote,
    rechazarLote,
    limpiarDetalle,
    reset
  }
})