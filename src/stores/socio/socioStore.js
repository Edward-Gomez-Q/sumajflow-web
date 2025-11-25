// src/stores/socioStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import rutaApi from '../../assets/rutaApi.js'

export const useSocioStore = defineStore('socio', () => {
  // State
  const estadoSocio = ref(null)
  const loading = ref(false)
  const error = ref(null)
  

  const minas = ref([])
  const lotes = ref([])
  const liquidaciones = ref([])

  // Computed
  const estaAprobado = computed(() => {
    return estadoSocio.value?.data?.estado === 'aprobado'
  })

  const estaPendiente = computed(() => {
    return estadoSocio.value?.data?.estado === 'pendiente'
  })

  const estaRechazado = computed(() => {
    return estadoSocio.value?.data?.estado === 'rechazado'
  })

  const informacionCooperativa = computed(() => {
    return estadoSocio.value?.data?.cooperativa || null
  })

  const mensajeEstado = computed(() => {
    return estadoSocio.value?.data?.mensaje || ''
  })

  const solicitudId = computed(() => {
    return estadoSocio.value?.data?.solicitudId || ''
  })

  const fechaEnvio = computed(() => {
    return estadoSocio.value?.data?.fechaEnvio || null
  })

  const fechaAfiliacion = computed(() => {
    return estadoSocio.value?.data?.fechaAfiliacion || null
  })

  const socioId = computed(() => {
    return estadoSocio.value?.data?.socioId || null
  })

  // Actions
  const obtenerEstadoSocio = async () => {
    loading.value = true
    error.value = null

    try {
      const API_URL = rutaApi
      const token = localStorage.getItem('token')

      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const response = await fetch(`${API_URL}/socio/estado`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener estado del socio')
      }

      if (data.success) {
        estadoSocio.value = data
        return { success: true, data }
      } else {
        throw new Error(data.message || 'Error al obtener estado')
      }
    } catch (err) {
      error.value = err.message || 'Error al obtener estado del socio'
      console.error('Error al obtener estado del socio:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const verificarAprobacion = async () => {
    try {
      const API_URL = rutaApi
      const token = localStorage.getItem('token')

      if (!token) {
        return false
      }

      const response = await fetch(`${API_URL}/socio/verificar-aprobacion`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        return data.aprobado
      }
      
      return false
    } catch (err) {
      console.error('Error al verificar aprobación:', err)
      return false
    }
  }

  // Métodos para funcionalidades futuras del socio
  const obtenerMinas = async () => {
    loading.value = true
    error.value = null

    try {
      const API_URL = rutaApi
      const token = localStorage.getItem('token')

      const response = await fetch(`${API_URL}/socio/minas`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener minas')
      }

      if (data.success) {
        minas.value = data.data
        return { success: true, data: data.data }
      }
    } catch (err) {
      error.value = err.message
      console.error('Error al obtener minas:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const obtenerLotes = async () => {
    loading.value = true
    error.value = null

    try {
      const API_URL = rutaApi
      const token = localStorage.getItem('token')

      const response = await fetch(`${API_URL}/socio/lotes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener lotes')
      }

      if (data.success) {
        lotes.value = data.data
        return { success: true, data: data.data }
      }
    } catch (err) {
      error.value = err.message
      console.error('Error al obtener lotes:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const obtenerLiquidaciones = async () => {
    loading.value = true
    error.value = null

    try {
      const API_URL = rutaApi
      const token = localStorage.getItem('token')

      const response = await fetch(`${API_URL}/socio/liquidaciones`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener liquidaciones')
      }

      if (data.success) {
        liquidaciones.value = data.data
        return { success: true, data: data.data }
      }
    } catch (err) {
      error.value = err.message
      console.error('Error al obtener liquidaciones:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const crearMina = async (minaData) => {
    loading.value = true
    error.value = null

    try {
      const API_URL = rutaApi
      const token = localStorage.getItem('token')

      const response = await fetch(`${API_URL}/socio/minas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(minaData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear mina')
      }

      if (data.success) {
        // Agregar la nueva mina al array local
        minas.value.push(data.data)
        return { success: true, data: data.data }
      }
    } catch (err) {
      error.value = err.message
      console.error('Error al crear mina:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const crearLote = async (loteData) => {
    loading.value = true
    error.value = null

    try {
      const API_URL = rutaApi
      const token = localStorage.getItem('token')

      const response = await fetch(`${API_URL}/socio/lotes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loteData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear lote')
      }

      if (data.success) {
        lotes.value.push(data.data)
        return { success: true, data: data.data }
      }
    } catch (err) {
      error.value = err.message
      console.error('Error al crear lote:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Reset
  const resetEstado = () => {
    estadoSocio.value = null
    minas.value = []
    lotes.value = []
    liquidaciones.value = []
    loading.value = false
    error.value = null
  }

  const resetError = () => {
    error.value = null
  }

  return {
    // State
    estadoSocio,
    loading,
    error,
    minas,
    lotes,
    liquidaciones,
    
    // Computed
    estaAprobado,
    estaPendiente,
    estaRechazado,
    informacionCooperativa,
    mensajeEstado,
    solicitudId,
    fechaEnvio,
    fechaAfiliacion,
    socioId,
    
    // Actions
    obtenerEstadoSocio,
    verificarAprobacion,
    obtenerMinas,
    obtenerLotes,
    obtenerLiquidaciones,
    crearMina,
    crearLote,
    resetEstado,
    resetError
  }
})