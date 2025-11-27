// src/stores/sectoresStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSessionStore } from '../sessionStore.js'
import rutaApi from '../../assets/rutaApi.js'

export const useSectoresStore = defineStore('sectores', () => {
  const sessionStore = useSessionStore()
  
  const sectores = ref([])
  const estadisticas = ref({
    totalSectores: 0,
    sectoresActivos: 0,
    sectoresInactivos: 0,
    areaTotalHectareas: 0
  })
  const loading = ref(false)
  const error = ref(null)

  // Colores disponibles (mismos que en el componente)
  const availableColors = [
    { name: 'Azul Oscuro', value: '#1E3A8A' },
    { name: 'Verde', value: '#059669' },
    { name: 'Rojo', value: '#DC2626' },
    { name: 'Naranja', value: '#D97706' },
    { name: 'Morado', value: '#7C3AED' },
    { name: 'Rosa', value: '#DB2777' },
    { name: 'Cyan', value: '#0891B2' },
    { name: 'Lima', value: '#65A30D' },
    { name: 'Índigo', value: '#4F46E5' },
    { name: 'Amarillo', value: '#CA8A04' },
    { name: 'Teal', value: '#0D9488' },
    { name: 'Slate', value: '#475569' }
  ]

  // Computed
  const sectoresActivos = computed(() => 
    sectores.value.filter(s => s.estado === 'activo')
  )

  const sectoresInactivos = computed(() => 
    sectores.value.filter(s => s.estado === 'inactivo')
  )

  // Colores ya usados por otros sectores
  const coloresUsados = computed(() => 
    sectores.value.map(s => s.color)
  )

  // Colores disponibles (no usados)
  const coloresDisponibles = computed(() => 
    availableColors.filter(color => !coloresUsados.value.includes(color.value))
  )

  // Obtener colores disponibles excluyendo un sector específico (para edición)
  const getColoresDisponiblesParaEdicion = (sectorIdExcluir) => {
    const coloresUsadosExcluidos = sectores.value
      .filter(s => s.id !== sectorIdExcluir)
      .map(s => s.color)
    
    return availableColors.filter(color => 
      !coloresUsadosExcluidos.includes(color.value)
    )
  }

  // Validar si un color está disponible
  const isColorDisponible = (color, sectorIdExcluir = null) => {
    const coloresParaValidar = sectorIdExcluir
      ? getColoresDisponiblesParaEdicion(sectorIdExcluir)
      : coloresDisponibles.value
    
    return coloresParaValidar.some(c => c.value === color)
  }

  // Actions
  const fetchSectores = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/api/sectores`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar sectores')
      }

      sectores.value = data.data
      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const fetchEstadisticas = async () => {
    try {
      const response = await fetch(`${rutaApi}/api/sectores/estadisticas`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar estadísticas')
      }

      estadisticas.value = data.data
      return { success: true, data: data.data }

    } catch (err) {
      console.error('Error al cargar estadísticas:', err)
      return { success: false, error: err.message }
    }
  }

  const getSectorById = async (id) => {
    try {
      const response = await fetch(`${rutaApi}/api/sectores/${id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar sector')
      }

      return { success: true, data: data.data }

    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  const createSector = async (sectorData) => {
    loading.value = true
    error.value = null

    try {
      // Validar color antes de enviar
      if (!isColorDisponible(sectorData.color)) {
        throw new Error('El color seleccionado ya está en uso por otro sector')
      }

      const response = await fetch(`${rutaApi}/api/sectores`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sectorData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear sector')
      }

      // Actualizar lista local
      sectores.value.push(data.data)
      
      // Actualizar estadísticas
      await fetchEstadisticas()

      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const updateSector = async (id, sectorData) => {
    loading.value = true
    error.value = null

    try {
      // Validar color antes de enviar (excluyendo el sector actual)
      if (!isColorDisponible(sectorData.color, id)) {
        throw new Error('El color seleccionado ya está en uso por otro sector')
      }

      const response = await fetch(`${rutaApi}/api/sectores/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sectorData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar sector')
      }

      // Actualizar lista local
      const index = sectores.value.findIndex(s => s.id === id)
      if (index !== -1) {
        sectores.value[index] = data.data
      }

      // Actualizar estadísticas
      await fetchEstadisticas()

      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const deleteSector = async (id) => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/api/sectores/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar sector')
      }

      // Actualizar lista local
      sectores.value = sectores.value.filter(s => s.id !== id)
      
      // Actualizar estadísticas
      await fetchEstadisticas()

      return { success: true }

    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const reset = () => {
    sectores.value = []
    estadisticas.value = {
      totalSectores: 0,
      sectoresActivos: 0,
      sectoresInactivos: 0,
      areaTotalHectareas: 0
    }
    loading.value = false
    error.value = null
  }

  return {
    // State
    sectores,
    estadisticas,
    loading,
    error,
    availableColors,

    // Computed
    sectoresActivos,
    sectoresInactivos,
    coloresUsados,
    coloresDisponibles,

    // Actions
    fetchSectores,
    fetchEstadisticas,
    getSectorById,
    createSector,
    updateSector,
    deleteSector,
    getColoresDisponiblesParaEdicion,
    isColorDisponible,
    reset
  }
})