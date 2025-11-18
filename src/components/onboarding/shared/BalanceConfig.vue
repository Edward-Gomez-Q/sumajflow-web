<script setup>
import { computed } from 'vue'
import { 
  Scale, 
  Wrench, 
  Calendar, 
  AlertTriangle, 
  Info,
  CheckCircle2
} from 'lucide-vue-next'
import AddressForm from './AddressForm.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  title: {
    type: String,
    default: 'Datos de la Balanza'
  },
  entityName: {
    type: String,
    default: 'entidad'
  }
})

const emit = defineEmits(['update:modelValue'])

const localValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const updateField = (field, value) => {
  emit('update:modelValue', {
    ...localValue.value,
    [field]: value
  })
}

// Actualizar dirección completa (para el AddressForm)
const balanzaAddress = computed({
  get: () => ({
    departamento: localValue.value.departamento || '',
    provincia: localValue.value.provincia || '',
    municipio: localValue.value.municipio || '',
    direccion: localValue.value.direccion || '',
    latitud: localValue.value.latitud || null,
    longitud: localValue.value.longitud || null
  }),
  set: (val) => {
    emit('update:modelValue', {
      ...localValue.value,
      ...val
    })
  }
})

// Validación de fechas
const isCalibrationValid = computed(() => {
  if (!localValue.value.fecha_ultima_calibracion || !localValue.value.fecha_proxima_calibracion) {
    return true
  }
  
  const lastDate = new Date(localValue.value.fecha_ultima_calibracion)
  const nextDate = new Date(localValue.value.fecha_proxima_calibracion)
  
  return nextDate > lastDate
})

// Fecha mínima para próxima calibración (debe ser después de la última)
const minNextCalibrationDate = computed(() => {
  if (!localValue.value.fecha_ultima_calibracion) return null
  
  const lastDate = new Date(localValue.value.fecha_ultima_calibracion)
  lastDate.setDate(lastDate.getDate() + 1)
  return lastDate.toISOString().split('T')[0]
})

// Fecha máxima para última calibración (hoy)
const maxLastCalibrationDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// Calcular divisiones
const totalDivisions = computed(() => {
  if (!localValue.value.capacidad_maxima || !localValue.value.precision_minima) return null
  return Math.floor(localValue.value.capacidad_maxima / localValue.value.precision_minima)
})
</script>

<template>
  <div class="space-y-6">
    <!-- Título -->
    <div v-if="title">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-lg bg-primary/10 center">
          <Scale class="w-5 h-5 text-primary" />
        </div>
        <h3 class="text-lg font-semibold text-neutral">{{ title }}</h3>
      </div>
      <p class="text-sm text-secondary leading-relaxed">
        Registra los datos técnicos y de ubicación de la balanza
      </p>
    </div>

    <!-- Información básica -->
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <Scale class="w-4 h-4 text-primary" />
        <h4 class="text-base font-medium text-neutral">Información Básica</h4>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Nombre -->
        <div class="input-group md:col-span-2">
          <label for="nombre-balanza" class="input-label">
            Nombre de la Balanza <span class="text-error">*</span>
          </label>
          <input
            id="nombre-balanza"
            type="text"
            :value="localValue.nombre"
            @input="updateField('nombre', $event.target.value)"
            placeholder="Ej: Balanza Principal Cooperativa"
            class="w-full"
            required
          />
          <p class="input-helper">
            Un nombre descriptivo para identificar esta balanza
          </p>
        </div>

        <!-- Marca -->
        <div class="input-group">
          <label for="marca-balanza" class="input-label">
            Marca <span class="text-error">*</span>
          </label>
          <input
            id="marca-balanza"
            type="text"
            :value="localValue.marca"
            @input="updateField('marca', $event.target.value)"
            placeholder="Ej: Toledo, Mettler, Avery"
            class="w-full"
            required
          />
        </div>

        <!-- Modelo -->
        <div class="input-group">
          <label for="modelo-balanza" class="input-label">
            Modelo <span class="text-error">*</span>
          </label>
          <input
            id="modelo-balanza"
            type="text"
            :value="localValue.modelo"
            @input="updateField('modelo', $event.target.value)"
            placeholder="Ej: PS-5000"
            class="w-full"
            required
          />
        </div>

        <!-- Número de Serie -->
        <div class="input-group md:col-span-2">
          <label for="numero-serie-balanza" class="input-label">
            Número de Serie <span class="text-error">*</span>
          </label>
          <input
            id="numero-serie-balanza"
            type="text"
            :value="localValue.numero_serie"
            @input="updateField('numero_serie', $event.target.value)"
            placeholder="Ej: TOL-12345-2024"
            class="w-full font-mono"
            required
          />
          <p class="input-helper">
            Número de serie único del equipo (verifica en la placa del fabricante)
          </p>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Especificaciones técnicas -->
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <Wrench class="w-4 h-4 text-primary" />
        <h4 class="text-base font-medium text-neutral">Especificaciones Técnicas</h4>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Capacidad Máxima -->
        <div class="input-group">
          <label for="capacidad-maxima" class="input-label">
            Capacidad Máxima (kg) <span class="text-error">*</span>
          </label>
          <input
            id="capacidad-maxima"
            type="number"
            step="0.01"
            min="0"
            :value="localValue.capacidad_maxima"
            @input="updateField('capacidad_maxima', parseFloat($event.target.value) || 0)"
            placeholder="5000"
            class="w-full"
            required
          />
          <p class="input-helper">
            Peso máximo que puede medir la balanza
          </p>
        </div>

        <!-- Precisión Mínima -->
        <div class="input-group">
          <label for="precision-minima" class="input-label">
            Precisión Mínima (kg) <span class="text-error">*</span>
          </label>
          <input
            id="precision-minima"
            type="number"
            step="0.001"
            min="0"
            :value="localValue.precision_minima"
            @input="updateField('precision_minima', parseFloat($event.target.value) || 0)"
            placeholder="0.5"
            class="w-full"
            required
          />
          <p class="input-helper">
            Mínima división de medición (resolución)
          </p>
        </div>
      </div>

      <!-- Información de capacidad -->
      <div
        v-if="totalDivisions"
        class="bg-info/10 border border-info/30 rounded-lg p-4"
      >
        <div class="flex gap-3">
          <div class="text-info shrink-0">
            <Info class="w-5 h-5" />
          </div>
          <div class="text-sm">
            <p class="font-medium text-neutral mb-1">Rango de medición</p>
            <p class="text-secondary">
              {{ localValue.precision_minima }} kg - {{ localValue.capacidad_maxima }} kg
              <span class="text-tertiary ml-2">
                ({{ totalDivisions.toLocaleString() }} divisiones)
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Calibración -->
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <Calendar class="w-4 h-4 text-primary" />
        <h4 class="text-base font-medium text-neutral">Calibración</h4>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Fecha última calibración -->
        <div class="input-group">
          <label for="fecha-ultima-calibracion" class="input-label">
            Fecha de Última Calibración <span class="text-error">*</span>
          </label>
          <input
            id="fecha-ultima-calibracion"
            type="date"
            :value="localValue.fecha_ultima_calibracion"
            @input="updateField('fecha_ultima_calibracion', $event.target.value)"
            :max="maxLastCalibrationDate"
            class="w-full"
            required
          />
        </div>

        <!-- Fecha próxima calibración -->
        <div class="input-group">
          <label for="fecha-proxima-calibracion" class="input-label">
            Fecha de Próxima Calibración <span class="text-error">*</span>
          </label>
          <input
            id="fecha-proxima-calibracion"
            type="date"
            :value="localValue.fecha_proxima_calibracion"
            @input="updateField('fecha_proxima_calibracion', $event.target.value)"
            :min="minNextCalibrationDate"
            class="w-full"
            required
          />
        </div>
      </div>

      <!-- Alerta de validación de fechas -->
      <div
        v-if="!isCalibrationValid"
        class="bg-error/10 border border-error/30 rounded-lg p-4"
      >
        <div class="flex gap-3">
          <div class="text-error shrink-0">
            <AlertTriangle class="w-5 h-5" />
          </div>
          <p class="text-sm text-error">
            La fecha de próxima calibración debe ser posterior a la fecha de última calibración
          </p>
        </div>
      </div>

      <!-- Info contextual sobre calibración -->
      <div class="bg-warning/10 border border-warning/30 rounded-lg p-4">
        <div class="flex gap-3">
          <div class="text-warning shrink-0">
            <Info class="w-5 h-5" />
          </div>
          <div class="text-sm">
            <p class="font-medium text-neutral mb-1">Recordatorio sobre calibración</p>
            <p class="text-secondary leading-relaxed">
              La calibración debe realizarse periódicamente según normativa. 
              Generalmente se recomienda cada 6 meses para equipos de uso frecuente.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Ubicación -->
    <div class="space-y-4">
      <h4 class="text-base font-medium text-neutral">Ubicación de la Balanza</h4>
      
      <AddressForm
        v-model="balanzaAddress"
        label=""
        helper-text="Ubicación física donde está instalada la balanza"
        :show-map="true"
        :required="true"
      />
    </div>
  </div>
</template>
