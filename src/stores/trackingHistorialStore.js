// src/stores/trackingHistorialStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSessionStore } from './sessionStore.js'
import rutaApi from '../assets/rutaApi.js'

export const useTrackingHistorialStore = defineStore('trackingHistorial', () => {
  const sessionStore = useSessionStore()
  
  const historialPorEstado = ref(null)
  const historialCompleto = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const filtroActual = ref('todos')
  const estadoSeleccionado = ref(null)

  const todosLosPuntos = computed(() => {
    if (!historialPorEstado.value) return []
    
    return historialPorEstado.value.estadosHistorial.flatMap(estado => 
      estado.ubicaciones.map(ubicacion => ({
        ...ubicacion,
        estadoViaje: estado.estadoViaje,
        esOffline: ubicacion.esOffline || false
      }))
    )
  })

  const puntosOffline = computed(() => {
    return todosLosPuntos.value.filter(u => u.esOffline)
  })

  const puntosOnline = computed(() => {
    return todosLosPuntos.value.filter(u => !u.esOffline)
  })

  const estadisticas = computed(() => {
    if (!historialPorEstado.value) return null

    const total = historialPorEstado.value.totalUbicaciones
    const offline = todosLosPuntos.value.filter(p => p.esOffline).length
    const online = total - offline
    
    const porEstado = historialPorEstado.value.estadosHistorial.map(e => ({
      estado: e.estadoViaje,
      cantidad: e.totalUbicaciones,
      distancia: e.distanciaRecorridaKm,
      duracion: e.duracionSegundos,
      offline: e.ubicacionesOffline,
      velocidadPromedio: e.velocidadPromedioKmH,
      velocidadMaxima: e.velocidadMaximaKmH,
      inicioEstado: e.inicioEstado,
      finEstado: e.finEstado
    }))

    return {
      totalUbicaciones: total,
      ubicacionesOffline: offline,
      ubicacionesOnline: online,
      porcentajeOffline: total > 0 ? ((offline / total) * 100).toFixed(1) : 0,
      porEstado
    }
  })

  const puntosFiltrados = computed(() => {
    let puntos = todosLosPuntos.value

    // Filtrar por conexión
    if (filtroActual.value === 'offline') {
      puntos = puntos.filter(p => p.esOffline)
    } else if (filtroActual.value === 'online') {
      puntos = puntos.filter(p => !p.esOffline)
    }

    // Filtrar por estado específico
    if (estadoSeleccionado.value) {
      puntos = puntos.filter(p => p.estadoViaje === estadoSeleccionado.value)
    }

    return puntos
  })

  const estadosDisponibles = computed(() => {
    if (!historialPorEstado.value) return []
    
    return historialPorEstado.value.estadosHistorial.map(e => ({
      estado: e.estadoViaje,
      cantidad: e.totalUbicaciones
    }))
  })

  const fetchHistorialPorEstado = async (asignacionId) => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(
        `${rutaApi}/tracking/asignacion/${asignacionId}/historial-por-estado`,
        {
          headers: {
            'Authorization': `Bearer ${sessionStore.token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar historial por estado')
      }

      historialPorEstado.value = data.data
      console.log('✅ Historial por estado cargado:', historialPorEstado.value)
      
      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      console.error('❌ Error cargando historial:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const fetchHistorialCompleto = async (asignacionId) => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(
        `${rutaApi}/tracking/asignacion/${asignacionId}/historial`,
        {
          headers: {
            'Authorization': `Bearer ${sessionStore.token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar historial completo')
      }

      historialCompleto.value = data.data
      console.log('✅ Historial completo cargado:', historialCompleto.value)
      
      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      console.error('❌ Error cargando historial completo:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const setFiltro = (filtro) => {
    filtroActual.value = filtro
  }

  const setEstadoSeleccionado = (estado) => {
    estadoSeleccionado.value = estado
  }

  const limpiarFiltros = () => {
    filtroActual.value = 'todos'
    estadoSeleccionado.value = null
  }

  const reset = () => {
    historialPorEstado.value = null
    historialCompleto.value = null
    loading.value = false
    error.value = null
    filtroActual.value = 'todos'
    estadoSeleccionado.value = null
  }

  return {
    historialPorEstado,
    historialCompleto,
    loading,
    error,
    filtroActual,
    estadoSeleccionado,
    todosLosPuntos,
    puntosOffline,
    puntosOnline,
    estadisticas,
    puntosFiltrados,
    estadosDisponibles,
    fetchHistorialPorEstado,
    fetchHistorialCompleto,
    setFiltro,
    setEstadoSeleccionado,
    limpiarFiltros,
    reset
  }
})