import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUIStore } from '../uiStore'
import { useSessionStore } from '../sessionStore'
import rutaApi from '@/assets/rutaApi.js'

export const useBalanzaCooperativaStore = defineStore('balanzaCooperativa', () => {
  const uiStore = useUIStore()
  const sessionStore = useSessionStore()

  // State
  const balanza = ref(null)
  const error = ref(null)

  // Computed
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

  // GET - Fetch balanza
  const fetchBalanza = async () => {
    uiStore.showLoading('Cargando balanza...')
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/cooperativa/balanza`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar la balanza')
      }

      balanza.value = data.data
      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Cargar')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  // PUT - Actualizar balanza
  const updateBalanza = async (updateData) => {
    uiStore.showLoading('Actualizando balanza...')
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/cooperativa/balanza`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar la balanza')
      }

      balanza.value = data.data

      uiStore.showSuccess(
        data.message || 'Balanza actualizada exitosamente',
        'Actualizado Exitosamente'
      )

      return { success: true, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Actualizar')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  return {
    // State
    balanza,
    error,

    // Computed
    estadoCalibracion,

    // Actions
    fetchBalanza,
    updateBalanza
  }
})