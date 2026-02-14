<!-- src/views/comercializadora/Dashboard.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useDashboardComercializadoraStore } from '@/stores/comercializadora/dashboardStore.js'
import AppLayout from '@/components/layout/AppLayout.vue'
import {
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Settings,
  Filter,
  Calendar,
  FileText,
  Coins,
  Wallet,
  Target,
  Award,
  RefreshCw
} from 'lucide-vue-next'

// Store
const dashboardStore = useDashboardComercializadoraStore()

// Estados computados desde el store
const comprasData = computed(() => dashboardStore.dashboardData?.comprasData || {
  pendienteAprobacion: 0,
  aprobadas: 0,
  esperandoCierre: 0,
  esperandoPago: 0
})

const financieroData = computed(() => dashboardStore.dashboardData?.financieroData || {
  totalPendientePago: 0,
  totalPagadoMes: 0,
  volumenCompradoMes: 0
})

const concentradosData = computed(() => dashboardStore.dashboardData?.concentradosData || {
  enCartera: 0,
  valorEstimadoCartera: 0
})

const cotizacionesActuales = computed(() => dashboardStore.dashboardData?.cotizacionesActuales || {
  Pb: 0,
  Zn: 0,
  Ag: 0,
  tendencia: 'stable'
})

const pipelineEtapas = computed(() => dashboardStore.dashboardData?.pipelineEtapas || [])

const cotizaciones = computed(() => dashboardStore.dashboardData?.cotizaciones || [])

const historicoCotizaciones = computed(() => dashboardStore.dashboardData?.historicoCotizaciones || [])

const alertasCotizacion = computed(() => dashboardStore.dashboardData?.alertasCotizacion || [])

const carteraConcentrados = computed(() => {
  const data = dashboardStore.dashboardData?.carteraConcentrados || []
  return data.map(item => ({
    ...item,
    fechaCompra: item.fechaCompra ? new Date(item.fechaCompra) : new Date()
  }))
})

const resumenCartera = computed(() => dashboardStore.dashboardData?.resumenCartera || {
  totalConcentrados: 0,
  pesoTotal: 0,
  valorCompraTotal: 0,
  valorizacionActual: 0,
  gananciaNoRealizada: 0,
  rentabilidadPromedio: 0
})

const distribucionCartera = computed(() => dashboardStore.dashboardData?.distribucionCartera || [])

const comprasPorMes = computed(() => dashboardStore.dashboardData?.comprasPorMes || [])

const comprasPorSocio = computed(() => dashboardStore.dashboardData?.comprasPorSocio || [])

// Computed helpers
const maxCompras = computed(() => {
  const compras = comprasPorMes.value
  if (!compras || compras.length === 0) return 1
  return Math.max(...compras.map(m => Number(m.inversionTotal) || 0))
})

const formatCurrency = (value, currency = 'BOB') => {
  if (value === null || value === undefined) return '$0.00'
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: currency
  }).format(value)
}

const formatNumber = (value) => {
  if (value === null || value === undefined) return '0'
  return new Intl.NumberFormat('es-BO').format(value)
}

const formatDate = (date) => {
  if (!date) return ''
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short'
  }).format(date)
}

const getTendenciaIcon = (tendencia) => {
  return tendencia === 'up' ? TrendingUp : tendencia === 'down' ? TrendingDown : Activity
}

const getTendenciaColor = (tendencia) => {
  const colors = {
    up: 'text-success',
    down: 'text-error',
    stable: 'text-accent'
  }
  return colors[tendencia] || colors.stable
}

const getVariacionColor = (variacion) => {
  if (!variacion) return 'text-neutral'
  const num = Number(variacion)
  if (num > 0) return 'text-success'
  if (num < 0) return 'text-error'
  return 'text-neutral'
}

const getPrioridadColor = (prioridad) => {
  const colors = {
    alta: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400',
    media: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400',
    baja: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-400'
  }
  return colors[prioridad] || colors.baja
}

const refrescar = async () => {
  await dashboardStore.refrescarDashboard()
}

const tiempoDesdeActualizacion = computed(() => {
  if (!dashboardStore.ultimaActualizacion) return 'Nunca'
  
  const ahora = new Date()
  const diff = Math.floor((ahora - dashboardStore.ultimaActualizacion) / 1000)
  
  if (diff < 60) return 'Hace un momento'
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)}min`
  return `Hace ${Math.floor(diff / 3600)}h`
})

onMounted(async () => {
  console.log('Dashboard Comercializadora montado')
  await dashboardStore.fetchDashboard()
})
</script>

<template>
  <AppLayout>
    <div class="space-y-4 pb-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-neutral">Panel de Comercialización</h1>
          <p class="text-secondary mt-1 text-sm sm:text-base">
            Gestión de compras y monitoreo de mercado
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div v-if="dashboardStore.ultimaActualizacion" class="flex items-center gap-2 text-sm text-secondary">
            <Clock class="w-4 h-4" />
            <span>{{ tiempoDesdeActualizacion }}</span>
          </div>
          <button 
            @click="refrescar" 
            :disabled="dashboardStore.loading"
            class="btn-secondary flex items-center gap-2"
            :class="{ 'opacity-50 cursor-not-allowed': dashboardStore.loading }"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': dashboardStore.loading }" />
            <span class="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="dashboardStore.loading && !dashboardStore.dashboardData" class="flex items-center justify-center min-h-[60vh]">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-secondary">Cargando datos del dashboard...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="dashboardStore.error" class="bg-surface border border-border rounded-xl p-4">
        <div class="flex items-start gap-3">
          <AlertTriangle class="w-5 h-5 shrink-0 mt-0.5 text-error" />
          <div>
            <p class="font-semibold text-error">Error al cargar el dashboard</p>
            <p class="text-sm text-secondary">{{ dashboardStore.error }}</p>
          </div>
        </div>
      </div>

      <!-- Dashboard Content -->
      <div v-if="!dashboardStore.loading || dashboardStore.dashboardData" class="space-y-4">
        <!-- KPIs Principales -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <!-- Pendiente Aprobación -->
          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-yellow-500 center shrink-0">
                <Clock class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Pendiente Aprobación</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">{{ comprasData.pendienteAprobacion }}</p>
                <p class="text-xs text-tertiary">Solicitudes de venta</p>
              </div>
            </div>
          </div>

          <!-- En Cartera -->
          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary center shrink-0">
                <Package class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="text-xs sm:text-sm font-medium text-secondary">En Cartera</h3>
                  <span class="text-xs px-1.5 py-0.5 rounded bg-green-600  text-white ">
                    +{{ resumenCartera.rentabilidadPromedio }}%
                  </span>
                </div>
                <p class="text-xl sm:text-2xl font-bold text-neutral">{{ concentradosData.enCartera }}</p>
                <p class="text-xs text-tertiary truncate">{{ formatCurrency(concentradosData.valorEstimadoCartera) }}</p>
              </div>
            </div>
          </div>

          <!-- Pendiente Pago -->
          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-500 center shrink-0">
                <AlertTriangle class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Pendiente Pago</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral truncate">{{ formatCurrency(financieroData.totalPendientePago) }}</p>
                <p class="text-xs text-tertiary">{{ comprasData.esperandoPago }} ventas</p>
              </div>
            </div>
          </div>

          <!-- Pagado este Mes -->
          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-success center shrink-0">
                <DollarSign class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Pagado este Mes</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral truncate">{{ formatCurrency(financieroData.totalPagadoMes) }}</p>
                <p class="text-xs text-tertiary">{{ formatNumber(financieroData.volumenCompradoMes) }} ton</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Pipeline de Compras + Monitoreo Cotizaciones -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Pipeline (2/3) -->
          <div class="lg:col-span-2 bg-base border border-border rounded-xl overflow-hidden shadow-sm">
            <div class="p-4 border-b border-border">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg center shrink-0">
                  <ShoppingCart class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h3 class="font-bold text-neutral text-base sm:text-lg">Pipeline de Compras</h3>
                  <p class="text-xs sm:text-sm text-secondary">Funnel de transacciones</p>
                </div>
              </div>
            </div>

            <div class="p-4 overflow-x-auto scrollbar-custom">
              <div class="flex gap-4 min-w-max">
                <div
                  v-for="etapa in pipelineEtapas"
                  :key="etapa.estado"
                  class="shrink-0 w-72"
                >
                  <!-- Header Etapa -->
                  <div class="bg-hover border border-border rounded-t-xl p-4">
                    <div class="flex items-center justify-between mb-2">
                      <h4 class="font-semibold text-neutral">{{ etapa.nombre }}</h4>
                      <span class="bg-surface border border-border px-3 py-1 rounded-lg text-sm font-bold text-neutral">
                        {{ etapa.metricas?.cantidad || 0 }}
                      </span>
                    </div>
                    <div class="text-xs text-secondary space-y-0.5">
                      <p>{{ formatCurrency(etapa.metricas?.valorTotal || 0) }}</p>
                      <p>{{ formatNumber(etapa.metricas?.pesoTotal || 0) }} kg</p>
                    </div>
                  </div>

                  <!-- Cards de Liquidaciones -->
                  <div class="bg-background border border-border border-t-0 rounded-b-xl p-3 space-y-3 min-h-[400px]">
                    <div
                      v-for="liquidacion in etapa.liquidaciones"
                      :key="liquidacion.id"
                      class="bg-surface border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div class="flex items-start justify-between mb-3">
                        <div>
                          <p class="font-semibold text-neutral text-sm">{{ liquidacion.socioNombre }}</p>
                          <p class="text-xs text-secondary">
                            {{ liquidacion.tipo === 'venta_concentrado' ? 'Concentrado' : 'Lote Complejo' }}
                          </p>
                        </div>
                        <span 
                          :class="[getPrioridadColor(liquidacion.prioridad), 'px-2 py-1 rounded-lg text-xs font-medium']"
                        >
                          {{ liquidacion.prioridad.toUpperCase() }}
                        </span>
                      </div>

                      <div class="space-y-1.5 mb-3">
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-tertiary">Peso:</span>
                          <span class="font-medium text-neutral">{{ formatNumber(liquidacion.peso) }} kg</span>
                        </div>
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-tertiary">Valor est.:</span>
                          <span class="font-medium text-neutral">{{ formatCurrency(liquidacion.valorEstimado) }}</span>
                        </div>
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-tertiary">En etapa:</span>
                          <span class="font-medium text-neutral">{{ liquidacion.diasEnEtapa }} días</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Monitoreo Cotizaciones (1/3) - OPTIMIZADO -->
          <div class="bg-base border border-border rounded-xl overflow-hidden shadow-sm">
            <div class="p-4 border-b border-border">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Activity class="w-5 h-5 text-primary" />
                  <h3 class="font-bold text-neutral">Cotizaciones</h3>
                </div>
                <div class="flex items-center gap-1">
                  <div class="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span class="text-xs text-secondary">Live</span>
                </div>
              </div>
            </div>

            <div class="p-4 space-y-3 max-h-[600px] overflow-y-auto scrollbar-custom">
              <!-- Cards de Cotizaciones - COMPACTAS -->
              <div
                v-for="cot in cotizaciones"
                :key="cot.mineral"
                class="bg-hover border border-border rounded-xl p-3"
              >
                <!-- Header Compacto -->
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <div 
                      class="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-neutral text-sm"
                      :class="{
                        'bg-accent/10 border-2 border-accent': cot.mineral === 'Pb',
                        'bg-success/10 border-2 border-success': cot.mineral === 'Zn',
                        'bg-warning/10 border-2 border-warning': cot.mineral === 'Ag'
                      }"
                    >
                      {{ cot.mineral }}
                    </div>
                    <div>
                      <p class="text-lg font-bold text-neutral">{{ formatCurrency(cot.valor) }}</p>
                      <p class="text-xs text-tertiary">{{ cot.unidad }}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Cartera de Concentrados -->
        <div class="bg-base border border-border rounded-xl overflow-hidden shadow-sm">
          <div class="p-4 border-b border-border">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg center shrink-0">
                  <Wallet class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h3 class="font-bold text-neutral text-base sm:text-lg">Cartera de Concentrados</h3>
                  <p class="text-xs sm:text-sm text-secondary">{{ resumenCartera.totalConcentrados }} concentrados en inventario</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-xs text-secondary">Ganancia no realizada</p>
                <p class="text-lg sm:text-2xl font-bold text-success">{{ formatCurrency(resumenCartera.gananciaNoRealizada) }}</p>
              </div>
            </div>
          </div>

          <div class="p-4">
            <!-- Resumen de Cartera -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
              <div class="bg-hover border border-border rounded-xl p-4">
                <p class="text-xs text-secondary mb-1">Inversión Total</p>
                <p class="text-xl sm:text-2xl font-bold text-neutral truncate">{{ formatCurrency(resumenCartera.valorCompraTotal) }}</p>
              </div>
              <div class="bg-hover border border-border rounded-xl p-4">
                <p class="text-xs text-secondary mb-1">Valorización Actual</p>
                <p class="text-xl sm:text-2xl font-bold text-neutral truncate">{{ formatCurrency(resumenCartera.valorizacionActual) }}</p>
              </div>
              <div class="bg-hover border border-border rounded-xl p-4">
                <p class="text-xs text-secondary mb-1">Peso Total</p>
                <p class="text-xl sm:text-2xl font-bold text-neutral">{{ formatNumber(resumenCartera.pesoTotal) }}</p>
                <p class="text-xs text-tertiary">toneladas</p>
              </div>
              <div class="bg-hover border border-border rounded-xl p-4">
                <p class="text-xs text-secondary mb-1">Rentabilidad Prom.</p>
                <p class="text-xl sm:text-2xl font-bold text-success">+{{ resumenCartera.rentabilidadPromedio }}%</p>
              </div>
            </div>

            <!-- Tabla de Concentrados -->
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-hover border-b-2 border-border">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-neutral">Código</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-neutral">Mineral</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-neutral">Peso</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-neutral">Compra</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-neutral">Actual</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-neutral">Ganancia</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-neutral">ROI</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-neutral">Días</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="conc in carteraConcentrados"
                    :key="conc.id"
                    class="border-b border-border hover:bg-hover transition-colors"
                  >
                    <td class="px-4 py-3 text-sm font-medium text-neutral">{{ conc.id }}</td>
                    <td class="px-4 py-3">
                      <span 
                        class="px-2 py-1 rounded-lg text-xs font-medium"
                        :class="{
                          'bg-success/10 text-success border border-success': conc.mineralPrincipal === 'Zn',
                          'bg-accent/10 text-accent border border-accent': conc.mineralPrincipal === 'Pb',
                          'bg-warning/10 text-warning border border-warning': conc.mineralPrincipal === 'Ag'
                        }"
                      >
                        {{ conc.mineralPrincipal }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-sm text-neutral">{{ formatNumber(conc.pesoFinal) }} Ton</td>
                    <td class="px-4 py-3 text-sm text-neutral">{{ formatCurrency(conc.valorCompra) }}</td>
                    <td class="px-4 py-3 text-sm font-semibold text-neutral">{{ formatCurrency(conc.valorizacionActual) }}</td>
                    <td 
                      class="px-4 py-3 text-sm font-semibold"
                      :class="conc.ganancia >= 0 ? 'text-success' : 'text-error'"
                    >
                      {{ conc.ganancia >= 0 ? '+' : '' }}{{ formatCurrency(conc.ganancia) }}
                    </td>
                    <td 
                      class="px-4 py-3 text-sm font-bold"
                      :class="conc.rentabilidad >= 0 ? 'text-success' : 'text-error'"
                    >
                      {{ conc.rentabilidad >= 0 ? '+' : '' }}{{ conc.rentabilidad }}%
                    </td>
                    <td class="px-4 py-3 text-sm text-secondary">{{ conc.diasEnCartera }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Análisis de Compras -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Compras por Mes -->
          <div class="bg-base border border-border rounded-xl overflow-hidden shadow-sm">
            <div class="p-4 border-b border-border">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg center shrink-0">
                  <BarChart3 class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h3 class="font-bold text-neutral text-base sm:text-lg">Compras Mensuales</h3>
                  <p class="text-xs sm:text-sm text-secondary">Últimos 6 meses</p>
                </div>
              </div>
            </div>
            <div class="p-4">
              <div v-if="comprasPorMes.length > 0" class="space-y-3">
                <div v-for="item in comprasPorMes" :key="item.mes" class="space-y-2">
                  <div class="flex items-center justify-between text-sm">
                    <span class="font-medium text-neutral">{{ item.mes }}</span>
                    <div class="flex items-center gap-3">
                      <span class="text-xs text-secondary">{{ item.cantidadLiquidaciones }} compras</span>
                      <span class="font-semibold text-neutral">{{ formatCurrency(item.inversionTotal) }}</span>
                    </div>
                  </div>
                  <div class="relative h-8 bg-hover rounded-lg overflow-hidden">
                    <div 
                      class="absolute inset-y-0 left-0 bg-primary rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                      :style="{ width: `${(Number(item.inversionTotal) / maxCompras) * 100}%` }"
                    >
                      <span v-if="item.inversionTotal > 0" class="text-xs text-white font-medium">{{ formatNumber(item.pesoTotal) }} ton</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-12">
                <p class="text-secondary">No hay datos de compras</p>
              </div>
            </div>
          </div>

          <!-- Compras por Socio -->
          <div class="bg-base border border-border rounded-xl overflow-hidden shadow-sm">
            <div class="p-4 border-b border-border">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg center shrink-0">
                  <Award class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h3 class="font-bold text-neutral text-base sm:text-lg">Top Proveedores</h3>
                  <p class="text-xs sm:text-sm text-secondary">Mejores socios</p>
                </div>
              </div>
            </div>
            <div class="p-4 space-y-3">
              <div
                v-for="(socio, index) in comprasPorSocio"
                :key="socio.socioNombre"
                class="bg-hover border border-border rounded-xl p-4"
              >
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <div 
                      class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg"
                      :class="{
                        'bg-warning/10 text-warning border-2 border-warning': index === 0,
                        'bg-neutral-secondary/10 text-neutral border-2 border-neutral-secondary': index === 1,
                        'bg-accent/10 text-accent border-2 border-accent': index === 2
                      }"
                    >
                      {{ index + 1 }}
                    </div>
                    <div>
                      <p class="font-semibold text-neutral">{{ socio.socioNombre }}</p>
                      <p class="text-xs text-secondary">{{ socio.cantidadCompras }} compras</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-lg font-bold text-neutral">{{ formatCurrency(socio.montoTotal) }}</p>
                    <p class="text-xs text-secondary">{{ formatNumber(socio.pesoTotal / 1000) }} ton</p>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <p class="text-xs text-tertiary mb-0.5">Precio promedio</p>
                    <p class="text-sm text-neutral font-medium">{{ formatCurrency(socio.precioPromedio) }}/ton</p>
                  </div>
                  <div>
                    <p class="text-xs text-tertiary mb-0.5">Confiabilidad</p>
                    <div class="flex items-center gap-2">
                      <div class="flex-1 h-2 bg-background rounded-full overflow-hidden">
                        <div 
                          class="h-full bg-success rounded-full"
                          :style="{ width: `${socio.confiabilidad}%` }"
                        ></div>
                      </div>
                      <span class="text-sm font-medium text-neutral">{{ socio.confiabilidad }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
/* Scrollbar personalizado */
.scrollbar-custom::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scrollbar-custom::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-custom::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.scrollbar-custom::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* Dark mode scrollbar */
:global(.dark) .scrollbar-custom::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

:global(.dark) .scrollbar-custom::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Clase helper para centrar */
.center {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Animaciones suaves */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.space-y-4 > * {
  animation: fadeIn 0.3s ease-out;
}
</style>