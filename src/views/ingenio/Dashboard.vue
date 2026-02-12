<!-- src/views/ingenio/Dashboard.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useDashboardIngenioStore } from '@/stores/ingenio/dashboardStore.js'
import { useRouter } from 'vue-router'
import {
  Factory,
  Package,
  Clock,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertCircle,
  Activity,
  Gauge,
  FlaskConical,
  FileText,
  Calendar,
  BarChart3,
  PieChart,
  Zap,
  Droplet,
  Wind,
  Flame,
  Eye,
  Settings,
  ChevronRight,
  Filter,
  RefreshCw
} from 'lucide-vue-next'

// Store
const dashboardStore = useDashboardIngenioStore()

// Router
const router = useRouter()
// Estados reactivos
const operacionesData = computed(() => dashboardStore.dashboardData?.operacionesData || {
  concentradosEnProceso: 0,
  concentradosCompletadosHoy: 0,
  pesoTotalProcesamientoMes: 0,
  capacidadUtilizada: 0
})

const kanbanData = computed(() => dashboardStore.dashboardData?.kanbanData || {
  porIniciar: 0,
  enProceso: 0,
  esperandoPago: 0,
  listoParaVenta: 0
})

const financieroData = computed(() => dashboardStore.dashboardData?.financieroData || {
  tollPendienteCobro: 0,
  tollCobradoMes: 0,
  ingresoProyectadoMes: 0
})
const irAConcentrados = () => {
  router.push({ name: 'IngenioConcentrados' })
}
const irALotes = () => {
  router.push({ name: 'IngenioLotes' })
}
const lotesPendientesData = computed(() => dashboardStore.dashboardData?.lotesPendientesData || {
  pendienteAprobacion: 0,
  transporteCompleto: 0
})

const kanbanColumnas = computed(() => dashboardStore.dashboardData?.kanbanColumnas || [])

const procesosPlanta = computed(() => dashboardStore.dashboardData?.procesosPlanta || [])

const capacidadPlanta = computed(() => dashboardStore.dashboardData?.capacidadPlanta || {
  capacidadMaxima: 0,
  procesamientoActual: 0,
  utilizacion: 0,
  proyeccionDia: 0
})

const turnoActual = computed(() => dashboardStore.dashboardData?.turnoActual || {
  turno: 'tarde',
  horaInicio: new Date(),
  horaFin: new Date(),
  operadores: 0,
  concentradosProcesados: 0
})

const alertasOperacionales = computed(() => dashboardStore.dashboardData?.alertasOperacionales || [])

const liquidacionesToll = computed(() => dashboardStore.dashboardData?.liquidacionesToll || {
  pendientes: [],
  pagadasRecientes: [],
  estadisticas: {
    totalPendienteCobro: 0,
    promedioTiempoCobranza: 0,
    tasaCobranza: 0,
    ingresosUltimos30Dias: 0
  }
})

const produccionDiaria = computed(() => dashboardStore.dashboardData?.produccionDiaria || [])

const produccionPorMineral = computed(() => dashboardStore.dashboardData?.produccionPorMineral || [])

const lotesDisponibles = computed(() => dashboardStore.dashboardData?.lotesDisponibles || [])

// Computed
const maxProduccion = computed(() => {
  if (!produccionDiaria.value || produccionDiaria.value.length === 0) return 1
  return Math.max(...produccionDiaria.value.map(d => Math.max(d.concentradosCreados, d.concentradosFinalizados)))
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB'
  }).format(value)
}

const formatNumber = (value) => {
  return new Intl.NumberFormat('es-BO').format(value)
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short'
  }).format(d)
}

const formatTime = (datetime) => {
  if (!datetime) return ''
  const d = new Date(datetime)
  return d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
}

const getProcesoIcon = (nombre) => {
  const icons = {
    'Chancado': Zap,
    'Molienda': Activity,
    'Flotación': Droplet,
    'Secado': Flame
  }
  return icons[nombre] || Activity
}

const getSeveridadColor = (severidad) => {
  const colors = {
    alta: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
    media: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10',
    baja: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10'
  }
  return colors[severidad] || colors.baja
}

const getPrioridadColor = (prioridad) => {
  const colors = {
    alta: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400',
    media: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400',
    baja: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-400'
  }
  return colors[prioridad] || colors.baja
}

const getKanbanColor = (id) => {
  const colors = {
    'por-iniciar': 'bg-neutral-secondary',
    'en-proceso': 'bg-accent',
    'esperando-reporte': 'bg-warning',
    'listo-liquidacion': 'bg-success'
  }
  return colors[id] || 'bg-neutral-secondary'
}

const cargarDatos = async () => {
  await dashboardStore.fetchDashboard()
}

onMounted(() => {
  console.log('Dashboard Ingenio montado')
  cargarDatos()
})
</script>

<template>
  <AppLayout>
    <div class="space-y-6 pb-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-neutral">Panel de Procesamiento</h1>
          <p class="text-secondary mt-1">
            Control de planta y gestión de producción
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 text-sm text-secondary">
            <div class="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span>Planta operando</span>
          </div>
          <button 
            @click="cargarDatos" 
            class="btn-outline text-sm px-3 py-2 flex items-center gap-2"
            :disabled="dashboardStore.loading"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': dashboardStore.loading }" />
            <span class="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="dashboardStore.loading && !dashboardStore.dashboardData" class="flex items-center justify-center py-20">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-secondary">Cargando dashboard...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="dashboardStore.error" class="bg-surface border border-border rounded-xl p-4">
        <div class="flex items-start gap-3">
          <AlertCircle class="w-5 h-5 shrink-0 mt-0.5 text-error" />
          <div>
            <p class="font-semibold text-error">Error al cargar el dashboard</p>
            <p class="text-sm text-secondary">{{ dashboardStore.error }}</p>
          </div>
        </div>
      </div>

      <!-- Dashboard Content -->
      <template v-if="!dashboardStore.loading || dashboardStore.dashboardData">
        <!-- KPIs Principales -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- En Proceso -->
          <div class="bg-surface border border-border rounded-xl p-5 hover:shadow-md transition-all">
            <div class="flex items-start justify-between mb-4">
              <div class="w-11 h-11 bg-accent/10 rounded-lg flex items-center justify-center">
                <Factory class="w-5 h-5 text-accent" />
              </div>
              <span class="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                <ArrowUpRight class="w-3 h-3" />
                +{{ operacionesData.concentradosCompletadosHoy || 0 }}
              </span>
            </div>
            <div>
              <p class="text-sm text-secondary mb-1">En Proceso</p>
              <p class="text-2xl font-bold text-neutral">{{ operacionesData.concentradosEnProceso }}</p>
              <p class="text-xs text-tertiary mt-1">completados hoy</p>
            </div>
          </div>

          <!-- Capacidad Utilizada -->
          <div class="bg-surface border border-border rounded-xl p-5 hover:shadow-md transition-all">
            <div class="flex items-start justify-between mb-4">
              <div class="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center">
                <Gauge class="w-5 h-5 text-primary" />
              </div>
              <span class="text-xs text-secondary font-medium">
                {{ formatNumber(capacidadPlanta.procesamientoActual) }} ton
              </span>
            </div>
            <div>
              <p class="text-sm text-secondary mb-1">Capacidad Utilizada</p>
              <p class="text-2xl font-bold text-neutral">{{ Number(operacionesData.capacidadUtilizada).toFixed(1) }}%</p>
              <p class="text-xs text-tertiary mt-1">de {{ formatNumber(capacidadPlanta.capacidadMaxima) }} ton/día</p>
            </div>
          </div>

          <!-- Toll Pendiente Cobro -->
          <div class="bg-surface border border-border rounded-xl p-5 hover:shadow-md transition-all">
            <div class="flex items-start justify-between mb-4">
              <div class="w-11 h-11 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Clock class="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
              </div>
              <span class="text-xs text-secondary font-medium">
                {{ liquidacionesToll.pendientes.length }} pendientes
              </span>
            </div>
            <div>
              <p class="text-sm text-secondary mb-1">Toll por Cobrar</p>
              <p class="text-2xl font-bold text-neutral">{{ formatCurrency(financieroData.tollPendienteCobro) }}</p>
              <p class="text-xs text-tertiary mt-1">{{ Number(liquidacionesToll.estadisticas.promedioTiempoCobranza).toFixed(1) }} días promedio</p>
            </div>
          </div>

          <!-- Toll Cobrado Mes -->
          <div class="bg-surface border border-border rounded-xl p-5 hover:shadow-md transition-all">
            <div class="flex items-start justify-between mb-4">
              <div class="w-11 h-11 bg-success/10 rounded-lg flex items-center justify-center">
                <DollarSign class="w-5 h-5 text-success" />
              </div>
              <span 
                :class="[
                  'text-xs font-medium flex items-center gap-1',
                  'text-green-600 dark:text-green-400'
                ]"
              >
                <ArrowUpRight class="w-3 h-3" />
                {{ Number(liquidacionesToll.estadisticas.tasaCobranza).toFixed(1) }}%
              </span>
            </div>
            <div>
              <p class="text-sm text-secondary mb-1">Cobrado este Mes</p>
              <p class="text-2xl font-bold text-neutral">{{ formatCurrency(financieroData.tollCobradoMes) }}</p>
              <p class="text-xs text-tertiary mt-1">últimos 30 días</p>
            </div>
          </div>
        </div>

        <!-- Kanban de Procesamiento - MÁS COMPACTO -->
        <div class="bg-surface border border-border rounded-xl overflow-hidden">
          <div class="p-4 border-b border-border">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Package class="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 class="font-semibold text-neutral">Kanban de Procesamiento</h3>
                  <p class="text-xs text-secondary">
                    {{ kanbanData.porIniciar + kanbanData.enProceso + kanbanData.esperandoReporte + kanbanData.listoLiquidacion }} concentrados totales
                  </p>
                </div>
              </div>
              <button class="btn-outline text-xs py-1.5 px-3 flex items-center gap-2" @click="irAConcentrados">
                <Package class="w-3.5 h-3.5" />
                <span class="hidden sm:inline">Ver concentrados</span>
              </button>
            </div>
          </div>

          <!-- Tablero Kanban - COLUMNAS MÁS PEQUEÑAS -->
          <div class="p-4 overflow-x-auto">
            <div class="flex gap-3 min-w-max">
              <div
                v-for="columna in kanbanColumnas"
                :key="columna.id"
                class="shrink-0 w-64"
              >
                <!-- Header Columna - MÁS COMPACTO -->
                <div class="bg-hover border border-border rounded-t-xl p-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div 
                        :class="getKanbanColor(columna.id)"
                        class="w-2.5 h-2.5 rounded-full"
                      ></div>
                      <h4 class="font-semibold text-sm text-neutral">{{ columna.titulo }}</h4>
                    </div>
                    <span class="bg-surface border border-border px-2 py-0.5 rounded text-xs font-bold text-neutral">
                      {{ columna.concentrados.length }}
                    </span>
                  </div>
                </div>

                <!-- Cards de Concentrados - MÁS COMPACTOS -->
                <div class="bg-background border border-border border-t-0 rounded-b-xl p-2 space-y-2 min-h-[280px] max-h-[400px] overflow-y-auto scrollbar-thin">
                  <div
                    v-for="concentrado in columna.concentrados"
                    :key="concentrado.id"
                    class="bg-surface border border-border rounded-lg p-3 hover:shadow-md transition-all cursor-pointer"
                  >
                    <!-- Header Card - MÁS COMPACTO -->
                    <div class="flex items-start justify-between mb-2">
                      <div>
                        <p class="font-semibold text-neutral text-xs">{{ concentrado.id }}</p>
                        <p class="text-xs text-secondary">{{ concentrado.mineralPrincipal }}</p>
                      </div>
                      <span 
                        :class="[getKanbanColor(columna.id), 'px-1.5 py-0.5 rounded text-xs font-medium text-white']"
                      >
                        {{ concentrado.progreso.porcentaje }}%
                      </span>
                    </div>

                    <!-- Info - MÁS COMPACTA -->
                    <div class="space-y-1.5 mb-2">
                      <div class="flex items-center justify-between text-xs">
                        <span class="text-tertiary">Socio:</span>
                        <span class="font-medium text-neutral truncate ml-2">{{ concentrado.socioNombre }}</span>
                      </div>
                      <div class="flex items-center justify-between text-xs">
                        <span class="text-tertiary">Peso:</span>
                        <span class="font-medium text-neutral">{{ formatNumber(concentrado.pesoInicial) }} kg</span>
                      </div>
                      <div class="flex items-center justify-between text-xs">
                        <span class="text-tertiary">Ingreso:</span>
                        <span class="font-medium text-neutral">{{ formatDate(concentrado.fechaCreacion) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Estado vacío -->
                  <div v-if="columna.concentrados.length === 0" class="flex items-center justify-center py-8">
                    <p class="text-xs text-tertiary">Sin concentrados</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Control de Planta + Cola de Entrada -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Control de Planta (2/3) -->
          <div class="lg:col-span-2 bg-surface border border-border rounded-xl overflow-hidden">
            <div class="p-5 border-b border-border">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Activity class="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 class="font-semibold text-neutral text-lg">Control de Planta</h3>
                  <p class="text-sm text-secondary">Estado de procesos en tiempo real</p>
                </div>
              </div>
            </div>

            <div class="p-5 space-y-4 max-h-[600px] overflow-y-auto scrollbar-custom">
              <!-- Turno Actual -->
              <div class="bg-hover border border-border rounded-xl p-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-11 h-11 bg-accent/10 rounded-lg flex items-center justify-center">
                      <Clock class="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p class="font-semibold text-neutral">Turno {{ turnoActual.turno.charAt(0).toUpperCase() + turnoActual.turno.slice(1) }}</p>
                      <p class="text-sm text-secondary">
                        {{ formatTime(turnoActual.horaInicio) }} - {{ formatTime(turnoActual.horaFin) }}
                      </p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-2xl font-bold text-neutral">{{ turnoActual.operadores }}</p>
                    <p class="text-xs text-secondary">Operadores</p>
                  </div>
                </div>
              </div>

              <!-- Procesos -->
              <div class="space-y-3">
                <div
                  v-for="proceso in procesosPlanta"
                  :key="proceso.nombre"
                  class="bg-hover border border-border rounded-xl p-4"
                >
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <component :is="getProcesoIcon(proceso.nombre)" class="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 class="font-semibold text-neutral">{{ proceso.nombre }}</h4>
                        <p class="text-xs text-secondary">{{ proceso.concentradosEnEtapa }} concentrados</p>
                      </div>
                    </div>
                    <div class="text-right">
                      <p class="text-lg font-bold text-neutral">{{ Number(proceso.eficiencia).toFixed(0) }}%</p>
                      <p class="text-xs text-secondary">Eficiencia</p>
                    </div>
                  </div>

                  <!-- Barra de Utilización -->
                  <div class="mb-3">
                    <div class="flex items-center justify-between text-xs mb-1">
                      <span class="text-secondary">Utilización</span>
                      <span class="font-medium text-neutral">
                        {{ Number(proceso.utilizado).toFixed(0) }} / {{ Number(proceso.capacidadMaxima).toFixed(0) }} ton/h
                      </span>
                    </div>
                    <div class="h-2 bg-background rounded-full overflow-hidden">
                      <div 
                        class="h-full bg-primary rounded-full transition-all duration-500"
                        :style="{ width: `${(Number(proceso.utilizado) / Number(proceso.capacidadMaxima)) * 100}%` }"
                      ></div>
                    </div>
                  </div>

                  <!-- Detalles -->
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <p class="text-xs text-tertiary mb-0.5">Tiempo promedio</p>
                      <p class="text-sm text-neutral font-medium">{{ Number(proceso.tiempoPromedioEtapa).toFixed(1) }} hrs</p>
                    </div>
                    <div>
                      <p class="text-xs text-tertiary mb-0.5">Próx. mantenimiento</p>
                      <p class="text-sm text-neutral font-medium">{{ formatDate(proceso.proximoMantenimiento) }}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Cola de Entrada (1/3) -->
          <div class="bg-surface border border-border rounded-xl overflow-hidden">
            <div class="p-4 border-b border-border">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Package class="w-5 h-5 text-primary" />
                  <h3 class="font-semibold text-neutral">Cola de Entrada</h3>
                </div>
                <button class="btn-outline text-sm py-2 px-3 flex items-center gap-2" @click="irALotes">
                  <Package class="w-4 h-4" />
                  <span class="hidden sm:inline">Ir a mis concentrados</span>
                </button>
              </div>


            </div>

            <div class="p-4 space-y-3 max-h-[600px] overflow-y-auto scrollbar-custom">
              <div
                v-for="lote in lotesDisponibles"
                :key="lote.id"
                class="bg-hover border border-border rounded-lg p-3"
              >
                <div class="flex items-start justify-between mb-2">
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm text-neutral">{{ lote.id }}</p>
                    <p class="text-xs text-secondary truncate">{{ lote.socioNombre }}</p>
                  </div>
                  <span 
                    :class="[getPrioridadColor(lote.prioridad), 'px-2 py-0.5 rounded text-xs font-medium ml-2']"
                  >
                    {{ lote.prioridad.toUpperCase() }}
                  </span>
                </div>

                <div class="space-y-1.5 mb-3">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-tertiary">Mineral:</span>
                    <div class="flex items-center gap-1">
                      <span 
                        v-for="mineral in lote.minerales" 
                        :key="mineral"
                        class="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium"
                      >
                        {{ mineral }}
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-tertiary">Peso:</span>
                    <span class="font-medium text-neutral">{{ formatNumber(lote.pesoReal) }} kg</span>
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-tertiary">Esperando:</span>
                    <span class="font-medium text-neutral">{{ lote.diasEspera }} días</span>
                  </div>
                </div>

                <div class="p-2 bg-surface rounded-lg border border-border mb-3">
                  <p class="text-xs text-secondary">
                    <strong>Est.:</strong> {{ lote.concentradosEstimados }} concentrados en {{ Number(lote.tiempoProcesamientoEstimado).toFixed(0) }}h
                  </p>
                </div>
              </div>

              <!-- Estado vacío -->
              <div v-if="lotesDisponibles.length === 0" class="text-center py-12">
                <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle class="w-8 h-8 text-primary" />
                </div>
                <p class="text-sm text-secondary">No hay lotes en espera</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Análisis de Producción - PRODUCCIÓN POR MINERAL MÁS COMPACTA -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Producción Diaria - 2/3 -->
          <div class="lg:col-span-2 bg-surface border border-border rounded-xl overflow-hidden">
            <div class="p-5 border-b border-border">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BarChart3 class="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 class="font-semibold text-neutral text-lg">Producción Diaria</h3>
                  <p class="text-sm text-secondary">Última semana</p>
                </div>
              </div>
            </div>
            <div class="p-5">
              <div v-if="produccionDiaria.length > 0" class="space-y-4">
                <div v-for="item in produccionDiaria" :key="item.fecha" class="space-y-2">
                  <div class="flex items-center justify-between text-sm">
                    <span class="font-medium text-neutral">{{ item.fecha }}</span>
                    <div class="flex items-center gap-3">
                      <span class="text-xs text-secondary">{{ Number(item.pesoTotalProcesado).toFixed(1) }} ton</span>
                      <span class="font-semibold text-neutral">{{ item.concentradosCreados + item.concentradosFinalizados }}</span>
                    </div>
                  </div>
                  <div class="relative h-9 bg-hover rounded-lg overflow-hidden">
                    <div 
                      class="absolute inset-y-0 left-0 bg-accent rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                      :style="{ width: `${(item.concentradosCreados / maxProduccion) * 100}%` }"
                    >
                      <span v-if="item.concentradosCreados > 0" class="text-xs text-white font-medium">{{ item.concentradosCreados }}</span>
                    </div>
                    <div 
                      class="absolute inset-y-0 bg-success rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                      :style="{ 
                        left: `${(item.concentradosCreados / maxProduccion) * 100}%`,
                        width: `${(item.concentradosFinalizados / maxProduccion) * 100}%` 
                      }"
                    >
                      <span v-if="item.concentradosFinalizados > 0" class="text-xs text-white font-medium">{{ item.concentradosFinalizados }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-12">
                <p class="text-secondary">No hay datos de producción</p>
              </div>

              <!-- Leyenda -->
              <div class="flex items-center gap-6 mt-6 pt-5 border-t border-border">
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 bg-accent rounded"></div>
                  <span class="text-xs text-secondary">Creados</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 bg-success rounded"></div>
                  <span class="text-xs text-secondary">Finalizados</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Distribución por Mineral - 1/3 MÁS COMPACTO Y HORIZONTAL -->
          <div class="bg-surface border border-border rounded-xl overflow-hidden">
            <div class="p-4 border-b border-border">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <PieChart class="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 class="font-semibold text-neutral">Por Mineral</h3>
                  <p class="text-xs text-secondary">Distribución actual</p>
                </div>
              </div>
            </div>
            <div class="p-4">
              <div v-if="produccionPorMineral.length > 0" class="space-y-4">
                <!-- Vista Compacta Horizontal para Zn y Pb -->
                <div class="grid grid-cols-2 gap-3">
                  <div 
                    v-for="item in produccionPorMineral" 
                    :key="item.mineral"
                    class="bg-hover border border-border rounded-lg p-3"
                  >
                    <div class="flex items-center gap-2 mb-2">
                      <div 
                        class="w-8 h-8 rounded flex items-center justify-center font-bold text-white text-xs"
                        :class="{
                          'bg-success': item.mineral === 'Zn',
                          'bg-accent': item.mineral === 'Pb',
                          'bg-warning': item.mineral === 'Ag'
                        }"
                      >
                        {{ item.mineral }}
                      </div>
                      <div class="flex-1">
                        <p class="text-xs font-semibold text-neutral">{{ item.cantidad }}</p>
                        <p class="text-xs text-secondary">conc.</p>
                      </div>
                    </div>
                    <div class="space-y-1">
                      <div class="flex items-center justify-between text-xs">
                        <span class="text-tertiary">Peso:</span>
                        <span class="font-medium text-neutral">{{ formatNumber(item.pesoTotal) }} kg</span>
                      </div>
                      <div class="h-1.5 bg-background rounded-full overflow-hidden">
                        <div 
                          class="h-full rounded-full transition-all duration-500"
                          :class="{
                            'bg-success': item.mineral === 'Zn',
                            'bg-accent': item.mineral === 'Pb',
                            'bg-warning': item.mineral === 'Ag'
                          }"
                          :style="{ width: `${item.porcentaje}%` }"
                        ></div>
                      </div>
                      <p class="text-xs text-center text-secondary font-medium">{{ item.porcentaje }}%</p>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-8">
                <p class="text-sm text-secondary">No hay datos de producción</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Liquidaciones Toll -->
        <div class="bg-surface border border-border rounded-xl overflow-hidden">
          <div class="p-5 border-b border-border">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText class="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 class="font-semibold text-neutral text-lg">Liquidaciones de Toll</h3>
                  <p class="text-sm text-secondary">Gestión de cobros por procesamiento</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold text-primary">{{ liquidacionesToll.pendientes.length }}</p>
                <p class="text-xs text-secondary">Pendientes</p>
              </div>
            </div>
          </div>

          <div class="p-5">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Pendientes de Pago -->
              <div>
                <h4 class="font-semibold text-neutral mb-4 flex items-center gap-2">
                  <Clock class="w-4 h-4 text-yellow-600" />
                  Esperando Pago
                </h4>
                <div class="space-y-3">
                  <div
                    v-for="liq in liquidacionesToll.pendientes"
                    :key="liq.id"
                    class="bg-hover border border-border rounded-xl p-4"
                  >
                    <div class="flex items-start justify-between mb-3">
                      <div>
                        <p class="font-semibold text-neutral">{{ liq.socioNombre }}</p>
                        <p class="text-xs text-secondary">Lotes: {{ liq.lotes.join(', ') }}</p>
                      </div>
                      <span class="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-400 rounded-lg text-xs font-medium">
                        {{ liq.diasPendiente }} días
                      </span>
                    </div>

                    <div class="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p class="text-xs text-tertiary mb-0.5">Peso Total</p>
                        <p class="text-sm text-neutral font-medium">{{ formatNumber(liq.pesoTotal) }} kg</p>
                      </div>
                      <div>
                        <p class="text-xs text-tertiary mb-0.5">Costo Procesam.</p>
                        <p class="text-sm text-neutral font-medium">{{ formatCurrency(liq.costoProcesamiento) }}</p>
                      </div>
                    </div>

                    <div class="p-3 bg-surface rounded-lg border border-border mb-3">
                      <div class="flex items-center justify-between mb-2 text-xs">
                        <span class="text-secondary">Servicios adicionales:</span>
                        <span class="font-medium text-neutral">{{ formatCurrency(liq.serviciosAdicionales) }}</span>
                      </div>
                      <div class="flex items-center justify-between border-t border-border pt-2">
                        <span class="text-sm font-semibold text-neutral">Total:</span>
                        <span class="text-lg font-bold text-primary">{{ formatCurrency(liq.totalBob) }}</span>
                      </div>
                    </div>

                    <button class="w-full btn-outline text-xs py-2">
                      Enviar Recordatorio
                    </button>
                  </div>

                  <div v-if="liquidacionesToll.pendientes.length === 0" class="text-center py-8">
                    <p class="text-sm text-secondary">No hay liquidaciones pendientes</p>
                  </div>
                </div>
              </div>

              <!-- Pagadas Recientes + Estadísticas -->
              <div class="space-y-6">
                <!-- Pagadas Recientes -->
                <div>
                  <h4 class="font-semibold text-neutral mb-4 flex items-center gap-2">
                    <CheckCircle class="w-4 h-4 text-success" />
                    Pagadas Recientes
                  </h4>
                  <div class="space-y-3">
                    <div
                      v-for="liq in liquidacionesToll.pagadasRecientes"
                      :key="liq.id"
                      class="bg-hover border border-border rounded-xl p-4"
                    >
                      <div class="flex items-start justify-between mb-2">
                        <div>
                          <p class="font-semibold text-neutral">{{ liq.socioNombre }}</p>
                          <p class="text-xs text-secondary">{{ formatDate(liq.fechaPago) }}</p>
                        </div>
                        <span class="text-lg font-bold text-success">
                          {{ formatCurrency(liq.montoBob) }}
                        </span>
                      </div>
                      <p class="text-xs text-tertiary">Método: {{ liq.metodoPago }}</p>
                    </div>

                    <div v-if="liquidacionesToll.pagadasRecientes.length === 0" class="text-center py-8">
                      <p class="text-sm text-secondary">No hay pagos recientes</p>
                    </div>
                  </div>
                </div>

                <!-- Estadísticas -->
                <div>
                  <h4 class="font-semibold text-neutral mb-4">Estadísticas</h4>
                  <div class="grid grid-cols-2 gap-3">
                    <div class="bg-hover border border-border rounded-xl p-4 text-center">
                      <p class="text-2xl font-bold text-neutral">{{ Number(liquidacionesToll.estadisticas.promedioTiempoCobranza).toFixed(1) }}</p>
                      <p class="text-xs text-secondary">Días promedio</p>
                    </div>
                    <div class="bg-hover border border-border rounded-xl p-4 text-center">
                      <p class="text-2xl font-bold text-neutral">{{ Number(liquidacionesToll.estadisticas.tasaCobranza).toFixed(1) }}%</p>
                      <p class="text-xs text-secondary">Tasa cobranza</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </AppLayout>
</template>

<style scoped>
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

/* Scrollbar personalizado para las columnas del Kanban */
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 2px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}
</style>