<!-- src/components/cooperativa/LoteDetalleTabDeduccionesConcentrados.vue -->
<script setup>
import { computed } from 'vue'
import {
  TrendingDown, DollarSign, Coins, Info, AlertCircle,
  FileText, Scale, Package, Sparkles
} from 'lucide-vue-next'

const props = defineProps({
  lote: { type: Object, required: true }
})

// Verificar si tiene concentrados vendidos
const tieneConcentrados = computed(() => {
  return props.lote?.concentradosVendidos && props.lote.concentradosVendidos.length > 0
})

// Concentrados vendidos (con deducciones)
const concentradosVendidos = computed(() => {
  if (!tieneConcentrados.value) return []
  return props.lote.concentradosVendidos.filter(c => c.estado === 'vendido_a_comercializadora')
})

// Concentrados no vendidos
const concentradosNoVendidos = computed(() => {
  if (!tieneConcentrados.value) return []
  return props.lote.concentradosVendidos.filter(c => c.estado !== 'vendido_a_comercializadora')
})

// Calcular totales por concentrado
const calcularTotalesConcentrado = (concentrado) => {
  if (!concentrado.deducciones || concentrado.deducciones.length === 0) {
    return { totalUsd: 0, totalBob: 0, regalias: 0, aportes: 0 }
  }
  
  const totalUsd = concentrado.deducciones.reduce((sum, d) => sum + (d.montoDeducidoUsd || 0), 0)
  const totalBob = concentrado.deducciones.reduce((sum, d) => sum + (d.montoDeducidoBob || 0), 0)
  const regalias = concentrado.deducciones
    .filter(d => d.tipoDeduccion === 'regalia')
    .reduce((sum, d) => sum + (d.montoDeducidoBob || 0), 0)
  const aportes = concentrado.deducciones
    .filter(d => d.tipoDeduccion === 'aporte')
    .reduce((sum, d) => sum + (d.montoDeducidoBob || 0), 0)
  
  return { totalUsd, totalBob, regalias, aportes }
}

// Total general de todos los concentrados vendidos
const totalGeneral = computed(() => {
  if (concentradosVendidos.value.length === 0) {
    return { usd: 0, bob: 0, regalias: 0, aportes: 0 }
  }
  
  return concentradosVendidos.value.reduce((acc, concentrado) => {
    const totales = calcularTotalesConcentrado(concentrado)
    return {
      usd: acc.usd + totales.totalUsd,
      bob: acc.bob + totales.totalBob,
      regalias: acc.regalias + totales.regalias,
      aportes: acc.aportes + totales.aportes
    }
  }, { usd: 0, bob: 0, regalias: 0, aportes: 0 })
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

// Colores por mineral
const getMineralColor = (mineral) => {
  const colors = {
    'Pb': 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400',
    'Zn': 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
    'Ag': 'bg-gray-500/10 border-gray-500/30 text-gray-600 dark:text-gray-400'
  }
  return colors[mineral] || 'bg-gray-500/10 border-gray-500/30 text-gray-600'
}

const getMineralBadgeColor = (mineral) => {
  const colors = {
    'Pb': 'bg-purple-500 text-white',
    'Zn': 'bg-blue-500 text-white',
    'Ag': 'bg-gray-500 text-white'
  }
  return colors[mineral] || 'bg-gray-500 text-white'
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
            Deducciones de Concentrados Vendidos
          </h4>
          <p class="text-sm text-neutral mt-1">
            Este lote fue procesado en un ingenio y generó {{ tieneConcentrados ? props.lote.concentradosVendidos.length : 0 }} concentrado(s).
            A continuación se muestran las deducciones aplicadas en cada concentrado vendido.
          </p>
        </div>
      </div>
    </div>

    <!-- Sin concentrados -->
    <div v-if="!tieneConcentrados" class="bg-yellow-500/10 rounded-xl p-6 border border-yellow-500/30 text-center">
      <AlertCircle class="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
      <h3 class="text-lg font-semibold text-neutral mb-2">
        No hay información de concentrados
      </h3>
      <p class="text-sm text-secondary">
        Este lote aún no tiene concentrados registrados o no fue procesado correctamente.
      </p>
    </div>

    <!-- Con concentrados -->
    <div v-else class="space-y-6">
      <!-- Resumen Total General -->
      <div v-if="concentradosVendidos.length > 0" class="grid md:grid-cols-3 gap-4">
        <!-- Total Regalías -->
        <div class="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-red-500/20 center">
              <TrendingDown class="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <p class="text-xs text-secondary font-medium">Total Regalías</p>
          </div>
          <p class="text-2xl font-bold text-red-600 dark:text-red-400">
            {{ formatCurrency(totalGeneral.regalias) }}
          </p>
          <p class="text-xs text-tertiary mt-1">
            {{ formatCurrency(totalGeneral.regalias / 6.96, 'USD') }}
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
            {{ formatCurrency(totalGeneral.aportes) }}
          </p>
          <p class="text-xs text-tertiary mt-1">
            {{ formatCurrency(totalGeneral.aportes / 6.96, 'USD') }}
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
            {{ formatCurrency(totalGeneral.bob) }}
          </p>
          <p class="text-xs text-tertiary mt-1">
            {{ formatCurrency(totalGeneral.usd, 'USD') }}
          </p>
        </div>
      </div>

      <!-- Concentrados Vendidos -->
      <div v-for="concentrado in concentradosVendidos" :key="concentrado.concentradoId" 
           class="bg-base rounded-xl border border-border shadow-sm overflow-hidden">
        
        <!-- Header del Concentrado -->
        <div class="p-4 border-b border-border" :class="getMineralColor(concentrado.mineralPrincipal)">
          <div class="flex items-center justify-between flex-wrap gap-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-lg center" :class="getMineralBadgeColor(concentrado.mineralPrincipal)">
                <Package class="w-6 h-6" />
              </div>
              <div>
                <h3 class="font-semibold text-neutral flex items-center gap-2">
                  00{{ concentrado.concentradoId }}
                  <span class="px-2 py-0.5 rounded-md text-xs font-medium" 
                        :class="getMineralBadgeColor(concentrado.mineralPrincipal)">
                    {{ concentrado.mineralPrincipal }}
                  </span>
                </h3>
                <p class="text-sm text-secondary">
                  {{ concentrado.mensajeEstado }}
                </p>
              </div>
            </div>
            
            <!-- Total del concentrado -->
            <div class="text-right">
              <p class="text-sm text-secondary">Total Deducciones</p>
              <p class="text-xl font-bold text-primary">
                {{ formatCurrency(calcularTotalesConcentrado(concentrado).totalBob) }}
              </p>
              <p class="text-xs text-tertiary">
                {{ formatCurrency(calcularTotalesConcentrado(concentrado).totalUsd, 'USD') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Deducciones del concentrado -->
        <div v-if="concentrado.deducciones && concentrado.deducciones.length > 0" class="p-4">
          <!-- Regalías -->
          <div v-if="concentrado.deducciones.some(d => d.tipoDeduccion === 'regalia')" class="mb-6">
            <h4 class="text-sm font-semibold text-neutral flex items-center gap-2 mb-3">
              <Scale class="w-4 h-4" />
              Regalías Mineras
            </h4>
            
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
                    v-for="(ded, idx) in concentrado.deducciones.filter(d => d.tipoDeduccion === 'regalia')" 
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
              </table>
            </div>
          </div>

          <!-- Aportes -->
          <div v-if="concentrado.deducciones.some(d => d.tipoDeduccion === 'aporte')">
            <h4 class="text-sm font-semibold text-neutral flex items-center gap-2 mb-3">
              <Coins class="w-4 h-4" />
              Aportes Obligatorios
            </h4>
            
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
                    v-for="(ded, idx) in concentrado.deducciones.filter(d => d.tipoDeduccion === 'aporte')" 
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
              </table>
            </div>
          </div>
        </div>

        <!-- Sin deducciones en este concentrado -->
        <div v-else class="p-6 text-center">
          <AlertCircle class="w-10 h-10 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
          <p class="text-sm text-secondary">
            No hay deducciones registradas para este concentrado
          </p>
        </div>
      </div>

      <!-- Concentrados No Vendidos -->
      <div v-if="concentradosNoVendidos.length > 0" class="space-y-3">
        <h3 class="text-sm font-semibold text-neutral flex items-center gap-2">
          <Sparkles class="w-4 h-4" />
          Concentrados en Proceso
        </h3>
        
        <div v-for="concentrado in concentradosNoVendidos" :key="'nv-' + concentrado.concentradoId"
             class="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/30">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-yellow-500/20 center">
                <Package class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p class="font-medium text-neutral">{{ concentrado.codigoConcentrado }}</p>
                <p class="text-sm text-secondary flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded-md text-xs font-medium" 
                        :class="getMineralBadgeColor(concentrado.mineralPrincipal)">
                    {{ concentrado.mineralPrincipal }}
                  </span>
                  {{ concentrado.mensajeEstado }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs px-3 py-1 rounded-lg bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-semibold">
                {{ concentrado.estado }}
              </span>
            </div>
          </div>
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
              <span class="font-medium text-neutral">Concentrados:</span> El lote original se procesó en el ingenio y generó {{ props.lote.concentradosVendidos.length }} concentrado(s) de diferentes minerales.
            </p>
          </div>
          <div class="flex items-start gap-2">
            <div class="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
            <p class="text-secondary">
              <span class="font-medium text-neutral">Deducciones por Concentrado:</span> Cada concentrado tiene sus propias deducciones aplicadas al momento de la venta.
            </p>
          </div>
          <div class="flex items-start gap-2">
            <div class="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
            <p class="text-secondary">
              <span class="font-medium text-neutral">Estados:</span> Solo los concentrados vendidos muestran deducciones. Los concentrados en proceso mostrarán sus deducciones una vez vendidos.
            </p>
          </div>
        </div>
      </div>

      <!-- Nota final -->
      <div class="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
        <p class="text-xs text-blue-600 dark:text-blue-400 text-center flex items-center justify-center gap-2">
          <Info class="w-4 h-4" />
          Las deducciones se aplicaron al momento de la venta de cada concentrado. Los montos son informativos para la cooperativa.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>