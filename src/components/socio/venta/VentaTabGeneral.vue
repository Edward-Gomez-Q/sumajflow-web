<!-- src/components/socio/venta/VentaTabGeneral.vue -->
<script setup>
import {
  PackageCheck, Building2, User, Calendar, DollarSign,
  Scale, CheckCircle2, Clock, FileText, Package, TrendingUp,
  FileCheck, Layers, Droplet, Mountain, AlertCircle
} from 'lucide-vue-next'
import { useFilesStore } from '@/stores/filesStore'
import { computed } from 'vue'

const props = defineProps({
  venta: { type: Object, required: true }
})

const filesStore = useFilesStore()

const esLoteComplejo = computed(() => props.venta.tipoLiquidacion === 'venta_lote_complejo')

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

const totalLotes = computed(() => props.venta.lotes?.length || 0)

const pesoTotalLotes = computed(() => {
  return props.venta.lotes?.reduce((sum, l) => sum + (l.pesoTotalReal || 0), 0) || 0
})

const openModal = (url) => {
  filesStore.openFile(url)
}

const tieneInformacionFinanciera = computed(() => {
  return props.venta.valorBrutoUsd || props.venta.valorNetoUsd || props.venta.valorNetoBob
})

const tieneInformacionPesos = computed(() => {
  return props.venta.pesoTms || props.venta.pesoFinalTms
})
</script>

<template>
  <div class="space-y-6">
    <!-- Resumen financiero (solo si hay datos) -->
    <div v-if="tieneInformacionFinanciera" class="grid md:grid-cols-3 gap-4">
      <div class="bg-surface rounded-lg p-4 border border-border">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg bg-blue-500/10 center">
            <DollarSign class="w-4 h-4 text-blue-500" />
          </div>
          <p class="text-xs text-secondary">Valor Bruto</p>
        </div>
        <p class="text-2xl font-bold text-neutral">
          {{ venta.valorBrutoUsd ? formatCurrency(venta.valorBrutoUsd, 'USD') : 'Pendiente' }}
        </p>
      </div>
      <div class="bg-surface rounded-lg p-4 border border-border">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg bg-red-500/10 center">
            <DollarSign class="w-4 h-4 text-red-500" />
          </div>
          <p class="text-xs text-secondary">Deducciones</p>
        </div>
        <p class="text-2xl font-bold text-neutral">
          {{ venta.totalDeduccionesUsd ? formatCurrency(venta.totalDeduccionesUsd, 'USD') : 'Pendiente' }}
        </p>
      </div>
      <div class="bg-linear-to-br from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg bg-primary/20 center">
            <DollarSign class="w-4 h-4 text-primary" />
          </div>
          <p class="text-xs text-secondary font-medium">Valor Neto</p>
        </div>
        <p class="text-2xl font-bold text-primary">
          {{ venta.valorNetoBob ? formatCurrency(venta.valorNetoBob) : 'Pendiente' }}
        </p>
        <p v-if="venta.valorNetoUsd && venta.tipoCambio" class="text-xs text-tertiary mt-1">
          {{ formatCurrency(venta.valorNetoUsd, 'USD') }} @ TC: {{ venta.tipoCambio }}
        </p>
      </div>
    </div>

    <!-- Header con tipo de liquidación -->
    <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-start gap-3">
          <div 
            class="w-12 h-12 rounded-lg center shrink-0"
            :class="esLoteComplejo ? 'bg-amber-600' : 'bg-blue-600'"
          >
            <component :is="esLoteComplejo ? Layers : Droplet" class="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-neutral mb-1">
              Liquidación #{{ venta.id }}
            </h3>
            <div class="flex items-center gap-2">
              <p class="text-sm text-secondary">
                {{ esLoteComplejo ? 'Venta de Lote Complejo' : 'Venta de Concentrado' }}
              </p>
              <span 
                class="text-xs px-2 py-1 rounded-lg font-medium border"
                :class="esLoteComplejo 
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'"
              >
                {{ esLoteComplejo ? 'Lote Complejo' : 'Concentrado' }}
              </span>
            </div>
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

    <!-- Resumen de Pesos (solo si hay datos) -->
    <div v-if="tieneInformacionPesos || venta.pesoTmh" class="grid md:grid-cols-3 gap-4">
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

      <div v-if="venta.pesoTms" class="bg-surface rounded-lg p-4 border border-border">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg bg-indigo-500/10 center">
            <Scale class="w-4 h-4 text-indigo-500" />
          </div>
          <p class="text-xs text-secondary">Peso TMS</p>
        </div>
        <p class="text-2xl font-bold text-neutral">{{ formatPeso(venta.pesoTms) }}</p>
        <p class="text-xs text-tertiary mt-1">Toneladas Métricas Secas</p>
      </div>

      <div v-if="venta.pesoFinalTms" class="bg-linear-to-br from-indigo-500/10 to-purple-500/10 rounded-lg p-4 border border-indigo-500/20">
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

    <!-- Información adicional (mineral y cotización) -->
    <div class="grid md:grid-cols-2 gap-4">
      <div v-if="venta.mineralPrincipal" class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <TrendingUp class="w-4 h-4 text-secondary" />
          <h3 class="text-sm font-medium text-secondary">Mineral Principal</h3>
        </div>
        <p class="font-semibold text-neutral text-lg">{{ venta.mineralPrincipal }}</p>
      </div>

      <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <DollarSign class="w-4 h-4 text-secondary" />
          <h3 class="text-sm font-medium text-secondary">Moneda</h3>
        </div>
        <p class="font-semibold text-neutral text-lg">{{ venta.moneda || 'BOB' }}</p>
      </div>

      <div v-if="venta.cotizacionInternacionalUsd" class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <TrendingUp class="w-4 h-4 text-secondary" />
          <h3 class="text-sm font-medium text-secondary">Cotización Internacional</h3>
        </div>
        <p class="font-semibold text-neutral text-lg">{{ formatCurrency(venta.cotizacionInternacionalUsd, 'USD') }}</p>
      </div>
    </div>

    <!-- Lotes (solo para lote complejo) -->
    <div v-if="esLoteComplejo && venta.lotes && venta.lotes.length > 0" class="bg-base rounded-xl p-4 border border-border shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-neutral flex items-center gap-2">
          <Layers class="w-4 h-4" />
          Lotes ({{ totalLotes }})
        </h3>
        <div class="text-sm text-secondary">
          Peso total: <span class="font-semibold text-neutral">{{ formatPeso(pesoTotalLotes, 2) }} kg</span>
        </div>
      </div>
      <div class="space-y-2">
        <div
          v-for="lote in venta.lotes"
          :key="lote.id"
          class="flex items-center justify-between p-3 bg-surface rounded-lg border border-border"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-600 center shrink-0">
              <Mountain class="w-5 h-5 text-white" />
            </div>
            <div>
              <p class="font-medium text-neutral">{{ lote.minaNombre }}</p>
              <p class="text-xs text-secondary">{{ lote.tipoMineral }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-semibold text-neutral">{{ formatPeso(lote.pesoTotalReal, 2) }} kg</p>
            <p class="text-xs text-tertiary capitalize">{{ lote.estado }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Concentrados (solo para venta de concentrado) -->
    <div v-if="!esLoteComplejo && venta.concentrados && venta.concentrados.length > 0" class="bg-base rounded-xl p-4 border border-border shadow-sm">
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
            <div class="w-10 h-10 rounded-lg bg-blue-600 center shrink-0">
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

    <!-- Deducciones (solo si hay) -->
    <div v-if="venta.deducciones && venta.deducciones.length > 0" class="bg-base rounded-xl p-4 border border-border shadow-sm">
      <h3 class="text-sm font-semibold text-neutral mb-4 flex items-center gap-2">
        <FileText class="w-4 h-4" />
        Deducciones
      </h3>
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
              <td class="p-3 text-neutral">
                <div>
                  <p class="font-medium">{{ ded.nombre }}</p>
                  <p v-if="ded.descripcion" class="text-xs text-secondary mt-0.5">{{ ded.descripcion }}</p>
                </div>
              </td>
              <td class="p-3 text-right text-neutral">{{ ded.porcentaje }}%</td>
              <td class="p-3 text-right text-neutral">{{ formatCurrency(ded.montoUsd, 'USD') }}</td>
              <td class="p-3 text-right text-neutral">{{ formatCurrency(ded.montoBob) }}</td>
            </tr>
          </tbody>
          <tfoot class="bg-hover font-semibold">
            <tr>
              <td class="p-3 text-neutral" colspan="2">Total Deducciones</td>
              <td class="p-3 text-right text-neutral">{{ formatCurrency(venta.totalDeduccionesUsd, 'USD') }}</td>
              <td class="p-3 text-right text-neutral">{{ formatCurrency(venta.totalDeduccionesBob || (venta.totalDeduccionesUsd * venta.tipoCambio)) }}</td>
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
              <p class="font-medium text-neutral capitalize">{{ venta.metodoPago.replace(/_/g, ' ') }}</p>
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
                Ver comprobante de pago
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado Pendiente -->
    <div 
      v-if="venta.estado === 'pendiente_aprobacion'"
      class="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/30"
    >
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-lg bg-yellow-500 center shrink-0">
          <Clock class="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 class="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
            Pendiente de Aprobación
          </h3>
          <p class="text-sm text-secondary">
            Esta liquidación está esperando ser revisada y aprobada por la comercializadora. 
            Una vez aprobada, podrás continuar con el proceso.
          </p>
        </div>
      </div>
    </div>

    <!-- Observaciones -->
    <div v-if="venta.observaciones" class="bg-base rounded-xl p-4 border border-border shadow-sm">
      <h3 class="text-sm font-medium text-secondary mb-2 flex items-center gap-2">
        <FileText class="w-4 h-4" />
        Observaciones
      </h3>
      <p class="text-sm text-neutral whitespace-pre-wrap">{{ venta.observaciones }}</p>
    </div>
  </div>
</template>