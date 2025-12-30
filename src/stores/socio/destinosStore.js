// src/stores/socio/destinosStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSessionStore } from '../sessionStore.js'
import rutaApi from '../../assets/rutaApi.js'

export const useDestinosStore = defineStore('destinos', () => {
  const sessionStore = useSessionStore()
  
  const ingenios = ref([])
  const comercializadoras = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchIngenios = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/socio/destinos/ingenios`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar ingenios')
      }

      ingenios.value = data.data
      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const fetchComercializadoras = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/socio/destinos/comercializadoras`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar comercializadoras')
      }

      comercializadoras.value = data.data
      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const reset = () => {
    ingenios.value = []
    comercializadoras.value = []
    loading.value = false
    error.value = null
  }

  return {
    ingenios,
    comercializadoras,
    loading,
    error,
    fetchIngenios,
    fetchComercializadoras,
    reset
  }
})