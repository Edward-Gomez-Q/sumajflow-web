<!-- src/components/shared/FormularioReporteQuimico.vue -->
<script setup>
import { ref, computed } from 'vue'
import { useUIStore } from '@/stores/uiStore'
import { useSessionStore } from '@/stores/sessionStore'
import rutaApi from '@/assets/rutaApi.js'
import {
  Upload, CheckCircle2, X, Calendar, Beaker
} from 'lucide-vue-next'

const props = defineProps({
  venta: { type: Object, required: true },
  referenciaId: { type: Number, required: true },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['submit', 'cancel'])

const uiStore = useUIStore()
const sessionStore = useSessionStore()

const fileInput = ref(null)
const uploadingFile = ref(false)
const filePreview = ref(null)

// Detectar tipo de venta
const esVentaConcentrado = computed(() => props.venta.tipoLiquidacion === 'venta_concentrado')
const esVentaLoteComplejo = computed(() => props.venta.tipoLiquidacion === 'venta_lote_complejo')

const form = ref({
  referenciaId: props.referenciaId,
  laboratorio: '',
  
  // Fechas
  fechaEmpaquetado: '',
  fechaRecepcionLaboratorio: '',
  fechaSalidaLaboratorio: '',
  fechaAnalisis: '',
  
  // Leyes - Concentrado (SOLO para venta_concentrado)
  leyMineralPrincipal: null,  // SOLO concentrado
  leyAgGmt: null,              // SOLO concentrado
  porcentajeH2o: null,         // SOLO concentrado
  
  // Leyes - Lote Complejo (SOLO para venta_lote_complejo)
  leyAgDm: null,               // SOLO lote complejo
  leyPb: null,                 // SOLO lote complejo
  leyZn: null,                 // SOLO lote complejo
  
  // Documentación
  urlPdf: '',
  observacionesLaboratorio: ''
})

// Validaciones dinámicas según tipo de venta
const validarFormulario = () => {
  if (!form.value.laboratorio) {
    uiStore.showError('El laboratorio es requerido', 'Validación')
    return false
  }
  
  if (!form.value.fechaAnalisis) {
    uiStore.showError('La fecha de análisis es requerida', 'Validación')
    return false
  }

  if (esVentaConcentrado.value) {
    // VALIDACIONES PARA CONCENTRADO
    if (!form.value.leyMineralPrincipal) {
      uiStore.showError('La ley del mineral principal es requerida para concentrado', 'Validación')
      return false
    }
    if (!form.value.leyAgGmt) {
      uiStore.showError('La ley de Ag (g/MT) es requerida para concentrado', 'Validación')
      return false
    }
    if (!form.value.porcentajeH2o) {
      uiStore.showError('El porcentaje de humedad es requerido para concentrado', 'Validación')
      return false
    }
  } else if (esVentaLoteComplejo.value) {
    // VALIDACIONES PARA LOTE COMPLEJO
    if (!form.value.leyAgDm) {
      uiStore.showError('La ley de Ag (DM) es requerida para lote complejo', 'Validación')
      return false
    }
    if (!form.value.leyPb) {
      uiStore.showError('La ley de Pb es requerida para lote complejo', 'Validación')
      return false
    }
    if (!form.value.leyZn) {
      uiStore.showError('La ley de Zn es requerida para lote complejo', 'Validación')
      return false
    }
  }

  return true
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    uiStore.showError('Solo se permiten archivos JPG, PNG o PDF', 'Archivo Inválido')
    event.target.value = ''
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    uiStore.showError('El archivo no debe superar los 10MB', 'Archivo muy grande')
    event.target.value = ''
    return
  }

  try {
    uploadingFile.value = true
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'reportes-quimicos')

    const response = await fetch(`${rutaApi}/files/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${sessionStore.token}` },
      body: formData
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Error al subir')

    form.value.urlPdf = data.data.objectName
    filePreview.value = { name: file.name, size: file.size }
    uiStore.showSuccess('Archivo subido correctamente', 'OK')
  } catch (err) {
    uiStore.showError(err.message, 'Error')
    form.value.urlPdf = ''
    filePreview.value = null
  } finally {
    uploadingFile.value = false
  }
}

const removeFile = () => {
  form.value.urlPdf = ''
  filePreview.value = null
  if (fileInput.value) fileInput.value.value = ''
}

const submitForm = async () => {
  if (!validarFormulario()) return
  
  const confirmacion = await uiStore.showConfirm(
    '¿Subir reporte químico? Esta información será utilizada para el cálculo de la liquidación.',
    'Confirmar'
  )
  if (!confirmacion) return

  // Preparar payload
  const payload = {
    ...form.value,
    liquidacionId: props.venta.id,  // IMPORTANTE: Enviar liquidacionId
    tipoVenta: props.venta.tipoLiquidacion
  }

  // Para concentrado: agregar datos fijos de empaquetado
  if (esVentaConcentrado.value) {
    payload.numeroSacos = 1
    payload.pesoPorSaco = 5.0
    payload.tipoEmpaque = 'bolsa de plastico'
  }

  emit('submit', payload)
}

const cancelForm = () => {
  emit('cancel')
}
</script>

<template>
  <div class="bg-base rounded-xl p-6 border border-border shadow-sm space-y-4">
    <!-- Título con indicador de tipo -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-neutral">Subir Reporte Químico</h3>
      <span class="px-3 py-1 rounded-lg text-xs font-medium" 
        :class="esVentaConcentrado ? 'bg-indigo-500/20 text-indigo-700' : 'bg-orange-500/20 text-orange-700'">
        {{ esVentaConcentrado ? 'Concentrado' : 'Lote Complejo' }}
      </span>
    </div>


    <!-- Datos Generales -->
    <div class="bg-surface rounded-xl p-4 border border-border">
      <h4 class="text-sm font-semibold text-neutral mb-3 flex items-center gap-2">
        <Beaker class="w-4 h-4" /> Datos del Laboratorio
      </h4>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-neutral mb-1">
            Laboratorio <span class="text-error">*</span>
          </label>
          <input
            v-model="form.laboratorio"
            type="text"
            placeholder="Nombre del laboratorio"
            class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-neutral mb-1">
            Fecha Análisis <span class="text-error">*</span>
          </label>
          <input
            v-model="form.fechaAnalisis"
            type="datetime-local"
            class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
      </div>
    </div>

    <!-- Fechas Detalladas -->
    <div class="bg-surface rounded-xl p-4 border border-border">
      <h4 class="text-sm font-semibold text-neutral mb-3 flex items-center gap-2">
        <Calendar class="w-4 h-4" /> Fechas del Proceso
      </h4>
      <div class="grid md:grid-cols-3 gap-4">
        <div v-if="esVentaConcentrado">
          <label class="block text-sm font-medium text-neutral mb-1">Fecha Empaquetado</label>
          <input
            v-model="form.fechaEmpaquetado"
            type="datetime-local"
            class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-neutral mb-1">Recepción Lab</label>
          <input
            v-model="form.fechaRecepcionLaboratorio"
            type="datetime-local"
            class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-neutral mb-1">Salida Lab</label>
          <input
            v-model="form.fechaSalidaLaboratorio"
            type="datetime-local"
            class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
      </div>
    </div>

    <!-- Leyes del Mineral -->
    <div class="bg-surface rounded-xl p-4 border border-border">
      <h4 class="text-sm font-semibold text-neutral mb-3">Leyes del Mineral</h4>
      
      <!-- CAMPOS PARA CONCENTRADO -->
      <div v-if="esVentaConcentrado" class="space-y-4">
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-neutral mb-1">
              Ley Mineral Principal (%) <span class="text-error">*</span>
            </label>
            <input
              v-model.number="form.leyMineralPrincipal"
              type="number"
              step="0.01"
              placeholder="Ej: 51.00"
              class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <p class="text-xs text-tertiary mt-1">Concentración del mineral principal</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-neutral mb-1">
              H₂O (%) <span class="text-error">*</span>
            </label>
            <input
              v-model.number="form.porcentajeH2o"
              type="number"
              step="0.01"
              placeholder="Ej: 8.50"
              class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <p class="text-xs text-tertiary mt-1">Porcentaje de humedad</p>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-neutral mb-1">
            Ag (g/MT) <span class="text-error">*</span>
          </label>
          <input
            v-model.number="form.leyAgGmt"
            type="number"
            step="0.01"
            placeholder="Ej: 120.50"
            class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <p class="text-xs text-tertiary mt-1">Plata en gramos por tonelada métrica</p>
        </div>
      </div>

      <!-- CAMPOS PARA LOTE COMPLEJO -->
      <div v-else-if="esVentaLoteComplejo" class="space-y-4">
        <div class="grid md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-neutral mb-1">
              Ag (DM) <span class="text-error">*</span>
            </label>
            <input
              v-model.number="form.leyAgDm"
              type="number"
              step="0.01"
              placeholder="Ej: 0.50"
              class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <p class="text-xs text-tertiary mt-1">Plata en decimarcos</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-neutral mb-1">
              Pb (%) <span class="text-error">*</span>
            </label>
            <input
              v-model.number="form.leyPb"
              type="number"
              step="0.01"
              placeholder="Ej: 3.20"
              class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <p class="text-xs text-tertiary mt-1">Porcentaje de plomo</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-neutral mb-1">
              Zn (%) <span class="text-error">*</span>
            </label>
            <input
              v-model.number="form.leyZn"
              type="number"
              step="0.01"
              placeholder="Ej: 1.80"
              class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <p class="text-xs text-tertiary mt-1">Porcentaje de zinc</p>
          </div>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- File upload -->
    <div>
      <label class="block text-sm font-medium text-neutral mb-2">Documento PDF del Reporte</label>
      <div v-if="!filePreview">
        <input
          ref="fileInput"
          type="file"
          accept="image/*,application/pdf"
          @change="handleFileUpload"
          class="hidden"
        />
        <button
          type="button"
          @click="fileInput?.click()"
          :disabled="uploadingFile"
          class="w-full py-3 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center gap-1 text-secondary disabled:opacity-50"
        >
          <Upload class="w-5 h-5" />
          <span class="text-sm">{{ uploadingFile ? 'Subiendo archivo...' : 'Subir documento (PDF, JPG, PNG)' }}</span>
          <span class="text-xs text-tertiary">Máximo 10MB</span>
        </button>
      </div>
      <div v-else class="border border-green-400/60 bg-green-100/70 dark:border-green-700 dark:bg-green-900/40 rounded-lg p-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <CheckCircle2 class="w-5 h-5 text-green-700 dark:text-green-300" />
          <span class="text-sm text-green-900 dark:text-green-100">{{ filePreview.name }}</span>
        </div>
        <button @click="removeFile" class="text-red-500 hover:text-red-700">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Observaciones -->
    <div>
      <label class="block text-sm font-medium text-neutral mb-1">Observaciones del Laboratorio</label>
      <textarea
        v-model="form.observacionesLaboratorio"
        rows="3"
        maxlength="500"
        placeholder="Ej: Muestra recibida en bolsa sellada, sin evidencia de contaminación..."
        class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral focus:ring-2 focus:ring-primary focus:outline-none resize-none"
      ></textarea>
      <p class="text-xs text-tertiary mt-1">{{ form.observacionesLaboratorio?.length || 0 }}/500 caracteres</p>
    </div>

    <!-- Actions -->
    <div class="flex gap-3 pt-2">
      <button
        @click="cancelForm"
        class="flex-1 py-2.5 border border-border rounded-lg hover:bg-hover text-secondary font-medium transition-colors"
      >
        Cancelar
      </button>
      <button
        @click="submitForm"
        :disabled="loading"
        class="flex-1 btn flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <CheckCircle2 v-if="!loading" class="w-5 h-5" />
        <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        {{ loading ? 'Subiendo...' : 'Subir Reporte' }}
      </button>
    </div>
  </div>
</template>