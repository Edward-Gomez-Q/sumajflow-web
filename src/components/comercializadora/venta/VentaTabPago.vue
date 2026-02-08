<!-- src/components/comercializadora/venta/VentaTabPago.vue -->
<script setup>
import { ref, computed } from 'vue'
import { useVentaComercializadoraStore } from '@/stores/comercializadora/ventaComercializadoraStore'
import { useUIStore } from '@/stores/uiStore'
import { useSessionStore } from '@/stores/sessionStore'
import { useFilesStore } from '@/stores/filesStore'
import rutaApi from '@/assets/rutaApi.js'
import {
  DollarSign, Upload, CheckCircle2, Calendar, FileCheck, CreditCard,
  AlertCircle, Clock, Info
} from 'lucide-vue-next'

const props = defineProps({
  venta: { type: Object, required: true }
})

const emit = defineEmits(['actualizado'])

const ventaStore = useVentaComercializadoraStore()
const uiStore = useUIStore()
const sessionStore = useSessionStore()
const filesStore = useFilesStore()

const mostrarFormPago = ref(false)
const pagoForm = ref({
  metodoPago: '',
  numeroComprobante: '',
  urlComprobante: '',
  observaciones: ''
})

const pagoFileInput = ref(null)
const uploadingPago = ref(false)
const pagoFilePreview = ref(null)

const puedePagar = computed(() => props.venta.estado === 'cerrado')
const yaPagado = computed(() => props.venta.estado === 'pagado')
const resultadoFinal = computed(() => props.venta.resultadoFinal || {})
const pago = computed(() => props.venta.pago || {})

const confirmarPago = async () => {
  if (!pagoForm.value.metodoPago || !pagoForm.value.numeroComprobante) {
    uiStore.showError('Método de pago y comprobante son requeridos', 'Validación')
    return
  }

  const ok = await uiStore.showConfirm(
    `¿Confirmar el pago de ${formatCurrency(resultadoFinal.value.valorNetoBob)}?`,
    'Confirmar Pago'
  )
  if (!ok) return

  const resultado = await ventaStore.confirmarPago(props.venta.id, pagoForm.value)
  if (resultado.success) {
    mostrarFormPago.value = false
    emit('actualizado')
  }
}

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
    uiStore.showError(e.message, 'Error al subir archivo')
  } finally {
    uploadingPago.value = false
  }
}

const openModal = (url) => {
  filesStore.openFile(url)
}

const formatCurrency = (v, c = 'BOB') => {
  if (v === null || v === undefined) return '-'
  return new Intl.NumberFormat('es-BO', { style: 'currency', currency: c }).format(v)
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Estado: Ya Pagado -->
    <div v-if="yaPagado" class="space-y-4">
      <div class="bg-green-500/10 rounded-xl p-5 border border-green-500/30">
        <div class="flex items-start gap-3">
          <div class="w-12 h-12 rounded-lg bg-green-500 center shrink-0">
            <CheckCircle2 class="w-6 h-6 text-white" />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-green-600 dark:text-green-400 mb-1">
              Pago Confirmado
            </h3>
            <p class="text-sm text-secondary">
              El pago de esta liquidación ha sido registrado exitosamente.
            </p>
          </div>
        </div>
      </div>

      <!-- Información del Pago -->
      <div class="bg-surface rounded-xl p-5 border border-border">
        <h4 class="text-sm font-semibold text-neutral mb-4 flex items-center gap-2">
          <Info class="w-4 h-4" />
          Detalles del Pago
        </h4>

        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-secondary mb-1">Monto Pagado</p>
            <p class="text-2xl font-bold text-green-600">
              {{ formatCurrency(resultadoFinal.valorNetoBob) }}
            </p>
            <p class="text-xs text-tertiary mt-1">
              {{ formatCurrency(resultadoFinal.valorNetoUsd, 'USD') }} @ TC: {{ resultadoFinal.tipoCambio }}
            </p>
          </div>

          <div>
            <p class="text-xs text-secondary mb-1">Método de Pago</p>
            <p class="text-lg font-semibold text-neutral capitalize">
              {{ pago.metodoPago?.replace(/_/g, ' ') || '-' }}
            </p>
          </div>

          <div>
            <p class="text-xs text-secondary mb-1">Número de Comprobante</p>
            <p class="text-lg font-semibold text-neutral">
              {{ pago.numeroComprobante || '-' }}
            </p>
          </div>

          <div>
            <p class="text-xs text-secondary mb-1">Fecha de Pago</p>
            <p class="text-lg font-semibold text-neutral">
              {{ formatDate(pago.fechaPago) }}
            </p>
          </div>

          <div v-if="pago.fechaCierre" class="md:col-span-2">
            <p class="text-xs text-secondary mb-1">Fecha de Cierre</p>
            <p class="text-sm text-neutral">
              {{ formatDate(pago.fechaCierre) }}
            </p>
          </div>
        </div>

        <!-- Comprobante -->
        <div v-if="pago.urlComprobante" class="mt-4 pt-4 border-t border-border">
          <p class="text-xs text-secondary mb-2">Comprobante de Pago</p>
          <button
            @click="openModal(pago.urlComprobante)"
            class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors text-sm font-medium"
          >
            <FileCheck class="w-4 h-4" />
            Ver Comprobante
          </button>
        </div>

        <!-- Observaciones del pago -->
        <div v-if="pago.observaciones" class="mt-4 pt-4 border-t border-border">
          <p class="text-xs text-secondary mb-2">Observaciones del Pago</p>
          <p class="text-sm text-neutral whitespace-pre-wrap">{{ pago.observaciones }}</p>
        </div>
      </div>
    </div>

    <!-- Estado: Pendiente de Pago -->
    <div v-if="puedePagar" class="space-y-4">
      <div class="bg-purple-500/10 rounded-xl p-5 border border-purple-500/30">
        <div class="flex items-start gap-3">
          <div class="w-12 h-12 rounded-lg bg-purple-500 center shrink-0">
            <Clock class="w-6 h-6 text-white" />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-1">
              Pendiente de Pago
            </h3>
            <p class="text-sm text-secondary">
              La liquidación ha sido cerrada. Procede a registrar el pago al socio.
            </p>
          </div>
        </div>
      </div>

      <!-- Monto a Pagar -->
      <div class="bg-linear-to-br from-purple-600/20 to-indigo-500/10 rounded-xl p-6 border-2 border-purple-600/30 text-center">
        <p class="text-sm text-secondary mb-2 font-medium">Monto a Pagar</p>
        <p class="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">
          {{ formatCurrency(resultadoFinal.valorNetoBob) }}
        </p>
        <p class="text-lg text-secondary">
          {{ formatCurrency(resultadoFinal.valorNetoUsd, 'USD') }}
        </p>
        <p class="text-xs text-tertiary mt-2">
          Tipo de cambio: {{ resultadoFinal.tipoCambio }}
        </p>
      </div>

      <!-- Botón para mostrar formulario -->
      <div v-if="!mostrarFormPago">
        <button
          @click="mostrarFormPago = true"
          class="w-full py-4 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-semibold text-lg shadow-lg"
        >
          <CreditCard class="w-6 h-6" />
          Registrar Pago
        </button>
      </div>

      <!-- Formulario de Pago -->
      <div v-if="mostrarFormPago" class="bg-surface rounded-xl p-6 border border-border space-y-4">
        <h4 class="text-lg font-semibold text-neutral flex items-center gap-2">
          <CreditCard class="w-5 h-5" />
          Confirmar Pago
        </h4>

        <!-- Método de Pago -->
        <div class="input-group">
          <label class="input-label">Método de Pago *</label>
          <select v-model="pagoForm.metodoPago" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral focus:ring-2 focus:ring-primary focus:outline-none">
            <option value="">Seleccionar método</option>
            <option value="transferencia_bancaria">Transferencia Bancaria</option>
            <option value="deposito">Depósito</option>
            <option value="efectivo">Efectivo</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>

        <!-- Número de Comprobante -->
        <div class="input-group">
          <label class="input-label">Número de Comprobante *</label>
          <input
            v-model="pagoForm.numeroComprobante"
            type="text"
            placeholder="Ej: 1234567890"
            class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral placeholder-tertiary focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        <!-- Upload Comprobante -->
        <div class="input-group">
          <label class="input-label">Comprobante de Pago (Opcional)</label>
          <input
            ref="pagoFileInput"
            type="file"
            accept="image/*,application/pdf"
            @change="handlePagoFile"
            class="hidden"
          />

          <button
            v-if="!pagoFilePreview"
            @click="pagoFileInput?.click()"
            :disabled="uploadingPago"
            class="w-full py-3 border-2 border-dashed border-border rounded-lg hover:border-primary text-secondary flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Upload class="w-5 h-5" />
            {{ uploadingPago ? 'Subiendo archivo...' : 'Subir comprobante (imagen o PDF)' }}
          </button>

          <div v-else class="border-2 border-green-500 bg-green-500/10 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 class="w-6 h-6 text-green-600 shrink-0" />
            <div class="flex-1">
              <p class="text-sm font-medium text-neutral">{{ pagoFilePreview.name }}</p>
              <p class="text-xs text-secondary">Archivo cargado correctamente</p>
            </div>
            <button
              @click="() => { pagoForm.urlComprobante = ''; pagoFilePreview = null }"
              class="text-red-600 hover:text-red-700 text-sm"
            >
              Eliminar
            </button>
          </div>
        </div>

        <!-- Observaciones -->
        <div class="input-group">
          <label class="input-label">Observaciones (Opcional)</label>
          <textarea
            v-model="pagoForm.observaciones"
            rows="3"
            maxlength="500"
            placeholder="Notas adicionales sobre el pago..."
            class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral placeholder-tertiary focus:ring-2 focus:ring-primary focus:outline-none resize-none"
          ></textarea>
          <p class="text-xs text-tertiary mt-1">{{ pagoForm.observaciones.length }}/500</p>
        </div>

        <!-- Botones de Acción -->
        <div class="flex gap-3 pt-4">
          <button
            @click="mostrarFormPago = false"
            class="flex-1 px-4 py-3 bg-surface border border-border text-neutral rounded-lg hover:bg-hover transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            @click="confirmarPago"
            :disabled="ventaStore.loadingPago"
            class="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <div v-if="ventaStore.loadingPago" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <CheckCircle2 v-else class="w-5 h-5" />
            {{ ventaStore.loadingPago ? 'Procesando...' : 'Confirmar Pago' }}
          </button>
        </div>

        <!-- Advertencia -->
        <div class="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30">
          <p class="text-xs text-yellow-600 dark:text-yellow-400 text-center flex items-center justify-center gap-2">
            <AlertCircle class="w-4 h-4" />
            Esta acción no se puede deshacer. Verifica los datos antes de confirmar.
          </p>
        </div>
      </div>
    </div>

    <!-- Estado: Ninguno (no debería pasar, pero por si acaso) -->
    <div v-if="!puedePagar && !yaPagado" class="bg-surface rounded-xl p-5 border border-border text-center">
      <AlertCircle class="w-12 h-12 text-orange-500 mx-auto mb-3" />
      <h4 class="text-lg font-semibold text-neutral mb-2">
        Liquidación no lista para pago
      </h4>
      <p class="text-sm text-secondary">
        Esta liquidación debe estar en estado "Cerrado" para poder registrar el pago.
      </p>
    </div>
  </div>
</template>