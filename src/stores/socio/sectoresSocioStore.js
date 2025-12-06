// src/stores/socio/sectoresSocioStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSessionStore } from '../sessionStore.js'
import rutaApi from '../../assets/rutaApi.js'

export const useSectoresSocioStore = defineStore('sectoresSocio', () => {
  const sessionStore = useSessionStore()
  
  const sectores = ref([])
  const estadisticas = ref({
    totalSectoresActivos: 0,
    sectoresConMinasActivas: 0,
    sectoresSinMinasActivas: 0,
    misPropiasMinas: 0,
    areaTotalHectareas: 0
  })
  const loading = ref(false)
  const error = ref(null)

  const sectoresActivos = computed(() => 
    sectores.value.filter(s => s.estado === 'activo')
  )

  const fetchSectores = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/socio/sectores`, {
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
      const response = await fetch(`${rutaApi}/socio/sectores/estadisticas`, {
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
      const response = await fetch(`${rutaApi}/socio/sectores/${id}`, {
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

  const reset = () => {
    sectores.value = []
    estadisticas.value = {
      totalSectoresActivos: 0,
      sectoresConMinasActivas: 0,
      sectoresSinMinasActivas: 0,
      misPropiasMinas: 0,
      areaTotalHectareas: 0
    }
    loading.value = false
    error.value = null
  }

  return {
    sectores,
    estadisticas,
    loading,
    error,
    sectoresActivos,
    fetchSectores,
    fetchEstadisticas,
    getSectorById,
    reset
  }
})