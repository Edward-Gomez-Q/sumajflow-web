// src/stores/socio/minasStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUIStore } from '../uiStore'
import { useSessionStore } from '../sessionStore'
import rutaApi from '../../assets/rutaApi.js'

export const useMinasStore = defineStore('minas', () => {
  const uiStore = useUIStore()
  const sessionStore = useSessionStore()
  
  // State
  const minas = ref([])
  const estadisticas = ref({
    totalMinasActivas: 0,
    totalMinasInactivas: 0,
    minasPorSector: {},
    estadisticasGeograficas: null
  })
  const error = ref(null)

  // Computed
  const minasActivas = computed(() => 
    minas.value.filter(m => m.estado === 'activo')
  )

  const minasInactivas = computed(() => 
    minas.value.filter(m => m.estado === 'inactivo')
  )

  // GET - Fetch minas
  const fetchMinas = async () => {
    uiStore.showLoading('Cargando minas...')
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/socio/minas`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar minas')
      }

      minas.value = data.data
      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Cargar')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  // GET - Fetch estadísticas
  const fetchEstadisticas = async () => {
    try {
      const response = await fetch(`${rutaApi}/socio/minas/estadisticas`, {
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

  // GET - Get mina por ID
  const getMinaById = async (id) => {
    uiStore.showLoading('Cargando mina...')
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/socio/minas/${id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar mina')
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

  // POST - Crear mina
  const createMina = async (minaData) => {
    uiStore.showLoading('Creando mina...')
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/socio/minas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(minaData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear mina')
      }

      minas.value.push(data.data)
      await fetchEstadisticas()

      uiStore.showSuccess(
        data.message || 'Mina creada exitosamente',
        'Creada Exitosamente'
      )

      return { success: true, data: data.data, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Crear')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  // PUT - Actualizar mina
  const updateMina = async (id, minaData) => {
    uiStore.showLoading('Actualizando mina...')
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/socio/minas/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(minaData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar mina')
      }

      const index = minas.value.findIndex(m => m.id === id)
      if (index !== -1) {
        minas.value[index] = data.data
      }

      await fetchEstadisticas()

      uiStore.showSuccess(
        data.message || 'Mina actualizada exitosamente',
        'Actualizada Exitosamente'
      )

      return { success: true, data: data.data, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Actualizar')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  // DELETE - Eliminar mina
  const deleteMina = async (id, minaNombre = 'esta mina') => {
    const confirmed = await uiStore.showDeleteConfirm(minaNombre)
    
    if (!confirmed) {
      return { success: false, cancelled: true }
    }

    uiStore.showLoading('Eliminando mina...')
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/socio/minas/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar mina')
      }

      const index = minas.value.findIndex(m => m.id === id)
      if (index !== -1) {
        minas.value[index].estado = 'inactivo'
      }
      
      await fetchEstadisticas()

      uiStore.showSuccess(
        data.message || 'Mina eliminada exitosamente',
        'Eliminada Exitosamente'
      )

      return { success: true, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Eliminar')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  const reset = () => {
    minas.value = []
    estadisticas.value = {
      totalMinasActivas: 0,
      totalMinasInactivas: 0,
      minasPorSector: {},
      estadisticasGeograficas: null
    }
    error.value = null
  }

  return {
    // State
    minas,
    estadisticas,
    error,

    // Computed
    minasActivas,
    minasInactivas,

    // Actions
    fetchMinas,
    fetchEstadisticas,
    getMinaById,
    createMina,
    updateMina,
    deleteMina,
    reset
  }
})