<script setup>
import { ref, computed, watch } from 'vue'
import { useConcentradosIngenioStore } from '@/stores/ingenio/concentradosIngenioStore'
import {
  FileText,
  User,
  MapPin,
  Clock,
  Package,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  PlayCircle,
  RefreshCw
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

const concentradosStore = useConcentradosIngenioStore()

// Variable para controlar si ya se hizo el primer fetch al entrar al tab
const yaSeCargoEnEsteTab = ref(false)

// Watch para detectar cuando el usuario entra al tab de historial
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

// Procesar el historial para mostrarlo de forma ordenada
const historial = computed(() => {
  if (!props.concentrado.observaciones) return []
  
  if (Array.isArray(props.concentrado.observaciones)) {
    const observacionesFiltradas = props.concentrado.observaciones.filter(obs => {
      // Obviar el registro "Procesamiento iniciado"
      if (obs.descripcion?.includes('Procesamiento iniciado') && obs.estado === 'en_proceso') {
        return false
      }
      // Obviar el registro "Procesamiento completado"
      if (obs.descripcion?.includes('Procesamiento completado') && obs.estado === 'esperando_reporte_quimico') {
        return false
      }
      
      // Obviar el primer registro "creado" (sin acción)
      if (obs.estado === 'creado' && !obs.accion && obs.descripcion?.includes('Concentrado creado')) {
        return false
      }
      
      // Obviar el segundo registro "en_camino_a_planta" (sin acción) 
      if (obs.estado === 'en_camino_a_planta' && !obs.accion && obs.descripcion?.includes('en camino a planta')) {
        return false
      }
      
      return true
    })

    // Consolidar las observaciones en CREAR_CONCENTRADO
    return observacionesFiltradas.map((item, index) => {
      if (item.accion === 'CREAR_CONCENTRADO') {
        // Buscar el registro "creado" original para obtener las observaciones iniciales
        const registroCreado = props.concentrado.observaciones.find(
          obs => obs.estado === 'creado' && !obs.accion && obs.descripcion?.includes('Concentrado creado')
        )
        
        // Buscar el registro "en_camino_a_planta" para información adicional
        const registroCamino = props.concentrado.observaciones.find(
          obs => obs.estado === 'en_camino_a_planta' && !obs.accion
        )
        
        return {
          ...item,
          // Consolidar información de ambos registros
          observaciones: registroCreado?.observaciones || item.detalles?.obs_iniciales,
          descripcion: registroCamino?.descripcion || item.descripcion,
          estado: registroCamino?.estado || item.estado,
          estado_anterior: registroCamino?.estado_anterior,
          // Mantener la estructura de detalles si existe
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

// Función para obtener el icono según la acción
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

// Función para obtener el color según la acción
const getColorAccion = (accion) => {
  switch (accion) {
    case 'CREAR_CONCENTRADO':
      return 'bg-blue-500'
    case 'INICIAR_PROCESAMIENTO':
      return 'bg-green-500'
    case 'AVANZAR_PROCESO':
    case 'MOVER_PROCESO':
      return 'bg-yellow-500'
    case 'FINALIZAR_PROCESAMIENTO':
      return 'bg-purple-500'
    default:
      return 'bg-gray-500'
  }
}

// Función para obtener el título legible de la acción
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
  
  // Si no tiene acción pero tiene descripción
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
      <div class="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
        <p class="text-sm font-medium text-primary">
          {{ historial.length }} registro(s)
        </p>
      </div>
    </div>

    <!-- Timeline -->
    <div class="relative">
      <!-- Línea vertical -->
      <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>

      <!-- Registros -->
      <div class="space-y-6">
        <div
          v-for="registro in historial"
          :key="registro.index"
          class="relative pl-16"
        >
          <!-- Icono en la línea de tiempo -->
          <div 
            class="absolute left-0 w-12 h-12 rounded-full center shadow-lg"
            :class="getColorAccion(registro.accion)"
          >
            <component 
              :is="getIconoAccion(registro.accion)" 
              class="w-6 h-6 text-white" 
            />
          </div>

          <!-- Contenido del registro -->
          <div class="bg-hover rounded-xl p-4 border border-border hover:shadow-md transition-shadow">
            <!-- Header del registro -->
            <div class="flex items-start justify-between gap-4 mb-3">
              <div class="flex-1">
                <h4 class="font-semibold text-neutral text-base">
                  {{ getTituloAccion(registro) }}
                </h4>
                <div class="flex items-center gap-4 mt-2 text-xs text-secondary">
                  <div class="flex items-center gap-1">
                    <Clock class="w-3 h-3" />
                    <span>{{ formatDate(registro.timestamp) }}</span>
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
              
              <!-- Badge de la acción -->
              <span 
                v-if="registro.accion"
                class="px-3 py-1 rounded-lg text-xs font-medium text-white whitespace-nowrap"
                :class="getColorAccion(registro.accion)"
              >
                {{ registro.accion.replace(/_/g, ' ') }}
              </span>
            </div>

            <!-- Contenido según el tipo de acción -->
            
            <!-- CREAR_CONCENTRADO -->
            <div v-if="registro.accion === 'CREAR_CONCENTRADO'" class="space-y-3">
              <div v-if="registro.descripcion" class="text-sm text-neutral">
                {{ registro.descripcion }}
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div v-if="registro.lotes_ids" class="bg-surface rounded-lg p-3">
                  <p class="text-xs text-secondary mb-1">Lotes procesados:</p>
                  <div class="flex flex-wrap gap-1">
                    <span 
                      v-for="loteId in registro.lotes_ids" 
                      :key="loteId"
                      class="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 text-xs font-medium"
                    >
                      #{{ loteId }}
                    </span>
                  </div>
                </div>

                <div v-if="registro.cantidad_lotes" class="bg-surface rounded-lg p-3">
                  <p class="text-xs text-secondary mb-1">Cantidad de lotes:</p>
                  <p class="text-sm font-semibold text-neutral">{{ registro.cantidad_lotes }}</p>
                </div>

                <div v-if="registro.concentrados_hermanos && registro.concentrados_hermanos.length > 1" class="bg-surface rounded-lg p-3">
                  <p class="text-xs text-secondary mb-1">Concentrados hermanos:</p>
                  <div class="flex flex-wrap gap-1">
                    <span 
                      v-for="hermanoId in registro.concentrados_hermanos" 
                      :key="hermanoId"
                      class="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 text-xs font-medium"
                    >
                      #{{ hermanoId }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="registro.estado_anterior" class="flex items-center gap-2 text-sm">
                <span class="px-2 py-1 rounded bg-gray-500/10 text-gray-600 font-medium">
                  {{ registro.estado_anterior }}
                </span>
                <ArrowRight class="w-4 h-4 text-secondary" />
                <span class="px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                  {{ registro.estado }}
                </span>
              </div>

              <!-- Mostrar las observaciones consolidadas -->
              <div v-if="registro.observaciones" class="mt-3 bg-surface rounded-lg p-3">
                <p class="text-xs text-secondary mb-1">Observaciones:</p>
                <p class="text-sm text-neutral italic">"{{ registro.observaciones }}"</p>
              </div>
            </div>

            <!-- INICIAR_PROCESAMIENTO -->
            <div v-else-if="registro.accion === 'INICIAR_PROCESAMIENTO' && registro.detalles" class="space-y-3">
              <div class="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                <div class="flex items-center gap-2 mb-2">
                  <PlayCircle class="w-4 h-4 text-green-600" />
                  <p class="text-sm font-semibold text-green-900 dark:text-green-100">
                    Proceso: {{ registro.detalles.proceso_nombre }}
                  </p>
                </div>
                
                <div v-if="registro.detalles.observaciones_inicio" class="mt-2 pt-2 border-t border-green-500/20">
                  <p class="text-xs text-secondary mb-1">Observaciones iniciales:</p>
                  <p class="text-sm text-neutral italic">"{{ registro.detalles.observaciones_inicio }}"</p>
                </div>
              </div>
            </div>

            <!-- MOVER_PROCESO (antes AVANZAR_PROCESO) -->
            <div v-else-if="(registro.accion === 'MOVER_PROCESO' || registro.accion === 'AVANZAR_PROCESO') && registro.detalles" class="space-y-3">
              <!-- Movimiento entre procesos -->
              <div class="flex items-center justify-center gap-2 text-sm">
                <div class="flex-1 bg-gray-500/10 rounded-lg p-3 text-center border border-gray-500/20">
                  <p class="text-xs text-secondary mb-1">Desde</p>
                  <p class="font-semibold text-neutral">{{ registro.detalles.proceso_origen.nombre }}</p>
                  <p class="text-xs text-secondary">#{{ registro.detalles.proceso_origen.id }}</p>
                </div>
                
                <ArrowRight class="w-6 h-6 text-primary shrink-0" />
                
                <div class="flex-1 bg-primary/10 rounded-lg p-3 text-center border border-primary/20">
                  <p class="text-xs text-secondary mb-1">Hacia</p>
                  <p class="font-semibold text-primary">{{ registro.detalles.proceso_destino.nombre }}</p>
                  <p class="text-xs text-secondary">#{{ registro.detalles.proceso_destino.id }}</p>
                </div>
              </div>

              <!-- Observaciones -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div v-if="registro.detalles.observaciones_fin_proceso || registro.detalles.obs_fin" class="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                  <div class="flex items-center gap-2 mb-1">
                    <CheckCircle2 class="w-4 h-4 text-red-600" />
                    <p class="text-xs font-semibold text-red-900 dark:text-red-100">
                      Observaciones finales ({{ registro.detalles.proceso_origen.nombre }})
                    </p>
                  </div>
                  <p class="text-sm text-neutral italic">"{{ registro.detalles.observaciones_fin_proceso || registro.detalles.obs_fin }}"</p>
                </div>

                <div v-if="registro.detalles.observaciones_inicio_proceso || registro.detalles.obs_inicio" class="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                  <div class="flex items-center gap-2 mb-1">
                    <PlayCircle class="w-4 h-4 text-green-600" />
                    <p class="text-xs font-semibold text-green-900 dark:text-green-100">
                      Observaciones iniciales ({{ registro.detalles.proceso_destino.nombre }})
                    </p>
                  </div>
                  <p class="text-sm text-neutral italic">"{{ registro.detalles.observaciones_inicio_proceso || registro.detalles.obs_inicio }}"</p>
                </div>
              </div>

              <!-- Procesos auto-completados -->
              <div v-if="registro.detalles.procesos_auto_completados && registro.detalles.procesos_auto_completados.length > 0" 
                   class="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                <div class="flex items-center gap-2 mb-2">
                  <Sparkles class="w-4 h-4 text-blue-600" />
                  <p class="text-xs font-semibold text-blue-900 dark:text-blue-100">
                    Procesos completados automáticamente:
                  </p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <span 
                    v-for="(proceso, idx) in registro.detalles.procesos_auto_completados" 
                    :key="idx"
                    class="px-2 py-1 rounded bg-blue-500/10 text-blue-600 text-xs font-medium"
                  >
                    {{ proceso }}
                  </span>
                </div>
              </div>
            </div>

            <!-- FINALIZAR_PROCESAMIENTO -->
            <div v-else-if="registro.accion === 'FINALIZAR_PROCESAMIENTO' && registro.detalles" class="space-y-3">
              <div class="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                <div class="flex items-center gap-2 mb-2">
                  <CheckCircle2 class="w-4 h-4 text-purple-600" />
                  <p class="text-sm font-semibold text-purple-900 dark:text-purple-100">
                    Último proceso: {{ typeof registro.detalles.ultimo_proceso === 'object' ? registro.detalles.ultimo_proceso.nombre : registro.detalles.ultimo_proceso }}
                  </p>
                </div>
                
                <div v-if="registro.detalles.observaciones_fin_proceso" class="mt-2 pt-2 border-t border-purple-500/20">
                  <p class="text-xs text-secondary mb-1">Observaciones finales del proceso:</p>
                  <p class="text-sm text-neutral italic">"{{ registro.detalles.observaciones_fin_proceso }}"</p>
                </div>

                <div v-if="registro.detalles.observaciones_generales" class="mt-2 pt-2 border-t border-purple-500/20">
                  <p class="text-xs text-secondary mb-1">Observaciones generales del procesamiento:</p>
                  <p class="text-sm text-neutral italic font-medium">"{{ registro.detalles.observaciones_generales }}"</p>
                </div>

                <div v-if="registro.detalles.total_procesos_completados" class="mt-2 pt-2 border-t border-purple-500/20">
                  <p class="text-xs text-secondary">Total de procesos completados: <span class="font-semibold text-purple-600">{{ registro.detalles.total_procesos_completados }}</span></p>
                </div>
              </div>
            </div>

            <!-- Transición de estado genérica -->
            <div v-else-if="registro.estado_anterior && registro.estado" class="flex items-center gap-2 text-sm">
              <span class="px-2 py-1 rounded bg-gray-500/10 text-gray-600 font-medium">
                {{ registro.estado_anterior }}
              </span>
              <ArrowRight class="w-4 h-4 text-secondary" />
              <span class="px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                {{ registro.estado }}
              </span>
            </div>

            <!-- Observaciones generales (si existen y no se mostraron arriba) -->
            <div v-if="registro.observaciones && !registro.detalles && registro.accion !== 'CREAR_CONCENTRADO'" class="mt-3 bg-surface rounded-lg p-3">
              <p class="text-xs text-secondary mb-1">Observaciones:</p>
              <p class="text-sm text-neutral italic">"{{ registro.observaciones }}"</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado vacío -->
      <div v-if="historial.length === 0" class="text-center py-12">
        <FileText class="w-16 h-16 text-secondary mx-auto mb-4 opacity-50" />
        <p class="text-secondary">No hay registros de historial disponibles</p>
      </div>
    </div>
  </div>
</template>