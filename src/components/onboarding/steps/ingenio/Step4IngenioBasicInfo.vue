<script setup>
import { ref, computed } from 'vue'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Building2, FileText, Phone, Mail, AlertCircle, CheckCircle2, ChevronRight, ChevronDown } from 'lucide-vue-next'
import AddressForm from '../../shared/AddressForm.vue'

const onboardingStore = useOnboardingStore()

const phoneCode = ref('+591')
const phoneNumber = ref('')

// Códigos de teléfono
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

const ingenioData = computed({
  get: () => onboardingStore.ingenioData,
  set: (val) => {
    onboardingStore.ingenioData = val
  }
})

const updateField = (field, value) => {
  ingenioData.value = {
    ...ingenioData.value,
    [field]: value
  }
}

const updateAddress = (addressData) => {
  ingenioData.value = {
    ...ingenioData.value,
    ...addressData
  }
}

// Actualizar teléfono móvil con formato
const updatePhone = (value) => {
  phoneNumber.value = value.replace(/[^0-9]/g, '')
  ingenioData.value.numero_telefono_movil = phoneNumber.value ? `${phoneCode.value} ${phoneNumber.value}` : ''
}

// Cambio de código de teléfono
const onPhoneCodeChange = () => {
  if (phoneNumber.value) {
    ingenioData.value.numero_telefono_movil = `${phoneCode.value} ${phoneNumber.value}`
  }
}

// Inicializar phoneNumber si ya hay un valor guardado
if (ingenioData.value.numero_telefono_movil) {
  const parts = ingenioData.value.numero_telefono_movil.split(' ')
  if (parts.length > 1) {
    phoneCode.value = parts[0]
    phoneNumber.value = parts.slice(1).join('')
  }
}

// Validación
const isFormValid = computed(() => {
  return (
    ingenioData.value.razon_social?.trim() !== '' &&
    ingenioData.value.nit?.trim() !== '' &&
    ingenioData.value.nim > 0 &&
    ingenioData.value.correo_contacto?.trim() !== '' &&
    ingenioData.value.direccion?.trim() !== ''
  )
})
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-lg bg-primary/10 center">
          <Building2 class="w-5 h-5 text-primary" />
        </div>
        <h2 class="text-2xl font-semibold text-neutral">Datos del Ingenio Minero</h2>
      </div>
      
      <p class="text-sm text-secondary leading-relaxed">
        Información legal y de contacto de tu planta procesadora
      </p>
    </div>

    <!-- Información contextual -->
    <div class="rounded-xl p-4 border border-blue-400/60 bg-blue-100/70 dark:border-blue-700 dark:bg-blue-900/40 shadow-sm backdrop-blur-[2px] transition-all duration-200">
      <div class="flex gap-3">
        <div class="flex-shrink-0 mt-0.5">
          <AlertCircle class="w-5 h-5 text-blue-700 dark:text-blue-300" />
        </div>
        <div class="flex-1">
          <p class="text-sm font-semibold text-blue-950 dark:text-blue-100 mb-1 tracking-tight">
            ¿Qué es un ingenio minero?
          </p>
          <p class="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
            Los ingenios son plantas industriales especializadas en el procesamiento y beneficio de minerales. 
            Reciben mineral crudo y lo transforman en concentrados de mayor valor mediante procesos como 
            chancado, molienda, flotación y secado.
          </p>
        </div>
      </div>
    </div>

    <!-- Contenido del formulario -->
    <div class="space-y-6">
      <!-- Sección: Información Legal -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1">Información Legal</h3>
          <p class="text-sm text-secondary leading-relaxed">
            Datos registrados ante autoridades mineras y tributarias
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="input-group md:col-span-2">
            <label for="razon-social" class="input-label">
              Razón Social <span class="text-error">*</span>
            </label>
            <div class="relative">
              <input
                id="razon-social"
                type="text"
                :value="ingenioData.razon_social"
                @input="updateField('razon_social', $event.target.value)"
                placeholder="Ingenio Minero San José S.A."
                class="w-full pl-10"
                required
              />
              <FileText class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary pointer-events-none" />
            </div>
            <p class="input-helper">
              Nombre legal completo registrado en FUNDEMPRESA
            </p>
          </div>

          <div class="input-group">
            <label for="nit" class="input-label">
              NIT <span class="text-error">*</span>
            </label>
            <input
              id="nit"
              type="text"
              :value="ingenioData.nit"
              @input="updateField('nit', $event.target.value)"
              placeholder="1234567890"
              class="w-full"
              required
            />
            <p class="input-helper">
              Número de Identificación Tributaria
            </p>
          </div>

          <div class="input-group">
            <label for="nim" class="input-label">
              NIM <span class="text-error">*</span>
            </label>
            <input
              id="nim"
              type="number"
              :value="ingenioData.nim"
              @input="updateField('nim', parseInt($event.target.value) || 0)"
              placeholder="12345"
              class="w-full"
              required
            />
            <p class="input-helper">
              Número de Identificación Minera otorgado por AJAM
            </p>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Sección: Información de Contacto -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1">Información de Contacto</h3>
          <p class="text-sm text-secondary leading-relaxed">
            Datos de contacto para comunicaciones y coordinaciones
          </p>
        </div>

        <div class="grid grid-cols-1 gap-4">
          <div class="input-group">
            <label for="correo-contacto" class="input-label">
              Correo de Contacto <span class="text-error">*</span>
            </label>
            <div class="relative">
              <input
                id="correo-contacto"
                type="email"
                :value="ingenioData.correo_contacto"
                @input="updateField('correo_contacto', $event.target.value)"
                placeholder="contacto@ingenio.com"
                class="w-full pl-10"
                required
              />
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary pointer-events-none" />
            </div>
            <p class="input-helper">
              Correo principal para notificaciones del sistema
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="input-group">
              <label for="telefono-fijo" class="input-label">
                Teléfono Fijo
              </label>
              <div class="relative">
                <input
                  id="telefono-fijo"
                  type="tel"
                  :value="ingenioData.numero_telefono_fijo"
                  @input="updateField('numero_telefono_fijo', $event.target.value)"
                  placeholder="26234567"
                  class="w-full pl-10"
                />
                <Phone class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary pointer-events-none" />
              </div>
              <p class="input-helper">
                Teléfono de oficina (opcional)
              </p>
            </div>

            <div class="input-group">
              <label for="telefono-movil" class="input-label">
                Teléfono Móvil
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
                  id="telefono-movil"
                  type="tel"
                  :value="phoneNumber"
                  @input="updatePhone($event.target.value)"
                  placeholder="70123456"
                  class="flex-1"
                  maxlength="15"
                />
              </div>
              <p class="input-helper">
                Celular de contacto directo (opcional)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Sección: Sede Operativa Principal -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1">Sede Operativa Principal</h3>
          <p class="text-sm text-secondary leading-relaxed">
            Ubicación de tu planta de procesamiento de minerales
          </p>
        </div>

        <AddressForm
          :model-value="{
            departamento: ingenioData.departamento,
            provincia: ingenioData.provincia,
            municipio: ingenioData.municipio,
            direccion: ingenioData.direccion,
            latitud: ingenioData.latitud,
            longitud: ingenioData.longitud
          }"
          @update:model-value="updateAddress"
          label="Sede Operativa Principal"
          :show-map="true"
        />
      </div>
    </div>

    <!-- Estado de validación -->
    <div v-if="isFormValid" class="rounded-xl p-4 border border-green-400/60 bg-green-100/70 dark:border-green-700 dark:bg-green-900/40 shadow-sm backdrop-blur-[2px] transition-all duration-200">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-green-200/50 dark:bg-green-800/50 center">
          <CheckCircle2 class="w-5 h-5 text-green-700 dark:text-green-300" />
        </div>
        <div>
          <p class="text-sm font-semibold text-green-950 dark:text-green-100">Información básica completa</p>
          <p class="text-sm text-green-900 dark:text-green-200 mt-1">
            {{ ingenioData.razon_social }} - NIT: {{ ingenioData.nit }}
          </p>
        </div>
      </div>
    </div>

    <!-- Próximo paso -->
    <div class="rounded-xl p-4 border border-blue-400/60 bg-blue-100/70 dark:border-blue-700 dark:bg-blue-900/40 shadow-sm backdrop-blur-[2px] transition-all duration-200">
      <div class="flex gap-3">
        <ChevronRight class="w-5 h-5 text-blue-700 dark:text-blue-300 flex-shrink-0 mt-0.5" />
        <p class="text-sm text-blue-900 dark:text-blue-200">
          <span class="font-semibold text-blue-950 dark:text-blue-100">Siguiente paso:</span> Configurarás la información de tu planta de procesamiento, 
          incluyendo capacidad, minerales que procesas y procesos disponibles.
        </p>
      </div>
    </div>

    <!-- Información adicional -->
    <div class="bg-surface border border-border rounded-lg p-4">
      <div class="flex items-center gap-2 mb-3">
        <FileText class="w-5 h-5 text-primary" />
        <h4 class="text-sm font-semibold text-neutral">Documentación Requerida</h4>
      </div>
      <ul class="space-y-2 text-sm text-secondary">
        <li class="flex items-start gap-2">
          <ChevronRight class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <span>Registro de Comercio actualizado</span>
        </li>
        <li class="flex items-start gap-2">
          <ChevronRight class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <span>Licencia Ambiental vigente (LEIA)</span>
        </li>
        <li class="flex items-start gap-2">
          <ChevronRight class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <span>Certificado de operaciones mineras</span>
        </li>
        <li class="flex items-start gap-2">
          <ChevronRight class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <span>Certificados de calibración de equipos</span>
        </li>
      </ul>
      <div class="mt-3 rounded-xl p-3 border border-blue-400/60 bg-blue-100/70 dark:border-blue-700 dark:bg-blue-900/40 shadow-sm backdrop-blur-[2px]">
        <div class="flex gap-2">
          <AlertCircle class="w-4 h-4 text-blue-700 dark:text-blue-300 flex-shrink-0 mt-0.5" />
          <p class="text-xs text-blue-900 dark:text-blue-200">
            Podrás subir estos documentos después del registro desde tu panel de control
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.center {
  @apply flex justify-center items-center;
}
</style>