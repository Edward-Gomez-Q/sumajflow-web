<!-- src/views/ingenio/Dashboard.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useDashboardIngenioStore } from '@/stores/ingenio/dashboardStore.js'
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
  Filter
} from 'lucide-vue-next'

// Store
const dashboardStore = useDashboardIngenioStore()

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
  esperandoReporte: 0,
  listoLiquidacion: 0
})

const financieroData = computed(() => dashboardStore.dashboardData?.financieroData || {
  tollPendienteCobro: 0,
  tollCobradoMes: 0,
  ingresoProyectadoMes: 0
})

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
    alta: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
    media: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400',
    baja: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
  }
  return colors[severidad] || colors.baja
}

const getPrioridadColor = (prioridad) => {
  const colors = {
    alta: 'bg-red-500',
    media: 'bg-yellow-500',
    baja: 'bg-blue-500'
  }
  return colors[prioridad] || colors.baja
}

const getKanbanColor = (id) => {
  const colors = {
    'por-iniciar': 'bg-slate-500',
    'en-proceso': 'bg-blue-500',
    'esperando-reporte': 'bg-orange-500',
    'listo-liquidacion': 'bg-green-500'
  }
  return colors[id] || 'bg-slate-500'
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
          <h1 class="text-2xl sm:text-3xl font-bold text-neutral">Panel de Procesamiento</h1>
          <p class="text-secondary mt-1">
            Control de planta y gestión de producción
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 text-sm text-secondary bg-surface border border-border rounded-lg px-3 py-2">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Planta operando</span>
          </div>
          <button 
            @click="cargarDatos" 
            class="btn-outline text-sm py-2 px-4 flex items-center gap-2"
            :disabled="dashboardStore.loading"
          >
            <Settings class="w-4 h-4" :class="{ 'animate-spin': dashboardStore.loading }" />
            {{ dashboardStore.loading ? 'Actualizando...' : 'Actualizar' }}
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
      <div v-if="dashboardStore.error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
        <p class="text-red-700 dark:text-red-400">{{ dashboardStore.error }}</p>
      </div>

      <!-- Dashboard Content -->
      <template v-if="!dashboardStore.loading || dashboardStore.dashboardData">
        <!-- KPIs Principales -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- En Proceso -->
          <div class="bg-surface border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between mb-4">
              <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Factory class="w-6 h-6 text-white" />
              </div>
              <div class="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-lg font-medium">
                Activos
              </div>
            </div>
            <div class="space-y-1">
              <p class="text-sm font-medium text-secondary">En Proceso</p>
              <p class="text-3xl font-bold text-neutral">{{ operacionesData.concentradosEnProceso }}</p>
              <p class="text-xs text-tertiary">{{ operacionesData.concentradosCompletadosHoy }} completados hoy</p>
            </div>
          </div>

          <!-- Capacidad Utilizada -->
          <div class="bg-surface border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between mb-4">
              <div class="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Gauge class="w-6 h-6 text-white" />
              </div>
              <div class="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-lg font-medium">
                <TrendingUp class="w-3 h-3" />
                <span>Óptimo</span>
              </div>
            </div>
            <div class="space-y-1">
              <p class="text-sm font-medium text-secondary">Capacidad Utilizada</p>
              <p class="text-3xl font-bold text-neutral">{{ Number(operacionesData.capacidadUtilizada).toFixed(1) }}%</p>
              <p class="text-xs text-tertiary">{{ formatNumber(capacidadPlanta.procesamientoActual) }} / {{ formatNumber(capacidadPlanta.capacidadMaxima) }} ton/día</p>
            </div>
          </div>

          <!-- Toll Pendiente Cobro -->
          <div class="bg-surface border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between mb-4">
              <div class="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <AlertCircle class="w-6 h-6 text-white" />
              </div>
              <div class="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-lg font-medium">
                {{ liquidacionesToll.pendientes.length }} pendientes
              </div>
            </div>
            <div class="space-y-1">
              <p class="text-sm font-medium text-secondary">Toll por Cobrar</p>
              <p class="text-3xl font-bold text-neutral">{{ formatCurrency(financieroData.tollPendienteCobro) }}</p>
              <p class="text-xs text-tertiary">Promedio {{ Number(liquidacionesToll.estadisticas.promedioTiempoCobranza).toFixed(1) }} días</p>
            </div>
          </div>

          <!-- Toll Cobrado Mes -->
          <div class="bg-surface border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between mb-4">
              <div class="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <DollarSign class="w-6 h-6 text-white" />
              </div>
              <div class="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-lg font-medium">
                <ArrowUpRight class="w-3 h-3" />
                <span>{{ Number(liquidacionesToll.estadisticas.tasaCobranza).toFixed(1) }}%</span>
              </div>
            </div>
            <div class="space-y-1">
              <p class="text-sm font-medium text-secondary">Cobrado este Mes</p>
              <p class="text-3xl font-bold text-neutral">{{ formatCurrency(financieroData.tollCobradoMes) }}</p>
              <p class="text-xs text-tertiary">Últimos 30 días</p>
            </div>
          </div>
        </div>

        <!-- Kanban de Procesamiento -->
        <div class="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div class="p-6 border-b border-border">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Package class="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 class="font-bold text-neutral text-lg">Kanban de Procesamiento</h3>
                  <p class="text-sm text-secondary">
                    {{ kanbanData.porIniciar + kanbanData.enProceso + kanbanData.esperandoReporte + kanbanData.listoLiquidacion }} concentrados totales
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button class="btn-outline text-xs py-2 px-3">
                  <Filter class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Tablero Kanban -->
          <div class="p-6 overflow-x-auto">
            <div class="flex gap-4 min-w-max">
              <div
                v-for="columna in kanbanColumnas"
                :key="columna.id"
                class="shrink-0 w-80"
              >
                <!-- Header Columna -->
                <div class="bg-surface border border-border rounded-t-xl p-4">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <div 
                        :class="getKanbanColor(columna.id)"
                        class="w-3 h-3 rounded-full"
                      ></div>
                      <h4 class="font-bold text-neutral">{{ columna.titulo }}</h4>
                    </div>
                    <span class="bg-hover px-3 py-1 rounded-lg text-sm font-bold text-neutral border border-border">
                      {{ columna.concentrados.length }}
                    </span>
                  </div>
                </div>

                <!-- Cards de Concentrados -->
                <div class="bg-hover border border-border border-t-0 rounded-b-xl p-3 space-y-3 min-h-[400px]">
                  <div
                    v-for="concentrado in columna.concentrados"
                    :key="concentrado.id"
                    class="bg-surface border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
                  >
                    <!-- Header Card -->
                    <div class="flex items-start justify-between mb-3">
                      <div>
                        <p class="font-bold text-neutral text-sm">{{ concentrado.id }}</p>
                        <p class="text-xs text-secondary">{{ concentrado.mineralPrincipal }}</p>
                      </div>
                      <span 
                        :class="getKanbanColor(columna.id)"
                        class="px-2 py-1 rounded-lg text-xs font-bold text-white"
                      >
                        {{ concentrado.progreso.porcentaje }}%
                      </span>
                    </div>

                    <!-- Info -->
                    <div class="space-y-2 mb-3">
                      <div class="flex items-center justify-between text-xs">
                        <span class="text-secondary">Socio:</span>
                        <span class="font-medium text-neutral">{{ concentrado.socioNombre }}</span>
                      </div>
                      <div class="flex items-center justify-between text-xs">
                        <span class="text-secondary">Peso:</span>
                        <span class="font-medium text-neutral">{{ formatNumber(concentrado.pesoInicial) }} kg</span>
                      </div>
                      <div class="flex items-center justify-between text-xs">
                        <span class="text-secondary">Ingreso:</span>
                        <span class="font-medium text-neutral">{{ formatDate(concentrado.fechaCreacion) }}</span>
                      </div>
                    </div>

                    <!-- Progreso -->
                    <div class="mb-3">
                      <div class="flex items-center justify-between text-xs mb-1">
                        <span class="text-secondary">{{ concentrado.progreso.etapaActual }}</span>
                        <span v-if="concentrado.progreso.etapasTotal" class="text-tertiary">
                          {{ concentrado.progreso.etapasCompletadas }}/{{ concentrado.progreso.etapasTotal }}
                        </span>
                      </div>
                      <div class="h-2 bg-background rounded-full overflow-hidden border border-border">
                        <div 
                          :class="getKanbanColor(columna.id)"
                          class="h-full rounded-full transition-all duration-500"
                          :style="{ width: `${concentrado.progreso.porcentaje}%` }"
                        ></div>
                      </div>
                    </div>

                    <!-- Alertas -->
                    <div v-if="concentrado.alertas && concentrado.alertas.tipo === 'retraso'" class="mb-3">
                      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
                        <p class="text-xs text-red-700 dark:text-red-400">⚠️ {{ concentrado.alertas.mensaje }}</p>
                      </div>
                    </div>

                    <!-- Acciones -->
                    <button class="w-full btn-outline text-xs py-2 flex items-center justify-center gap-2">
                      <Eye class="w-3 h-3" />
                      Ver Detalle
                    </button>
                  </div>

                  <!-- Estado vacío -->
                  <div v-if="columna.concentrados.length === 0" class="flex items-center justify-center py-12">
                    <p class="text-sm text-tertiary">Sin concentrados</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Control de Planta + Cola de Entrada -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Control de Planta (2/3) -->
          <div class="lg:col-span-2 bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
            <div class="p-6 border-b border-border">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                    <Activity class="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 class="font-bold text-neutral text-lg">Control de Planta</h3>
                    <p class="text-sm text-secondary">Estado de procesos en tiempo real</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="p-6 space-y-4">
              <!-- Turno Actual -->
              <div class="bg-hover border border-border rounded-xl p-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <Clock class="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p class="font-bold text-neutral">Turno {{ turnoActual.turno.charAt(0).toUpperCase() + turnoActual.turno.slice(1) }}</p>
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
                    <div class="h-3 bg-background rounded-full overflow-hidden border border-border">
                      <div 
                        class="h-full bg-primary rounded-full transition-all duration-500"
                        :style="{ width: `${(Number(proceso.utilizado) / Number(proceso.capacidadMaxima)) * 100}%` }"
                      ></div>
                    </div>
                  </div>

                  <!-- Detalles -->
                  <div class="grid grid-cols-2 gap-3 text-xs">
                    <div class="bg-background border border-border rounded-lg p-2">
                      <p class="text-tertiary mb-1">Tiempo promedio</p>
                      <p class="font-semibold text-neutral">{{ Number(proceso.tiempoPromedioEtapa).toFixed(1) }} hrs</p>
                    </div>
                    <div class="bg-background border border-border rounded-lg p-2">
                      <p class="text-tertiary mb-1">Próx. mantenimiento</p>
                      <p class="font-semibold text-neutral">{{ formatDate(proceso.proximoMantenimiento) }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Alertas Operacionales -->
              <div v-if="alertasOperacionales.length > 0" class="space-y-2">
                <h4 class="font-semibold text-neutral text-sm">Alertas</h4>
                <div
                  v-for="(alerta, index) in alertasOperacionales"
                  :key="index"
                  :class="getSeveridadColor(alerta.severidad)"
                  class="border-l-4 rounded-xl p-3"
                >
                  <p class="text-sm font-medium">{{ alerta.mensaje }}</p>
                  <button class="text-xs underline hover:no-underline mt-1">{{ alerta.accion }}</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Cola de Entrada (1/3) -->
          <div class="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
            <div class="p-4 border-b border-border">
              <div class="flex items-center gap-2">
                <Package class="w-5 h-5 text-primary" />
                <h3 class="font-bold text-neutral">Cola de Entrada</h3>
                <span class="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg border border-primary/20">
                  {{ lotesDisponibles.length }}
                </span>
              </div>
            </div>

            <div class="p-4 space-y-3 max-h-[600px] overflow-y-auto scrollbar-custom">
              <div
                v-for="lote in lotesDisponibles"
                :key="lote.id"
                class="bg-hover border border-border rounded-xl p-4"
              >
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <p class="font-bold text-neutral text-sm">00{{ lote.id }}</p>
                    <p class="text-xs text-secondary">{{ lote.socioNombre }}</p>
                  </div>
                  <span 
                    :class="getPrioridadColor(lote.prioridad)"
                    class="px-2 py-1 rounded-lg text-xs font-bold text-white"
                  >
                    {{ lote.prioridad.toUpperCase() }}
                  </span>
                </div>

                <div class="space-y-2 mb-3">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-secondary">Mineral:</span>
                    <div class="flex items-center gap-1">
                      <span 
                        v-for="mineral in lote.minerales" 
                        :key="mineral"
                        class="px-2 py-0.5 bg-primary/10 text-primary rounded border border-primary/20 font-medium"
                      >
                        {{ mineral }}
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-secondary">Peso:</span>
                    <span class="font-medium text-neutral">{{ formatNumber(lote.pesoReal) }} kg</span>
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-secondary">Esperando:</span>
                    <span class="font-medium text-neutral">{{ lote.diasEspera }} días</span>
                  </div>
                </div>

                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 mb-3">
                  <p class="text-xs text-blue-700 dark:text-blue-400">
                    <strong>Estimado:</strong> {{ lote.concentradosEstimados }} concentrados en {{ Number(lote.tiempoProcesamientoEstimado).toFixed(0) }}h
                  </p>
                </div>

                <button class="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2">
                  <CheckCircle class="w-3 h-3" />
                  Iniciar Procesamiento
                </button>
              </div>

              <!-- Estado vacío -->
              <div v-if="lotesDisponibles.length === 0" class="text-center py-12">
                <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle class="w-8 h-8 text-primary" />
                </div>
                <p class="text-sm text-secondary">No hay lotes en espera</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Liquidaciones Toll -->
        <div class="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div class="p-6 border-b border-border">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <FileText class="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 class="font-bold text-neutral text-lg">Liquidaciones de Toll</h3>
                  <p class="text-sm text-secondary">Gestión de cobros por procesamiento</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold text-primary">
                  {{ liquidacionesToll.pendientes.length }}
                </p>
                <p class="text-xs text-secondary">Pendientes</p>
              </div>
            </div>
          </div>

          <div class="p-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Pendientes de Pago -->
              <div>
                <h4 class="font-semibold text-neutral mb-4 flex items-center gap-2">
                  <AlertCircle class="w-4 h-4 text-red-500" />
                  Esperando Pago
                </h4>
                <div class="space-y-3">
                  <div
                    v-for="liq in liquidacionesToll.pendientes"
                    :key="liq.id"
                    class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
                  >
                    <div class="flex items-start justify-between mb-3">
                      <div>
                        <p class="font-bold text-neutral">{{ liq.socioNombre }}</p>
                        <p class="text-xs text-secondary">Lotes: {{ liq.lotes.join(', ') }}</p>
                      </div>
                      <span class="px-2 py-1 bg-red-500 text-white rounded-lg text-xs font-bold">
                        {{ liq.diasPendiente }} días
                      </span>
                    </div>

                    <div class="grid grid-cols-2 gap-3 mb-3 text-xs">
                      <div class="bg-white/50 dark:bg-slate-900/50 border border-red-200 dark:border-red-800 rounded-lg p-2">
                        <p class="text-tertiary mb-1">Peso Total</p>
                        <p class="font-semibold text-neutral">{{ formatNumber(liq.pesoTotal) }} kg</p>
                      </div>
                      <div class="bg-white/50 dark:bg-slate-900/50 border border-red-200 dark:border-red-800 rounded-lg p-2">
                        <p class="text-tertiary mb-1">Costo Procesam.</p>
                        <p class="font-semibold text-neutral">{{ formatCurrency(liq.costoProcesamiento) }}</p>
                      </div>
                    </div>

                    <div class="bg-white/50 dark:bg-slate-900/50 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-xs text-secondary">Servicios adicionales:</span>
                        <span class="text-xs font-medium text-neutral">{{ formatCurrency(liq.serviciosAdicionales) }}</span>
                      </div>
                      <div class="flex items-center justify-between border-t border-red-200 dark:border-red-800 pt-2">
                        <span class="text-sm font-bold text-neutral">Total:</span>
                        <span class="text-lg font-bold text-primary">{{ formatCurrency(liq.totalBob) }}</span>
                      </div>
                    </div>

                    <button class="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors">
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
                    <CheckCircle class="w-4 h-4 text-green-500" />
                    Pagadas Recientes
                  </h4>
                  <div class="space-y-3">
                    <div
                      v-for="liq in liquidacionesToll.pagadasRecientes"
                      :key="liq.id"
                      class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4"
                    >
                      <div class="flex items-start justify-between mb-2">
                        <div>
                          <p class="font-bold text-neutral">{{ liq.socioNombre }}</p>
                          <p class="text-xs text-secondary">{{ formatDate(liq.fechaPago) }}</p>
                        </div>
                        <span class="text-lg font-bold text-green-600 dark:text-green-400">
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

        <!-- Análisis de Producción -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Producción Diaria -->
          <div class="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
            <div class="p-6 border-b border-border">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <BarChart3 class="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 class="font-bold text-neutral text-lg">Producción Diaria</h3>
                  <p class="text-sm text-secondary">Última semana</p>
                </div>
              </div>
            </div>
            <div class="p-6">
              <div class="space-y-4">
                <div v-for="item in produccionDiaria" :key="item.fecha" class="space-y-2">
                  <div class="flex items-center justify-between text-sm">
                    <span class="font-medium text-neutral">{{ item.fecha }}</span>
                    <div class="flex items-center gap-3 text-xs">
                      <span class="text-secondary">{{ Number(item.pesoTotalProcesado).toFixed(1) }} ton</span>
                    </div>
                  </div>
                  <div class="relative h-10 bg-hover border border-border rounded-lg overflow-hidden">
                    <div 
                      class="absolute inset-y-0 left-0 bg-blue-500 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                      :style="{ width: `${(item.concentradosCreados / maxProduccion) * 100}%` }"
                    >
                      <span class="text-xs text-white font-medium">{{ item.concentradosCreados }}</span>
                    </div>
                    <div 
                      class="absolute inset-y-0 bg-green-500 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                      :style="{ 
                        left: `${(item.concentradosCreados / maxProduccion) * 100}%`,
                        width: `${(item.concentradosFinalizados / maxProduccion) * 100}%` 
                      }"
                    >
                      <span class="text-xs text-white font-medium">{{ item.concentradosFinalizados }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Leyenda -->
              <div class="flex items-center gap-6 mt-6 pt-6 border-t border-border">
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 bg-blue-500 rounded"></div>
                  <span class="text-xs text-secondary">Creados</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 bg-green-500 rounded"></div>
                  <span class="text-xs text-secondary">Finalizados</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Por Mineral -->
          <div class="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
            <div class="p-6 border-b border-border">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <PieChart class="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 class="font-bold text-neutral text-lg">Producción por Mineral</h3>
                  <p class="text-sm text-secondary">Distribución actual</p>
                </div>
              </div>
            </div>
            <div class="p-6">
              <!-- Gráfico de dona simulado -->
              <div class="flex items-center justify-center mb-6">
                <div class="relative w-48 h-48">
                  <svg viewBox="0 0 100 100" class="transform -rotate-90">
                    <template v-if="produccionPorMineral.length >= 1">
                      <!-- Primer mineral -->
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        :stroke="produccionPorMineral[0]?.mineral === 'Zn' ? '#10B981' : '#3B82F6'"
                        stroke-width="20"
                        :stroke-dasharray="`${(produccionPorMineral[0]?.porcentaje || 0) * 2.51} 282`"
                        stroke-dashoffset="0"
                      />
                    </template>
                    <template v-if="produccionPorMineral.length >= 2">
                      <!-- Segundo mineral -->
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        :stroke="produccionPorMineral[1]?.mineral === 'Pb' ? '#3B82F6' : '#F59E0B'"
                        stroke-width="20"
                        :stroke-dasharray="`${(produccionPorMineral[1]?.porcentaje || 0) * 2.51} 282`"
                        :stroke-dashoffset="`-${(produccionPorMineral[0]?.porcentaje || 0) * 2.51}`"
                      />
                    </template>
                    <template v-if="produccionPorMineral.length >= 3">
                      <!-- Tercer mineral -->
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#F59E0B"
                        stroke-width="20"
                        :stroke-dasharray="`${(produccionPorMineral[2]?.porcentaje || 0) * 2.51} 282`"
                        :stroke-dashoffset="`-${((produccionPorMineral[0]?.porcentaje || 0) + (produccionPorMineral[1]?.porcentaje || 0)) * 2.51}`"
                      />
                    </template>
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <div class="text-center">
                      <p class="text-2xl font-bold text-neutral">{{ produccionPorMineral.reduce((sum, item) => sum + item.cantidad, 0) }}</p>
                      <p class="text-xs text-secondary">Total</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Detalles -->
              <div class="space-y-3">
                <div v-for="item in produccionPorMineral" :key="item.mineral" class="flex items-center justify-between p-3 bg-hover border border-border rounded-xl">
                  <div class="flex items-center gap-3">
                    <div 
                      class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white"
                      :class="{
                        'bg-green-500': item.mineral === 'Zn',
                        'bg-blue-500': item.mineral === 'Pb',
                        'bg-yellow-500': item.mineral === 'Ag'
                      }"
                    >
                      {{ item.mineral }}
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-neutral">{{ item.cantidad }} concentrados</p>
                      <p class="text-xs text-secondary">{{ formatNumber(item.pesoTotal) }} kg</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-lg font-bold text-neutral">{{ item.porcentaje }}%</p>
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
/* Animaciones personalizadas para el Kanban */
.kanban-card-enter-active,
.kanban-card-leave-active {
  transition: all 0.3s ease;
}

.kanban-card-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.kanban-card-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

.scrollbar-custom::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-custom::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-custom::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.scrollbar-custom::-webkit-scrollbar-thumb:hover {
  background: var(--color-neutral-tertiary);
}
</style>