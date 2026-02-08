<!-- src/components/comercializadora/ConcentradosFiltrosComercializadora.vue -->
<script setup>
import { ref, computed } from 'vue'
import { Filter, X, Search, Calendar, Trash2 } from 'lucide-vue-next'

const props = defineProps({
  filtrosActuales: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['aplicar', 'limpiar'])

const mostrarFiltros = ref(false)
const filtrosLocales = ref({ ...props.filtrosActuales })

// Estados disponibles para comercializadora
const estadosDisponibles = [
  { value: 'listo_para_venta', label: 'Listo para venta' },
  { value: 'venta_solicitada', label: 'Venta solicitada' },
  { value: 'en_venta', label: 'En venta' },
  { value: 'vendido', label: 'Vendido' }
]

// Minerales principales
const mineralesDisponibles = [
  { value: 'Zn', label: 'Zinc (Zn)' },
  { value: 'Pb', label: 'Plomo (Pb)' },
  { value: 'Ag', label: 'Plata (Ag)' },
  { value: 'Au', label: 'Oro (Au)' },
  { value: 'Cu', label: 'Cobre (Cu)' }
]

const hayFiltrosActivos = computed(() => {
  return filtrosLocales.value.estado || 
         filtrosLocales.value.mineralPrincipal || 
         filtrosLocales.value.fechaDesde || 
         filtrosLocales.value.fechaHasta
})

const aplicarFiltros = () => {
  emit('aplicar', { 
    estado: filtrosLocales.value.estado || null,
    mineralPrincipal: filtrosLocales.value.mineralPrincipal || null,
    fechaDesde: filtrosLocales.value.fechaDesde || null,
    fechaHasta: filtrosLocales.value.fechaHasta || null,
    page: 0
  })
  mostrarFiltros.value = false
}

const limpiarFiltros = () => {
  filtrosLocales.value = {
    estado: null,
    mineralPrincipal: null,
    fechaDesde: null,
    fechaHasta: null
  }
  emit('limpiar')
  mostrarFiltros.value = false
}
</script>

<template>
  <div class="relative">
    <!-- Botón de filtros -->
    <button
      @click="mostrarFiltros = !mostrarFiltros"
      class="btn-outline flex items-center justify-center gap-2"
      :class="{ 'ring-2 ring-primary': hayFiltrosActivos }"
    >
      <Filter class="w-4 h-4" />
      <span class="hidden sm:inline">Filtros</span>
      <span v-if="hayFiltrosActivos" class="w-2 h-2 bg-primary rounded-full ml-1"></span>
    </button>

    <!-- Panel de filtros -->
    <div
      v-if="mostrarFiltros"
      class="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-surface rounded-xl shadow-2xl border border-border z-50 p-4 max-h-[80vh] overflow-y-auto scrollbar-custom"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-neutral flex items-center gap-2">
          <Filter class="w-4 h-4" />
          Filtros
        </h3>
        <button
          @click="mostrarFiltros = false"
          class="w-8 h-8 rounded-lg hover:bg-hover flex items-center justify-center text-secondary"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-4">
        <!-- Estado -->
        <div class="input-group">
          <label class="input-label">Estado</label>
          <select v-model="filtrosLocales.estado">
            <option :value="null">Todos los estados</option>
            <option
              v-for="estado in estadosDisponibles"
              :key="estado.value"
              :value="estado.value"
            >
              {{ estado.label }}
            </option>
          </select>
        </div>

        <!-- Mineral Principal -->
        <div class="input-group">
          <label class="input-label">Mineral Principal</label>
          <select v-model="filtrosLocales.mineralPrincipal">
            <option :value="null">Todos los minerales</option>
            <option
              v-for="mineral in mineralesDisponibles"
              :key="mineral.value"
              :value="mineral.value"
            >
              {{ mineral.label }}
            </option>
          </select>
        </div>

        <!-- Fecha Desde -->
        <div class="input-group">
          <label class="input-label flex items-center gap-2">
            <Calendar class="w-4 h-4 text-primary" />
            Fecha Desde
          </label>
          <input
            v-model="filtrosLocales.fechaDesde"
            type="datetime-local"
          />
        </div>

        <!-- Fecha Hasta -->
        <div class="input-group">
          <label class="input-label flex items-center gap-2">
            <Calendar class="w-4 h-4 text-primary" />
            Fecha Hasta
          </label>
          <input
            v-model="filtrosLocales.fechaHasta"
            type="datetime-local"
          />
        </div>

        <!-- Acciones -->
        <div class="flex gap-2 pt-2">
          <button
            @click="limpiarFiltros"
            class="flex-1 btn-secondary flex items-center justify-center gap-2"
          >
            <Trash2 class="w-4 h-4" />
            Limpiar
          </button>
          <button
            @click="aplicarFiltros"
            class="flex-1 btn flex items-center justify-center gap-2"
          >
            <Search class="w-4 h-4" />
            Aplicar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-custom::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-custom::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-custom::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

.scrollbar-custom::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary);
}
</style>