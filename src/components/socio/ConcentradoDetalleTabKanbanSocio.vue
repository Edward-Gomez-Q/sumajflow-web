<!-- src/components/socio/ConcentradoDetalleTabKanbanSocio.vue -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useConcentradosSocioStore } from '@/stores/socio/concentradosSocioStore'
import {
  Clock,
  Loader,
  CheckCircle2,
  Package,
  AlertCircle
} from 'lucide-vue-next'

const props = defineProps({
  concentrado: {
    type: Object,
    required: true
  },
  concentradoId: {
    type: Number,
    required: true
  }
})

const concentradosStore = useConcentradosSocioStore()

onMounted(async () => {
  await concentradosStore.fetchProcesos(props.concentradoId)
})

watch(() => props.concentradoId, async (newId) => {
  if (newId) {
    await concentradosStore.fetchProcesos(newId)
  }
})

const kanban = computed(() => concentradosStore.kanban)

const todosProcesosPendientes = computed(() => {
  if (!kanban.value || !kanban.value.todosProcesos) return false
  return kanban.value.todosProcesos.every(p => p.estado === 'pendiente')
})

const todosCompletados = computed(() => {
  if (!kanban.value || !kanban.value.todosProcesos) return false
  return kanban.value.todosProcesos.every(p => p.estado === 'completado')
})

const columnas = computed(() => {
  if (!kanban.value || !kanban.value.todosProcesos) return []
  
  const cols = []
  const procesosOrdenados = [...kanban.value.todosProcesos].sort((a, b) => a.orden - b.orden)
  
  cols.push({
    id: 'pendiente',
    tipo: 'inicio',
    nombre: 'Por Iniciar',
    descripcion: 'Zona de inicio',
    orden: 0
  })
  
  procesosOrdenados.forEach(proceso => {
    cols.push({
      id: proceso.id,
      tipo: 'proceso',
      orden: proceso.orden,
      nombre: proceso.nombreProceso,
      proceso: proceso
    })
  })
  
  const hayProcesoIniciado = kanban.value.todosProcesos.some(p => 
    p.estado === 'en_proceso' || p.estado === 'completado'
  )
  
  if (hayProcesoIniciado || todosCompletados.value) {
    const ultimoOrden = procesosOrdenados[procesosOrdenados.length - 1]?.orden || 0
    cols.push({
      id: 'finalizado',
      tipo: 'fin',
      nombre: 'Finalizado',
      descripcion: 'Completado',
      orden: ultimoOrden + 1
    })
  }
  
  return cols
})

const columnaActual = computed(() => {
  if (!kanban.value || !kanban.value.todosProcesos) return null
  
  if (todosProcesosPendientes.value) {
    return 'pendiente'
  }
  
  if (todosCompletados.value) {
    return 'finalizado'
  }
  
  const procesoActivo = kanban.value.todosProcesos.find(p => p.estado === 'en_proceso')
  if (procesoActivo) {
    return procesoActivo.id
  }
  
  const primerPendiente = kanban.value.todosProcesos.find(p => p.estado === 'pendiente')
  return primerPendiente ? primerPendiente.id : null
})

const getEstadoIcon = (estado) => {
  switch (estado) {
    case 'pendiente': return Clock
    case 'en_proceso': return Loader
    case 'completado': return CheckCircle2
    default: return AlertCircle
  }
}

const getEstadoColor = (estado) => {
  switch (estado) {
    case 'pendiente': return 'bg-gray-500'
    case 'en_proceso': return 'bg-yellow-500'
    case 'completado': return 'bg-green-500'
    default: return 'bg-gray-400'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return null
  const date = new Date(dateString)
  return date.toLocaleDateString('es-BO', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="h-[calc(100vh-280px)] flex flex-col">
    <!-- Banner Solo Lectura -->
    <div class="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
      <div class="flex items-start gap-3">
        <AlertCircle class="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h4 class="font-semibold text-blue-900 dark:text-blue-100">Vista de Solo Lectura</h4>
          <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Este Kanban se actualiza en tiempo real conforme el ingenio procesa tu concentrado.
          </p>
        </div>
      </div>
    </div>

    <div v-if="concentradosStore.loadingKanban" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
      <p class="text-secondary">Cargando procesos...</p>
    </div>

    <div v-else-if="kanban && columnas.length > 0" class="h-full flex flex-col gap-4">
      <div class="bg-primary rounded-xl p-4 shadow-sm shrink-0">
        <div class="grid grid-cols-4 gap-4 items-center">
          <div class="text-center">
            <p class="text-xs text-white/70 mb-0.5">Total</p>
            <p class="text-2xl font-bold text-white">{{ kanban.totalProcesos }}</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-white/70 mb-0.5">Completados</p>
            <p class="text-2xl font-bold text-white">{{ kanban.procesosCompletados }}</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-white/70 mb-0.5">Pendientes</p>
            <p class="text-2xl font-bold text-white">{{ kanban.procesosPendientes }}</p>
          </div>
          
          <div class="flex items-center gap-3">
            <div class="flex-1">
              <div class="w-full bg-white/20 rounded-full h-2">
                <div 
                  class="bg-white rounded-full h-2 transition-all duration-500"
                  :style="{ width: `${(kanban.procesosCompletados / kanban.totalProcesos) * 100}%` }"
                ></div>
              </div>
            </div>
            <span class="text-sm font-semibold text-white whitespace-nowrap">
              {{ Math.round((kanban.procesosCompletados / kanban.totalProcesos) * 100) }}%
            </span>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-x-auto overflow-y-hidden scrollbar-custom">
        <div class="h-full grid gap-3 px-1" :style="{ gridTemplateColumns: `repeat(${columnas.length}, 1fr)` }">
          <div
            v-for="columna in columnas"
            :key="columna.id"
            class="bg-surface rounded-xl border-2 border-border transition-all duration-200 flex flex-col h-full min-w-0"
            :class="[
              columna.proceso?.estado === 'completado' ? 'opacity-75' : ''
            ]"
          >
            <div class="p-3 border-b border-border shrink-0">
              <template v-if="columna.tipo === 'inicio'">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-500 center shrink-0">
                    <Package class="w-4 h-4 text-white" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-neutral text-sm truncate">{{ columna.nombre }}</h3>
                    <p class="text-xs text-secondary truncate">{{ columna.descripcion }}</p>
                  </div>
                </div>
                <div class="h-11"></div>
              </template>

              <template v-else-if="columna.tipo === 'fin'">
                <div class="flex items-center gap-2 mb-2">
                  <div 
                    class="w-8 h-8 rounded-lg center shrink-0"
                    :class="todosCompletados ? 'bg-linear-to-br from-green-500 to-emerald-500' : 'bg-gray-500'"
                  >
                    <CheckCircle2 class="w-4 h-4 text-white" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-neutral text-sm truncate">{{ columna.nombre }}</h3>
                    <p class="text-xs text-secondary truncate">{{ columna.descripcion }}</p>
                  </div>
                </div>
                <div class="h-11"></div>
              </template>

              <template v-else>
                <div class="flex items-center gap-2 mb-2">
                  <div 
                    class="w-8 h-8 rounded-lg center shrink-0"
                    :class="getEstadoColor(columna.proceso.estado)"
                  >
                    <component :is="getEstadoIcon(columna.proceso.estado)" class="w-4 h-4 text-white" />
                  </div>
                  <span class="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                    Paso {{ columna.orden }}
                  </span>
                </div>
                
                <h3 class="font-semibold text-neutral text-sm mb-1 truncate">{{ columna.nombre }}</h3>
                
                <span 
                  class="inline-block text-xs px-2 py-0.5 rounded-full font-medium text-white"
                  :class="getEstadoColor(columna.proceso.estado)"
                >
                  {{ 
                    columna.proceso.estado === 'pendiente' ? 'Pendiente' : 
                    columna.proceso.estado === 'en_proceso' ? 'En Proceso' : 
                    'Completado' 
                  }}
                </span>
              </template>
            </div>

            <div class="flex-1 p-3 flex items-center justify-center overflow-y-auto scrollbar-custom min-h-0">
              <div
                v-if="columna.id === columnaActual"
                class="bg-linear-to-br from-primary via-primary to-primary/90 rounded-xl p-4 shadow-xl border-2 border-primary/50 w-full"
              >
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-10 h-10 rounded-lg bg-white/20 center shrink-0">
                    <Package class="w-5 h-5 text-white" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-white font-semibold text-sm truncate">00{{ concentrado.id }}</p>
                    <p class="text-white/70 text-xs mt-0.5 truncate">
                      {{ concentrado.mineralPrincipal }} - {{ concentrado.pesoInicial }} kg
                    </p>
                  </div>
                </div>

                <div class="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 border border-white/20">
                  <p class="text-white text-sm font-medium">
                    {{ 
                      columna.tipo === 'fin' ? 'Procesamiento completado ✓' :
                      columna.tipo === 'proceso' && columna.proceso.estado === 'en_proceso' ? 'En proceso actualmente' : 
                      'Por iniciar'
                    }}
                  </p>
                </div>
              </div>

              <div v-else class="text-center">
                <div 
                  class="w-16 h-16 rounded-full mx-auto center mb-3 transition-all"
                  :class="[
                    columna.tipo === 'inicio' ? 'bg-linear-to-br from-indigo-500/20 to-purple-500/20' : '',
                    columna.tipo === 'fin' && todosCompletados ? 'bg-linear-to-br from-green-500/20 to-emerald-500/20' : '',
                    columna.tipo === 'fin' && !todosCompletados ? 'bg-gray-500/10' : '',
                    columna.proceso?.estado === 'completado' ? 'bg-green-500/20' : '',
                    columna.proceso?.estado !== 'completado' && columna.tipo === 'proceso' ? 'bg-gray-500/10' : ''
                  ]"
                >
                  <component 
                    :is="columna.tipo === 'inicio' ? Package : columna.tipo === 'fin' ? CheckCircle2 : getEstadoIcon(columna.proceso.estado)" 
                    class="w-8 h-8"
                    :class="[
                      columna.tipo === 'inicio' ? 'text-indigo-500' : '',
                      columna.tipo === 'fin' && todosCompletados ? 'text-green-500' : '',
                      columna.tipo === 'fin' && !todosCompletados ? 'text-gray-400' : '',
                      columna.proceso?.estado === 'completado' ? 'text-green-500' : '',
                      columna.proceso?.estado !== 'completado' && columna.tipo === 'proceso' ? 'text-gray-400' : ''
                    ]"
                  />
                </div>
                <p class="text-sm text-secondary font-medium">
                  {{ 
                    columna.tipo === 'inicio' ? 'Zona de inicio' :
                    columna.tipo === 'fin' && todosCompletados ? 'Completado ✓' :
                    columna.tipo === 'fin' && !todosCompletados ? 'Pendiente de finalizar' :
                    columna.proceso?.estado === 'completado' ? 'Completado ✓' : 
                    'Esperando...' 
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <AlertCircle class="w-16 h-16 text-secondary mx-auto mb-4" />
      <p class="text-secondary">No hay procesos configurados para este concentrado</p>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-custom::-webkit-scrollbar {
  height: 8px;
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