<!-- src/components/socio/venta/VentaTabReporteQuimico.vue -->
<script setup>
import { ref, computed } from 'vue'
import { useVentaConcentradoStore } from '@/stores/socio/ventaConcentradoStore'
import { useFilesStore } from '@/stores/filesStore'
import FormularioReporteQuimico from '@/components/shared/FormularioReporteQuimico.vue'
import {
  FileText, Upload, CheckCircle2, AlertCircle, Clock, Beaker, FileCheck, Calendar
} from 'lucide-vue-next'

const props = defineProps({
  venta: { type: Object, required: true }
})

const emit = defineEmits(['actualizado'])

const ventaStore = useVentaConcentradoStore()
const filesStore = useFilesStore()

const mostrarFormulario = ref(false)

const reportesQuimicos = computed(() => props.venta.reportesQuimicos || {})
const reporteSocio = computed(() => reportesQuimicos.value.reporteSocio)
const reporteComercializadora = computed(() => reportesQuimicos.value.reporteComercializadora)
const reporteAcordado = computed(() => reportesQuimicos.value.reporteAcordado)
const diferencias = computed(() => reportesQuimicos.value.diferencias)

const yaSubioReporte = computed(() => !!reporteSocio.value)

const referenciaId = computed(() => {
  if (props.venta.tipoLiquidacion === 'venta_concentrado') {
    return props.venta.concentrados?.[0]?.id || null
  } else {
    return props.venta.lotes?.[0]?.id || null
  }
})

const puedeSubir = computed(() =>
  ['aprobado', 'esperando_reportes'].includes(props.venta.estado) && !yaSubioReporte.value
)

const subirReporte = async (payload) => {
  const resultado = await ventaStore.subirReporteQuimico(props.venta.id, payload)
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
      <!-- Reporte Socio -->
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
        
        <div v-if="reporteSocio" class="space-y-3">
          <!-- Laboratorio y Estado -->
          <div class="pb-3 border-b border-border">
            <div class="flex justify-between items-start mb-2">
              <span class="text-xs text-tertiary">Laboratorio:</span>
              <span class="text-sm font-medium text-neutral">{{ reporteSocio.laboratorio }}</span>
            </div>
            <div class="flex justify-between items-start">
              <span class="text-xs text-tertiary">Estado:</span>
              <span class="text-xs px-2 py-0.5 rounded-full" :class="reporteSocio.estado === 'validado' ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'">
                {{ reporteSocio.estado }}
              </span>
            </div>
          </div>

          <!-- Leyes - Concentrado -->
          <div v-if="venta.tipoLiquidacion === 'venta_concentrado'" class="space-y-2">
            <div v-if="reporteSocio.leyMineralPrincipal" class="flex justify-between">
              <span class="text-xs text-tertiary">Ley Mineral Principal:</span>
              <span class="text-sm font-bold text-neutral">{{ reporteSocio.leyMineralPrincipal }}%</span>
            </div>
            <div v-if="reporteSocio.leyAgGmt" class="flex justify-between">
              <span class="text-xs text-tertiary">Ag (g/MT):</span>
              <span class="text-sm font-bold text-neutral">{{ reporteSocio.leyAgGmt }}</span>
            </div>
            <div v-if="reporteSocio.porcentajeH2o" class="flex justify-between">
              <span class="text-xs text-tertiary">H₂O:</span>
              <span class="text-sm font-bold text-neutral">{{ reporteSocio.porcentajeH2o }}%</span>
            </div>
          </div>

          <!-- Leyes - Lote Complejo -->
          <div v-else class="space-y-2">
            <div v-if="reporteSocio.leyAgDm" class="flex justify-between">
              <span class="text-xs text-tertiary">Ag (DM):</span>
              <span class="text-sm font-bold text-neutral">{{ reporteSocio.leyAgDm }}</span>
            </div>
            <div v-if="reporteSocio.leyPb" class="flex justify-between">
              <span class="text-xs text-tertiary">Pb:</span>
              <span class="text-sm font-bold text-neutral">{{ reporteSocio.leyPb }}%</span>
            </div>
            <div v-if="reporteSocio.leyZn" class="flex justify-between">
              <span class="text-xs text-tertiary">Zn:</span>
              <span class="text-sm font-bold text-neutral">{{ reporteSocio.leyZn }}%</span>
            </div>
          </div>

          <!-- Fechas -->
          <div v-if="reporteSocio.fechaAnalisis || reporteSocio.fechaRecepcionLaboratorio" class="pt-3 border-t border-border space-y-2">
            <div class="flex items-center gap-2 text-xs text-tertiary mb-2">
              <Calendar class="w-3.5 h-3.5" />
              <span class="font-medium">Fechas del proceso</span>
            </div>
            <div v-if="reporteSocio.fechaAnalisis" class="flex justify-between text-xs">
              <span class="text-tertiary">Análisis:</span>
              <span class="text-neutral">{{ formatDate(reporteSocio.fechaAnalisis) }}</span>
            </div>
            <div v-if="reporteSocio.fechaRecepcionLaboratorio" class="flex justify-between text-xs">
              <span class="text-tertiary">Recepción Lab:</span>
              <span class="text-neutral">{{ formatDate(reporteSocio.fechaRecepcionLaboratorio) }}</span>
            </div>
            <div v-if="reporteSocio.fechaSalidaLaboratorio" class="flex justify-between text-xs">
              <span class="text-tertiary">Salida Lab:</span>
              <span class="text-neutral">{{ formatDate(reporteSocio.fechaSalidaLaboratorio) }}</span>
            </div>
            <div v-if="reporteSocio.fechaEmpaquetado && venta.tipoLiquidacion === 'venta_concentrado'" class="flex justify-between text-xs">
              <span class="text-tertiary">Empaquetado:</span>
              <span class="text-neutral">{{ formatDate(reporteSocio.fechaEmpaquetado) }}</span>
            </div>
          </div>

          <!-- Observaciones -->
          <div v-if="reporteSocio.observacionesLaboratorio" class="pt-3 border-t border-border">
            <p class="text-xs text-tertiary mb-1">Observaciones:</p>
            <p class="text-xs text-neutral italic">{{ reporteSocio.observacionesLaboratorio }}</p>
          </div>

          <!-- PDF -->
          <div v-if="reporteSocio.urlPdf" class="pt-3">
            <button
              @click="openModal(reporteSocio.urlPdf)"
              class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium"
            >
              <FileCheck class="w-4 h-4" />
              Ver Reporte PDF
            </button>
          </div>
        </div>

        <p v-else class="text-sm text-tertiary">Aún no has subido tu reporte</p>
      </div>

      <!-- Reporte Comercializadora -->
      <div class="bg-surface rounded-xl p-5 border border-border">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-lg center shrink-0" :class="reporteComercializadora ? 'bg-green-500' : 'bg-orange-500'">
            <component :is="reporteComercializadora ? CheckCircle2 : Clock" class="w-5 h-5 text-white" />
          </div>
          <div class="flex-1">
            <h4 class="font-semibold text-neutral">Reporte Comercializadora</h4>
            <p class="text-xs text-secondary">{{ reporteComercializadora ? 'Subido' : 'Pendiente' }}</p>
          </div>
        </div>
        
        <div v-if="reporteComercializadora" class="space-y-3">
          <!-- Laboratorio y Estado -->
          <div class="pb-3 border-b border-border">
            <div class="flex justify-between items-start mb-2">
              <span class="text-xs text-tertiary">Laboratorio:</span>
              <span class="text-sm font-medium text-neutral">{{ reporteComercializadora.laboratorio }}</span>
            </div>
            <div class="flex justify-between items-start">
              <span class="text-xs text-tertiary">Estado:</span>
              <span class="text-xs px-2 py-0.5 rounded-full" :class="reporteComercializadora.estado === 'validado' ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'">
                {{ reporteComercializadora.estado }}
              </span>
            </div>
          </div>

          <!-- Leyes - Concentrado -->
          <div v-if="venta.tipoLiquidacion === 'venta_concentrado'" class="space-y-2">
            <div v-if="reporteComercializadora.leyMineralPrincipal" class="flex justify-between">
              <span class="text-xs text-tertiary">Ley Mineral Principal:</span>
              <span class="text-sm font-bold text-neutral">{{ reporteComercializadora.leyMineralPrincipal }}%</span>
            </div>
            <div v-if="reporteComercializadora.leyAgGmt" class="flex justify-between">
              <span class="text-xs text-tertiary">Ag (g/MT):</span>
              <span class="text-sm font-bold text-neutral">{{ reporteComercializadora.leyAgGmt }}</span>
            </div>
            <div v-if="reporteComercializadora.porcentajeH2o" class="flex justify-between">
              <span class="text-xs text-tertiary">H₂O:</span>
              <span class="text-sm font-bold text-neutral">{{ reporteComercializadora.porcentajeH2o }}%</span>
            </div>
          </div>

          <!-- Leyes - Lote Complejo -->
          <div v-else class="space-y-2">
            <div v-if="reporteComercializadora.leyAgDm" class="flex justify-between">
              <span class="text-xs text-tertiary">Ag (DM):</span>
              <span class="text-sm font-bold text-neutral">{{ reporteComercializadora.leyAgDm }}</span>
            </div>
            <div v-if="reporteComercializadora.leyPb" class="flex justify-between">
              <span class="text-xs text-tertiary">Pb:</span>
              <span class="text-sm font-bold text-neutral">{{ reporteComercializadora.leyPb }}%</span>
            </div>
            <div v-if="reporteComercializadora.leyZn" class="flex justify-between">
              <span class="text-xs text-tertiary">Zn:</span>
              <span class="text-sm font-bold text-neutral">{{ reporteComercializadora.leyZn }}%</span>
            </div>
          </div>

          <!-- Fechas -->
          <div v-if="reporteComercializadora.fechaAnalisis || reporteComercializadora.fechaRecepcionLaboratorio" class="pt-3 border-t border-border space-y-2">
            <div class="flex items-center gap-2 text-xs text-tertiary mb-2">
              <Calendar class="w-3.5 h-3.5" />
              <span class="font-medium">Fechas del proceso</span>
            </div>
            <div v-if="reporteComercializadora.fechaAnalisis" class="flex justify-between text-xs">
              <span class="text-tertiary">Análisis:</span>
              <span class="text-neutral">{{ formatDate(reporteComercializadora.fechaAnalisis) }}</span>
            </div>
            <div v-if="reporteComercializadora.fechaRecepcionLaboratorio" class="flex justify-between text-xs">
              <span class="text-tertiary">Recepción Lab:</span>
              <span class="text-neutral">{{ formatDate(reporteComercializadora.fechaRecepcionLaboratorio) }}</span>
            </div>
            <div v-if="reporteComercializadora.fechaSalidaLaboratorio" class="flex justify-between text-xs">
              <span class="text-tertiary">Salida Lab:</span>
              <span class="text-neutral">{{ formatDate(reporteComercializadora.fechaSalidaLaboratorio) }}</span>
            </div>
          </div>

          <!-- Observaciones -->
          <div v-if="reporteComercializadora.observacionesLaboratorio" class="pt-3 border-t border-border">
            <p class="text-xs text-tertiary mb-1">Observaciones:</p>
            <p class="text-xs text-neutral italic">{{ reporteComercializadora.observacionesLaboratorio }}</p>
          </div>

          <!-- PDF -->
          <div v-if="reporteComercializadora.urlPdf" class="pt-3">
            <button
              @click="openModal(reporteComercializadora.urlPdf)"
              class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium"
            >
              <FileCheck class="w-4 h-4" />
              Ver Reporte PDF
            </button>
          </div>
        </div>

        <p v-else class="text-sm text-tertiary">Esperando que la comercializadora suba su reporte</p>
      </div>
    </div>

    <!-- Reporte Acordado -->
    <div v-if="reporteAcordado" class="bg-indigo-500/10 rounded-xl p-5 border border-indigo-500/30">
      <div class="flex items-center gap-2 mb-4">
        <Beaker class="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <h4 class="font-semibold text-indigo-600 dark:text-indigo-400">Reporte Acordado (Promedio)</h4>
        <span class="ml-auto text-xs px-2 py-1 rounded-md bg-indigo-500 text-white font-semibold">
          {{ reporteAcordado.estado }}
        </span>
      </div>
      
      <!-- Concentrado -->
      <div v-if="venta.tipoLiquidacion === 'venta_concentrado'" class="grid sm:grid-cols-3 gap-4">
        <div v-if="reporteAcordado.leyMineralPrincipal" class="bg-surface rounded-lg p-3 border border-border">
          <p class="text-xs text-secondary mb-1">Ley Mineral Principal</p>
          <p class="text-2xl font-bold text-neutral">{{ reporteAcordado.leyMineralPrincipal }}%</p>
        </div>
        <div v-if="reporteAcordado.leyAgGmt" class="bg-surface rounded-lg p-3 border border-border">
          <p class="text-xs text-secondary mb-1">Ag (g/MT)</p>
          <p class="text-2xl font-bold text-neutral">{{ reporteAcordado.leyAgGmt }}</p>
        </div>
        <div v-if="reporteAcordado.porcentajeH2o" class="bg-surface rounded-lg p-3 border border-border">
          <p class="text-xs text-secondary mb-1">H₂O</p>
          <p class="text-2xl font-bold text-neutral">{{ reporteAcordado.porcentajeH2o }}%</p>
        </div>
      </div>
      
      <!-- Lote Complejo -->
      <div v-else class="grid sm:grid-cols-3 gap-4">
        <div v-if="reporteAcordado.leyAgDm" class="bg-surface rounded-lg p-3 border border-border">
          <p class="text-xs text-secondary mb-1">Ag (DM)</p>
          <p class="text-2xl font-bold text-neutral">{{ reporteAcordado.leyAgDm }}</p>
        </div>
        <div v-if="reporteAcordado.leyPb" class="bg-surface rounded-lg p-3 border border-border">
          <p class="text-xs text-secondary mb-1">Pb</p>
          <p class="text-2xl font-bold text-neutral">{{ reporteAcordado.leyPb }}%</p>
        </div>
        <div v-if="reporteAcordado.leyZn" class="bg-surface rounded-lg p-3 border border-border">
          <p class="text-xs text-secondary mb-1">Zn</p>
          <p class="text-2xl font-bold text-neutral">{{ reporteAcordado.leyZn }}%</p>
        </div>
      </div>
    </div>

    <!-- Diferencias (si existen) -->
    <div v-if="diferencias && reporteSocio && reporteComercializadora" class="bg-surface rounded-xl p-4 border border-border">
      <h4 class="text-sm font-semibold text-neutral mb-3 flex items-center gap-2">
        <AlertCircle class="w-4 h-4" />
        Diferencias entre Reportes
      </h4>
      <div class="space-y-2">
        <div v-if="diferencias.diferenciaLeyPrincipal !== undefined" class="flex justify-between items-center p-2 bg-hover rounded-lg">
          <span class="text-xs text-secondary">Diferencia Ley Principal:</span>
          <span class="text-sm font-medium text-neutral">{{ diferencias.diferenciaLeyPrincipal.toFixed(4) }}%</span>
        </div>
        <div v-if="diferencias.diferenciaLeyAg !== undefined" class="flex justify-between items-center p-2 bg-hover rounded-lg">
          <span class="text-xs text-secondary">Diferencia Ag:</span>
          <span class="text-sm font-medium text-neutral">{{ diferencias.diferenciaLeyAg.toFixed(4) }}</span>
        </div>
        <div v-if="diferencias.diferenciaHumedad !== undefined" class="flex justify-between items-center p-2 bg-hover rounded-lg">
          <span class="text-xs text-secondary">Diferencia Humedad:</span>
          <span class="text-sm font-medium text-neutral">{{ diferencias.diferenciaHumedad.toFixed(2) }}%</span>
        </div>
      </div>
      <div class="mt-3 p-3 rounded-lg" :class="diferencias.requiereRevision ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-green-500/10 border border-green-500/30'">
        <p class="text-sm" :class="diferencias.requiereRevision ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'">
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
      :loading="ventaStore.loadingReporte"
      @submit="subirReporte"
      @cancel="mostrarFormulario = false"
    />
  </div>
</template>