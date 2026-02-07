<!-- src/components/socio/venta/VentaFiltros.vue -->
<script setup>
import { ref, computed } from 'vue'
import { Filter, X, Search, Calendar, Trash2 } from 'lucide-vue-next'
import { ESTADOS_FILTRO_SOCIO } from '@/utils/ventaEstados'

const props = defineProps({
  filtrosActuales: { type: Object, required: true }
})

const emit = defineEmits(['aplicar', 'limpiar'])

const mostrarFiltros = ref(false)
const filtrosLocales = ref({ ...props.filtrosActuales })

const hayFiltrosActivos = computed(() =>
  filtrosLocales.value.estado || filtrosLocales.value.fechaDesde || filtrosLocales.value.fechaHasta
)

const aplicarFiltros = () => {
  emit('aplicar', {
    estado: filtrosLocales.value.estado || null,
    fechaDesde: filtrosLocales.value.fechaDesde || null,
    fechaHasta: filtrosLocales.value.fechaHasta || null,
    page: 0
  })
  mostrarFiltros.value = false
}

const limpiarFiltros = () => {
  filtrosLocales.value = { estado: null, fechaDesde: null, fechaHasta: null }
  emit('limpiar')
  mostrarFiltros.value = false
}
</script>

<template>
  <div class="relative">
    <button
      @click="mostrarFiltros = !mostrarFiltros"
      class="btn-outline flex items-center justify-center gap-2"
      :class="{ 'ring-2 ring-primary': hayFiltrosActivos }"
    >
      <Filter class="w-4 h-4" />
      <span class="hidden sm:inline">Filtros</span>
      <span v-if="hayFiltrosActivos" class="w-2 h-2 bg-primary rounded-full ml-1"></span>
    </button>

    <div
      v-if="mostrarFiltros"
      class="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-surface rounded-xl shadow-2xl border border-border z-50 p-4"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-neutral flex items-center gap-2">
          <Filter class="w-4 h-4" /> Filtros
        </h3>
        <button @click="mostrarFiltros = false" class="w-8 h-8 rounded-lg hover:bg-hover flex items-center justify-center text-secondary">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-4">
        <div class="input-group">
          <label class="input-label">Estado</label>
          <select v-model="filtrosLocales.estado">
            <option :value="null">Todos los estados</option>
            <option v-for="e in ESTADOS_FILTRO_SOCIO" :key="e.value" :value="e.value">{{ e.label }}</option>
          </select>
        </div>

        <div class="input-group">
          <label class="input-label flex items-center gap-2">
            <Calendar class="w-4 h-4 text-primary" /> Desde
          </label>
          <input v-model="filtrosLocales.fechaDesde" type="datetime-local" />
        </div>

        <div class="input-group">
          <label class="input-label flex items-center gap-2">
            <Calendar class="w-4 h-4 text-primary" /> Hasta
          </label>
          <input v-model="filtrosLocales.fechaHasta" type="datetime-local" />
        </div>

        <div class="flex gap-2 pt-2">
          <button @click="limpiarFiltros" class="flex-1 btn-secondary flex items-center justify-center gap-2">
            <Trash2 class="w-4 h-4" /> Limpiar
          </button>
          <button @click="aplicarFiltros" class="flex-1 btn flex items-center justify-center gap-2">
            <Search class="w-4 h-4" /> Aplicar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>