<!-- src/components/socio/LoteDetalleTabLiquidacionToll.vue -->
<script setup>
import { ref, computed } from 'vue'
import {
  FileText,
  DollarSign,
  Calendar,
  TrendingUp,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  CreditCard,
  FileCheck
} from 'lucide-vue-next'
import { useLiquidacionTollStore } from '@/stores/socio/liquidacionTollStore'
import { useUIStore } from '@/stores/uiStore'

import { useSessionStore } from '@/stores/sessionStore'
import rutaApi from '@/assets/rutaApi.js'

const props = defineProps({
  liquidacion: {
    type: Object,
    required: true
  },
  esSocio: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['pago-registrado'])

const liquidacionStore = useLiquidacionTollStore()
const uiStore = useUIStore()

const sessionStore = useSessionStore()

// Estado del formulario de pago
const mostrarFormularioPago = ref(false)
const pagoForm = ref({
  metodoPago: '',
  numeroComprobante: '',
  urlComprobante: '',
  observaciones: ''
})

// Estado del upload
const fileInput = ref(null)
const uploadingFile = ref(false)
const uploadProgress = ref(0)
const filePreview = ref(null)

// Computed
const puedeRegistrarPago = computed(() => {
  return props.esSocio && 
         props.liquidacion?.estado === 'esperando_pago'
})

const getEstadoBadge = (estado) => {
  const badges = {
    'pendiente_procesamiento': {
      text: 'Pendiente Procesamiento',
      class: 'bg-yellow-500/10 text-yellow-700 border border-yellow-500/20'
    },
    'esperando_pago': {
      text: 'Esperando Pago',
      class: 'bg-orange-500/10 text-orange-700 border border-orange-500/20'
    },
    'pagado': {
      text: 'Pagado',
      class: 'bg-green-500/10 text-green-700 border border-green-500/20'
    }
  }
  return badges[estado] || { 
    text: estado, 
    class: 'bg-gray-500/10 text-gray-700 border border-gray-500/20' 
  }
}

const formatCurrency = (value, currency = 'BOB') => {
  if (!value) return '-'
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: currency
  }).format(value)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
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

// Métodos del formulario de pago
const toggleFormularioPago = () => {
  mostrarFormularioPago.value = !mostrarFormularioPago.value
  if (!mostrarFormularioPago.value) {
    resetFormulario()
  }
}

const resetFormulario = () => {
  pagoForm.value = {
    metodoPago: '',
    numeroComprobante: '',
    urlComprobante: '',
    observaciones: ''
  }
}

const validarFormulario = () => {
  if (!pagoForm.value.metodoPago.trim()) {
    uiStore.showError('El método de pago es requerido', 'Validación')
    return false
  }
  if (!pagoForm.value.numeroComprobante.trim()) {
    uiStore.showError('El número de comprobante es requerido', 'Validación')
    return false
  }
  if (!pagoForm.value.urlComprobante.trim()) {
    uiStore.showError('La URL del comprobante es requerida', 'Validación')
    return false
  }
  return true
}

const registrarPago = async () => {
  if (!validarFormulario()) return

  const confirmacion = await uiStore.showConfirm(
    '¿Estás seguro de registrar este pago? Una vez registrado, tu concentrado estará listo para la venta.',
    'Confirmar Pago'
  )

  if (!confirmacion) return

  const resultado = await liquidacionStore.registrarPago(
    props.liquidacion.id,
    pagoForm.value
  )

  if (resultado.success) {
    mostrarFormularioPago.value = false
    resetFormulario()
    emit('pago-registrado', resultado.data)
  }
}

// Métodos para upload de archivo con MinIO
const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validar tipo de archivo
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    uiStore.showError('Solo se permiten archivos JPG, PNG o PDF', 'Archivo Inválido')
    event.target.value = ''
    return
  }

  // Validar tamaño (10MB max según el backend)
  if (file.size > 10 * 1024 * 1024) {
    uiStore.showError('El archivo no debe superar los 10MB', 'Archivo muy grande')
    event.target.value = ''
    return
  }

  try {
    uploadingFile.value = true
    uploadProgress.value = 0

    // Crear FormData
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'comprobantes-pago') // Carpeta específica para comprobantes

    // Simular progreso
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 150)
    // Subir archivo al backend MinIO
    const response = await fetch(`${rutaApi}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionStore.token}`
      },
      body: formData
    })

    clearInterval(progressInterval)
    uploadProgress.value = 100

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Error al subir el archivo')
    }

    // Guardar el objectName que devuelve el backend
    pagoForm.value.urlComprobante = data.data.objectName
    
    // Obtener URL de previsualización
    const urlResponse = await fetch(
      `${rutaApi}/files/url?objectName=${encodeURIComponent(data.data.objectName)}`,
      {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`
        }
      }
    )
    
    const urlData = await urlResponse.json()
    if (urlData.success) {
      filePreview.value = {
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData.url,
        objectName: data.data.objectName
      }
    }
    
    uiStore.showSuccess('Comprobante subido exitosamente', 'Upload Exitoso')
    
  } catch (error) {
    console.error('Error al subir comprobante:', error)
    uiStore.showError(
      error.message || 'Error al subir el comprobante', 
      'Error de Upload'
    )
    pagoForm.value.urlComprobante = ''
    filePreview.value = null
    event.target.value = ''
  } finally {
    uploadingFile.value = false
    setTimeout(() => {
      uploadProgress.value = 0
    }, 1000)
  }
}

const removeUploadedFile = async () => {
  if (!pagoForm.value.urlComprobante) return

  try {
    // Eliminar archivo del servidor MinIO
    await fetch(
      `${rutaApi}/files?objectName=${encodeURIComponent(pagoForm.value.urlComprobante)}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`
        }
      }
    )
  } catch (error) {
    console.error('Error al eliminar archivo:', error)
  }

  // Limpiar estado local
  pagoForm.value.urlComprobante = ''
  filePreview.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}



</script>

<template>
  <div class="space-y-6">
    <!-- Header con estado -->
    <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-start gap-3">
          <div class="w-12 h-12 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
            <FileText class="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-neutral mb-1">
              Liquidación de Toll #{{ liquidacion.id }}
            </h3>
            <p class="text-sm text-secondary">
              {{ liquidacion.tipoLiquidacion === 'toll' ? 'Servicio de Procesamiento' : liquidacion.tipoLiquidacion }}
            </p>
          </div>
        </div>
        <span
          class="px-3 py-1.5 rounded-lg text-xs font-medium shrink-0"
          :class="getEstadoBadge(liquidacion.estado).class"
        >
          {{ getEstadoBadge(liquidacion.estado).text }}
        </span>
      </div>
    </div>

    <!-- Resumen Financiero -->
    <div class="grid md:grid-cols-3 gap-4">
      <!-- Costo de Procesamiento -->
      <div class="bg-surface rounded-lg p-4 border border-border">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-blue-500/10 center">
              <DollarSign class="w-4 h-4 text-blue-500" />
            </div>
            <p class="text-xs text-secondary">Procesamiento</p>
          </div>
        </div>
        <p class="text-2xl font-bold text-neutral">
          {{ formatCurrency(liquidacion.costoProcesamientoTotal, 'USD') }}
        </p>
        <p class="text-xs text-tertiary mt-1">
          {{ liquidacion.pesoTotalToneladas }} Ton @ {{ formatCurrency(liquidacion.costoPorTonelada, 'USD') }}/Ton
        </p>
      </div>

      <!-- Servicios Adicionales -->
      <div class="bg-surface rounded-lg p-4 border border-border">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-purple-500/10 center">
              <TrendingUp class="w-4 h-4 text-purple-500" />
            </div>
            <p class="text-xs text-secondary">Servicios Extras</p>
          </div>
        </div>
        <p class="text-2xl font-bold text-neutral">
          {{ formatCurrency(liquidacion.totalServiciosAdicionales, 'USD') }}
        </p>
        <p class="text-xs text-tertiary mt-1">
          {{ formatCurrency(liquidacion.serviciosAdicionales?.total_bob || 0, 'BOB') }}
        </p>
      </div>

      <!-- Total a Pagar -->
      <div class="bg-linear-to-br from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-primary/20 center">
              <DollarSign class="w-4 h-4 text-primary" />
            </div>
            <p class="text-xs text-secondary font-medium">Total a Pagar</p>
          </div>
        </div>
        <p class="text-2xl font-bold text-primary">
          {{ formatCurrency(liquidacion.valorNetoBob, 'BOB') }}
        </p>
        <p class="text-xs text-tertiary mt-1">
          {{ formatCurrency(liquidacion.valorNetoUsd, 'USD') }} @ TC: {{ liquidacion.tipoCambio }}
        </p>
      </div>
    </div>

    <!-- Detalles de Servicios Adicionales -->
    <div 
      v-if="liquidacion.serviciosAdicionales"
      class="bg-base rounded-xl p-4 border border-border shadow-sm"
    >
      <h3 class="text-sm font-semibold text-neutral mb-4 flex items-center gap-2">
        <Package class="w-4 h-4" />
        Desglose de Servicios Adicionales
      </h3>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Uso de Balanza -->
        <div 
          v-if="liquidacion.serviciosAdicionales.uso_balanza"
          class="bg-surface rounded-lg p-3 border border-border"
        >
          <p class="text-xs text-secondary mb-1">Uso de Balanza</p>
          <p class="font-semibold text-neutral">
            {{ formatCurrency(liquidacion.serviciosAdicionales.uso_balanza.costo_total, liquidacion.serviciosAdicionales.uso_balanza.moneda) }}
          </p>
          <p class="text-xs text-tertiary mt-1">
            {{ liquidacion.serviciosAdicionales.uso_balanza.cantidad_camiones }} camiones × 
            {{ formatCurrency(liquidacion.serviciosAdicionales.uso_balanza.costo_unitario, liquidacion.serviciosAdicionales.uso_balanza.moneda) }}
          </p>
        </div>

        <!-- Retroexcavadora Grande -->
        <div 
          v-if="liquidacion.serviciosAdicionales.retroexcavadora_grande"
          class="bg-surface rounded-lg p-3 border border-border"
        >
          <p class="text-xs text-secondary mb-1">Retroexcavadora Grande</p>
          <p class="font-semibold text-neutral">
            {{ formatCurrency(liquidacion.serviciosAdicionales.retroexcavadora_grande.costo_total, liquidacion.serviciosAdicionales.retroexcavadora_grande.moneda) }}
          </p>
          <p class="text-xs text-tertiary mt-1">
            {{ liquidacion.serviciosAdicionales.retroexcavadora_grande.cantidad }} ud. × 
            {{ formatCurrency(liquidacion.serviciosAdicionales.retroexcavadora_grande.costo_unitario, liquidacion.serviciosAdicionales.retroexcavadora_grande.moneda) }}
          </p>
        </div>

        <!-- Retroexcavadora Pequeña -->
        <div 
          v-if="liquidacion.serviciosAdicionales.retroexcavadora_pequena"
          class="bg-surface rounded-lg p-3 border border-border"
        >
          <p class="text-xs text-secondary mb-1">Retroexcavadora Pequeña</p>
          <p class="font-semibold text-neutral">
            {{ formatCurrency(liquidacion.serviciosAdicionales.retroexcavadora_pequena.costo_total, liquidacion.serviciosAdicionales.retroexcavadora_pequena.moneda) }}
          </p>
          <p class="text-xs text-tertiary mt-1">
            {{ liquidacion.serviciosAdicionales.retroexcavadora_pequena.cantidad }} ud. × 
            {{ formatCurrency(liquidacion.serviciosAdicionales.retroexcavadora_pequena.costo_unitario, liquidacion.serviciosAdicionales.retroexcavadora_pequena.moneda) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Lotes Incluidos -->
    <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
      <h3 class="text-sm font-semibold text-neutral mb-4 flex items-center gap-2">
        <Package class="w-4 h-4" />
        Lotes Procesados ({{ liquidacion.totalLotes }})
      </h3>
      <div class="space-y-2">
        <div
          v-for="lote in liquidacion.lotes"
          :key="lote.id"
          class="flex items-center justify-between p-3 bg-surface rounded-lg border border-border"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white font-semibold">
              #{{ lote.id }}
            </div>
            <div>
              <p class="font-medium text-neutral">{{ lote.minaNombre }}</p>
              <p class="text-xs text-secondary capitalize">{{ lote.tipoMineral }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-semibold text-neutral">{{ lote.pesoTotalReal }} Kg</p>
            <p class="text-xs text-tertiary">{{ lote.estado }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Información de Fechas -->
    <div class="grid md:grid-cols-2 gap-4">
      <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <Calendar class="w-4 h-4 text-secondary" />
          <h3 class="text-sm font-medium text-secondary">Fecha de Creación</h3>
        </div>
        <p class="font-medium text-neutral">{{ formatDate(liquidacion.createdAt) }}</p>
      </div>
      <div v-if="liquidacion.fechaPago" class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <CheckCircle2 class="w-4 h-4 text-success" />
          <h3 class="text-sm font-medium text-secondary">Fecha de Pago</h3>
        </div>
        <p class="font-medium text-neutral">{{ formatDate(liquidacion.fechaPago) }}</p>
      </div>
    </div>

    <!-- Información de Pago (si ya está pagado) -->
    <div 
      v-if="liquidacion.estado === 'pagado' && liquidacion.metodoPago"
      class="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 border border-green-200 dark:border-green-800"
    >
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center shrink-0">
          <CheckCircle2 class="w-5 h-5 text-white" />
        </div>
        <div class="flex-1">
          <h3 class="text-sm font-semibold text-green-900 dark:text-green-100 mb-3">
            Pago Registrado Exitosamente
          </h3>
          <div class="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-xs text-green-700 dark:text-green-300">Método de Pago</p>
              <p class="font-medium text-green-900 dark:text-green-100">{{ liquidacion.metodoPago }}</p>
            </div>
            <div>
              <p class="text-xs text-green-700 dark:text-green-300">Número de Comprobante</p>
              <p class="font-medium text-green-900 dark:text-green-100">{{ liquidacion.numeroComprobante }}</p>
            </div>
            <div v-if="liquidacion.urlComprobante" class="sm:col-span-2">
              <p class="text-xs text-green-700 dark:text-green-300 mb-1">Comprobante</p>
              <a 
                :href="liquidacion.urlComprobante" 
                target="_blank"
                class="inline-flex items-center gap-2 text-green-600 dark:text-green-400 hover:underline"
              >
                <FileCheck class="w-4 h-4" />
                Ver comprobante
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Formulario de pago -->
    <div v-if="puedeRegistrarPago" class="space-y-4">
      <!-- Alerta informativa -->
      <div class="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
            <Clock class="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-1">
              Pago Pendiente
            </h3>
            <p class="text-sm text-orange-700 dark:text-orange-300">
              Para que tu concentrado esté listo para la venta, debes registrar el pago del servicio de procesamiento.
            </p>
          </div>
        </div>
      </div>

      <!-- Botón para mostrar formulario -->
      <button
        v-if="!mostrarFormularioPago"
        @click="toggleFormularioPago"
        class="w-full py-3 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-medium"
      >
        <CreditCard class="w-5 h-5" />
        Registrar Pago
      </button>
      <!-- Formulario de pago -->
      <div 
        v-if="mostrarFormularioPago"
        class="bg-base rounded-xl p-6 border border-border shadow-sm space-y-4"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-neutral">Registrar Comprobante de Pago</h3>
          <button
            @click="toggleFormularioPago"
            class="text-secondary hover:text-neutral transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Método de Pago -->
        <div>
          <label class="block text-sm font-medium text-neutral mb-2">
            Método de Pago <span class="text-error">*</span>
          </label>
          <select
            v-model="pagoForm.metodoPago"
            class="w-full px-4 py-2 rounded-lg border border-border bg-surface text-neutral focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Seleccionar método</option>
            <option value="transferencia_bancaria">Transferencia Bancaria</option>
            <option value="deposito">Depósito</option>
            <option value="efectivo">Efectivo</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>
        <!-- Número de Comprobante -->
        <div>
          <label class="block text-sm font-medium text-neutral mb-2">
            Número de Comprobante <span class="text-error">*</span>
          </label>
          <input
            v-model="pagoForm.numeroComprobante"
            type="text"
            placeholder="Ej: 123456789"
            maxlength="100"
            class="w-full px-4 py-2 rounded-lg border border-border bg-surface text-neutral placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <!-- Upload de Comprobante -->
        <div>
          <label class="block text-sm font-medium text-neutral mb-2">
            Comprobante (Imagen/PDF) <span class="text-error">*</span>
          </label>
          
          <!-- Area de upload cuando no hay archivo -->
          <div v-if="!filePreview" class="space-y-2">
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              @change="handleFileUpload"
              class="hidden"
            />
            <button
              type="button"
              @click="fileInput?.click()"
              :disabled="uploadingFile"
              class="w-full py-4 px-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 text-secondary hover:text-primary"
              :class="{ 'opacity-50 cursor-not-allowed': uploadingFile }"
            >

            <Upload class="w-6 h-6" :class="{ 'animate-bounce': uploadingFile }" />
              <span class="text-sm font-medium">
                {{ uploadingFile ? 'Subiendo archivo...' : 'Subir comprobante' }}
              </span>
              
              <!-- Barra de progreso -->
              <div v-if="uploadingFile" class="w-full max-w-xs mt-2">
                <div class="h-1.5 bg-border rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-primary transition-all duration-300"
                    :style="{ width: uploadProgress + '%' }"
                  ></div>
                </div>
                <p class="text-xs text-center text-secondary mt-1">{{ uploadProgress }}%</p>
              </div>
            </button>
            <p class="text-xs text-tertiary text-center">
              Formatos: JPG, PNG, PDF • Tamaño máximo: 10MB
            </p>
          </div>

          <!-- Preview del archivo subido -->
          <div v-else class="border border-green-400/60 bg-green-100/70 dark:border-green-700 dark:bg-green-900/40 rounded-lg p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <div class="w-10 h-10 rounded-lg bg-green-200/50 dark:bg-green-800/50 center shrink-0">
                  <CheckCircle2 class="w-5 h-5 text-green-700 dark:text-green-300" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-green-900 dark:text-green-100 truncate">
                    {{ filePreview.name }}
                  </p>
                  <p class="text-xs text-green-700 dark:text-green-300">
                    {{ formatFileSize(filePreview.size) }}
                  </p>
                  <a 
                    v-if="filePreview.url"
                    :href="filePreview.url" 
                    target="_blank"
                    class="text-xs text-green-600 dark:text-green-400 hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    <FileCheck class="w-3 h-3" />
                    Ver archivo
                  </a>
                </div>
              </div>
              <button
                type="button"
                @click="removeUploadedFile"
                class="w-8 h-8 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 center text-red-600 dark:text-red-400 transition-colors shrink-0"
                title="Eliminar archivo"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        <!-- Observaciones -->
        <div>
          <label class="block text-sm font-medium text-neutral mb-2">
            Observaciones (Opcional)
          </label>
          <textarea
            v-model="pagoForm.observaciones"
            rows="3"
            maxlength="500"
            placeholder="Información adicional sobre el pago..."
            class="w-full px-4 py-2 rounded-lg border border-border bg-surface text-neutral placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          ></textarea>
          <p class="text-xs text-tertiary mt-1">
            {{ pagoForm.observaciones.length }}/500 caracteres
          </p>
        </div>

        <!-- Botones de acción -->
        <div class="flex gap-3 pt-4 border-t border-border">
          <button
            type="button"
            @click="toggleFormularioPago"
            class="flex-1 py-2.5 px-4 border border-border rounded-lg hover:bg-hover transition-colors text-secondary font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="registrarPago"
            :disabled="liquidacionStore.loadingPago || uploadingFile"
            class="flex-1 py-2.5 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
          <CheckCircle2 v-if="!liquidacionStore.loadingPago" class="w-5 h-5" />
            <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {{ liquidacionStore.loadingPago ? 'Registrando...' : 'Confirmar Pago' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Observaciones -->
    <div v-if="liquidacion.observaciones" class="bg-base rounded-xl p-4 border border-border shadow-sm">
      <h3 class="text-sm font-medium text-secondary mb-2">Observaciones</h3>
      <p class="text-sm text-neutral whitespace-pre-wrap">{{ liquidacion.observaciones }}</p>
    </div>
  </div>
</template>