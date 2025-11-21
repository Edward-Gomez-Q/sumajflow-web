import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import rutaApi  from '../assets/rutaApi.js'

export const useOnboardingStore = defineStore('onboarding', () => {
  const currentStep = ref(1)
  const selectedRole = ref(null) // 'cooperativa' | 'socio' | 'ingenio' | 'comercializadora'
  const totalSteps = ref(3) // Se ajusta según el rol seleccionado

  const personalData = ref({
    nombres: '',
    primer_apellido: '',
    segundo_apellido: '',
    ci: '',
    fecha_nacimiento: '',
    numero_celular: '',
    genero: '',
    nacionalidad: 'Boliviana',
    departamento: '',
    provincia: '',
    municipio: '',
    direccion: '',
    latitud: null,
    longitud: null
  })

  const userData = ref({
    correo: '',
    contrasena: '',
    confirmar_contrasena: ''
  })

  const cooperativaData = ref({
    razon_social: '',
    nit: '',
    nim: null,
    correo_contacto: '',
    numero_telefono_fijo: '',
    numero_telefono_movil: '',
    departamento: '',
    provincia: '',
    municipio: '',
    direccion: '',
    latitud: null,
    longitud: null,
    sectores: [],
    balanza: {
      nombre: '',
      marca: '',
      modelo: '',
      numero_serie: '',
      capacidad_maxima: null,
      precision_minima: null,
      fecha_ultima_calibracion: '',
      fecha_proxima_calibracion: '',
      departamento: '',
      provincia: '',
      municipio: '',
      direccion: '',
      latitud: null,
      longitud: null
    }
  })

  const socioData = ref({
    cooperativa_id: null,
    numero_socio: '',
    fecha_afiliacion: '',
    carnet_afiliacion_url: '',
    carnet_identidad_url: '',
    estado: 'pendiente'
  })

  const ingenioData = ref({
    razon_social: '',
    nit: '',
    nim: null,
    correo_contacto: '',
    numero_telefono_fijo: '',
    numero_telefono_movil: '',
    departamento: '',
    provincia: '',
    municipio: '',
    direccion: '',
    latitud: null,
    longitud: null,
    planta: {
      minerales: [],
      cupo_minimo: null,
      capacidad_procesamiento: null,
      costo_procesamiento: null,
      procesos: [],
      licencia_ambiental_url: '',
      numero_licencia: '',
      departamento: '',
      provincia: '',
      municipio: '',
      direccion: '',
      latitud: null,
      longitud: null
    },
    balanza: {
      nombre: '',
      marca: '',
      modelo: '',
      numero_serie: '',
      capacidad_maxima: null,
      precision_minima: null,
      fecha_ultima_calibracion: '',
      fecha_proxima_calibracion: '',
      departamento: '',
      provincia: '',
      municipio: '',
      direccion: '',
      latitud: null,
      longitud: null
    },
    almacenes: []
  })

  const comercializadoraData = ref({
    razon_social: '',
    nit: '',
    nim: null,
    correo_contacto: '',
    numero_telefono_fijo: '',
    numero_telefono_movil: '',
    minerales_comercializados: [],
    numero_licencia: '',
    licencia_url: '',
    departamento: '',
    provincia: '',
    municipio: '',
    direccion: '',
    latitud: null,
    longitud: null,
    almacenes: [],
    balanza: {
      nombre: '',
      marca: '',
      modelo: '',
      numero_serie: '',
      capacidad_maxima: null,
      precision_minima: null,
      fecha_ultima_calibracion: '',
      fecha_proxima_calibracion: '',
      departamento: '',
      provincia: '',
      municipio: '',
      direccion: '',
      latitud: null,
      longitud: null
    }
  })

  // Computed
  const canGoNext = computed(() => {
    // Validar según el paso actual
    switch (currentStep.value) {
      case 1: // Datos personales
        return validatePersonalData()
      case 2: // Credenciales
        return validateUserData()
      case 3: // Selección de rol
        return selectedRole.value !== null
      case 4:
        if (selectedRole.value === 'cooperativa') {
          return validateCoopBasicInfo()
        }
        if (selectedRole.value === 'socio') {
          return validateSocioAssociation()
        }
        if (selectedRole.value === 'ingenio') {
          return validateIngenioBasicInfo()
        }
        if (selectedRole.value === 'comercializadora') {
          return validateComerBasicInfo()
        }
        return true
      case 5:
        if (selectedRole.value === 'cooperativa') {
          return validateCoopSectors()
        }
        if (selectedRole.value === 'ingenio') {
          return validateIngenioPlant()
        }
        if (selectedRole.value === 'comercializadora') {
          return validateComerWarehouses()
        }
        return true
      case 6:
        if (selectedRole.value === 'cooperativa') {
          return validateCoopBalance()
        }
        if (selectedRole.value === 'ingenio') {
          return validateIngenioBalance()
        }
        if (selectedRole.value === 'comercializadora') {
          return validateComerBalance()
        }
        return true
      case 7:
        if (selectedRole.value === 'ingenio') {
          return validateIngenioWarehouses()
        }
        return true
      default:
        return true
    }
  })

  const progress = computed(() => {
    return Math.round((currentStep.value / totalSteps.value) * 100)
  })

  // Métodos de navegación
  const nextStep = () => {
    if (canGoNext.value && currentStep.value < totalSteps.value) {
      currentStep.value++
    }
  }

  const prevStep = () => {
    if (currentStep.value > 1) {
      currentStep.value--
    }
  }

  const goToStep = (step) => {
    if (step >= 1 && step <= totalSteps.value) {
      currentStep.value = step
    }
  }

  const setRole = (role) => {
    selectedRole.value = role
    
    // Ajustar total de pasos según el rol
    switch (role) {
      case 'cooperativa':
        totalSteps.value = 6 // Personal, User, Role, BasicInfo, Sectors, Balance
        break
      case 'socio':
        totalSteps.value = 4 // Personal, User, Role, Association
        break
      case 'ingenio':
        totalSteps.value = 7 // Personal, User, Role, BasicInfo, Plant, Balance, Warehouses
        break
      case 'comercializadora':
        totalSteps.value = 6 // Personal, User, Role, BasicInfo, Warehouses, Balance
        break
      default:
        totalSteps.value = 3
    }
  }

  // Validaciones
  const validatePersonalData = () => {
    return (
      personalData.value.nombres.trim() !== '' &&
      personalData.value.primer_apellido.trim() !== '' &&
      personalData.value.ci.trim() !== '' &&
      personalData.value.fecha_nacimiento !== '' &&
      personalData.value.numero_celular.trim() !== '' &&
      personalData.value.direccion.trim() !== ''
    )
  }

  const validateUserData = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return (
      emailRegex.test(userData.value.correo) &&
      userData.value.contrasena.length >= 6 &&
      userData.value.contrasena === userData.value.confirmar_contrasena
    )
  }

  const validateCoopBasicInfo = () => {
    return (
      cooperativaData.value.razon_social.trim() !== '' &&
      cooperativaData.value.nit.trim() !== '' &&
      cooperativaData.value.nim > 0 &&
      cooperativaData.value.correo_contacto.trim() !== '' &&
      cooperativaData.value.direccion.trim() !== ''
    )
  }

  const validateCoopSectors = () => {
    return (
      cooperativaData.value.sectores.length > 0 &&
      cooperativaData.value.sectores.every(sector =>
        sector.nombre?.trim() !== '' &&
        sector.coordenadas &&
        sector.coordenadas.length >= 3
      )
    )
  }

  const validateCoopBalance = () => {
    const balanza = cooperativaData.value.balanza
    if (!balanza) return false

    return (
      balanza.nombre?.trim() !== '' &&
      balanza.marca?.trim() !== '' &&
      balanza.modelo?.trim() !== '' &&
      balanza.numero_serie?.trim() !== '' &&
      balanza.capacidad_maxima > 0 &&
      balanza.precision_minima > 0 &&
      balanza.fecha_ultima_calibracion &&
      balanza.fecha_proxima_calibracion &&
      balanza.direccion?.trim() !== ''
    )
  }

  const validateSocioAssociation = () => {
    return (
      socioData.value.cooperativa_id !== null &&
      socioData.value.numero_socio?.trim() !== '' &&
      socioData.value.fecha_afiliacion !== '' &&
      socioData.value.carnet_afiliacion_url !== '' &&
      socioData.value.carnet_identidad_url !== ''
    )
  }

  const validateIngenioBasicInfo = () => {
    return (
      ingenioData.value.razon_social?.trim() !== '' &&
      ingenioData.value.nit?.trim() !== '' &&
      ingenioData.value.nim > 0 &&
      ingenioData.value.correo_contacto?.trim() !== '' &&
      ingenioData.value.direccion?.trim() !== ''
    )
  }

  const validateIngenioPlant = () => {
    const planta = ingenioData.value.planta
    return (
      planta.minerales.length > 0 &&
      planta.cupo_minimo > 0 &&
      planta.capacidad_procesamiento > 0 &&
      planta.costo_procesamiento > 0 &&
      planta.procesos.length > 0 &&
      planta.numero_licencia?.trim() !== '' &&
      planta.licencia_ambiental_url !== '' &&
      planta.direccion?.trim() !== ''
    )
  }

  const validateIngenioBalance = () => {
    const balanza = ingenioData.value.balanza
    if (!balanza) return false

    return (
      balanza.nombre?.trim() !== '' &&
      balanza.marca?.trim() !== '' &&
      balanza.modelo?.trim() !== '' &&
      balanza.numero_serie?.trim() !== '' &&
      balanza.capacidad_maxima > 0 &&
      balanza.precision_minima > 0 &&
      balanza.fecha_ultima_calibracion &&
      balanza.fecha_proxima_calibracion &&
      balanza.direccion?.trim() !== ''
    )
  }

  const validateIngenioWarehouses = () => {
    return (
      ingenioData.value.almacenes.length > 0 &&
      ingenioData.value.almacenes.every(almacen =>
        almacen.nombre?.trim() !== '' &&
        almacen.capacidad_maxima > 0
      )
    )
  }

  const validateComerBasicInfo = () => {
    return (
      comercializadoraData.value.razon_social?.trim() !== '' &&
      comercializadoraData.value.nit?.trim() !== '' &&
      comercializadoraData.value.nim > 0 &&
      comercializadoraData.value.correo_contacto?.trim() !== '' &&
      comercializadoraData.value.minerales_comercializados.length > 0 &&
      comercializadoraData.value.numero_licencia?.trim() !== '' &&
      comercializadoraData.value.licencia_url !== '' &&
      comercializadoraData.value.direccion?.trim() !== ''
    )
  }

  const validateComerWarehouses = () => {
    return (
      comercializadoraData.value.almacenes.length > 0 &&
      comercializadoraData.value.almacenes.every(almacen =>
        almacen.nombre?.trim() !== '' &&
        almacen.capacidad_maxima > 0
      )
    )
  }

  const validateComerBalance = () => {
    const balanza = comercializadoraData.value.balanza
    if (!balanza) return false

    return (
      balanza.nombre?.trim() !== '' &&
      balanza.marca?.trim() !== '' &&
      balanza.modelo?.trim() !== '' &&
      balanza.numero_serie?.trim() !== '' &&
      balanza.capacidad_maxima > 0 &&
      balanza.precision_minima > 0 &&
      balanza.fecha_ultima_calibracion &&
      balanza.fecha_proxima_calibracion &&
      balanza.direccion?.trim() !== ''
    )
  }

  // Método principal para enviar al backend
  const submitOnboarding = async () => {
    try {
      const API_URL = rutaApi

      // Construir el payload según el rol
      const payload = {
        persona: { ...personalData.value },
        usuario: {
          correo: userData.value.correo,
          contrasena: userData.value.contrasena,
          tipo_usuario: selectedRole.value
        }
      }

      // Agregar datos específicos según el rol
      switch (selectedRole.value) {
        case 'cooperativa':
          payload.cooperativa = { ...cooperativaData.value }
          break
        case 'socio':
          payload.socio = { ...socioData.value }
          break
        case 'ingenio':
          payload.ingenio = { ...ingenioData.value }
          break
        case 'comercializadora':
          payload.comercializadora = { ...comercializadoraData.value }
          break
      }

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar usuario')
      }

      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Reset
  const resetOnboarding = () => {
    currentStep.value = 1
    selectedRole.value = null
    totalSteps.value = 3
    
    // Reset completo a valores vacíos
    personalData.value = {
      nombres: '',
      primer_apellido: '',
      segundo_apellido: '',
      ci: '',
      fecha_nacimiento: '',
      numero_celular: '',
      genero: '',
      nacionalidad: 'Boliviana',
      departamento: '',
      provincia: '',
      municipio: '',
      direccion: '',
      latitud: null,
      longitud: null
    }
    
    userData.value = {
      correo: '',
      contrasena: '',
      confirmar_contrasena: ''
    }
    
    cooperativaData.value = {
      razon_social: '',
      nit: '',
      nim: null,
      correo_contacto: '',
      numero_telefono_fijo: '',
      numero_telefono_movil: '',
      departamento: '',
      provincia: '',
      municipio: '',
      direccion: '',
      latitud: null,
      longitud: null,
      sectores: [],
      balanza: {
        nombre: '',
        marca: '',
        modelo: '',
        numero_serie: '',
        capacidad_maxima: null,
        precision_minima: null,
        fecha_ultima_calibracion: '',
        fecha_proxima_calibracion: '',
        departamento: '',
        provincia: '',
        municipio: '',
        direccion: '',
        latitud: null,
        longitud: null
      }
    }
    
    socioData.value = {
      cooperativa_id: null,
      numero_socio: '',
      fecha_afiliacion: '',
      carnet_afiliacion_url: '',
      carnet_identidad_url: '',
      estado: 'pendiente'
    }
    
    ingenioData.value = {
      razon_social: '',
      nit: '',
      nim: null,
      correo_contacto: '',
      numero_telefono_fijo: '',
      numero_telefono_movil: '',
      departamento: '',
      provincia: '',
      municipio: '',
      direccion: '',
      latitud: null,
      longitud: null,
      planta: {
        minerales: [],
        cupo_minimo: null,
        capacidad_procesamiento: null,
        costo_procesamiento: null,
        procesos: [],
        licencia_ambiental_url: '',
        numero_licencia: '',
        departamento: '',
        provincia: '',
        municipio: '',
        direccion: '',
        latitud: null,
        longitud: null
      },
      balanza: {
        nombre: '',
        marca: '',
        modelo: '',
        numero_serie: '',
        capacidad_maxima: null,
        precision_minima: null,
        fecha_ultima_calibracion: '',
        fecha_proxima_calibracion: '',
        departamento: '',
        provincia: '',
        municipio: '',
        direccion: '',
        latitud: null,
        longitud: null
      },
      almacenes: []
    }
    
    comercializadoraData.value = {
      razon_social: '',
      nit: '',
      nim: null,
      correo_contacto: '',
      numero_telefono_fijo: '',
      numero_telefono_movil: '',
      minerales_comercializados: [],
      numero_licencia: '',
      licencia_url: '',
      departamento: '',
      provincia: '',
      municipio: '',
      direccion: '',
      latitud: null,
      longitud: null,
      almacenes: [],
      balanza: {
        nombre: '',
        marca: '',
        modelo: '',
        numero_serie: '',
        capacidad_maxima: null,
        precision_minima: null,
        fecha_ultima_calibracion: '',
        fecha_proxima_calibracion: '',
        departamento: '',
        provincia: '',
        municipio: '',
        direccion: '',
        latitud: null,
        longitud: null
      }
    }
  }

  return {
    // State
    currentStep,
    selectedRole,
    totalSteps,
    personalData,
    userData,
    cooperativaData,
    socioData,
    ingenioData,
    comercializadoraData,

    // Computed
    canGoNext,
    progress,

    // Methods
    nextStep,
    prevStep,
    goToStep,
    setRole,
    submitOnboarding,
    resetOnboarding,
  }
})