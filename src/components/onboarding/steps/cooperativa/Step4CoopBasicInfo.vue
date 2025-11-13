<script setup>
import { ref, computed } from 'vue'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Users, FileText, Phone, Mail, ChevronDown, CheckCircle2 } from 'lucide-vue-next'
import AddressForm from '../../shared/AddressForm.vue'
import { Building2 } from 'lucide-vue-next'

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

const cooperativaData = computed({
  get: () => onboardingStore.cooperativaData,
  set: (val) => {
    onboardingStore.cooperativaData = val
  }
})

const updateField = (field, value) => {
  cooperativaData.value = {
    ...cooperativaData.value,
    [field]: value
  }
}

const updateAddress = (addressData) => {
  cooperativaData.value = {
    ...cooperativaData.value,
    ...addressData
  }
}

// Actualizar teléfono móvil con formato
const updatePhone = (value) => {
  phoneNumber.value = value.replace(/[^0-9]/g, '')
  cooperativaData.value.numero_telefono_movil = phoneNumber.value ? `${phoneCode.value} ${phoneNumber.value}` : ''
}

// Cambio de código de teléfono
const onPhoneCodeChange = () => {
  if (phoneNumber.value) {
    cooperativaData.value.numero_telefono_movil = `${phoneCode.value} ${phoneNumber.value}`
  }
}

// Inicializar phoneNumber si ya hay un valor guardado
if (cooperativaData.value.numero_telefono_movil) {
  const parts = cooperativaData.value.numero_telefono_movil.split(' ')
  if (parts.length > 1) {
    phoneCode.value = parts[0]
    phoneNumber.value = parts.slice(1).join('')
  }
}

const isFormValid = computed(() => {
  return (
    cooperativaData.value.razon_social?.trim() !== '' &&
    cooperativaData.value.nit?.trim() !== '' &&
    cooperativaData.value.nim > 0 &&
    cooperativaData.value.correo_contacto?.trim() !== '' &&
    cooperativaData.value.direccion?.trim() !== ''
  )
})
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-lg bg-primary/10 center">
          <Users class="w-5 h-5 text-primary" />
        </div>
        <h2 class="text-2xl font-semibold text-neutral">Datos de la Cooperativa</h2>
      </div>
      
      <p class="text-sm text-secondary leading-relaxed">
        Información legal y de contacto de tu organización cooperativista
      </p>
    </div>

    <!-- Información contextual -->
    <div class="bg-info/10 border border-info/30 rounded-lg p-4">
      <div class="flex gap-3">
        <div class="text-info text-xl flex-shrink-0">
          <Building2 class="w-5 h-5" />
        </div>
        <div class="text-sm">
          <p class="font-medium text-neutral mb-1">¿Qué es una comercializadora minera?</p>
          <p class="text-secondary leading-relaxed">
            Las comercializadoras son empresas especializadas en la compra, almacenamiento y venta de 
            concentrados minerales. Actúan como intermediarios entre ingenios/cooperativas y el mercado 
            internacional, facilitando la exportación y optimizando precios.
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
                :value="cooperativaData.razon_social"
                @input="updateField('razon_social', $event.target.value)"
                placeholder="Cooperativa Minera 15 de Agosto LTDA"
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
              :value="cooperativaData.nit"
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
              :value="cooperativaData.nim"
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
                :value="cooperativaData.correo_contacto"
                @input="updateField('correo_contacto', $event.target.value)"
                placeholder="contacto@cooperativa.com"
                class="w-full pl-10"
                required
              />
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary pointer-events-none" />
            </div>
            <p class="input-helper">
              Correo principal para notificaciones del sistema
            </p>
          </div>

          <div class="grid grid-cols-1 gap-4">
            <div class="input-group">
              <label for="telefono-fijo" class="input-label">
                Teléfono Fijo
              </label>
              <div class="relative">
                <input
                  id="telefono-fijo"
                  type="tel"
                  :value="cooperativaData.numero_telefono_fijo"
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
          </div>
          <div class="grid grid-cols-1 gap-4">
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
      <AddressForm
        :model-value="cooperativaData"
        @update:model-value="updateAddress"
        label="Sede Operativa Principal"
        helper-text="Dirección principal donde opera la cooperativa"
        :show-map="true"
      />
    </div>

    <!-- Estado de validación -->
    <div
      v-if="isFormValid"
      class="bg-green-100/70 dark:bg-green-900/40 border border-green-400/60 dark:border-green-700 rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-green-200/50 dark:bg-green-800/50 center">
          <CheckCircle2 class="w-5 h-5 text-green-700 dark:text-green-300" />
        </div>
        <div class="text-sm">
          <p class="font-medium text-neutral mb-1">
            Información básica completa
          </p>
          <p class="text-secondary leading-relaxed">
            {{ cooperativaData.razon_social }} – NIT: {{ cooperativaData.nit }}
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