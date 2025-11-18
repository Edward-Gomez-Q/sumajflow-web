<script setup>
import { ref, computed } from 'vue'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { User, ChevronDown } from 'lucide-vue-next'

const onboardingStore = useOnboardingStore()

const ciExtension = ref('PT')
const phoneCode = ref('+591')

// Extensiones de CI bolivianas
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

// Códigos de teléfono sudamericanos
const phoneCodes = [
  { code: '+591', country: 'Bolivia', flag: '🇧🇴' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+55', country: 'Brasil', flag: '🇧🇷' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+593', country: 'Ecuador', flag: '🇪🇨' },
  { code: '+595', country: 'Paraguay', flag: '🇵🇾' },
  { code: '+51', country: 'Perú', flag: '🇵🇪' },
  { code: '+598', country: 'Uruguay', flag: '🇺🇾' },
  { code: '+58', country: 'Venezuela', flag: '🇻🇪' }
]

const generos = ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir']
const departamentos = ['La Paz', 'Cochabamba', 'Santa Cruz', 'Potosí', 'Oruro', 'Tarija', 'Chuquisaca', 'Beni', 'Pando']

const personalData = computed(() => onboardingStore.personalData)

// Campo local para el número de teléfono (solo números)
const phoneNumber = ref('')

// Update simple field
const updateField = (field, value) => {
  onboardingStore.personalData[field] = value
}

// Extraer solo números del CI para mostrar
const ciNumero = computed({
  get: () => {
    const ci = personalData.value.ci || ''
    return ci.split(' ')[0] || ''
  },
  set: (value) => {
    const cleanCI = value.replace(/[^0-9]/g, '')
    onboardingStore.personalData.ci = cleanCI ? `${cleanCI} ${ciExtension.value}` : ''
  }
})

// Actualizar CI con formato
const updateCI = (value) => {
  const cleanCI = value.replace(/[^0-9]/g, '')
  onboardingStore.personalData.ci = cleanCI ? `${cleanCI} ${ciExtension.value}` : ''
}

// Cambio de extensión de CI
const onCIExtensionChange = () => {
  if (ciNumero.value) {
    onboardingStore.personalData.ci = `${ciNumero.value} ${ciExtension.value}`
  }
}

// Actualizar teléfono con formato
const updatePhone = (value) => {
  phoneNumber.value = value.replace(/[^0-9]/g, '')
  onboardingStore.personalData.numero_celular = phoneNumber.value ? `${phoneCode.value} ${phoneNumber.value}` : ''
}

// Cambio de código de teléfono
const onPhoneCodeChange = () => {
  if (phoneNumber.value) {
    onboardingStore.personalData.numero_celular = `${phoneCode.value} ${phoneNumber.value}`
  }
}

// Inicializar phoneNumber si ya hay un valor guardado
if (personalData.value.numero_celular) {
  const parts = personalData.value.numero_celular.split(' ')
  if (parts.length > 1) {
    phoneCode.value = parts[0]
    phoneNumber.value = parts.slice(1).join('')
  }
}

// Inicializar ciExtension si ya hay un valor guardado
if (personalData.value.ci) {
  const parts = personalData.value.ci.split(' ')
  if (parts.length > 1) {
    ciExtension.value = parts[1]
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-lg bg-primary/10 center">
          <User class="w-5 h-5 text-primary" />
        </div>
        <h2 class="text-2xl font-semibold text-neutral">Datos Personales</h2>
      </div>
      
      <p class="text-sm text-secondary leading-relaxed">
        Esta información se recopila para verificar tu identidad, proteger tu cuenta y cumplir con los requisitos legales y normativos de Bolivia. Para obtener más información, revisa nuestra 
        <a href="#" class="text-primary hover:text-accent font-medium">Política de Privacidad</a>.
      </p>
    </div>

    <!-- Form -->
    <div class="space-y-6">
      <!-- Nombre Legal -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1">Nombre legal</h3>
          <p class="text-sm text-secondary leading-relaxed">
            Ingresa tu nombre exactamente como aparece en tu Carnet de Identidad y otros documentos oficiales.
          </p>
        </div>

        <div class="input-group">
          <label for="nombres" class="input-label">
            Nombre(s) <span class="text-error">*</span>
          </label>
          <input
            id="nombres"
            type="text"
            :value="personalData.nombres"
            @input="updateField('nombres', $event.target.value)"
            placeholder="Nombres"
            class="w-full"
            required
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="input-group">
            <label for="primer_apellido" class="input-label">
              Apellido Paterno <span class="text-error">*</span>
            </label>
            <input
              id="primer_apellido"
              type="text"
              :value="personalData.primer_apellido"
              @input="updateField('primer_apellido', $event.target.value)"
              placeholder="Primer Apellido"
              class="w-full"
              required
            />
          </div>

          <div class="input-group">
            <label for="segundo_apellido" class="input-label">
              Apellido Materno
            </label>
            <input
              id="segundo_apellido"
              type="text"
              :value="personalData.segundo_apellido"
              @input="updateField('segundo_apellido', $event.target.value)"
              placeholder="Segundo Apellido"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Documento de Identidad -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1">Documento de identidad</h3>
          <p class="text-sm text-secondary leading-relaxed">
            Tu Carnet de Identidad será usado para verificar tu identidad. Asegúrate de que los datos coincidan exactamente con tu documento físico.
          </p>
        </div>

        <div class="input-group">
          <label for="ci" class="input-label">
            Carnet de Identidad <span class="text-error">*</span>
          </label>
          <div class="flex gap-2">
            <input
              id="ci"
              type="text"
              v-model="ciNumero"
              placeholder="1234567"
              class="flex-1"
              maxlength="9"
              required
            />
            <div class="relative">
              <select
                v-model="ciExtension"
                @change="onCIExtensionChange"
                class="appearance-none pl-3 pr-8 h-full rounded-lg border border-border bg-surface text-neutral"
              >
                <option v-for="ext in ciExtensions" :key="ext.code" :value="ext.code">
                  {{ ext.code }}
                </option>
              </select>
              <ChevronDown class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary pointer-events-none" />
            </div>
          </div>
          <p class="input-helper">
            Formato: {{ personalData.ci || '1234567 PT' }}
          </p>
        </div>

        <div class="input-group">
          <label for="fecha_nacimiento" class="input-label">
            Fecha de Nacimiento <span class="text-error">*</span>
          </label>
          <input
            id="fecha_nacimiento"
            type="date"
            :value="personalData.fecha_nacimiento"
            @input="updateField('fecha_nacimiento', $event.target.value)"
            class="w-full"
            required
          />
          <p class="input-helper">
            Debes ser mayor de 18 años para registrarte
          </p>
        </div>
      </div>

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Información de Contacto -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1">Información de contacto</h3>
          <p class="text-sm text-secondary leading-relaxed">
            Usaremos estos datos para comunicarnos contigo sobre tu cuenta y transacciones importantes.
          </p>
        </div>

        <div class="input-group">
          <label for="numero_celular" class="input-label">
            Número de Celular <span class="text-error">*</span>
          </label>
          <div class="flex gap-2">
            <div class="relative min-w-[140px]">
              <select
                v-model="phoneCode"
                @change="onPhoneCodeChange"
                class="appearance-none w-full pl-3 pr-8 h-full rounded-lg border border-border bg-surface text-neutral"
              >
                <option v-for="code in phoneCodes" :key="code.code" :value="code.code">
                  {{ code.flag }} {{ code.code }}
                </option>
              </select>
              <ChevronDown class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary pointer-events-none" />
            </div>
            <input
              id="numero_celular"
              type="tel"
              :value="phoneNumber"
              @input="updatePhone($event.target.value)"
              placeholder="71234567"
              class="flex-1"
              maxlength="15"
              required
            />
          </div>
          <p class="input-helper">
            Formato: {{ personalData.numero_celular || '+591 71234567' }}
          </p>
        </div>

        <div class="input-group">
          <label for="genero" class="input-label">
            Género
          </label>
          <select
            id="genero"
            :value="personalData.genero"
            @change="updateField('genero', $event.target.value)"
            class="w-full"
          >
            <option value="">Seleccionar</option>
            <option v-for="genero in generos" :key="genero" :value="genero">
              {{ genero }}
            </option>
          </select>
          <p class="input-helper">Esta información es opcional y privada</p>
        </div>
      </div>

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Dirección -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1">Dirección de residencia</h3>
          <p class="text-sm text-secondary leading-relaxed">
            Tu dirección será usada para fines de verificación y cumplimiento normativo. Asegúrate de proporcionar una dirección válida.
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="input-group">
            <label for="departamento" class="input-label">
              Departamento <span class="text-error">*</span>
            </label>
            <select
              id="departamento"
              :value="personalData.departamento"
              @change="updateField('departamento', $event.target.value)"
              class="w-full"
              required
            >
              <option value="">Seleccionar</option>
              <option v-for="dept in departamentos" :key="dept" :value="dept">
                {{ dept }}
              </option>
            </select>
          </div>

          <div class="input-group">
            <label for="provincia" class="input-label">
              Provincia <span class="text-error">*</span>
            </label>
            <input
              id="provincia"
              type="text"
              :value="personalData.provincia"
              @input="updateField('provincia', $event.target.value)"
              placeholder="Ej: Cercado"
              class="w-full"
              required
            />
          </div>

          <div class="input-group">
            <label for="municipio" class="input-label">
              Municipio <span class="text-error">*</span>
            </label>
            <input
              id="municipio"
              type="text"
              :value="personalData.municipio"
              @input="updateField('municipio', $event.target.value)"
              placeholder="Ej: La Paz"
              class="w-full"
              required
            />
          </div>
        </div>

        <div class="input-group">
          <label for="direccion" class="input-label">
            Dirección completa <span class="text-error">*</span>
          </label>
          <input
            id="direccion"
            type="text"
            :value="personalData.direccion"
            @input="updateField('direccion', $event.target.value)"
            placeholder="Ej: Av. 6 de Agosto #1234, Zona Sopocachi"
            class="w-full"
            required
          />
          <p class="input-helper">
            Incluye calle, número, zona y referencias si es necesario
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

