// src/stores/socio/cooperativaInfoStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSessionStore } from '../sessionStore.js'
import rutaApi from '../../assets/rutaApi.js'
export const useCooperativaInfoStore = defineStore('cooperativaInfo', () => {

    const sessionStore = useSessionStore()
    const cooperativaInfo = ref(null)
    const loading = ref(false)
    const error = ref(null)
    
    const fetchCooperativaInfo = async () => {
        loading.value = true
        error.value = null
        try {
            const response = await fetch(`${rutaApi}/socio/cooperativa`, {
                headers: {
                    'Authorization': `Bearer ${sessionStore.token}`,
                    'Content-Type': 'application/json'
                }
            })
            const data = await response.json()
            if (!response.ok) {
                throw new Error(data.message || 'Error al cargar información de la cooperativa')
            }
            cooperativaInfo.value = data.data
            return { success: true, data: data.data }
        }
        catch (err) {
            error.value = err.message
            return { success: false, error: err.message }
        }
        finally {
            loading.value = false
        }
    }
    return {
        cooperativaInfo,
        loading,
        error,
        fetchCooperativaInfo
    }
})