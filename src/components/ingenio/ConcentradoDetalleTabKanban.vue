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
const columnaHover = ref(null)

const observacionesFinProceso = ref('')
const observacionesInicioProceso = ref('')
const observacionesGenerales = ref('')

// Después de las observaciones existentes
const pesoTmh = ref(null)
const pesoTms = ref(null)
const numeroSacos = ref(null)

// Validación
const erroresCampos = ref({
  pesoTmh: '',
  pesoTms: '',
  numeroSacos: ''
})

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

const tipoMovimiento = computed(() => {
  if (!procesoDestino.value || !columnaActual.value) return null
  
  const columnaActualObj = columnas.value.find(c => c.id === columnaActual.value)
  
  if (columnaActualObj?.tipo === 'inicio') {
    return 'iniciar'
  }
  
  if (procesoDestino.value.tipo === 'fin') {
    return 'finalizar'
  }
  
  return 'intermedio'
})

const tituloModal = computed(() => {
  switch (tipoMovimiento.value) {
    case 'iniciar': return 'Iniciar Procesamiento'
    case 'finalizar': return 'Finalizar Procesamiento'
    default: return 'Avanzar Proceso'
  }
})

const subtituloModal = computed(() => {
  switch (tipoMovimiento.value) {
    case 'iniciar': return 'Primer proceso del concentrado'
    case 'finalizar': return 'Completar procesamiento completo'
    default: return 'Movimiento entre procesos'
  }
})

const textoBotonConfirmar = computed(() => {
  switch (tipoMovimiento.value) {
    case 'iniciar': return 'Iniciar Proceso'
    case 'finalizar': return 'Finalizar Procesamiento'
    default: return 'Confirmar Movimiento'
  }
})

const nombreProcesoActual = computed(() => {
  const columnaActualObj = columnas.value.find(c => c.id === columnaActual.value)
  return columnaActualObj?.nombre || ''
})

const nombreProcesoDestino = computed(() => {
  return procesoDestino.value?.nombre || ''
})

const columnas = computed(() => {
  if (!kanban.value || !kanban.value.todosProcesos) return []
  
  const cols = []
  const procesosOrdenados = [...kanban.value.todosProcesos].sort((a, b) => a.orden - b.orden)
  
  cols.push({
    id: 'pendiente',
    tipo: 'inicio',
    nombre: 'Iniciar',
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

const procesosQueSeCompletaran = computed(() => {
  if (!procesoDestino.value || !kanban.value) return []
  
  if (procesoDestino.value.tipo === 'fin') return []
  if (tipoMovimiento.value === 'iniciar') return []
  
  const columnaActualObj = columnas.value.find(c => c.id === columnaActual.value)
  if (!columnaActualObj || columnaActualObj.tipo === 'inicio') return []
  
  const intermedios = kanban.value.todosProcesos.filter(p => {
    if (p.id === columnaActual.value && p.estado === 'en_proceso') {
      return true
    }
    
    return p.orden > columnaActualObj.orden && 
           p.orden < procesoDestino.value.orden &&
           p.estado !== 'completado'
  })
  
  return intermedios
})

const onDragStart = (evento) => {
  evento.dataTransfer.effectAllowed = 'move'
  evento.dataTransfer.setData('text/plain', 'concentrado')
}

const onDragEnd = () => {
  columnaHover.value = null
}

const onDragOver = (evento, columna) => {
  evento.preventDefault()
  
  if (columna.id === columnaActual.value) {
    evento.dataTransfer.dropEffect = 'none'
    return
  }
  
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
  
  if (!validarMovimiento(columna)) {
    mostrarError('No puedes mover el concentrado a esta columna')
    return
  }
  
  procesoDestino.value = columna
  observacionesModal.value = true
}

const validarMovimiento = (columna) => {
  if (columnaActual.value === 'pendiente') {
    return columna.tipo === 'proceso' && columna.orden === 1
  }
  
  if (columna.tipo === 'inicio') {
    return false
  }
  
  if (columnaActual.value === 'finalizado') {
    return false
  }
  
  if (columna.tipo === 'fin') {
    const procesosOrdenados = [...kanban.value.todosProcesos].sort((a, b) => a.orden - b.orden)
    const ultimoProceso = procesosOrdenados[procesosOrdenados.length - 1]
    
    return columnaActual.value === ultimoProceso.id && ultimoProceso.estado === 'en_proceso'
  }
  
  if (columna.proceso && columna.proceso.estado === 'completado') {
    return false
  }
  
  const columnaActualObj = columnas.value.find(c => c.id === columnaActual.value)
  
  if (columnaActualObj && columna.tipo === 'proceso') {
    return columna.orden === columnaActualObj.orden + 1
  }
  
  return false
}

const ejecutarMovimiento = async () => {
  if (!procesoDestino.value) return
  
  let result
  
  if (tipoMovimiento.value === 'iniciar') {
    result = await concentradosStore.iniciarProcesamiento(
      props.concentradoId,
      observacionesInicioProceso.value || null
    )
  } 
  else if (tipoMovimiento.value === 'finalizar') {
    // ========== VALIDACIONES ANTES DE ENVIAR ==========
    erroresCampos.value = {
      pesoTmh: '',
      pesoTms: '',
      numeroSacos: ''
    }
    
    let hayErrores = false
    
    if (!pesoTmh.value || pesoTmh.value <= 0) {
      erroresCampos.value.pesoTmh = 'El peso TMH es obligatorio y debe ser mayor a 0'
      hayErrores = true
    }
    
    if (!pesoTms.value || pesoTms.value <= 0) {
      erroresCampos.value.pesoTms = 'El peso TMS es obligatorio y debe ser mayor a 0'
      hayErrores = true
    }
    
    if (!numeroSacos.value || numeroSacos.value < 1) {
      erroresCampos.value.numeroSacos = 'El número de sacos es obligatorio y debe ser al menos 1'
      hayErrores = true
    }
    
    if (pesoTms.value && pesoTmh.value && pesoTms.value > pesoTmh.value) {
      erroresCampos.value.pesoTms = 'El peso TMS no puede ser mayor al peso TMH'
      hayErrores = true
    }
    
    if (hayErrores) {
      mostrarError('Por favor complete todos los campos obligatorios correctamente')
      return
    }
    
    // ========== ENVIAR DATOS COMPLETOS ==========
    result = await concentradosStore.finalizarProcesamiento(
      props.concentradoId,
      {
        pesoTmh: parseFloat(pesoTmh.value),
        pesoTms: parseFloat(pesoTms.value),
        numeroSacos: parseInt(numeroSacos.value),
        observacionesFinProceso: observacionesFinProceso.value || null,
        observacionesGenerales: observacionesGenerales.value || null
      }
    )
  } 
  else {
    result = await concentradosStore.moverAProceso(
      props.concentradoId,
      procesoDestino.value.id,
      {
        observacionesFinProceso: observacionesFinProceso.value || null,
        observacionesInicioProceso: observacionesInicioProceso.value || null
      }
    )
  }
  
  if (result.success) {
    cerrarModal()
  }
}

const cerrarModal = () => {
  observacionesModal.value = false
  procesoDestino.value = null
  observacionesFinProceso.value = ''
  observacionesInicioProceso.value = ''
  observacionesGenerales.value = ''
  pesoTmh.value = null
  pesoTms.value = null
  numeroSacos.value = null
  erroresCampos.value = {
    pesoTmh: '',
    pesoTms: '',
    numeroSacos: ''
  }
}

const mostrarError = (mensaje) => {
  const errorDiv = document.createElement('div')
  errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-10002 animate-slide-in-right'
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
</script>

<template>
  <div class="h-[calc(100vh-280px)] flex flex-col">
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
            class="bg-surface rounded-xl border-2 transition-all duration-200 flex flex-col h-full min-w-0"
            :class="[
              columnaHover === columna.id ? 'border-primary shadow-xl ring-4 ring-primary/20 scale-[1.02]' : 'border-border',
              columna.proceso?.estado === 'completado' ? 'opacity-75' : ''
            ]"
            @dragover="onDragOver($event, columna)"
            @dragleave="onDragLeave"
            @drop="onDrop($event, columna)"
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
                <div class="flex items-center gap-2 mb-2">  <!-- ⬅️ AGREGA mb-2 AQUÍ -->
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
                <!-- AGREGA ESTO PARA IGUALAR ALTURA ⬇️ -->
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
                class="bg-linear-to-br from-primary via-primary to-primary/90 rounded-xl p-4 shadow-xl border-2 border-primary/50 w-full cursor-move hover:shadow-2xl hover:scale-[1.02] transition-all group"
                draggable="true"
                @dragstart="onDragStart"
                @dragend="onDragEnd"
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
                  <p v-if="columna.tipo !== 'fin'" class="text-white/90 text-xs font-medium mb-1 flex items-center gap-1">
                    <ArrowRight class="w-3 h-3" />
                    Arrastra para avanzar
                  </p>
                  <p class="text-white text-sm font-medium">
                    {{ 
                      columna.tipo === 'fin' ? 'Procesamiento completado ✓' :
                      columna.tipo === 'proceso' && columna.proceso.estado === 'en_proceso' ? 'En proceso' : 
                      'Por iniciar'
                    }}
                  </p>
                </div>

                <div v-if="columna.proceso && columna.proceso.observaciones" class="mt-3 bg-white/10 rounded-lg p-2 backdrop-blur-sm border border-white/20">
                  <p class="text-white/90 text-xs font-medium mb-1 flex items-center gap-1">
                    <FileText class="w-3 h-3" />
                    Observaciones:
                  </p>
                  <p class="text-white/80 text-xs leading-relaxed line-clamp-3">{{ columna.proceso.observaciones }}</p>
                </div>

                <div v-if="columna.tipo !== 'fin'" class="mt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <p class="text-white/60 text-xs font-medium">↔ Arrastra aquí ↔</p>
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
                    columna.tipo === 'fin' && !todosCompletados ? 'Arrastra para finalizar' :
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

    <Teleport to="body">
      <div
        v-if="observacionesModal && procesoDestino"
        class="fixed inset-0 z-10001 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4"
        @click.self="cerrarModal"
      >
        <div class="bg-surface rounded-xl shadow-2xl w-full max-w-lg border border-border animate-scale-in">
          <div class="p-6 border-b border-border">
            <div class="flex items-center gap-3">
              <div 
                class="w-12 h-12 rounded-lg center shrink-0 shadow-lg"
                :class="tipoMovimiento === 'finalizar' ? 'bg-linear-to-br from-green-500 to-green-600' : 'bg-linear-to-br from-primary to-primary/80'"
              >
                <component :is="tipoMovimiento === 'finalizar' ? CheckCircle2 : Zap" class="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-neutral">{{ tituloModal }}</h3>
                <p class="text-sm text-secondary mt-0.5">{{ subtituloModal }}</p>
              </div>
            </div>
          </div>

          <div class="p-6 space-y-4">
            <div 
              class="rounded-xl p-4 shadow-sm"
              :class="tipoMovimiento === 'finalizar' ? 'bg-green-600 dark:bg-green-700' : 'bg-primary'"
            >
              <div class="flex items-start gap-3">
                <component 
                  :is="tipoMovimiento === 'finalizar' ? CheckCircle2 : ArrowRight" 
                  class="w-5 h-5 text-white shrink-0 mt-0.5"
                />
                <div class="flex-1">
                  <template v-if="tipoMovimiento === 'finalizar'">
                    <p class="text-xs text-white/70 mb-1">Se completará el procesamiento:</p>
                    <p class="font-semibold text-white">{{ nombreProcesoDestino }}</p>
                  </template>
                  <template v-else-if="tipoMovimiento === 'iniciar'">
                    <p class="text-xs text-white/70 mb-1">Se iniciará el procesamiento:</p>
                    <p class="font-semibold text-white">{{ nombreProcesoDestino }}</p>
                  </template>
                  <template v-else>
                    <p class="text-xs text-white/70 mb-1">Movimiento:</p>
                    <p class="font-semibold text-white">{{ nombreProcesoActual }} → {{ nombreProcesoDestino }}</p>
                  </template>
                  
                </div>
              </div>
            </div>

            <div v-if="tipoMovimiento === 'iniciar'" class="input-group">
              <label class="input-label flex items-center gap-1.5">
                <FileText class="w-4 h-4" />
                Observaciones iniciales del proceso
              </label>
              <textarea
                v-model="observacionesInicioProceso"
                rows="3"
                placeholder="Describe el estado inicial del proceso..."
                class="w-full"
                autofocus
              ></textarea>
            </div>

            <template v-else-if="tipoMovimiento === 'finalizar'">
  <!-- ========== CAMPOS OBLIGATORIOS DE PESOS ========== -->
  <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
    <div class="flex items-start gap-2">
      <AlertCircle class="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
      <div>
        <p class="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-1">
          Datos obligatorios del procesamiento
        </p>
        <p class="text-xs text-yellow-600 dark:text-yellow-400">
          Complete los pesos finales y cantidad de sacos obtenidos
        </p>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-2 gap-4">
    <!-- Peso TMH -->
    <div class="input-group">
      <label class="input-label flex items-center gap-1.5">
        <Package class="w-4 h-4" />
        Peso TMH (Ton) <span class="text-red-500">*</span>
      </label>
      <input
        v-model.number="pesoTmh"
        type="number"
        step="0.01"
        min="0.01"
        placeholder="Ej: 100.50"
        class="w-full"
        :class="erroresCampos.pesoTmh ? 'border-red-500 focus:ring-red-500' : ''"
        required
      />
      <p v-if="erroresCampos.pesoTmh" class="text-xs text-red-500 mt-1">
        {{ erroresCampos.pesoTmh }}
      </p>
    </div>

    <!-- Peso TMS -->
    <div class="input-group">
      <label class="input-label flex items-center gap-1.5">
        <Package class="w-4 h-4" />
        Peso TMS (Ton) <span class="text-red-500">*</span>
      </label>
      <input
        v-model.number="pesoTms"
        type="number"
        step="0.01"
        min="0.01"
        placeholder="Ej: 98.30"
        class="w-full"
        :class="erroresCampos.pesoTms ? 'border-red-500 focus:ring-red-500' : ''"
        required
      />
      <p v-if="erroresCampos.pesoTms" class="text-xs text-red-500 mt-1">
        {{ erroresCampos.pesoTms }}
      </p>
    </div>
  </div>

  <!-- Número de Sacos -->
  <div class="input-group">
    <label class="input-label flex items-center gap-1.5">
      <Package class="w-4 h-4" />
      Número de Sacos <span class="text-red-500">*</span>
    </label>
    <input
      v-model.number="numeroSacos"
      type="number"
      min="1"
      step="1"
      placeholder="Ej: 12"
      class="w-full"
      :class="erroresCampos.numeroSacos ? 'border-red-500 focus:ring-red-500' : ''"
      required
    />
    <p v-if="erroresCampos.numeroSacos" class="text-xs text-red-500 mt-1">
      {{ erroresCampos.numeroSacos }}
    </p>
  </div>

  <!-- Cálculos automáticos (vista previa) -->
  <div v-if="pesoTms && pesoTmh" class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
    <p class="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1.5">
      Cálculos automáticos
    </p>
    <div class="grid grid-cols-3 gap-3 text-xs">
      <div>
        <p class="text-secondary mb-0.5">Merma ({{ concentrado.porcentajeMerma || 1 }}%)</p>
        <p class="font-semibold text-neutral">
          {{ (pesoTms * ((concentrado.porcentajeMerma || 1) / 100)).toFixed(2) }} Ton
        </p>
      </div>
      <div>
        <p class="text-secondary mb-0.5">Peso Final</p>
        <p class="font-semibold text-neutral">
          {{ (pesoTms - (pesoTms * ((concentrado.porcentajeMerma || 1) / 100))).toFixed(2) }} Ton
        </p>
      </div>
      <div>
        <p class="text-secondary mb-0.5">Diferencia TMH-TMS</p>
        <p class="font-semibold text-neutral">
          {{ (pesoTmh - pesoTms).toFixed(2) }} Ton
        </p>
      </div>
    </div>
  </div>

  <!-- Separador -->
  <div class="border-t border-border my-1"></div>

  <!-- Observaciones finales del proceso -->
  <div class="input-group">
    <label class="input-label flex items-center gap-1.5">
      <FileText class="w-4 h-4" />
      Observaciones finales del último proceso
    </label>
    <textarea
      v-model="observacionesFinProceso"
      rows="2"
      placeholder="¿Cómo finalizó este proceso?..."
      class="w-full"
    ></textarea>
  </div>

  <!-- Observaciones generales -->
  <div class="input-group">
    <label class="input-label flex items-center gap-1.5">
      <Sparkles class="w-4 h-4" />
      Observaciones generales del procesamiento completo
    </label>
    <textarea
      v-model="observacionesGenerales"
      rows="2"
      placeholder="Comentarios generales sobre todo el procesamiento..."
      class="w-full"
    ></textarea>
  </div>
</template>

            <template v-else>
              <div class="input-group">
                <label class="input-label flex items-center gap-1.5">
                  <CheckCircle2 class="w-4 h-4" />
                  Observaciones finales: "{{ nombreProcesoActual }}"
                </label>
                <textarea
                  v-model="observacionesFinProceso"
                  rows="3"
                  placeholder="¿Cómo finalizó este proceso?..."
                  class="w-full"
                  autofocus
                ></textarea>
              </div>

              <div class="input-group">
                <label class="input-label flex items-center gap-1.5">
                  <PlayCircle class="w-4 h-4" />
                  Observaciones iniciales: "{{ nombreProcesoDestino }}"
                </label>
                <textarea
                  v-model="observacionesInicioProceso"
                  rows="3"
                  placeholder="Estado inicial del siguiente proceso..."
                  class="w-full"
                ></textarea>
              </div>
            </template>
          </div>

          <div class="flex gap-3 p-6 border-t border-border bg-hover/30">
            <button @click="cerrarModal" class="btn-secondary flex-1">
              Cancelar
            </button>
            <button
              @click="ejecutarMovimiento"
              class="btn flex-1 flex items-center justify-center gap-2 shadow-lg"
              :class="tipoMovimiento === 'finalizar' ? 'bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' : ''"
            >
              <component :is="tipoMovimiento === 'finalizar' ? CheckCircle2 : Zap" class="w-4 h-4" />
              {{ textoBotonConfirmar }}
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

.line-clamp-3 {
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>