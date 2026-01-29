<!-- src/components/ingenio/ConcentradoDetalleTabLiquidacion.vue -->
<script setup>
import { ref, computed } from 'vue'
import { useConcentradosIngenioStore } from '@/stores/ingenio/concentradosIngenioStore'
import {
  DollarSign,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Receipt,
  Calendar
} from 'lucide-vue-next'
import { METODOS_PAGO } from '@/utils/concentradoEstados'

const props = defineProps({
  concentrado: {
    type: Object,
    required: true
  },
  concentradoId: {
    type: Number,
    required: true
  }
})

const concentradosStore = useConcentradosIngenioStore()

const showRevisarModal = ref(false)
const showAprobarModal = ref(false)
const showRegistrarPagoModal = ref(false)

const formularioAprobar = ref({
  costoServicio: '',
  observaciones: '',
  urlDocumentoLiquidacion: ''
})

const formularioPago = ref({
  montoPagado: '',
  fechaPago: '',
  metodoPago: 'transferencia',
  numeroComprobante: '',
  urlComprobante: '',
  observaciones: ''
})

// Estados permitidos
const puedeRevisar = computed(() => {
  return props.concentrado.estado === 'liquidacion_servicio_solicitada'
})

const puedeAprobar = computed(() => {
  return props.concentrado.estado === 'liquidacion_servicio_en_revision'
})

const puedeRegistrarPago = computed(() => {
  return props.concentrado.estado === 'servicio_ingenio_liquidado'
})

const estadoPago = computed(() => {
  return props.concentrado.estado === 'servicio_ingenio_pagado' || 
         props.concentrado.estado === 'listo_para_venta'
})

// Abrir modales
const abrirModalRevisar = () => {
  showRevisarModal.value = true
}

const abrirModalAprobar = () => {
  limpiarFormularioAprobar()
  showAprobarModal.value = true
}

const abrirModalRegistrarPago = () => {
  limpiarFormularioPago()
  showRegistrarPagoModal.value = true
}

// Cerrar modales
const cerrarModalRevisar = () => {
  showRevisarModal.value = false
}

const cerrarModalAprobar = () => {
  showAprobarModal.value = false
  limpiarFormularioAprobar()
}

const cerrarModalRegistrarPago = () => {
  showRegistrarPagoModal.value = false
  limpiarFormularioPago()
}

// Limpiar formularios
const limpiarFormularioAprobar = () => {
  formularioAprobar.value = {
    costoServicio: '',
    observaciones: '',
    urlDocumentoLiquidacion: ''
  }
}

const limpiarFormularioPago = () => {
  const hoy = new Date().toISOString().split('T')[0]
  formularioPago.value = {
    montoPagado: '',
    fechaPago: hoy,
    metodoPago: 'transferencia',
    numeroComprobante: '',
    urlComprobante: '',
    observaciones: ''
  }
}

// Acciones
const revisarLiquidacion = async () => {
  const result = await concentradosStore.revisarLiquidacionServicio(props.concentradoId)
  if (result.success) {
    cerrarModalRevisar()
  }
}

const aprobarLiquidacion = async () => {
  const datos = {
    costoServicio: parseFloat(formularioAprobar.value.costoServicio),
    observaciones: formularioAprobar.value.observaciones || null,
    urlDocumentoLiquidacion: formularioAprobar.value.urlDocumentoLiquidacion || null
  }

  const result = await concentradosStore.aprobarLiquidacionServicio(props.concentradoId, datos)
  if (result.success) {
    cerrarModalAprobar()
  }
}

const registrarPago = async () => {
  const datos = {
    montoPagado: parseFloat(formularioPago.value.montoPagado),
    fechaPago: formularioPago.value.fechaPago,
    metodoPago: formularioPago.value.metodoPago,
    numeroComprobante: formularioPago.value.numeroComprobante || null,
    urlComprobante: formularioPago.value.urlComprobante || null,
    observaciones: formularioPago.value.observaciones || null
  }

  const result = await concentradosStore.registrarPagoServicio(props.concentradoId, datos)
  if (result.success) {
    cerrarModalRegistrarPago()
  }
}

const esFormularioAprobarValido = computed(() => {
  return formularioAprobar.value.costoServicio && 
         parseFloat(formularioAprobar.value.costoServicio) > 0
})

const esFormularioPagoValido = computed(() => {
  return formularioPago.value.montoPagado && 
         parseFloat(formularioPago.value.montoPagado) > 0 &&
         formularioPago.value.fechaPago &&
         formularioPago.value.metodoPago
})

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-BO', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  })
}

const formatMonto = (monto) => {
  if (!monto) return '0.00'
  return parseFloat(monto).toFixed(2)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Estado de la Liquidación -->
    <div 
      class="rounded-xl p-4 border"
      :class="puedeRevisar 
        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
        : puedeAprobar
        ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800'
        : puedeRegistrarPago
        ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'
        : 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'"
    >
      <div class="flex items-start gap-3">
        <component 
          :is="puedeRevisar || puedeAprobar ? Clock : puedeRegistrarPago ? DollarSign : CheckCircle2"
          class="w-6 h-6 shrink-0 mt-0.5"
          :class="puedeRevisar 
            ? 'text-blue-600'
            : puedeAprobar
            ? 'text-yellow-600'
            : puedeRegistrarPago
            ? 'text-orange-600'
            : 'text-green-600'"
        />
        <div class="flex-1">
          <h3 
            class="font-semibold mb-1"
            :class="puedeRevisar 
              ? 'text-blue-900 dark:text-blue-100'
              : puedeAprobar
              ? 'text-yellow-900 dark:text-yellow-100'
              : puedeRegistrarPago
              ? 'text-orange-900 dark:text-orange-100'
              : 'text-green-900 dark:text-green-100'"
          >
            <span v-if="puedeRevisar">Solicitud de Liquidación Pendiente</span>
            <span v-else-if="puedeAprobar">Liquidación en Revisión</span>
            <span v-else-if="puedeRegistrarPago">Liquidación Aprobada - Pendiente de Pago</span>
            <span v-else-if="estadoPago">Servicio Pagado ✓</span>
            <span v-else>Liquidación de Servicio</span>
          </h3>
          <p 
            class="text-sm"
            :class="puedeRevisar 
              ? 'text-blue-700 dark:text-blue-300'
              : puedeAprobar
              ? 'text-yellow-700 dark:text-yellow-300'
              : puedeRegistrarPago
              ? 'text-orange-700 dark:text-orange-300'
              : 'text-green-700 dark:text-green-300'"
          >
            <span v-if="puedeRevisar">
              El socio ha solicitado la liquidación del servicio. Revisa los detalles.
            </span>
            <span v-else-if="puedeAprobar">
              Define el costo del servicio y aprueba la liquidación.
            </span>
            <span v-else-if="puedeRegistrarPago">
              Registra el pago recibido del socio por el servicio de procesamiento.
            </span>
            <span v-else-if="estadoPago">
              El pago del servicio ha sido registrado. El concentrado está listo para venta.
            </span>
          </p>
        </div>
        <button
          v-if="puedeRevisar"
          @click="abrirModalRevisar"
          class="btn bg-blue-600 hover:bg-blue-700 flex items-center gap-2 shrink-0"
        >
          <Clock class="w-4 h-4" />
          Revisar
        </button>
        <button
          v-if="puedeAprobar"
          @click="abrirModalAprobar"
          class="btn bg-green-600 hover:bg-green-700 flex items-center gap-2 shrink-0"
        >
          <CheckCircle2 class="w-4 h-4" />
          Aprobar
        </button>
        <button
          v-if="puedeRegistrarPago"
          @click="abrirModalRegistrarPago"
          class="btn bg-orange-600 hover:bg-orange-700 flex items-center gap-2 shrink-0"
        >
          <Receipt class="w-4 h-4" />
          Registrar Pago
        </button>
      </div>
    </div>

    <!-- Datos de la Liquidación (si existe) -->
    <div v-if="!puedeRevisar && concentrado.estado !== 'listo_para_liquidacion'">
      <h3 class="text-lg font-semibold text-neutral mb-4">Detalles de la Liquidación</h3>
      
      <div class="bg-base rounded-xl border border-border p-6">
        <div class="space-y-6">
          <!-- Info básica -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1">
              <p class="text-sm text-secondary flex items-center gap-2">
                <DollarSign class="w-4 h-4" />
                Costo del Servicio
              </p>
              <p class="text-2xl font-bold text-neutral">
                {{ formatMonto(concentrado.observaciones?.costo_servicio || 0) }} BOB
              </p>
            </div>

            <div class="space-y-1">
              <p class="text-sm text-secondary flex items-center gap-2">
                <Calendar class="w-4 h-4" />
                Fecha de Liquidación
              </p>
              <p class="text-base font-medium text-neutral">
                {{ concentrado.observaciones?.timestamp ? formatDate(concentrado.observaciones.timestamp) : '-' }}
              </p>
            </div>

            <div class="space-y-1">
              <p class="text-sm text-secondary flex items-center gap-2">
                <FileText class="w-4 h-4" />
                Estado de Pago
              </p>
              <p class="text-base font-medium text-neutral">
                <span v-if="estadoPago" class="text-green-600 flex items-center gap-1">
                  <CheckCircle2 class="w-4 h-4" />
                  Pagado
                </span>
                <span v-else class="text-yellow-600 flex items-center gap-1">
                  <Clock class="w-4 h-4" />
                  Pendiente
                </span>
              </p>
            </div>

            <div class="space-y-1">
              <p class="text-sm text-secondary">Peso Liquidado</p>
              <p class="text-base font-medium text-neutral">
                {{ formatMonto(concentrado.pesoInicial) }} kg
              </p>
            </div>
          </div>

          <!-- Observaciones -->
          <div v-if="concentrado.observaciones?.observaciones" class="bg-hover rounded-lg p-4 border border-border">
            <p class="text-sm text-secondary mb-2">Observaciones:</p>
            <p class="text-sm text-neutral">{{ concentrado.observaciones.observaciones }}</p>
          </div>

          <!-- Documento de liquidación -->
          <div v-if="concentrado.observaciones?.url_documento" class="bg-hover rounded-lg p-4 border border-border">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-secondary mb-1">Documento de Liquidación</p>
                <p class="text-sm text-neutral">PDF adjunto</p>
              </div>
              <a 
                :href="concentrado.observaciones.url_documento"
                target="_blank"
                class="btn-outline text-sm"
              >
                Ver Documento
              </a>
            </div>
          </div>

          <!-- Info del pago (si está pagado) -->
          <div v-if="estadoPago" class="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 class="font-semibold text-green-900 dark:text-green-100 mb-3">Detalles del Pago</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-green-600 dark:text-green-400 mb-1">Monto Pagado</p>
                <p class="font-semibold text-green-900 dark:text-green-100">
                  {{ formatMonto(concentrado.observaciones?.monto_pagado || 0) }} BOB
                </p>
              </div>
              <div>
                <p class="text-sm text-green-600 dark:text-green-400 mb-1">Fecha de Pago</p>
                <p class="font-semibold text-green-900 dark:text-green-100">
                  {{ concentrado.observaciones?.fecha_pago ? formatDate(concentrado.observaciones.fecha_pago) : '-' }}
                </p>
              </div>
              <div>
                <p class="text-sm text-green-600 dark:text-green-400 mb-1">Método de Pago</p>
                <p class="font-semibold text-green-900 dark:text-green-100">
                  {{ concentrado.observaciones?.metodo_pago || '-' }}
                </p>
              </div>
              <div v-if="concentrado.observaciones?.numero_comprobante">
                <p class="text-sm text-green-600 dark:text-green-400 mb-1">Nro. Comprobante</p>
                <p class="font-semibold text-green-900 dark:text-green-100">
                  {{ concentrado.observaciones.numero_comprobante }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Revisar -->
    <Teleport to="body">
      <div
        v-if="showRevisarModal"
        class="fixed inset-0 z-9999 flex items-center justify-center bg-neutral-900/20 backdrop-blur-sm p-4"
        @click.self="cerrarModalRevisar"
      >
        <div class="bg-surface rounded-xl shadow-2xl w-full max-w-md border border-border">
          <div class="p-4 border-b border-border">
            <h3 class="text-lg font-semibold text-neutral">Revisar Solicitud</h3>
            <p class="text-sm text-secondary mt-1">Marcar liquidación como "en revisión"</p>
          </div>

          <div class="p-4">
            <div class="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div class="flex items-start gap-2">
                <AlertCircle class="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p class="text-sm text-blue-800 dark:text-blue-200">
                  Se notificará al socio que estás revisando su solicitud de liquidación.
                </p>
              </div>
            </div>
          </div>

          <div class="flex gap-3 p-4 border-t border-border">
            <button @click="cerrarModalRevisar" class="btn-secondary flex-1">
              Cancelar
            </button>
            <button @click="revisarLiquidacion" class="btn flex-1">
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Aprobar Liquidación -->
    <Teleport to="body">
      <div
        v-if="showAprobarModal"
        class="fixed inset-0 z-9999 flex items-center justify-center bg-neutral-900/20 backdrop-blur-sm p-4"
        @click.self="cerrarModalAprobar"
      >
        <div class="bg-surface rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-border">
          <div class="sticky top-0 bg-surface p-4 border-b border-border z-10">
            <h3 class="text-lg font-semibold text-neutral">Aprobar Liquidación</h3>
            <p class="text-sm text-secondary mt-1">Define el costo del servicio</p>
          </div>

          <div class="p-4 space-y-4">
            <div class="input-group">
              <label class="input-label">Costo del Servicio (BOB) *</label>
              <input
                v-model="formularioAprobar.costoServicio"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
            </div>

            <div class="input-group">
              <label class="input-label">Observaciones</label>
              <textarea
                v-model="formularioAprobar.observaciones"
                rows="3"
                placeholder="Detalles adicionales..."
              ></textarea>
            </div>

            <div class="input-group">
              <label class="input-label">URL Documento de Liquidación</label>
              <input
                v-model="formularioAprobar.urlDocumentoLiquidacion"
                type="url"
                placeholder="https://ejemplo.com/liquidacion.pdf"
              />
            </div>
          </div>

          <div class="flex gap-3 p-4 border-t border-border">
            <button @click="cerrarModalAprobar" class="btn-secondary flex-1">
              Cancelar
            </button>
            <button 
              @click="aprobarLiquidacion" 
              :disabled="!esFormularioAprobarValido"
              class="btn flex-1"
            >
              Aprobar
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Registrar Pago -->
    <Teleport to="body">
      <div
        v-if="showRegistrarPagoModal"
        class="fixed inset-0 z-9999 flex items-center justify-center bg-neutral-900/20 backdrop-blur-sm p-4"
        @click.self="cerrarModalRegistrarPago"
      >
        <div class="bg-surface rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-border">
          <div class="sticky top-0 bg-surface p-4 border-b border-border z-10">
            <h3 class="text-lg font-semibold text-neutral">Registrar Pago</h3>
            <p class="text-sm text-secondary mt-1">Confirma el pago recibido del socio</p>
          </div>

          <div class="p-4 space-y-4">
            <div class="input-group">
              <label class="input-label">Monto Pagado (BOB) *</label>
              <input
                v-model="formularioPago.montoPagado"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
            </div>

            <div class="input-group">
              <label class="input-label">Fecha de Pago *</label>
              <input
                v-model="formularioPago.fechaPago"
                type="date"
                required
              />
            </div>

            <div class="input-group">
              <label class="input-label">Método de Pago *</label>
              <select v-model="formularioPago.metodoPago" required>
                <option 
                  v-for="metodo in METODOS_PAGO"
                  :key="metodo.value"
                  :value="metodo.value"
                >
                  {{ metodo.label }}
                </option>
              </select>
            </div>

            <div class="input-group">
              <label class="input-label">Número de Comprobante</label>
              <input
                v-model="formularioPago.numeroComprobante"
                type="text"
                placeholder="Ej: COMP-2025-001"
              />
            </div>

            <div class="input-group">
              <label class="input-label">URL del Comprobante</label>
              <input
                v-model="formularioPago.urlComprobante"
                type="url"
                placeholder="https://ejemplo.com/comprobante.pdf"
              />
            </div>

            <div class="input-group">
              <label class="input-label">Observaciones</label>
              <textarea
                v-model="formularioPago.observaciones"
                rows="3"
                placeholder="Notas adicionales..."
              ></textarea>
            </div>
          </div>

          <div class="flex gap-3 p-4 border-t border-border">
            <button @click="cerrarModalRegistrarPago" class="btn-secondary flex-1">
              Cancelar
            </button>
            <button 
              @click="registrarPago" 
              :disabled="!esFormularioPagoValido"
              class="btn flex-1"
            >
              Registrar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>