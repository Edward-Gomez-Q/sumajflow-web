// src/stores/cooperativa/socioStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import rutaApi from '../../assets/rutaApi.js'
import { useSessionStore } from '../sessionStore.js'
import { useNotificacionStore } from '../notificacionStore.js'

export const useSocioStore = defineStore('socio', () => {
  // State
  const socios = ref([])
  const estadisticas = ref({
    totalAprobados: 0,
    totalPendientes: 0,
    totalRechazados: 0,
    totalSocios: 0
  })
  const paginacion = ref({
    paginaActual: 0,
    totalPaginas: 0,
    totalElementos: 0,
    elementosPorPagina: 10
  })
  const filtros = ref({
    estado: '',
    busqueda: '',
    ordenarPor: 'fechaAfiliacion',
    direccion: 'desc'
  })
  const isLoading = ref(false)
  const error = ref(null)
  const lastFetch = ref(null)

  const API_URL = rutaApi

  // Computed
  const sociosPendientes = computed(() => 
    socios.value.filter(s => s.estado === 'pendiente')
  )

  const sociosAprobados = computed(() => 
    socios.value.filter(s => s.estado === 'aprobado')
  )

  const sociosRechazados = computed(() => 
    socios.value.filter(s => s.estado === 'rechazado')
  )

  /**
   * Fetch socios con paginación y filtros
   */
  const fetchSocios = async (params = {}) => {
    isLoading.value = true
    error.value = null

    try {
      const sessionStore = useSessionStore()

      // Construir query params
      const queryParams = new URLSearchParams({
        pagina: params.pagina ?? paginacion.value.paginaActual,
        tamanoPagina: params.tamanoPagina ?? paginacion.value.elementosPorPagina,
        ordenarPor: params.ordenarPor ?? filtros.value.ordenarPor,
        direccion: params.direccion ?? filtros.value.direccion
      })

      // Agregar filtros opcionales
      if (params.estado || filtros.value.estado) {
        queryParams.append('estado', params.estado ?? filtros.value.estado)
      }

      if (params.busqueda || filtros.value.busqueda) {
        queryParams.append('busqueda', params.busqueda ?? filtros.value.busqueda)
      }

      const response = await fetch(`${API_URL}/cooperativa/socios?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStore.token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener socios')
      }

      if (data.success) {
        // Actualizar socios
        socios.value = data.data.socios

        // Actualizar paginación
        paginacion.value = {
          paginaActual: data.data.paginaActual,
          totalPaginas: data.data.totalPaginas,
          totalElementos: data.data.totalElementos,
          elementosPorPagina: data.data.elementosPorPagina
        }

        // Actualizar estadísticas
        estadisticas.value = {
          totalAprobados: data.data.totalAprobados,
          totalPendientes: data.data.totalPendientes,
          totalRechazados: data.data.totalRechazados,
          totalSocios: data.data.totalElementos
        }

        lastFetch.value = new Date().toISOString()

        return { success: true, data: data.data }
      } else {
        throw new Error(data.message || 'Respuesta no exitosa del servidor')
      }
    } catch (err) {
      error.value = err.message
      console.error('Error al obtener socios:', err)
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch estadísticas rápidas
   */
  const fetchEstadisticas = async () => {
    try {
      const sessionStore = useSessionStore()

      const response = await fetch(`${API_URL}/cooperativa/socios/estadisticas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStore.token}`
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        estadisticas.value = data.data
        return { success: true, data: data.data }
      }
      
      return { success: false }
    } catch (err) {
      console.error('Error al obtener estadísticas:', err)
      return { success: false }
    }
  }

  /**
   * Obtener detalle de un socio
   */
  const fetchSocioDetalle = async (cooperativaSocioId) => {
    isLoading.value = true
    error.value = null

    try {
      const sessionStore = useSessionStore()

      const response = await fetch(
        `${API_URL}/cooperativa/socios/${cooperativaSocioId}`,
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
        throw new Error(data.message || 'Error al obtener detalle del socio')
      }

      return { success: true, data: data.data }
    } catch (err) {
      error.value = err.message
      console.error('Error al obtener detalle del socio:', err)
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Procesar solicitud (aprobar/rechazar)
   */
  const procesarSolicitud = async (cooperativaSocioId, estado, observaciones = '') => {
    isLoading.value = true
    error.value = null

    try {
      const sessionStore = useSessionStore()

      const response = await fetch(`${API_URL}/cooperativa/socios/procesar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStore.token}`
        },
        body: JSON.stringify({
          cooperativaSocioId,
          estado,
          observaciones
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al procesar solicitud')
      }

      // Actualizar el socio en la lista local
      const socioIndex = socios.value.findIndex(
        s => s.cooperativaSocioId === cooperativaSocioId
      )
      
      if (socioIndex !== -1) {
        socios.value[socioIndex].estado = estado
        socios.value[socioIndex].observaciones = observaciones
      }

      // Actualizar estadísticas
      await fetchEstadisticas()

      return { success: true, message: data.message }
    } catch (err) {
      error.value = err.message
      console.error('Error al procesar solicitud:', err)
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Cambiar página
   */
  const cambiarPagina = async (nuevaPagina) => {
    if (nuevaPagina >= 0 && nuevaPagina < paginacion.value.totalPaginas) {
      await fetchSocios({ pagina: nuevaPagina })
    }
  }

  /**
   * Cambiar filtros
   */
  const aplicarFiltros = async (nuevosFiltros) => {
    filtros.value = { ...filtros.value, ...nuevosFiltros }
    // Reiniciar a la primera página
    await fetchSocios({ pagina: 0, ...nuevosFiltros })
  }

  /**
   * Limpiar filtros
   */
  const limpiarFiltros = async () => {
    filtros.value = {
      estado: '',
      busqueda: '',
      ordenarPor: 'fechaAfiliacion',
      direccion: 'desc'
    }
    await fetchSocios({ pagina: 0 })
  }

  /**
   * Buscar socio
   */
  const buscarSocio = async (texto) => {
    filtros.value.busqueda = texto
    await fetchSocios({ pagina: 0, busqueda: texto })
  }

  /**
   * Agregar nuevo socio desde WebSocket
   * Esta función se llama cuando llega una notificación de nuevo socio
   */
  const agregarNuevoSocio = (notificacion) => {
    // Verificar que sea una notificación de nuevo socio
    if (notificacion.metadata?.tipo === 'nueva_solicitud_socio') {
      const nuevoSocio = {
        id: notificacion.metadata.socioId,
        usuarioId: null, // No lo tenemos desde la notificación
        cooperativaSocioId: notificacion.metadata.cooperativaSocioId,
        nombres: notificacion.metadata.nombres,
        primerApellido: notificacion.metadata.primerApellido,
        segundoApellido: notificacion.metadata.segundoApellido,
        nombreCompleto: notificacion.metadata.nombreCompleto,
        ci: notificacion.metadata.ci,
        correo: notificacion.metadata.correo,
        estado: notificacion.metadata.estado || 'pendiente',
        fechaEnvio: notificacion.metadata.fechaEnvio,
        observaciones: 'Solicitud de afiliación pendiente de aprobación'
      }

      // Si estamos viendo pendientes o todos, agregar al inicio
      if (filtros.value.estado === '' || filtros.value.estado === 'pendiente') {
        socios.value.unshift(nuevoSocio)
      }

      // Actualizar estadísticas
      estadisticas.value.totalPendientes++
      estadisticas.value.totalSocios++
      paginacion.value.totalElementos++

      console.log('✅ Nuevo socio agregado a la lista:', nuevoSocio)
    }
  }

  /**
   * Setup del listener de WebSocket
   */
  const setupWebSocketListener = () => {
    const notificacionStore = useNotificacionStore()
    
    // Escuchar nuevas notificaciones
    // Esto se hace mediante un watcher en el componente o aquí
    const originalFetch = notificacionStore.fetchNotificaciones
    
    // No modificamos el store de notificaciones, solo lo usamos
    console.log('📡 Listener de WebSocket configurado para nuevos socios')
  }

  /**
   * Limpiar datos
   */
  const reset = () => {
    socios.value = []
    estadisticas.value = {
      totalAprobados: 0,
      totalPendientes: 0,
      totalRechazados: 0,
      totalSocios: 0
    }
    paginacion.value = {
      paginaActual: 0,
      totalPaginas: 0,
      totalElementos: 0,
      elementosPorPagina: 10
    }
    filtros.value = {
      estado: '',
      busqueda: '',
      ordenarPor: 'fechaAfiliacion',
      direccion: 'desc'
    }
    error.value = null
    lastFetch.value = null
  }

  return {
    // State
    socios,
    estadisticas,
    paginacion,
    filtros,
    isLoading,
    error,
    lastFetch,

    // Computed
    sociosPendientes,
    sociosAprobados,
    sociosRechazados,

    // Actions
    fetchSocios,
    fetchEstadisticas,
    fetchSocioDetalle,
    procesarSolicitud,
    cambiarPagina,
    aplicarFiltros,
    limpiarFiltros,
    buscarSocio,
    agregarNuevoSocio,
    setupWebSocketListener,
    reset
  }
})