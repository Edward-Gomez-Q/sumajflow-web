<!-- src/components/ingenio/ConcentradoDetalleTabKanbanBoard.vue -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useConcentradosIngenioStore } from '@/stores/ingenio/concentradosIngenioStore'
import {
  Clock,
  Loader,
  CheckCircle2,
  PlayCircle,
  Package,
  FileText,
  AlertCircle,
  Zap,
  ArrowRight,
  Sparkles
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

const concentradosStore = useConcentradosIngenioStore()
const observacionesModal = ref(false)
const procesoDestino = ref(null)
const observacionesTexto = ref('')
const columnaHover = ref(null)

onMounted(async () => {
  await concentradosStore.fetchProcesos(props.concentradoId)
})

watch(() => props.concentradoId, async (newId) => {
  if (newId) {
    await concentradosStore.fetchProcesos(newId)
  }
})

const kanban = computed(() => concentradosStore.kanban)

// Determinar si todos los procesos están pendientes (no se ha iniciado nada)
const todosProcesosPendientes = computed(() => {
  if (!kanban.value || !kanban.value.todosProcesos) return false
  return kanban.value.todosProcesos.every(p => p.estado === 'pendiente')
})

// Crear columnas: columna "Pendiente" + columnas de procesos + columna "Finalizado"
const columnas = computed(() => {
  if (!kanban.value || !kanban.value.todosProcesos) return []
  
  const cols = []
  const procesosOrdenados = [...kanban.value.todosProcesos].sort((a, b) => a.orden - b.orden)
  
  // Columna inicial "Pendiente" (solo si todos los procesos están pendientes)
  if (todosProcesosPendientes.value) {
    cols.push({
      id: 'pendiente',
      tipo: 'inicio',
      nombre: 'Por Iniciar',
      descripcion: 'Arrastra al primer proceso para comenzar',
      orden: 0
    })
  }
  
  // Columnas de procesos
  procesosOrdenados.forEach(proceso => {
    cols.push({
      id: proceso.id,
      tipo: 'proceso',
      orden: proceso.orden,
      nombre: proceso.nombreProceso,
      proceso: proceso
    })
  })
  
  // Columna final "Finalizado" (solo si hay al menos un proceso iniciado o completado)
  const hayProcesoIniciado = kanban.value.todosProcesos.some(p => 
    p.estado === 'en_proceso' || p.estado === 'completado'
  )
  
  if (hayProcesoIniciado) {
    const ultimoOrden = procesosOrdenados[procesosOrdenados.length - 1]?.orden || 0
    cols.push({
      id: 'finalizado',
      tipo: 'fin',
      nombre: 'Finalizado',
      descripcion: 'Arrastra aquí para completar',
      orden: ultimoOrden + 1
    })
  }
  
  return cols
})

// Determinar en qué columna está el concentrado
const columnaActual = computed(() => {
  if (!kanban.value || !kanban.value.todosProcesos) return null
  
  // Si todos están pendientes, está en la columna "Pendiente"
  if (todosProcesosPendientes.value) {
    return 'pendiente'
  }
  
  // Si todos están completados, está en columna "Finalizado"
  const todosCompletados = kanban.value.todosProcesos.every(p => p.estado === 'completado')
  if (todosCompletados) {
    return 'finalizado'
  }
  
  // Buscar primer proceso en_proceso
  const procesoActivo = kanban.value.todosProcesos.find(p => p.estado === 'en_proceso')
  if (procesoActivo) return procesoActivo.id
  
  // Si no, buscar primer pendiente (ya se inició alguno antes)
  const primerPendiente = kanban.value.todosProcesos.find(p => p.estado === 'pendiente')
  return primerPendiente ? primerPendiente.id : null
})

// Drag & Drop handlers
const onDragStart = (evento) => {
  evento.dataTransfer.effectAllowed = 'move'
  evento.dataTransfer.setData('text/plain', 'concentrado')
}

const onDragEnd = () => {
  columnaHover.value = null
}

const onDragOver = (evento, columna) => {
  evento.preventDefault()
  
  // No puedes soltar en la columna donde ya estás
  if (columna.id === columnaActual.value) {
    evento.dataTransfer.dropEffect = 'none'
    return
  }
  
  // Validar si es un movimiento válido
  const valido = validarMovimiento(columna)
  
  if (valido) {
    evento.dataTransfer.dropEffect = 'move'
    columnaHover.value = columna.id
  } else {
    evento.dataTransfer.dropEffect = 'none'
    columnaHover.value = null
  }
}

const onDragLeave = () => {
  columnaHover.value = null
}

const onDrop = async (evento, columna) => {
  evento.preventDefault()
  columnaHover.value = null
  
  // Validar movimiento
  if (!validarMovimiento(columna)) {
    mostrarError('No puedes mover el concentrado a esta columna')
    return
  }
  
  // Abrir modal para observaciones
  procesoDestino.value = columna
  observacionesTexto.value = ''
  observacionesModal.value = true
}

// Validar si se puede mover a una columna
const validarMovimiento = (columna) => {
  // Si está en "Pendiente", solo puede ir al primer proceso
  if (columnaActual.value === 'pendiente') {
    return columna.tipo === 'proceso' && columna.orden === 1
  }
  
  // No puede ir a columna "Pendiente" una vez salió de ella
  if (columna.tipo === 'inicio') {
    return false
  }
  
  // No puede ir a "Finalizado" si ya está ahí
  if (columna.tipo === 'fin' && columnaActual.value === 'finalizado') {
    return false
  }
  
  // Permitir mover a columna "Finalizado" solo si está en el último proceso
  if (columna.tipo === 'fin') {
    const ultimoProceso = kanban.value.todosProcesos
      .sort((a, b) => a.orden - b.orden)[kanban.value.todosProcesos.length - 1]
    return columnaActual.value === ultimoProceso.id
  }
  
  // No puede mover a procesos completados
  if (columna.proceso && columna.proceso.estado === 'completado') {
    return false
  }
  
  // Solo puede mover hacia adelante (no retroceder)
  const columnaActualObj = columnas.value.find(c => c.id === columnaActual.value)
  if (columnaActualObj && columna.orden < columnaActualObj.orden) {
    return false
  }
  
  return true
}

// Ejecutar movimiento
const ejecutarMovimiento = async () => {
  if (!procesoDestino.value) return
  
  // Si la columna destino es "Finalizado", completar el último proceso
  if (procesoDestino.value.tipo === 'fin') {
    const ultimoProceso = kanban.value.todosProcesos
      .sort((a, b) => a.orden - b.orden)[kanban.value.todosProcesos.length - 1]
    
    // Usar el endpoint tradicional para completar el último proceso
    const result = await concentradosStore.avanzarProceso(
      props.concentradoId,
      ultimoProceso.id,
      observacionesTexto.value || null
    )
    
    if (result.success) {
      cerrarModal()
    }
  } else {
    // Usar el nuevo endpoint para mover a procesos intermedios
    const result = await concentradosStore.moverAProceso(
      props.concentradoId,
      procesoDestino.value.id,
      observacionesTexto.value || null
    )
    
    if (result.success) {
      cerrarModal()
    }
  }
}

const cerrarModal = () => {
  observacionesModal.value = false
  procesoDestino.value = null
  observacionesTexto.value = ''
}

const mostrarError = (mensaje) => {
  const errorDiv = document.createElement('div')
  errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-[10002] animate-slide-in-right'
  errorDiv.textContent = mensaje
  document.body.appendChild(errorDiv)
  
  setTimeout(() => {
    errorDiv.remove()
  }, 3000)
}

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

// Calcular cuántos procesos se completarán automáticamente
const procesosQueSeCompletaran = computed(() => {
  if (!procesoDestino.value || !kanban.value) return []
  
  // Si va a "Finalizado", no mostrar lista (solo se completa el último)
  if (procesoDestino.value.tipo === 'fin') return []
  
  const columnaActualObj = columnas.value.find(c => c.id === columnaActual.value)
  if (!columnaActualObj || columnaActualObj.tipo === 'inicio') return []
  
  // Calcular procesos entre actual y destino
  const intermedios = kanban.value.todosProcesos.filter(p => 
    p.orden >= columnaActualObj.orden && 
    p.orden < procesoDestino.value.orden &&
    p.estado !== 'completado'
  )
  
  return intermedios
})
</script>

<template>
  <div class="space-y-6">
    <!-- Loading -->
    <div v-if="concentradosStore.loadingKanban" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
      <p class="text-secondary">Cargando procesos...</p>
    </div>

    <!-- Kanban Content -->
    <div v-else-if="kanban && columnas.length > 0" class="space-y-6">
      <!-- Resumen Superior -->
      <div class="bg-primary rounded-xl p-6 shadow-sm">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p class="text-sm text-white/70 mb-1">Total Procesos</p>
            <p class="text-3xl font-bold text-white">{{ kanban.totalProcesos }}</p>
          </div>
          <div>
            <p class="text-sm text-white/70 mb-1">Completados</p>
            <p class="text-3xl font-bold text-white">{{ kanban.procesosCompletados }}</p>
          </div>
          <div>
            <p class="text-sm text-white/70 mb-1">Pendientes</p>
            <p class="text-3xl font-bold text-white">{{ kanban.procesosPendientes }}</p>
          </div>
        </div>

        <!-- Progreso visual -->
        <div class="mt-4 pt-4 border-t border-white/20">
          <div class="flex items-center justify-between text-sm text-white/70 mb-2">
            <span>Progreso del procesamiento</span>
            <span class="font-semibold">{{ Math.round((kanban.procesosCompletados / kanban.totalProcesos) * 100) }}%</span>
          </div>
          <div class="w-full bg-white/20 rounded-full h-3">
            <div 
              class="bg-white rounded-full h-3 transition-all duration-500"
              :style="{ width: `${(kanban.procesosCompletados / kanban.totalProcesos) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Instrucciones -->
      <div class="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <Zap class="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div class="text-sm text-blue-800 dark:text-blue-200">
            <p class="font-medium mb-1">¿Cómo usar el tablero Kanban?</p>
            <p>
              <strong>Arrastra</strong> el concentrado (tarjeta azul) entre las columnas para avanzar. 
              <span class="inline-flex items-center gap-1">
                <Sparkles class="w-3 h-3 inline" />
                <strong>Puedes saltar procesos</strong>
              </span> 
              y se completarán automáticamente.
            </p>
          </div>
        </div>
      </div>

      <!-- Tablero Kanban -->
      <div class="overflow-x-auto pb-4 scrollbar-custom">
        <div class="inline-flex gap-4 min-w-full">
          <!-- Iterar sobre todas las columnas -->
          <div
            v-for="columna in columnas"
            :key="columna.id"
            class="shrink-0 w-80 bg-base rounded-xl border-2 transition-all duration-200"
            :class="[
              columnaHover === columna.id ? 'border-primary shadow-xl ring-4 ring-primary/20 scale-[1.02]' : 'border-border',
              columna.proceso?.estado === 'completado' ? 'opacity-75' : ''
            ]"
            @dragover="onDragOver($event, columna)"
            @dragleave="onDragLeave"
            @drop="onDrop($event, columna)"
          >
            <!-- Header de columna -->
            <div 
              class="p-4 border-b border-border"
              :class="[
                columna.tipo === 'inicio' ? 'bg-linear-to-br from-indigo-500/10 to-purple-500/10' : '',
                columna.tipo === 'fin' ? 'bg-linear-to-br from-green-500/10 to-emerald-500/10' : '',
                columna.proceso?.estado === 'en_proceso' ? 'bg-yellow-500/10' : '',
                columna.proceso?.estado === 'completado' ? 'bg-green-500/10' : ''
              ]"
            >
              <!-- Columna "Pendiente" (inicio) -->
              <template v-if="columna.tipo === 'inicio'">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-500 center shrink-0 shadow-lg">
                    <Package class="w-4 h-4 text-white" />
                  </div>
                  <span class="text-xs px-2 py-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium">
                    Inicio
                  </span>
                </div>
                <h3 class="font-semibold text-neutral text-lg mb-1">{{ columna.nombre }}</h3>
                <p class="text-xs text-secondary">{{ columna.descripcion }}</p>
              </template>

              <!-- Columna "Finalizado" (fin) -->
              <template v-else-if="columna.tipo === 'fin'">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-8 h-8 rounded-lg bg-linear-to-br from-green-500 to-emerald-500 center shrink-0 shadow-lg">
                    <CheckCircle2 class="w-4 h-4 text-white" />
                  </div>
                  <span class="text-xs px-2 py-1 rounded bg-green-500/10 text-green-600 dark:text-green-400 font-medium">
                    Fin
                  </span>
                </div>
                <h3 class="font-semibold text-neutral text-lg mb-1">{{ columna.nombre }}</h3>
                <p class="text-xs text-secondary">{{ columna.descripcion }}</p>
              </template>

              <!-- Columnas de Procesos -->
              <template v-else>
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <div 
                      class="w-8 h-8 rounded-lg center shrink-0 shadow-sm"
                      :class="getEstadoColor(columna.proceso.estado)"
                    >
                      <component :is="getEstadoIcon(columna.proceso.estado)" class="w-4 h-4 text-white" />
                    </div>
                    <span class="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                      Paso {{ columna.orden }}
                    </span>
                  </div>
                </div>
                
                <h3 class="font-semibold text-neutral text-lg">{{ columna.nombre }}</h3>
                
                <div class="mt-2 flex items-center gap-2">
                  <span 
                    class="text-xs px-2 py-1 rounded-full font-medium text-white shadow-sm"
                    :class="getEstadoColor(columna.proceso.estado)"
                  >
                    {{ 
                      columna.proceso.estado === 'pendiente' ? 'Pendiente' : 
                      columna.proceso.estado === 'en_proceso' ? 'En Proceso' : 
                      'Completado' 
                    }}
                  </span>
                </div>

                <!-- Fechas -->
                <div v-if="columna.proceso.fechaInicio || columna.proceso.fechaFin" class="mt-3 space-y-1 text-xs text-secondary">
                  <div v-if="columna.proceso.fechaInicio" class="flex items-center gap-1">
                    <PlayCircle class="w-3 h-3" />
                    <span>Iniciado: {{ formatDate(columna.proceso.fechaInicio) }}</span>
                  </div>
                  <div v-if="columna.proceso.fechaFin" class="flex items-center gap-1">
                    <CheckCircle2 class="w-3 h-3" />
                    <span>Finalizado: {{ formatDate(columna.proceso.fechaFin) }}</span>
                  </div>
                </div>
              </template>
            </div>

            <!-- Drop zone / Contenido -->
            <div class="p-4 min-h-[200px] flex items-center justify-center">
              <!-- Concentrado está en esta columna -->
              <div
                v-if="columna.id === columnaActual"
                class="bg-linear-to-br from-primary via-primary to-primary/90 rounded-xl p-4 shadow-xl border-2 border-primary/50 w-full cursor-move hover:shadow-2xl hover:scale-[1.02] transition-all group"
                draggable="true"
                @dragstart="onDragStart"
                @dragend="onDragEnd"
              >
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-10 h-10 rounded-lg bg-white/20 center shrink-0 shadow-inner">
                    <Package class="w-5 h-5 text-white" />
                  </div>
                  <div class="flex-1">
                    <p class="text-white font-semibold text-sm">{{ concentrado.codigoConcentrado }}</p>
                    <p class="text-white/70 text-xs mt-0.5">
                      {{ concentrado.mineralPrincipal }} - {{ concentrado.pesoInicial }} kg
                    </p>
                  </div>
                </div>

                <div class="bg-white/15 backdrop-blur-sm rounded-lg p-2.5 border border-white/20">
                  <p class="text-white/90 text-xs font-medium mb-1 flex items-center gap-1">
                    <ArrowRight class="w-3 h-3" />
                    Arrastra para avanzar
                  </p>
                  <p class="text-white text-sm font-medium">
                    {{ 
                      columna.tipo === 'inicio' ? 'Por iniciar procesamiento' :
                      columna.tipo === 'fin' ? 'Procesamiento completado ✓' :
                      columna.proceso.estado === 'pendiente' ? 'Por iniciar' : 
                      'En proceso' 
                    }}
                  </p>
                </div>

                <!-- Observaciones del proceso actual -->
                <div v-if="columna.proceso && columna.proceso.observaciones" class="mt-3 bg-white/10 rounded-lg p-2 backdrop-blur-sm border border-white/10">
                  <p class="text-white/90 text-xs font-medium mb-1 flex items-center gap-1">
                    <FileText class="w-3 h-3" />
                    Observaciones:
                  </p>
                  <p class="text-white/80 text-xs leading-relaxed">{{ columna.proceso.observaciones }}</p>
                </div>

                <!-- Indicador de arrastre -->
                <div v-if="columna.tipo !== 'fin'" class="mt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <p class="text-white/60 text-xs font-medium">↔ Arrastra aquí ↔</p>
                </div>
              </div>

              <!-- Columna vacía -->
              <div v-else class="text-center">
                <div 
                  class="w-16 h-16 rounded-full mx-auto center mb-3 transition-all"
                  :class="[
                    columna.tipo === 'inicio' ? 'bg-linear-to-br from-indigo-500/20 to-purple-500/20' : '',
                    columna.tipo === 'fin' ? 'bg-linear-to-br from-green-500/20 to-emerald-500/20' : '',
                    columna.proceso?.estado === 'completado' ? 'bg-green-500/20' : 'bg-gray-500/10'
                  ]"
                >
                  <component 
                    :is="columna.tipo === 'inicio' ? Package : columna.tipo === 'fin' ? CheckCircle2 : getEstadoIcon(columna.proceso.estado)" 
                    class="w-8 h-8"
                    :class="[
                      columna.tipo === 'inicio' ? 'text-indigo-500' : '',
                      columna.tipo === 'fin' ? 'text-green-500' : '',
                      columna.proceso?.estado === 'completado' ? 'text-green-500' : 'text-gray-400'
                    ]"
                  />
                </div>
                <p class="text-sm text-secondary font-medium">
                  {{ 
                    columna.tipo === 'inicio' ? 'Zona de inicio' :
                    columna.tipo === 'fin' ? 'Completa aquí ✓' :
                    columna.proceso?.estado === 'completado' ? 'Completado ✓' : 
                    'Esperando...' 
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Observaciones globales -->
      <div v-if="kanban.procesoActual && kanban.procesoActual.observaciones" class="bg-hover rounded-xl p-4 border border-border">
        <div class="flex items-start gap-3">
          <FileText class="w-5 h-5 text-secondary shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="text-sm font-medium text-neutral mb-1">Observaciones del proceso actual:</p>
            <p class="text-sm text-secondary">{{ kanban.procesoActual.observaciones }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-else class="text-center py-12">
      <AlertCircle class="w-16 h-16 text-secondary mx-auto mb-4" />
      <p class="text-secondary">No hay procesos configurados para este concentrado</p>
    </div>

    <!-- Modal de Confirmación -->
    <Teleport to="body">
      <div
        v-if="observacionesModal && procesoDestino"
        class="fixed inset-0 z-10001 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4"
        @click.self="cerrarModal"
      >
        <div class="bg-surface rounded-xl shadow-2xl w-full max-w-lg border border-border animate-scale-in">
          <!-- Header -->
          <div class="p-6 border-b border-border bg-linear-to-br from-primary/5 to-transparent">
            <div class="flex items-center gap-3">
              <div 
                class="w-12 h-12 rounded-lg center shrink-0 shadow-lg"
                :class="procesoDestino.tipo === 'fin' ? 'bg-linear-to-br from-green-500 to-green-600' : 'bg-linear-to-br from-primary to-primary/80'"
              >
                <component :is="procesoDestino.tipo === 'fin' ? CheckCircle2 : Zap" class="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-neutral">
                  {{ procesoDestino.tipo === 'fin' ? 'Finalizar Procesamiento' : 'Mover Concentrado' }}
                </h3>
                <p class="text-sm text-secondary mt-0.5">
                  {{ 
                    procesoDestino.tipo === 'inicio' ? 'Iniciar procesamiento' : 
                    procesoDestino.tipo === 'fin' ? 'Completar último proceso' :
                    procesoDestino.nombre 
                  }}
                </p>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="p-6 space-y-4">
            <!-- Información del movimiento -->
            <div 
              class="border-2 rounded-lg p-4"
              :class="[
                procesoDestino.tipo === 'fin' 
                  ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                  : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
              ]"
            >
              <div class="flex items-start gap-2">
                <component 
                  :is="procesoDestino.tipo === 'fin' ? CheckCircle2 : ArrowRight" 
                  class="w-5 h-5 shrink-0 mt-0.5"
                  :class="procesoDestino.tipo === 'fin' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'"
                />
                <div 
                  class="text-sm"
                  :class="procesoDestino.tipo === 'fin' 
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-blue-800 dark:text-blue-200'"
                >
                  <template v-if="procesoDestino.tipo === 'fin'">
                    <p class="font-medium mb-1">Se completará el procesamiento:</p>
                    <p class="text-base font-semibold">
                      {{ kanban.todosProcesos.sort((a, b) => a.orden - b.orden)[kanban.todosProcesos.length - 1]?.nombreProceso }}
                    </p>
                    <p class="mt-2 text-xs opacity-80">
                      El concentrado pasará a estado: <strong>"Esperando Reporte Químico"</strong>
                    </p>
                  </template>
                  <template v-else>
                    <p class="font-medium mb-1">Se moverá el concentrado a:</p>
                    <p class="text-base font-semibold">{{ procesoDestino.nombre }}</p>
                    
                    <!-- Mostrar procesos que se completarán automáticamente -->
                    <div v-if="procesosQueSeCompletaran.length > 0" class="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                      <p class="font-medium mb-2 flex items-center gap-1.5">
                        <Sparkles class="w-4 h-4" />
                        Se completarán automáticamente:
                      </p>
                      <ul class="mt-2 space-y-1.5">
                        <li 
                          v-for="proceso in procesosQueSeCompletaran" 
                          :key="proceso.id" 
                          class="text-xs flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded"
                        >
                          <CheckCircle2 class="w-3 h-3 shrink-0" />
                          <span class="font-medium">{{ proceso.nombreProceso }}</span>
                        </li>
                      </ul>
                    </div>
                  </template>
                </div>
              </div>
            </div>

            <!-- Observaciones -->
            <div class="input-group">
              <label class="input-label flex items-center gap-1.5">
                <FileText class="w-4 h-4" />
                Observaciones (opcional)
              </label>
              <textarea
                v-model="observacionesTexto"
                rows="4"
                placeholder="Añade notas sobre este movimiento..."
                class="w-full"
                autofocus
              ></textarea>
              <p class="input-helper">Documenta cualquier detalle relevante del proceso</p>
            </div>
          </div>

          <!-- Acciones -->
          <div class="flex gap-3 p-6 border-t border-border bg-hover/30">
            <button
              @click="cerrarModal"
              class="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              @click="ejecutarMovimiento"
              class="btn flex-1 flex items-center justify-center gap-2 shadow-lg"
              :class="procesoDestino.tipo === 'fin' 
                ? 'bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
                : 'bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary'"
            >
              <component :is="procesoDestino.tipo === 'fin' ? CheckCircle2 : Zap" class="w-4 h-4" />
              {{ procesoDestino.tipo === 'fin' ? 'Finalizar Procesamiento' : 'Confirmar Movimiento' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-in {
  animation: scale-in 0.2s ease-out;
}

@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}

/* Scrollbar personalizada */
.scrollbar-custom::-webkit-scrollbar {
  height: 8px;
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