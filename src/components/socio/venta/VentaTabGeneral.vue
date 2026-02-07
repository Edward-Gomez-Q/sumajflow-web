<!-- src/components/socio/venta/VentaTabGeneral.vue -->
<script setup>
import {
  PackageCheck, Building2, User, Calendar, DollarSign,
  Scale, CheckCircle2, Clock, FileText, Package, TrendingUp,
  FileCheck
} from 'lucide-vue-next'
import { useFilesStore } from '@/stores/filesStore'

const props = defineProps({
  venta: { type: Object, required: true }
})

const filesStore = useFilesStore()

const formatDate = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('es-BO', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const formatCurrency = (v, c = 'BOB') => {
  if (!v) return '-'
  return new Intl.NumberFormat('es-BO', { style: 'currency', currency: c }).format(v)
}

const formatPeso = (p, decimales = 4) => p ? parseFloat(p).toFixed(decimales) : '0.00'

const totalSacos = () => {
  return props.venta.concentrados?.reduce((sum, c) => sum + (c.numeroSacos || 0), 0) || 0
}

const openModal = (url) => {
  filesStore.openFile(url)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Resumen financiero (si hay datos) -->
    <div v-if="venta.valorBrutoUsd" class="grid md:grid-cols-3 gap-4">
      <div class="bg-surface rounded-lg p-4 border border-border">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg bg-blue-500/10 center">
            <DollarSign class="w-4 h-4 text-blue-500" />
          </div>
          <p class="text-xs text-secondary">Valor Bruto</p>
        </div>
        <p class="text-2xl font-bold text-neutral">{{ formatCurrency(venta.valorBrutoUsd, 'USD') }}</p>
      </div>
      <div class="bg-surface rounded-lg p-4 border border-border">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg bg-red-500/10 center">
            <DollarSign class="w-4 h-4 text-red-500" />
          </div>
          <p class="text-xs text-secondary">Deducciones</p>
        </div>
        <p class="text-2xl font-bold text-neutral">{{ formatCurrency(venta.totalDeduccionesUsd, 'USD') }}</p>
      </div>
      <div class="bg-linear-to-br from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg bg-primary/20 center">
            <DollarSign class="w-4 h-4 text-primary" />
          </div>
          <p class="text-xs text-secondary font-medium">Valor Neto</p>
        </div>
        <p class="text-2xl font-bold text-primary">{{ formatCurrency(venta.valorNetoBob) }}</p>
        <p class="text-xs text-tertiary mt-1">{{ formatCurrency(venta.valorNetoUsd, 'USD') }} @ TC: {{ venta.tipoCambio }}</p>
      </div>
    </div>

    <!-- Header con estado -->
    <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-start gap-3">
          <div class="w-12 h-12 rounded-lg bg-indigo-500 center shrink-0">
            <FileText class="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-neutral mb-1">
              Liquidación #{{ venta.id }}
            </h3>
            <p class="text-sm text-secondary">
              {{ venta.tipoLiquidacion === 'venta_concentrado' ? 'Venta de Concentrado' : 'Venta de Lote Complejo' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Información del Socio y Comercializadora -->
    <div class="grid md:grid-cols-2 gap-4">
      <!-- Socio -->
      <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-full bg-primary center shrink-0">
            <User class="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-secondary mb-1">Socio</h3>
            <p class="font-semibold text-neutral">
              {{ venta.socioNombres }} {{ venta.socioApellidos }}
            </p>
            <p class="text-sm text-secondary mt-1">CI: {{ venta.socioCi }}</p>
          </div>
        </div>
      </div>

      <!-- Comercializadora -->
      <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-full bg-blue-500 center shrink-0">
            <Building2 class="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-secondary mb-1">Comercializadora</h3>
            <p class="font-semibold text-neutral">{{ venta.comercializadoraNombre }}</p>
            <p class="text-sm text-secondary mt-1">NIT: {{ venta.comercializadoraNit }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Resumen de Pesos -->
    <div class="grid md:grid-cols-3 gap-4">
      <div class="bg-surface rounded-lg p-4 border border-border">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg bg-purple-500/10 center">
            <Scale class="w-4 h-4 text-purple-500" />
          </div>
          <p class="text-xs text-secondary">Peso TMH</p>
        </div>
        <p class="text-2xl font-bold text-neutral">{{ formatPeso(venta.pesoTmh) }}</p>
        <p class="text-xs text-tertiary mt-1">Toneladas Métricas Húmedas</p>
      </div>

      <div class="bg-surface rounded-lg p-4 border border-border">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg bg-indigo-500/10 center">
            <Scale class="w-4 h-4 text-indigo-500" />
          </div>
          <p class="text-xs text-secondary">Peso TMS</p>
        </div>
        <p class="text-2xl font-bold text-neutral">{{ formatPeso(venta.pesoTms) }}</p>
        <p class="text-xs text-tertiary mt-1">Toneladas Métricas Secas</p>
      </div>

      <div class="bg-linear-to-br from-indigo-500/10 to-purple-500/10 rounded-lg p-4 border border-indigo-500/20">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg bg-indigo-500/20 center">
            <Scale class="w-4 h-4 text-indigo-600" />
          </div>
          <p class="text-xs text-secondary font-medium">Peso Final TMS</p>
        </div>
        <p class="text-2xl font-bold text-indigo-600">{{ formatPeso(venta.pesoFinalTms) }}</p>
        <p class="text-xs text-tertiary mt-1">Peso final ajustado</p>
      </div>
    </div>

    <!-- Información adicional -->
    <div class="grid md:grid-cols-2 gap-4">
      <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <TrendingUp class="w-4 h-4 text-secondary" />
          <h3 class="text-sm font-medium text-secondary">Mineral Principal</h3>
        </div>
        <p class="font-semibold text-neutral text-lg">{{ venta.mineralPrincipal || '-' }}</p>
      </div>

      <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <DollarSign class="w-4 h-4 text-secondary" />
          <h3 class="text-sm font-medium text-secondary">Moneda</h3>
        </div>
        <p class="font-semibold text-neutral text-lg">{{ venta.moneda || 'BOB' }}</p>
      </div>
    </div>

    <!-- Concentrados -->
    <div v-if="venta.concentrados && venta.concentrados.length > 0" class="bg-base rounded-xl p-4 border border-border shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-neutral flex items-center gap-2">
          <Package class="w-4 h-4" />
          Concentrados ({{ venta.concentrados.length }})
        </h3>
        <div class="text-sm text-secondary">
          Total sacos: <span class="font-semibold text-neutral">{{ totalSacos() }}</span>
        </div>
      </div>
      <div class="space-y-2">
        <div
          v-for="conc in venta.concentrados"
          :key="conc.id"
          class="flex items-center justify-between p-3 bg-surface rounded-lg border border-border"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-indigo-500 center shrink-0">
              <PackageCheck class="w-5 h-5 text-white" />
            </div>
            <div>
              <p class="font-medium text-neutral">{{ conc.codigoConcentrado }}</p>
              <p class="text-xs text-secondary">{{ conc.mineralPrincipal }} • {{ conc.numeroSacos || 0 }} sacos</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-semibold text-neutral">{{ formatPeso(conc.pesoTms || conc.pesoFinal, 2) }} kg</p>
            <p class="text-xs text-tertiary capitalize">{{ conc.estado }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Deducciones -->
    <div v-if="venta.deducciones && venta.deducciones.length > 0" class="bg-base rounded-xl p-4 border border-border shadow-sm">
      <h3 class="text-sm font-semibold text-neutral mb-4">Deducciones</h3>
      <div class="bg-surface rounded-xl border border-border overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-hover">
            <tr>
              <th class="text-left p-3 text-secondary font-medium">Concepto</th>
              <th class="text-right p-3 text-secondary font-medium">%</th>
              <th class="text-right p-3 text-secondary font-medium">USD</th>
              <th class="text-right p-3 text-secondary font-medium">BOB</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(ded, i) in venta.deducciones" :key="i" class="border-t border-border">
              <td class="p-3 text-neutral">{{ ded.nombre }}</td>
              <td class="p-3 text-right text-neutral">{{ ded.porcentaje }}%</td>
              <td class="p-3 text-right text-neutral">{{ formatCurrency(ded.montoUsd, 'USD') }}</td>
              <td class="p-3 text-right text-neutral">{{ formatCurrency(ded.montoBob) }}</td>
            </tr>
          </tbody>
          <tfoot class="bg-hover font-semibold">
            <tr>
              <td class="p-3 text-neutral" colspan="2">Total Deducciones</td>
              <td class="p-3 text-right text-neutral">{{ formatCurrency(venta.totalDeduccionesUsd, 'USD') }}</td>
              <td class="p-3 text-right text-neutral">-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Información de Fechas -->
    <div class="grid md:grid-cols-2 gap-4">
      <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <Calendar class="w-4 h-4 text-secondary" />
          <h3 class="text-sm font-medium text-secondary">Fecha de Creación</h3>
        </div>
        <p class="font-medium text-neutral">{{ formatDate(venta.createdAt) }}</p>
      </div>
      <div v-if="venta.fechaAprobacion" class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <CheckCircle2 class="w-4 h-4 text-success" />
          <h3 class="text-sm font-medium text-secondary">Fecha de Aprobación</h3>
        </div>
        <p class="font-medium text-neutral">{{ formatDate(venta.fechaAprobacion) }}</p>
      </div>
      <div v-if="venta.fechaPago" class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <DollarSign class="w-4 h-4 text-success" />
          <h3 class="text-sm font-medium text-secondary">Fecha de Pago</h3>
        </div>
        <p class="font-medium text-neutral">{{ formatDate(venta.fechaPago) }}</p>
      </div>
    </div>

    <!-- Información de Pago (si ya está pagado) -->
    <div 
      v-if="venta.estado === 'pagado' && venta.metodoPago"
      class="bg-green-500/10 rounded-xl p-4 border border-green-500/30"
    >
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-lg bg-green-500 center shrink-0">
          <CheckCircle2 class="w-5 h-5 text-white" />
        </div>
        <div class="flex-1">
          <h3 class="text-sm font-semibold text-green-600 dark:text-green-400 mb-3">
            Pago Confirmado
          </h3>
          <div class="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-xs text-secondary">Método de Pago</p>
              <p class="font-medium text-neutral">{{ venta.metodoPago }}</p>
            </div>
            <div>
              <p class="text-xs text-secondary">Número de Comprobante</p>
              <p class="font-medium text-neutral">{{ venta.numeroComprobante }}</p>
            </div>
            <div v-if="venta.urlComprobante" class="sm:col-span-2">
              <p class="text-xs text-secondary mb-1">Comprobante</p>
              <button
                @click="openModal(venta.urlComprobante)"
                class="inline-flex items-center gap-2 text-green-600 dark:text-green-400 hover:underline"
              >
                <FileCheck class="w-4 h-4" />
                Ver comprobante
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Observaciones -->
    <div v-if="venta.observaciones" class="bg-base rounded-xl p-4 border border-border shadow-sm">
      <h3 class="text-sm font-medium text-secondary mb-2">Observaciones</h3>
      <p class="text-sm text-neutral whitespace-pre-wrap">{{ venta.observaciones }}</p>
    </div>
  </div>
</template>