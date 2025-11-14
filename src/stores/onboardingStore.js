import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import rutaApi  from '../assets/rutaApi.js'

export const useOnboardingStore = defineStore('onboarding', () => {
  const currentStep = ref(1)
  const selectedRole = ref(null) // 'cooperativa' | 'socio' | 'ingenio' | 'comercializadora'
  const totalSteps = ref(3) // Se ajusta según el rol seleccionado

  const personalData = ref({
    nombres: 'María Elena',
    primer_apellido: 'Condori',
    segundo_apellido: 'Apaza',
    ci: '8765432 LP',
    fecha_nacimiento: '1990-08-22',
    numero_celular: '71456789',
    genero: 'Femenino',
    nacionalidad: 'Boliviana',
    departamento: 'La Paz',
    provincia: 'Murillo',
    municipio: 'La Paz',
    direccion: 'Calle Comercio #456, Zona San Pedro',
    latitud: -16.500000,
    longitud: -68.150000
  })

  const userData = ref({
    correo: 'maria.condori@example.com',
    contrasena: 'minera2024',
    confirmar_contrasena: 'minera2024'
  })

  const cooperativaData = ref({
    razon_social: 'Cooperativa Minera Pachamama LTDA',
    nit: '9988776655',
    nim: 67890,
    correo_contacto: 'contacto@pachamama.com',
    numero_telefono_fijo: '22456789',
    numero_telefono_movil: '71234567',
    departamento: 'La Paz',
    provincia: 'Murillo',
    municipio: 'La Paz',
    direccion: 'Mina Milluni, Zona Alta',
    latitud: -16.350000,
    longitud: -68.100000,
    sectores: [
      {
        nombre: 'Sector Milluni',
        color: '#059669',
        coordenadas: [
          { orden: 1, latitud: -16.350000, longitud: -68.100000 },
          { orden: 2, latitud: -16.355000, longitud: -68.105000 },
          { orden: 3, latitud: -16.360000, longitud: -68.100000 },
          { orden: 4, latitud: -16.355000, longitud: -68.095000 }
        ]
      }
    ],
    balanza: {
      nombre: 'Balanza Cooperativa Pachamama',
      marca: 'OHAUS',
      modelo: 'D52XW50WQS5',
      numero_serie: 'OHS-67890-2024',
      capacidad_maxima: 7500,
      precision_minima: 0.8,
      fecha_ultima_calibracion: '2024-10-15',
      fecha_proxima_calibracion: '2025-04-15',
      departamento: 'La Paz',
      provincia: 'Murillo',
      municipio: 'La Paz',
      direccion: 'Mina Milluni, Zona Alta',
      latitud: -16.350000,
      longitud: -68.100000
    }
  })

  const socioData = ref({
    cooperativa_id: 2,
    numero_socio: 'S-005678',
    fecha_afiliacion: '2021-06-20',
    carnet_afiliacion_url: '',
    carnet_identidad_url: '',
    estado: 'pendiente'
  })

  const ingenioData = ref({
    razon_social: 'Ingenio Minero Illimani S.R.L.',
    nit: '4455667788',
    nim: 98765,
    correo_contacto: 'contacto@ingenioillimani.com',
    numero_telefono_fijo: '22567890',
    numero_telefono_movil: '72456789',
    departamento: 'La Paz',
    provincia: 'Murillo',
    municipio: 'El Alto',
    direccion: 'Km 12 Carretera La Paz - El Alto',
    latitud: -16.520000,
    longitud: -68.180000,
    planta: {
      minerales: ['Au', 'Ag', 'Zn'],
      cupo_minimo: 15,
      capacidad_procesamiento: 200,
      costo_procesamiento: 50,
      turnos: ['mañana', 'tarde'],
      procesos: [
        { id: 'trituracion', nombre: 'Trituración' },
        { id: 'molienda', nombre: 'Molienda' },
        { id: 'cianuración', nombre: 'Cianuración' },
        { id: 'filtrado', nombre: 'Filtrado' }
      ],
      licencia_ambiental_url: 'data:application/pdf;base64,JVBERi0xLjQK...',
      numero_licencia: 'LEIA-045-2024',
      departamento: 'La Paz',
      provincia: 'Murillo',
      municipio: 'El Alto',
      direccion: 'Km 12 Carretera La Paz - El Alto',
      latitud: -16.520000,
      longitud: -68.180000
    },
    balanza: {
      nombre: 'Balanza Industrial Illimani',
      marca: 'Rice Lake',
      modelo: 'RL1260',
      numero_serie: 'RLC-22334-2024',
      capacidad_maxima: 15000,
      precision_minima: 1.5,
      fecha_ultima_calibracion: '2024-09-20',
      fecha_proxima_calibracion: '2025-03-20',
      departamento: 'La Paz',
      provincia: 'Murillo',
      municipio: 'El Alto',
      direccion: 'Km 12 Carretera La Paz - El Alto',
      latitud: -16.520000,
      longitud: -68.180000
    },
    almacenes: [
      {
        nombre: 'Almacén Principal Oro-Plata',
        tipo: 'cerrado',
        minerales: ['Au', 'Ag'],
        capacidad_maxima: 300,
        area: 600,
        departamento: 'La Paz',
        provincia: 'Murillo',
        municipio: 'El Alto',
        direccion: 'Km 12 Carretera La Paz - El Alto - Sector A',
        latitud: -16.521000,
        longitud: -68.181000
      },
      {
        nombre: 'Almacén Secundario Zinc',
        tipo: 'concentrado',
        minerales: ['Zn'],
        capacidad_maxima: 180,
        area: 400,
        departamento: 'La Paz',
        provincia: 'Murillo',
        municipio: 'El Alto',
        direccion: 'Km 12 Carretera La Paz - El Alto - Sector B',
        latitud: -16.522000,
        longitud: -68.182000
      }
    ]
  })

  const comercializadoraData = ref({
    razon_social: 'Comercializadora Altiplano S.A.',
    nit: '3366998877',
    nim: 24680,
    correo_contacto: 'contacto@altiplanocom.com',
    numero_telefono_fijo: '22678901',
    numero_telefono_movil: '73567890',
    minerales_comercializados: ['Au', 'Ag', 'Zn', 'Cu'],
    numero_licencia: 'LCOM-078-2024',
    licencia_url: 'data:application/pdf;base64,JVBERi0xLjQK...',
    departamento: 'La Paz',
    provincia: 'Murillo',
    municipio: 'La Paz',
    direccion: 'Av. Montes #789, Zona Industrial Senkata',
    latitud: -16.510000,
    longitud: -68.190000,
    almacenes: [
      {
        nombre: 'Almacén Principal Metales Preciosos',
        tipo: 'cerrado',
        minerales: ['Au', 'Ag'],
        capacidad_maxima: 600,
        area: 1500,
        departamento: 'La Paz',
        provincia: 'Murillo',
        municipio: 'La Paz',
        direccion: 'Av. Montes #789, Zona Industrial Senkata',
        latitud: -16.510000,
        longitud: -68.190000
      },
      {
        nombre: 'Almacén Metales Base',
        tipo: 'abierto',
        minerales: ['Zn', 'Cu'],
        capacidad_maxima: 400,
        area: 1000,
        departamento: 'La Paz',
        provincia: 'Murillo',
        municipio: 'La Paz',
        direccion: 'Av. Montes #791, Zona Industrial Senkata',
        latitud: -16.511000,
        longitud: -68.191000
      }
    ],
    balanza: {
      nombre: 'Balanza Comercial Altiplano',
      marca: 'Sartorius',
      modelo: 'Combics 3',
      numero_serie: 'SAR-99887-2024',
      capacidad_maxima: 50000,
      precision_minima: 5,
      fecha_ultima_calibracion: '2024-10-01',
      fecha_proxima_calibracion: '2025-04-01',
      departamento: 'La Paz',
      provincia: 'Murillo',
      municipio: 'La Paz',
      direccion: 'Av. Montes #789, Zona Industrial Senkata',
      latitud: -16.510000,
      longitud: -68.190000
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
      planta.turnos.length > 0 &&
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

  // Reset con opción de mantener datos de prueba
  const resetOnboarding = (keepTestData = false) => {
    currentStep.value = 1
    selectedRole.value = null
    totalSteps.value = 3
    
    if (!keepTestData) {
      // Reset completo a valores vacíos
      personalData.value = {
        nombres: '',
        primer_apellido: '',
        segundo_apellido: '',
        ci: '',
        fecha_nacimiento: '',
        numero_celular: '',
        genero: '',
        nacionalidad: 'Boliviano',
        departamento: 'Potosí',
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
      cooperativaData.value.sectores = []
      cooperativaData.value.balanza = null
      ingenioData.value.almacenes = []
      ingenioData.value.balanza = null
      comercializadoraData.value.almacenes = []
      comercializadoraData.value.balanza = null
    }
    // Si keepTestData es true, mantiene los valores de prueba preestablecidos
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