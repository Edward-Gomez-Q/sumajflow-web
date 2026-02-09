<!-- src/components/socio/venta/ModalVentaDetalleSocio.vue -->
<script setup>
import { ref, computed, watch, onUnmounted  } from 'vue'
import { useVentaConcentradoStore } from '@/stores/socio/ventaConcentradoStore'
import { useFilesStore } from '@/stores/filesStore'
import {
  X, ShoppingCart, Info, FileText, DollarSign, AlertCircle, Calculator,
  CheckCircle2, Clock
} from 'lucide-vue-next'
import { getVentaEstadoConfig } from '@/utils/ventaEstados'
import VentaTabGeneral from '@/components/socio/venta/VentaTabGeneral.vue'
import VentaTabReporteQuimico from '@/components/socio/venta/VentaTabReporteQuimico.vue'
import VentaTabLiquidacion from '@/components/shared/VentaTabLiquidacion.vue'
import VentaTabCierreLote from '@/components/socio/venta/VentaTabCierreLote.vue'
import VentaTabCierreVenta from '@/components/socio/venta/VentaTabCierreVenta.vue'
import { useUIStore } from '@/stores/uiStore'
import { useLiquidacionesWS } from '@/composables/useLiquidacionesWS'

const props = defineProps({
  ventaId: { type: Number, required: true }
})

const emit = defineEmits(['close', 'actualizado'])

const ventaStore = useVentaConcentradoStore()
const liquidacionesWS = useLiquidacionesWS()
const filesStore = useFilesStore()
const uiStore = useUIStore()

const tabActual = ref('general')

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
        case 'venta_aprobada':
          uiStore.showToast('¡Venta aprobada!', 'success')
          break
        case 'venta_rechazada':
          uiStore.showToast(`Venta rechazada: ${data.motivoRechazo}`, 'error')
          break
        case 'reporte_quimico_subido':
          if (data.tipoReporte === 'comercializadora') {
            uiStore.showToast('Comercializadora subió su reporte', 'info')
          }
          break
        case 'venta_pagada':
          uiStore.showToast('¡Pago confirmado!', 'success')
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

const tabsDisponibles = computed(() => {
  const tabs = [
    { id: 'general', label: 'General', icon: Info, disponible: true }
  ]

  const estado = venta.value?.estado

  // Tab de Reportes (si no está en pendiente o rechazado)
  if (estado && !['pendiente_aprobacion', 'rechazado'].includes(estado)) {
    const reporteSocio = venta.value?.reportesQuimicos?.reporteSocio
    tabs.push({
      id: 'reporte',
      label: 'Reporte Químico',
      icon: FileText,
      disponible: true,
      badge: !reporteSocio ? 'Pendiente' : null
    })
  }

  // Tab de Cierre (si está esperando cierre)
  if (estado === 'esperando_cierre_venta') {
    tabs.push({
      id: 'cierre',
      label: 'Cerrar Venta',
      icon: DollarSign,
      disponible: true,
      badge: 'Acción Requerida'
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
      label: 'Estado de Pago',
      icon: DollarSign,
      disponible: true,
      badge: estado === 'cerrado' ? 'Pendiente' : 'Pagado'
    })
  }

  return tabs
})

const handleActualizado = () => {
  ventaStore.fetchVentaDetalle(props.ventaId)
  emit('actualizado')
}

// ⭐ NUEVO: Handler específico para cuando se cierra la venta
const handleCerradoVenta = async () => {
  console.log('🎯 Venta cerrada, actualizando vista...')
  
  // Refrescar datos de la venta
  await ventaStore.fetchVentaDetalle(props.ventaId)
  
  // Notificar al padre para refrescar lista
  emit('actualizado')
  
  // Cambiar al tab General (porque el tab de cierre ya no existirá)
  tabActual.value = 'general'
  
  // Mostrar notificación de éxito
  uiStore.showToast('Venta cerrada exitosamente. Esperando confirmación de pago.', 'success')
}

const handleClose = () => {
  if (props.ventaId) {
    liquidacionesWS.desuscribirLiquidacion(props.ventaId)
  }
  emit('close')
}

const abrirComprobante = (url) => {
  filesStore.openFile(url)
}

const formatCurrency = (v, c = 'BOB') => {
  if (v === null || v === undefined) return '-'
  return new Intl.NumberFormat('es-BO', { style: 'currency', currency: c }).format(v)
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
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
              <p v-if="venta && venta.comercializadora" class="text-sm text-secondary mt-0.5">
                {{ venta.comercializadora.razonSocial }}
              </p>
            </div>
          </div>
          <button
            @click="handleClose"
            class="w-10 h-10 rounded-lg hover:bg-surface transition-colors flex items-center justify-center text-secondary hover:text-neutral"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Loading -->
        <div v-if="ventaStore.loadingDetalle" class="p-12 text-center flex-1">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p class="text-secondary">Cargando detalle de la liquidación...</p>
        </div>

        <!-- Error -->
        <div v-else-if="ventaStore.error" class="p-12 text-center flex-1">
          <AlertCircle class="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-neutral mb-2">Error al cargar la liquidación</h3>
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
                      : tab.badge === 'Acción Requerida'
                        ? 'bg-indigo-500/20 text-indigo-700'
                        : tab.badge === 'Pendiente'
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
              v-if="tabsDisponibles.some(t => t.id === 'reporte')"
              v-show="tabActual === 'reporte'"
              :venta="venta"
              tipo="socio"
              @actualizado="handleActualizado"
            />

            <VentaTabLiquidacion
              v-if="tabsDisponibles.some(t => t.id === 'liquidacion')"
              v-show="tabActual === 'liquidacion'"
              :venta="venta"
            />

            <VentaTabCierreLote
              v-if="tabsDisponibles.some(t => t.id === 'cierre') && venta.tipoLiquidacion === 'venta_lote_complejo'"
              v-show="tabActual === 'cierre'"
              :venta="venta"
              @actualizado="handleActualizado"
              @cerrado="handleCerradoVenta"
            />

            <VentaTabCierreVenta
              v-if="tabsDisponibles.some(t => t.id === 'cierre') && venta.tipoLiquidacion !== 'venta_lote_complejo'"
              v-show="tabActual === 'cierre'"
              :venta="venta"
              @actualizado="handleActualizado"
              @cerrado="handleCerradoVenta"
            />

            <!-- Tab de Pago (Solo información para el socio) -->
            <div v-if="tabActual === 'pago'" class="space-y-4">
              <!-- Estado: Pago Pendiente -->
              <div v-if="venta.estado === 'cerrado'">
                <div class="bg-orange-500/10 rounded-xl p-5 border border-orange-500/30">
                  <div class="flex items-start gap-3">
                    <Clock class="w-6 h-6 text-orange-600 dark:text-orange-400 shrink-0" />
                    <div>
                      <h3 class="text-lg font-semibold text-orange-600 dark:text-orange-400 mb-1">
                        Esperando Confirmación de Pago
                      </h3>
                      <p class="text-sm text-secondary">
                        La liquidación ha sido cerrada. La comercializadora debe confirmar el pago de:
                      </p>
                      <p class="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-3">
                        {{ formatCurrency(venta.valorNetoBob) }}
                      </p>
                      <p class="text-sm text-secondary mt-1">
                        {{ formatCurrency(venta.valorNetoUsd, 'USD') }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Estado: Pagado -->
              <div v-if="venta.estado === 'pagado' && venta.pago">
                <div class="bg-green-500/10 rounded-xl p-5 border border-green-500/30">
                  <div class="flex items-start gap-3">
                    <div class="w-12 h-12 rounded-lg bg-green-500 center shrink-0">
                      <CheckCircle2 class="w-6 h-6 text-white" />
                    </div>
                    <div class="flex-1">
                      <h3 class="text-lg font-semibold text-green-600 dark:text-green-400 mb-1">
                        Pago Recibido
                      </h3>
                      <p class="text-sm text-secondary mb-4">
                        El pago de esta liquidación ha sido confirmado por la comercializadora.
                      </p>

                      <!-- Detalles del Pago -->
                      <div class="grid md:grid-cols-2 gap-4 mt-4">
                        <div class="bg-surface rounded-lg p-3 border border-border">
                          <p class="text-xs text-secondary mb-1">Método de Pago</p>
                          <p class="text-sm font-semibold text-neutral capitalize">
                            {{ venta.pago.metodoPago?.replace(/_/g, ' ') || '-' }}
                          </p>
                        </div>
                        <div class="bg-surface rounded-lg p-3 border border-border">
                          <p class="text-xs text-secondary mb-1">Número de Comprobante</p>
                          <p class="text-sm font-semibold text-neutral">
                            {{ venta.pago.numeroComprobante || '-' }}
                          </p>
                        </div>
                        <div class="bg-surface rounded-lg p-3 border border-border">
                          <p class="text-xs text-secondary mb-1">Fecha de Pago</p>
                          <p class="text-sm font-semibold text-neutral">
                            {{ formatDate(venta.pago.fechaPago) }}
                          </p>
                        </div>
                        <div class="bg-surface rounded-lg p-3 border border-border">
                          <p class="text-xs text-secondary mb-1">Monto Recibido</p>
                          <p class="text-lg font-bold text-green-600">
                            {{ formatCurrency(venta.valorNetoBob) }}
                          </p>
                        </div>
                      </div>

                      <!-- Comprobante -->
                      <div v-if="venta.pago.urlComprobante" class="mt-4 pt-4 border-t border-border">
                        <p class="text-xs text-secondary mb-2">Comprobante de Pago</p>
                        <button
                          @click="abrirComprobante(venta.pago.urlComprobante)"
                          class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors text-sm font-medium"
                        >
                          <FileText class="w-4 h-4" />
                          Ver Comprobante
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>