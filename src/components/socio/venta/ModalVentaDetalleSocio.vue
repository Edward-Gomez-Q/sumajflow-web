<!-- src/components/socio/venta/ModalVentaDetalleSocio.vue -->
<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useVentaConcentradoStore } from '@/stores/socio/ventaConcentradoStore'
import { useConcentradoWS } from '@/composables/useConcentradoWS'
import {
  X,
  ShoppingCart,
  Info,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  TrendingUp,
  Upload
} from 'lucide-vue-next'
import { getVentaEstadoConfig } from '@/utils/ventaEstados'
import VentaTabGeneral from '@/components/socio/venta/VentaTabGeneral.vue'
import VentaTabReporteQuimico from '@/components/socio/venta/VentaTabReporteQuimico.vue'
import VentaTabCierreVenta from '@/components/socio/venta/VentaTabCierreVenta.vue'
import VentaTabCierreLote from '@/components/socio/venta/VentaTabCierreLote.vue'

const props = defineProps({
  ventaId: { type: Number, required: true }
})

const emit = defineEmits(['close', 'actualizado'])

const ventaStore = useVentaConcentradoStore()
const concentradoWs = useConcentradoWS()

const tabActual = ref('general')

watch(() => props.ventaId, async (newId) => {
  if (newId) {
    await ventaStore.fetchVentaDetalle(newId)
    tabActual.value = 'general'
  }
}, { immediate: true })

const venta = computed(() => ventaStore.ventaDetalle)

const tabsDisponibles = computed(() => {
  const tabs = [
    { id: 'general', label: 'General', icon: Info, disponible: true }
  ]

  const estado = venta.value?.estado
  if (estado && !['pendiente_aprobacion', 'rechazado'].includes(estado)) {
    tabs.push({
      id: 'reporte',
      label: 'Reporte Químico',
      icon: FileText,
      disponible: true,
      badge: !venta.value?.reporteSocio ? 'Pendiente' : null
    })
  }

  if (estado === 'esperando_cierre_venta') {
    tabs.push({
      id: 'cierre',
      label: 'Cerrar Venta',
      icon: DollarSign,
      disponible: true,
      badge: 'Acción'
    })
  }

  if (['cerrado', 'pagado'].includes(estado)) {
    tabs.push({
      id: 'cierre',
      label: 'Liquidación',
      icon: DollarSign,
      disponible: true,
      badge: estado === 'cerrado' ? 'Pago Pendiente' : 'Pagado'
    })
  }

  return tabs
})

const handleActualizado = () => {
  ventaStore.fetchVentaDetalle(props.ventaId)
  emit('actualizado')
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-9999 flex items-center justify-center bg-neutral-900/20 backdrop-blur-sm p-4"
      @click.self="emit('close')"
    >
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-[1200px] max-h-[90vh] border border-border flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-hover shrink-0">
          <div class="flex items-center gap-3">
            <div
              v-if="venta"
              class="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
              :class="getVentaEstadoConfig(venta.estado).color"
            >
              <ShoppingCart class="w-6 h-6 text-white" />
            </div>
            <div v-else class="w-12 h-12 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <ShoppingCart class="w-6 h-6 text-white" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-semibold text-neutral">
                  Venta #{{ venta?.id || '...' }}
                </h2>
                <span
                  v-if="venta"
                  class="px-3 py-1 rounded-lg text-xs font-medium text-white"
                  :class="getVentaEstadoConfig(venta.estado).badgeClass"
                >
                  {{ getVentaEstadoConfig(venta.estado).label }}
                </span>
              </div>
              <p v-if="venta" class="text-sm text-secondary mt-0.5">
                {{ venta.comercializadoraNombre }}
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
        <div v-if="ventaStore.loadingDetalle" class="p-12 text-center flex-1">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p class="text-secondary">Cargando detalle de la venta...</p>
        </div>

        <!-- Error -->
        <div v-else-if="ventaStore.error" class="p-12 text-center flex-1">
          <AlertCircle class="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-neutral mb-2">Error al cargar la venta</h3>
          <p class="text-sm text-secondary">{{ ventaStore.error }}</p>
        </div>

        <!-- Content -->
        <div v-else-if="venta" class="flex-1 overflow-y-auto scrollbar-custom">
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
                  <span
                    v-if="tab.badge"
                    class="ml-1 px-1.5 py-0.5 rounded-full text-xs"
                    :class="tab.badge === 'Pagado'
                      ? 'bg-green-500/20 text-green-700'
                      : tab.badge === 'Acción'
                        ? 'bg-indigo-500/20 text-indigo-700'
                        : 'bg-orange-500/20 text-orange-700'"
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
              v-if="tabsDisponibles.some(t => t.id === 'reporte')"
              v-show="tabActual === 'reporte'"
              :venta="venta"
              @actualizado="handleActualizado"
            />

            <VentaTabCierreLote
              v-if="tabsDisponibles.some(t => t.id === 'cierre') && venta.tipoLiquidacion === 'venta_lote_complejo'"
              v-show="tabActual === 'cierre'"
              :venta="venta"
              @actualizado="handleActualizado"
            />

            <VentaTabCierreVenta
              v-if="tabsDisponibles.some(t => t.id === 'cierre') && venta.tipoLiquidacion !== 'venta_lote_complejo'"
              v-show="tabActual === 'cierre'"
              :venta="venta"
              @actualizado="handleActualizado"
            />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>