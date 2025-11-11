import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useOnboardingStore = defineStore('onboarding', () => {
  const currentStep = ref(1)
  const selectedRole = ref(null) // 'cooperativa' | 'socio' | 'ingenio' | 'comercializadora'
  const totalSteps = ref(3) // Se ajusta según el rol seleccionado

  // Datos del formulario con valores por defecto para testing
  const personalData = ref({
    nombres: 'Juan Carlos',
    primer_apellido: 'Mamani',
    segundo_apellido: 'Quispe',
    ci: '1234567 PT',
    fecha_nacimiento: '1985-05-15',
    numero_celular: '70123456',
    genero: 'Masculino',
    nacionalidad: 'Boliviano',
    departamento: 'Potosí',
    provincia: 'Tomás Frías',
    municipio: 'Potosí',
    direccion: 'Av. Cívica #123, Zona Central',
    latitud: -19.583333,
    longitud: -65.750000
  })

  const userData = ref({
    correo: 'juan.mamani@example.com',
    contrasena: 'password123',
    confirmar_contrasena: 'password123'
  })

  // Datos específicos por rol con valores de prueba
  const cooperativaData = ref({
    razon_social: 'Cooperativa Minera 15 de Agosto LTDA',
    nit: '1234567890',
    nim: 12345,
    correo_contacto: 'contacto@cooperativa15.com',
    numero_telefono_fijo: '26234567',
    numero_telefono_movil: '70987654',
    departamento: 'Potosí',
    provincia: 'Tomás Frías',
    municipio: 'Potosí',
    direccion: 'Cerro Rico, Zona Norte',
    latitud: -19.600000,
    longitud: -65.770000,
    sectores: [
      {
        nombre: 'Sector Norte',
        color: '#1E3A8A',
        coordenadas: [
          { orden: 1, latitud: -19.600000, longitud: -65.770000 },
          { orden: 2, latitud: -19.605000, longitud: -65.775000 },
          { orden: 3, latitud: -19.610000, longitud: -65.770000 },
          { orden: 4, latitud: -19.605000, longitud: -65.765000 }
        ]
      }
    ],
    balanza: {
      nombre: 'Balanza Principal Cooperativa',
      marca: 'Toledo',
      modelo: 'PS-5000',
      numero_serie: 'TOL-12345-2024',
      capacidad_maxima: 5000,
      precision_minima: 0.5,
      fecha_ultima_calibracion: '2024-09-01',
      fecha_proxima_calibracion: '2025-03-01',
      departamento: 'Potosí',
      provincia: 'Tomás Frías',
      municipio: 'Potosí',
      direccion: 'Cerro Rico, Zona Norte',
      latitud: -19.600000,
      longitud: -65.770000
    }
  })

  const socioData = ref({
    cooperativa_id: 1,
    numero_socio: 'S-001234',
    fecha_afiliacion: '2020-01-15',
    carnet_afiliacion_url: 'data:application/pdf;base64,JVBERi0xLjQK...',
    carnet_identidad_url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    estado: 'pendiente'
  })

  const ingenioData = ref({
    razon_social: 'Ingenio Minero San José S.A.',
    nit: '9876543210',
    nim: 54321,
    correo_contacto: 'contacto@ingeniosanjose.com',
    numero_telefono_fijo: '26345678',
    numero_telefono_movil: '71234567',
    departamento: 'Potosí',
    provincia: 'Tomás Frías',
    municipio: 'Potosí',
    direccion: 'Km 5 Carretera a Oruro',
    latitud: -19.550000,
    longitud: -65.730000,
    planta: {
      minerales: ['Ag', 'Zn', 'Pb'],
      cupo_minimo: 10,
      capacidad_procesamiento: 150,
      costo_procesamiento: 45,
      turnos: ['mañana', 'tarde', 'noche'],
      procesos: [
        { id: 'chancado', nombre: 'Chancado' },
        { id: 'molienda', nombre: 'Molienda' },
        { id: 'flotacion', nombre: 'Flotación' },
        { id: 'secado', nombre: 'Secado' }
      ],
      licencia_ambiental_url: 'data:application/pdf;base64,JVBERi0xLjQK...',
      numero_licencia: 'LEIA-001-2024',
      departamento: 'Potosí',
      provincia: 'Tomás Frías',
      municipio: 'Potosí',
      direccion: 'Km 5 Carretera a Oruro',
      latitud: -19.550000,
      longitud: -65.730000
    },
    balanza: {
      nombre: 'Balanza Principal Ingenio',
      marca: 'Mettler Toledo',
      modelo: 'IND560',
      numero_serie: 'MTL-98765-2024',
      capacidad_maxima: 10000,
      precision_minima: 1,
      fecha_ultima_calibracion: '2024-10-01',
      fecha_proxima_calibracion: '2025-04-01',
      departamento: 'Potosí',
      provincia: 'Tomás Frías',
      municipio: 'Potosí',
      direccion: 'Km 5 Carretera a Oruro',
      latitud: -19.550000,
      longitud: -65.730000
    },
    almacenes: [
      {
        nombre: 'Almacén de Concentrados A',
        tipo: 'concentrado',
        minerales: ['Ag', 'Zn'],
        capacidad_maxima: 200,
        area: 500,
        departamento: 'Potosí',
        provincia: 'Tomás Frías',
        municipio: 'Potosí',
        direccion: 'Km 5 Carretera a Oruro - Zona A',
        latitud: -19.551000,
        longitud: -65.731000
      },
      {
        nombre: 'Almacén de Concentrados B',
        tipo: 'cerrado',
        minerales: ['Pb'],
        capacidad_maxima: 150,
        area: 350,
        departamento: 'Potosí',
        provincia: 'Tomás Frías',
        municipio: 'Potosí',
        direccion: 'Km 5 Carretera a Oruro - Zona B',
        latitud: -19.552000,
        longitud: -65.732000
      }
    ]
  })

  const comercializadoraData = ref({
    razon_social: 'Comercializadora Andina S.A.',
    nit: '5544332211',
    nim: 67890,
    correo_contacto: 'contacto@comercializadoraandina.com',
    numero_telefono_fijo: '26456789',
    numero_telefono_movil: '72345678',
    minerales_comercializados: ['Ag', 'Zn', 'Pb', 'Sn'],
    numero_licencia: 'LCOM-001-2024',
    licencia_url: 'data:application/pdf;base64,JVBERi0xLjQK...',
    departamento: 'Potosí',
    provincia: 'Tomás Frías',
    municipio: 'Potosí',
    direccion: 'Av. del Minero #456, Zona Industrial',
    latitud: -19.570000,
    longitud: -65.740000,
    almacenes: [
      {
        nombre: 'Almacén Central',
        tipo: 'cerrado',
        minerales: ['Ag', 'Zn', 'Pb'],
        capacidad_maxima: 500,
        area: 1200,
        departamento: 'Potosí',
        provincia: 'Tomás Frías',
        municipio: 'Potosí',
        direccion: 'Av. del Minero #456, Zona Industrial',
        latitud: -19.570000,
        longitud: -65.740000
      },
      {
        nombre: 'Almacén Secundario',
        tipo: 'abierto',
        minerales: ['Sn'],
        capacidad_maxima: 300,
        area: 800,
        departamento: 'Potosí',
        provincia: 'Tomás Frías',
        municipio: 'Potosí',
        direccion: 'Av. del Minero #458, Zona Industrial',
        latitud: -19.571000,
        longitud: -65.741000
      }
    ],
    balanza: {
      nombre: 'Balanza Principal Comercializadora',
      marca: 'Avery Weigh-Tronix',
      modelo: 'ZM510',
      numero_serie: 'AWT-55555-2024',
      capacidad_maxima: 30000,
      precision_minima: 2,
      fecha_ultima_calibracion: '2024-11-01',
      fecha_proxima_calibracion: '2025-05-01',
      departamento: 'Potosí',
      provincia: 'Tomás Frías',
      municipio: 'Potosí',
      direccion: 'Av. del Minero #456, Zona Industrial',
      latitud: -19.570000,
      longitud: -65.740000
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
        totalSteps.value = 5 // Personal, User, Role, Association, Pending
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
      const API_URL = import.meta.env.VITE_API_URL

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