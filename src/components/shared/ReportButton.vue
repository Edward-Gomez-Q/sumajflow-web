<!-- src/components/shared/ReportButton.vue -->
<script setup>
import { ref, computed } from 'vue'
import { FileText, Download, FileSpreadsheet, Loader2 } from 'lucide-vue-next'
import { exportarLoteExcel } from '@/utils/reports/loteReportGenerator'
import { exportarLotePDF } from '@/utils/reports/pdfGenerator'
import { useUIStore } from '@/stores/uiStore'

const props = defineProps({
  // Datos del lote
  lote: {
    type: Object,
    required: true
  },
  // Rol del usuario
  rol: {
    type: String,
    default: 'socio',
    validator: (value) => ['socio', 'cooperativa', 'comercializadora', 'ingenio', 'transportista'].includes(value)
  },
  // Tipo de botón: 'excel', 'pdf', 'both'
  tipo: {
    type: String,
    default: 'both',
    validator: (value) => ['excel', 'pdf', 'both'].includes(value)
  },
  // Mostrar como dropdown o botones separados
  variant: {
    type: String,
    default: 'dropdown',
    validator: (value) => ['dropdown', 'buttons'].includes(value)
  },
  // Tamaño del botón
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  // Clase adicional
  class: {
    type: String,
    default: ''
  }
})

const uiStore = useUIStore()
const mostrarOpciones = ref(false)
const generando = ref(false)

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }
  return sizes[props.size]
})

const iconSizeClasses = computed(() => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }
  return sizes[props.size]
})

const puedeGenerarReporte = computed(() => {
  // Solo permitir reportes para lotes completados
  const estadosPermitidos = ['Vendido a comercializadora', 'Procesado']
  return estadosPermitidos.includes(props.lote?.estado)
})

const generarExcel = async () => {
  if (!puedeGenerarReporte.value) {
    uiStore.showWarning('Este lote aún no está completado', 'Reporte no disponible')
    return
  }

  try {
    generando.value = true
    mostrarOpciones.value = false

    await new Promise(resolve => setTimeout(resolve, 300)) // UX delay

    exportarLoteExcel(props.lote, props.rol)
    
    uiStore.showSuccess('Reporte Excel generado exitosamente', 'Descarga Iniciada')
  } catch (error) {
    console.error('Error generando Excel:', error)
    uiStore.showError('No se pudo generar el reporte Excel', 'Error')
  } finally {
    generando.value = false
  }
}

const generarPDF = async () => {
  if (!puedeGenerarReporte.value) {
    uiStore.showWarning('Este lote aún no está completado', 'Reporte no disponible')
    return
  }

  try {
    generando.value = true
    mostrarOpciones.value = false

    await new Promise(resolve => setTimeout(resolve, 300)) // UX delay

    exportarLotePDF(props.lote, props.rol)
    
    uiStore.showSuccess('Reporte PDF generado exitosamente', 'Descarga Iniciada')
  } catch (error) {
    console.error('Error generando PDF:', error)
    uiStore.showError('No se pudo generar el reporte PDF', 'Error')
  } finally {
    generando.value = false
  }
}

const toggleOpciones = () => {
  if (!puedeGenerarReporte.value) {
    uiStore.showWarning(
      'Los reportes consolidados solo están disponibles para lotes completados (Vendido o Procesado)', 
      'Reporte no disponible'
    )
    return
  }
  mostrarOpciones.value = !mostrarOpciones.value
}

// Cerrar dropdown al hacer click fuera
const handleClickOutside = (event) => {
  if (!event.target.closest('.report-button-container')) {
    mostrarOpciones.value = false
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('click', handleClickOutside)
}
</script>

<template>
  <div class="report-button-container relative inline-block" :class="props.class">
    <!-- Variant: Dropdown -->
    <div v-if="variant === 'dropdown'" class="relative">
      <button
        @click.stop="toggleOpciones"
        :disabled="!puedeGenerarReporte || generando"
        class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all"
        :class="[
          sizeClasses,
          puedeGenerarReporte 
            ? 'bg-primary text-white hover:bg-primary/90 active:scale-95' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed',
          generando ? 'opacity-75 cursor-wait' : ''
        ]"
      >
        <Loader2 v-if="generando" :class="iconSizeClasses" class="animate-spin" />
        <FileText v-else :class="iconSizeClasses" />
        <span>{{ generando ? 'Generando...' : 'Reporte Consolidado' }}</span>
        <svg 
          v-if="!generando"
          class="w-4 h-4 transition-transform"
          :class="{ 'rotate-180': mostrarOpciones }"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Dropdown Menu -->
      <Transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="mostrarOpciones && puedeGenerarReporte"
          class="absolute right-0 mt-2 w-56 rounded-lg bg-surface border border-border shadow-lg z-50"
          @click.stop
        >
          <div class="py-1">
            <button
              v-if="tipo === 'excel' || tipo === 'both'"
              @click="generarExcel"
              :disabled="generando"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral hover:bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet class="w-5 h-5 text-green-600" />
              <div class="text-left">
                <div class="font-medium">Exportar a Excel</div>
                <div class="text-xs text-secondary">Archivo .xlsx detallado</div>
              </div>
            </button>

            <button
              v-if="tipo === 'pdf' || tipo === 'both'"
              @click="generarPDF"
              :disabled="generando"
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral hover:bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText class="w-5 h-5 text-red-600" />
              <div class="text-left">
                <div class="font-medium">Exportar a PDF</div>
                <div class="text-xs text-secondary">Documento imprimible</div>
              </div>
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Variant: Buttons -->
    <div v-else class="flex gap-2">
      <button
        v-if="tipo === 'excel' || tipo === 'both'"
        @click="generarExcel"
        :disabled="!puedeGenerarReporte || generando"
        class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all"
        :class="[
          sizeClasses,
          puedeGenerarReporte 
            ? 'bg-green-600 text-white hover:bg-green-700 active:scale-95' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed',
          generando ? 'opacity-75 cursor-wait' : ''
        ]"
      >
        <Loader2 v-if="generando" :class="iconSizeClasses" class="animate-spin" />
        <FileSpreadsheet v-else :class="iconSizeClasses" />
        <span>Excel</span>
      </button>

      <button
        v-if="tipo === 'pdf' || tipo === 'both'"
        @click="generarPDF"
        :disabled="!puedeGenerarReporte || generando"
        class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all"
        :class="[
          sizeClasses,
          puedeGenerarReporte 
            ? 'bg-red-600 text-white hover:bg-red-700 active:scale-95' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed',
          generando ? 'opacity-75 cursor-wait' : ''
        ]"
      >
        <Loader2 v-if="generando" :class="iconSizeClasses" class="animate-spin" />
        <FileText v-else :class="iconSizeClasses" />
        <span>PDF</span>
      </button>
    </div>

    <!-- Tooltip para lotes no completados -->
    <div
      v-if="!puedeGenerarReporte"
      class="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
    >
      Disponible solo para lotes completados
      <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
    </div>
  </div>
</template>

<style scoped>
.report-button-container {
  position: relative;
}
</style>