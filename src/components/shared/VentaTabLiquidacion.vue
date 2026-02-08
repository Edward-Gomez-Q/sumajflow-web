<!-- src/components/shared/VentaTabLiquidacion.vue -->
<script setup>
import { computed } from 'vue'
import {
  DollarSign, Calculator, TrendingDown, TrendingUp, Scale, Coins,
  Package, Layers, AlertCircle, Info
} from 'lucide-vue-next'

const props = defineProps({
  venta: { type: Object, required: true }
})

const esLoteComplejo = computed(() => props.venta.tipoLiquidacion === 'venta_lote_complejo')

// Acceso a datos
const pesos = computed(() => props.venta.pesos || {})
const valoracion = computed(() => props.venta.valoracion || {})
const cotizaciones = computed(() => props.venta.cotizaciones || [])
const deducciones = computed(() => props.venta.deducciones?.deducciones || [])
const resultadoFinal = computed(() => props.venta.resultadoFinal || {})
const reporteAcordado = computed(() => props.venta.reportesQuimicos?.reporteAcordado)

// Agrupar deducciones por tipo
const deduccionesPorTipo = computed(() => {
  const regalias = deducciones.value.filter(d => d.tipoDeduccion === 'regalia')
  const aportes = deducciones.value.filter(d => d.tipoDeduccion === 'aporte')
  
  return {
    regalias,
    aportes,
    totalRegalias: regalias.reduce((sum, d) => sum + (d.montoDeducidoUsd || 0), 0),
    totalAportes: aportes.reduce((sum, d) => sum + (d.montoDeducidoUsd || 0), 0)
  }
})

const formatCurrency = (v, c = 'BOB') => {
  if (v === null || v === undefined) return '-'
  return new Intl.NumberFormat('es-BO', { style: 'currency', currency: c }).format(v)
}

const formatNumber = (v, decimales = 4) => {
  if (v === null || v === undefined) return '0.0000'
  return parseFloat(v).toFixed(decimales)
}

// Para lotes complejos
const valoracionMineralPrincipal = computed(() => {
  if (esLoteComplejo.value) {
    // El mineral principal en lotes complejos suele ser Zn
    return {
      ley: reporteAcordado.value?.leyZn || 0,
      valorUsdPorTon: valoracion.value.valorTotalUsdPorTon || 0
    }
  }
  return null
})

// Para concentrados
const valoracionConcentrado = computed(() => {
  if (!esLoteComplejo.value && valoracion.value.valoracionMineralPrincipal) {
    return valoracion.value.valoracionMineralPrincipal
  }
  return null
})

const valoracionPlata = computed(() => {
  if (!esLoteComplejo.value && valoracion.value.valoracionPlata) {
    return valoracion.value.valoracionPlata
  }
  return null
})
</script>

<template>
  <div class="space-y-6">
    <!-- Resumen Financiero -->
    <div class="grid md:grid-cols-3 gap-4">
      <div class="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg bg-blue-500 center">
            <DollarSign class="w-4 h-4 text-white" />
          </div>
          <p class="text-xs text-blue-600 dark:text-blue-400 font-medium">Valor Bruto</p>
        </div>
        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {{ formatCurrency(resultadoFinal.valorBrutoUsd, 'USD') }}
        </p>
      </div>

      <div class="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg bg-red-500 center">
            <TrendingDown class="w-4 h-4 text-white" />
          </div>
          <p class="text-xs text-red-600 dark:text-red-400 font-medium">Deducciones</p>
        </div>
        <p class="text-2xl font-bold text-red-600 dark:text-red-400">
          -{{ formatCurrency(resultadoFinal.totalDeduccionesUsd, 'USD') }}
        </p>
        <p class="text-xs text-tertiary mt-1">{{ formatNumber(resultadoFinal.porcentajeDeduccionTotal, 2) }}% del total</p>
      </div>

      <div class="bg-linear-to-br from-green-500/20 to-emerald-500/10 rounded-lg p-4 border-2 border-green-500/30">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg bg-green-500 center">
            <DollarSign class="w-4 h-4 text-white" />
          </div>
          <p class="text-xs text-green-600 dark:text-green-400 font-medium">Valor Neto</p>
        </div>
        <p class="text-3xl font-bold text-green-600 dark:text-green-400">
          {{ formatCurrency(resultadoFinal.valorNetoBob) }}
        </p>
        <p class="text-xs text-tertiary mt-1">
          {{ formatCurrency(resultadoFinal.valorNetoUsd, 'USD') }} @ TC: {{ resultadoFinal.tipoCambio }}
        </p>
      </div>
    </div>

    <!-- Información de Pesos -->
    <div class="bg-surface rounded-xl p-4 border border-border">
      <h4 class="text-sm font-semibold text-neutral mb-3 flex items-center gap-2">
        <Scale class="w-4 h-4" />
        Pesos Utilizados en el Cálculo
      </h4>
      <div class="grid md:grid-cols-3 gap-4">
        <div v-if="pesos.pesoTotalEntrada" class="bg-hover rounded-lg p-3 border border-border text-center">
          <p class="text-xs text-secondary mb-1">Peso Total Entrada</p>
          <p class="text-xl font-bold text-neutral">{{ formatNumber(pesos.pesoTotalEntrada) }} kg</p>
        </div>
        
        <div v-if="pesos.pesoTmh" class="bg-hover rounded-lg p-3 border border-border text-center">
          <p class="text-xs text-secondary mb-1">TMH</p>
          <p class="text-xl font-bold text-neutral">{{ formatNumber(pesos.pesoTmh) }} Ton</p>
        </div>

        <div v-if="pesos.pesoTms" class="bg-hover rounded-lg p-3 border border-border text-center">
          <p class="text-xs text-secondary mb-1">TMS</p>
          <p class="text-xl font-bold text-neutral">{{ formatNumber(pesos.pesoTms) }} Ton</p>
        </div>

        <div v-if="pesos.pesoFinalTms" class="bg-linear-to-br from-indigo-500/10 to-purple-500/10 rounded-lg p-3 border border-indigo-500/20 text-center">
          <p class="text-xs text-indigo-600 dark:text-indigo-400 mb-1 font-medium">Peso Final TMS</p>
          <p class="text-xl font-bold text-indigo-600 dark:text-indigo-400">{{ formatNumber(pesos.pesoFinalTms) }} Ton</p>
        </div>
      </div>

      <div v-if="pesos.pesoUsadoEnCalculo" class="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
        <p class="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
          <Info class="w-4 h-4" />
          <strong>Peso usado en cálculo:</strong> {{ pesos.pesoUsadoEnCalculo }}
        </p>
      </div>
    </div>

    <!-- Cotizaciones -->
    <div v-if="cotizaciones.length > 0" class="bg-surface rounded-xl p-4 border border-border">
      <h4 class="text-sm font-semibold text-neutral mb-3 flex items-center gap-2">
        <TrendingUp class="w-4 h-4" />
        Cotizaciones Aplicadas
      </h4>
      <div class="space-y-2">
        <div 
          v-for="(cot, idx) in cotizaciones" 
          :key="idx"
          class="grid grid-cols-4 gap-2 items-center p-3 bg-hover rounded-lg border border-border text-sm"
        >
          <div>
            <p class="text-xs text-secondary">Mineral</p>
            <p class="font-semibold text-neutral">{{ cot.mineral }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-secondary">Cotización</p>
            <p class="font-semibold text-neutral">{{ formatCurrency(cot.cotizacion, 'USD') }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-secondary">Unidad</p>
            <p class="font-medium text-neutral">{{ cot.unidad }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-secondary">Fuente</p>
            <p class="font-medium text-neutral text-xs">{{ cot.fuente }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Valoración Detallada - CONCENTRADO -->
    <div v-if="!esLoteComplejo && (valoracionConcentrado || valoracionPlata)" class="bg-surface rounded-xl p-4 border border-border">
      <h4 class="text-sm font-semibold text-neutral mb-4 flex items-center gap-2">
        <Calculator class="w-4 h-4" />
        Valoración Detallada
      </h4>

      <!-- Mineral Principal -->
      <div v-if="valoracionConcentrado" class="mb-4">
        <h5 class="text-xs font-semibold text-neutral uppercase mb-3">Mineral Principal ({{ valoracionConcentrado.mineral }})</h5>
        <div class="bg-blue-500/5 rounded-lg p-4 border border-blue-500/20">
          <div class="grid md:grid-cols-2 gap-4 mb-3">
            <div>
              <p class="text-xs text-secondary mb-1">Ley</p>
              <p class="text-lg font-bold text-neutral">{{ formatNumber(valoracionConcentrado.ley, 2) }}%</p>
            </div>
            <div>
              <p class="text-xs text-secondary mb-1">Cotización Internacional</p>
              <p class="text-lg font-bold text-neutral">{{ formatCurrency(valoracionConcentrado.cotizacionInternacional, 'USD') }}/ton</p>
            </div>
          </div>

          <div class="p-3 bg-surface rounded-lg border border-border mb-3">
            <p class="text-xs text-secondary mb-1">Cálculo de Valor por Tonelada</p>
            <p class="text-sm text-neutral font-mono">
              {{ formatCurrency(valoracionConcentrado.cotizacionInternacional, 'USD') }}/ton × {{ formatNumber(valoracionConcentrado.ley, 2) }}% ÷ 100 = 
              <span class="font-bold text-blue-600">{{ formatCurrency(valoracionConcentrado.valorUsdPorTon, 'USD') }}/ton</span>
            </p>
          </div>

          <div class="p-3 bg-surface rounded-lg border border-border">
            <p class="text-xs text-secondary mb-1">Valor Bruto Total</p>
            <p class="text-sm text-neutral font-mono mb-2">
              {{ formatCurrency(valoracionConcentrado.valorUsdPorTon, 'USD') }}/ton × {{ formatNumber(valoracionConcentrado.pesoToneladas, 4) }} ton = 
              <span class="font-bold text-green-600">{{ formatCurrency(valoracionConcentrado.valorBrutoUsd, 'USD') }}</span>
            </p>
            <p v-if="valoracionConcentrado.formulaAplicada" class="text-xs text-tertiary italic">{{ valoracionConcentrado.formulaAplicada }}</p>
          </div>
        </div>
      </div>

      <!-- Plata -->
      <div v-if="valoracionPlata" class="mb-4">
        <h5 class="text-xs font-semibold text-neutral uppercase mb-3">Plata (Ag)</h5>
        <div class="bg-yellow-500/5 rounded-lg p-4 border border-yellow-500/20">
          <div class="grid md:grid-cols-2 gap-4 mb-3">
            <div>
              <p class="text-xs text-secondary mb-1">Ley Ag</p>
              <p class="text-lg font-bold text-neutral">{{ formatNumber(valoracionPlata.leyAg, 2) }} {{ valoracionPlata.unidadLey }}</p>
            </div>
            <div>
              <p class="text-xs text-secondary mb-1">Contenido</p>
              <p class="text-lg font-bold text-neutral">{{ formatNumber(valoracionPlata.contenidoOzPorTon, 4) }} oz/ton</p>
            </div>
          </div>

          <div class="p-3 bg-surface rounded-lg border border-border mb-3">
            <p class="text-xs text-secondary mb-1">Cotización</p>
            <p class="text-lg font-semibold text-neutral">{{ formatCurrency(valoracionPlata.cotizacionUsdPorOz, 'USD') }}/oz</p>
          </div>

          <div class="p-3 bg-surface rounded-lg border border-border mb-3">
            <p class="text-xs text-secondary mb-1">Valor por Tonelada</p>
            <p class="text-sm text-neutral font-mono">
              {{ formatNumber(valoracionPlata.contenidoOzPorTon, 4) }} oz/ton × {{ formatCurrency(valoracionPlata.cotizacionUsdPorOz, 'USD') }}/oz = 
              <span class="font-bold text-yellow-600">{{ formatCurrency(valoracionPlata.valorUsdPorTon, 'USD') }}/ton</span>
            </p>
          </div>

          <div class="p-3 bg-surface rounded-lg border border-border">
            <p class="text-xs text-secondary mb-1">Valor Bruto Total</p>
            <p class="text-sm text-neutral font-mono mb-2">
              {{ formatCurrency(valoracionPlata.valorUsdPorTon, 'USD') }}/ton × {{ formatNumber(valoracionPlata.pesoToneladas, 4) }} ton = 
              <span class="font-bold text-green-600">{{ formatCurrency(valoracionPlata.valorBrutoUsd, 'USD') }}</span>
            </p>
            <p v-if="valoracionPlata.formulaAplicada" class="text-xs text-tertiary italic">{{ valoracionPlata.formulaAplicada }}</p>
          </div>
        </div>
      </div>

      <!-- Total Valoración -->
      <div class="p-4 bg-linear-to-br from-green-500/10 to-emerald-500/5 rounded-lg border-2 border-green-500/30">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-neutral">VALOR BRUTO TOTAL</span>
          <span class="text-2xl font-bold text-green-600">{{ formatCurrency(valoracion.valorBrutoTotalUsd, 'USD') }}</span>
        </div>
        <p class="text-xs text-tertiary mt-2">
          Valor total por tonelada: {{ formatCurrency(valoracion.valorTotalUsdPorTon, 'USD') }}/ton
        </p>
      </div>
    </div>

    <!-- Valoración Detallada - LOTE COMPLEJO -->
    <div v-if="esLoteComplejo && reporteAcordado" class="bg-surface rounded-xl p-4 border border-border">
      <h4 class="text-sm font-semibold text-neutral mb-4 flex items-center gap-2">
        <Calculator class="w-4 h-4" />
        Valoración por Mineral (Lote Complejo)
      </h4>

      <div class="space-y-3">
        <!-- Información basada en tabla de precios -->
        <div class="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
          <p class="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <Info class="w-4 h-4" />
            Los precios provienen de la tabla de precios de la comercializadora según las leyes del reporte acordado
          </p>
        </div>

        <!-- Leyes del reporte acordado -->
        <div class="grid md:grid-cols-3 gap-4">
          <div v-if="reporteAcordado.leyPb" class="bg-blue-500/5 rounded-lg p-3 border border-blue-500/20">
            <p class="text-xs text-secondary mb-1">Plomo (Pb)</p>
            <p class="text-2xl font-bold text-blue-600">{{ formatNumber(reporteAcordado.leyPb, 2) }}%</p>
          </div>

          <div v-if="reporteAcordado.leyZn" class="bg-indigo-500/5 rounded-lg p-3 border border-indigo-500/20">
            <p class="text-xs text-secondary mb-1">Zinc (Zn)</p>
            <p class="text-2xl font-bold text-indigo-600">{{ formatNumber(reporteAcordado.leyZn, 2) }}%</p>
          </div>

          <div v-if="reporteAcordado.leyAgDm" class="bg-yellow-500/5 rounded-lg p-3 border border-yellow-500/20">
            <p class="text-xs text-secondary mb-1">Plata (Ag DM)</p>
            <p class="text-2xl font-bold text-yellow-600">{{ formatNumber(reporteAcordado.leyAgDm, 2) }}</p>
          </div>
        </div>

        <!-- Peso usado -->
        <div class="p-3 bg-surface rounded-lg border border-border">
          <p class="text-xs text-secondary mb-1">Peso Total (TMH)</p>
          <p class="text-xl font-bold text-neutral">{{ formatNumber(pesos.pesoTmh, 4) }} Toneladas</p>
        </div>

        <!-- Valor total por tonelada -->
        <div class="p-4 bg-linear-to-br from-green-500/10 to-emerald-500/5 rounded-lg border-2 border-green-500/30">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-semibold text-neutral">Valor por Tonelada</span>
            <span class="text-2xl font-bold text-green-600">{{ formatCurrency(valoracion.valorTotalUsdPorTon, 'USD') }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-neutral">VALOR BRUTO TOTAL</span>
            <span class="text-2xl font-bold text-green-600">{{ formatCurrency(valoracion.valorBrutoTotalUsd, 'USD') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Deducciones -->
    <div v-if="deducciones.length > 0" class="bg-surface rounded-xl p-4 border border-border">
      <h4 class="text-sm font-semibold text-neutral mb-4 flex items-center gap-2">
        <TrendingDown class="w-4 h-4" />
        Deducciones Aplicadas
      </h4>

      <!-- Regalías Mineras -->
      <div v-if="deduccionesPorTipo.regalias.length > 0" class="mb-4">
        <div class="flex items-center justify-between mb-3">
          <h5 class="text-xs font-semibold text-neutral uppercase">Regalías Mineras</h5>
          <span class="text-sm font-bold text-red-600 dark:text-red-400">
            -{{ formatCurrency(deduccionesPorTipo.totalRegalias, 'USD') }}
          </span>
        </div>
        <div class="space-y-2">
          <div 
            v-for="(ded, idx) in deduccionesPorTipo.regalias" 
            :key="'r-' + idx"
            class="bg-red-500/5 rounded-lg p-3 border border-red-500/20"
          >
            <div class="grid grid-cols-3 gap-2 items-center text-sm mb-2">
              <span class="font-medium text-neutral">{{ ded.concepto }}</span>
              <span class="text-center text-secondary">{{ formatNumber(ded.porcentaje, 2) }}%</span>
              <span class="text-right font-semibold text-red-600 dark:text-red-400">
                {{ formatCurrency(ded.montoDeducidoUsd, 'USD') }}
              </span>
            </div>
            <p v-if="ded.descripcion" class="text-xs text-secondary">{{ ded.descripcion }}</p>
            <p v-if="ded.formulaAplicada" class="text-xs text-tertiary italic mt-1">{{ ded.formulaAplicada }}</p>
          </div>
        </div>
      </div>

      <!-- Aportes Obligatorios -->
      <div v-if="deduccionesPorTipo.aportes.length > 0" class="mb-4">
        <div class="flex items-center justify-between mb-3">
          <h5 class="text-xs font-semibold text-neutral uppercase">Aportes Obligatorios</h5>
          <span class="text-sm font-bold text-orange-600 dark:text-orange-400">
            -{{ formatCurrency(deduccionesPorTipo.totalAportes, 'USD') }}
          </span>
        </div>
        <div class="space-y-2">
          <div 
            v-for="(ded, idx) in deduccionesPorTipo.aportes" 
            :key="'a-' + idx"
            class="bg-orange-500/5 rounded-lg p-3 border border-orange-500/20"
          >
            <div class="grid grid-cols-3 gap-2 items-center text-sm mb-2">
              <span class="font-medium text-neutral">{{ ded.concepto }}</span>
              <span class="text-center text-secondary">{{ formatNumber(ded.porcentaje, 2) }}%</span>
              <span class="text-right font-semibold text-orange-600 dark:text-orange-400">
                {{ formatCurrency(ded.montoDeducidoUsd, 'USD') }}
              </span>
            </div>
            <p v-if="ded.descripcion" class="text-xs text-secondary">{{ ded.descripcion }}</p>
            <p v-if="ded.formulaAplicada" class="text-xs text-tertiary italic mt-1">{{ ded.formulaAplicada }}</p>
          </div>
        </div>
      </div>

      <!-- Total Deducciones -->
      <div class="p-4 bg-red-500/10 rounded-lg border-2 border-red-500/30">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-semibold text-neutral">Total Deducciones (USD)</span>
          <span class="text-2xl font-bold text-red-600 dark:text-red-400">
            -{{ formatCurrency(resultadoFinal.totalDeduccionesUsd, 'USD') }}
          </span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-secondary">Total Deducciones (BOB)</span>
          <span class="font-semibold text-neutral">
            -{{ formatCurrency(resultadoFinal.totalDeduccionesUsd * resultadoFinal.tipoCambio) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Resultado Final -->
    <div class="bg-linear-to-br from-emerald-600/20 to-green-500/10 rounded-xl p-6 border-2 border-emerald-600/30">
      <h4 class="text-sm font-semibold text-neutral mb-4 text-center">RESULTADO FINAL DE LA LIQUIDACIÓN</h4>
      
      <div class="grid md:grid-cols-3 gap-4 mb-4">
        <div class="text-center">
          <p class="text-xs text-secondary mb-1">Valor Bruto</p>
          <p class="text-xl font-bold text-neutral">{{ formatCurrency(resultadoFinal.valorBrutoUsd, 'USD') }}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-secondary mb-1">Deducciones</p>
          <p class="text-xl font-bold text-red-600">-{{ formatCurrency(resultadoFinal.totalDeduccionesUsd, 'USD') }}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-secondary mb-1">Tipo de Cambio</p>
          <p class="text-xl font-bold text-neutral">{{ formatNumber(resultadoFinal.tipoCambio, 2) }}</p>
        </div>
      </div>

      <div class="p-6 bg-linear-to-br from-green-600/30 to-emerald-600/20 rounded-lg border-2 border-green-600/40 text-center">
        <p class="text-sm text-secondary mb-2 font-medium">VALOR NETO A PAGAR/RECIBIR</p>
        <p class="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
          {{ formatCurrency(resultadoFinal.valorNetoBob) }}
        </p>
        <p class="text-lg text-secondary">
          {{ formatCurrency(resultadoFinal.valorNetoUsd, 'USD') }}
        </p>
      </div>

      <div class="grid grid-cols-2 gap-4 mt-4 text-center">
        <div class="p-3 bg-surface/50 rounded-lg border border-border">
          <p class="text-xs text-secondary mb-1">% Deducción Total</p>
          <p class="text-lg font-bold text-neutral">{{ formatNumber(resultadoFinal.porcentajeDeduccionTotal, 2) }}%</p>
        </div>
        <div class="p-3 bg-surface/50 rounded-lg border border-border">
          <p class="text-xs text-secondary mb-1">% Pago al Socio</p>
          <p class="text-lg font-bold text-green-600">{{ formatNumber(resultadoFinal.porcentajePagoSocio, 2) }}%</p>
        </div>
      </div>
    </div>
  </div>
</template>