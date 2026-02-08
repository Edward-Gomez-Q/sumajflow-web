<!-- src/components/socio/venta/VentaTabGeneral.vue -->
<script setup>
import {
  PackageCheck, Building2, User, Calendar, DollarSign,
  Scale, CheckCircle2, Clock, FileText, Package, TrendingUp,
  FileCheck, Layers, Droplet, Mountain, AlertCircle, Coins
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
  if (!v && v !== 0) return '-'
  return new Intl.NumberFormat('es-BO', { style: 'currency', currency: c }).format(v)
}

const formatPeso = (p, decimales = 4) => p ? parseFloat(p).toFixed(decimales) : '0.0000'

// Acceso a datos según estructura
const socio = computed(() => props.venta.socio || {})
const comercializadora = computed(() => props.venta.comercializadora || {})
const pesos = computed(() => props.venta.pesos || {})
const resultadoFinal = computed(() => props.venta.resultadoFinal || {})
const deducciones = computed(() => props.venta.deducciones?.deducciones || [])

// Lotes
const lotes = computed(() => props.venta.lotes || [])
const totalLotes = computed(() => lotes.value.length)
const pesoTotalLotes = computed(() => {
  return lotes.value.reduce((sum, l) => sum + (l.pesoTotalReal || 0), 0)
})

// Concentrados
const concentrados = computed(() => props.venta.concentrados || [])
const totalSacos = computed(() => {
  return concentrados.value.reduce((sum, c) => sum + (c.numeroSacos || 0), 0)
})

// Valoración
const valoracion = computed(() => props.venta.valoracion || {})
const mineralPrincipal = computed(() => valoracion.value.mineralPrincipal || props.venta.mineralPrincipal)

const openModal = (url) => {
  filesStore.openFile(url)
}

const tieneInformacionFinanciera = computed(() => {
  return resultadoFinal.value.valorBrutoUsd || resultadoFinal.value.valorNetoUsd || resultadoFinal.value.valorNetoBob
})

const getTipoMineral = (lote) => {
  return lote?.tipoMineral || 'Complejo'
}
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
          {{ resultadoFinal.valorBrutoUsd ? formatCurrency(resultadoFinal.valorBrutoUsd, 'USD') : 'Pendiente' }}
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
          {{ resultadoFinal.totalDeduccionesUsd ? formatCurrency(resultadoFinal.totalDeduccionesUsd, 'USD') : 'Pendiente' }}
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
          {{ resultadoFinal.valorNetoBob ? formatCurrency(resultadoFinal.valorNetoBob) : 'Pendiente' }}
        </p>
        <p v-if="resultadoFinal.valorNetoUsd && resultadoFinal.tipoCambio" class="text-xs text-tertiary mt-1">
          {{ formatCurrency(resultadoFinal.valorNetoUsd, 'USD') }} @ TC: {{ resultadoFinal.tipoCambio }}
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
              {{ socio.nombres }} {{ socio.apellidos }}
            </p>
            <p class="text-sm text-secondary mt-1">CI: {{ socio.ci }}</p>
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
            <p class="font-semibold text-neutral">{{ comercializadora.razonSocial }}</p>
            <p class="text-sm text-secondary mt-1">NIT: {{ comercializadora.nit }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Resumen de Pesos -->
    <div class="bg-surface rounded-xl p-4 border border-border">
      <h4 class="text-sm font-semibold text-neutral mb-3 flex items-center gap-2">
        <Scale class="w-4 h-4" /> Información de Pesos
      </h4>
      <div class="grid md:grid-cols-3 gap-4">
        <div v-if="pesos.pesoTotalEntrada" class="bg-hover rounded-lg p-3 border border-border">
          <p class="text-xs text-secondary mb-1">Peso Total Entrada</p>
          <p class="text-xl font-bold text-neutral">{{ formatPeso(pesos.pesoTotalEntrada) }} kg</p>
        </div>
        
        <div v-if="pesos.pesoTmh" class="bg-hover rounded-lg p-3 border border-border">
          <p class="text-xs text-secondary mb-1">
            {{ esLoteComplejo ? 'Peso final' : 'Peso TMH' }}
          </p>
          <p class="text-xl font-bold text-neutral">{{ formatPeso(pesos.pesoTmh) }} Ton</p>
          <p class="text-xs text-tertiary mt-1">Toneladas Métricas Húmedas</p>
        </div>

        <div v-if="pesos.pesoTms" class="bg-hover rounded-lg p-3 border border-border">
          <p class="text-xs text-secondary mb-1">Peso TMS</p>
          <p class="text-xl font-bold text-neutral">{{ formatPeso(pesos.pesoTms) }} Ton</p>
          <p class="text-xs text-tertiary mt-1">Toneladas Métricas Secas</p>
        </div>

        <div v-if="pesos.pesoFinalTms" class="bg-linear-to-br from-indigo-500/10 to-purple-500/10 rounded-lg p-3 border border-indigo-500/20">
          <p class="text-xs text-secondary mb-1 font-medium">Peso Final TMS</p>
          <p class="text-xl font-bold text-indigo-600">{{ formatPeso(pesos.pesoFinalTms) }} Ton</p>
          <p class="text-xs text-tertiary mt-1">Peso usado en cálculo</p>
        </div>

        <div v-if="pesos.porcentajeHumedad" class="bg-hover rounded-lg p-3 border border-border">
          <p class="text-xs text-secondary mb-1">Humedad</p>
          <p class="text-xl font-bold text-neutral">{{ formatPeso(pesos.porcentajeHumedad, 2) }}%</p>
        </div>
      </div>
      
      <div v-if="!esLoteComplejo" class="mt-4">
        <div v-if="pesos.pesoUsadoEnCalculo" class="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <p class="text-xs text-blue-600 dark:text-blue-400">
            <strong>Peso usado en cálculo:</strong> {{ pesos.pesoUsadoEnCalculo }}
          </p>
        </div>
      </div>
    </div>

    <!-- Información adicional (mineral y moneda) -->
    <div class="grid md:grid-cols-2 gap-4">
      <div v-if="!esLoteComplejo" class="mt-4">
        <div v-if="mineralPrincipal" class="bg-base rounded-xl p-4 border border-border shadow-sm">
          <div class="flex items-center gap-2 mb-2">
            <TrendingUp class="w-4 h-4 text-secondary" />
            <h3 class="text-sm font-medium text-secondary">Mineral Principal</h3>
          </div>
          <p class="font-semibold text-neutral text-lg">{{ mineralPrincipal }}</p>
        </div>
      </div>

      <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <Coins class="w-4 h-4 text-secondary" />
          <h3 class="text-sm font-medium text-secondary">Moneda</h3>
        </div>
        <p class="font-semibold text-neutral text-lg">{{ resultadoFinal.moneda || 'BOB' }}</p>
      </div>
    </div>

    <!-- Lotes (solo para lote complejo) -->
    <div v-if="esLoteComplejo && lotes.length > 0" class="bg-base rounded-xl p-4 border border-border shadow-sm">
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
          v-for="lote in lotes"
          :key="lote.id"
          class="flex items-center justify-between p-3 bg-surface rounded-lg border border-border"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-600 center shrink-0">
              <Mountain class="w-5 h-5 text-white" />
            </div>
            <div>
              <p class="font-medium text-neutral">#{{ lote.id }}</p>
              <p class="text-xs text-secondary">Mina:  {{ lote.minaNombre }}</p>
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
    <div v-if="!esLoteComplejo && concentrados.length > 0" class="bg-base rounded-xl p-4 border border-border shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-neutral flex items-center gap-2">
          <Package class="w-4 h-4" />
          Concentrados ({{ concentrados.length }})
        </h3>
        <div class="text-sm text-secondary">
          Total sacos: <span class="font-semibold text-neutral">{{ totalSacos }}</span>
        </div>
      </div>
      <div class="space-y-2">
        <div
          v-for="conc in concentrados"
          :key="conc.id"
          class="flex items-center justify-between p-3 bg-surface rounded-lg border border-border"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-600 center shrink-0">
              <PackageCheck class="w-5 h-5 text-white" />
            </div>
            <div>
              <p class="font-medium text-neutral">00{{ conc.id }}</p>
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
    <div v-if="deducciones.length > 0" class="bg-base rounded-xl p-4 border border-border shadow-sm">
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
            <tr v-for="(ded, i) in deducciones" :key="i" class="border-t border-border">
              <td class="p-3 text-neutral">
                <div>
                  <p class="font-medium">{{ ded.concepto }}</p>
                  <p v-if="ded.descripcion" class="text-xs text-secondary mt-0.5">{{ ded.descripcion }}</p>
                </div>
              </td>
              <td class="p-3 text-right text-neutral">{{ formatPeso(ded.porcentaje, 2) }}%</td>
              <td class="p-3 text-right text-neutral">{{ formatCurrency(ded.montoDeducidoUsd, 'USD') }}</td>
              <td class="p-3 text-right text-neutral">{{ formatCurrency(ded.montoDeducidoBob) }}</td>
            </tr>
          </tbody>
          <tfoot class="bg-hover font-semibold">
            <tr>
              <td class="p-3 text-neutral" colspan="2">Total Deducciones</td>
              <td class="p-3 text-right text-neutral">{{ formatCurrency(resultadoFinal.totalDeduccionesUsd, 'USD') }}</td>
              <td class="p-3 text-right text-neutral">{{ formatCurrency(resultadoFinal.totalDeduccionesUsd * resultadoFinal.tipoCambio) }}</td>
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
      <div v-if="venta.pago?.fechaAprobacion" class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <CheckCircle2 class="w-4 h-4 text-success" />
          <h3 class="text-sm font-medium text-secondary">Fecha de Aprobación</h3>
        </div>
        <p class="font-medium text-neutral">{{ formatDate(venta.pago.fechaAprobacion) }}</p>
      </div>
      <div v-if="venta.pago?.fechaPago" class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <DollarSign class="w-4 h-4 text-success" />
          <h3 class="text-sm font-medium text-secondary">Fecha de Pago</h3>
        </div>
        <p class="font-medium text-neutral">{{ formatDate(venta.pago.fechaPago) }}</p>
      </div>
    </div>

    <!-- Información de Pago (si ya está pagado) -->
    <div 
      v-if="venta.estado === 'pagado' && venta.pago"
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
              <p class="font-medium text-neutral capitalize">{{ venta.pago.metodoPago?.replace(/_/g, ' ') }}</p>
            </div>
            <div>
              <p class="text-xs text-secondary">Número de Comprobante</p>
              <p class="font-medium text-neutral">{{ venta.pago.numeroComprobante }}</p>
            </div>
            <div v-if="venta.pago.urlComprobante" class="sm:col-span-2">
              <p class="text-xs text-secondary mb-1">Comprobante</p>
              <button
                @click="openModal(venta.pago.urlComprobante)"
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

    <!-- Observaciones historial -->
    <div v-if="venta.historialObservaciones && venta.historialObservaciones.length > 0" class="bg-base rounded-xl p-4 border border-border shadow-sm">
      <h3 class="text-sm font-medium text-secondary mb-3 flex items-center gap-2">
        <FileText class="w-4 h-4" />
        Historial de Observaciones
      </h3>
      <div class="space-y-2">
        <div v-for="(obs, idx) in venta.historialObservaciones" :key="idx" class="p-3 bg-surface rounded-lg border border-border text-sm">
          <p class="text-neutral whitespace-pre-wrap">{{ obs.observacion }}</p>
          <p class="text-xs text-tertiary mt-1">{{ formatDate(obs.fecha) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>