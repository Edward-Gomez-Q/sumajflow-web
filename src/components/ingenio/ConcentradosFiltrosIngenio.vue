<!-- src/components/ingenio/ConcentradosFiltrosIngenio.vue -->
<script setup>
import { ref, computed } from 'vue'
import { Filter, X, Search, Calendar, Trash2 } from 'lucide-vue-next'
import { ESTADOS_CONCENTRADO } from '@/utils/concentradoEstados'

const props = defineProps({
  filtrosActuales: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['aplicar', 'limpiar'])

const mostrarFiltros = ref(false)
const filtrosLocales = ref({ ...props.filtrosActuales })

// Estados disponibles para filtrar
const estadosDisponibles = computed(() => {
  return Object.entries(ESTADOS_CONCENTRADO).map(([key, value]) => ({
    value: key,
    label: value.label
  }))
})

// Minerales comunes
const mineralesDisponibles = [
  { value: 'Plata', label: 'Plata (Ag)' },
  { value: 'Zinc', label: 'Zinc (Zn)' },
  { value: 'Plomo', label: 'Plomo (Pb)' },
  { value: 'Oro', label: 'Oro (Au)' },
  { value: 'Cobre', label: 'Cobre (Cu)' }
]

const hayFiltrosActivos = computed(() => {
  return Object.keys(filtrosLocales.value).some(key => {
    if (key === 'page' || key === 'size' || key === 'sortBy' || key === 'sortDir') return false
    return filtrosLocales.value[key] !== null && filtrosLocales.value[key] !== ''
  })
})

const aplicarFiltros = () => {
  emit('aplicar', { ...filtrosLocales.value })
  mostrarFiltros.value = false
}

const limpiarFiltros = () => {
  filtrosLocales.value = {
    estado: null,
    mineralPrincipal: null,
    socioNombre: null,
    fechaDesde: null,
    fechaHasta: null,
    page: 0,
    size: filtrosLocales.value.size || 10,
    sortBy: 'fechaInicio',
    sortDir: 'desc'
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
      <span>Filtros</span>
      <span v-if="hayFiltrosActivos" class="w-2 h-2 bg-primary rounded-full"></span>
    </button>

    <!-- Panel de filtros -->
    <div
      v-if="mostrarFiltros"
      class="absolute top-full right-0 mt-2 w-96 bg-surface rounded-xl shadow-2xl border border-border z-50 p-4 max-h-[80vh] overflow-y-auto scrollbar-custom"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-neutral flex items-center gap-2">
          <Filter class="w-4 h-4" />
          Filtros Avanzados
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

        <!-- Socio -->
        <div class="input-group">
          <label class="input-label">Nombre del Socio</label>
          <input
            v-model="filtrosLocales.socioNombre"
            type="text"
            placeholder="Buscar por nombre..."
          />
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

        <!-- Ordenamiento -->
        <div class="input-group">
          <label class="input-label">Ordenar por</label>
          <div class="grid grid-cols-2 gap-2">
            <select v-model="filtrosLocales.sortBy">
              <option value="fechaInicio">Fecha Inicio</option>
              <option value="fechaCreacion">Fecha Creación</option>
              <option value="estado">Estado</option>
              <option value="mineralPrincipal">Mineral Principal</option>
              <option value="pesoInicial">Peso Inicial</option>
            </select>
            <select v-model="filtrosLocales.sortDir">
              <option value="desc">Descendente</option>
              <option value="asc">Ascendente</option>
            </select>
          </div>
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