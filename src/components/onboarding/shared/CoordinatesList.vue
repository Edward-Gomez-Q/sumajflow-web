<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  readonly: {
    type: Boolean,
    default: false
  },
  showMap: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'openMap'])

const coordinates = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const addCoordinate = () => {
  const newCoord = {
    orden: coordinates.value.length + 1,
    latitud: null,
    longitud: null
  }
  coordinates.value = [...coordinates.value, newCoord]
}

const removeCoordinate = (index) => {
  const updated = coordinates.value.filter((_, i) => i !== index)
  // Reordenar
  updated.forEach((coord, idx) => {
    coord.orden = idx + 1
  })
  coordinates.value = updated
}

const updateCoordinate = (index, field, value) => {
  const updated = [...coordinates.value]
  updated[index] = {
    ...updated[index],
    [field]: parseFloat(value) || null
  }
  coordinates.value = updated
}

const moveUp = (index) => {
  if (index === 0) return
  const updated = [...coordinates.value]
  ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
  // Reordenar
  updated.forEach((coord, idx) => {
    coord.orden = idx + 1
  })
  coordinates.value = updated
}

const moveDown = (index) => {
  if (index === coordinates.value.length - 1) return
  const updated = [...coordinates.value]
  ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
  // Reordenar
  updated.forEach((coord, idx) => {
    coord.orden = idx + 1
  })
  coordinates.value = updated
}

const isValidCoordinate = (coord) => {
  return coord.latitud !== null && coord.longitud !== null &&
         !isNaN(coord.latitud) && !isNaN(coord.longitud) &&
         coord.latitud >= -90 && coord.latitud <= 90 &&
         coord.longitud >= -180 && coord.longitud <= 180
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-medium text-neutral">
        Coordenadas {{ coordinates.length > 0 ? `(${coordinates.length} puntos)` : '' }}
      </h4>
      <div class="flex gap-2">
        <button
          v-if="showMap"
          @click="$emit('openMap')"
          type="button"
          class="btn-outline text-sm px-3 py-1"
        >
          🗺️ Usar mapa
        </button>
        <button
          v-if="!readonly"
          @click="addCoordinate"
          type="button"
          class="btn-outline text-sm px-3 py-1"
        >
          ➕ Agregar punto
        </button>
      </div>
    </div>

    <!-- Lista de coordenadas -->
    <div v-if="coordinates.length > 0" class="space-y-2">
      <div
        v-for="(coord, index) in coordinates"
        :key="index"
        class="border border-border rounded-lg p-3 bg-hover"
        :class="{ 'border-success': isValidCoordinate(coord), 'border-warning': !isValidCoordinate(coord) }"
      >
        <div class="flex items-start gap-3">
          <!-- Número de orden -->
          <div class="shrink-0 w-8 h-8 rounded-full bg-primary/10 center text-primary font-bold text-sm">
            {{ coord.orden }}
          </div>

          <!-- Campos de coordenadas -->
          <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="input-group">
              <label class="input-label text-xs">Latitud</label>
              <input
                type="number"
                step="0.000001"
                :value="coord.latitud"
                @input="updateCoordinate(index, 'latitud', $event.target.value)"
                placeholder="-19.583333"
                class="w-full text-sm"
                :readonly="readonly"
              />
            </div>

            <div class="input-group">
              <label class="input-label text-xs">Longitud</label>
              <input
                type="number"
                step="0.000001"
                :value="coord.longitud"
                @input="updateCoordinate(index, 'longitud', $event.target.value)"
                placeholder="-65.750000"
                class="w-full text-sm"
                :readonly="readonly"
              />
            </div>
          </div>

          <!-- Acciones -->
          <div v-if="!readonly" class="flex flex-col gap-1">
            <button
              @click="moveUp(index)"
              :disabled="index === 0"
              type="button"
              class="btn-ghost w-8 h-8 p-0 text-sm"
              :class="{ 'opacity-30 cursor-not-allowed': index === 0 }"
              title="Subir"
            >
              ↑
            </button>
            <button
              @click="moveDown(index)"
              :disabled="index === coordinates.length - 1"
              type="button"
              class="btn-ghost w-8 h-8 p-0 text-sm"
              :class="{ 'opacity-30 cursor-not-allowed': index === coordinates.length - 1 }"
              title="Bajar"
            >
              ↓
            </button>
            <button
              @click="removeCoordinate(index)"
              type="button"
              class="btn-ghost w-8 h-8 p-0 text-error"
              title="Eliminar"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Validación visual -->
        <div v-if="!isValidCoordinate(coord)" class="mt-2 text-xs text-warning flex items-center gap-1">
          <span>⚠️</span>
          <span>Coordenadas incompletas o inválidas</span>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-else class="border-2 border-dashed border-border rounded-lg p-8 text-center">
      <div class="text-4xl mb-2">📍</div>
      <p class="text-sm text-secondary mb-3">No hay coordenadas registradas</p>
      <button
        v-if="!readonly"
        @click="addCoordinate"
        type="button"
        class="btn-outline text-sm"
      >
        ➕ Agregar primer punto
      </button>
    </div>

    <!-- Validación total -->
    <div v-if="coordinates.length >= 3 && coordinates.every(isValidCoordinate)" class="bg-success/10 border border-success/30 rounded-lg p-3">
      <p class="text-sm text-success flex items-center gap-2">
        <span>✓</span>
        <span>Polígono válido con {{ coordinates.length }} puntos</span>
      </p>
    </div>

    <div v-else-if="coordinates.length > 0 && coordinates.length < 3" class="bg-info/10 border border-info/30 rounded-lg p-3">
      <p class="text-sm text-info flex items-center gap-2">
        <span>ℹ️</span>
        <span>Se necesitan al menos 3 puntos para formar un polígono (tienes {{ coordinates.length }})</span>
      </p>
    </div>
  </div>
</template>