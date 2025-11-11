import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSessionStore } from './sessionStore'

export const useAuthStore = defineStore('auth', () => {
  const isLoading = ref(false)
  const error = ref(null)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

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

      // Guardar sesión
      const sessionStore = useSessionStore()
      sessionStore.setSession(data.token, data.user)

      return { success: true, data }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar usuario')
      }

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
      
      // Opcional: llamar al backend para invalidar el token
      if (sessionStore.token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionStore.token}`,
            'Content-Type': 'application/json',
          },
        })
      }

      sessionStore.clearSession()
      return { success: true }
    } catch (err) {
      error.value = err.message
      // Aún así limpiar la sesión local
      const sessionStore = useSessionStore()
      sessionStore.clearSession()
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  const resetError = () => {
    error.value = null
  }

  return {
    isLoading,
    error,
    login,
    register,
    logout,
    resetError,
  }
})