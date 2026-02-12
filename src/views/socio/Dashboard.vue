<!-- src/views/socio/Dashboard.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardStore } from '@/stores/socio/dashboardStore'
import AppLayout from '@/components/layout/AppLayout.vue'
import { 
  TrendingUp, 
  Package, 
  Truck, 
  DollarSign, 
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  BarChart3,
  PieChart,
  Eye,
  FileText,
  RefreshCw,
  Loader,
  TrendingDown
} from 'lucide-vue-next'

const router = useRouter()
const dashboardStore = useDashboardStore()

onMounted(async () => {
  await dashboardStore.fetchDashboard()
})

// Computed
const financialData = computed(() => dashboardStore.dashboardData?.financialData || {})
const operationsData = computed(() => dashboardStore.dashboardData?.operationsData || {})
const camionesEnRuta = computed(() => dashboardStore.dashboardData?.camionesEnRuta || [])
const alertas = computed(() => dashboardStore.dashboardData?.alertas || [])
const concentrados = computed(() => dashboardStore.dashboardData?.concentrados || [])
const liquidacionesPendientes = computed(() => dashboardStore.dashboardData?.liquidacionesPendientes || {})
const ingresosMensuales = computed(() => dashboardStore.dashboardData?.ingresosMensuales || [])
const ingresosPorMineral = computed(() => dashboardStore.dashboardData?.ingresosPorMineral || [])

const maxIngreso = computed(() => {
  if (!ingresosMensuales.value.length) return 1
  return Math.max(...ingresosMensuales.value.map(m => 
    (m.pagoToll || 0) + (m.ingresoVentaConcentrado || 0) + (m.ingresoVentaComplejo || 0)
  ))
})

const totalIngresoGeneral = computed(() => {
  return ingresosMensuales.value.reduce((sum, m) => 
    sum + (m.pagoToll || 0) + (m.ingresoVentaConcentrado || 0) + (m.ingresoVentaComplejo || 0), 0
  )
})

const porcentajesPorTipo = computed(() => {
  const total = totalIngresoGeneral.value
  if (total === 0) return { toll: 0, concentrado: 0, complejo: 0 }
  
  const totalToll = ingresosMensuales.value.reduce((sum, m) => sum + (m.pagoToll || 0), 0)
  const totalConcentrado = ingresosMensuales.value.reduce((sum, m) => sum + (m.ingresoVentaConcentrado || 0), 0)
  const totalComplejo = ingresosMensuales.value.reduce((sum, m) => sum + (m.ingresoVentaComplejo || 0), 0)
  
  return {
    toll: (totalToll / total) * 100,
    concentrado: (totalConcentrado / total) * 100,
    complejo: (totalComplejo / total) * 100
  }
})

const formatCurrency = (value) => {
  if (!value) return 'Bs. 0.00'
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB'
  }).format(value)
}

const formatNumber = (value) => {
  if (!value) return '0'
  return new Intl.NumberFormat('es-BO').format(value)
}

const getAlertColor = (tipo) => {
  const colors = {
    critico: 'bg-red-100 dark:bg-red-900 border-red-500 text-red-700 dark:text-red-400',
    advertencia: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-400',
    info: 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-white dark:text-white'
  }
  return colors[tipo] || colors.info
}

const getEstadoColor = (estado) => {
  const colors = {
    'listo_para_venta': 'bg-green-500',
    'en_venta': 'bg-blue-500',
    'esperando_pago': 'bg-yellow-500',
    'en_proceso': 'bg-purple-500'
  }
  return colors[estado] || 'bg-gray-500'
}

const verDetalleLote = (loteId) => {
  router.push({ name: 'SocioLotes', query: { lote: loteId } })
}

const verDetalleConcentrado = (concentradoId) => {
  router.push({ name: 'SocioConcentrados', query: { concentrado: concentradoId } })
}

const handleRefresh = async () => {
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
</script>

<template>
  <AppLayout>
    <div v-if="dashboardStore.loading && !dashboardStore.dashboardData" class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
        <p class="text-secondary">Cargando dashboard...</p>
      </div>
    </div>

    <div v-else-if="dashboardStore.error" class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center max-w-md">
        <div class="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-4">
          <AlertCircle class="w-10 h-10 text-white" />
        </div>
        <h3 class="text-xl font-semibold text-neutral mb-2">Error al cargar dashboard</h3>
        <p class="text-secondary mb-4">{{ dashboardStore.error }}</p>
        <button @click="handleRefresh" class="btn">
          Reintentar
        </button>
      </div>
    </div>

    <div v-else class="space-y-4 pb-6">
      <!-- Header -->
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-neutral">Dashboard</h1>
            <p class="text-secondary mt-1 text-sm sm:text-base">
              Resumen de tus operaciones mineras
            </p>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 text-sm text-secondary">
              <Clock class="w-4 h-4" />
              <span>{{ tiempoDesdeActualizacion }}</span>
            </div>
            <button
              @click="handleRefresh"
              :disabled="dashboardStore.loading"
              class="btn-secondary flex items-center gap-2"
              :class="{ 'opacity-50 cursor-not-allowed': dashboardStore.loading }"
            >
              <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': dashboardStore.loading }" />
              <span class="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>

        <!-- KPIs Principales - Financiero -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-500 center shrink-0">
                <AlertCircle class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Pendiente de Cobro</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral truncate">
                  {{ formatCurrency(financialData.totalPendienteCobro) }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500 center shrink-0">
                <DollarSign class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="text-xs sm:text-sm font-medium text-secondary">Cobrado este Mes</h3>
                  <span 
                    v-if="financialData.comparativoMesAnterior !== 0"
                    class="text-xs px-1.5 py-0.5 rounded"
                    :class="financialData.comparativoMesAnterior > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'"
                  >
                    {{ financialData.comparativoMesAnterior > 0 ? '+' : '' }}{{ Math.abs(financialData.comparativoMesAnterior || 0).toFixed(1) }}%
                  </span>
                </div>
                <p class="text-xl sm:text-2xl font-bold text-neutral truncate">
                  {{ formatCurrency(financialData.totalCobradoMesActual) }}
                </p>
                <p class="text-xs text-tertiary">vs. mes anterior</p>
              </div>
            </div>
          </div>

          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500 center shrink-0">
                <TrendingUp class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Proyección Mensual</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral truncate">
                  {{ formatCurrency(financialData.proyeccionMesActual) }}
                </p>
                <p class="text-xs text-tertiary">Estimado fin de mes</p>
              </div>
            </div>
          </div>

          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500 center shrink-0">
                <Package class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Lotes Activos</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ operationsData.lotesActivos }}
                </p>
                <p class="text-xs text-tertiary">
                  {{ operationsData.lotesEnTransporte }} en transporte
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenedor Principal: Camiones + Alertas -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Camiones en Ruta -->
        <div class="lg:col-span-2 bg-base border border-border rounded-xl overflow-hidden shadow-sm">
          <div class="p-4 border-b border-border">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg center shrink-0">
                <Truck class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="font-bold text-neutral text-base sm:text-lg">Camiones en Ruta</h3>
                <p class="text-xs sm:text-sm text-secondary">{{ camionesEnRuta.length }} camiones en movimiento</p>
              </div>
            </div>
          </div>
          
          <div class="p-4">
            <div v-if="camionesEnRuta.length > 0" class="space-y-3">
              <div
                v-for="camion in camionesEnRuta.slice(0, 3)"
                :key="camion.asignacionId"
                class="bg-hover rounded-xl p-4 border border-border hover:shadow-md transition-shadow cursor-pointer"
                @click="verDetalleLote(camion.loteId)"
              >
                <div class="flex items-start gap-4">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-500 center shrink-0">
                    <Truck class="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <p class="font-semibold text-neutral">{{ camion.lotecodigo }}</p>
                        <p class="text-sm text-secondary">Camión #{{ camion.numeroCamion }} - {{ camion.placaVehiculo }}</p>
                      </div>
                      <span class="px-2 py-1 rounded-lg bg-blue-500 text-white text-xs font-medium shrink-0">
                        {{ camion.progreso }}%
                      </span>
                    </div>

                    <div class="space-y-2">
                      <div class="flex items-center gap-2 text-sm">
                        <MapPin class="w-4 h-4 text-secondary shrink-0" />
                        <span class="text-secondary truncate">{{ camion.ultimaUbicacionTexto }}</span>
                      </div>

                      <div class="h-2 bg-border rounded-full overflow-hidden">
                        <div 
                          class="h-full bg-blue-500 rounded-full transition-all duration-500"
                          :style="{ width: `${camion.progreso}%` }"
                        ></div>
                      </div>

                      <div class="flex justify-between text-xs text-tertiary">
                        <span>{{ camion.estadoViaje }}</span>
                        <span>{{ camion.minutosTranscurridos }} min</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="camionesEnRuta.length > 3" class="text-center pt-2">
                <button
                  @click="router.push({ name: 'SocioLotes' })"
                  class="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  Ver todos los camiones ({{ camionesEnRuta.length }})
                </button>
              </div>
            </div>

            <div v-else class="text-center py-12">
              <div class="w-16 h-16 rounded-full bg-primary/10 center mx-auto mb-4">
                <Truck class="w-8 h-8 text-primary" />
              </div>
              <p class="text-secondary">No hay camiones en movimiento</p>
            </div>
          </div>
        </div>

        <!-- Panel de Alertas y Operaciones -->
        <div class="space-y-4">
          <!-- Alertas -->
          <div class="bg-base border border-border rounded-xl overflow-hidden shadow-sm">
            <div class="p-4 border-b border-border">
              <div class="flex items-center gap-2">
                <AlertCircle class="w-5 h-5 text-primary" />
                <h3 class="font-bold text-neutral">Alertas</h3>
                <span class="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {{ alertas.length }}
                </span>
              </div>
            </div>
            <div class="p-4 space-y-3 max-h-[400px] overflow-y-auto scrollbar-custom">
              <div
                v-for="alerta in alertas"
                :key="alerta.id"
                :class="getAlertColor(alerta.tipo)"
                class="p-4 rounded-xl border-l-4"
              >
                <div class="flex items-start gap-3">
                  <AlertCircle class="w-5 h-5 shrink-0 mt-0.5" />
                  <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-sm mb-1 text-white">{{ alerta.titulo }}</h4>
                    <p class="text-xs opacity-90 mb-2">{{ alerta.descripcion }}</p>

                  </div>
                </div>
              </div>

              <div v-if="alertas.length === 0" class="text-center py-8">
                <CheckCircle class="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p class="text-sm text-secondary">No hay alertas</p>
              </div>
            </div>
          </div>

          <!-- Resumen de Operaciones -->
          <div class="bg-base border border-border rounded-xl overflow-hidden shadow-sm">
            <div class="p-4 border-b border-border">
              <div class="flex items-center gap-2">
                <Package class="w-5 h-5 text-primary" />
                <h3 class="font-bold text-neutral">Estado de Operaciones</h3>
              </div>
            </div>
            <div class="p-4 space-y-3">
              <div class="flex items-center justify-between p-3 bg-hover rounded-xl">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-blue-500/10 rounded-lg center">
                    <Truck class="w-5 h-5 text-blue-500" />
                  </div>
                  <span class="text-sm font-medium text-neutral">En Transporte</span>
                </div>
                <span class="text-lg font-bold text-neutral">{{ operationsData.lotesEnTransporte }}</span>
              </div>

              <div class="flex items-center justify-between p-3 bg-hover rounded-xl">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-purple-500/10 rounded-lg center">
                    <Loader class="w-5 h-5 text-purple-500" />
                  </div>
                  <span class="text-sm font-medium text-neutral">En Proceso</span>
                </div>
                <span class="text-lg font-bold text-neutral">{{ operationsData.lotesEnProceso }}</span>
              </div>

              <div class="flex items-center justify-between p-3 bg-hover rounded-xl">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-green-500/10 rounded-lg center">
                    <CheckCircle class="w-5 h-5 text-green-500" />
                  </div>
                  <span class="text-sm font-medium text-neutral">Listos Venta</span>
                </div>
                <span class="text-lg font-bold text-neutral">{{ operationsData.concentradosListosVenta }}</span>
              </div>

              <div class="flex items-center justify-between p-3 bg-hover rounded-xl">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-yellow-500/10 rounded-lg center">
                    <DollarSign class="w-5 h-5 text-yellow-500" />
                  </div>
                  <span class="text-sm font-medium text-neutral">En Venta</span>
                </div>
                <span class="text-lg font-bold text-neutral">{{ operationsData.concentradosEnVenta }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Gráficos Financieros -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Gráfico de Ventas de Concentrado (Principal) - Ocupa 2 columnas -->
        <div class="lg:col-span-2 bg-base border border-border rounded-xl overflow-hidden shadow-sm">
          <div class="p-4 border-b border-border">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-lg center shrink-0">
                  <BarChart3 class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h3 class="font-bold text-neutral text-base sm:text-lg">Venta de Concentrado</h3>
                  <p class="text-xs sm:text-sm text-secondary">Últimos 6 meses</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-xs text-secondary">Total período</p>
                <p class="text-sm font-bold text-green-600 dark:text-green-400">
                  {{ formatCurrency(ingresosMensuales.reduce((sum, m) => sum + (m.ingresoVentaConcentrado || 0), 0)) }}
                </p>
              </div>
            </div>
          </div>
          <div class="p-4 sm:p-6">
            <div v-if="ingresosMensuales.length > 0" class="space-y-3">
              <div v-for="item in ingresosMensuales" :key="item.mes" class="space-y-2">
                <div class="flex items-center justify-between text-sm">
                  <span class="font-medium text-neutral">{{ item.mes }}</span>
                  <span class="font-bold text-neutral">{{ formatCurrency(item.ingresoVentaConcentrado || 0) }}</span>
                </div>
                <div class="relative h-8 bg-hover rounded-lg overflow-hidden">
                  <div 
                    class="absolute inset-y-0 left-0 bg-linear-to-r from-green-500 to-green-600 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                    :style="{ width: `${((item.ingresoVentaConcentrado || 0) / maxIngreso) * 100}%` }"
                  >
                    <span v-if="item.ingresoVentaConcentrado > 0" class="text-xs text-white font-medium">
                      {{ ((item.ingresoVentaConcentrado / maxIngreso) * 100).toFixed(0) }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <p class="text-secondary">No hay datos de ingresos</p>
            </div>
          </div>
        </div>

        <!-- Distribución por Mineral + Tipo de Ingreso (compacto) -->
        <div class="space-y-4">
          <!-- Ingreso por Mineral -->
          <div class="bg-base border border-border rounded-xl overflow-hidden shadow-sm">
            <div class="p-4 border-b border-border">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-purple-500 rounded-lg center shrink-0">
                  <PieChart class="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 class="font-bold text-neutral text-sm">Por Mineral</h3>
                  <p class="text-xs text-secondary">Concentrados</p>
                </div>
              </div>
            </div>
            <div class="p-4">
              <div v-if="ingresosPorMineral.length > 0" class="space-y-3">
                <div
                  v-for="item in ingresosPorMineral"
                  :key="item.mineral"
                  class="space-y-2"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div 
                        class="w-8 h-8 rounded-lg center font-bold text-white text-xs"
                        :class="{
                          'bg-blue-500': item.mineral === 'Pb',
                          'bg-green-500': item.mineral === 'Zn',
                          'bg-yellow-500': item.mineral === 'Ag'
                        }"
                      >
                        {{ item.mineral }}
                      </div>
                      <span class="text-xs font-medium text-neutral">{{ item.porcentaje.toFixed(1) }}%</span>
                    </div>
                    <p class="text-xs font-semibold text-neutral">{{ formatCurrency(item.ingreso) }}</p>
                  </div>
                  <div class="h-2 bg-border rounded-full overflow-hidden">
                    <div 
                      class="h-full rounded-full transition-all duration-500"
                      :class="{
                        'bg-blue-500': item.mineral === 'Pb',
                        'bg-green-500': item.mineral === 'Zn',
                        'bg-yellow-500': item.mineral === 'Ag'
                      }"
                      :style="{ width: `${item.porcentaje}%` }"
                    ></div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-4">
                <p class="text-xs text-secondary">Sin datos</p>
              </div>
            </div>
          </div>

          <!-- Distribución por Tipo de Ingreso -->
          <div class="bg-base border border-border rounded-xl overflow-hidden shadow-sm">
            <div class="p-4 border-b border-border">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-blue-500 rounded-lg center shrink-0">
                  <TrendingUp class="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 class="font-bold text-neutral text-sm">Tipo de Ingreso</h3>
                  <p class="text-xs text-secondary">Distribución</p>
                </div>
              </div>
            </div>
            <div class="p-4">
              <div class="space-y-3">
                <!-- Venta Concentrado -->
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2">
                      <div class="w-3 h-3 bg-green-500 rounded"></div>
                      <span class="font-medium text-neutral">Concentrado</span>
                    </div>
                    <span class="font-bold text-neutral">{{ porcentajesPorTipo.concentrado.toFixed(1) }}%</span>
                  </div>
                  <div class="h-1.5 bg-border rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-green-500 rounded-full transition-all duration-500"
                      :style="{ width: `${porcentajesPorTipo.concentrado}%` }"
                    ></div>
                  </div>
                </div>

                <!-- Venta Complejo -->
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2">
                      <div class="w-3 h-3 bg-purple-500 rounded"></div>
                      <span class="font-medium text-neutral">Complejo</span>
                    </div>
                    <span class="font-bold text-neutral">{{ porcentajesPorTipo.complejo.toFixed(1) }}%</span>
                  </div>
                  <div class="h-1.5 bg-border rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-purple-500 rounded-full transition-all duration-500"
                      :style="{ width: `${porcentajesPorTipo.complejo}%` }"
                    ></div>
                  </div>
                </div>

                <!-- Pago Toll (egreso mostrado como negativo visualmente) -->
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2">
                      <div class="w-3 h-3 bg-red-500 rounded"></div>
                      <span class="font-medium text-neutral">Pago Toll</span>
                    </div>
                    <span class="font-bold text-red-600 dark:text-red-400">-{{ porcentajesPorTipo.toll.toFixed(1) }}%</span>
                  </div>
                  <div class="h-1.5 bg-border rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-red-500 rounded-full transition-all duration-500"
                      :style="{ width: `${porcentajesPorTipo.toll}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Gráfico de Venta Complejo y Pago Toll -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Venta de Complejo -->
        <div class="bg-base border border-border rounded-xl overflow-hidden shadow-sm">
          <div class="p-4 border-b border-border">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500 rounded-lg center shrink-0">
                  <Package class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h3 class="font-bold text-neutral text-base sm:text-lg">Venta de Complejo</h3>
                  <p class="text-xs sm:text-sm text-secondary">Ingresos secundarios</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-xs text-secondary">Total</p>
                <p class="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {{ formatCurrency(ingresosMensuales.reduce((sum, m) => sum + (m.ingresoVentaComplejo || 0), 0)) }}
                </p>
              </div>
            </div>
          </div>
          <div class="p-4 sm:p-6">
            <div v-if="ingresosMensuales.length > 0" class="space-y-4">
              <div 
                v-for="item in ingresosMensuales" 
                :key="`complejo-${item.mes}`"
                class="flex items-center gap-3"
              >
                <div class="w-12 text-xs font-medium text-secondary">{{ item.mes }}</div>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <div class="flex-1 h-6 bg-hover rounded-lg overflow-hidden">
                      <div 
                        class="h-full bg-linear-to-r from-purple-500 to-purple-600 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                        :style="{ width: `${((item.ingresoVentaComplejo || 0) / maxIngreso) * 100}%` }"
                      >
                        <span v-if="(item.ingresoVentaComplejo || 0) > 0" class="text-xs text-white font-medium">
                          {{ formatNumber(item.ingresoVentaComplejo) }}
                        </span>
                      </div>
                    </div>
                    <div class="w-24 text-right text-xs font-semibold text-neutral">
                      {{ formatCurrency(item.ingresoVentaComplejo || 0) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <p class="text-secondary">No hay datos</p>
            </div>
          </div>
        </div>

        <!-- Pago Toll (Egresos) -->
        <div class="bg-base border border-border rounded-xl overflow-hidden shadow-sm">
          <div class="p-4 border-b border-border">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-lg center shrink-0">
                  <TrendingDown class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h3 class="font-bold text-neutral text-base sm:text-lg">Pago de Toll</h3>
                  <p class="text-xs sm:text-sm text-secondary">Costos de procesamiento</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-xs text-secondary">Total</p>
                <p class="text-sm font-bold text-red-600 dark:text-red-400">
                  -{{ formatCurrency(ingresosMensuales.reduce((sum, m) => sum + (m.pagoToll || 0), 0)) }}
                </p>
              </div>
            </div>
          </div>
          <div class="p-4 sm:p-6">
            <div v-if="ingresosMensuales.length > 0" class="space-y-4">
              <div 
                v-for="item in ingresosMensuales" 
                :key="`toll-${item.mes}`"
                class="flex items-center gap-3"
              >
                <div class="w-12 text-xs font-medium text-secondary">{{ item.mes }}</div>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <div class="flex-1 h-6 bg-hover rounded-lg overflow-hidden">
                      <div 
                        class="h-full bg-linear-to-r from-red-500 to-red-600 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                        :style="{ width: `${((item.pagoToll || 0) / maxIngreso) * 100}%` }"
                      >
                        <span v-if="(item.pagoToll || 0) > 0" class="text-xs text-white font-medium">
                          {{ formatNumber(item.pagoToll) }}
                        </span>
                      </div>
                    </div>
                    <div class="w-24 text-right text-xs font-semibold text-red-600 dark:text-red-400">
                      -{{ formatCurrency(item.pagoToll || 0) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <p class="text-secondary">No hay datos</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline de Concentrados -->
      <div class="bg-base border border-border rounded-xl overflow-hidden shadow-sm">
        <div class="p-4 border-b border-border">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg center shrink-0">
              <Package class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h3 class="font-bold text-neutral text-base sm:text-lg">Concentrados en Proceso</h3>
              <p class="text-xs sm:text-sm text-secondary">{{ concentrados.length }} concentrados activos</p>
            </div>
          </div>
        </div>
        <div class="p-4 sm:p-6">
          <div v-if="concentrados.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="concentrado in concentrados"
              :key="concentrado.id"
              class="bg-hover border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
              @click="verDetalleConcentrado(concentrado.id)"
            >
              <div class="space-y-3">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-semibold text-neutral">{{ concentrado.codigo }}</p>
                    <p class="text-xs text-secondary">{{ concentrado.mineralPrincipal }}</p>
                  </div>
                  <span 
                    :class="getEstadoColor(concentrado.estado)"
                    class="px-2 py-1 rounded-lg text-xs font-medium text-white"
                  >
                    {{ concentrado.progreso.porcentajeCompletado }}%
                  </span>
                </div>

                <div class="mb-3">
                  <div class="flex items-center justify-between text-xs mb-1">
                    <span class="text-secondary">{{ concentrado.progreso.etapaActual }}</span>
                    <span v-if="concentrado.pesoFinal" class="font-medium text-neutral">{{ concentrado.pesoFinal }} kg</span>
                  </div>
                  <div class="h-2 bg-border rounded-full overflow-hidden">
                    <div 
                      :class="getEstadoColor(concentrado.estado)"
                      class="h-full rounded-full transition-all duration-500"
                      :style="{ width: `${concentrado.progreso.porcentajeCompletado}%` }"
                    ></div>
                  </div>
                </div>

                <div v-if="concentrado.liquidacionToll" class="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-500 rounded-lg p-2">
                  <p class="text-xs text-yellow-700 dark:text-yellow-400">
                    <strong>Toll pendiente:</strong> {{ formatCurrency(concentrado.liquidacionToll.monto) }}
                  </p>
                  <p class="text-xs text-yellow-600 dark:text-yellow-500">
                    {{ concentrado.liquidacionToll.diasPendiente }} días sin pagar
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8">
            <p class="text-secondary">No hay concentrados en proceso</p>
          </div>
        </div>
      </div>

      <!-- Liquidaciones Pendientes -->
      <div class="bg-base border border-border rounded-xl overflow-hidden shadow-sm">
        <div class="p-4 border-b border-border">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg center shrink-0">
                <FileText class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="font-bold text-neutral text-base sm:text-lg">Liquidaciones Pendientes</h3>
                <p class="text-xs sm:text-sm text-secondary">Acciones requeridas</p>
              </div>
            </div>
            <span class="text-xl sm:text-2xl font-bold text-primary">
              {{ liquidacionesPendientes.tollPendientePago + liquidacionesPendientes.ventasPendientesCierre + liquidacionesPendientes.ventasEsperandoPago }}
            </span>
          </div>
        </div>
        <div class="p-4 sm:p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-hover border border-border rounded-xl p-5">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 rounded-xl center shrink-0">
                  <XCircle class="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p class="text-xl sm:text-2xl font-bold text-neutral">{{ liquidacionesPendientes.tollPendientePago }}</p>
                  <p class="text-xs text-secondary">Toll pendiente pago</p>
                </div>
              </div>
              <p class="text-sm font-semibold text-neutral mb-3">{{ formatCurrency(liquidacionesPendientes.tollMontoTotal) }}</p>
              <button 
                @click="router.push({ name: 'SocioConcentrados' })"
                class="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors"
              >
                Revisar y Pagar
              </button>
            </div>

            <div class="bg-hover border border-border rounded-xl p-5">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 rounded-xl center shrink-0">
                  <Clock class="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p class="text-xl sm:text-2xl font-bold text-neutral">{{ liquidacionesPendientes.ventasPendientesCierre }}</p>
                  <p class="text-xs text-secondary">Ventas por cerrar</p>
                </div>
              </div>
              <p class="text-sm text-secondary mb-3">Esperando cotización favorable</p>
              <button 
                @click="router.push({ name: 'SocioVentaConcentrados' })"
                class="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors"
              >
                Ver Cotizaciones
              </button>
            </div>

            <div class="bg-hover border border-border rounded-xl p-5">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-xl center shrink-0">
                  <DollarSign class="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p class="text-xl sm:text-2xl font-bold text-neutral">{{ liquidacionesPendientes.ventasEsperandoPago }}</p>
                  <p class="text-xs text-secondary">Esperando pago</p>
                </div>
              </div>
              <p class="text-sm text-secondary mb-3">Ventas cerradas pendientes</p>

            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>