<!-- src/components/comercializadora/venta/ModalVentaDetalleComercializadora.vue -->
<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useVentaComercializadoraStore } from '@/stores/comercializadora/ventaComercializadoraStore'
import {
  X, ShoppingCart, Info, FileText, DollarSign, AlertCircle,
  CheckCircle2, XCircle, Clock, Calculator
} from 'lucide-vue-next'
import { getVentaEstadoConfig } from '@/utils/ventaEstados'
import VentaTabGeneral from '@/components/socio/venta/VentaTabGeneral.vue'
import VentaTabReporteQuimico from '@/components/socio/venta/VentaTabReporteQuimico.vue'
import VentaTabLiquidacion from '@/components/shared/VentaTabLiquidacion.vue'
import VentaTabPago from '@/components/comercializadora/venta/VentaTabPago.vue'
import { useLiquidacionesWS } from '@/composables/useLiquidacionesWS'
import { useUIStore } from '@/stores/uiStore'
import ReportButtonLiquidacion from '@/components/shared/ReportButtonLiquidacion.vue'
const props = defineProps({
  ventaId: { type: Number, required: true }
})

const emit = defineEmits(['close', 'actualizado'])

const ventaStore = useVentaComercializadoraStore()
const liquidacionesWS = useLiquidacionesWS()
const uiStore = useUIStore()

const tabActual = ref('general')
const motivoRechazo = ref('')
const mostrarRechazo = ref(false)

watch(() => props.ventaId, async (newId, oldId) => {
  if (newId) {
    // Fetch inicial
    await ventaStore.fetchVentaDetalle(newId)
    
    // Desuscribirse de la anterior si existía
    if (oldId) {
      liquidacionesWS.desuscribirLiquidacion(oldId)
    }
    
    // Suscribirse a actualizaciones en tiempo real
    await liquidacionesWS.suscribirLiquidacion(newId, (data) => {
      console.log('📥 Liquidación actualizada:', data.evento)
      
      // Refrescar detalle
      ventaStore.fetchVentaDetalle(newId)
      
      // Notificar al padre para refrescar lista
      emit('actualizado')
      
      // Mostrar notificación
      switch (data.evento) {
        case 'reporte_quimico_subido':
          if (data.tipoReporte === 'socio') {
            uiStore.showToast('El socio ha subido su reporte químico', 'info')
          }
          break
        case 'venta_cerrada':
          uiStore.showToast('Venta cerrada por el socio', 'success')
          break
        default:
          console.log('Evento:', data.evento)
      }
    })
    
    tabActual.value = 'general'
  }
}, { immediate: true })

onUnmounted(() => {
  if (props.ventaId) {
    liquidacionesWS.desuscribirLiquidacion(props.ventaId)
  }
})

const venta = computed(() => ventaStore.ventaDetalle)
const puedeAprobar = computed(() => venta.value?.estado === 'pendiente_aprobacion')

const tabsDisponibles = computed(() => {
  const tabs = [
    { id: 'general', label: 'General', icon: Info, disponible: true }
  ]

  const estado = venta.value?.estado

  // Tab de Reportes (si no está en pendiente o rechazado)
  if (estado && !['pendiente_aprobacion', 'rechazado'].includes(estado)) {
    const reporteComercializadora = venta.value?.reportesQuimicos?.reporteComercializadora
    tabs.push({
      id: 'reportes',
      label: 'Reportes',
      icon: FileText,
      disponible: true,
      badge: !reporteComercializadora ? 'Pendiente' : null
    })
  }

  // Tab de Liquidación (si está cerrado o pagado)
  if (['cerrado', 'pagado'].includes(estado)) {
    tabs.push({
      id: 'liquidacion',
      label: 'Liquidación',
      icon: Calculator,
      disponible: true
    })
  }

  // Tab de Pago (si está cerrado o pagado)
  if (['cerrado', 'pagado'].includes(estado)) {
    tabs.push({
      id: 'pago',
      label: 'Pago',
      icon: DollarSign,
      disponible: true,
      badge: estado === 'cerrado' ? 'Acción Requerida' : 'Pagado'
    })
  }

  return tabs
})

const handleActualizado = () => {
  ventaStore.fetchVentaDetalle(props.ventaId)
  emit('actualizado')
}
const handleClose = () => {
  if (props.ventaId) {
    liquidacionesWS.desuscribirLiquidacion(props.ventaId)
  }
  emit('close')
}

// Acciones
const aprobar = async () => {
  const ok = await uiStore.showConfirm(
    '¿Aprobar esta solicitud de venta?',
    'Confirmar Aprobación'
  )
  if (!ok) return

  const resultado = await ventaStore.aprobarVenta(props.ventaId)
  if (resultado.success) {
    emit('actualizado')
  }
}

const rechazar = async () => {
  if (!motivoRechazo.value.trim()) {
    uiStore.showError('Debes proporcionar un motivo de rechazo', 'Validación')
    return
  }

  const resultado = await ventaStore.rechazarVenta(props.ventaId, motivoRechazo.value)
  if (resultado.success) {
    mostrarRechazo.value = false
    emit('actualizado')
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-9999 flex items-center justify-center bg-neutral-900/20 backdrop-blur-sm p-4"
      @click.self="handleClose"
    >
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-[1200px] max-h-[90vh] border border-border flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-hover shrink-0">
          <div class="flex items-center gap-3">
            <div
              v-if="venta"
              class="w-12 h-12 rounded-lg center shrink-0"
              :class="getVentaEstadoConfig(venta.estado).color"
            >
              <ShoppingCart class="w-6 h-6 text-white" />
            </div>
            <div v-else class="w-12 h-12 rounded-lg bg-primary center shrink-0">
              <ShoppingCart class="w-6 h-6 text-white" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-semibold text-neutral">
                  Liquidación #{{ venta?.id || '...' }}
                </h2>
                <span
                  v-if="venta"
                  class="px-3 py-1 rounded-lg text-xs font-medium text-white"
                  :class="getVentaEstadoConfig(venta.estado).badgeClass"
                >
                  {{ getVentaEstadoConfig(venta.estado).label }}
                </span>
              </div>
              <p v-if="venta && venta.socio" class="text-sm text-secondary mt-0.5">
                Socio: {{ venta.socio.nombres }} {{ venta.socio.apellidos }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <ReportButtonLiquidacion
              v-if="venta"
              :liquidacion="venta"
              tipo="both"
              variant="dropdown"
              size="sm"
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
        <div v-if="ventaStore.loadingDetalle" class="p-12 text-center flex-1">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p class="text-secondary">Cargando detalle de la liquidación...</p>
        </div>

        <!-- Error -->
        <div v-else-if="ventaStore.error" class="p-12 text-center flex-1">
          <AlertCircle class="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-neutral mb-2">Error al cargar</h3>
          <p class="text-sm text-secondary">{{ ventaStore.error }}</p>
        </div>

        <!-- Content -->
        <div v-else-if="venta" class="flex-1 overflow-y-auto scrollbar-custom">
          <div class="p-4 sm:p-6">
            <!-- Acciones rápidas - Aprobación -->
            <div v-if="puedeAprobar" class="bg-primary rounded-xl p-4 border border-primary mb-6">
              <div class="flex items-start gap-3">
                <Clock class="w-5 h-5 text-white shrink-0 mt-0.5" />
                <div class="flex-1">
                  <h4 class="font-semibold text-white">Solicitud pendiente de aprobación</h4>
                  <p class="text-sm text-white/90 mt-1">
                    El socio {{ venta.socio.nombres }} {{ venta.socio.apellidos }} solicita vender
                    {{ venta.concentrados?.length || venta.lotes?.length || 0 }}
                    {{ venta.tipoLiquidacion === 'venta_concentrado' ? 'concentrado(s)' : 'lote(s)' }}.
                  </p>
                  <div class="flex gap-3 mt-4">
                    <button
                      @click="aprobar"
                      :disabled="ventaStore.loadingAccion"
                      class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 font-medium"
                    >
                      <CheckCircle2 class="w-4 h-4" /> Aprobar
                    </button>
                    <button
                      @click="mostrarRechazo = true"
                      class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium"
                    >
                      <XCircle class="w-4 h-4" /> Rechazar
                    </button>
                  </div>
                </div>
              </div>

              <!-- Form Rechazo -->
              <div v-if="mostrarRechazo" class="mt-4 p-4 bg-neutral-700 dark:bg-neutral-600 rounded-lg border border-neutral-600 dark:border-neutral-500">
                <label class="block text-xs text-white mb-2">Motivo del rechazo *</label>
                <textarea
                  v-model="motivoRechazo"
                  rows="2"
                  maxlength="500"
                  placeholder="Explica por qué se rechaza esta solicitud..."
                  class="w-full px-3 py-2 rounded-lg border border-neutral-500 dark:border-neutral-400 bg-neutral-600 dark:bg-neutral-500 text-white placeholder-white/60 focus:ring-2 focus:ring-white/30 focus:outline-none resize-none mb-3"
                ></textarea>
                <div class="flex gap-2">
                  <button
                    @click="mostrarRechazo = false"
                    class="bg-white/20 text-white px-4 py-2 rounded-lg text-sm hover:bg-white/30 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    @click="rechazar"
                    :disabled="ventaStore.loadingAccion"
                    class="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
                  >
                    Confirmar Rechazo
                  </button>
                </div>
              </div>
            </div>

            <!-- Tabs -->
            <div class="border-b border-border mb-6">
              <div class="flex gap-4 overflow-x-auto scrollbar-custom">
                <button
                  v-for="tab in tabsDisponibles"
                  :key="tab.id"
                  @click="tabActual = tab.id"
                  class="px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1"
                  :class="tabActual === tab.id
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-secondary hover:text-neutral'"
                >
                  <component :is="tab.icon" class="w-4 h-4" />
                  {{ tab.label }}
                  <span
                    v-if="tab.badge"
                    class="ml-1 px-1.5 py-0.5 rounded-full text-xs"
                    :class="tab.badge === 'Pagado'
                      ? 'bg-green-500/20 text-green-700'
                      : tab.badge === 'Acción Requerida'
                        ? 'bg-orange-500/20 text-orange-700'
                        : 'bg-yellow-500/20 text-yellow-700'"
                  >
                    {{ tab.badge }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Tab Content -->
            <VentaTabGeneral
              v-show="tabActual === 'general'"
              :venta="venta"
            />

            <VentaTabReporteQuimico
              v-if="tabsDisponibles.some(t => t.id === 'reportes')"
              v-show="tabActual === 'reportes'"
              :venta="venta"
              tipo="comercializadora"
              @actualizado="handleActualizado"
            />

            <VentaTabLiquidacion
              v-if="tabsDisponibles.some(t => t.id === 'liquidacion')"
              v-show="tabActual === 'liquidacion'"
              :venta="venta"
            />

            <VentaTabPago
              v-if="tabsDisponibles.some(t => t.id === 'pago')"
              v-show="tabActual === 'pago'"
              :venta="venta"
              @actualizado="handleActualizado"
            />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>