import { defineStore } from 'pinia'
import { ref } from 'vue'
import rutaApi from '../assets/rutaApi.js'

export const usePublicDataStore = defineStore('publicData', () => {
  // State
  const cooperativas = ref([])
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

  // Obtener cooperativa por ID
  const getCooperativaById = (id) => {
    return cooperativas.value.find(coop => coop.id === id)
  }

  // Obtener nombre de cooperativa por ID
  const getCooperativaNombre = (id) => {
    const cooperativa = getCooperativaById(id)
    return cooperativa ? cooperativa.razonSocial : ''
  }

  // Limpiar datos
  const clearData = () => {
    cooperativas.value = []
    error.value = null
    lastFetch.value = null
  }

  return {
    // State
    cooperativas,
    isLoading,
    error,
    lastFetch,

    // Methods
    fetchCooperativas,
    getCooperativaById,
    getCooperativaNombre,
    clearData,
  }
})