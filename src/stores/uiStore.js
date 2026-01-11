// src/stores/uiStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import Swal from 'sweetalert2'

export const useUIStore = defineStore('ui', () => {
  const isLoading = ref(false)
  const loadingMessage = ref('Cargando...')

  // Configuración base de SweetAlert2 con z-index
  const swalConfig = {
    customClass: {
      container: 'swal-z-index-10001'
    },
    didOpen: () => {
      // Asegurar que el backdrop también tenga el z-index correcto
      const container = document.querySelector('.swal2-container')
      if (container) {
        container.style.zIndex = '10001'
      }
    }
  }

  // ==========================================
  // LOADING
  // ==========================================
  
  const showLoading = (message = 'Cargando...') => {
    loadingMessage.value = message
    isLoading.value = true
  }

  const hideLoading = () => {
    isLoading.value = false
    loadingMessage.value = 'Cargando...'
  }

  // ==========================================
  // ALERTAS
  // ==========================================

  const showSuccess = (message, title = 'Éxito') => {
    return Swal.fire({
      ...swalConfig,
      icon: 'success',
      title,
      text: message,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#10b981',
      timer: 3000,
      timerProgressBar: true
    })
  }

  const showError = (message, title = 'Error') => {
    return Swal.fire({
      ...swalConfig,
      icon: 'error',
      title,
      text: message,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#ef4444'
    })
  }

  const showWarning = (message, title = 'Advertencia') => {
    return Swal.fire({
      ...swalConfig,
      icon: 'warning',
      title,
      text: message,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#f59e0b'
    })
  }

  const showInfo = (message, title = 'Información') => {
    return Swal.fire({
      ...swalConfig,
      icon: 'info',
      title,
      text: message,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3b82f6'
    })
  }

  const showConfirm = async (message, title = '¿Estás seguro?') => {
    const result = await Swal.fire({
      ...swalConfig,
      icon: 'question',
      title,
      text: message,
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      reverseButtons: true
    })

    return result.isConfirmed
  }

  const showDeleteConfirm = async (itemName = 'este elemento') => {
    const result = await Swal.fire({
      ...swalConfig,
      icon: 'warning',
      title: '¿Eliminar?',
      html: `Estás a punto de eliminar <strong>${itemName}</strong>.<br>Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      reverseButtons: true
    })

    return result.isConfirmed
  }

  const showToast = (message, icon = 'success') => {
    const Toast = Swal.mixin({
      ...swalConfig,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
        // Asegurar z-index para toast
        const container = document.querySelector('.swal2-container')
        if (container) {
          container.style.zIndex = '10001'
        }
      }
    })

    return Toast.fire({
      icon,
      title: message
    })
  }

  return {
    // State
    isLoading,
    loadingMessage,

    // Loading methods
    showLoading,
    hideLoading,

    // Alert methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    showDeleteConfirm,
    showToast
  }
})