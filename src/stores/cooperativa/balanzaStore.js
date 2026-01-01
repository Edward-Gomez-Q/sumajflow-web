import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import rutaApi from '@/assets/rutaApi.js'
import { useSessionStore } from '../sessionStore.js'


export const useBalanzaCooperativaStore = defineStore('balanzaCooperativa', () => {
  const balanza = ref(null)
  const loading = ref(false)
  const error = ref(null)
    const sessionStore = useSessionStore()

  const estadoCalibracion = computed(() => {
    if (!balanza.value) return null
    
    const estado = balanza.value.estadoCalibracion
    const dias = balanza.value.diasParaCalibracion
    
    if (estado === 'vencido') {
      return {
        label: 'Calibración Vencida',
        color: 'red',
        icon: 'alert-triangle',
        dias: Math.abs(dias),
        mensaje: `Vencida hace ${Math.abs(dias)} días`
      }
    } else if (estado === 'proximo_vencimiento') {
      return {
        label: 'Próxima Calibración',
        color: 'yellow',
        icon: 'alert-circle',
        dias: dias,
        mensaje: `${dias} días restantes`
      }
    } else {
      return {
        label: 'Calibración Vigente',
        color: 'green',
        icon: 'check-circle',
        dias: dias,
        mensaje: `${dias} días restantes`
      }
    }
  })

  const fetchBalanza = async () => {
    loading.value = true
    error.value = null

    try {
      const token = sessionStore.token;
      const response = await fetch(`${rutaApi}/cooperativa/balanza`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Error al cargar la balanza')
      }

      balanza.value = data.data
    } catch (err) {
      error.value = err.message
      console.error('Error al cargar balanza:', err)
    } finally {
      loading.value = false
    }
  }

  const updateBalanza = async (updateData) => {
    loading.value = true
    error.value = null

        try {
        const token = sessionStore.token;
      const response = await fetch(`${rutaApi}/cooperativa/balanza`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Error al actualizar la balanza')
      }

      balanza.value = data.data
      return { success: true, message: 'Balanza actualizada exitosamente' }
    } catch (err) {
      error.value = err.message
      console.error('Error al actualizar balanza:', err)
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  return {
    balanza,
    loading,
    error,
    estadoCalibracion,
    fetchBalanza,
    updateBalanza
  }
})