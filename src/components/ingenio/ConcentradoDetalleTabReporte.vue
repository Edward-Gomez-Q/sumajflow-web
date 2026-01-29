<!-- src/components/ingenio/ConcentradoDetalleTabReporte.vue -->
<script setup>
import { ref, computed } from 'vue'
import { useConcentradosIngenioStore } from '@/stores/ingenio/concentradosIngenioStore'
import {
  FlaskConical,
  Upload,
  CheckCircle2,
  Calendar,
  Building2,
  FileText,
  AlertCircle
} from 'lucide-vue-next'

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

const showRegistrarModal = ref(false)
const formularioReporte = ref({
  numeroReporte: '',
  laboratorio: '',
  fechaAnalisis: '',
  leyAg: '',
  leyPb: '',
  leyZn: '',
  humedad: '',
  tipoAnalisis: 'completo',
  urlPdf: ''
})

// Estados que permiten registrar reporte
const puedeRegistrarReporte = computed(() => {
  return props.concentrado.estado === 'esperando_reporte_quimico'
})

// Estados que permiten validar reporte
const puedeValidarReporte = computed(() => {
  return props.concentrado.estado === 'reporte_quimico_registrado'
})

const abrirModalRegistrar = () => {
  limpiarFormulario()
  showRegistrarModal.value = true
}

const cerrarModalRegistrar = () => {
  showRegistrarModal.value = false
  limpiarFormulario()
}

const limpiarFormulario = () => {
  formularioReporte.value = {
    numeroReporte: '',
    laboratorio: '',
    fechaAnalisis: '',
    leyAg: '',
    leyPb: '',
    leyZn: '',
    humedad: '',
    tipoAnalisis: 'completo',
    urlPdf: ''
  }
}

const registrarReporte = async () => {
  const datos = {
    numeroReporte: formularioReporte.value.numeroReporte,
    laboratorio: formularioReporte.value.laboratorio,
    fechaAnalisis: formularioReporte.value.fechaAnalisis,
    leyAg: parseFloat(formularioReporte.value.leyAg),
    leyPb: parseFloat(formularioReporte.value.leyPb),
    leyZn: parseFloat(formularioReporte.value.leyZn),
    humedad: parseFloat(formularioReporte.value.humedad),
    tipoAnalisis: formularioReporte.value.tipoAnalisis,
    urlPdf: formularioReporte.value.urlPdf
  }

  const result = await concentradosStore.registrarReporteQuimico(props.concentradoId, datos)

  if (result.success) {
    cerrarModalRegistrar()
  }
}

const validarReporte = async () => {
  await concentradosStore.validarReporteQuimico(props.concentradoId)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-BO', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  })
}

const esFormularioValido = computed(() => {
  return formularioReporte.value.numeroReporte &&
         formularioReporte.value.laboratorio &&
         formularioReporte.value.fechaAnalisis &&
         formularioReporte.value.leyAg &&
         formularioReporte.value.leyPb &&
         formularioReporte.value.leyZn &&
         formularioReporte.value.humedad
})
</script>

<template>
  <div class="space-y-6">
    <!-- Estado del Reporte -->
    <div 
      class="rounded-xl p-4 border"
      :class="puedeRegistrarReporte 
        ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800'
        : puedeValidarReporte
        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
        : 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'"
    >
      <div class="flex items-start gap-3">
        <component 
          :is="puedeRegistrarReporte ? AlertCircle : puedeValidarReporte ? FlaskConical : CheckCircle2"
          class="w-6 h-6 shrink-0 mt-0.5"
          :class="puedeRegistrarReporte 
            ? 'text-yellow-600'
            : puedeValidarReporte
            ? 'text-blue-600'
            : 'text-green-600'"
        />
        <div class="flex-1">
          <h3 
            class="font-semibold mb-1"
            :class="puedeRegistrarReporte 
              ? 'text-yellow-900 dark:text-yellow-100'
              : puedeValidarReporte
              ? 'text-blue-900 dark:text-blue-100'
              : 'text-green-900 dark:text-green-100'"
          >
            <span v-if="puedeRegistrarReporte">Esperando Reporte Químico</span>
            <span v-else-if="puedeValidarReporte">Reporte Registrado - Pendiente Validación</span>
            <span v-else>Reporte Químico Validado</span>
          </h3>
          <p 
            class="text-sm"
            :class="puedeRegistrarReporte 
              ? 'text-yellow-700 dark:text-yellow-300'
              : puedeValidarReporte
              ? 'text-blue-700 dark:text-blue-300'
              : 'text-green-700 dark:text-green-300'"
          >
            <span v-if="puedeRegistrarReporte">
              El procesamiento ha finalizado. Registra el reporte químico del laboratorio.
            </span>
            <span v-else-if="puedeValidarReporte">
              Revisa el reporte químico y valídalo para continuar con la liquidación.
            </span>
            <span v-else>
              El reporte químico ha sido validado. El concentrado está listo para liquidación.
            </span>
          </p>
        </div>
        <button
          v-if="puedeRegistrarReporte"
          @click="abrirModalRegistrar"
          class="btn flex items-center gap-2 shrink-0"
        >
          <Upload class="w-4 h-4" />
          Registrar Reporte
        </button>
        <button
          v-if="puedeValidarReporte"
          @click="validarReporte"
          class="btn bg-green-600 hover:bg-green-700 flex items-center gap-2 shrink-0"
        >
          <CheckCircle2 class="w-4 h-4" />
          Validar Reporte
        </button>
      </div>
    </div>

    <!-- Información del Reporte (si existe) -->
    <div v-if="concentrado.estado !== 'esperando_reporte_quimico'">
      <h3 class="text-lg font-semibold text-neutral mb-4">Datos del Reporte Químico</h3>
      
      <!-- Aquí mostrarías los datos del reporte si los tuvieras en el concentrado -->
      <!-- Por ahora mostramos un placeholder -->
      <div class="bg-base rounded-xl border border-border p-6">
        <div class="space-y-6">
          <!-- Info del Reporte -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1">
              <p class="text-sm text-secondary flex items-center gap-2">
                <FileText class="w-4 h-4" />
                Número de Reporte
              </p>
              <p class="text-base font-medium text-neutral">
                {{ concentrado.observaciones?.numero_reporte || 'Pendiente' }}
              </p>
            </div>

            <div class="space-y-1">
              <p class="text-sm text-secondary flex items-center gap-2">
                <Building2 class="w-4 h-4" />
                Laboratorio
              </p>
              <p class="text-base font-medium text-neutral">
                {{ concentrado.observaciones?.laboratorio || 'Pendiente' }}
              </p>
            </div>

            <div class="space-y-1">
              <p class="text-sm text-secondary flex items-center gap-2">
                <Calendar class="w-4 h-4" />
                Fecha de Análisis
              </p>
              <p class="text-base font-medium text-neutral">
                {{ concentrado.observaciones?.fecha_analisis ? formatDate(concentrado.observaciones.fecha_analisis) : 'Pendiente' }}
              </p>
            </div>

            <div class="space-y-1">
              <p class="text-sm text-secondary flex items-center gap-2">
                <FlaskConical class="w-4 h-4" />
                Tipo de Análisis
              </p>
              <p class="text-base font-medium text-neutral">Completo</p>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Leyes de Minerales -->
          <div>
            <h4 class="font-semibold text-neutral mb-4">Análisis de Leyes</h4>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="bg-hover rounded-xl p-4 border border-border">
                <p class="text-sm text-secondary mb-1">Ley de Plata (Ag)</p>
                <p class="text-2xl font-bold text-neutral">
                  {{ concentrado.observaciones?.ley_ag || '-' }} <span class="text-base font-normal text-secondary">oz/t</span>
                </p>
              </div>

              <div class="bg-hover rounded-xl p-4 border border-border">
                <p class="text-sm text-secondary mb-1">Ley de Plomo (Pb)</p>
                <p class="text-2xl font-bold text-neutral">
                  {{ concentrado.observaciones?.ley_pb || '-' }} <span class="text-base font-normal text-secondary">%</span>
                </p>
              </div>

              <div class="bg-hover rounded-xl p-4 border border-border">
                <p class="text-sm text-secondary mb-1">Ley de Zinc (Zn)</p>
                <p class="text-2xl font-bold text-neutral">
                  {{ concentrado.observaciones?.ley_zn || '-' }} <span class="text-base font-normal text-secondary">%</span>
                </p>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Humedad -->
          <div class="bg-hover rounded-xl p-4 border border-border">
            <p class="text-sm text-secondary mb-1">Humedad</p>
            <p class="text-xl font-bold text-neutral">
              {{ concentrado.observaciones?.humedad || '-' }} <span class="text-base font-normal text-secondary">%</span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para Registrar Reporte -->
    <Teleport to="body">
      <div
        v-if="showRegistrarModal"
        class="fixed inset-0 z-9999 flex items-center justify-center bg-neutral-900/20 backdrop-blur-sm p-4"
        @click.self="cerrarModalRegistrar"
      >
        <div class="bg-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
          <!-- Header -->
          <div class="sticky top-0 bg-surface p-4 border-b border-border z-10">
            <h3 class="text-lg font-semibold text-neutral">Registrar Reporte Químico</h3>
            <p class="text-sm text-secondary mt-1">Ingresa los datos del análisis de laboratorio</p>
          </div>

          <!-- Content -->
          <div class="p-4 space-y-5">
            <!-- Número de Reporte -->
            <div class="input-group">
              <label class="input-label">Número de Reporte *</label>
              <input
                v-model="formularioReporte.numeroReporte"
                type="text"
                placeholder="Ej: LAB-2025-001"
                required
              />
            </div>

            <!-- Laboratorio -->
            <div class="input-group">
              <label class="input-label">Laboratorio *</label>
              <input
                v-model="formularioReporte.laboratorio"
                type="text"
                placeholder="Nombre del laboratorio"
                required
              />
            </div>

            <!-- Fecha de Análisis -->
            <div class="input-group">
              <label class="input-label">Fecha de Análisis *</label>
              <input
                v-model="formularioReporte.fechaAnalisis"
                type="date"
                required
              />
            </div>

            <div class="divider"></div>

            <!-- Leyes -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="input-group">
                <label class="input-label">Ley de Plata (Ag) * <span class="text-xs">(oz/t)</span></label>
                <input
                  v-model="formularioReporte.leyAg"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div class="input-group">
                <label class="input-label">Ley de Plomo (Pb) * <span class="text-xs">(%)</span></label>
                <input
                  v-model="formularioReporte.leyPb"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div class="input-group">
                <label class="input-label">Ley de Zinc (Zn) * <span class="text-xs">(%)</span></label>
                <input
                  v-model="formularioReporte.leyZn"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <!-- Humedad -->
            <div class="input-group">
              <label class="input-label">Humedad * <span class="text-xs">(%)</span></label>
              <input
                v-model="formularioReporte.humedad"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>

            <!-- Tipo de Análisis -->
            <div class="input-group">
              <label class="input-label">Tipo de Análisis *</label>
              <select v-model="formularioReporte.tipoAnalisis" required>
                <option value="completo">Análisis Completo</option>
                <option value="basico">Análisis Básico</option>
                <option value="especial">Análisis Especial</option>
              </select>
            </div>

            <!-- URL del PDF -->
            <div class="input-group">
              <label class="input-label">URL del Documento PDF</label>
              <input
                v-model="formularioReporte.urlPdf"
                type="url"
                placeholder="https://ejemplo.com/reporte.pdf"
              />
              <p class="input-helper">
                URL del reporte en PDF (opcional, puede subirse después)
              </p>
            </div>
          </div>

          <!-- Acciones -->
          <div class="flex gap-3 p-4 border-t border-border">
            <button
              @click="cerrarModalRegistrar"
              class="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              @click="registrarReporte"
              :disabled="!esFormularioValido"
              class="btn flex-1 flex items-center justify-center gap-2"
            >
              <Upload class="w-4 h-4" />
              Registrar Reporte
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>