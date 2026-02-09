// src/stores/comercializadora/tablaPreciosStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUIStore } from '../uiStore'
import { useSessionStore } from '../sessionStore'
import rutaApi from '../../assets/rutaApi.js'

export const useTablaPreciosStore = defineStore('tablaPrecios', () => {
  const uiStore = useUIStore()
  const sessionStore = useSessionStore()

  // State
  const precios = ref([])
  const preciosAgrupados = ref({})
  const validacion = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Computed
  const tieneConfiguracionCompleta = computed(() => 
    validacion.value?.configuracionCompleta === true
  )

  const mineralesFaltantes = computed(() => 
    validacion.value?.mineralesFaltantes || []
  )

  const totalRangos = computed(() => ({
    Pb: validacion.value?.totalRangosPb || 0,
    Zn: validacion.value?.totalRangosZn || 0,
    Ag: validacion.value?.totalRangosAg || 0
  }))

  // Headers
  const _headers = () => ({
    'Authorization': `Bearer ${sessionStore.token}`,
    'Content-Type': 'application/json'
  })

  // ==================== CRUD ====================

  const fetchPrecios = async (mineral = null, activo = true) => {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      if (mineral) params.append('mineral', mineral)
      if (activo !== null) params.append('activo', activo)

      const response = await fetch(`${rutaApi}/comercializadora/tabla-precios?${params}`, {
        headers: _headers()
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.message || 'Error al cargar precios')

      precios.value = data.data
      return { success: true, data: data.data }
    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Cargar')
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const fetchPreciosAgrupados = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/comercializadora/tabla-precios/agrupados`, {
        headers: _headers()
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.message || 'Error al cargar precios')

      preciosAgrupados.value = data.data
      return { success: true, data: data.data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const crear = async (precioData) => {
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/comercializadora/tabla-precios`, {
        method: 'POST',
        headers: _headers(),
        body: JSON.stringify(precioData)
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.message || 'Error al crear rango')

      uiStore.showSuccess(data.message || 'Rango creado exitosamente', 'Éxito')
      await fetchPreciosAgrupados()
      await validarConfiguracion()
      return { success: true, data: data.data }
    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Crear')
      return { success: false, error: err.message }
    }
  }

  const actualizar = async (id, precioData) => {
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/comercializadora/tabla-precios/${id}`, {
        method: 'PUT',
        headers: _headers(),
        body: JSON.stringify(precioData)
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.message || 'Error al actualizar')

      uiStore.showSuccess(data.message || 'Rango actualizado exitosamente', 'Éxito')
      await fetchPreciosAgrupados()
      await validarConfiguracion()
      return { success: true, data: data.data }
    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Actualizar')
      return { success: false, error: err.message }
    }
  }

  const eliminar = async (id) => {
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/comercializadora/tabla-precios/${id}`, {
        method: 'DELETE',
        headers: _headers()
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.message || 'Error al eliminar')

      uiStore.showSuccess(data.message || 'Rango eliminado exitosamente', 'Éxito')
      await fetchPreciosAgrupados()
      await validarConfiguracion()
      return { success: true }
    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Eliminar')
      return { success: false, error: err.message }
    }
  }

  const desactivar = async (id) => {
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/comercializadora/tabla-precios/${id}/desactivar`, {
        method: 'POST',
        headers: _headers()
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.message || 'Error al desactivar')

      uiStore.showSuccess(data.message || 'Rango desactivado exitosamente', 'Éxito')
      await fetchPreciosAgrupados()
      await validarConfiguracion()
      return { success: true, data: data.data }
    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Desactivar')
      return { success: false, error: err.message }
    }
  }

  // ==================== VALIDACIÓN ====================

  const validarConfiguracion = async () => {
    try {
      const response = await fetch(`${rutaApi}/comercializadora/tabla-precios/validar`, {
        headers: _headers()
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.message || 'Error al validar')

      validacion.value = data.data
      return { success: true, data: data.data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    }
  }

  // ==================== UTILITIES ====================

  const reset = () => {
    precios.value = []
    preciosAgrupados.value = {}
    validacion.value = null
    loading.value = false
    error.value = null
  }

  return {
    // State
    precios,
    preciosAgrupados,
    validacion,
    loading,
    error,

    // Computed
    tieneConfiguracionCompleta,
    mineralesFaltantes,
    totalRangos,

    // Actions
    fetchPrecios,
    fetchPreciosAgrupados,
    crear,
    actualizar,
    eliminar,
    desactivar,
    validarConfiguracion,
    reset
  }
})