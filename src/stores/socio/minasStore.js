// src/stores/socio/minasStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSessionStore } from '../sessionStore.js'
import rutaApi from '../../assets/rutaApi.js'

export const useMinasStore = defineStore('minas', () => {
  const sessionStore = useSessionStore()
  
  const minas = ref([])
  const estadisticas = ref({
    totalMinasActivas: 0,
    totalMinasInactivas: 0,
    minasPorSector: {},
    estadisticasGeograficas: null
  })
  const loading = ref(false)
  const error = ref(null)

  const minasActivas = computed(() => 
    minas.value.filter(m => m.estado === 'activo')
  )

  const minasInactivas = computed(() => 
    minas.value.filter(m => m.estado === 'inactivo')
  )

  const fetchMinas = async () => {
    loading.value = true
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
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

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

  const getMinaById = async (id) => {
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
      return { success: false, error: err.message }
    }
  }

  const createMina = async (minaData) => {
    loading.value = true
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

      return { success: true, data: data.data, message: data.message }

    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const updateMina = async (id, minaData) => {
    loading.value = true
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

      return { success: true, data: data.data, message: data.message }

    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const deleteMina = async (id) => {
    loading.value = true
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

      return { success: true, message: data.message }

    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
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
    loading.value = false
    error.value = null
  }

  return {
    minas,
    estadisticas,
    loading,
    error,
    minasActivas,
    minasInactivas,
    fetchMinas,
    fetchEstadisticas,
    getMinaById,
    createMina,
    updateMina,
    deleteMina,
    reset
  }
})