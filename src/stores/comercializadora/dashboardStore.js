// src/stores/comercializadora/dashboardStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSessionStore } from '../sessionStore.js'
import rutaApi from '../../assets/rutaApi.js'

export const useDashboardComercializadoraStore = defineStore('comercializadoraDashboard', () => {
  const sessionStore = useSessionStore()

  // State
  const loading = ref(false)
  const error = ref(null)
  const dashboardData = ref(null)
  const ultimaActualizacion = ref(null)

  // Actions
  const fetchDashboard = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/comercializadora/dashboard`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar dashboard')
      }

      if (data.success) {
        dashboardData.value = data.data
        ultimaActualizacion.value = new Date()
        return { success: true, data: data.data }
      } else {
        throw new Error(data.message || 'Error al cargar dashboard')
      }
    } catch (err) {
      console.error('Error fetchDashboard:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const refrescarDashboard = async () => {
    return await fetchDashboard()
  }

  return {
    // State
    loading,
    error,
    dashboardData,
    ultimaActualizacion,

    // Actions
    fetchDashboard,
    refrescarDashboard
  }
})