// src/stores/cooperativa/transportistaStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import rutaApi from '../../assets/rutaApi.js'
import { useSessionStore } from '../sessionStore.js'

export const useTransportistaStore = defineStore('transportista', () => {
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
    estadoCuenta: '',
    estadoTrazabilidad: '',
    busqueda: '',
    ordenarPor: 'createdAt',
    direccion: 'desc'
  })
  const isLoading = ref(false)
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
    isLoading.value = true
    error.value = null

    try {
      const sessionStore = useSessionStore()

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
        return { success: true, data: data.data }
      } else {
        throw new Error(data.message || 'Respuesta no exitosa del servidor')
      }
    } catch (err) {
      error.value = err.message
      console.error('Error al crear invitación:', err)
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Listar invitaciones
   */
  const fetchInvitaciones = async (params = {}) => {
    isLoading.value = true
    error.value = null

    try {
      const sessionStore = useSessionStore()

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
      console.error('Error al obtener invitaciones:', err)
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
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
    isLoading.value = true
    error.value = null

    try {
      const sessionStore = useSessionStore()

      const queryParams = new URLSearchParams({
        pagina: params.pagina ?? paginacion.value.paginaActual,
        tamanoPagina: params.tamanoPagina ?? paginacion.value.elementosPorPagina,
        ordenarPor: params.ordenarPor ?? filtros.value.ordenarPor,
        direccion: params.direccion ?? filtros.value.direccion
      })

      if (params.estadoCuenta || filtros.value.estadoCuenta) {
        queryParams.append('estadoCuenta', params.estadoCuenta ?? filtros.value.estadoCuenta)
      }

      if (params.estadoTrazabilidad || filtros.value.estadoTrazabilidad) {
        queryParams.append('estadoTrazabilidad', params.estadoTrazabilidad ?? filtros.value.estadoTrazabilidad)
      }

      if (params.busqueda || filtros.value.busqueda) {
        queryParams.append('busqueda', params.busqueda ?? filtros.value.busqueda)
      }

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
      console.error('Error al obtener transportistas:', err)
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Obtener detalle de un transportista
   */
  const fetchTransportistaDetalle = async (transportistaId) => {
    isLoading.value = true
    error.value = null

    try {
      const sessionStore = useSessionStore()

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
      console.error('Error al obtener detalle:', err)
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Cambiar estado de transportista
   */
  const cambiarEstado = async (transportistaId, nuevoEstado, motivo = '') => {
    isLoading.value = true
    error.value = null

    try {
      const sessionStore = useSessionStore()

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

      return { success: true, message: data.message }
    } catch (err) {
      error.value = err.message
      console.error('Error al cambiar estado:', err)
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
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
      estadoCuenta: '',
      estadoTrazabilidad: '',
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
      estadoCuenta: '',
      estadoTrazabilidad: '',
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
    isLoading,
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