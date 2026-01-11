// src/stores/cooperativa/transportistaStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUIStore } from '../uiStore'
import { useSessionStore } from '../sessionStore'
import rutaApi from '../../assets/rutaApi.js'

export const useTransportistaStore = defineStore('transportista', () => {
  const uiStore = useUIStore()
  const sessionStore = useSessionStore()

  // State
  const invitaciones = ref([])
  const transportistas = ref([])
  const paginacionInvitaciones = ref({
    paginaActual: 0,
    totalPaginas: 0,
    totalElementos: 0,
    elementosPorPagina: 10
  })
  const paginacion = ref({
    paginaActual: 0,
    totalPaginas: 0,
    totalElementos: 0,
    elementosPorPagina: 10
  })
  const filtrosInvitaciones = ref({
    estado: '',
    busqueda: ''
  })
  const filtros = ref({
    estado: '',
    busqueda: '',
    ordenarPor: 'createdAt',
    direccion: 'desc'
  })
  const error = ref(null)
  const lastFetch = ref(null)

  const API_URL = rutaApi

  // Computed
  const invitacionesPendientes = computed(() => 
    invitaciones.value.filter(i => i.estado === 'pendiente_qr')
  )

  const invitacionesEnProceso = computed(() => 
    invitaciones.value.filter(i => ['codigo_enviado', 'verificado'].includes(i.estado))
  )

  const invitacionesCompletadas = computed(() => 
    invitaciones.value.filter(i => i.estado === 'completado')
  )

  const invitacionesExpiradas = computed(() => 
    invitaciones.value.filter(i => i.estado === 'expirado')
  )

  /**
   * Crear invitación con QR
   */
  const crearInvitacion = async (datosInvitacion) => {
    uiStore.showLoading('Creando invitación...')
    error.value = null

    try {
      const response = await fetch(`${API_URL}/cooperativa/transportistas/invitar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStore.token}`
        },
        body: JSON.stringify(datosInvitacion)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear invitación')
      }

      if (data.success) {
        uiStore.showSuccess(
          'La invitación ha sido creada exitosamente. El transportista podrá escanear el código QR para registrarse.',
          'Invitación Creada'
        )
        return { success: true, data: data.data }
      } else {
        throw new Error(data.message || 'Respuesta no exitosa del servidor')
      }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Crear Invitación')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Listar invitaciones
   */
  const fetchInvitaciones = async (params = {}) => {
    uiStore.showLoading('Cargando invitaciones...')
    error.value = null

    try {
      const queryParams = new URLSearchParams({
        pagina: params.pagina ?? paginacionInvitaciones.value.paginaActual,
        tamanoPagina: params.tamanoPagina ?? paginacionInvitaciones.value.elementosPorPagina
      })

      if (params.estado || filtrosInvitaciones.value.estado) {
        queryParams.append('estado', params.estado ?? filtrosInvitaciones.value.estado)
      }

      if (params.busqueda || filtrosInvitaciones.value.busqueda) {
        queryParams.append('busqueda', params.busqueda ?? filtrosInvitaciones.value.busqueda)
      }

      const response = await fetch(
        `${API_URL}/cooperativa/transportistas/invitaciones?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStore.token}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener invitaciones')
      }

      if (data.success) {
        invitaciones.value = data.data

        paginacionInvitaciones.value = {
          paginaActual: data.pagina,
          totalPaginas: data.totalPaginas,
          totalElementos: data.totalElementos,
          elementosPorPagina: data.data.length
        }

        lastFetch.value = new Date().toISOString()

        return { success: true, data: data.data }
      } else {
        throw new Error(data.message || 'Respuesta no exitosa del servidor')
      }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Cargar Invitaciones')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Aplicar filtros a invitaciones
   */
  const aplicarFiltrosInvitaciones = async (nuevosFiltros) => {
    filtrosInvitaciones.value = { ...filtrosInvitaciones.value, ...nuevosFiltros }
    await fetchInvitaciones({ pagina: 0, ...nuevosFiltros })
  }

  /**
   * Limpiar filtros de invitaciones
   */
  const limpiarFiltrosInvitaciones = async () => {
    filtrosInvitaciones.value = {
      estado: '',
      busqueda: ''
    }
    await fetchInvitaciones({ pagina: 0 })
  }

  /**
   * Fetch transportistas con paginación y filtros
   */
  const fetchTransportistas = async (params = {}) => {
    uiStore.showLoading('Cargando transportistas...')
    error.value = null

    try {
      const queryParams = new URLSearchParams({
        pagina: params.pagina ?? paginacion.value.paginaActual,
        tamanoPagina: params.tamanoPagina ?? paginacion.value.elementosPorPagina,
        ordenarPor: params.ordenarPor ?? filtros.value.ordenarPor,
        direccion: params.direccion ?? filtros.value.direccion
      })

      const estado = params.estado ?? filtros.value.estado ?? ''
      queryParams.append('estado', estado)

      const busqueda = params.busqueda ?? filtros.value.busqueda ?? ''
      queryParams.append('busqueda', busqueda)

      const response = await fetch(
        `${API_URL}/cooperativa/transportistas?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStore.token}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener transportistas')
      }

      if (data.success) {
        transportistas.value = data.data.transportistas

        paginacion.value = {
          paginaActual: data.data.paginaActual,
          totalPaginas: data.data.totalPaginas,
          totalElementos: data.data.totalElementos,
          elementosPorPagina: data.data.elementosPorPagina
        }

        lastFetch.value = new Date().toISOString()

        return { success: true, data: data.data }
      } else {
        throw new Error(data.message || 'Respuesta no exitosa del servidor')
      }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Cargar Transportistas')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Obtener detalle de un transportista
   */
  const fetchTransportistaDetalle = async (transportistaId) => {
    uiStore.showLoading('Cargando detalle del transportista...')
    error.value = null

    try {
      const response = await fetch(
        `${API_URL}/cooperativa/transportistas/${transportistaId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStore.token}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener detalle del transportista')
      }

      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Cargar Detalle')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Cambiar estado de transportista
   */
  const cambiarEstado = async (transportistaId, nuevoEstado, motivo = '') => {
    const accion = nuevoEstado === 'activo' ? 'activar' : 'desactivar'
    const nombreAccion = nuevoEstado === 'activo' ? 'activación' : 'desactivación'
    
    const confirmed = await uiStore.showConfirm(
      `¿Estás seguro de ${accion} este transportista?${motivo ? ` Motivo: ${motivo}` : ''}`,
      `Confirmar ${nombreAccion}`
    )

    if (!confirmed) {
      return { success: false, cancelled: true }
    }

    uiStore.showLoading(`${accion === 'activar' ? 'Activando' : 'Desactivando'} transportista...`)
    error.value = null

    try {
      const response = await fetch(
        `${API_URL}/cooperativa/transportistas/${transportistaId}/estado`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStore.token}`
          },
          body: JSON.stringify({
            nuevoEstado,
            motivo
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cambiar estado')
      }

      const transportistaIndex = transportistas.value.findIndex(
        t => t.id === transportistaId
      )
      
      if (transportistaIndex !== -1) {
        transportistas.value[transportistaIndex].estadoCuenta = nuevoEstado
      }

      await fetchTransportistas({ pagina: paginacion.value.paginaActual })

      uiStore.showSuccess(
        data.message || `El estado del transportista ha sido actualizado a ${nuevoEstado}.`,
        'Estado Actualizado'
      )

      return { success: true, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Cambiar Estado')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Cambiar página de invitaciones
   */
  const cambiarPaginaInvitaciones = async (nuevaPagina) => {
    if (nuevaPagina >= 0 && nuevaPagina < paginacionInvitaciones.value.totalPaginas) {
      await fetchInvitaciones({ pagina: nuevaPagina })
    }
  }

  /**
   * Cambiar página de transportistas
   */
  const cambiarPagina = async (nuevaPagina) => {
    if (nuevaPagina >= 0 && nuevaPagina < paginacion.value.totalPaginas) {
      await fetchTransportistas({ pagina: nuevaPagina })
    }
  }

  /**
   * Aplicar filtros
   */
  const aplicarFiltros = async (nuevosFiltros) => {
    filtros.value = { ...filtros.value, ...nuevosFiltros }
    await fetchTransportistas({ pagina: 0, ...nuevosFiltros })
  }

  /**
   * Limpiar filtros
   */
  const limpiarFiltros = async () => {
    filtros.value = {
      estado: '',
      busqueda: '',
      ordenarPor: 'createdAt',
      direccion: 'desc'
    }
    await fetchTransportistas({ pagina: 0 })
  }

  /**
   * Buscar transportista
   */
  const buscarTransportista = async (texto) => {
    filtros.value.busqueda = texto
    await fetchTransportistas({ pagina: 0, busqueda: texto })
  }

  /**
   * Limpiar datos
   */
  const reset = () => {
    invitaciones.value = []
    transportistas.value = []
    paginacionInvitaciones.value = {
      paginaActual: 0,
      totalPaginas: 0,
      totalElementos: 0,
      elementosPorPagina: 10
    }
    paginacion.value = {
      paginaActual: 0,
      totalPaginas: 0,
      totalElementos: 0,
      elementosPorPagina: 10
    }
    filtrosInvitaciones.value = {
      estado: '',
      busqueda: ''
    }
    filtros.value = {
      estado: '',
      busqueda: '',
      ordenarPor: 'createdAt',
      direccion: 'desc'
    }
    error.value = null
    lastFetch.value = null
  }

  return {
    // State
    invitaciones,
    transportistas,
    paginacionInvitaciones,
    paginacion,
    filtrosInvitaciones,
    filtros,
    error,
    lastFetch,

    // Computed
    invitacionesPendientes,
    invitacionesEnProceso,
    invitacionesCompletadas,
    invitacionesExpiradas,

    // Actions - Invitaciones
    crearInvitacion,
    fetchInvitaciones,
    aplicarFiltrosInvitaciones,
    limpiarFiltrosInvitaciones,
    cambiarPaginaInvitaciones,

    // Actions - Transportistas
    fetchTransportistas,
    fetchTransportistaDetalle,
    cambiarEstado,
    cambiarPagina,
    aplicarFiltros,
    limpiarFiltros,
    buscarTransportista,
    reset
  }
})