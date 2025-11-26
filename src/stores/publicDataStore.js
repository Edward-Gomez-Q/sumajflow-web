// src/stores/publicDataStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import rutaApi from '../assets/rutaApi.js'

export const usePublicDataStore = defineStore('publicData', () => {
  // State
  const cooperativas = ref([])
  const procesos = ref([])
  const minerales = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const lastFetch = ref(null)

  // Obtener cooperativas desde el backend
  const fetchCooperativas = async (forceRefresh = false) => {
    // Si ya tenemos datos y no es refresh forzado, no hacer la petición
    if (cooperativas.value.length > 0 && !forceRefresh) {
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const API_URL = rutaApi
      const response = await fetch(`${API_URL}/public/cooperativas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener cooperativas')
      }

      if (data.success) {
        cooperativas.value = data.data
        lastFetch.value = new Date().toISOString()
      } else {
        throw new Error(data.message || 'Respuesta no exitosa del servidor')
      }
    } catch (err) {
      error.value = err.message
      console.error('Error al obtener cooperativas:', err)
    } finally {
      isLoading.value = false
    }
  }
  //Obtener procesos desde el backend
  const fetchProcesos = async (forceRefresh = false) => {
    // Si ya tenemos datos y no es refresh forzado, no hacer la petición
    if (procesos.value.length > 0 && !forceRefresh) {
      return
    }
    isLoading.value = true
    error.value = null
    try {
      const API_URL = rutaApi
      const response = await fetch(`${API_URL}/public/procesos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener procesos')
      }
      if (data.success) {
        procesos.value = data.data
        lastFetch.value = new Date().toISOString()
      } else {
        throw new Error(data.message || 'Respuesta no exitosa del servidor')
      }
    } catch (err) {
      error.value = err.message
      console.error('Error al obtener procesos:', err)
    } finally {
      isLoading.value = false
    }
  }
  //Obtener minerales desde el backend
  const fetchMinerales = async (forceRefresh = false) => {
    // Si ya tenemos datos y no es refresh forzado, no hacer la petición
    if (minerales.value.length > 0 && !forceRefresh) {
      return
    }
    isLoading.value = true
    error.value = null
    try {
      const API_URL = rutaApi
      const response = await fetch(`${API_URL}/public/minerales`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener minerales')
      }
      if (data.success) {
        minerales.value = data.data
        lastFetch.value = new Date().toISOString()
      }
      else {
        throw new Error(data.message || 'Respuesta no exitosa del servidor')
      }
    } catch (err) {
      error.value = err.message
      console.error('Error al obtener minerales:', err)
    }
    finally {
      isLoading.value = false
    }
  }

  // Obtener cooperativa por ID
  const getCooperativaById = (id) => {
    return cooperativas.value.find(coop => coop.id === id)
  }

  // Obtener nombre de cooperativa por ID
  const getCooperativaNombre = (id) => {
    const cooperativa = getCooperativaById(id)
    return cooperativa ? cooperativa.razonSocial : ''
  }
  // Obtener proceso por ID
  const getProcesoById = (id) => {
    return procesos.value.find(proc => proc.id === id)
  }
  // Obtener nombre de proceso por ID
  const getProcesoNombre = (id) => {
    const proceso = getProcesoById(id)
    return proceso ? proceso.nombre : ''
  }
  // Obtener mineral por ID
  const getMineralById = (id) => {
    return minerales.value.find(min => min.id === id)
  }
  // Obtener nombre de mineral por ID
  const getMineralNombre = (id) => {
    const mineral = getMineralById(id)
    return mineral ? mineral.nombre : ''
  }


  // Limpiar datos
  const clearData = () => {
    cooperativas.value = []
    procesos.value = []
    minerales.value = []
    error.value = null
    lastFetch.value = null
  }

  return {
    // State
    cooperativas,
    procesos,
    minerales,
    isLoading,
    error,
    lastFetch,

    // Methods
    fetchCooperativas,
    fetchProcesos,
    fetchMinerales,
    getCooperativaById,
    getCooperativaNombre,
    clearData,
  }
})