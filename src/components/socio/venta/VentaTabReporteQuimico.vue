<!-- src/components/socio/venta/VentaTabReporteQuimico.vue -->
<!-- COMPONENTE REUTILIZABLE PARA SOCIO Y COMERCIALIZADORA -->
<script setup>
import { ref, computed } from 'vue'
import { useVentaConcentradoStore } from '@/stores/socio/ventaConcentradoStore'
import { useVentaComercializadoraStore } from '@/stores/comercializadora/ventaComercializadoraStore'
import { useFilesStore } from '@/stores/filesStore'
import FormularioReporteQuimico from '@/components/shared/FormularioReporteQuimico.vue'
import {
  Upload, CheckCircle2, AlertCircle, Clock, Beaker, FileCheck, Calendar
} from 'lucide-vue-next'

const props = defineProps({
  venta: { type: Object, required: true },
  tipo: { 
    type: String, 
    required: true,
    validator: (value) => ['socio', 'comercializadora'].includes(value)
  }
})

const emit = defineEmits(['actualizado'])

const ventaSocioStore = useVentaConcentradoStore()
const ventaComercializadoraStore = useVentaComercializadoraStore()
const filesStore = useFilesStore()

const mostrarFormulario = ref(false)

// ==================== COMPUTED - DATOS DE REPORTES ====================

const reportesQuimicos = computed(() => props.venta.reportesQuimicos || {})
const reporteSocio = computed(() => reportesQuimicos.value.reporteSocio)
const reporteComercializadora = computed(() => reportesQuimicos.value.reporteComercializadora)
const reporteAcordado = computed(() => reportesQuimicos.value.reporteAcordado)
const diferencias = computed(() => reportesQuimicos.value.diferencias)

// ==================== COMPUTED - LÓGICA DE ROLES ====================

/**
 * Determina si el usuario actual (según props.tipo) ya subió su reporte
 */
const yaSubioMiReporte = computed(() => {
  if (props.tipo === 'socio') {
    return !!reporteSocio.value
  } else {
    return !!reporteComercializadora.value
  }
})

/**
 * Determina si la contraparte ya subió su reporte
 */
const yaSubioContraparteReporte = computed(() => {
  if (props.tipo === 'socio') {
    return !!reporteComercializadora.value
  } else {
    return !!reporteSocio.value
  }
})

/**
 * Obtiene el reporte del usuario actual
 */
const miReporte = computed(() => {
  return props.tipo === 'socio' ? reporteSocio.value : reporteComercializadora.value
})

/**
 * Obtiene el reporte de la contraparte
 */
const reporteContraparte = computed(() => {
  return props.tipo === 'socio' ? reporteComercializadora.value : reporteSocio.value
})

/**
 * Nombre para mostrar del usuario actual
 */
const miNombre = computed(() => {
  return 'Tu Reporte'
})

/**
 * Nombre para mostrar de la contraparte
 */
const nombreContraparte = computed(() => {
  return props.tipo === 'socio' ? 'Reporte Comercializadora' : 'Reporte Socio'
})

/**
 * Store correcto según el rol
 */
const storeActual = computed(() => {
  return props.tipo === 'socio' ? ventaSocioStore : ventaComercializadoraStore
})

// ==================== COMPUTED - CONTROL DE PERMISOS ====================

const puedeSubir = computed(() => {
  const estadosPermitidos = ['aprobado', 'esperando_reportes']
  return estadosPermitidos.includes(props.venta.estado) && !yaSubioMiReporte.value
})

const referenciaId = computed(() => {
  if (props.venta.tipoLiquidacion === 'venta_concentrado') {
    return props.venta.concentrados?.[0]?.id || null
  } else {
    return props.venta.lotes?.[0]?.id || null
  }
})

// ==================== COMPUTED - RENDERIZADO DINÁMICO DE LEYES ====================

/**
 * Renderiza los campos de leyes según el tipo de venta
 */
const renderizarLeyes = (reporte) => {
  if (!reporte) return []
  
  if (props.venta.tipoLiquidacion === 'venta_concentrado') {
    return [
      { 
        label: 'Ley Mineral Principal', 
        valor: reporte.leyMineralPrincipal, 
        unidad: '%',
        mostrar: !!reporte.leyMineralPrincipal 
      },
      { 
        label: 'Ag (g/MT)', 
        valor: reporte.leyAgGmt, 
        unidad: '',
        mostrar: !!reporte.leyAgGmt 
      },
      { 
        label: 'H₂O', 
        valor: reporte.porcentajeH2o, 
        unidad: '%',
        mostrar: !!reporte.porcentajeH2o 
      }
    ]
  } else {
    // venta_lote_complejo
    return [
      { 
        label: 'Ag (DM)', 
        valor: reporte.leyAgDm, 
        unidad: '',
        mostrar: !!reporte.leyAgDm 
      },
      { 
        label: 'Pb', 
        valor: reporte.leyPb, 
        unidad: '%',
        mostrar: !!reporte.leyPb 
      },
      { 
        label: 'Zn', 
        valor: reporte.leyZn, 
        unidad: '%',
        mostrar: !!reporte.leyZn 
      }
    ]
  }
}

/**
 * Renderiza los campos de leyes acordadas según el tipo de venta
 */
const renderizarLeyesAcordadas = () => {
  if (!reporteAcordado.value) return []
  
  if (props.venta.tipoLiquidacion === 'venta_concentrado') {
    return [
      { 
        label: 'Ley Mineral Principal', 
        valor: reporteAcordado.value.leyMineralPrincipal, 
        unidad: '%',
        mostrar: !!reporteAcordado.value.leyMineralPrincipal 
      },
      { 
        label: 'Ag (g/MT)', 
        valor: reporteAcordado.value.leyAgGmt, 
        unidad: '',
        mostrar: !!reporteAcordado.value.leyAgGmt 
      },
      { 
        label: 'H₂O', 
        valor: reporteAcordado.value.porcentajeH2o, 
        unidad: '%',
        mostrar: !!reporteAcordado.value.porcentajeH2o 
      }
    ]
  } else {
    return [
      { 
        label: 'Ag (DM)', 
        valor: reporteAcordado.value.leyAgDm, 
        unidad: '',
        mostrar: !!reporteAcordado.value.leyAgDm 
      },
      { 
        label: 'Pb', 
        valor: reporteAcordado.value.leyPb, 
        unidad: '%',
        mostrar: !!reporteAcordado.value.leyPb 
      },
      { 
        label: 'Zn', 
        valor: reporteAcordado.value.leyZn, 
        unidad: '%',
        mostrar: !!reporteAcordado.value.leyZn 
      }
    ]
  }
}

// ==================== METHODS ====================

const subirReporte = async (payload) => {
  let resultado
  
  if (props.tipo === 'comercializadora') {
    resultado = await ventaComercializadoraStore.subirReporteQuimico(props.venta.id, payload)
  } else if (props.tipo === 'socio') {
    resultado = await ventaSocioStore.subirReporteQuimico(props.venta.id, payload)
  }
  
  if (resultado.success) {
    mostrarFormulario.value = false
    emit('actualizado')
  }
}

const openModal = (url) => {
  filesStore.openFile(url)
}

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
  <div class="space-y-6">
    <!-- Status de reportes -->
    <div class="grid md:grid-cols-2 gap-4">
      
      <!-- MI REPORTE -->
      <div class="bg-surface rounded-xl p-5 border border-border">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-lg center shrink-0" 
            :class="yaSubioMiReporte ? 'bg-green-500' : 'bg-orange-500'">
            <component :is="yaSubioMiReporte ? CheckCircle2 : Clock" class="w-5 h-5 text-white" />
          </div>
          <div class="flex-1">
            <h4 class="font-semibold text-neutral">{{ miNombre }}</h4>
            <p class="text-xs text-secondary">{{ yaSubioMiReporte ? 'Subido' : 'Pendiente' }}</p>
          </div>
        </div>
        
        <div v-if="miReporte" class="space-y-3">
          <!-- Laboratorio y Estado -->
          <div class="pb-3 border-b border-border">
            <div class="flex justify-between items-start mb-2">
              <span class="text-xs text-tertiary">Laboratorio:</span>
              <span class="text-sm font-medium text-neutral">{{ miReporte.laboratorio }}</span>
            </div>
            <div class="flex justify-between items-start">
              <span class="text-xs text-tertiary">Estado:</span>
              <span class="text-xs px-2 py-0.5 rounded-full" 
                :class="miReporte.estado === 'validado' 
                  ? 'bg-green-500/20 text-green-700' 
                  : 'bg-yellow-500/20 text-yellow-700'">
                {{ miReporte.estado }}
              </span>
            </div>
          </div>

          <!-- Leyes dinámicas según tipo de venta -->
          <div class="space-y-2">
            <div 
              v-for="ley in renderizarLeyes(miReporte)" 
              :key="ley.label"
              v-show="ley.mostrar"
              class="flex justify-between">
              <span class="text-xs text-tertiary">{{ ley.label }}:</span>
              <span class="text-sm font-bold text-neutral">{{ ley.valor }}{{ ley.unidad }}</span>
            </div>
          </div>

          <!-- Fechas -->
          <div v-if="miReporte.fechaAnalisis || miReporte.fechaRecepcionLaboratorio" 
            class="pt-3 border-t border-border space-y-2">
            <div class="flex items-center gap-2 text-xs text-tertiary mb-2">
              <Calendar class="w-3.5 h-3.5" />
              <span class="font-medium">Fechas del proceso</span>
            </div>
            <div v-if="miReporte.fechaAnalisis" class="flex justify-between text-xs">
              <span class="text-tertiary">Análisis:</span>
              <span class="text-neutral">{{ formatDate(miReporte.fechaAnalisis) }}</span>
            </div>
            <div v-if="miReporte.fechaRecepcionLaboratorio" class="flex justify-between text-xs">
              <span class="text-tertiary">Recepción Lab:</span>
              <span class="text-neutral">{{ formatDate(miReporte.fechaRecepcionLaboratorio) }}</span>
            </div>
            <div v-if="miReporte.fechaSalidaLaboratorio" class="flex justify-between text-xs">
              <span class="text-tertiary">Salida Lab:</span>
              <span class="text-neutral">{{ formatDate(miReporte.fechaSalidaLaboratorio) }}</span>
            </div>
            <div v-if="miReporte.fechaEmpaquetado && venta.tipoLiquidacion === 'venta_concentrado'" 
              class="flex justify-between text-xs">
              <span class="text-tertiary">Empaquetado:</span>
              <span class="text-neutral">{{ formatDate(miReporte.fechaEmpaquetado) }}</span>
            </div>
          </div>

          <!-- Observaciones -->
          <div v-if="miReporte.observacionesLaboratorio" class="pt-3 border-t border-border">
            <p class="text-xs text-tertiary mb-1">Observaciones:</p>
            <p class="text-xs text-neutral italic">{{ miReporte.observacionesLaboratorio }}</p>
          </div>

          <!-- PDF -->
          <div v-if="miReporte.urlPdf" class="pt-3">
            <button
              @click="openModal(miReporte.urlPdf)"
              class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium"
            >
              <FileCheck class="w-4 h-4" />
              Ver Reporte PDF
            </button>
          </div>
        </div>

        <p v-else class="text-sm text-tertiary">Aún no has subido tu reporte</p>
      </div>

      <!-- REPORTE CONTRAPARTE -->
      <div class="bg-surface rounded-xl p-5 border border-border">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-lg center shrink-0" 
            :class="yaSubioContraparteReporte ? 'bg-green-500' : 'bg-orange-500'">
            <component :is="yaSubioContraparteReporte ? CheckCircle2 : Clock" class="w-5 h-5 text-white" />
          </div>
          <div class="flex-1">
            <h4 class="font-semibold text-neutral">{{ nombreContraparte }}</h4>
            <p class="text-xs text-secondary">{{ yaSubioContraparteReporte ? 'Subido' : 'Pendiente' }}</p>
          </div>
        </div>
        
        <div v-if="reporteContraparte" class="space-y-3">
          <!-- Laboratorio y Estado -->
          <div class="pb-3 border-b border-border">
            <div class="flex justify-between items-start mb-2">
              <span class="text-xs text-tertiary">Laboratorio:</span>
              <span class="text-sm font-medium text-neutral">{{ reporteContraparte.laboratorio }}</span>
            </div>
            <div class="flex justify-between items-start">
              <span class="text-xs text-tertiary">Estado:</span>
              <span class="text-xs px-2 py-0.5 rounded-full" 
                :class="reporteContraparte.estado === 'validado' 
                  ? 'bg-green-500/20 text-green-700' 
                  : 'bg-yellow-500/20 text-yellow-700'">
                {{ reporteContraparte.estado }}
              </span>
            </div>
          </div>

          <!-- Leyes dinámicas según tipo de venta -->
          <div class="space-y-2">
            <div 
              v-for="ley in renderizarLeyes(reporteContraparte)" 
              :key="ley.label"
              v-show="ley.mostrar"
              class="flex justify-between">
              <span class="text-xs text-tertiary">{{ ley.label }}:</span>
              <span class="text-sm font-bold text-neutral">{{ ley.valor }}{{ ley.unidad }}</span>
            </div>
          </div>

          <!-- Fechas -->
          <div v-if="reporteContraparte.fechaAnalisis || reporteContraparte.fechaRecepcionLaboratorio" 
            class="pt-3 border-t border-border space-y-2">
            <div class="flex items-center gap-2 text-xs text-tertiary mb-2">
              <Calendar class="w-3.5 h-3.5" />
              <span class="font-medium">Fechas del proceso</span>
            </div>
            <div v-if="reporteContraparte.fechaAnalisis" class="flex justify-between text-xs">
              <span class="text-tertiary">Análisis:</span>
              <span class="text-neutral">{{ formatDate(reporteContraparte.fechaAnalisis) }}</span>
            </div>
            <div v-if="reporteContraparte.fechaRecepcionLaboratorio" class="flex justify-between text-xs">
              <span class="text-tertiary">Recepción Lab:</span>
              <span class="text-neutral">{{ formatDate(reporteContraparte.fechaRecepcionLaboratorio) }}</span>
            </div>
            <div v-if="reporteContraparte.fechaSalidaLaboratorio" class="flex justify-between text-xs">
              <span class="text-tertiary">Salida Lab:</span>
              <span class="text-neutral">{{ formatDate(reporteContraparte.fechaSalidaLaboratorio) }}</span>
            </div>
          </div>

          <!-- Observaciones -->
          <div v-if="reporteContraparte.observacionesLaboratorio" class="pt-3 border-t border-border">
            <p class="text-xs text-tertiary mb-1">Observaciones:</p>
            <p class="text-xs text-neutral italic">{{ reporteContraparte.observacionesLaboratorio }}</p>
          </div>

          <!-- PDF -->
          <div v-if="reporteContraparte.urlPdf" class="pt-3">
            <button
              @click="openModal(reporteContraparte.urlPdf)"
              class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium"
            >
              <FileCheck class="w-4 h-4" />
              Ver Reporte PDF
            </button>
          </div>
        </div>

        <p v-else class="text-sm text-tertiary">
          Esperando que {{ tipo === 'socio' ? 'la comercializadora' : 'el socio' }} suba su reporte
        </p>
      </div>
    </div>

    <!-- Reporte Acordado -->
    <div v-if="reporteAcordado" class="bg-indigo-500/10 rounded-xl p-5 border border-indigo-500/30">
      <div class="flex items-center gap-2 mb-4">
        <Beaker class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <h4 class="font-semibold text-indigo-600 dark:text-indigo-400">Reporte Acordado (Promedio)</h4>
        <span class="ml-auto text-xs px-2 py-1 rounded-md bg-indigo-500 text-white font-semibold">
          {{ reporteAcordado.estado || 'Calculado' }}
        </span>
      </div>
      
      <!-- Grid de leyes acordadas dinámicas -->
      <div class="grid sm:grid-cols-3 gap-4">
        <div 
          v-for="ley in renderizarLeyesAcordadas()" 
          :key="ley.label"
          v-show="ley.mostrar"
          class="bg-surface rounded-lg p-3 border border-border">
          <p class="text-xs text-secondary mb-1">{{ ley.label }}</p>
          <p class="text-2xl font-bold text-neutral">{{ ley.valor }}{{ ley.unidad }}</p>
        </div>
      </div>
    </div>

    <!-- Diferencias (si existen) -->
    <div v-if="diferencias && yaSubioMiReporte && yaSubioContraparteReporte" 
      class="bg-surface rounded-xl p-4 border border-border">
      <h4 class="text-sm font-semibold text-neutral mb-3 flex items-center gap-2">
        <AlertCircle class="w-4 h-4" />
        Diferencias entre Reportes
      </h4>
      <div class="space-y-2">
        <div v-if="diferencias.diferenciaLeyPrincipal !== undefined" 
          class="flex justify-between items-center p-2 bg-hover rounded-lg">
          <span class="text-xs text-secondary">Diferencia Ley Principal:</span>
          <span class="text-sm font-medium text-neutral">{{ diferencias.diferenciaLeyPrincipal.toFixed(4) }}%</span>
        </div>
        <div v-if="diferencias.diferenciaLeyAg !== undefined" 
          class="flex justify-between items-center p-2 bg-hover rounded-lg">
          <span class="text-xs text-secondary">Diferencia Ag:</span>
          <span class="text-sm font-medium text-neutral">{{ diferencias.diferenciaLeyAg.toFixed(4) }}</span>
        </div>
        <div v-if="diferencias.diferenciaHumedad !== undefined" 
          class="flex justify-between items-center p-2 bg-hover rounded-lg">
          <span class="text-xs text-secondary">Diferencia Humedad:</span>
          <span class="text-sm font-medium text-neutral">{{ diferencias.diferenciaHumedad.toFixed(2) }}%</span>
        </div>
      </div>
      <div class="mt-3 p-3 rounded-lg" 
        :class="diferencias.requiereRevision 
          ? 'bg-orange-500/10 border border-orange-500/30' 
          : 'bg-green-500/10 border border-green-500/30'">
        <p class="text-sm" 
          :class="diferencias.requiereRevision 
            ? 'text-orange-600 dark:text-orange-400' 
            : 'text-green-600 dark:text-green-400'">
          {{ diferencias.mensaje }}
        </p>
      </div>
    </div>

    <!-- Botón para mostrar formulario -->
    <div v-if="puedeSubir && !mostrarFormulario">
      <button
        @click="mostrarFormulario = true"
        class="w-full py-3 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-medium"
      >
        <Upload class="w-5 h-5" /> Subir Mi Reporte Químico
      </button>
    </div>

    <!-- Formulario Reutilizable -->
    <FormularioReporteQuimico
      v-if="mostrarFormulario"
      :venta="venta"
      :referencia-id="referenciaId"
      :loading="storeActual.loadingReporte"
      @submit="subirReporte"
      @cancel="mostrarFormulario = false"
    />
  </div>
</template>