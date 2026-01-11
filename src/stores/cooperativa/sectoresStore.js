// src/stores/cooperativa/sectoresStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUIStore } from '../uiStore'
import { useSessionStore } from '../sessionStore'
import rutaApi from '../../assets/rutaApi.js'

export const useSectoresStore = defineStore('sectores', () => {
  const uiStore = useUIStore()
  const sessionStore = useSessionStore()
  
  const sectores = ref([])
  const estadisticas = ref({
    totalSectores: 0,
    sectoresActivos: 0,
    sectoresInactivos: 0,
    areaTotalHectareas: 0
  })
  const error = ref(null)

  // Colores disponibles
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

  const coloresUsados = computed(() => 
    sectores.value.map(s => s.color)
  )

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
    uiStore.showLoading('Cargando sectores...')
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/cooperativa/sectores`, {
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
      uiStore.showError(err.message, 'Error al Cargar Sectores')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  const fetchEstadisticas = async () => {
    try {
      const response = await fetch(`${rutaApi}/cooperativa/sectores/estadisticas`, {
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
    uiStore.showLoading('Cargando sector...')

    try {
      const response = await fetch(`${rutaApi}/cooperativa/sectores/${id}`, {
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
      uiStore.showError(err.message, 'Error al Cargar Sector')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  const createSector = async (sectorData) => {
    uiStore.showLoading('Creando sector...')
    error.value = null

    try {
      // Validar color antes de enviar
      if (!isColorDisponible(sectorData.color)) {
        throw new Error('El color seleccionado ya está en uso por otro sector')
      }

      const response = await fetch(`${rutaApi}/cooperativa/sectores`, {
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

      sectores.value.push(data.data)
      
      await fetchEstadisticas()

      uiStore.showSuccess(
        data.message || 'Sector creado exitosamente',
        'Sector Creado'
      )

      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Crear Sector')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  const updateSector = async (id, sectorData) => {
    uiStore.showLoading('Actualizando sector...')
    error.value = null

    try {
      // Validar color antes de enviar (excluyendo el sector actual)
      if (!isColorDisponible(sectorData.color, id)) {
        throw new Error('El color seleccionado ya está en uso por otro sector')
      }

      const response = await fetch(`${rutaApi}/cooperativa/sectores/${id}`, {
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

      const index = sectores.value.findIndex(s => s.id === id)
      if (index !== -1) {
        sectores.value[index] = data.data
      }

      await fetchEstadisticas()

      uiStore.showSuccess(
        data.message || 'Sector actualizado exitosamente',
        'Sector Actualizado'
      )

      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Actualizar Sector')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  const deleteSector = async (id, sectorNombre = 'este sector') => {
    const confirmed = await uiStore.showDeleteConfirm(sectorNombre)
    
    if (!confirmed) {
      return { success: false, cancelled: true }
    }

    uiStore.showLoading('Eliminando sector...')
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/cooperativa/sectores/${id}`, {
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

      sectores.value = sectores.value.filter(s => s.id !== id)
      
      await fetchEstadisticas()

      uiStore.showSuccess(
        data.message || 'Sector eliminado exitosamente',
        'Sector Eliminado'
      )

      return { success: true }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Eliminar Sector')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
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
    error.value = null
  }

  return {
    // State
    sectores,
    estadisticas,
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