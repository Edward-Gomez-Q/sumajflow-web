import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  const toggleTheme = () => {
    isDark.value = !isDark.value
    applyTheme()
    saveToLocalStorage()
  }

  const setTheme = (dark) => {
    isDark.value = dark
    applyTheme()
    saveToLocalStorage()
  }

  const applyTheme = () => {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const saveToLocalStorage = () => {
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }

  const loadFromLocalStorage = () => {
    const savedTheme = localStorage.getItem('theme')
    
    if (savedTheme) {
      isDark.value = savedTheme === 'dark'
    } else {
      // Detectar preferencia del sistema si no hay guardada
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    
    applyTheme()
  }

  // Watch para cambios en la preferencia del sistema
  watch(() => isDark.value, () => {
    applyTheme()
  })

  return {
    isDark,
    toggleTheme,
    setTheme,
    loadFromLocalStorage,
  }
})