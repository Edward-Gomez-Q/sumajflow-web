<script setup>
import { computed } from 'vue'
import { MapPin, CheckCircle } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  showMap: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: 'Dirección'
  },
  helperText: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'openMap'])

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

const handleOpenMap = () => {
  emit('openMap')
}

// Datos de Bolivia
const departamentos = [
  'Chuquisaca', 'La Paz', 'Cochabamba', 'Oruro', 'Potosí', 
  'Tarija', 'Santa Cruz', 'Beni', 'Pando'
]
</script>

<template>
  <div class="space-y-4">
    <div>
      <h3 class="text-sm font-semibold text-neutral mb-1">{{ label }}</h3>
      <p v-if="helperText" class="text-sm text-secondary leading-relaxed">
        {{ helperText }}
      </p>
    </div>

    <!-- Departamento, Provincia, Municipio -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="input-group">
        <label for="departamento" class="input-label">
          Departamento <span v-if="required" class="text-error">*</span>
        </label>
        <select
          id="departamento"
          :value="localValue.departamento"
          @change="updateField('departamento', $event.target.value)"
          class="w-full"
          :required="required"
        >
          <option value="">Seleccionar</option>
          <option v-for="dep in departamentos" :key="dep" :value="dep">
            {{ dep }}
          </option>
        </select>
      </div>

      <div class="input-group">
        <label for="provincia" class="input-label">
          Provincia <span v-if="required" class="text-error">*</span>
        </label>
        <input
          id="provincia"
          type="text"
          :value="localValue.provincia"
          @input="updateField('provincia', $event.target.value)"
          placeholder="Ej: Tomás Frías"
          class="w-full"
          :required="required"
        />
      </div>

      <div class="input-group">
        <label for="municipio" class="input-label">
          Municipio <span v-if="required" class="text-error">*</span>
        </label>
        <input
          id="municipio"
          type="text"
          :value="localValue.municipio"
          @input="updateField('municipio', $event.target.value)"
          placeholder="Ej: Potosí"
          class="w-full"
          :required="required"
        />
      </div>
    </div>

    <!-- Dirección -->
    <div class="input-group">
      <label for="direccion" class="input-label">
        Dirección <span v-if="required" class="text-error">*</span>
      </label>
      <input
        id="direccion"
        type="text"
        :value="localValue.direccion"
        @input="updateField('direccion', $event.target.value)"
        placeholder="Ej: Av. Cívica #123, Zona Central"
        class="w-full"
        :required="required"
      />
      <p class="input-helper">
        Incluye calle, número, zona y referencias si es necesario
      </p>
    </div>

    <!-- Coordenadas y Mapa -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="input-group">
        <label for="latitud" class="input-label">Latitud</label>
        <input
          id="latitud"
          type="number"
          step="0.000001"
          :value="localValue.latitud"
          @input="updateField('latitud', parseFloat($event.target.value) || null)"
          placeholder="-19.583333"
          class="w-full"
        />
      </div>

      <div class="input-group">
        <label for="longitud" class="input-label">Longitud</label>
        <input
          id="longitud"
          type="number"
          step="0.000001"
          :value="localValue.longitud"
          @input="updateField('longitud', parseFloat($event.target.value) || null)"
          placeholder="-65.75"
          class="w-full"
        />
      </div>

      <div class="flex items-end" v-if="showMap">
        <button
          type="button"
          @click="handleOpenMap"
          class="btn-outline w-full flex items-center justify-center gap-2"
        >
          <MapPin class="w-4 h-4" />
          Seleccionar en mapa
        </button>
      </div>
    </div>

<!-- Información adicional si tiene coordenadas -->
<div
  v-if="localValue.latitud && localValue.longitud"
  class="bg-green-100/70 dark:bg-green-900/40 border border-green-400/60 dark:border-green-700 rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200"
>
  <div class="flex items-center gap-3">
    <div class="w-8 h-8 rounded-full bg-green-200/50 dark:bg-green-800/50 center">
      <CheckCircle class="w-4 h-4 text-green-700 dark:text-green-300" />
    </div>
    <div class="text-sm">
      <p class="font-medium text-neutral mb-0.5">Ubicación registrada</p>
      <p class="text-secondary font-mono">
        {{ localValue.latitud?.toFixed(6) }}, {{ localValue.longitud?.toFixed(6) }}
      </p>
    </div>
  </div>
</div>


  </div>
</template>