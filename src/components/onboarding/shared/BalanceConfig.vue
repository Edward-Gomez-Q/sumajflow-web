<script setup>
import { computed } from 'vue'

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
    <h3 class="text-lg font-semibold text-neutral">{{ label }}</h3>

    <!-- Departamento, Provincia, Municipio -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="input-group">
        <label class="input-label">
          Departamento <span v-if="required" class="text-error">*</span>
        </label>
        <select
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
        <label class="input-label">
          Provincia <span v-if="required" class="text-error">*</span>
        </label>
        <input
          type="text"
          :value="localValue.provincia"
          @input="updateField('provincia', $event.target.value)"
          placeholder="Ej: Tomás Frías"
          class="w-full"
          :required="required"
        />
      </div>

      <div class="input-group">
        <label class="input-label">
          Municipio <span v-if="required" class="text-error">*</span>
        </label>
        <input
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
      <label class="input-label">
        Dirección <span v-if="required" class="text-error">*</span>
      </label>
      <input
        type="text"
        :value="localValue.direccion"
        @input="updateField('direccion', $event.target.value)"
        placeholder="Ej: Av. Cívica #123, Zona Central"
        class="w-full"
        :required="required"
      />
    </div>

    <!-- Coordenadas y Mapa -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="input-group">
        <label class="input-label">Latitud</label>
        <input
          type="number"
          step="0.000001"
          :value="localValue.latitud"
          @input="updateField('latitud', parseFloat($event.target.value) || null)"
          placeholder="-19.583333"
          class="w-full"
        />
      </div>

      <div class="input-group">
        <label class="input-label">Longitud</label>
        <input
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
          class="btn-outline w-full"
        >
          📍 Seleccionar en mapa
        </button>
      </div>
    </div>

    <!-- Info adicional si tiene coordenadas -->
    <div v-if="localValue.latitud && localValue.longitud" class="bg-primary/5 border border-primary/20 rounded-lg p-3">
      <p class="text-sm text-primary">
        ✓ Ubicación registrada: {{ localValue.latitud?.toFixed(6) }}, {{ localValue.longitud?.toFixed(6) }}
      </p>
    </div>
  </div>
</template>