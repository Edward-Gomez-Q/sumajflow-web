<script setup>
import { computed } from 'vue'
import { useOnboardingStore } from '@/stores/onboardingStore'
import AddressForm from '../../shared/AddressForm.vue'
import FileUpload from '../../../common/FileUpload.vue'

const onboardingStore = useOnboardingStore()

const comercializadoraData = computed({
  get: () => onboardingStore.comercializadoraData,
  set: (val) => {
    onboardingStore.comercializadoraData = val
  }
})

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

// Minerales disponibles para comercialización
const availableMinerals = [
  { id: 'Ag', name: 'Plata', icon: '⚪', description: 'Concentrado de plata' },
  { id: 'Zn', name: 'Zinc', icon: '🔵', description: 'Concentrado de zinc' },
  { id: 'Pb', name: 'Plomo', icon: '⚫', description: 'Concentrado de plomo' },
  { id: 'Sn', name: 'Estaño', icon: '⚪', description: 'Concentrado de estaño' },
  { id: 'Au', name: 'Oro', icon: '🟡', description: 'Oro refinado' },
  { id: 'Cu', name: 'Cobre', icon: '🟠', description: 'Concentrado de cobre' },
  { id: 'W', name: 'Wolframio', icon: '⚪', description: 'Concentrado de wolframio' },
  { id: 'Sb', name: 'Antimonio', icon: '⚫', description: 'Concentrado de antimonio' }
]

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
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 rounded-lg bg-primary/10 center text-2xl">
        💼
      </div>
      <div>
        <h2 class="text-2xl font-semibold text-neutral">Datos de la Comercializadora</h2>
        <p class="text-sm text-secondary">Información legal y de operaciones comerciales</p>
      </div>
    </div>

    <!-- Información contextual -->
    <div class="bg-info/10 border border-info/30 rounded-lg p-4">
      <div class="flex gap-3">
        <div class="text-info text-xl flex-shrink-0">💡</div>
        <div class="text-sm">
          <p class="font-medium text-neutral mb-1">¿Qué es una comercializadora minera?</p>
          <p class="text-secondary">
            Las comercializadoras son empresas especializadas en la compra, almacenamiento y venta de 
            concentrados minerales. Actúan como intermediarios entre ingenios/cooperativas y el mercado 
            internacional, facilitando la exportación y optimizando precios.
          </p>
        </div>
      </div>
    </div>

    <div class="card space-y-6">
      <!-- Información Legal -->
      <div>
        <h3 class="text-lg font-semibold text-neutral mb-4 flex items-center gap-2">
          <span>📋</span>
          <span>Información Legal</span>
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="input-group md:col-span-2">
            <label class="input-label">Razón Social <span class="text-error">*</span></label>
            <input
              type="text"
              :value="comercializadoraData.razon_social"
              @input="updateField('razon_social', $event.target.value)"
              placeholder="Ej: Comercializadora Minera XX S.A."
              class="w-full"
              required
            />
            <p class="text-xs text-tertiary mt-1">
              Nombre legal completo de la comercializadora
            </p>
          </div>

          <div class="input-group">
            <label class="input-label">NIT <span class="text-error">*</span></label>
            <input
              type="text"
              :value="comercializadoraData.nit"
              @input="updateField('nit', $event.target.value)"
              placeholder="Ej: 1234567890"
              class="w-full"
              required
            />
          </div>

          <div class="input-group">
            <label class="input-label">NIM <span class="text-error">*</span></label>
            <input
              type="number"
              :value="comercializadoraData.nim"
              @input="updateField('nim', parseInt($event.target.value) || 0)"
              placeholder="Ej: 12345"
              class="w-full"
              required
            />
            <p class="text-xs text-tertiary mt-1">
              Número de Identificación Minera
            </p>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Información de Contacto -->
      <div>
        <h3 class="text-lg font-semibold text-neutral mb-4 flex items-center gap-2">
          <span>📞</span>
          <span>Información de Contacto</span>
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="input-group md:col-span-3">
            <label class="input-label">Correo de Contacto <span class="text-error">*</span></label>
            <input
              type="email"
              :value="comercializadoraData.correo_contacto"
              @input="updateField('correo_contacto', $event.target.value)"
              placeholder="contacto@comercializadora.com"
              class="w-full"
              required
            />
          </div>

          <div class="input-group">
            <label class="input-label">Teléfono Fijo</label>
            <input
              type="tel"
              :value="comercializadoraData.numero_telefono_fijo"
              @input="updateField('numero_telefono_fijo', $event.target.value)"
              placeholder="Ej: (2) 6234567"
              class="w-full"
            />
          </div>

          <div class="input-group md:col-span-2">
            <label class="input-label">Teléfono Móvil</label>
            <input
              type="tel"
              :value="comercializadoraData.numero_telefono_movil"
              @input="updateField('numero_telefono_movil', $event.target.value)"
              placeholder="Ej: 70123456"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Minerales que Comercializa -->
      <div>
        <h3 class="text-lg font-semibold text-neutral mb-3 flex items-center gap-2">
          <span>💎</span>
          <span>Minerales que Comercializa <span class="text-error">*</span></span>
        </h3>
        <p class="text-sm text-secondary mb-4">
          Selecciona todos los tipos de concentrados que tu empresa comercializa
        </p>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <button
            v-for="mineral in availableMinerals"
            :key="mineral.id"
            @click="toggleMineral(mineral.id)"
            type="button"
            class="flex flex-col items-start gap-2 p-4 rounded-lg border-2 transition-all hover:scale-105"
            :class="comercializadoraData.minerales_comercializados.includes(mineral.id)
              ? 'bg-primary text-white border-primary shadow-lg'
              : 'bg-surface text-neutral border-border hover:border-primary'"
          >
            <div class="flex items-center justify-between w-full">
              <span class="text-2xl">{{ mineral.icon }}</span>
              <div 
                class="w-6 h-6 rounded-full border-2 center"
                :class="comercializadoraData.minerales_comercializados.includes(mineral.id) 
                  ? 'bg-white border-white' 
                  : 'border-border'"
              >
                <span 
                  v-if="comercializadoraData.minerales_comercializados.includes(mineral.id)" 
                  class="text-xs text-primary"
                >
                  ✓
                </span>
              </div>
            </div>
            <div class="text-left">
              <p class="font-semibold text-sm">{{ mineral.name }}</p>
              <p class="text-xs opacity-80">{{ mineral.id }}</p>
              <p class="text-xs opacity-70 mt-1">{{ mineral.description }}</p>
            </div>
          </button>
        </div>

        <div v-if="comercializadoraData.minerales_comercializados.length > 0" class="mt-4 bg-success/10 border border-success/30 rounded-lg p-3">
          <p class="text-sm text-success">
            ✓ Comercializas {{ comercializadoraData.minerales_comercializados.length }} 
            {{ comercializadoraData.minerales_comercializados.length === 1 ? 'tipo de mineral' : 'tipos de minerales' }}: 
            {{ comercializadoraData.minerales_comercializados.join(', ') }}
          </p>
        </div>

        <div v-else class="mt-4 bg-warning/10 border border-warning/30 rounded-lg p-3">
          <p class="text-sm text-warning flex items-center gap-2">
            <span>⚠️</span>
            <span>Debes seleccionar al menos un tipo de mineral</span>
          </p>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Licencia de Comercialización -->
      <div>
        <h3 class="text-lg font-semibold text-neutral mb-4 flex items-center gap-2">
          <span>📜</span>
          <span>Licencia de Comercialización</span>
        </h3>

        <div class="space-y-4">
          <div class="input-group">
            <label class="input-label">
              Número de Licencia de Comercialización <span class="text-error">*</span>
            </label>
            <input
              type="text"
              :value="comercializadoraData.numero_licencia"
              @input="updateField('numero_licencia', $event.target.value)"
              placeholder="Ej: LCOM-001-2024"
              class="w-full"
              required
            />
            <p class="text-xs text-tertiary mt-1">
              Licencia otorgada por SENARECOM o autoridad competente
            </p>
          </div>

          <FileUpload
            :model-value="comercializadoraData.licencia_url"
            @update:model-value="updateField('licencia_url', $event)"
            label="Documento de Licencia de Comercialización (PDF)"
            accept=".pdf"
            :max-size="10"
            required
          />
        </div>

        <div class="bg-warning/10 border border-warning/30 rounded-lg p-3 mt-3">
          <div class="flex gap-2">
            <span class="text-warning">⚠️</span>
            <p class="text-sm text-warning">
              La licencia de comercialización es obligatoria para operar legalmente en Bolivia. 
              Debe estar vigente y autorizar específicamente los minerales que comercializas.
            </p>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Sede Operativa -->
      <div>
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
          label="Sede Operativa Principal"
          :show-map="true"
        />
      </div>
    </div>

    <!-- Estado de validación -->
    <div v-if="isFormValid" class="bg-success/10 border border-success/30 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-success/20 center text-success text-xl flex-shrink-0">
          ✓
        </div>
        <div class="flex-1">
          <p class="font-medium text-success">Información básica completa</p>
          <div class="mt-2 text-sm text-success/80">
            <p>{{ comercializadoraData.razon_social }} - NIT: {{ comercializadoraData.nit }}</p>
            <p class="mt-1">
              Comercializa: {{ comercializadoraData.minerales_comercializados.join(', ') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Actividades de una comercializadora -->
    <div class="border border-border rounded-lg p-4">
      <h4 class="font-medium text-neutral mb-3 flex items-center gap-2">
        <span>🔄</span>
        <span>Actividades Principales</span>
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary/10 center text-primary flex-shrink-0">
            💰
          </div>
          <div>
            <p class="font-medium text-neutral text-sm">Compra de Concentrados</p>
            <p class="text-xs text-secondary mt-1">
              Adquisición de concentrados de ingenios y cooperativas
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary/10 center text-primary flex-shrink-0">
            📦
          </div>
          <div>
            <p class="font-medium text-neutral text-sm">Almacenamiento</p>
            <p class="text-xs text-secondary mt-1">
              Custodia segura de concentrados hasta su comercialización
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary/10 center text-primary flex-shrink-0">
            🧪
          </div>
          <div>
            <p class="font-medium text-neutral text-sm">Análisis de Calidad</p>
            <p class="text-xs text-secondary mt-1">
              Certificación de leyes y contenido de minerales
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary/10 center text-primary flex-shrink-0">
            🌍
          </div>
          <div>
            <p class="font-medium text-neutral text-sm">Exportación</p>
            <p class="text-xs text-secondary mt-1">
              Venta y exportación al mercado internacional
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Próximo paso -->
    <div class="border-l-4 border-primary bg-primary/5 rounded-r-lg p-4">
      <p class="text-sm text-neutral">
        <span class="font-semibold">Siguiente paso:</span> Configurarás los almacenes donde guardas 
        los concentrados antes de su comercialización.
      </p>
    </div>

    <!-- Requisitos legales -->
    <div class="bg-accent/5 border border-accent/20 rounded-lg p-4">
      <div class="flex gap-3">
        <div class="text-accent text-xl flex-shrink-0">📄</div>
        <div class="text-sm">
          <p class="font-medium text-neutral mb-1">Requisitos Legales para Comercializadoras</p>
          <ul class="space-y-1 text-secondary mt-2">
            <li>• Licencia de comercialización vigente (SENARECOM)</li>
            <li>• Registro en el Ministerio de Minería</li>
            <li>• Certificación de cumplimiento ambiental</li>
            <li>• Póliza de seguro para almacenamiento</li>
            <li>• Registro ante SENASAG (si aplica)</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>