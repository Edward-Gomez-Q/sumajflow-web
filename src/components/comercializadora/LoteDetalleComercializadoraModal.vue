<!-- src/components/comercializadora/LoteDetalleComercializadoraModal.vue -->
<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLotesComercializadoraStore } from '@/stores/comercializadora/lotesComercializadoraStore'
import {
  X,
  PackageCheck,
  Info,
  Truck,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink
} from 'lucide-vue-next'
import LoteDetalleTabGeneral from '@/components/socio/LoteDetalleTabGeneral.vue'
import LoteDetalleTabTransporte from '@/components/socio/LoteDetalleTabTransporte.vue'
import LoteDetalleTabHistorial from '@/components/socio/LoteDetalleTabHistorial.vue'
import VentaTabGeneral from '@/components/socio/venta/VentaTabGeneral.vue'
import { useLotesWS } from '@/composables/useLotesWS'
import { useUIStore } from '@/stores/uiStore'
import ReportButton from '@/components/shared/ReportButton.vue'

const props = defineProps({
  loteId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['close', 'aprobar', 'rechazar'])

const router = useRouter()
const lotesStore = useLotesComercializadoraStore()
const tabActual = ref('general')
const uiStore = useUIStore()
const lotesWS = useLotesWS()

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
      lote_aprobado_cooperativa: {
        message: 'Lote aprobado por cooperativa',
        icon: 'success'
      },
      lote_rechazado_cooperativa: {
        message: `Lote rechazado: ${evento.motivoRechazo || 'Sin motivo'}`,
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

const esPendienteAprobacion = computed(() => {
  return lote.value?.estado === 'Pendiente de aprobación por Ingenio/Comercializadora'
})

// Computed para verificar si tiene liquidación de venta directa
const tieneLiquidacionVenta = computed(() => {
  return lote.value?.liquidacionVentaDirecta && lote.value.liquidacionVentaDirecta.id
})

const getEstadoColorSolido = (estado) => {
  if (!estado) return 'bg-gray-500'
  if (estado.includes('Pendiente')) {
    return 'bg-yellow-500'
  } else if (estado === 'Rechazado') {
    return 'bg-red-500'
  } else if (estado === 'Vendido a comercializadora' || estado === 'Completado') {
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

const handleAprobar = () => {
  emit('aprobar')
}

const handleRechazar = () => {
  emit('rechazar')
}

// Función para ir a la vista de ventas/compras con el filtro del lote
const irAVentas = () => {
  emit('close')
  router.push({
    name: 'ComercializadoraVentas',
    query: { loteId: props.loteId }
  })
}

// Formatear moneda
const formatCurrency = (value, currency = 'BOB') => {
  if (!value && value !== 0) return '-'
  return new Intl.NumberFormat('es-BO', { 
    style: 'currency', 
    currency 
  }).format(value)
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
            <div class="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" :class="getEstadoColorSolido(lote?.estado)">
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
                    <div class="flex items-center gap-3">
            
            <ReportButton 
              v-if="lote"
              :lote="lote" 
              rol="socio"
              tipo="both"
              variant="dropdown"
              size="md"
            />
            
            <button
              @click="emit('close')"
              class="w-10 h-10 rounded-lg hover:bg-surface transition-colors flex items-center justify-center text-secondary hover:text-neutral"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="lotesStore.loadingDetalle" class="p-12 text-center flex-1">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p class="text-secondary">Cargando detalle del lote...</p>
        </div>

        <!-- Content -->
        <div v-else-if="lote" class="flex-1 overflow-y-auto scrollbar-custom">
          <div class="p-4 sm:p-6">
            
            <!-- Banner de Liquidación (si existe) -->
            <div 
              v-if="tieneLiquidacionVenta"
              class="bg-linear-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/30 mb-6"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex items-start gap-3 flex-1">
                  <div class="w-10 h-10 rounded-lg bg-green-500 center shrink-0">
                    <FileText class="w-5 h-5 text-white" />
                  </div>
                  <div class="flex-1">
                    <h4 class="font-semibold text-green-700 dark:text-green-400 mb-1">
                      Este lote tiene una liquidación de compra
                    </h4>
                    <p class="text-sm text-green-600 dark:text-green-500 mb-3">
                      Liquidación #{{ lote.liquidacionVentaDirecta.id }} • 
                      Estado: <span class="font-medium capitalize">{{ lote.liquidacionVentaDirecta.estado.replace(/_/g, ' ') }}</span>
                      <span v-if="lote.liquidacionVentaDirecta.resultadoFinal">
                        • Valor: {{ formatCurrency(lote.liquidacionVentaDirecta.resultadoFinal.valorNetoBob) }}
                      </span>
                    </p>
                    <button
                      @click="irAVentas"
                      class="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      <ExternalLink class="w-4 h-4" />
                      Ver liquidación completa
                    </button>
                  </div>
                </div>
              </div>
            </div>

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
                
                <!-- Tab de Liquidación de Compra (solo si existe) -->
                <button
                  v-if="tieneLiquidacionVenta"
                  @click="tabActual = 'liquidacion-compra'"
                  class="px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-1"
                  :class="tabActual === 'liquidacion-compra'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-secondary hover:text-neutral'"
                >
                  <FileText class="w-4 h-4" />
                  Liquidación Compra
                  <span 
                    v-if="lote.liquidacionVentaDirecta.estado === 'pendiente_aprobacion'"
                    class="ml-1 px-2 py-0.5 rounded-md bg-yellow-500 text-white text-xs font-semibold"
                  >
                    Pendiente
                  </span>
                  <span 
                    v-else-if="lote.liquidacionVentaDirecta.estado === 'aprobado'"
                    class="ml-1 px-2 py-0.5 rounded-md bg-blue-500 text-white text-xs font-semibold"
                  >
                    Aprobado
                  </span>
                  <span 
                    v-else-if="lote.liquidacionVentaDirecta.estado === 'cerrado'"
                    class="ml-1 px-2 py-0.5 rounded-md bg-orange-500 text-white text-xs font-semibold"
                  >
                    Esperando Pago
                  </span>
                  <span 
                    v-else-if="lote.liquidacionVentaDirecta.estado === 'pagado'"
                    class="ml-1 px-2 py-0.5 rounded-md bg-green-600 text-white text-xs font-semibold"
                  >
                    Pagado
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

            <!-- Tab Content -->
            <LoteDetalleTabGeneral 
              v-show="tabActual === 'general'" 
              :lote="lote" 
            />
            
            <LoteDetalleTabTransporte 
              v-show="tabActual === 'transporte'" 
              :lote="lote"
              :lote-id="loteId"
            />
            
            <!-- Tab de Liquidación de Compra usando VentaTabGeneral -->
            <div v-if="tieneLiquidacionVenta" v-show="tabActual === 'liquidacion-compra'">
              <div class="mb-4 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-neutral">
                  Información de la Liquidación de Compra
                </h3>
                <button
                  @click="irAVentas"
                  class="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                >
                  <ExternalLink class="w-4 h-4" />
                  Ver detalles completos
                </button>
              </div>
              <VentaTabGeneral :venta="lote.liquidacionVentaDirecta" />
            </div>
            
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