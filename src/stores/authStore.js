import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSessionStore } from './sessionStore'
import rutaApi from '../assets/rutaApi.js'

export const useAuthStore = defineStore('auth', () => {
  const isLoading = ref(false)
  const error = ref(null)

  const API_URL = rutaApi

  const login = async (email, password) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión')
      }

      // Guardar sesión con refreshToken
      const sessionStore = useSessionStore()
      sessionStore.setSession(data.token, data.refreshToken, data.user)

      return { success: true, data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    isLoading.value = true
    error.value = null

    try {
      const sessionStore = useSessionStore()
      sessionStore.clearSession()
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  const refreshToken = async () => {
    const sessionStore = useSessionStore()
    
    if (!sessionStore.refreshToken) {
      return { success: false }
    }

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: sessionStore.refreshToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error('Token expirado')
      }

      sessionStore.setSession(data.token, data.refreshToken, data.user)
      return { success: true }
    } catch (err) {
      sessionStore.clearSession()
      return { success: false }
    }
  }

  const resetError = () => {
    error.value = null
  }

  return {
    isLoading,
    error,
    login,
    logout,
    refreshToken,
    resetError,
  }
})