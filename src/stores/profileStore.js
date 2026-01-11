// src/stores/profileStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUIStore } from './uiStore'
import { useSessionStore } from './sessionStore'
import rutaApi from '../assets/rutaApi.js'

export const useProfileStore = defineStore('profile', () => {
  const uiStore = useUIStore()
  const sessionStore = useSessionStore()
  
  // State
  const profileData = ref(null)
  const error = ref(null)

  // Datos del formulario de datos personales
  const personalData = ref({
    nombres: '',
    primerApellido: '',
    segundoApellido: '',
    ci: '',
    fechaNacimiento: '',
    numeroCelular: '',
    genero: '',
    nacionalidad: 'Boliviana',
    departamento: '',
    provincia: '',
    municipio: '',
    direccion: ''
  })

  // Datos del formulario de correo
  const emailData = ref({
    correo: '',
    contrasenaActual: ''
  })

  // Datos del formulario de contraseña
  const passwordData = ref({
    contrasenaActual: '',
    nuevaContrasena: '',
    confirmarContrasena: ''
  })

  // Computed
  const userRole = computed(() => sessionStore.userRole)
  
  const isTransportista = computed(() => userRole.value === 'transportista')
  
  const canEditCI = computed(() => !isTransportista.value)
  
  const canEditPhone = computed(() => !isTransportista.value)

  const nombreCompleto = computed(() => {
    if (!personalData.value.nombres) return ''
    const partes = [
      personalData.value.nombres,
      personalData.value.primerApellido,
      personalData.value.segundoApellido
    ].filter(Boolean)
    return partes.join(' ')
  })

  // Ruta base dinámica según el rol
  const getBaseUrl = () => {
    if (!userRole.value) {
      throw new Error('Rol de usuario no definido')
    }
    return `${rutaApi}/${userRole.value}/perfil`
  }

  /**
   * Obtener perfil completo del usuario
   */
  const fetchProfile = async () => {
    uiStore.showLoading('Cargando perfil...')
    error.value = null

    try {
      const baseUrl = getBaseUrl()
      const response = await fetch(baseUrl, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener el perfil')
      }

      profileData.value = data.data

      // Cargar datos en los formularios
      if (data.data.persona) {
        personalData.value = {
          nombres: data.data.persona.nombres || '',
          primerApellido: data.data.persona.primerApellido || '',
          segundoApellido: data.data.persona.segundoApellido || '',
          ci: data.data.persona.ci || '',
          fechaNacimiento: data.data.persona.fechaNacimiento || '',
          numeroCelular: data.data.persona.numeroCelular || '',
          genero: data.data.persona.genero || '',
          nacionalidad: data.data.persona.nacionalidad || 'Boliviana',
          departamento: data.data.persona.departamento || '',
          provincia: data.data.persona.provincia || '',
          municipio: data.data.persona.municipio || '',
          direccion: data.data.persona.direccion || ''
        }
      }

      if (data.data.usuario) {
        emailData.value.correo = data.data.usuario.correo || ''
      }

      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Cargar Perfil')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Actualizar datos personales
   */
  const updatePersonalData = async () => {
    uiStore.showLoading('Actualizando datos personales...')
    error.value = null

    try {
      const baseUrl = getBaseUrl()
      
      const response = await fetch(`${baseUrl}/datos-personales`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombres: personalData.value.nombres,
          primerApellido: personalData.value.primerApellido,
          segundoApellido: personalData.value.segundoApellido,
          ci: personalData.value.ci,
          fechaNacimiento: personalData.value.fechaNacimiento,
          numeroCelular: personalData.value.numeroCelular,
          genero: personalData.value.genero,
          nacionalidad: personalData.value.nacionalidad,
          departamento: personalData.value.departamento,
          provincia: personalData.value.provincia,
          municipio: personalData.value.municipio,
          direccion: personalData.value.direccion
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar datos personales')
      }

      await fetchProfile()

      uiStore.showSuccess(
        data.message || 'Datos personales actualizados exitosamente',
        'Datos Actualizados'
      )

      return { success: true, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Actualizar Datos')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Actualizar correo electrónico
   */
  const updateEmail = async () => {
    uiStore.showLoading('Actualizando correo electrónico...')
    error.value = null

    try {
      const baseUrl = getBaseUrl()
      
      const response = await fetch(`${baseUrl}/correo`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          correo: emailData.value.correo,
          contrasena_actual: emailData.value.contrasenaActual
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar el correo')
      }

      await fetchProfile()

      emailData.value.contrasenaActual = ''

      uiStore.showSuccess(
        data.message || 'Correo electrónico actualizado exitosamente',
        'Correo Actualizado'
      )

      return { success: true, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Actualizar Correo')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Actualizar contraseña
   */
  const updatePassword = async () => {
    error.value = null

    try {
      if (passwordData.value.nuevaContrasena !== passwordData.value.confirmarContrasena) {
        throw new Error('Las contraseñas nuevas no coinciden')
      }

      uiStore.showLoading('Actualizando contraseña...')

      const baseUrl = getBaseUrl()
      
      const response = await fetch(`${baseUrl}/contrasena`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contrasenaActual: passwordData.value.contrasenaActual,
          nuevaContrasena: passwordData.value.nuevaContrasena,
          confirmarContrasena: passwordData.value.confirmarContrasena
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar la contraseña')
      }

      passwordData.value = {
        contrasenaActual: '',
        nuevaContrasena: '',
        confirmarContrasena: ''
      }

      uiStore.showSuccess(
        data.message || 'Contraseña actualizada exitosamente',
        'Contraseña Actualizada'
      )

      return { success: true, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Actualizar Contraseña')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Actualizar dirección
   */
  const updateAddress = async () => {
    uiStore.showLoading('Actualizando dirección...')
    error.value = null

    try {
      const baseUrl = getBaseUrl()
      
      const response = await fetch(`${baseUrl}/direccion`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          departamento: personalData.value.departamento,
          provincia: personalData.value.provincia,
          municipio: personalData.value.municipio,
          direccion: personalData.value.direccion
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar la dirección')
      }

      await fetchProfile()

      uiStore.showSuccess(
        data.message || 'Dirección actualizada exitosamente',
        'Dirección Actualizada'
      )

      return { success: true, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Actualizar Dirección')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Reset de datos
   */
  const reset = () => {
    profileData.value = null
    error.value = null
    personalData.value = {
      nombres: '',
      primerApellido: '',
      segundoApellido: '',
      ci: '',
      fechaNacimiento: '',
      numeroCelular: '',
      genero: '',
      nacionalidad: 'Boliviana',
      departamento: '',
      provincia: '',
      municipio: '',
      direccion: ''
    }
    emailData.value = {
      correo: '',
      contrasenaActual: ''
    }
    passwordData.value = {
      contrasenaActual: '',
      nuevaContrasena: '',
      confirmarContrasena: ''
    }
  }

  const resetError = () => {
    error.value = null
  }

  return {
    // State
    profileData,
    error,
    personalData,
    emailData,
    passwordData,
    
    // Computed
    userRole,
    isTransportista,
    canEditCI,
    canEditPhone,
    nombreCompleto,
    
    // Actions
    fetchProfile,
    updatePersonalData,
    updateEmail,
    updatePassword,
    updateAddress,
    reset,
    resetError
  }
})