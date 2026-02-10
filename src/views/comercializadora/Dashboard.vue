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

const formatCurrency = (value, currency = 'USD') => {
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
    stable: 'text-info'
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
    alta: 'bg-error',
    media: 'bg-warning',
    baja: 'bg-info'
  }
  return colors[prioridad] || colors.baja
}

const refrescar = async () => {
  await dashboardStore.refrescarDashboard()
}

onMounted(async () => {
  console.log('Dashboard Comercializadora montado')
  await dashboardStore.fetchDashboard()
})
</script>

<template>
  <AppLayout>
    <div class="space-y-6 pb-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-neutral">Panel de Comercialización</h1>
          <p class="text-secondary mt-1">
            Gestión de compras y monitoreo de mercado
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div v-if="dashboardStore.ultimaActualizacion" class="flex items-center gap-2 text-sm text-secondary">
            <Clock class="w-4 h-4" />
            <span>Actualizado {{ formatDate(dashboardStore.ultimaActualizacion) }}</span>
          </div>
          <button 
            @click="refrescar" 
            :disabled="dashboardStore.loading"
            class="btn-outline text-sm py-2 px-4 flex items-center gap-2"
            :class="{ 'opacity-50 cursor-not-allowed': dashboardStore.loading }"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': dashboardStore.loading }" />
            Actualizar
          </button>
          <button class="btn-outline text-sm py-2 px-4 flex items-center gap-2">
            <Settings class="w-4 h-4" />
            Configurar Precios
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="dashboardStore.loading && !dashboardStore.dashboardData" class="text-center py-12">
        <RefreshCw class="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
        <p class="text-secondary">Cargando datos del dashboard...</p>
      </div>

      <!-- Error State -->
      <div v-if="dashboardStore.error" class="bg-surface border border-error/30 rounded-xl p-4">
        <div class="flex items-start gap-3">
          <AlertTriangle class="w-5 h-5 shrink-0 mt-0.5 text-error" />
          <div>
            <p class="font-semibold text-error">Error al cargar el dashboard</p>
            <p class="text-sm text-secondary">{{ dashboardStore.error }}</p>
          </div>
        </div>
      </div>

      <!-- Dashboard Content -->
      <div v-if="!dashboardStore.loading || dashboardStore.dashboardData">
        <!-- KPIs Principales -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Pendiente Aprobación -->
          <div class="card">
            <div class="flex items-start justify-between mb-4">
              <div class="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                <Clock class="w-6 h-6 text-warning" />
              </div>
              <div class="text-xs bg-warning/10 text-warning px-2 py-1 rounded-lg font-medium">
                Por revisar
              </div>
            </div>
            <div class="space-y-1">
              <p class="text-sm font-medium text-secondary">Pendiente Aprobación</p>
              <p class="text-3xl font-bold text-neutral">{{ comprasData.pendienteAprobacion }}</p>
              <p class="text-xs text-tertiary">Solicitudes de venta</p>
            </div>
          </div>

          <!-- En Cartera -->
          <div class="card">
            <div class="flex items-start justify-between mb-4">
              <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Package class="w-6 h-6 text-primary" />
              </div>
              <div class="flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-1 rounded-lg font-medium">
                <ArrowUpRight class="w-3 h-3" />
                <span>+{{ resumenCartera.rentabilidadPromedio }}%</span>
              </div>
            </div>
            <div class="space-y-1">
              <p class="text-sm font-medium text-secondary">En Cartera</p>
              <p class="text-3xl font-bold text-neutral">{{ concentradosData.enCartera }}</p>
              <p class="text-xs text-tertiary">{{ formatCurrency(concentradosData.valorEstimadoCartera) }}</p>
            </div>
          </div>

          <!-- Pendiente Pago -->
          <div class="card">
            <div class="flex items-start justify-between mb-4">
              <div class="w-12 h-12 bg-error/10 rounded-xl flex items-center justify-center">
                <AlertTriangle class="w-6 h-6 text-error" />
              </div>
              <div class="text-xs bg-surface border border-border px-2 py-1 rounded-lg font-medium text-neutral">
                {{ comprasData.esperandoPago }} ventas
              </div>
            </div>
            <div class="space-y-1">
              <p class="text-sm font-medium text-secondary">Pendiente Pago</p>
              <p class="text-3xl font-bold text-neutral">{{ formatCurrency(financieroData.totalPendientePago) }}</p>
              <p class="text-xs text-tertiary">Por liquidar</p>
            </div>
          </div>

          <!-- Pagado este Mes -->
          <div class="card">
            <div class="flex items-start justify-between mb-4">
              <div class="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                <DollarSign class="w-6 h-6 text-success" />
              </div>
              <div class="text-xs bg-surface border border-border px-2 py-1 rounded-lg font-medium text-neutral">
                {{ formatNumber(financieroData.volumenCompradoMes) }} ton
              </div>
            </div>
            <div class="space-y-1">
              <p class="text-sm font-medium text-secondary">Pagado este Mes</p>
              <p class="text-3xl font-bold text-neutral">{{ formatCurrency(financieroData.totalPagadoMes) }}</p>
              <p class="text-xs text-tertiary">Total invertido</p>
            </div>
          </div>
        </div>

        <!-- Pipeline de Compras + Monitoreo Cotizaciones -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Pipeline (2/3) -->
          <div class="lg:col-span-2 card-flat">
            <div class="p-6 border-b border-border">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <ShoppingCart class="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 class="font-bold text-neutral text-lg">Pipeline de Compras</h3>
                    <p class="text-sm text-secondary">Funnel de transacciones</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="p-6 overflow-x-auto">
              <div class="flex gap-4 min-w-max">
                <div
                  v-for="etapa in pipelineEtapas"
                  :key="etapa.estado"
                  class="shrink-0 w-72"
                >
                  <!-- Header Etapa -->
                  <div :class="etapa.color" class="rounded-t-xl p-4 border-b-2 border-border bg-surface">
                    <div class="flex items-center justify-between mb-2">
                      <h4 class="font-bold text-neutral">{{ etapa.nombre }}</h4>
                      <span class="bg-primary text-white px-3 py-1 rounded-lg text-sm font-bold">
                        {{ etapa.metricas?.cantidad || 0 }}
                      </span>
                    </div>
                    <div class="text-xs text-secondary">
                      <p>{{ formatCurrency(etapa.metricas?.valorTotal || 0) }}</p>
                      <p>{{ formatNumber(etapa.metricas?.pesoTotal || 0) }} kg</p>
                    </div>
                  </div>

                  <!-- Cards de Liquidaciones -->
                  <div class="bg-hover border border-border border-t-0 rounded-b-xl p-3 space-y-3 min-h-[400px]">
                    <div
                      v-for="liquidacion in etapa.liquidaciones"
                      :key="liquidacion.id"
                      class="bg-surface border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div class="flex items-start justify-between mb-3">
                        <div>
                          <p class="font-bold text-neutral text-sm">{{ liquidacion.socioNombre }}</p>
                          <p class="text-xs text-secondary">
                            {{ liquidacion.tipo === 'venta_concentrado' ? 'Concentrado' : 'Lote Complejo' }}
                          </p>
                        </div>
                        <span 
                          :class="getPrioridadColor(liquidacion.prioridad)"
                          class="px-2 py-1 rounded-lg text-xs font-bold text-white"
                        >
                          {{ liquidacion.prioridad.toUpperCase() }}
                        </span>
                      </div>

                      <div class="space-y-2 mb-3">
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-secondary">Peso:</span>
                          <span class="font-medium text-neutral">{{ formatNumber(liquidacion.peso) }} kg</span>
                        </div>
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-secondary">Valor est.:</span>
                          <span class="font-medium text-neutral">{{ formatCurrency(liquidacion.valorEstimado) }}</span>
                        </div>
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-secondary">En etapa:</span>
                          <span class="font-medium text-neutral">{{ liquidacion.diasEnEtapa }} días</span>
                        </div>
                      </div>

                      <button class="w-full btn-outline text-xs py-2 flex items-center justify-center gap-2">
                        <Eye class="w-3 h-3" />
                        Ver Detalle
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Monitoreo Cotizaciones (1/3) -->
          <div class="card-flat">
            <div class="p-4 border-b border-border">
              <div class="flex items-center gap-2">
                <Activity class="w-5 h-5 text-primary" />
                <h3 class="font-bold text-neutral">Cotizaciones</h3>
                <div class="ml-auto flex items-center gap-1">
                  <div class="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span class="text-xs text-secondary">Live</span>
                </div>
              </div>
            </div>

            <div class="p-4 space-y-4">
              <!-- Cards de Cotizaciones -->
              <div
                v-for="cot in cotizaciones"
                :key="cot.mineral"
                class="bg-hover border border-border rounded-xl p-4"
              >
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <div 
                      class="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-neutral text-lg border-2"
                      :class="{
                        'border-info bg-info/10': cot.mineral === 'Pb',
                        'border-success bg-success/10': cot.mineral === 'Zn',
                        'border-warning bg-warning/10': cot.mineral === 'Ag'
                      }"
                    >
                      {{ cot.mineral }}
                    </div>
                    <div>
                      <p class="text-2xl font-bold text-neutral">{{ formatCurrency(cot.valor) }}</p>
                      <p class="text-xs text-secondary">{{ cot.unidad }}</p>
                    </div>
                  </div>
                  <component 
                    :is="getTendenciaIcon(cot.tendencia)" 
                    :class="getTendenciaColor(cot.tendencia)"
                    class="w-6 h-6"
                  />
                </div>

                <div class="grid grid-cols-3 gap-2 mb-3 text-xs">
                  <div class="text-center">
                    <p :class="getVariacionColor(cot.variacion24h)" class="font-bold">
                      {{ Number(cot.variacion24h) > 0 ? '+' : '' }}{{ cot.variacion24h }}%
                    </p>
                    <p class="text-tertiary">24h</p>
                  </div>
                  <div class="text-center">
                    <p :class="getVariacionColor(cot.variacion7d)" class="font-bold">
                      {{ Number(cot.variacion7d) > 0 ? '+' : '' }}{{ cot.variacion7d }}%
                    </p>
                    <p class="text-tertiary">7d</p>
                  </div>
                  <div class="text-center">
                    <p :class="getVariacionColor(cot.variacion30d)" class="font-bold">
                      {{ Number(cot.variacion30d) > 0 ? '+' : '' }}{{ cot.variacion30d }}%
                    </p>
                    <p class="text-tertiary">30d</p>
                  </div>
                </div>

                <div class="bg-background rounded-lg p-2 space-y-1 text-xs">
                  <div class="flex items-center justify-between">
                    <span class="text-tertiary">Mín 30d:</span>
                    <span class="font-medium text-neutral">{{ formatCurrency(cot.minimo30d) }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-tertiary">Máx 30d:</span>
                    <span class="font-medium text-neutral">{{ formatCurrency(cot.maximo30d) }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-tertiary">Promedio:</span>
                    <span class="font-medium text-neutral">{{ formatCurrency(cot.promedioMovil) }}</span>
                  </div>
                </div>
              </div>

              <!-- Alertas de Cotización -->
              <div v-if="alertasCotizacion.length > 0" class="space-y-2">
                <h4 class="font-semibold text-neutral text-sm">Alertas de Mercado</h4>
                <div
                  v-for="alerta in alertasCotizacion"
                  :key="alerta.mineral"
                  class="bg-warning/10 border border-warning/30 rounded-xl p-3"
                >
                  <div class="flex items-start gap-2">
                    <AlertTriangle class="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <div class="text-xs">
                      <p class="font-bold text-warning mb-1">{{ alerta.mineral }}: {{ alerta.mensaje }}</p>
                      <p class="text-secondary">💡 {{ alerta.recomendacion }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cartera de Concentrados -->
        <div class="card-flat">
          <div class="p-6 border-b border-border">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Wallet class="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 class="font-bold text-neutral text-lg">Cartera de Concentrados</h3>
                  <p class="text-sm text-secondary">{{ resumenCartera.totalConcentrados }} concentrados en inventario</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm text-secondary">Ganancia no realizada</p>
                <p class="text-2xl font-bold text-success">{{ formatCurrency(resumenCartera.gananciaNoRealizada) }}</p>
              </div>
            </div>
          </div>

          <div class="p-6">
            <!-- Resumen de Cartera -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div class="bg-hover border border-border rounded-xl p-4 text-center">
                <p class="text-xs text-secondary mb-1">Inversión Total</p>
                <p class="text-2xl font-bold text-neutral">{{ formatCurrency(resumenCartera.valorCompraTotal) }}</p>
              </div>
              <div class="bg-hover border border-border rounded-xl p-4 text-center">
                <p class="text-xs text-secondary mb-1">Valorización Actual</p>
                <p class="text-2xl font-bold text-neutral">{{ formatCurrency(resumenCartera.valorizacionActual) }}</p>
              </div>
              <div class="bg-hover border border-border rounded-xl p-4 text-center">
                <p class="text-xs text-secondary mb-1">Peso Total</p>
                <p class="text-2xl font-bold text-neutral">{{ formatNumber(resumenCartera.pesoTotal / 1000) }}</p>
                <p class="text-xs text-tertiary">toneladas</p>
              </div>
              <div class="bg-hover border border-border rounded-xl p-4 text-center">
                <p class="text-xs text-secondary mb-1">Rentabilidad Prom.</p>
                <p class="text-2xl font-bold text-success">+{{ resumenCartera.rentabilidadPromedio }}%</p>
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
                    <th class="px-4 py-3 text-left text-xs font-semibold text-neutral">Acciones</th>
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
                        class="px-2 py-1 rounded-lg text-xs font-bold border-2"
                        :class="{
                          'border-success bg-success/10 text-success': conc.mineralPrincipal === 'Zinc',
                          'border-info bg-info/10 text-info': conc.mineralPrincipal === 'Plomo',
                          'border-warning bg-warning/10 text-warning': conc.mineralPrincipal === 'Plata'
                        }"
                      >
                        {{ conc.mineralPrincipal }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-sm text-neutral">{{ formatNumber(conc.pesoFinal) }} kg</td>
                    <td class="px-4 py-3 text-sm text-neutral">{{ formatCurrency(conc.valorCompra) }}</td>
                    <td class="px-4 py-3 text-sm font-semibold text-neutral">{{ formatCurrency(conc.valorizacionActual) }}</td>
                    <td class="px-4 py-3 text-sm font-semibold text-success">+{{ formatCurrency(conc.ganancia) }}</td>
                    <td class="px-4 py-3 text-sm font-bold text-success">+{{ conc.rentabilidad }}%</td>
                    <td class="px-4 py-3 text-sm text-secondary">{{ conc.diasEnCartera }}</td>
                    <td class="px-4 py-3">
                      <button class="btn-outline text-xs py-1 px-3">
                        <Eye class="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Análisis de Compras -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Compras por Mes -->
          <div class="card-flat">
            <div class="p-6 border-b border-border">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <BarChart3 class="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 class="font-bold text-neutral text-lg">Compras Mensuales</h3>
                  <p class="text-sm text-secondary">Últimos 6 meses</p>
                </div>
              </div>
            </div>
            <div class="p-6">
              <div class="space-y-4">
                <div v-for="item in comprasPorMes" :key="item.mes" class="space-y-2">
                  <div class="flex items-center justify-between text-sm">
                    <span class="font-medium text-neutral">{{ item.mes }}</span>
                    <div class="flex items-center gap-3 text-xs">
                      <span class="text-secondary">{{ item.cantidadLiquidaciones }} compras</span>
                      <span class="font-bold text-neutral">{{ formatCurrency(item.inversionTotal) }}</span>
                    </div>
                  </div>
                  <div class="relative h-10 bg-hover rounded-lg overflow-hidden border border-border">
                    <div 
                      class="absolute inset-y-0 left-0 bg-primary rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                      :style="{ width: `${(Number(item.inversionTotal) / maxCompras) * 100}%` }"
                    >
                      <span class="text-xs text-white font-medium">{{ formatNumber(item.pesoTotal / 1000) }} ton</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Compras por Socio -->
          <div class="card-flat">
            <div class="p-6 border-b border-border">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Award class="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 class="font-bold text-neutral text-lg">Top Proveedores</h3>
                  <p class="text-sm text-secondary">Mejores socios</p>
                </div>
              </div>
            </div>
            <div class="p-6 space-y-4">
              <div
                v-for="(socio, index) in comprasPorSocio"
                :key="socio.socioNombre"
                class="bg-hover border border-border rounded-xl p-4"
              >
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <div 
                      class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg border-2"
                      :class="{
                        'border-warning bg-warning/10 text-warning': index === 0,
                        'border-neutral-secondary bg-neutral-secondary/10 text-neutral': index === 1,
                        'border-accent bg-accent/10 text-accent': index === 2
                      }"
                    >
                      {{ index + 1 }}
                    </div>
                    <div>
                      <p class="font-bold text-neutral">{{ socio.socioNombre }}</p>
                      <p class="text-xs text-secondary">{{ socio.cantidadCompras }} compras</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-lg font-bold text-neutral">{{ formatCurrency(socio.montoTotal) }}</p>
                    <p class="text-xs text-secondary">{{ formatNumber(socio.pesoTotal / 1000) }} ton</p>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3 text-xs">
                  <div class="bg-background rounded-lg p-2 border border-border">
                    <p class="text-tertiary mb-1">Precio promedio</p>
                    <p class="font-semibold text-neutral">{{ formatCurrency(socio.precioPromedio) }}/ton</p>
                  </div>
                  <div class="bg-background rounded-lg p-2 border border-border">
                    <p class="text-tertiary mb-1">Confiabilidad</p>
                    <div class="flex items-center gap-2">
                      <div class="flex-1 h-2 bg-border rounded-full overflow-hidden">
                        <div 
                          class="h-full bg-success rounded-full"
                          :style="{ width: `${socio.confiabilidad}%` }"
                        ></div>
                      </div>
                      <span class="font-semibold text-neutral">{{ socio.confiabilidad }}%</span>
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
/* Animaciones para el pipeline */
.pipeline-card-enter-active,
.pipeline-card-leave-active {
  transition: all 0.3s ease;
}

.pipeline-card-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.pipeline-card-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>