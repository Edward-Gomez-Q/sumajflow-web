<script setup>
import { computed } from 'vue'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Briefcase, FileText, Mail, Phone, Hash, MapPin, Sparkles, CheckCircle, Info, AlertTriangle, Building2, Package, Warehouse, TestTube, Globe } from 'lucide-vue-next'
import AddressForm from '../../shared/AddressForm.vue'
import FileUpload from '../../../common/FileUpload.vue'
import { usePublicDataStore } from '@/stores/publicDataStore'

const onboardingStore = useOnboardingStore()
const publicDataStore = usePublicDataStore()

const comercializadoraData = computed({
  get: () => onboardingStore.comercializadoraData,
  set: (val) => {
    onboardingStore.comercializadoraData = val
  }
})

// Minerales disponibles desde el backend
const availableMinerals = computed(() => publicDataStore.minerales)

const updateField = (field, value) => {
  comercializadoraData.value = {
    ...comercializadoraData.value,
    [field]: value
  }
}

const updateAddress = (addressData) => {
  comercializadoraData.value = {
    ...comercializadoraData.value,
    ...addressData
  }
}

const toggleMineral = (mineralId) => {
  const index = comercializadoraData.value.minerales_comercializados.indexOf(mineralId)
  if (index > -1) {
    comercializadoraData.value.minerales_comercializados.splice(index, 1)
  } else {
    comercializadoraData.value.minerales_comercializados.push(mineralId)
  }
}

// Validación
const isFormValid = computed(() => {
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
})
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-lg bg-primary/10 center">
          <Briefcase class="w-5 h-5 text-primary" />
        </div>
        <h2 class="text-2xl font-semibold text-neutral">Datos de la Comercializadora</h2>
      </div>
      
      <p class="text-sm text-secondary leading-relaxed">
        Información legal y operativa de tu empresa comercializadora de minerales
      </p>
    </div>

    <!-- Información contextual -->
    <div class="bg-blue-100/70 dark:bg-blue-900/40 border border-blue-400/60 dark:border-blue-700 rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200">
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-blue-200/50 dark:bg-blue-800/50 center shrink-0">
          <Info class="w-4 h-4 text-blue-700 dark:text-blue-300" />
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
          <h3 class="text-sm font-semibold text-neutral mb-1 flex items-center gap-2">
            <FileText class="w-4 h-4 text-primary" />
            Información Legal
          </h3>
          <p class="text-sm text-secondary leading-relaxed">
            Datos registrados ante autoridades mineras y tributarias
          </p>
        </div>

        <div class="grid grid-cols-1 gap-4">
          <div class="input-group">
            <label for="razon-social" class="input-label">
              Razón Social <span class="text-error">*</span>
            </label>
            <div class="relative">
              <Building2 class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary pointer-events-none" />
              <input
                id="razon-social"
                type="text"
                :value="comercializadoraData.razon_social"
                @input="updateField('razon_social', $event.target.value)"
                placeholder="Comercializadora Minera XX S.A."
                class="w-full pl-10"
                required
              />
            </div>
            <p class="input-helper">
              Nombre legal completo registrado en FUNDEMPRESA
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="input-group">
              <label for="nit" class="input-label">
                NIT <span class="text-error">*</span>
              </label>
              <div class="relative">
                <Hash class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary pointer-events-none" />
                <input
                  id="nit"
                  type="text"
                  :value="comercializadoraData.nit"
                  @input="updateField('nit', $event.target.value)"
                  placeholder="1234567890"
                  class="w-full pl-10"
                  required
                />
              </div>
              <p class="input-helper">
                Número de Identificación Tributaria
              </p>
            </div>

            <div class="input-group">
              <label for="nim" class="input-label">
                NIM <span class="text-error">*</span>
              </label>
              <div class="relative">
                <Hash class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary pointer-events-none" />
                <input
                  id="nim"
                  type="number"
                  :value="comercializadoraData.nim"
                  @input="updateField('nim', parseInt($event.target.value) || 0)"
                  placeholder="12345"
                  class="w-full pl-10"
                  required
                />
              </div>
              <p class="input-helper">
                Número de Identificación Minera
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Sección: Información de Contacto -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1 flex items-center gap-2">
            <Mail class="w-4 h-4 text-primary" />
            Información de Contacto
          </h3>
          <p class="text-sm text-secondary leading-relaxed">
            Datos de contacto para comunicaciones comerciales
          </p>
        </div>

        <div class="grid grid-cols-1 gap-4">
          <div class="input-group">
            <label for="correo-contacto" class="input-label">
              Correo de Contacto <span class="text-error">*</span>
            </label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary pointer-events-none" />
              <input
                id="correo-contacto"
                type="email"
                :value="comercializadoraData.correo_contacto"
                @input="updateField('correo_contacto', $event.target.value)"
                placeholder="contacto@comercializadora.com"
                class="w-full pl-10"
                required
              />
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
                <Phone class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary pointer-events-none" />
                <input
                  id="telefono-fijo"
                  type="tel"
                  :value="comercializadoraData.numero_telefono_fijo"
                  @input="updateField('numero_telefono_fijo', $event.target.value)"
                  placeholder="26234567"
                  class="w-full pl-10"
                />
              </div>
              <p class="input-helper">
                Teléfono de oficina (opcional)
              </p>
            </div>

            <div class="input-group">
              <label for="telefono-movil" class="input-label">
                Teléfono Móvil
              </label>
              <div class="relative">
                <Phone class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary pointer-events-none" />
                <input
                  id="telefono-movil"
                  type="tel"
                  :value="comercializadoraData.numero_telefono_movil"
                  @input="updateField('numero_telefono_movil', $event.target.value)"
                  placeholder="70123456"
                  class="w-full pl-10"
                />
              </div>
              <p class="input-helper">
                Celular de contacto (opcional)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Sección: Minerales que Comercializa -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1 flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-primary" />
            Minerales que Comercializa
            <span class="text-error">*</span>
          </h3>
          <p class="text-sm text-secondary leading-relaxed">
            Selecciona todos los tipos de concentrados que tu empresa comercializa
          </p>
        </div>
        
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <button
            v-for="mineral in availableMinerals"
            :key="mineral.id"
            @click="toggleMineral(mineral.id)"
            type="button"
            class="relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:shadow-md"
            :class="comercializadoraData.minerales_comercializados.includes(mineral.id)
              ? 'bg-primary border-primary shadow-lg'
              : 'bg-surface border-border hover:border-primary/50'"
          >
            <!-- Checkmark -->
            <div 
              v-if="comercializadoraData.minerales_comercializados.includes(mineral.id)"
              class="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/20 center"
            >
              <CheckCircle class="w-3 h-3 text-white" />
            </div>
            
            <!-- Símbolo químico -->
            <span 
              class="text-3xl font-bold"
              :class="comercializadoraData.minerales_comercializados.includes(mineral.id) ? 'text-white' : 'text-primary'"
            >
              {{ mineral.nomenclatura }}
            </span>
            
            <!-- Nombre del mineral -->
            <span 
              class="text-xs font-semibold text-center"
              :class="comercializadoraData.minerales_comercializados.includes(mineral.id) ? 'text-white' : 'text-neutral'"
            >
              {{ mineral.nombre }}
            </span>
          </button>
        </div>

        <!-- Contador de minerales -->
        <div
          v-if="comercializadoraData.minerales_comercializados.length > 0"
          class="inline-flex items-center gap-3 px-4 py-2 rounded-lg border border-green-400/60 bg-green-100/70 dark:border-green-700 dark:bg-green-900/40 shadow-sm backdrop-blur-[2px] transition-all duration-200"
        >
          <div class="w-6 h-6 rounded-full bg-green-200/50 dark:bg-green-800/50 center shrink-0">
            <CheckCircle class="w-3.5 h-3.5 text-green-700 dark:text-green-300" />
          </div>
          <span class="text-sm font-medium text-neutral">
            {{ comercializadoraData.minerales_comercializados.length }}
            <span class="text-secondary">
              {{ comercializadoraData.minerales_comercializados.length === 1 ? 'mineral seleccionado' : 'minerales seleccionados' }}
            </span>
          </span>
        </div>

        <!-- Advertencia si no hay minerales -->
        <div
          v-else
          class="bg-orange-100/70 dark:bg-orange-900/40 border border-orange-400/60 dark:border-orange-700 rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200"
        >
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-orange-200/50 dark:bg-orange-800/50 center shrink-0">
              <AlertTriangle class="w-4 h-4 text-orange-700 dark:text-orange-300" />
            </div>
            <p class="text-sm text-neutral">
              Debes seleccionar al menos un tipo de mineral para comercializar
            </p>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Sección: Licencia de Comercialización -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1 flex items-center gap-2">
            <FileText class="w-4 h-4 text-primary" />
            Licencia de Comercialización
          </h3>
          <p class="text-sm text-secondary leading-relaxed">
            Documento legal requerido para operaciones comerciales mineras
          </p>
        </div>

        <div class="space-y-4">
          <div class="input-group">
            <label for="numero-licencia" class="input-label">
              Número de Licencia de Comercialización <span class="text-error">*</span>
            </label>
            <input
              id="numero-licencia"
              type="text"
              :value="comercializadoraData.numero_licencia"
              @input="updateField('numero_licencia', $event.target.value)"
              placeholder="LCOM-001-2024"
              class="w-full"
              required
            />
            <p class="input-helper">
              Licencia otorgada por SENARECOM o autoridad competente
            </p>
          </div>

          <FileUpload
            :model-value="comercializadoraData.licencia_url"
            @update:model-value="updateField('licencia_url', $event)"
            label="Documento de Licencia de Comercialización"
            helper-text="Archivo PDF de la licencia vigente"
            accept=".pdf"
            :max-size="10"
            :required="true"
          />
        </div>

        <!-- Advertencia sobre licencia -->
        <div class="bg-orange-100/70 dark:bg-orange-900/40 border border-orange-400/60 dark:border-orange-700 rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-orange-200/50 dark:bg-orange-800/50 center shrink-0">
              <AlertTriangle class="w-4 h-4 text-orange-700 dark:text-orange-300" />
            </div>
            <div class="text-sm">
              <p class="font-medium text-neutral mb-1">Requisito obligatorio</p>
              <p class="text-secondary leading-relaxed">
                La licencia de comercialización es obligatoria para operar legalmente en Bolivia. 
                Debe estar vigente y autorizar específicamente los minerales que comercializas.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Sección: Sede Operativa -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1 flex items-center gap-2">
            <MapPin class="w-4 h-4 text-primary" />
            Sede Operativa Principal
          </h3>
          <p class="text-sm text-secondary leading-relaxed">
            Dirección principal donde opera la comercializadora
          </p>
        </div>

        <AddressForm
          :model-value="{
            departamento: comercializadoraData.departamento,
            provincia: comercializadoraData.provincia,
            municipio: comercializadoraData.municipio,
            direccion: comercializadoraData.direccion,
            latitud: comercializadoraData.latitud,
            longitud: comercializadoraData.longitud
          }"
          @update:model-value="updateAddress"
          :show-map="true"
        />
      </div>
    </div>

    <!-- Estado de validación -->
    <div
      v-if="isFormValid"
      class="bg-green-100/70 dark:bg-green-900/40 border border-green-400/60 dark:border-green-700 rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200"
    >
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-green-200/50 dark:bg-green-800/50 center shrink-0">
          <CheckCircle class="w-4 h-4 text-green-700 dark:text-green-300" />
        </div>
        <div class="flex-1 text-sm">
          <p class="font-medium text-neutral mb-2">Información básica completa</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-secondary leading-relaxed">
            <div>
              <span class="font-medium text-neutral">Empresa:</span> {{ comercializadoraData.razon_social }}
            </div>
            <div>
              <span class="font-medium text-neutral">NIT:</span> {{ comercializadoraData.nit }}
            </div>
            <div class="col-span-2">
              <span class="font-medium text-neutral">Minerales:</span> {{ comercializadoraData.minerales_comercializados.length }} tipos seleccionados
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actividades de una comercializadora -->
    <div class="space-y-4">
      <div>
        <h3 class="text-sm font-semibold text-neutral mb-1 flex items-center gap-2">
          <Package class="w-4 h-4 text-primary" />
          Actividades Principales
        </h3>
        <p class="text-sm text-secondary leading-relaxed">
          Operaciones típicas de una comercializadora minera
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Compra de Concentrados -->
        <div class="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/20 center shrink-0">
              <Package class="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div class="flex-1">
              <p class="font-medium text-neutral text-sm mb-1">Compra de Concentrados</p>
              <p class="text-xs text-secondary leading-relaxed">
                Adquisición de concentrados de ingenios y cooperativas
              </p>
            </div>
          </div>
        </div>

        <!-- Almacenamiento -->
        <div class="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 center shrink-0">
              <Warehouse class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div class="flex-1">
              <p class="font-medium text-neutral text-sm mb-1">Almacenamiento</p>
              <p class="text-xs text-secondary leading-relaxed">
                Custodia segura de concentrados hasta su comercialización
              </p>
            </div>
          </div>
        </div>

        <!-- Análisis de Calidad -->
        <div class="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 center shrink-0">
              <TestTube class="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div class="flex-1">
              <p class="font-medium text-neutral text-sm mb-1">Análisis de Calidad</p>
              <p class="text-xs text-secondary leading-relaxed">
                Certificación de leyes y contenido de minerales
              </p>
            </div>
          </div>
        </div>

        <!-- Exportación -->
        <div class="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/20 center shrink-0">
              <Globe class="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div class="flex-1">
              <p class="font-medium text-neutral text-sm mb-1">Exportación</p>
              <p class="text-xs text-secondary leading-relaxed">
                Venta y exportación al mercado internacional
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
