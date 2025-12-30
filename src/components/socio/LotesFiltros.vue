<!-- src/components/socio/LotesFiltros.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMinasStore } from '@/stores/socio/minasStore'
import { Filter, X, Search, Calendar, Trash2 } from 'lucide-vue-next'

const props = defineProps({
  filtrosActuales: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['aplicar', 'limpiar'])

const minasStore = useMinasStore()

const mostrarFiltros = ref(false)
const filtrosLocales = ref({ ...props.filtrosActuales })

onMounted(async () => {
  await minasStore.fetchMinas()
})

const estadosDisponibles = [
  'Pendiente de aprobación cooperativa',
  'Pendiente de aprobación por Ingenio',
  'Pendiente de aprobación por Comercializadora',
  'Aprobado - Pendiente de iniciar',
  'En camino a la mina',
  'Esperando recoger mineral',
  'En camino a balanza cooperativa',
  'En camino a balanza ingenio',
  'En camino a balanza comercializadora',
  'En camino al almacén',
  'Completado',
  'Rechazado'
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
    tipoOperacion: null,
    tipoMineral: null,
    fechaDesde: null,
    fechaHasta: null,
    minaId: null,
    destinoId: null,
    page: 0,
    size: filtrosLocales.value.size,
    sortBy: 'fechaCreacion',
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
      class="absolute top-full right-0 mt-2 w-96 bg-surface rounded-xl shadow-2xl border border-border z-50 p-4"
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
            <option v-for="estado in estadosDisponibles" :key="estado" :value="estado">
              {{ estado }}
            </option>
          </select>
        </div>

        <!-- Tipo de Operación -->
        <div class="input-group">
          <label class="input-label">Tipo de Operación</label>
          <select v-model="filtrosLocales.tipoOperacion">
            <option :value="null">Todas</option>
            <option value="procesamiento_planta">Procesamiento en Planta</option>
            <option value="venta_directa">Venta Directa</option>
          </select>
        </div>

        <!-- Tipo de Mineral -->
        <div class="input-group">
          <label class="input-label">Tipo de Mineral</label>
          <select v-model="filtrosLocales.tipoMineral">
            <option :value="null">Todos</option>
            <option value="complejo">Complejo</option>
            <option value="concentrado">Concentrado</option>
          </select>
        </div>

        <!-- Mina -->
        <div class="input-group">
          <label class="input-label">Mina</label>
          <select v-model="filtrosLocales.minaId">
            <option :value="null">Todas las minas</option>
            <option
              v-for="mina in minasStore.minasActivas"
              :key="mina.id"
              :value="mina.id"
            >
              {{ mina.nombre }}
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

        <!-- Ordenamiento -->
        <div class="input-group">
          <label class="input-label">Ordenar por</label>
          <div class="grid grid-cols-2 gap-2">
            <select v-model="filtrosLocales.sortBy">
              <option value="fechaCreacion">Fecha Creación</option>
              <option value="estado">Estado</option>
              <option value="tipoOperacion">Tipo Operación</option>
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