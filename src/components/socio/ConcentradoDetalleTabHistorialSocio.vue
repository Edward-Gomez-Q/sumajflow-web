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

const formatDateShort = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
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
      return 'bg-primary'
    case 'INICIAR_PROCESAMIENTO':
      return 'bg-success'
    case 'AVANZAR_PROCESO':
    case 'MOVER_PROCESO':
      return 'bg-warning'
    case 'FINALIZAR_PROCESAMIENTO':
      return 'bg-info'
    default:
      return 'bg-secondary'
  }
}

const getBorderColorAccion = (accion) => {
  switch (accion) {
    case 'CREAR_CONCENTRADO':
      return 'border-l-primary'
    case 'INICIAR_PROCESAMIENTO':
      return 'border-l-success'
    case 'AVANZAR_PROCESO':
    case 'MOVER_PROCESO':
      return 'border-l-warning'
    case 'FINALIZAR_PROCESAMIENTO':
      return 'border-l-info'
    default:
      return 'border-l-secondary'
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
      <div class="bg-surface rounded-lg px-4 py-2 border border-border">
        <p class="text-sm font-medium text-neutral">
          {{ historial.length }} registro(s)
        </p>
      </div>
    </div>

    <!-- Timeline -->
    <div class="relative">
      <div class="absolute left-5 top-0 bottom-0 w-0.5 bg-border"></div>

      <!-- Registros -->
      <div class="space-y-6">
        <div
          v-for="registro in historial"
          :key="registro.index"
          class="relative pl-14"
        >
          <!-- Icono timeline -->
          <div 
            class="absolute left-2.5 w-6 h-6 rounded-full center ring-4 ring-background"
            :class="getColorAccion(registro.accion)"
          >
            <component 
              :is="getIconoAccion(registro.accion)" 
              class="w-3.5 h-3.5 text-white" 
            />
          </div>

          <!-- Contenido -->
          <div 
            class="bg-surface rounded-lg border-l-4 border-t border-r border-b border-border hover:shadow-md transition-shadow"
            :class="getBorderColorAccion(registro.accion)"
          >
            <div class="p-4">
              <!-- Header -->
              <div class="flex items-start justify-between gap-4 mb-3">
                <div class="flex-1">
                  <h4 class="font-semibold text-neutral mb-2">
                    {{ getTituloAccion(registro) }}
                  </h4>
                  <div class="flex items-center gap-2 flex-wrap text-xs text-tertiary">
                    <div class="flex items-center gap-1">
                      <Clock class="w-3 h-3" />
                      <span>{{ formatDateShort(registro.timestamp) }}</span>
                    </div>
                    <div v-if="registro.usuario_id" class="flex items-center gap-1">
                      <User class="w-3 h-3" />
                      <span>Usuario #{{ registro.usuario_id }}</span>
                    </div>
                    <div v-if="registro.ip_origen" class="flex items-center gap-1">
                      <MapPin class="w-3 h-3" />
                      <span>{{ registro.ip_origen }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Badge -->
                <span 
                  v-if="registro.accion"
                  class="px-2.5 py-1 rounded-md text-xs font-medium border whitespace-nowrap"
                  :class="[
                    registro.accion === 'CREAR_CONCENTRADO' ? 'bg-primary/10 text-primary border-primary/20' :
                    registro.accion === 'INICIAR_PROCESAMIENTO' ? 'bg-success/10 text-success border-success/20' :
                    registro.accion === 'AVANZAR_PROCESO' || registro.accion === 'MOVER_PROCESO' ? 'bg-warning/10 text-warning border-warning/20' :
                    registro.accion === 'FINALIZAR_PROCESAMIENTO' ? 'bg-info/10 text-info border-info/20' :
                    'bg-hover text-secondary border-border'
                  ]"
                >
                  {{ registro.accion.replace(/_/g, ' ') }}
                </span>
              </div>

              <!-- CREAR_CONCENTRADO -->
              <div v-if="registro.accion === 'CREAR_CONCENTRADO'" class="space-y-3">
                <div v-if="registro.descripcion" class="text-sm text-secondary">
                  {{ registro.descripcion }}
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div v-if="registro.lotes_ids" class="bg-hover/50 rounded-lg p-3 border border-border">
                    <p class="text-xs font-medium text-secondary mb-2">Lotes procesados:</p>
                    <div class="flex flex-wrap gap-1.5">
                      <span 
                        v-for="loteId in registro.lotes_ids" 
                        :key="loteId"
                        class="px-2 py-1 rounded-md bg-surface text-neutral text-xs font-medium border border-border"
                      >
                        #{{ loteId }}
                      </span>
                    </div>
                  </div>

                  <div v-if="registro.cantidad_lotes" class="bg-hover/50 rounded-lg p-3 border border-border">
                    <p class="text-xs font-medium text-secondary mb-1">Cantidad de lotes:</p>
                    <p class="text-lg font-bold text-neutral">{{ registro.cantidad_lotes }}</p>
                  </div>

                  <div v-if="registro.concentrados_hermanos && registro.concentrados_hermanos.length > 1" class="bg-hover/50 rounded-lg p-3 border border-border">
                    <p class="text-xs font-medium text-secondary mb-2">Concentrados hermanos:</p>
                    <div class="flex flex-wrap gap-1.5">
                      <span 
                        v-for="hermanoId in registro.concentrados_hermanos" 
                        :key="hermanoId"
                        class="px-2 py-1 rounded-md bg-surface text-neutral text-xs font-medium border border-border"
                      >
                        #{{ hermanoId }}
                      </span>
                    </div>
                  </div>
                </div>

                <div v-if="registro.estado_anterior" class="flex items-center gap-2 text-sm flex-wrap">
                  <span class="px-3 py-1.5 rounded-md bg-hover text-secondary font-medium border border-border">
                    {{ registro.estado_anterior }}
                  </span>
                  <ArrowRight class="w-4 h-4 text-tertiary" />
                  <span class="px-3 py-1.5 rounded-md bg-primary/10 text-primary font-medium border border-primary/20">
                    {{ registro.estado }}
                  </span>
                </div>

                <div v-if="registro.observaciones" class="mt-3 bg-hover/50 rounded-lg p-3 border border-border">
                  <p class="text-xs font-medium text-secondary mb-2">Observaciones:</p>
                  <p class="text-sm text-neutral leading-relaxed">"{{ registro.observaciones }}"</p>
                </div>
              </div>

              <!-- INICIAR_PROCESAMIENTO -->
              <div v-else-if="registro.accion === 'INICIAR_PROCESAMIENTO' && registro.detalles" class="space-y-3">
                <div class="bg-hover/50 rounded-lg p-3 border border-border">
                  <div class="flex items-start gap-3">
                    <PlayCircle class="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <div class="flex-1">
                      <h5 class="font-semibold text-neutral mb-2">
                        Proceso: {{ registro.detalles.proceso_nombre }}
                      </h5>
                      
                      <div v-if="registro.detalles.observaciones_inicio" class="mt-2">
                        <p class="text-xs font-medium text-secondary mb-1">Observaciones iniciales:</p>
                        <p class="text-sm text-neutral leading-relaxed">"{{ registro.detalles.observaciones_inicio }}"</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- MOVER_PROCESO -->
              <div v-else-if="(registro.accion === 'MOVER_PROCESO' || registro.accion === 'AVANZAR_PROCESO') && registro.detalles" class="space-y-3">
                <!-- Movimiento -->
                <div class="flex items-center justify-center gap-3 text-sm">
                  <div class="flex-1 bg-hover/50 rounded-lg p-3 text-center border border-border">
                    <p class="text-xs font-medium text-secondary mb-1">Desde</p>
                    <p class="font-semibold text-neutral">{{ registro.detalles.proceso_origen.nombre }}</p>
                    <p class="text-xs text-tertiary mt-1">#{{ registro.detalles.proceso_origen.id }}</p>
                  </div>
                  
                  <ArrowRight class="w-5 h-5 text-warning shrink-0" />
                  
                  <div class="flex-1 bg-hover/50 rounded-lg p-3 text-center border border-border">
                    <p class="text-xs font-medium text-secondary mb-1">Hacia</p>
                    <p class="font-semibold text-neutral">{{ registro.detalles.proceso_destino.nombre }}</p>
                    <p class="text-xs text-tertiary mt-1">#{{ registro.detalles.proceso_destino.id }}</p>
                  </div>
                </div>

                <!-- Observaciones -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div v-if="registro.detalles.observaciones_fin_proceso || registro.detalles.obs_fin" class="bg-hover/50 rounded-lg p-3 border border-border">
                    <div class="flex items-start gap-2">
                      <CheckCircle2 class="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                      <div class="flex-1">
                        <h5 class="text-xs font-semibold text-neutral mb-2">
                          Observaciones finales ({{ registro.detalles.proceso_origen.nombre }})
                        </h5>
                        <p class="text-sm text-secondary leading-relaxed">"{{ registro.detalles.observaciones_fin_proceso || registro.detalles.obs_fin }}"</p>
                      </div>
                    </div>
                  </div>

                  <div v-if="registro.detalles.observaciones_inicio_proceso || registro.detalles.obs_inicio" class="bg-hover/50 rounded-lg p-3 border border-border">
                    <div class="flex items-start gap-2">
                      <PlayCircle class="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                      <div class="flex-1">
                        <h5 class="text-xs font-semibold text-neutral mb-2">
                          Observaciones iniciales ({{ registro.detalles.proceso_destino.nombre }})
                        </h5>
                        <p class="text-sm text-secondary leading-relaxed">"{{ registro.detalles.observaciones_inicio_proceso || registro.detalles.obs_inicio }}"</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Procesos auto-completados -->
                <div v-if="registro.detalles.procesos_auto_completados && registro.detalles.procesos_auto_completados.length > 0" 
                     class="bg-hover/50 rounded-lg p-3 border border-border">
                  <div class="flex items-start gap-2">
                    <Sparkles class="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <div class="flex-1">
                      <h5 class="text-xs font-semibold text-neutral mb-2">
                        Procesos completados automáticamente:
                      </h5>
                      <div class="flex flex-wrap gap-2">
                        <span 
                          v-for="(proceso, idx) in registro.detalles.procesos_auto_completados" 
                          :key="idx"
                          class="px-2.5 py-1 rounded-md bg-surface text-neutral text-xs font-medium border border-border"
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
                <div class="bg-hover/50 rounded-lg p-3 border border-border">
                  <div class="flex items-start gap-3">
                    <CheckCircle2 class="w-5 h-5 text-info shrink-0 mt-0.5" />
                    <div class="flex-1 space-y-3">
                      <h5 class="font-semibold text-neutral">
                        Último proceso: {{ typeof registro.detalles.ultimo_proceso === 'object' ? registro.detalles.ultimo_proceso.nombre : registro.detalles.ultimo_proceso }}
                      </h5>
                      
                      <div v-if="registro.detalles.observaciones_fin_proceso" class="border-t border-border pt-3">
                        <p class="text-xs font-medium text-secondary mb-1">Observaciones finales del proceso:</p>
                        <p class="text-sm text-neutral leading-relaxed">"{{ registro.detalles.observaciones_fin_proceso }}"</p>
                      </div>

                      <div v-if="registro.detalles.observaciones_generales" class="border-t border-border pt-3">
                        <p class="text-xs font-medium text-secondary mb-1">Observaciones generales del procesamiento:</p>
                        <p class="text-sm text-neutral font-medium leading-relaxed">"{{ registro.detalles.observaciones_generales }}"</p>
                      </div>

                      <div v-if="registro.detalles.total_procesos_completados" class="border-t border-border pt-3">
                        <p class="text-sm text-secondary">
                          Total de procesos completados: 
                          <span class="font-bold text-neutral">{{ registro.detalles.total_procesos_completados }}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Transición genérica -->
              <div v-else-if="registro.estado_anterior && registro.estado" class="flex items-center gap-2 text-sm flex-wrap">
                <span class="px-3 py-1.5 rounded-md bg-hover text-secondary font-medium border border-border">
                  {{ registro.estado_anterior }}
                </span>
                <ArrowRight class="w-4 h-4 text-tertiary" />
                <span class="px-3 py-1.5 rounded-md bg-primary/10 text-primary font-medium border border-primary/20">
                  {{ registro.estado }}
                </span>
              </div>

              <!-- Observaciones generales -->
              <div v-if="registro.observaciones && !registro.detalles && registro.accion !== 'CREAR_CONCENTRADO'" class="mt-3 bg-hover/50 rounded-lg p-3 border border-border">
                <p class="text-xs font-medium text-secondary mb-2">Observaciones:</p>
                <p class="text-sm text-neutral leading-relaxed">"{{ registro.observaciones }}"</p>
              </div>

              <!-- Fecha completa al pie -->
              <div class="text-xs text-tertiary mt-3 pt-3 border-t border-border flex items-center gap-1">
                <Clock class="w-3 h-3" />
                {{ formatDate(registro.timestamp) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div v-if="historial.length === 0" class="text-center py-16">
        <div class="w-20 h-20 rounded-full bg-hover center mx-auto mb-4 border border-border">
          <FileText class="w-10 h-10 text-secondary" />
        </div>
        <h3 class="text-xl font-semibold text-neutral mb-2">Sin historial registrado</h3>
        <p class="text-sm text-secondary max-w-md mx-auto">
          No hay registros de historial disponibles para este concentrado.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-surface {
  transition: box-shadow 0.2s ease-in-out;
}
</style>