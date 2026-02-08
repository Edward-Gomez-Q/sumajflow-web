<!-- src/components/comercializadora/ConcentradoDetalleTabLiquidacionesVenta.vue -->
<script setup>
import { useRouter } from 'vue-router'
import {
  FileText,
  Calendar,
  DollarSign,
  Package,
  Building2,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-vue-next'

const props = defineProps({
  liquidaciones: {
    type: Array,
    required: true
  },
  concentradoId: {
    type: Number,
    required: true
  }
})

const router = useRouter()

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

const formatMonto = (monto) => {
  if (!monto) return '0.00'
  return parseFloat(monto).toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const getEstadoConfig = (estado) => {
  const configs = {
    'pendiente_aprobacion': {
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700',
      bgLight: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: Clock,
      label: 'Pendiente Aprobación'
    },
    'aprobado': {
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgLight: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: CheckCircle2,
      label: 'Aprobado'
    },
    'esperando_reportes': {
      color: 'bg-orange-500',
      textColor: 'text-orange-700',
      bgLight: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: Clock,
      label: 'Esperando Reportes'
    },
    'esperando_cierre_venta': {
      color: 'bg-indigo-500',
      textColor: 'text-indigo-700',
      bgLight: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      icon: AlertCircle,
      label: 'Esperando Cierre'
    },
    'cerrado': {
      color: 'bg-purple-500',
      textColor: 'text-purple-700',
      bgLight: 'bg-purple-50',
      borderColor: 'border-purple-200',
      icon: CheckCircle2,
      label: 'Cerrado'
    },
    'pagado': {
      color: 'bg-green-500',
      textColor: 'text-green-700',
      bgLight: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: CheckCircle2,
      label: 'Pagado'
    },
    'rechazado': {
      color: 'bg-red-500',
      textColor: 'text-red-700',
      bgLight: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: XCircle,
      label: 'Rechazado'
    }
  }
  return configs[estado] || configs['pendiente_aprobacion']
}

const verDetalleLiquidacion = (liquidacionId) => {
  router.push({ 
    name: 'ComercializadoraVentas', 
    query: { liquidacionId } 
  })
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-neutral">Liquidaciones de Venta Asociadas</h3>
        <p class="text-sm text-secondary mt-1">
          Este concentrado está incluido en {{ liquidaciones.length }} liquidación(es) de venta
        </p>
      </div>
    </div>

    <!-- Info Box -->
    <div class="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
      <div class="flex items-start gap-3">
        <FileText class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
            Información sobre Liquidaciones
          </p>
          <p class="text-sm text-blue-700 dark:text-blue-300">
            Aquí se muestra un resumen de las liquidaciones de venta. Para ver el detalle completo, 
            cálculos, reportes químicos y gestionar pagos, haz clic en "Ver Detalles" de cada liquidación.
          </p>
        </div>
      </div>
    </div>

    <!-- Lista de Liquidaciones -->
    <div class="space-y-4">
      <div
        v-for="liquidacion in liquidaciones"
        :key="liquidacion.id"
        class="bg-surface rounded-xl border border-border hover:border-primary/50 transition-all"
      >
        <div class="p-5">
          <!-- Header de la Liquidación -->
          <div class="flex items-start justify-between gap-4 mb-4">
            <div class="flex items-start gap-3 flex-1">
              <div 
                class="w-12 h-12 rounded-lg center shrink-0"
                :class="getEstadoConfig(liquidacion.estado).color"
              >
                <FileText class="w-6 h-6 text-white" />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <h4 class="font-semibold text-neutral text-lg">
                    Liquidación #{{ liquidacion.id }}
                  </h4>
                  <span 
                    class="px-2 py-1 rounded-lg text-xs font-medium"
                    :class="[getEstadoConfig(liquidacion.estado).bgLight, getEstadoConfig(liquidacion.estado).textColor, getEstadoConfig(liquidacion.estado).borderColor, 'border']"
                  >
                    {{ getEstadoConfig(liquidacion.estado).label }}
                  </span>
                </div>
                <p class="text-sm text-secondary">
                  Tipo: {{ liquidacion.tipoLiquidacion === 'venta_concentrado' ? 'Venta de Concentrado' : 'Venta de Lote Complejo' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Información Principal -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <!-- Valor Neto -->
            <div class="bg-hover rounded-lg p-3 border border-border">
              <div class="flex items-center gap-2 mb-1">
                <DollarSign class="w-4 h-4 text-primary" />
                <p class="text-xs text-secondary">Valor Neto</p>
              </div>
              <p class="text-lg font-bold text-neutral">
                {{ formatMonto(liquidacion.valorNetoBob) }} BOB
              </p>
              <p class="text-xs text-secondary mt-0.5">
                {{ formatMonto(liquidacion.valorNetoUsd) }} USD
              </p>
            </div>

            <!-- Peso -->
            <div class="bg-hover rounded-lg p-3 border border-border">
              <div class="flex items-center gap-2 mb-1">
                <Package class="w-4 h-4 text-primary" />
                <p class="text-xs text-secondary">Peso</p>
              </div>
              <p class="text-lg font-bold text-neutral">
                {{ formatMonto(liquidacion.pesoFinalTms || liquidacion.pesoTms || liquidacion.pesoTmh) }} TMS
              </p>
            </div>

            <!-- Fecha -->
            <div class="bg-hover rounded-lg p-3 border border-border">
              <div class="flex items-center gap-2 mb-1">
                <Calendar class="w-4 h-4 text-primary" />
                <p class="text-xs text-secondary">Fecha de Creación</p>
              </div>
              <p class="text-sm font-medium text-neutral">
                {{ formatDate(liquidacion.createdAt) }}
              </p>
            </div>
          </div>

          <!-- Información del Socio -->
          <div class="bg-hover rounded-lg p-3 border border-border mb-4">
            <p class="text-xs text-secondary mb-2">Socio Propietario</p>
            <p class="text-sm font-medium text-neutral">
              {{ liquidacion.socioNombres }} {{ liquidacion.socioApellidos }}
            </p>
            <p class="text-xs text-secondary mt-0.5">
              CI: {{ liquidacion.socioCi }}
            </p>
          </div>

          <!-- Fechas Importantes -->
          <div v-if="liquidacion.fechaAprobacion || liquidacion.fechaPago" 
               class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div v-if="liquidacion.fechaAprobacion" class="bg-hover rounded-lg p-3 border border-border">
              <p class="text-xs text-secondary mb-1">Fecha de Aprobación</p>
              <p class="text-sm font-medium text-neutral">
                {{ formatDate(liquidacion.fechaAprobacion) }}
              </p>
            </div>
            <div v-if="liquidacion.fechaPago" class="bg-hover rounded-lg p-3 border border-border">
              <p class="text-xs text-secondary mb-1">Fecha de Pago</p>
              <p class="text-sm font-medium text-neutral">
                {{ formatDate(liquidacion.fechaPago) }}
              </p>
            </div>
          </div>

          <!-- Acción -->
          <div class="pt-3 border-t border-border">
            <button
              @click="verDetalleLiquidacion(liquidacion.id)"
              class="btn flex items-center justify-center gap-2 w-full"
            >
              <ExternalLink class="w-4 h-4" />
              <span>Ver Detalle Completo de Liquidación</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-if="!liquidaciones || liquidaciones.length === 0" class="text-center py-12">
      <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 center mx-auto mb-4">
        <FileText class="w-8 h-8 text-gray-400" />
      </div>
      <h3 class="text-lg font-semibold text-neutral mb-2">
        Sin Liquidaciones
      </h3>
      <p class="text-sm text-secondary">
        Este concentrado aún no tiene liquidaciones de venta asociadas
      </p>
    </div>
  </div>
</template>