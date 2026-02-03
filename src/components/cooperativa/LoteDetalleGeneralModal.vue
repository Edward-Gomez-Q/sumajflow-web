<!-- src/components/cooperativa/LoteDetalleGeneralModal.vue -->
<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useLotesCooperativaGeneralStore } from '@/stores/cooperativa/lotesCooperativaGeneralStore'
import {
  X,
  PackageCheck,
  Info,
  Truck,
  Clock,
  AlertCircle
} from 'lucide-vue-next'
import LoteDetalleTabGeneral from '@/components/socio/LoteDetalleTabGeneral.vue'
import LoteDetalleTabTransporte from '@/components/socio/LoteDetalleTabTransporte.vue'
import LoteDetalleTabHistorial from '@/components/socio/LoteDetalleTabHistorial.vue'
import { useLotesWS } from '@/composables/useLotesWS'
import { useUIStore } from '@/stores/uiStore'
const props = defineProps({
  loteId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['close'])
const uiStore = useUIStore()
const lotesWS = useLotesWS()
const lotesStore = useLotesCooperativaGeneralStore()
const tabActual = ref('general')

onMounted(async () => {
  await lotesStore.fetchLoteDetalle(props.loteId)
  lotesWS.suscribirLote(props.loteId, (evento) => {
    console.log('🔔 Actualización en detalle:', evento)
    
    if (evento.lote) {
      lotesStore.setLoteDetalle(evento.lote)
    } else {
      lotesStore.fetchLoteDetalle(props.loteId)
    }
    const toasts = {
      lote_aprobado_destino: {
        message: 'Lote completamente aprobado',
        icon: 'success'
      },
      lote_rechazado_destino: {
        message: `Rechazado por destino: ${evento.motivoRechazo || 'Sin motivo'}`,
        icon: 'error'
      },
      transporte_iniciado: {
        message: `Camión #${evento.numeroCamion} inició transporte`,
        icon: 'info'
      },
      transporte_finalizado: {
        message: `Camión #${evento.numeroCamion} completó transporte`,
        icon: 'success'
      }
    }
    
    const toast = toasts[evento.evento]
    if (toast) {
      uiStore.showToast(toast.message, toast.icon)
    }
  })
})
onUnmounted(() => {
  lotesWS.desuscribirLote(props.loteId)
})

watch(
  () => props.loteId,
  async (newId, oldId) => {
    if (oldId) lotesWS.desuscribirLote(oldId)
    if (newId) {
      await lotesStore.fetchLoteDetalle(newId)
      lotesWS.suscribirLote(newId, handleEvento)
    }
  }
)

const lote = computed(() => lotesStore.loteDetalle)

const getEstadoColorSolido = (estado) => {
  if (!estado) return 'bg-gray-500'
  if (estado.includes('Pendiente')) {
    return 'bg-yellow-500'
  } else if (estado === 'Rechazado') {
    return 'bg-red-500'
  } else if (estado === 'Completado') {
    return 'bg-green-500'
  } else {
    return 'bg-blue-500'
  }
}

const formatDateShort = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-9999 flex items-center justify-center bg-neutral-900/20 backdrop-blur-sm p-4"
      @click.self="emit('close')"
    >
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] border border-border flex flex-col">
        <!-- Header -->
<div class="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-hover shrink-0">
  <div class="flex items-center gap-3">
    <div class="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
      <PackageCheck class="w-6 h-6 text-white" />
    </div>
    <div>
      <div class="flex items-center gap-2">
        <h2 class="text-xl font-semibold text-neutral">
          Detalle del Lote #{{ loteId }}
        </h2>
        <span
          v-if="lote"
          class="px-3 py-1 rounded-lg text-xs font-medium text-white"
          :class="getEstadoColorSolido(lote.estado)"
        >
          {{ lote.estado }}
        </span>
      </div>
      <p v-if="lote" class="text-sm text-secondary mt-0.5">
        Creado el {{ formatDateShort(lote.fechaCreacion) }}
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
        <div v-if="lotesStore.loadingDetalle" class="p-12 text-center flex-1">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p class="text-secondary">Cargando detalle del lote...</p>
        </div>

        <!-- Content -->
        <div v-else-if="lote" class="flex-1 overflow-y-auto scrollbar-custom">
          <div class="p-4 sm:p-6">

            <!-- Tabs -->
            <div class="border-b border-border mb-6">
              <div class="flex gap-4 overflow-x-auto scrollbar-custom">
                <button
                  @click="tabActual = 'general'"
                  class="px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-1"
                  :class="tabActual === 'general'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-secondary hover:text-neutral'"
                >
                  <Info class="w-4 h-4" />
                  General
                </button>
                <button
                  @click="tabActual = 'transporte'"
                  class="px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-1"
                  :class="tabActual === 'transporte'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-secondary hover:text-neutral'"
                >
                  <Truck class="w-4 h-4" />
                  Transporte
                  <span v-if="lote.camioneAsignados > 0" class="ml-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
                    {{ lote.camioneAsignados }}
                  </span>
                </button>
                <button
                  @click="tabActual = 'historial'"
                  class="px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-1"
                  :class="tabActual === 'historial'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-secondary hover:text-neutral'"
                >
                  <Clock class="w-4 h-4" />
                  Historial
                  <span v-if="lote.historialCambios?.length > 0" class="ml-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
                    {{ lote.historialCambios.length }}
                  </span>
                </button>
              </div>
            </div>

            <!-- 🆕 Tabs usando componentes de socio -->
            <LoteDetalleTabGeneral 
              v-show="tabActual === 'general'" 
              :lote="lote" 
            />
            
            <LoteDetalleTabTransporte 
              v-show="tabActual === 'transporte'" 
              :lote="lote"
              :lote-id="loteId"
            />
            
            <LoteDetalleTabHistorial 
              v-show="tabActual === 'historial'" 
              :lote="lote" 
            />
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="lotesStore.error" class="p-12 text-center flex-1">
          <div class="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle class="w-8 h-8 text-white" />
          </div>
          <h3 class="text-lg font-semibold text-neutral mb-2">Error al cargar el lote</h3>
          <p class="text-sm text-secondary">{{ lotesStore.error }}</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>