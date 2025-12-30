<!-- src/components/cooperativa/LotesFiltrosCooperativa.vue -->
<script setup>
import { ref, computed } from 'vue'
import { Filter, X, Search, Trash2 } from 'lucide-vue-next'

const props = defineProps({
  filtrosActuales: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['aplicar', 'limpiar'])

const mostrarFiltros = ref(false)
const filtrosLocales = ref({ ...props.filtrosActuales })

const tiposOperacion = [
  { value: 'procesamiento_planta', label: 'Procesamiento' },
  { value: 'venta_directa', label: 'Venta Directa' }
]

const tiposMinerales = [
  { value: 'complejo', label: 'Complejo' },
  { value: 'concentrado', label: 'Concentrado' }
]

const hayFiltrosActivos = computed(() => {
  return filtrosLocales.value.tipoOperacion !== '' || 
         filtrosLocales.value.tipoMineral !== '' || 
         filtrosLocales.value.busqueda !== ''
})

const aplicarFiltros = () => {
  emit('aplicar', { ...filtrosLocales.value })
  mostrarFiltros.value = false
}

const limpiarFiltros = () => {
  filtrosLocales.value = {
    tipoOperacion: '',
    tipoMineral: '',
    busqueda: ''
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
      <span v-if="hayFiltrosActivos" class="w-2 h-2 bg-primary rounded-full"></span>
    </button>

    <!-- Panel de filtros -->
    <div
      v-if="mostrarFiltros"
      class="absolute top-full right-0 mt-2 w-80 bg-surface rounded-xl shadow-2xl border border-border z-50 p-4"
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
        <!-- Buscar -->
        <div class="input-group">
          <label class="input-label">Buscar</label>
          <input
            v-model="filtrosLocales.busqueda"
            type="text"
            placeholder="Mina, socio, destino, CI..."
            class="w-full"
          />
        </div>

        <!-- Tipo de Operación -->
        <div class="input-group">
          <label class="input-label">Tipo de Operación</label>
          <select v-model="filtrosLocales.tipoOperacion">
            <option value="">Todas</option>
            <option 
              v-for="tipo in tiposOperacion" 
              :key="tipo.value" 
              :value="tipo.value"
            >
              {{ tipo.label }}
            </option>
          </select>
        </div>

        <!-- Tipo de Mineral -->
        <div class="input-group">
          <label class="input-label">Tipo de Mineral</label>
          <select v-model="filtrosLocales.tipoMineral">
            <option value="">Todos</option>
            <option 
              v-for="tipo in tiposMinerales" 
              :key="tipo.value" 
              :value="tipo.value"
            >
              {{ tipo.label }}
            </option>
          </select>
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