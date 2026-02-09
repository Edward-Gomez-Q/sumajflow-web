<!-- src/components/cooperativa/LoteDetalleTabDeducciones.vue -->
<script setup>
import { computed } from 'vue'
import {
  TrendingDown, DollarSign, Coins, Info, AlertCircle,
  FileText, Scale
} from 'lucide-vue-next'

const props = defineProps({
  lote: { type: Object, required: true }
})

// Verificar si tiene deducciones
const tieneDeducciones = computed(() => {
  return props.lote?.deduccionesVenta && props.lote.deduccionesVenta.length > 0
})

// Organizar deducciones por tipo
const deduccionesPorTipo = computed(() => {
  if (!tieneDeducciones.value) return { regalias: [], aportes: [] }
  
  const regalias = props.lote.deduccionesVenta.filter(d => d.tipoDeduccion === 'regalia')
  const aportes = props.lote.deduccionesVenta.filter(d => d.tipoDeduccion === 'aporte')
  
  return {
    regalias,
    aportes,
    totalRegalias: regalias.reduce((sum, d) => sum + (d.montoDeducidoBob || 0), 0),
    totalAportes: aportes.reduce((sum, d) => sum + (d.montoDeducidoBob || 0), 0)
  }
})

// Total de deducciones
const totalDeducciones = computed(() => {
  if (!tieneDeducciones.value) return { usd: 0, bob: 0 }
  
  return {
    usd: props.lote.deduccionesVenta.reduce((sum, d) => sum + (d.montoDeducidoUsd || 0), 0),
    bob: props.lote.deduccionesVenta.reduce((sum, d) => sum + (d.montoDeducidoBob || 0), 0)
  }
})

// Formatos
const formatCurrency = (v, c = 'BOB') => {
  if (v === null || v === undefined) return '-'
  return new Intl.NumberFormat('es-BO', { 
    style: 'currency', 
    currency: c, 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(v)
}

const formatNumber = (v, decimales = 4) => {
  if (v === null || v === undefined) return '0.00'
  return parseFloat(v).toFixed(decimales)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header informativo -->
    <div class="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
      <div class="flex items-start gap-3">
        <Info class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <h4 class="font-semibold text-blue-600 dark:text-blue-400">
            Deducciones Aplicadas en la Venta
          </h4>
          <p class="text-sm text-neutral mt-1">
            Estas son las deducciones que se aplicaron cuando el socio vendió este lote a la comercializadora.
            Los montos se calcularon sobre el valor bruto de la venta.
          </p>
        </div>
      </div>
    </div>

    <!-- Sin deducciones -->
    <div v-if="!tieneDeducciones" class="bg-yellow-500/10 rounded-xl p-6 border border-yellow-500/30 text-center">
      <AlertCircle class="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
      <h3 class="text-lg font-semibold text-neutral mb-2">
        No hay información de deducciones
      </h3>
      <p class="text-sm text-secondary">
        Este lote aún no tiene deducciones registradas o no fue vendido correctamente.
      </p>
    </div>

    <!-- Con deducciones -->
    <div v-else class="space-y-6">
      <!-- Resumen Total -->
      <div class="grid md:grid-cols-3 gap-4">
        <!-- Total Regalías -->
        <div class="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-red-500/20 center">
              <TrendingDown class="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <p class="text-xs text-secondary font-medium">Total Regalías</p>
          </div>
          <p class="text-2xl font-bold text-red-600 dark:text-red-400">
            {{ formatCurrency(deduccionesPorTipo.totalRegalias) }}
          </p>
          <p class="text-xs text-tertiary mt-1">
            {{ formatCurrency(deduccionesPorTipo.totalRegalias / 6.96, 'USD') }}
          </p>
        </div>

        <!-- Total Aportes -->
        <div class="bg-orange-500/10 rounded-xl p-4 border border-orange-500/30">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-orange-500/20 center">
              <Coins class="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <p class="text-xs text-secondary font-medium">Total Aportes</p>
          </div>
          <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {{ formatCurrency(deduccionesPorTipo.totalAportes) }}
          </p>
          <p class="text-xs text-tertiary mt-1">
            {{ formatCurrency(deduccionesPorTipo.totalAportes / 6.96, 'USD') }}
          </p>
        </div>

        <!-- Total General -->
        <div class="bg-primary/10 rounded-xl p-4 border border-primary/20">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-primary/20 center">
              <DollarSign class="w-4 h-4 text-primary" />
            </div>
            <p class="text-xs text-secondary font-medium">Total Deducciones</p>
          </div>
          <p class="text-2xl font-bold text-primary">
            {{ formatCurrency(totalDeducciones.bob) }}
          </p>
          <p class="text-xs text-tertiary mt-1">
            {{ formatCurrency(totalDeducciones.usd, 'USD') }}
          </p>
        </div>
      </div>

      <!-- Regalías Mineras -->
      <div v-if="deduccionesPorTipo.regalias.length > 0" class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-neutral flex items-center gap-2">
            <Scale class="w-4 h-4" />
            Regalías Mineras
          </h3>
          <span class="text-xs px-3 py-1 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 font-semibold">
            {{ deduccionesPorTipo.regalias.length }} regalía(s)
          </span>
        </div>

        <div class="bg-surface rounded-xl border border-border overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-hover">
              <tr>
                <th class="text-left p-3 text-secondary font-medium">Concepto</th>
                <th class="text-center p-3 text-secondary font-medium">Base</th>
                <th class="text-right p-3 text-secondary font-medium">%</th>
                <th class="text-right p-3 text-secondary font-medium">USD</th>
                <th class="text-right p-3 text-secondary font-medium">BOB</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(ded, idx) in deduccionesPorTipo.regalias" 
                :key="'r-' + idx" 
                class="border-t border-border hover:bg-hover transition-colors"
              >
                <td class="p-3">
                  <div>
                    <p class="font-medium text-neutral">{{ ded.concepto }}</p>
                    <p v-if="ded.descripcion" class="text-xs text-secondary mt-0.5">
                      {{ ded.descripcion }}
                    </p>
                  </div>
                </td>
                <td class="p-3 text-center">
                  <span class="text-xs px-2 py-1 rounded-md bg-surface border border-border text-secondary">
                    {{ ded.baseCalculo?.replace('valor_bruto_', '').replace('_', ' ') || '-' }}
                  </span>
                </td>
                <td class="p-3 text-right text-neutral">
                  {{ formatNumber(ded.porcentaje, 2) }}%
                </td>
                <td class="p-3 text-right font-medium text-red-600 dark:text-red-400">
                  {{ formatCurrency(ded.montoDeducidoUsd, 'USD') }}
                </td>
                <td class="p-3 text-right font-semibold text-red-600 dark:text-red-400">
                  {{ formatCurrency(ded.montoDeducidoBob) }}
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-red-500/10 font-semibold border-t-2 border-red-500/30">
              <tr>
                <td class="p-3 text-neutral" colspan="3">Subtotal Regalías</td>
                <td class="p-3 text-right text-red-600 dark:text-red-400">
                  {{ formatCurrency(deduccionesPorTipo.totalRegalias / 6.96, 'USD') }}
                </td>
                <td class="p-3 text-right text-red-600 dark:text-red-400">
                  {{ formatCurrency(deduccionesPorTipo.totalRegalias) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Aportes Obligatorios -->
      <div v-if="deduccionesPorTipo.aportes.length > 0" class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-neutral flex items-center gap-2">
            <Coins class="w-4 h-4" />
            Aportes Obligatorios
          </h3>
          <span class="text-xs px-3 py-1 rounded-lg bg-orange-500/20 text-orange-600 dark:text-orange-400 font-semibold">
            {{ deduccionesPorTipo.aportes.length }} aporte(s)
          </span>
        </div>

        <div class="bg-surface rounded-xl border border-border overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-hover">
              <tr>
                <th class="text-left p-3 text-secondary font-medium">Concepto</th>
                <th class="text-center p-3 text-secondary font-medium">Base</th>
                <th class="text-right p-3 text-secondary font-medium">%</th>
                <th class="text-right p-3 text-secondary font-medium">USD</th>
                <th class="text-right p-3 text-secondary font-medium">BOB</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(ded, idx) in deduccionesPorTipo.aportes" 
                :key="'a-' + idx" 
                class="border-t border-border hover:bg-hover transition-colors"
              >
                <td class="p-3">
                  <div>
                    <p class="font-medium text-neutral">{{ ded.concepto }}</p>
                    <p v-if="ded.descripcion" class="text-xs text-secondary mt-0.5">
                      {{ ded.descripcion }}
                    </p>
                  </div>
                </td>
                <td class="p-3 text-center">
                  <span class="text-xs px-2 py-1 rounded-md bg-surface border border-border text-secondary">
                    {{ ded.baseCalculo?.replace('valor_bruto_', '').replace('_', ' ') || '-' }}
                  </span>
                </td>
                <td class="p-3 text-right text-neutral">
                  {{ formatNumber(ded.porcentaje, 2) }}%
                </td>
                <td class="p-3 text-right font-medium text-orange-600 dark:text-orange-400">
                  {{ formatCurrency(ded.montoDeducidoUsd, 'USD') }}
                </td>
                <td class="p-3 text-right font-semibold text-orange-600 dark:text-orange-400">
                  {{ formatCurrency(ded.montoDeducidoBob) }}
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-orange-500/10 font-semibold border-t-2 border-orange-500/30">
              <tr>
                <td class="p-3 text-neutral" colspan="3">Subtotal Aportes</td>
                <td class="p-3 text-right text-orange-600 dark:text-orange-400">
                  {{ formatCurrency(deduccionesPorTipo.totalAportes / 6.96, 'USD') }}
                </td>
                <td class="p-3 text-right text-orange-600 dark:text-orange-400">
                  {{ formatCurrency(deduccionesPorTipo.totalAportes) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Explicación adicional -->
      <div class="bg-surface rounded-xl p-4 border border-border">
        <h4 class="text-sm font-semibold text-neutral mb-3 flex items-center gap-2">
          <FileText class="w-4 h-4" />
          Información Adicional
        </h4>
        <div class="space-y-2 text-sm">
          <div class="flex items-start gap-2">
            <div class="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
            <p class="text-secondary">
              <span class="font-medium text-neutral">Regalías Mineras:</span> Deducciones calculadas sobre el valor bruto del mineral principal (Pb/Zn) y plata según normativa vigente.
            </p>
          </div>
          <div class="flex items-start gap-2">
            <div class="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
            <p class="text-secondary">
              <span class="font-medium text-neutral">Aportes Obligatorios:</span> Contribuciones calculadas sobre el valor bruto total destinadas a instituciones mineras (COMIBOL, FEDECOMIN, etc.).
            </p>
          </div>
          <div class="flex items-start gap-2">
            <div class="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
            <p class="text-secondary">
              <span class="font-medium text-neutral">Base de Cálculo:</span> Define sobre qué valor se aplica cada deducción (valor bruto principal, plata o total).
            </p>
          </div>
        </div>
      </div>

      <!-- Nota final -->
      <div class="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
        <p class="text-xs text-blue-600 dark:text-blue-400 text-center flex items-center justify-center gap-2">
          <Info class="w-4 h-4" />
          Estas deducciones se aplicaron en el momento del cierre de venta. Los montos son informativos para la cooperativa.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>