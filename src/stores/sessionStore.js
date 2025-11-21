import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSessionStore = defineStore('session', () => {
  const token = ref('')
  const refreshToken = ref('')
  const user = ref(null)

  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.rol || null)

  const setSession = (newToken, newRefreshToken, userData) => {
    token.value = newToken
    refreshToken.value = newRefreshToken
    user.value = userData
    saveToLocalStorage()
  }

  const clearSession = () => {
    token.value = ''
    refreshToken.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  const saveToLocalStorage = () => {
    if (token.value) {
      localStorage.setItem('token', token.value)
    }
    if (refreshToken.value) {
      localStorage.setItem('refreshToken', refreshToken.value)
    }
    if (user.value) {
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  const loadFromLocalStorage = () => {
    const savedToken = localStorage.getItem('token')
    const savedRefreshToken = localStorage.getItem('refreshToken')
    const savedUser = localStorage.getItem('user')

    if (savedToken) {
      token.value = savedToken
    }
    if (savedRefreshToken) {
      refreshToken.value = savedRefreshToken
    }
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch (e) {
        console.error('Error parsing user data:', e)
        localStorage.removeItem('user')
      }
    }
  }

  return {
    token,
    refreshToken,
    user,
    isAuthenticated,
    userRole,
    setSession,
    clearSession,
    saveToLocalStorage,
    loadFromLocalStorage,
  }
})