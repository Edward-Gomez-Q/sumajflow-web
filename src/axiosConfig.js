import axios from 'axios'
import rutaApi from '../assets/rutaApi.js'
import { useSessionStore } from '@/stores/sessionStore'
import { useAuthStore } from '@/stores/authStore'
import router from '@/router'

const api = axios.create({
  baseURL: rutaApi,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor de peticiones (agregar token)
api.interceptors.request.use(
  (config) => {
    const sessionStore = useSessionStore()
    
    if (sessionStore.token) {
      config.headers.Authorization = `Bearer ${sessionStore.token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor de respuestas (renovar token si expira)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Si el token expiró (401) y no hemos intentado renovarlo
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const authStore = useAuthStore()
      const result = await authStore.refreshToken()

      if (result.success) {
        // Reintentar la petición original con el nuevo token
        const sessionStore = useSessionStore()
        originalRequest.headers.Authorization = `Bearer ${sessionStore.token}`
        return api(originalRequest)
      } else {
        // Token no se pudo renovar, redirigir a login
        router.push('/login')
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default api