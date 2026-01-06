<!-- src/views/Profile.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useProfileStore } from '@/stores/profileStore'
import AppLayout from '@/components/layout/AppLayout.vue'
import {
  User,
  Mail,
  Lock,
  MapPin,
  Save,
  Eye,
  EyeOff,
  ChevronDown,
  Info,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-vue-next'

const profileStore = useProfileStore()

const cargando = ref(true)
const activeTab = ref('personal')
const showSuccessMessage = ref(false)
const successMessage = ref('')
const localError = ref(null)

// Password visibility toggles
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const showEmailPassword = ref(false)

// Saving states
const savingPersonal = ref(false)
const savingEmail = ref(false)
const savingPassword = ref(false)
const savingAddress = ref(false)

// CI y teléfono
const ciExtension = ref('PT')
const phoneCode = ref('+591')

const tabs = [
  { id: 'personal', name: 'Datos Personales', icon: User },
  { id: 'email', name: 'Correo Electrónico', icon: Mail },
  { id: 'password', name: 'Contraseña', icon: Lock },
  { id: 'address', name: 'Dirección', icon: MapPin }
]

const ciExtensions = [
  { code: 'LP', name: 'La Paz' },
  { code: 'CB', name: 'Cochabamba' },
  { code: 'SC', name: 'Santa Cruz' },
  { code: 'PT', name: 'Potosí' },
  { code: 'OR', name: 'Oruro' },
  { code: 'TJ', name: 'Tarija' },
  { code: 'CH', name: 'Chuquisaca' },
  { code: 'BE', name: 'Beni' },
  { code: 'PD', name: 'Pando' }
]

const phoneCodes = [
  { code: '+591', country: 'Bolivia', flag: '🇧🇴' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+55', country: 'Brasil', flag: '🇧🇷' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' }
]

const generos = ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir']

const departamentos = [
  'La Paz',
  'Cochabamba',
  'Santa Cruz',
  'Potosí',
  'Oruro',
  'Tarija',
  'Chuquisaca',
  'Beni',
  'Pando'
]

// Computed para CI
const ciNumero = computed({
  get: () => {
    const ci = profileStore.personalData.ci || ''
    return ci.split(' ')[0] || ''
  },
  set: (value) => {
    const cleanCI = value.replace(/[^0-9]/g, '')
    profileStore.personalData.ci = cleanCI ? `${cleanCI} ${ciExtension.value}` : ''
  }
})

// Computed para teléfono
const phoneNumber = computed({
  get: () => {
    const phone = profileStore.personalData.numeroCelular || ''
    const parts = phone.split(' ')
    return parts.length > 1 ? parts.slice(1).join('') : phone
  },
  set: (value) => {
    const cleanPhone = value.replace(/[^0-9]/g, '')
    profileStore.personalData.numeroCelular = cleanPhone ? `${phoneCode.value} ${cleanPhone}` : ''
  }
})

// Computed para fortaleza de contraseña
const passwordStrength = computed(() => {
  const password = profileStore.passwordData.nuevaContrasena
  if (!password) return { level: 0, text: '', color: '' }

  let strength = 0
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[^a-zA-Z\d]/.test(password)) strength++

  const levels = [
    { level: 0, text: 'Muy débil', color: 'bg-red-500' },
    { level: 1, text: 'Débil', color: 'bg-orange-500' },
    { level: 2, text: 'Media', color: 'bg-yellow-500' },
    { level: 3, text: 'Fuerte', color: 'bg-lime-500' },
    { level: 4, text: 'Muy fuerte', color: 'bg-green-500' }
  ]

  return levels[Math.min(strength, 4)]
})

const passwordsMatch = computed(() => {
  const { nuevaContrasena, confirmarContrasena } = profileStore.passwordData
  if (!nuevaContrasena || !confirmarContrasena) return null
  return nuevaContrasena === confirmarContrasena
})

// Lifecycle
onMounted(async () => {
  try {
    await profileStore.fetchProfile()
    
    // Inicializar extensiones desde los datos cargados
    if (profileStore.personalData.ci) {
      const parts = profileStore.personalData.ci.split(' ')
      if (parts.length > 1) ciExtension.value = parts[1]
    }

    if (profileStore.personalData.numeroCelular) {
      const parts = profileStore.personalData.numeroCelular.split(' ')
      if (parts.length > 0) phoneCode.value = parts[0]
    }
  } catch (error) {
    console.error('Error al cargar perfil:', error)
  } finally {
    cargando.value = false
  }
})

// Methods
const onCIExtensionChange = () => {
  if (ciNumero.value) {
    profileStore.personalData.ci = `${ciNumero.value} ${ciExtension.value}`
  }
}

const onPhoneCodeChange = () => {
  if (phoneNumber.value) {
    profileStore.personalData.numeroCelular = `${phoneCode.value} ${phoneNumber.value}`
  }
}

const handleUpdatePersonalData = async () => {
  localError.value = null
  savingPersonal.value = true

  try {
    const result = await profileStore.updatePersonalData()
    if (result.success) {
      showSuccess(result.message || 'Datos personales actualizados exitosamente')
    } else {
      localError.value = result.error
    }
  } catch (error) {
    localError.value = error.message
  } finally {
    savingPersonal.value = false
  }
}

const handleUpdateEmail = async () => {
  localError.value = null
  savingEmail.value = true

  try {
    const result = await profileStore.updateEmail()
    if (result.success) {
      showSuccess(result.message || 'Correo actualizado exitosamente')
    } else {
      localError.value = result.error
    }
  } catch (error) {
    localError.value = error.message
  } finally {
    savingEmail.value = false
  }
}

const handleUpdatePassword = async () => {
  localError.value = null
  savingPassword.value = true

  try {
    const result = await profileStore.updatePassword()
    if (result.success) {
      showSuccess(result.message || 'Contraseña actualizada exitosamente')
    } else {
      localError.value = result.error
    }
  } catch (error) {
    localError.value = error.message
  } finally {
    savingPassword.value = false
  }
}

const handleUpdateAddress = async () => {
  localError.value = null
  savingAddress.value = true

  try {
    const result = await profileStore.updateAddress()
    if (result.success) {
      showSuccess(result.message || 'Dirección actualizada exitosamente')
    } else {
      localError.value = result.error
    }
  } catch (error) {
    localError.value = error.message
  } finally {
    savingAddress.value = false
  }
}

const showSuccess = (message) => {
  successMessage.value = message
  showSuccessMessage.value = true
  setTimeout(() => {
    showSuccessMessage.value = false
  }, 5000)
}

const userInitials = computed(() => {
  if (!profileStore.profileData?.persona) return '?'
  const nombres = profileStore.profileData.persona.nombres || ''
  const apellido = profileStore.profileData.persona.primerApellido || ''
  return `${nombres.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
})
</script>

<template>
  <div>
    <!-- Loader -->
    <div v-if="cargando" class="min-h-screen bg-background flex items-center justify-center">
      <div class="text-center">
        <Loader2 class="inline-block animate-spin h-12 w-12 text-primary mb-4" />
        <p class="text-secondary">Cargando perfil...</p>
      </div>
    </div>

    <!-- Contenido Principal -->
    <AppLayout v-else>
      <div class="space-y-4">
        <!-- Header -->
        <div>
          <h1 class="text-2xl font-bold text-neutral">Mi Perfil</h1>
          <p class="text-secondary text-sm mt-1">
            Gestiona tu información personal y configuración de cuenta
          </p>
        </div>

        <!-- Success Message -->
        <transition
          enter-active-class="transition ease-out duration-300"
          enter-from-class="opacity-0 translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-2"
        >
          <div
            v-if="showSuccessMessage"
            class="bg-green-500 rounded-lg p-3 shadow-sm"
          >
            <div class="flex items-center gap-2">
              <CheckCircle2 class="w-4 h-4 text-white flex-shrink-0" />
              <p class="text-sm font-medium text-white">
                {{ successMessage }}
              </p>
            </div>
          </div>
        </transition>

        <!-- Error Message -->
        <div
          v-if="localError || profileStore.error"
          class="bg-red-500 rounded-lg p-3 shadow-sm"
        >
          <div class="flex items-center gap-2">
            <AlertCircle class="w-4 h-4 text-white flex-shrink-0" />
            <p class="text-sm font-medium text-white">
              {{ localError || profileStore.error }}
            </p>
          </div>
        </div>

        <!-- Profile Card -->
        <div class="card">
          <!-- Profile Header -->
          <div class="px-4 py-4 border-b border-border">
            <div class="flex items-center gap-3">
              <div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span class="text-lg font-bold text-primary">{{ userInitials }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <h2 class="text-lg font-bold text-neutral truncate">
                  {{ profileStore.nombreCompleto || 'Usuario' }}
                </h2>
                <p class="text-xs text-secondary mt-0.5 truncate">
                  {{ profileStore.emailData.correo }}
                </p>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white mt-1 capitalize">
                  {{ profileStore.userRole }}
                </span>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="border-b border-border overflow-x-auto">
            <nav class="flex -mb-px px-4" aria-label="Tabs">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                @click="activeTab = tab.id; localError = null"
                :class="[
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-secondary hover:text-neutral hover:border-border',
                  'group inline-flex items-center py-3 px-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap'
                ]"
              >
                <component
                  :is="tab.icon"
                  :class="[
                    activeTab === tab.id
                      ? 'text-primary'
                      : 'text-tertiary group-hover:text-secondary',
                    '-ml-0.5 mr-1.5 w-4 h-4'
                  ]"
                />
                <span>{{ tab.name }}</span>
              </button>
            </nav>
          </div>

          <!-- Tab Content -->
          <div class="px-4 py-4">
            <!-- TAB: Datos Personales -->
            <div v-if="activeTab === 'personal'" class="space-y-4">
              <!-- Advertencia para transportistas -->
              <div
                v-if="profileStore.isTransportista"
                class="bg-blue-500 rounded-lg p-3 shadow-sm"
              >
                <div class="flex items-start gap-2">
                  <Info class="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                  <div class="text-xs text-white">
                    <p class="font-semibold mb-0.5">Restricciones para transportistas</p>
                    <p>
                      Por seguridad en la trazabilidad, los transportistas no pueden modificar su CI ni número de celular.
                    </p>
                  </div>
                </div>
              </div>

              <form @submit.prevent="handleUpdatePersonalData" class="space-y-4">
                <!-- Nombres -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label for="nombres" class="block text-xs font-medium text-secondary mb-1">
                      Nombre(s) <span class="text-red-500">*</span>
                    </label>
                    <input
                      id="nombres"
                      type="text"
                      v-model="profileStore.personalData.nombres"
                      placeholder="Nombres"
                      required
                      class="text-sm"
                    />
                  </div>

                  <div>
                    <label for="primer_apellido" class="block text-xs font-medium text-secondary mb-1">
                      Apellido Paterno <span class="text-red-500">*</span>
                    </label>
                    <input
                      id="primer_apellido"
                      type="text"
                      v-model="profileStore.personalData.primerApellido"
                      placeholder="Primer Apellido"
                      required
                      class="text-sm"
                    />
                  </div>

                  <div>
                    <label for="segundo_apellido" class="block text-xs font-medium text-secondary mb-1">
                      Apellido Materno
                    </label>
                    <input
                      id="segundo_apellido"
                      type="text"
                      v-model="profileStore.personalData.segundoApellido"
                      placeholder="Segundo Apellido"
                      class="text-sm"
                    />
                  </div>
                </div>

                <!-- CI y Fecha de Nacimiento -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label for="ci" class="block text-xs font-medium text-secondary mb-1">
                      Carnet de Identidad <span class="text-red-500">*</span>
                    </label>
                    <div class="flex gap-2">
                      <input
                        id="ci"
                        type="text"
                        v-model="ciNumero"
                        placeholder="1234567"
                        :disabled="!profileStore.canEditCI"
                        class="flex-1 text-sm"
                        maxlength="9"
                        required
                      />
                      <div class="relative min-w-[70px]">
                        <select
                          v-model="ciExtension"
                          @change="onCIExtensionChange"
                          :disabled="!profileStore.canEditCI"
                          class="appearance-none w-full pl-2 pr-7 text-sm"
                        >
                          <option v-for="ext in ciExtensions" :key="ext.code" :value="ext.code">
                            {{ ext.code }}
                          </option>
                        </select>
                        <ChevronDown class="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-tertiary pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label for="fecha_nacimiento" class="block text-xs font-medium text-secondary mb-1">
                      Fecha de Nacimiento <span class="text-red-500">*</span>
                    </label>
                    <input
                      id="fecha_nacimiento"
                      type="date"
                      v-model="profileStore.personalData.fechaNacimiento"
                      required
                      class="text-sm"
                    />
                  </div>
                </div>

                <!-- Celular y Género -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label for="numero_celular" class="block text-xs font-medium text-secondary mb-1">
                      Número de Celular <span class="text-red-500">*</span>
                    </label>
                    <div class="flex gap-2">
                      <div class="relative min-w-[110px]">
                        <select
                          v-model="phoneCode"
                          @change="onPhoneCodeChange"
                          :disabled="!profileStore.canEditPhone"
                          class="appearance-none w-full pl-2 pr-7 text-sm"
                        >
                          <option v-for="code in phoneCodes" :key="code.code" :value="code.code">
                            {{ code.flag }} {{ code.code }}
                          </option>
                        </select>
                        <ChevronDown class="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-tertiary pointer-events-none" />
                      </div>
                      <input
                        id="numero_celular"
                        type="tel"
                        v-model="phoneNumber"
                        placeholder="71234567"
                        :disabled="!profileStore.canEditPhone"
                        class="flex-1 text-sm"
                        maxlength="15"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label for="genero" class="block text-xs font-medium text-secondary mb-1">
                      Género
                    </label>
                    <select
                      id="genero"
                      v-model="profileStore.personalData.genero"
                      class="text-sm"
                    >
                      <option value="">Seleccionar</option>
                      <option v-for="genero in generos" :key="genero" :value="genero">
                        {{ genero }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- Botón de guardar -->
                <div class="flex justify-end pt-3 border-t border-border">
                  <button
                    type="submit"
                    :disabled="savingPersonal"
                    class="btn flex items-center gap-2 text-sm"
                  >
                    <Save class="w-4 h-4" />
                    <span v-if="savingPersonal">Guardando...</span>
                    <span v-else>Guardar cambios</span>
                  </button>
                </div>
              </form>
            </div>

            <!-- TAB: Correo Electrónico -->
            <div v-else-if="activeTab === 'email'" class="space-y-4">
              <div class="bg-blue-500 rounded-lg p-3 shadow-sm">
                <div class="flex items-start gap-2">
                  <Info class="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                  <p class="text-xs text-white">
                    Por seguridad, necesitas ingresar tu contraseña actual para cambiar tu correo electrónico.
                  </p>
                </div>
              </div>

              <form @submit.prevent="handleUpdateEmail" class="space-y-4">
                <div>
                  <label for="correo_nuevo" class="block text-xs font-medium text-secondary mb-1">
                    Nuevo Correo Electrónico <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="correo_nuevo"
                    type="email"
                    v-model="profileStore.emailData.correo"
                    placeholder="nuevo@ejemplo.com"
                    required
                    class="text-sm"
                  />
                </div>

                <div>
                  <label for="contrasena_actual_email" class="block text-xs font-medium text-secondary mb-1">
                    Contraseña Actual <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <input
                      id="contrasena_actual_email"
                      :type="showEmailPassword ? 'text' : 'password'"
                      v-model="profileStore.emailData.contrasenaActual"
                      placeholder="Contraseña actual"
                      autocomplete="new-password"
                      required
                      class="text-sm pr-10"
                    />
                    <button
                      type="button"
                      @click="showEmailPassword = !showEmailPassword"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary"
                    >
                      <Eye v-if="showEmailPassword" class="w-4 h-4" />
                      <EyeOff v-else class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div class="flex justify-end pt-3 border-t border-border">
                  <button
                    type="submit"
                    :disabled="savingEmail"
                    class="btn flex items-center gap-2 text-sm"
                  >
                    <Save class="w-4 h-4" />
                    <span v-if="savingEmail">Guardando...</span>
                    <span v-else>Actualizar correo</span>
                  </button>
                </div>
              </form>
            </div>

            <!-- TAB: Contraseña -->
            <div v-else-if="activeTab === 'password'" class="space-y-4">
              <div class="bg-blue-500 rounded-lg p-3 shadow-sm">
                <div class="flex items-start gap-2">
                  <Info class="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                  <div class="text-xs text-white">
                    <p class="font-semibold mb-1">Requisitos de seguridad:</p>
                    <p>Mínimo 8 caracteres, combina mayúsculas, minúsculas, números y símbolos.</p>
                  </div>
                </div>
              </div>

              <form @submit.prevent="handleUpdatePassword" class="space-y-4">
                <div>
                  <label for="contrasena_actual" class="block text-xs font-medium text-secondary mb-1">
                    Contraseña Actual <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <input
                      id="contrasena_actual"
                      :type="showCurrentPassword ? 'text' : 'password'"
                      v-model="profileStore.passwordData.contrasenaActual"
                      placeholder="Contraseña actual"
                      autocomplete="current-password"
                      required
                      class="text-sm pr-10"
                    />
                    <button
                      type="button"
                      @click="showCurrentPassword = !showCurrentPassword"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary"
                    >
                      <Eye v-if="showCurrentPassword" class="w-4 h-4" />
                      <EyeOff v-else class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label for="nueva_contrasena" class="block text-xs font-medium text-secondary mb-1">
                    Nueva Contraseña <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <input
                      id="nueva_contrasena"
                      :type="showNewPassword ? 'text' : 'password'"
                      v-model="profileStore.passwordData.nuevaContrasena"
                      placeholder="Nueva contraseña"
                      autocomplete="new-password"
                      required
                      class="text-sm pr-10"
                    />
                    <button
                      type="button"
                      @click="showNewPassword = !showNewPassword"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary"
                    >
                      <Eye v-if="showNewPassword" class="w-4 h-4" />
                      <EyeOff v-else class="w-4 h-4" />
                    </button>
                  </div>
                  
                  <!-- Indicador de fortaleza -->
                  <div v-if="profileStore.passwordData.nuevaContrasena" class="mt-2">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs text-secondary">Fortaleza:</span>
                      <span class="text-xs font-medium text-white">
                        {{ passwordStrength.text }}
                      </span>
                    </div>
                    <div class="w-full bg-border h-1.5 rounded-full overflow-hidden">
                      <div
                        class="h-full transition-all duration-300"
                        :class="passwordStrength.color"
                        :style="{ width: `${(passwordStrength.level + 1) * 20}%` }"
                      ></div>
                    </div>
                  </div>
                </div>

                <div>
                  <label for="confirmar_contrasena" class="block text-xs font-medium text-secondary mb-1">
                    Confirmar Nueva Contraseña <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <input
                      id="confirmar_contrasena"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      v-model="profileStore.passwordData.confirmarContrasena"
                      placeholder="Confirmar contraseña"
                      autocomplete="new-password"
                      required
                      class="text-sm pr-10"
                    />
                    <button
                      type="button"
                      @click="showConfirmPassword = !showConfirmPassword"
                      class="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary"
                    >
                      <Eye v-if="showConfirmPassword" class="w-4 h-4" />
                      <EyeOff v-else class="w-4 h-4" />
                    </button>
                  </div>

                  <!-- Validación de coincidencia -->
                  <div v-if="passwordsMatch !== null" class="mt-1.5 flex items-center gap-1.5">
                    <CheckCircle2 v-if="passwordsMatch" class="w-3.5 h-3.5 text-green-500" />
                    <AlertCircle v-else class="w-3.5 h-3.5 text-red-500" />
                    <span class="text-xs" :class="passwordsMatch ? 'text-green-500' : 'text-red-500'">
                      {{ passwordsMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden' }}
                    </span>
                  </div>
                </div>

                <div class="flex justify-end pt-3 border-t border-border">
                  <button
                    type="submit"
                    :disabled="savingPassword || passwordsMatch === false"
                    class="btn flex items-center gap-2 text-sm"
                  >
                    <Save class="w-4 h-4" />
                    <span v-if="savingPassword">Guardando...</span>
                    <span v-else>Cambiar contraseña</span>
                  </button>
                </div>
              </form>
            </div>

            <!-- TAB: Dirección -->
            <div v-else-if="activeTab === 'address'" class="space-y-4">
              <div class="bg-blue-500 rounded-lg p-3 shadow-sm">
                <div class="flex items-start gap-2">
                  <Info class="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                  <p class="text-xs text-white">
                    Esta información será utilizada para correspondencia y documentación oficial.
                  </p>
                </div>
              </div>

              <form @submit.prevent="handleUpdateAddress" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label for="departamento" class="block text-xs font-medium text-secondary mb-1">
                      Departamento
                    </label>
                    <select
                      id="departamento"
                      v-model="profileStore.personalData.departamento"
                      class="text-sm"
                    >
                      <option value="">Seleccionar</option>
                      <option v-for="depto in departamentos" :key="depto" :value="depto">
                        {{ depto }}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label for="provincia" class="block text-xs font-medium text-secondary mb-1">
                      Provincia
                    </label>
                    <input
                      id="provincia"
                      type="text"
                      v-model="profileStore.personalData.provincia"
                      placeholder="Provincia"
                      class="text-sm"
                    />
                  </div>

                  <div>
                    <label for="municipio" class="block text-xs font-medium text-secondary mb-1">
                      Municipio
                    </label>
                    <input
                      id="municipio"
                      type="text"
                      v-model="profileStore.personalData.municipio"
                      placeholder="Municipio"
                      class="text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label for="direccion" class="block text-xs font-medium text-secondary mb-1">
                    Dirección Completa
                  </label>
                  <textarea
                    id="direccion"
                    v-model="profileStore.personalData.direccion"
                    rows="2"
                    placeholder="Calle, número, zona..."
                    class="text-sm"
                  ></textarea>
                </div>

                <div class="flex justify-end pt-3 border-t border-border">
                  <button
                    type="submit"
                    :disabled="savingAddress"
                    class="btn flex items-center gap-2 text-sm"
                  >
                    <Save class="w-4 h-4" />
                    <span v-if="savingAddress">Guardando...</span>
                    <span v-else>Guardar dirección</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  </div>
</template>