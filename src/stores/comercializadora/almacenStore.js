// src/stores/comercializadora/almacenStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUIStore } from '../uiStore'
import { useSessionStore } from '../sessionStore'
import rutaApi from '@/assets/rutaApi.js'

export const useAlmacenComercializadoraStore = defineStore('almacenComercializadora', () => {
  const uiStore = useUIStore()
  const sessionStore = useSessionStore()

  // State
  const almacen = ref(null)
  const error = ref(null)

  // Computed
  const estadoCapacidad = computed(() => {
    if (!almacen.value) return null
    
    const estado = almacen.value.estadoCapacidad
    const porcentaje = almacen.value.porcentajeOcupacion
    
    if (estado === 'critico') {
      return {
        label: 'Capacidad Crítica',
        color: 'red',
        icon: 'alert-triangle',
        porcentaje: porcentaje,
        mensaje: `${porcentaje.toFixed(1)}% ocupado - Capacidad crítica`
      }
    } else if (estado === 'lleno') {
      return {
        label: 'Casi Lleno',
        color: 'orange',
        icon: 'alert-circle',
        porcentaje: porcentaje,
        mensaje: `${porcentaje.toFixed(1)}% ocupado - Espacio limitado`
      }
    } else if (estado === 'medio') {
      return {
        label: 'Ocupación Media',
        color: 'yellow',
        icon: 'info',
        porcentaje: porcentaje,
        mensaje: `${porcentaje.toFixed(1)}% ocupado`
      }
    } else {
      return {
        label: 'Disponible',
        color: 'green',
        icon: 'check-circle',
        porcentaje: porcentaje,
        mensaje: `${porcentaje.toFixed(1)}% ocupado - Amplia disponibilidad`
      }
    }
  })

  // GET - Fetch almacén
  const fetchAlmacen = async () => {
    uiStore.showLoading('Cargando almacen...')
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/comercializadora/almacen`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar el almacén')
      }

      almacen.value = data.data
      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Cargar')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  // PUT - Actualizar almacén
  const updateAlmacen = async (updateData) => {
    uiStore.showLoading('Actualizando almacen...')
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/comercializadora/almacen`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar el almacén')
      }

      almacen.value = data.data

      uiStore.showSuccess(
        data.message || 'Almacen actualizado exitosamente',
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
    almacen,
    error,

    // Computed
    estadoCapacidad,

    // Actions
    fetchAlmacen,
    updateAlmacen
  }
})