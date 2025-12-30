<!-- src/components/socio/Paginacion.vue -->
<script setup>
import { computed } from 'vue'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next'

const props = defineProps({
  paginaActual: {
    type: Number,
    required: true
  },
  totalPaginas: {
    type: Number,
    required: true
  },
  totalElementos: {
    type: Number,
    required: true
  },
  elementosPorPagina: {
    type: Number,
    required: true
  },
  tieneSiguiente: {
    type: Boolean,
    default: false
  },
  tieneAnterior: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['cambiar-pagina', 'cambiar-tamano'])

const paginasVisibles = computed(() => {
  const total = props.totalPaginas
  const actual = props.paginaActual
  const paginas = []

  if (total <= 7) {
    for (let i = 0; i < total; i++) {
      paginas.push(i)
    }
  } else {
    if (actual < 4) {
      for (let i = 0; i < 5; i++) paginas.push(i)
      paginas.push('...')
      paginas.push(total - 1)
    } else if (actual > total - 5) {
      paginas.push(0)
      paginas.push('...')
      for (let i = total - 5; i < total; i++) paginas.push(i)
    } else {
      paginas.push(0)
      paginas.push('...')
      for (let i = actual - 1; i <= actual + 1; i++) paginas.push(i)
      paginas.push('...')
      paginas.push(total - 1)
    }
  }

  return paginas
})

const rangoElementos = computed(() => {
  const inicio = props.paginaActual * props.elementosPorPagina + 1
  const fin = Math.min((props.paginaActual + 1) * props.elementosPorPagina, props.totalElementos)
  return `${inicio}-${fin} de ${props.totalElementos}`
})
</script>

<template>
  <div v-if="totalPaginas > 1" class="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
    <!-- Info de elementos -->
    <div class="text-sm text-secondary">
      Mostrando <span class="font-medium text-neutral">{{ rangoElementos }}</span> elementos
    </div>

    <!-- Controles de paginación -->
    <div class="flex items-center gap-2">
      <!-- Primera página -->
      <button
        @click="emit('cambiar-pagina', 0)"
        :disabled="!tieneAnterior"
        class="w-8 h-8 rounded-lg center transition-colors"
        :class="tieneAnterior 
          ? 'hover:bg-hover text-neutral' 
          : 'text-tertiary cursor-not-allowed'"
      >
        <ChevronsLeft class="w-4 h-4" />
      </button>

      <!-- Página anterior -->
      <button
        @click="emit('cambiar-pagina', paginaActual - 1)"
        :disabled="!tieneAnterior"
        class="w-8 h-8 rounded-lg center transition-colors"
        :class="tieneAnterior 
          ? 'hover:bg-hover text-neutral' 
          : 'text-tertiary cursor-not-allowed'"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>

      <!-- Números de página -->
      <div class="flex gap-1">
        <button
          v-for="(pagina, index) in paginasVisibles"
          :key="index"
          @click="pagina !== '...' && emit('cambiar-pagina', pagina)"
          class="w-8 h-8 rounded-lg center text-sm font-medium transition-all"
          :class="pagina === paginaActual
            ? 'bg-primary text-white'
            : pagina === '...'
            ? 'text-secondary cursor-default'
            : 'hover:bg-hover text-neutral'"
        >
          {{ pagina === '...' ? '...' : pagina + 1 }}
        </button>
      </div>

      <!-- Página siguiente -->
      <button
        @click="emit('cambiar-pagina', paginaActual + 1)"
        :disabled="!tieneSiguiente"
        class="w-8 h-8 rounded-lg center transition-colors"
        :class="tieneSiguiente 
          ? 'hover:bg-hover text-neutral' 
          : 'text-tertiary cursor-not-allowed'"
      >
        <ChevronRight class="w-4 h-4" />
      </button>

      <!-- Última página -->
      <button
        @click="emit('cambiar-pagina', totalPaginas - 1)"
        :disabled="!tieneSiguiente"
        class="w-8 h-8 rounded-lg center transition-colors"
        :class="tieneSiguiente 
          ? 'hover:bg-hover text-neutral' 
          : 'text-tertiary cursor-not-allowed'"
      >
        <ChevronsRight class="w-4 h-4" />
      </button>
    </div>

    <!-- Selector de elementos por página -->
    <div class="flex items-center gap-2">
      <label class="text-sm text-secondary">Por página:</label>
      <select
        :value="elementosPorPagina"
        @change="emit('cambiar-tamano', parseInt($event.target.value))"
        class="w-20 text-sm py-1"
      >
        <option value="5">5</option>
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="50">50</option>
      </select>
    </div>
  </div>
</template>