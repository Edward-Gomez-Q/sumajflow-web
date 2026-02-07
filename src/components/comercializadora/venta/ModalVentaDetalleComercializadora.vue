<!-- src/components/comercializadora/venta/ModalVentaDetalleComercializadora.vue -->
<script setup>
import { ref, computed, watch } from 'vue'
import { useVentaComercializadoraStore } from '@/stores/comercializadora/ventaComercializadoraStore'
import { useUIStore } from '@/stores/uiStore'
import { useSessionStore } from '@/stores/sessionStore'
import { useFilesStore } from '@/stores/filesStore'
import rutaApi from '@/assets/rutaApi.js'
import {
  X, ShoppingCart, Info, FileText, DollarSign, AlertCircle,
  CheckCircle2, XCircle, Clock, Upload, CreditCard, Package,
  Beaker, FileCheck, Calendar, Eye
} from 'lucide-vue-next'
import { getVentaEstadoConfig } from '@/utils/ventaEstados'
import VentaTabGeneral from '@/components/socio/venta/VentaTabGeneral.vue'
import FormularioReporteQuimico from '@/components/shared/FormularioReporteQuimico.vue'

const props = defineProps({
  ventaId: { type: Number, required: true }
})
const emit = defineEmits(['close', 'actualizado'])

const ventaStore = useVentaComercializadoraStore()
const uiStore = useUIStore()
const sessionStore = useSessionStore()
const filesStore = useFilesStore()

const tabActual = ref('general')
const motivoRechazo = ref('')
const mostrarRechazo = ref(false)

// Reporte - usando componente reutilizable
const mostrarFormReporte = ref(false)

// Pago form
const mostrarFormPago = ref(false)
const pagoForm = ref({
  metodoPago: '', numeroComprobante: '', urlComprobante: '', observaciones: ''
})
const pagoFileInput = ref(null)
const uploadingPago = ref(false)
const pagoFilePreview = ref(null)

watch(() => props.ventaId, async (newId) => {
  if (newId) {
    await ventaStore.fetchVentaDetalle(newId)
    tabActual.value = 'general'
  }
}, { immediate: true })

const venta = computed(() => ventaStore.ventaDetalle)
const yaSubioReporte = computed(() => !!venta.value?.reporteComercializadora)
const puedeAprobar = computed(() => venta.value?.estado === 'pendiente_aprobacion')
const puedePagar = computed(() => venta.value?.estado === 'cerrado')

const referenciaId = computed(() => {
  if (venta.value?.tipoLiquidacion === 'venta_concentrado') {
    return venta.value.concentrados?.[0]?.id || null
  } else {
    return venta.value.lotes?.[0]?.id || null
  }
})

const puedeSubirReporte = computed(() =>
  ['aprobado', 'esperando_reportes'].includes(venta.value?.estado) && !yaSubioReporte.value
)

const tabsDisponibles = computed(() => {
  const tabs = [{ id: 'general', label: 'General', icon: Info }]
  const estado = venta.value?.estado
  if (estado && !['pendiente_aprobacion', 'rechazado'].includes(estado)) {
    tabs.push({ id: 'reportes', label: 'Reportes', icon: FileText, badge: !yaSubioReporte.value ? 'Pendiente' : null })
  }
  if (['cerrado', 'pagado'].includes(estado)) {
    tabs.push({ id: 'pago', label: 'Pago', icon: DollarSign, badge: estado === 'cerrado' ? 'Pendiente' : 'Pagado' })
  }
  return tabs
})

// ===== ACCIONES =====
const aprobar = async () => {
  const ok = await uiStore.showConfirm('¿Aprobar esta solicitud de venta?', 'Confirmar Aprobación')
  if (!ok) return
  const r = await ventaStore.aprobarVenta(props.ventaId)
  if (r.success) emit('actualizado')
}

const rechazar = async () => {
  const r = await ventaStore.rechazarVenta(props.ventaId, motivoRechazo.value)
  if (r.success) { 
    mostrarRechazo.value = false
    emit('actualizado')
  }
}

const subirReporte = async (payload) => {
  const r = await ventaStore.subirReporteQuimico(props.ventaId, payload)
  if (r.success) {
    mostrarFormReporte.value = false
    emit('actualizado')
  }
}

const confirmarPago = async () => {
  if (!pagoForm.value.metodoPago || !pagoForm.value.numeroComprobante) {
    uiStore.showError('Método de pago y comprobante son requeridos', 'Validación')
    return
  }
  const ok = await uiStore.showConfirm('¿Confirmar el pago de esta venta?', 'Confirmar Pago')
  if (!ok) return
  const r = await ventaStore.confirmarPago(props.ventaId, pagoForm.value)
  if (r.success) {
    mostrarFormPago.value = false
    emit('actualizado')
  }
}

// File upload para pago
const handlePagoFile = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  try {
    uploadingPago.value = true
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', 'comprobantes-pago')
    const res = await fetch(`${rutaApi}/files/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${sessionStore.token}` },
      body: fd
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message)
    pagoForm.value.urlComprobante = data.data.objectName
    pagoFilePreview.value = { name: file.name }
  } catch (e) {
    uiStore.showError(e.message, 'Error')
  } finally {
    uploadingPago.value = false
  }
}

// Abrir modal de archivo
const openModal = (url) => {
  filesStore.openFile(url)
}

const formatCurrency = (v, c = 'BOB') => v ? new Intl.NumberFormat('es-BO', { style: 'currency', currency: c }).format(v) : '-'
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('es-BO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-9999 flex items-center justify-center bg-neutral-900/20 backdrop-blur-sm p-4" @click.self="emit('close')">
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-[1200px] max-h-[90vh] border border-border flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-hover shrink-0">
          <div class="flex items-center gap-3">
            <div v-if="venta" class="w-12 h-12 rounded-lg center shrink-0" :class="getVentaEstadoConfig(venta.estado).color">
              <ShoppingCart class="w-6 h-6 text-white" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-semibold text-neutral">Venta #{{ venta?.id || '...' }}</h2>
                <span v-if="venta" class="px-3 py-1 rounded-lg text-xs font-medium text-white" :class="getVentaEstadoConfig(venta.estado).badgeClass">
                  {{ getVentaEstadoConfig(venta.estado).label }}
                </span>
              </div>
              <p v-if="venta" class="text-sm text-secondary mt-0.5">Socio: {{ venta.socioNombres }} {{ venta.socioApellidos }}</p>
            </div>
          </div>
          <button @click="emit('close')" class="w-10 h-10 rounded-lg hover:bg-surface flex items-center justify-center text-secondary hover:text-neutral">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Loading -->
        <div v-if="ventaStore.loadingDetalle" class="p-12 text-center flex-1">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p class="text-secondary">Cargando detalle...</p>
        </div>

        <!-- Content -->
        <div v-else-if="venta" class="flex-1 overflow-y-auto scrollbar-custom">
          <div class="p-4 sm:p-6">
            <!-- Acciones rápidas - Aprobación -->
            <div v-if="puedeAprobar" class="bg-yellow-500 rounded-xl p-4 border border-yellow-600 mb-6">
              <div class="flex items-start gap-3">
                <Clock class="w-5 h-5 text-white shrink-0 mt-0.5" />
                <div class="flex-1">
                  <h4 class="font-semibold text-white">Solicitud pendiente de aprobación</h4>
                  <p class="text-sm text-white/90 mt-1">
                    El socio solicita vender {{ venta.concentrados?.length || venta.lotes?.length || 0 }} 
                    {{ venta.tipoLiquidacion === 'venta_concentrado' ? 'concentrado(s)' : 'lote(s)' }}.
                  </p>
                  <div class="flex gap-3 mt-4">
                    <button @click="aprobar" :disabled="ventaStore.loadingAccion" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 font-medium">
                      <CheckCircle2 class="w-4 h-4" /> Aprobar
                    </button>
                    <button @click="mostrarRechazo = true" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium">
                      <XCircle class="w-4 h-4" /> Rechazar
                    </button>
                  </div>
                </div>
              </div>
              <!-- Rechazo -->
              <div v-if="mostrarRechazo" class="mt-4 p-4 bg-red-600 rounded-lg border border-red-700">
                <textarea v-model="motivoRechazo" rows="2" placeholder="Motivo del rechazo..." class="w-full px-3 py-2 rounded-lg border border-red-700 bg-red-700/50 text-white placeholder-white/60 focus:ring-2 focus:ring-white/30 focus:outline-none resize-none mb-3"></textarea>
                <div class="flex gap-2">
                  <button @click="mostrarRechazo = false" class="bg-white/20 text-white px-4 py-2 rounded-lg text-sm hover:bg-white/30 transition-colors font-medium">Cancelar</button>
                  <button @click="rechazar" :disabled="ventaStore.loadingAccion" class="bg-red-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-900 transition-colors disabled:opacity-50 font-medium">Confirmar Rechazo</button>
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
                  :class="tabActual === tab.id ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-neutral'"
                >
                  <component :is="tab.icon" class="w-4 h-4" /> 
                  {{ tab.label }}
                  <span 
                    v-if="tab.badge" 
                    class="ml-1 px-1.5 py-0.5 rounded-full text-xs"
                    :class="tab.badge === 'Pagado' ? 'bg-green-500/20 text-green-700' : 'bg-orange-500/20 text-orange-700'"
                  >
                    {{ tab.badge }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Tab: General -->
            <VentaTabGeneral v-show="tabActual === 'general'" :venta="venta" />

            <!-- Tab: Reportes -->
            <div v-show="tabActual === 'reportes'" class="space-y-6">
              <!-- Status Cards -->
              <div class="grid md:grid-cols-2 gap-4">
                <!-- Reporte Socio -->
                <div class="bg-surface rounded-xl p-5 border border-border">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 rounded-lg center shrink-0" :class="venta.reporteSocio ? 'bg-green-500' : 'bg-orange-500'">
                      <component :is="venta.reporteSocio ? CheckCircle2 : Clock" class="w-5 h-5 text-white" />
                    </div>
                    <div class="flex-1">
                      <h4 class="font-semibold text-neutral">Reporte Socio</h4>
                      <p class="text-xs text-secondary">{{ venta.reporteSocio ? 'Subido' : 'Pendiente' }}</p>
                    </div>
                  </div>
                  
                  <div v-if="venta.reporteSocio" class="space-y-3">
                    <!-- Laboratorio y Estado -->
                    <div class="pb-3 border-b border-border">
                      <div class="flex justify-between items-start mb-2">
                        <span class="text-xs text-tertiary">Laboratorio:</span>
                        <span class="text-sm font-medium text-neutral">{{ venta.reporteSocio.laboratorio }}</span>
                      </div>
                      <div class="flex justify-between items-start">
                        <span class="text-xs text-tertiary">Estado:</span>
                        <span class="text-xs px-2 py-0.5 rounded-full" :class="venta.reporteSocio.estado === 'validado' ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'">
                          {{ venta.reporteSocio.estado }}
                        </span>
                      </div>
                    </div>

                    <!-- Leyes - Concentrado -->
                    <div v-if="venta.tipoLiquidacion === 'venta_concentrado'" class="space-y-2">
                      <div v-if="venta.reporteSocio.leyMineralPrincipal" class="flex justify-between">
                        <span class="text-xs text-tertiary">Ley Mineral Principal:</span>
                        <span class="text-sm font-bold text-neutral">{{ venta.reporteSocio.leyMineralPrincipal }}%</span>
                      </div>
                      <div v-if="venta.reporteSocio.leyAgGmt" class="flex justify-between">
                        <span class="text-xs text-tertiary">Ag (g/MT):</span>
                        <span class="text-sm font-bold text-neutral">{{ venta.reporteSocio.leyAgGmt }}</span>
                      </div>
                      <div v-if="venta.reporteSocio.porcentajeH2o" class="flex justify-between">
                        <span class="text-xs text-tertiary">H₂O:</span>
                        <span class="text-sm font-bold text-neutral">{{ venta.reporteSocio.porcentajeH2o }}%</span>
                      </div>
                    </div>

                    <!-- Leyes - Lote Complejo -->
                    <div v-else class="space-y-2">
                      <div v-if="venta.reporteSocio.leyAgDm" class="flex justify-between">
                        <span class="text-xs text-tertiary">Ag (DM):</span>
                        <span class="text-sm font-bold text-neutral">{{ venta.reporteSocio.leyAgDm }}</span>
                      </div>
                      <div v-if="venta.reporteSocio.leyPb" class="flex justify-between">
                        <span class="text-xs text-tertiary">Pb:</span>
                        <span class="text-sm font-bold text-neutral">{{ venta.reporteSocio.leyPb }}%</span>
                      </div>
                      <div v-if="venta.reporteSocio.leyZn" class="flex justify-between">
                        <span class="text-xs text-tertiary">Zn:</span>
                        <span class="text-sm font-bold text-neutral">{{ venta.reporteSocio.leyZn }}%</span>
                      </div>
                    </div>

                    <!-- Fechas -->
                    <div v-if="venta.reporteSocio.fechaAnalisis || venta.reporteSocio.fechaRecepcionLaboratorio" class="pt-3 border-t border-border space-y-2">
                      <div class="flex items-center gap-2 text-xs text-tertiary mb-2">
                        <Calendar class="w-3.5 h-3.5" />
                        <span class="font-medium">Fechas del proceso</span>
                      </div>
                      <div v-if="venta.reporteSocio.fechaAnalisis" class="flex justify-between text-xs">
                        <span class="text-tertiary">Análisis:</span>
                        <span class="text-neutral">{{ formatDate(venta.reporteSocio.fechaAnalisis) }}</span>
                      </div>
                      <div v-if="venta.reporteSocio.fechaRecepcionLaboratorio" class="flex justify-between text-xs">
                        <span class="text-tertiary">Recepción Lab:</span>
                        <span class="text-neutral">{{ formatDate(venta.reporteSocio.fechaRecepcionLaboratorio) }}</span>
                      </div>
                      <div v-if="venta.reporteSocio.fechaSalidaLaboratorio" class="flex justify-between text-xs">
                        <span class="text-tertiary">Salida Lab:</span>
                        <span class="text-neutral">{{ formatDate(venta.reporteSocio.fechaSalidaLaboratorio) }}</span>
                      </div>
                    </div>

                    <!-- Observaciones -->
                    <div v-if="venta.reporteSocio.observacionesLaboratorio" class="pt-3 border-t border-border">
                      <p class="text-xs text-tertiary mb-1">Observaciones:</p>
                      <p class="text-xs text-neutral italic">{{ venta.reporteSocio.observacionesLaboratorio }}</p>
                    </div>

                    <!-- PDF -->
<div v-if="venta.reporteSocio.urlPdf" class="pt-3">
  <button
    @click="openModal(venta.reporteSocio.urlPdf)"
    class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium"
  >
    <FileCheck class="w-4 h-4" />
    Ver Reporte PDF
  </button>
</div>
                  </div>

                  <p v-else class="text-sm text-tertiary">Esperando que el socio suba su reporte</p>
                </div>

                <!-- Reporte Comercializadora -->
                <div class="bg-surface rounded-xl p-5 border border-border">
                  <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 rounded-lg center shrink-0" :class="yaSubioReporte ? 'bg-green-500' : 'bg-orange-500'">
                      <component :is="yaSubioReporte ? CheckCircle2 : Clock" class="w-5 h-5 text-white" />
                    </div>
                    <div class="flex-1">
                      <h4 class="font-semibold text-neutral">Tu Reporte</h4>
                      <p class="text-xs text-secondary">{{ yaSubioReporte ? 'Subido' : 'Pendiente' }}</p>
                    </div>
                  </div>
                  
                  <div v-if="venta.reporteComercializadora" class="space-y-3">
                    <!-- Laboratorio y Estado -->
                    <div class="pb-3 border-b border-border">
                      <div class="flex justify-between items-start mb-2">
                        <span class="text-xs text-tertiary">Laboratorio:</span>
                        <span class="text-sm font-medium text-neutral">{{ venta.reporteComercializadora.laboratorio }}</span>
                      </div>
                      <div class="flex justify-between items-start">
                        <span class="text-xs text-tertiary">Estado:</span>
                        <span class="text-xs px-2 py-0.5 rounded-full" :class="venta.reporteComercializadora.estado === 'validado' ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'">
                          {{ venta.reporteComercializadora.estado }}
                        </span>
                      </div>
                    </div>

                    <!-- Leyes - Concentrado -->
                    <div v-if="venta.tipoLiquidacion === 'venta_concentrado'" class="space-y-2">
                      <div v-if="venta.reporteComercializadora.leyMineralPrincipal" class="flex justify-between">
                        <span class="text-xs text-tertiary">Ley Mineral Principal:</span>
                        <span class="text-sm font-bold text-neutral">{{ venta.reporteComercializadora.leyMineralPrincipal }}%</span>
                      </div>
                      <div v-if="venta.reporteComercializadora.leyAgGmt" class="flex justify-between">
                        <span class="text-xs text-tertiary">Ag (g/MT):</span>
                        <span class="text-sm font-bold text-neutral">{{ venta.reporteComercializadora.leyAgGmt }}</span>
                      </div>
                      <div v-if="venta.reporteComercializadora.porcentajeH2o" class="flex justify-between">
                        <span class="text-xs text-tertiary">H₂O:</span>
                        <span class="text-sm font-bold text-neutral">{{ venta.reporteComercializadora.porcentajeH2o }}%</span>
                      </div>
                    </div>

                    <!-- Leyes - Lote Complejo -->
                    <div v-else class="space-y-2">
                      <div v-if="venta.reporteComercializadora.leyAgDm" class="flex justify-between">
                        <span class="text-xs text-tertiary">Ag (DM):</span>
                        <span class="text-sm font-bold text-neutral">{{ venta.reporteComercializadora.leyAgDm }}</span>
                      </div>
                      <div v-if="venta.reporteComercializadora.leyPb" class="flex justify-between">
                        <span class="text-xs text-tertiary">Pb:</span>
                        <span class="text-sm font-bold text-neutral">{{ venta.reporteComercializadora.leyPb }}%</span>
                      </div>
                      <div v-if="venta.reporteComercializadora.leyZn" class="flex justify-between">
                        <span class="text-xs text-tertiary">Zn:</span>
                        <span class="text-sm font-bold text-neutral">{{ venta.reporteComercializadora.leyZn }}%</span>
                      </div>
                    </div>

                    <!-- Fechas -->
                    <div v-if="venta.reporteComercializadora.fechaAnalisis || venta.reporteComercializadora.fechaRecepcionLaboratorio" class="pt-3 border-t border-border space-y-2">
                      <div class="flex items-center gap-2 text-xs text-tertiary mb-2">
                        <Calendar class="w-3.5 h-3.5" />
                        <span class="font-medium">Fechas del proceso</span>
                      </div>
                      <div v-if="venta.reporteComercializadora.fechaAnalisis" class="flex justify-between text-xs">
                        <span class="text-tertiary">Análisis:</span>
                        <span class="text-neutral">{{ formatDate(venta.reporteComercializadora.fechaAnalisis) }}</span>
                      </div>
                      <div v-if="venta.reporteComercializadora.fechaRecepcionLaboratorio" class="flex justify-between text-xs">
                        <span class="text-tertiary">Recepción Lab:</span>
                        <span class="text-neutral">{{ formatDate(venta.reporteComercializadora.fechaRecepcionLaboratorio) }}</span>
                      </div>
                      <div v-if="venta.reporteComercializadora.fechaSalidaLaboratorio" class="flex justify-between text-xs">
                        <span class="text-tertiary">Salida Lab:</span>
                        <span class="text-neutral">{{ formatDate(venta.reporteComercializadora.fechaSalidaLaboratorio) }}</span>
                      </div>
                    </div>

                    <!-- Observaciones -->
                    <div v-if="venta.reporteComercializadora.observacionesLaboratorio" class="pt-3 border-t border-border">
                      <p class="text-xs text-tertiary mb-1">Observaciones:</p>
                      <p class="text-xs text-neutral italic">{{ venta.reporteComercializadora.observacionesLaboratorio }}</p>
                    </div>

                    <!-- PDF -->
<div v-if="venta.reporteComercializadora.urlPdf" class="pt-3">
  <button
    @click="openModal(venta.reporteComercializadora.urlPdf)"
    class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium"
  >
    <FileCheck class="w-4 h-4" />
    Ver Reporte PDF
  </button>
</div>
                  </div>

                  <p v-else class="text-sm text-tertiary">Aún no has subido tu reporte</p>
                </div>
              </div>

<!-- Reporte Acordado -->
<div v-if="venta.reporteAcordado" class="bg-indigo-500/10 rounded-xl p-5 border border-indigo-500/30">
  <div class="flex items-center gap-2 mb-4">
    <Beaker class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
    <h4 class="font-semibold text-indigo-600 dark:text-indigo-400">Reporte Acordado (Promedio)</h4>
    <span class="ml-auto text-xs px-2 py-1 rounded-md bg-indigo-500 text-white font-semibold">
      {{ venta.reporteAcordado.estado }}
    </span>
  </div>
  
  <!-- Concentrado -->
  <div v-if="venta.tipoLiquidacion === 'venta_concentrado'" class="grid sm:grid-cols-3 gap-4">
    <div v-if="venta.reporteAcordado.leyMineralPrincipal" class="bg-surface rounded-lg p-3 border border-border">
      <p class="text-xs text-secondary mb-1">Ley Mineral Principal</p>
      <p class="text-2xl font-bold text-neutral">{{ venta.reporteAcordado.leyMineralPrincipal }}%</p>
    </div>
    <div v-if="venta.reporteAcordado.leyAgGmt" class="bg-surface rounded-lg p-3 border border-border">
      <p class="text-xs text-secondary mb-1">Ag (g/MT)</p>
      <p class="text-2xl font-bold text-neutral">{{ venta.reporteAcordado.leyAgGmt }}</p>
    </div>
    <div v-if="venta.reporteAcordado.porcentajeH2o" class="bg-surface rounded-lg p-3 border border-border">
      <p class="text-xs text-secondary mb-1">H₂O</p>
      <p class="text-2xl font-bold text-neutral">{{ venta.reporteAcordado.porcentajeH2o }}%</p>
    </div>
  </div>
  
  <!-- Lote Complejo -->
  <div v-else class="grid sm:grid-cols-3 gap-4">
    <div v-if="venta.reporteAcordado.leyAgDm" class="bg-surface rounded-lg p-3 border border-border">
      <p class="text-xs text-secondary mb-1">Ag (DM)</p>
      <p class="text-2xl font-bold text-neutral">{{ venta.reporteAcordado.leyAgDm }}</p>
    </div>
    <div v-if="venta.reporteAcordado.leyPb" class="bg-surface rounded-lg p-3 border border-border">
      <p class="text-xs text-secondary mb-1">Pb</p>
      <p class="text-2xl font-bold text-neutral">{{ venta.reporteAcordado.leyPb }}%</p>
    </div>
    <div v-if="venta.reporteAcordado.leyZn" class="bg-surface rounded-lg p-3 border border-border">
      <p class="text-xs text-secondary mb-1">Zn</p>
      <p class="text-2xl font-bold text-neutral">{{ venta.reporteAcordado.leyZn }}%</p>
    </div>
  </div>
</div>

              <!-- Botón para subir reporte -->
              <div v-if="puedeSubirReporte && !mostrarFormReporte">
                <button
                  @click="mostrarFormReporte = true"
                  class="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2 font-medium transition-colors"
                >
                  <Upload class="w-5 h-5" /> Subir Mi Reporte Químico
                </button>
              </div>

              <!-- Formulario Reutilizable -->
              <FormularioReporteQuimico
                v-if="mostrarFormReporte"
                :venta="venta"
                :referencia-id="referenciaId"
                :loading="ventaStore.loadingReporte"
                @submit="subirReporte"
                @cancel="mostrarFormReporte = false"
              />
            </div>

            <!-- Tab: Pago -->
            <div v-show="tabActual === 'pago'" class="space-y-6">
              <div v-if="venta.estado === 'pagado'" class="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <div class="flex items-start gap-3">
                  <CheckCircle2 class="w-6 h-6 text-green-500 shrink-0" />
                  <div>
                    <h3 class="font-semibold text-green-900 dark:text-green-100">Pago Confirmado</h3>
                    <div class="grid sm:grid-cols-2 gap-3 mt-3 text-sm">
                      <div>
                        <p class="text-xs text-green-700 dark:text-green-300">Método</p>
                        <p class="font-medium">{{ venta.metodoPago }}</p>
                      </div>
                      <div>
                        <p class="text-xs text-green-700 dark:text-green-300">Comprobante</p>
                        <p class="font-medium">{{ venta.numeroComprobante }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="puedePagar" class="space-y-4">
                <div class="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                  <h4 class="font-semibold text-purple-900 dark:text-purple-100">Pendiente de Pago</h4>
                  <p class="text-2xl font-bold text-purple-600 mt-2">{{ formatCurrency(venta.valorNetoBob) }}</p>
                  <p class="text-xs text-purple-700 dark:text-purple-300">{{ formatCurrency(venta.valorNetoUsd, 'USD') }}</p>
                </div>

                <button 
                  v-if="!mostrarFormPago" 
                  @click="mostrarFormPago = true" 
                  class="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2 font-medium transition-colors"
                >
                  <CreditCard class="w-5 h-5" /> Confirmar Pago
                </button>

                <div v-if="mostrarFormPago" class="bg-base rounded-xl p-6 border border-border space-y-4">
                  <h3 class="text-lg font-semibold text-neutral">Registrar Pago</h3>
                  <div>
                    <label class="block text-sm font-medium text-neutral mb-1">Método de Pago *</label>
                    <select v-model="pagoForm.metodoPago" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral focus:ring-2 focus:ring-primary focus:outline-none">
                      <option value="">Seleccionar</option>
                      <option value="transferencia_bancaria">Transferencia Bancaria</option>
                      <option value="deposito">Depósito</option>
                      <option value="efectivo">Efectivo</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-neutral mb-1">Nro. Comprobante *</label>
                    <input v-model="pagoForm.numeroComprobante" type="text" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral focus:ring-2 focus:ring-primary focus:outline-none" />
                  </div>
                  <div>
                    <input ref="pagoFileInput" type="file" accept="image/*,application/pdf" @change="handlePagoFile" class="hidden" />
                    <button 
                      v-if="!pagoFilePreview" 
                      @click="pagoFileInput?.click()" 
                      class="w-full py-3 border-2 border-dashed border-border rounded-lg hover:border-primary text-secondary flex items-center justify-center gap-2 transition-colors"
                    >
                      <Upload class="w-5 h-5" /> {{ uploadingPago ? 'Subiendo...' : 'Subir comprobante' }}
                    </button>
                    <div v-else class="border border-green-400 bg-green-50 dark:bg-green-900/30 rounded-lg p-3 flex items-center gap-2">
                      <CheckCircle2 class="w-5 h-5 text-green-600" />
                      <span class="text-sm">{{ pagoFilePreview.name }}</span>
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-neutral mb-1">Observaciones</label>
                    <textarea v-model="pagoForm.observaciones" rows="2" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral focus:ring-2 focus:ring-primary focus:outline-none resize-none"></textarea>
                  </div>
                  <div class="flex gap-3">
                    <button @click="mostrarFormPago = false" class="flex-1 btn-secondary">Cancelar</button>
                    <button @click="confirmarPago" :disabled="ventaStore.loadingPago" class="flex-1 btn disabled:opacity-50">
                      {{ ventaStore.loadingPago ? 'Procesando...' : 'Confirmar Pago' }}
                    </button>
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