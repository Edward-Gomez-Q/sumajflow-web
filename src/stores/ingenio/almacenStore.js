// src/stores/ingenio/almacenStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSessionStore } from '../sessionStore.js'
import rutaApi from '@/assets/rutaApi.js'

export const useAlmacenIngenioStore = defineStore('almacenIngenio', () => {
  const almacen = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const sessionStore = useSessionStore()

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

  const fetchAlmacen = async () => {
    loading.value = true
    error.value = null

    try {
      const token = sessionStore.token
      const response = await fetch(`${rutaApi}/ingenio/almacen`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Error al cargar el almacén')
      }

      almacen.value = data.data
    } catch (err) {
      error.value = err.message
      console.error('Error al cargar almacén:', err)
    } finally {
      loading.value = false
    }
  }

  const updateAlmacen = async (updateData) => {
    loading.value = true
    error.value = null

    try {
      const token = sessionStore.token
      const response = await fetch(`${rutaApi}/ingenio/almacen`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Error al actualizar el almacén')
      }

      almacen.value = data.data
      return { success: true, message: 'Almacén actualizado exitosamente' }
    } catch (err) {
      error.value = err.message
      console.error('Error al actualizar almacén:', err)
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  return {
    almacen,
    loading,
    error,
    estadoCapacidad,
    fetchAlmacen,
    updateAlmacen
  }
})