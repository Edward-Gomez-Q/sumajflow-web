<!-- src/components/cooperativa/TransportistaSelector.vue -->
<script setup>
import { ref, computed, watch } from 'vue'
import { Truck, Star, CheckCircle2, User, Award } from 'lucide-vue-next'

const props = defineProps({
  transportistas: {
    type: Array,
    required: true
  },
  cantidadRequerida: {
    type: Number,
    required: true
  },
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const seleccionados = ref([...props.modelValue])

// Watch para sincronizar con v-model
watch(() => props.modelValue, (newVal) => {
  seleccionados.value = [...newVal]
})

watch(seleccionados, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })

const isSelected = (transportistaId) => {
  return seleccionados.value.some(s => s.transportistaId === transportistaId)
}

const toggleTransportista = (transportista) => {
  const index = seleccionados.value.findIndex(s => s.transportistaId === transportista.id)
  
  if (index > -1) {
    // Deseleccionar
    seleccionados.value.splice(index, 1)
    // Reasignar números de camión
    seleccionados.value.forEach((s, i) => {
      s.numeroCamion = i + 1
    })
  } else {
    // Seleccionar solo si no se ha alcanzado el límite
    if (seleccionados.value.length < props.cantidadRequerida) {
      seleccionados.value.push({
        transportistaId: transportista.id,
        numeroCamion: seleccionados.value.length + 1
      })
    }
  }
}

const puedeSeleccionarMas = computed(() => {
  return seleccionados.value.length < props.cantidadRequerida
})

const getNumeroCamion = (transportistaId) => {
  const sel = seleccionados.value.find(s => s.transportistaId === transportistaId)
  return sel ? sel.numeroCamion : null
}
</script>

<template>
  <div class="space-y-3">
    <!-- Info -->
    <div class="bg-blue-500 rounded-lg p-3 shadow-sm">
      <p class="text-sm text-white">
        <strong>Selecciona {{ cantidadRequerida }} transportista(s)</strong>
        <span class="ml-2 text-xs text-white/90">
          ({{ seleccionados.length }} / {{ cantidadRequerida }} seleccionados)
        </span>
      </p>
    </div>

    <!-- Lista de transportistas -->
    <div class="space-y-2 max-h-96 overflow-y-auto scrollbar-custom">
      <div
        v-for="transportista in transportistas"
        :key="transportista.id"
        @click="toggleTransportista(transportista)"
        class="border-2 rounded-lg p-3 transition-all cursor-pointer"
        :class="isSelected(transportista.id)
          ? 'border-primary bg-primary/10'
          : puedeSeleccionarMas
          ? 'border-border hover:border-primary/50 hover:bg-hover'
          : 'border-border opacity-50 cursor-not-allowed'"
      >
        <div class="flex items-start gap-3">
          <!-- Avatar/Icon -->
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            :class="isSelected(transportista.id) ? 'bg-primary text-white' : 'bg-hover text-secondary'"
          >
            <User class="w-5 h-5" v-if="!isSelected(transportista.id)" />
            <CheckCircle2 class="w-5 h-5" v-else />
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-neutral truncate">
                  {{ transportista.nombreCompleto }}
                </h4>
                <p class="text-xs text-secondary">CI: {{ transportista.ci }}</p>
              </div>
              <div v-if="isSelected(transportista.id)" class="shrink-0">
                <span class="px-2 py-1 bg-primary text-white text-xs font-bold rounded-lg">
                  Camión #{{ getNumeroCamion(transportista.id) }}
                </span>
              </div>
            </div>

            <!-- Vehículo -->
            <div class="flex items-center gap-2 text-xs text-secondary mb-2">
              <Truck class="w-3 h-3" />
              <span class="font-medium text-neutral">{{ transportista.placaVehiculo }}</span>
              <span>•</span>
              <span>{{ transportista.marcaVehiculo }} {{ transportista.modeloVehiculo }}</span>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-3 gap-2 text-xs">
              <div class="bg-hover rounded px-2 py-1">
                <p class="text-tertiary">Capacidad</p>
                <p class="font-medium text-neutral">{{ transportista.capacidadCarga }} Ton</p>
              </div>
              <div class="bg-hover rounded px-2 py-1">
                <p class="text-tertiary flex items-center gap-1">
                  <Award class="w-3 h-3" />
                  Viajes
                </p>
                <p class="font-medium text-neutral">{{ transportista.viajesCompletados }}</p>
              </div>
              <div class="bg-hover rounded px-2 py-1">
                <p class="text-tertiary flex items-center gap-1">
                  <Star class="w-3 h-3" />
                  Rating
                </p>
                <p class="font-medium text-neutral">
                  {{ transportista.calificacionPromedio?.toFixed(1) || 'N/A' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="transportistas.length === 0" class="text-center py-8">
        <div class="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center mx-auto mb-3">
          <Truck class="w-6 h-6 text-white" />
        </div>
        <p class="text-sm text-secondary">No hay transportistas disponibles</p>
      </div>
    </div>
  </div>
</template>