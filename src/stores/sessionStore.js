import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSessionStore = defineStore('session', () => {
  const token = ref('')
  const user = ref(null)

  const isAuthenticated = computed(() => !!token.value)

  const setSession = (newToken, userData) => {
    token.value = newToken
    user.value = userData
    saveToLocalStorage()
  }

  const clearSession = () => {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const saveToLocalStorage = () => {
    if (token.value) {
      localStorage.setItem('token', token.value)
    }
    if (user.value) {
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  const loadFromLocalStorage = () => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (savedToken) {
      token.value = savedToken
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
    user,
    isAuthenticated,
    setSession,
    clearSession,
    saveToLocalStorage,
    loadFromLocalStorage,
  }
})