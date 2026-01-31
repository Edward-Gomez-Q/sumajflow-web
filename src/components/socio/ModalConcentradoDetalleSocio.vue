<!-- src/components/socio/ModalConcentradoDetalleSocio.vue -->
<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useConcentradosSocioStore } from '@/stores/socio/concentradosSocioStore'
import { useConcentradoWebSocket } from '@/composables/useConcentradoWebSocket'
import {
  X,
  PackageCheck,
  Info,
  Kanban,
  AlertCircle,
  History
} from 'lucide-vue-next'
import { getEstadoConfig } from '@/utils/concentradoEstados'
import ConcentradoDetalleTabGeneral from '@/components/ingenio/ConcentradoDetalleTabGeneral.vue'
import ConcentradoDetalleTabKanbanSocio from '@/components/socio/ConcentradoDetalleTabKanbanSocio.vue'
import ConcentradoDetalleTabHistorial from '@/components/ingenio/ConcentradoDetalleTabHistorial.vue'

const props = defineProps({
  concentradoId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['close'])

const concentradosStore = useConcentradosSocioStore()
const concentradoWs = useConcentradoWebSocket()

const tabActual = ref('general')
let subscription = null

watch(() => props.concentradoId, async (newId) => {
  if (newId) {
    // Cargar detalle inicial
    await concentradosStore.fetchConcentradoDetalle(newId)
    tabActual.value = 'general'
    
    // Conectar WebSocket y suscribirse
    try {
      await concentradoWs.conectar()
      
      // Desuscribirse de anterior si existe
      if (subscription) subscription.unsubscribe()
      
      // Suscribirse al topic del concentrado específico
      subscription = concentradoWs.suscribirConcentrado(newId, (data) => {
        console.log('🔔 Actualización recibida en detalle:', data.evento)
        
        // Actualizar store SIN hacer fetch adicional
        if (data.concentrado) {
          concentradosStore.concentradoDetalle = data.concentrado
          console.log('✅ Concentrado actualizado reactivamente')
        }
        
        if (data.procesos) {
          concentradosStore.kanban = data.procesos
          console.log('✅ Kanban actualizado reactivamente')
        }
      })
      
      console.log('✅ Suscrito a actualizaciones del concentrado', newId)
    } catch (error) {
      console.error('❌ Error al suscribirse:', error)
    }
  }
}, { immediate: true })

onUnmounted(() => {
  if (subscription) subscription.unsubscribe()
})

const concentrado = computed(() => concentradosStore.concentradoDetalle)

// Determinar qué tabs están disponibles según el estado
const tabsDisponibles = computed(() => {
  const tabs = [
    { id: 'general', label: 'General', icon: Info, disponible: true }
  ]

  // Kanban disponible desde "en_camino_a_planta" en adelante
  if (concentrado.value && concentrado.value.estado !== 'creado') {
    tabs.push({ id: 'kanban', label: 'Kanban', icon: Kanban, disponible: true })
  }

  tabs.push({ id: 'historial', label: 'Historial', icon: History, disponible: true })

  return tabs
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-9999 flex items-center justify-center bg-neutral-900/20 backdrop-blur-sm p-4"
      @click.self="emit('close')"
    >
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-[1500px] max-h-[90vh] border border-border flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-hover shrink-0">
          <div class="flex items-center gap-3">
            <div 
              v-if="concentrado"
              class="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
              :class="getEstadoConfig(concentrado.estado).color"
            >
              <PackageCheck class="w-6 h-6 text-white" />
            </div>
            <div v-else class="w-12 h-12 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <PackageCheck class="w-6 h-6 text-white" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-semibold text-neutral">
                  {{ concentrado?.id ? '00' + concentrado.id : 'Cargando...' }}
                </h2>
                <span
                  v-if="concentrado"
                  class="px-3 py-1 rounded-lg text-xs font-medium text-white"
                  :class="getEstadoConfig(concentrado.estado).color"
                >
                  {{ getEstadoConfig(concentrado.estado).label }}
                </span>
              </div>
              <p v-if="concentrado" class="text-sm text-secondary mt-0.5">
                Ingenio: {{ concentrado.ingenioNombre }}
              </p>
            </div>
          </div>
          <button
            @click="emit('close')"
            class="w-10 h-10 rounded-lg hover:bg-surface transition-colors flex items-center justify-center text-secondary hover:text-neutral"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Loading -->
        <div v-if="concentradosStore.loadingDetalle" class="p-12 text-center flex-1">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p class="text-secondary">Cargando detalle del concentrado...</p>
        </div>

        <!-- Error -->
        <div v-else-if="concentradosStore.error" class="p-12 text-center flex-1">
          <div class="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle class="w-8 h-8 text-white" />
          </div>
          <h3 class="text-lg font-semibold text-neutral mb-2">Error al cargar el concentrado</h3>
          <p class="text-sm text-secondary">{{ concentradosStore.error }}</p>
        </div>

        <!-- Content -->
        <div v-else-if="concentrado" class="flex-1 overflow-y-auto scrollbar-custom">
          <div class="p-4 sm:p-6">
            <!-- Tabs -->
            <div class="border-b border-border mb-6">
              <div class="flex gap-4 overflow-x-auto scrollbar-custom">
                <button
                  v-for="tab in tabsDisponibles"
                  :key="tab.id"
                  @click="tabActual = tab.id"
                  class="px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-1"
                  :class="tabActual === tab.id
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-secondary hover:text-neutral'"
                >
                  <component :is="tab.icon" class="w-4 h-4" />
                  {{ tab.label }}
                </button>
              </div>
            </div>

            <!-- Tab Content -->
            <ConcentradoDetalleTabGeneral 
              v-show="tabActual === 'general'" 
              :concentrado="concentrado"
            />
            
            <ConcentradoDetalleTabKanbanSocio 
              v-show="tabActual === 'kanban'" 
              :concentrado="concentrado"
              :concentrado-id="concentradoId"
            />

            <ConcentradoDetalleTabHistorial 
              v-show="tabActual === 'historial'" 
              :concentrado="concentrado"
              :concentrado-id="concentradoId"
              :tab-actual="tabActual"
            />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>