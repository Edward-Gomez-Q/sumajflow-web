<!-- src/components/socio/ConcentradoDetalleTabHistorialSocio.vue -->
<script setup>
import { ref, computed, watch } from 'vue'
import { useConcentradosSocioStore } from '@/stores/socio/concentradosSocioStore'
import {
  FileText,
  User,
  MapPin,
  Clock,
  Package,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  PlayCircle
} from 'lucide-vue-next'

const props = defineProps({
  concentrado: {
    type: Object,
    required: true
  },
  concentradoId: {
    type: Number,
    required: true
  },
  tabActual: {
    type: String,
    required: true
  }
})

const concentradosStore = useConcentradosSocioStore()
const yaSeCargoEnEsteTab = ref(false)

watch(() => props.tabActual, async (nuevoTab) => {
  if (nuevoTab === 'historial' && !yaSeCargoEnEsteTab.value) {
    await concentradosStore.fetchConcentradoDetalle(props.concentradoId)
    yaSeCargoEnEsteTab.value = true
  }
})

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-BO', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const historial = computed(() => {
  if (!props.concentrado.observaciones) return []
  
  if (Array.isArray(props.concentrado.observaciones)) {
    const observacionesFiltradas = props.concentrado.observaciones.filter(obs => {
      if (obs.descripcion?.includes('Procesamiento iniciado') && obs.estado === 'en_proceso') {
        return false
      }
      if (obs.descripcion?.includes('Procesamiento completado') && obs.estado === 'esperando_reporte_quimico') {
        return false
      }
      if (obs.estado === 'creado' && !obs.accion && obs.descripcion?.includes('Concentrado creado')) {
        return false
      }
      if (obs.estado === 'en_camino_a_planta' && !obs.accion && obs.descripcion?.includes('en camino a planta')) {
        return false
      }
      return true
    })

    return observacionesFiltradas.map((item, index) => {
      if (item.accion === 'CREAR_CONCENTRADO') {
        const registroCreado = props.concentrado.observaciones.find(
          obs => obs.estado === 'creado' && !obs.accion && obs.descripcion?.includes('Concentrado creado')
        )
        
        const registroCamino = props.concentrado.observaciones.find(
          obs => obs.estado === 'en_camino_a_planta' && !obs.accion
        )
        
        return {
          ...item,
          observaciones: registroCreado?.observaciones || item.detalles?.obs_iniciales,
          descripcion: registroCamino?.descripcion || item.descripcion,
          estado: registroCamino?.estado || item.estado,
          estado_anterior: registroCamino?.estado_anterior,
          lotes_ids: item.detalles?.lotes_ids,
          cantidad_lotes: item.detalles?.cantidad_lotes,
          concentrados_hermanos: item.detalles?.concentrados_hermanos,
          index: index + 1
        }
      }
      
      return {
        ...item,
        index: index + 1
      }
    })
  }
  
  return []
})

const getIconoAccion = (accion) => {
  switch (accion) {
    case 'CREAR_CONCENTRADO':
      return Package
    case 'INICIAR_PROCESAMIENTO':
      return PlayCircle
    case 'AVANZAR_PROCESO':
    case 'MOVER_PROCESO':
      return ArrowRight
    case 'FINALIZAR_PROCESAMIENTO':
      return CheckCircle2
    default:
      return FileText
  }
}

const getColorAccion = (accion) => {
  switch (accion) {
    case 'CREAR_CONCENTRADO':
      return 'bg-sky-600 dark:bg-sky-700'
    case 'INICIAR_PROCESAMIENTO':
      return 'bg-emerald-600 dark:bg-emerald-700'
    case 'AVANZAR_PROCESO':
    case 'MOVER_PROCESO':
      return 'bg-amber-600 dark:bg-amber-700'
    case 'FINALIZAR_PROCESAMIENTO':
      return 'bg-violet-600 dark:bg-violet-700'
    default:
      return 'bg-slate-500'
  }
}

const getTituloAccion = (registro) => {
  if (registro.accion) {
    switch (registro.accion) {
      case 'CREAR_CONCENTRADO':
        return 'Concentrado Creado'
      case 'INICIAR_PROCESAMIENTO':
        return 'Procesamiento Iniciado'
      case 'AVANZAR_PROCESO':
      case 'MOVER_PROCESO':
        return 'Proceso Avanzado'
      case 'FINALIZAR_PROCESAMIENTO':
        return 'Procesamiento Finalizado'
      default:
        return registro.accion.replace(/_/g, ' ')
    }
  }
  
  if (registro.descripcion) {
    return registro.descripcion
  }
  
  return 'Registro'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-neutral">Historial de Trazabilidad</h3>
        <p class="text-sm text-secondary mt-1">
          Registro completo de todas las acciones realizadas sobre el concentrado
        </p>
      </div>
      <div class="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 border border-slate-200 dark:border-slate-700">
        <p class="text-sm font-medium text-slate-700 dark:text-slate-300">
          {{ historial.length }} registro(s)
        </p>
      </div>
    </div>

    <!-- Timeline -->
    <div class="relative">
      <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>

      <!-- Registros -->
      <div class="space-y-6">
        <div
          v-for="registro in historial"
          :key="registro.index"
          class="relative pl-16"
        >
          <!-- Icono timeline -->
          <div 
            class="absolute left-0 w-12 h-12 rounded-full center shadow-md ring-4 ring-background"
            :class="getColorAccion(registro.accion)"
          >
            <component 
              :is="getIconoAccion(registro.accion)" 
              class="w-6 h-6 text-white" 
            />
          </div>

          <!-- Contenido -->
          <div class="bg-surface rounded-xl p-5 border border-border hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200">
            <!-- Header -->
            <div class="flex items-start justify-between gap-4 mb-4">
              <div class="flex-1">
                <h4 class="font-semibold text-neutral text-base mb-2">
                  {{ getTituloAccion(registro) }}
                </h4>
                <div class="flex items-center gap-4 flex-wrap text-xs text-tertiary">
                  <div class="flex items-center gap-1.5">
                    <Clock class="w-3.5 h-3.5" />
                    <span>{{ formatDate(registro.timestamp) }}</span>
                  </div>
                  <div v-if="registro.usuario_id" class="flex items-center gap-1.5">
                    <User class="w-3.5 h-3.5" />
                    <span>Usuario #{{ registro.usuario_id }}</span>
                  </div>
                  <div v-if="registro.ip_origen" class="flex items-center gap-1.5">
                    <MapPin class="w-3.5 h-3.5" />
                    <span>{{ registro.ip_origen }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Badge -->
              <span 
                v-if="registro.accion"
                class="px-3 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap shadow-sm"
                :class="getColorAccion(registro.accion)"
              >
                {{ registro.accion.replace(/_/g, ' ') }}
              </span>
            </div>

            <!-- CREAR_CONCENTRADO -->
            <div v-if="registro.accion === 'CREAR_CONCENTRADO'" class="space-y-4">
              <div v-if="registro.descripcion" class="text-sm text-neutral">
                {{ registro.descripcion }}
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div v-if="registro.lotes_ids" class="bg-sky-50 dark:bg-sky-950/30 rounded-lg p-3 border border-sky-200 dark:border-sky-800">
                  <p class="text-xs font-medium text-sky-900 dark:text-sky-100 mb-2">Lotes procesados:</p>
                  <div class="flex flex-wrap gap-1.5">
                    <span 
                      v-for="loteId in registro.lotes_ids" 
                      :key="loteId"
                      class="px-2 py-1 rounded-md bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-xs font-medium border border-sky-200 dark:border-sky-700"
                    >
                      #{{ loteId }}
                    </span>
                  </div>
                </div>

                <div v-if="registro.cantidad_lotes" class="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                  <p class="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Cantidad de lotes:</p>
                  <p class="text-lg font-bold text-slate-900 dark:text-slate-100">{{ registro.cantidad_lotes }}</p>
                </div>

                <div v-if="registro.concentrados_hermanos && registro.concentrados_hermanos.length > 1" class="bg-violet-50 dark:bg-violet-950/30 rounded-lg p-3 border border-violet-200 dark:border-violet-800">
                  <p class="text-xs font-medium text-violet-900 dark:text-violet-100 mb-2">Concentrados hermanos:</p>
                  <div class="flex flex-wrap gap-1.5">
                    <span 
                      v-for="hermanoId in registro.concentrados_hermanos" 
                      :key="hermanoId"
                      class="px-2 py-1 rounded-md bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-xs font-medium border border-violet-200 dark:border-violet-700"
                    >
                      #{{ hermanoId }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="registro.estado_anterior" class="flex items-center gap-2 text-sm">
                <span class="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                  {{ registro.estado_anterior }}
                </span>
                <ArrowRight class="w-5 h-5 text-slate-400" />
                <span class="px-3 py-1.5 rounded-lg bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 font-medium border border-sky-200 dark:border-sky-700">
                  {{ registro.estado }}
                </span>
              </div>

              <div v-if="registro.observaciones" class="mt-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <p class="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Observaciones:</p>
                <p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">"{{ registro.observaciones }}"</p>
              </div>
            </div>

            <!-- INICIAR_PROCESAMIENTO -->
            <div v-else-if="registro.accion === 'INICIAR_PROCESAMIENTO' && registro.detalles" class="space-y-3">
              <div class="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                <div class="flex items-start gap-3">
                  <PlayCircle class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div class="flex-1">
                    <h5 class="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
                      Proceso: {{ registro.detalles.proceso_nombre }}
                    </h5>
                    
                    <div v-if="registro.detalles.observaciones_inicio" class="mt-3">
                      <p class="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1">Observaciones iniciales:</p>
                      <p class="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">"{{ registro.detalles.observaciones_inicio }}"</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- MOVER_PROCESO -->
            <div v-else-if="(registro.accion === 'MOVER_PROCESO' || registro.accion === 'AVANZAR_PROCESO') && registro.detalles" class="space-y-4">
              <!-- Movimiento -->
              <div class="flex items-center justify-center gap-3 text-sm">
                <div class="flex-1 bg-slate-50 dark:bg-slate-900/30 rounded-lg p-4 text-center border border-slate-200 dark:border-slate-700">
                  <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Desde</p>
                  <p class="font-semibold text-slate-900 dark:text-slate-100">{{ registro.detalles.proceso_origen.nombre }}</p>
                  <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">#{{ registro.detalles.proceso_origen.id }}</p>
                </div>
                
                <ArrowRight class="w-6 h-6 text-amber-600 dark:text-amber-500 shrink-0" />
                
                <div class="flex-1 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 text-center border border-amber-200 dark:border-amber-800">
                  <p class="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">Hacia</p>
                  <p class="font-semibold text-amber-900 dark:text-amber-100">{{ registro.detalles.proceso_destino.nombre }}</p>
                  <p class="text-xs text-amber-700 dark:text-amber-300 mt-1">#{{ registro.detalles.proceso_destino.id }}</p>
                </div>
              </div>

              <!-- Observaciones -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div v-if="registro.detalles.observaciones_fin_proceso || registro.detalles.obs_fin" class="bg-rose-50 dark:bg-rose-950/30 rounded-lg p-4 border border-rose-200 dark:border-rose-800">
                  <div class="flex items-start gap-3">
                    <CheckCircle2 class="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div class="flex-1">
                      <h5 class="text-xs font-semibold text-rose-900 dark:text-rose-100 mb-2">
                        Observaciones finales ({{ registro.detalles.proceso_origen.nombre }})
                      </h5>
                      <p class="text-sm text-rose-800 dark:text-rose-200 leading-relaxed">"{{ registro.detalles.observaciones_fin_proceso || registro.detalles.obs_fin }}"</p>
                    </div>
                  </div>
                </div>

                <div v-if="registro.detalles.observaciones_inicio_proceso || registro.detalles.obs_inicio" class="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                  <div class="flex items-start gap-3">
                    <PlayCircle class="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div class="flex-1">
                      <h5 class="text-xs font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
                        Observaciones iniciales ({{ registro.detalles.proceso_destino.nombre }})
                      </h5>
                      <p class="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">"{{ registro.detalles.observaciones_inicio_proceso || registro.detalles.obs_inicio }}"</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Procesos auto-completados -->
              <div v-if="registro.detalles.procesos_auto_completados && registro.detalles.procesos_auto_completados.length > 0" 
                   class="bg-indigo-50 dark:bg-indigo-950/30 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                <div class="flex items-start gap-3">
                  <Sparkles class="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div class="flex-1">
                    <h5 class="text-xs font-semibold text-indigo-900 dark:text-indigo-100 mb-3">
                      Procesos completados automáticamente:
                    </h5>
                    <div class="flex flex-wrap gap-2">
                      <span 
                        v-for="(proceso, idx) in registro.detalles.procesos_auto_completados" 
                        :key="idx"
                        class="px-3 py-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-medium border border-indigo-200 dark:border-indigo-700"
                      >
                        {{ proceso }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- FINALIZAR_PROCESAMIENTO -->
            <div v-else-if="registro.accion === 'FINALIZAR_PROCESAMIENTO' && registro.detalles" class="space-y-3">
              <div class="bg-violet-50 dark:bg-violet-950/30 rounded-lg p-4 border border-violet-200 dark:border-violet-800">
                <div class="flex items-start gap-3">
                  <CheckCircle2 class="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                  <div class="flex-1 space-y-3">
                    <h5 class="font-semibold text-violet-900 dark:text-violet-100">
                      Último proceso: {{ typeof registro.detalles.ultimo_proceso === 'object' ? registro.detalles.ultimo_proceso.nombre : registro.detalles.ultimo_proceso }}
                    </h5>
                    
                    <div v-if="registro.detalles.observaciones_fin_proceso" class="border-t border-violet-200 dark:border-violet-700 pt-3">
                      <p class="text-xs font-medium text-violet-700 dark:text-violet-300 mb-1">Observaciones finales del proceso:</p>
                      <p class="text-sm text-violet-800 dark:text-violet-200 leading-relaxed">"{{ registro.detalles.observaciones_fin_proceso }}"</p>
                    </div>

                    <div v-if="registro.detalles.observaciones_generales" class="border-t border-violet-200 dark:border-violet-700 pt-3">
                      <p class="text-xs font-medium text-violet-700 dark:text-violet-300 mb-1">Observaciones generales del procesamiento:</p>
                      <p class="text-sm text-violet-900 dark:text-violet-100 font-medium leading-relaxed">"{{ registro.detalles.observaciones_generales }}"</p>
                    </div>

                    <div v-if="registro.detalles.total_procesos_completados" class="border-t border-violet-200 dark:border-violet-700 pt-3">
                      <p class="text-sm text-violet-700 dark:text-violet-300">
                        Total de procesos completados: 
                        <span class="font-bold text-violet-900 dark:text-violet-100">{{ registro.detalles.total_procesos_completados }}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Transición genérica -->
            <div v-else-if="registro.estado_anterior && registro.estado" class="flex items-center gap-2 text-sm">
              <span class="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                {{ registro.estado_anterior }}
              </span>
              <ArrowRight class="w-5 h-5 text-slate-400" />
              <span class="px-3 py-1.5 rounded-lg bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 font-medium border border-sky-200 dark:border-sky-700">
                {{ registro.estado }}
              </span>
            </div>

            <!-- Observaciones generales -->
            <div v-if="registro.observaciones && !registro.detalles && registro.accion !== 'CREAR_CONCENTRADO'" class="mt-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <p class="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Observaciones:</p>
              <p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">"{{ registro.observaciones }}"</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div v-if="historial.length === 0" class="text-center py-16">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
          <FileText class="w-10 h-10 text-slate-400 dark:text-slate-500" />
        </div>
        <p class="text-slate-600 dark:text-slate-400 font-medium">No hay registros de historial disponibles</p>
      </div>
    </div>
  </div>
</template>