<!-- src/views/cooperativa/Dashboard.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import {
  Users,
  Package,
  Truck,
  MapPin,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mountain,
  Scale,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3,
  Eye,
  Settings,
  RefreshCw
} from 'lucide-vue-next'
import { useDashboardCooperativaStore } from '@/stores/cooperativa/dashboardStore'

const dashboardStore = useDashboardCooperativaStore()

// Computed properties que obtienen datos del store
const sociosData = computed(() => dashboardStore.dashboardData?.sociosData || {
  totalSocios: 0,
  sociosActivos: 0,
  nuevosEsteMes: 0,
  minasRegistradas: 0,
  minasPorSector: []
})
const router = useRouter()
const lotesData = computed(() => dashboardStore.dashboardData?.lotesData || {
  pendienteAprobacion: 0,
  aprobadosHoy: 0,
  rechazadosHoy: 0,
  tasaAprobacionMes: 0,
  tiempoPromedioAprobacion: 0
})

const transportistasData = computed(() => dashboardStore.dashboardData?.transportistasData || {
  totalDisponibles: 0,
  enRuta: 0,
  completadosHoy: 0,
  calificacionPromedio: 0,
  viajesCompletadosMes: 0
})

const irALotes = () => {
  router.push({ name: 'CooperativaLotesAprobacion' })
}

const volumetriaData = computed(() => dashboardStore.dashboardData?.volumetriaData || {
  pesoTotalDespachadoMes: 0,
  camionesDespachadosMes: 0,
  promedioKgPorCamion: 0,
  comparativoMesAnterior: 0
})

const lotesPendientes = computed(() => dashboardStore.dashboardData?.lotesPendientes || [])
const transportistasEnRuta = computed(() => dashboardStore.dashboardData?.transportistasEnRuta || [])
const balanzasMonitor = computed(() => dashboardStore.dashboardData?.balanzasMonitor || [])
const aprobacionesPorDia = computed(() => dashboardStore.dashboardData?.aprobacionesPorDia || [])
const minasPorSector = computed(() => dashboardStore.dashboardData?.minasPorSector || [])

// Computed para cálculos
const maxAprobados = computed(() => {
  if (aprobacionesPorDia.value.length === 0) return 1
  return Math.max(...aprobacionesPorDia.value.map(d => (d.aprobados || 0) + (d.rechazados || 0)))
})

// Funciones de utilidad
const formatNumber = (value) => {
  if (!value) return '0'
  return new Intl.NumberFormat('es-BO').format(value)
}

const formatHours = (hours) => {
  if (!hours) return '0 min'
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`
  }
  return `${hours.toFixed(1)} hrs`
}

const getPrioridadColor = (prioridad) => {
  const colors = {
    alta: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
    media: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10',
    baja: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10'
  }
  return colors[prioridad] || colors.baja
}

const getPrioridadBadgeColor = (prioridad) => {
  const colors = {
    alta: 'bg-red-100 text-white dark:bg-red-900 dark:text-red-400',
    media: 'bg-yellow-100 text-white dark:bg-yellow-900 dark:text-yellow-400',
    baja: 'bg-blue-100 text-white dark:bg-blue-900 dark:text-blue-400'
  }
  return colors[prioridad] || colors.baja
}

const getValidacionIcon = (estado) => {
  return estado === 'ok' ? CheckCircle : estado === 'advertencia' ? AlertTriangle : XCircle
}

const getValidacionColor = (estado) => {
  const colors = {
    ok: 'text-green-600 dark:text-green-400',
    advertencia: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400'
  }
  return colors[estado] || colors.ok
}

const getEstadoBalanzaColor = (estado) => {
  const colors = {
    disponible: 'bg-green-600',
    en_uso: 'bg-blue-600',
    mantenimiento: 'bg-red-600'
  }
  return colors[estado] || 'bg-gray-600'
}

const getEstadoBalanzaTexto = (estado) => {
  const textos = {
    disponible: 'Disponible',
    en_uso: 'En Uso',
    mantenimiento: 'Mantenimiento'
  }
  return textos[estado] || estado
}

const formatFecha = (fecha) => {
  if (!fecha) return ''
  const date = new Date(fecha)
  return date.toLocaleDateString('es-BO')
}

const formatPeso = (peso) => {
  if (!peso) return '0'
  return formatNumber(peso)
}

const getTipoOperacionTexto = (tipo) => {
  return tipo === 'toll' ? 'Toll' : 'Venta Directa'
}

onMounted(async () => {
  await dashboardStore.fetchDashboard()
})
</script>

<template>
  <AppLayout>
    <div class="space-y-6 pb-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-neutral">Panel de Control</h1>
          <p class="text-secondary mt-1">
            Gestión operativa de la cooperativa
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button class="btn-outline text-sm px-3 py-2 flex items-center gap-2">
            <RefreshCw class="w-4 h-4" />
            <span class="hidden sm:inline">Actualizar</span>
          </button>
          <div class="flex items-center gap-2 text-sm text-secondary">
            <Clock class="w-4 h-4" />
            <span>Hace 1 min</span>
          </div>
        </div>
      </div>

      <!-- KPIs Principales -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Socios Activos -->
        <div class="bg-surface border border-border rounded-xl p-5 hover:shadow-md transition-all">
          <div class="flex items-start justify-between mb-4">
            <div class="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users class="w-5 h-5 text-primary" />
            </div>
            <span class="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
              <ArrowUpRight class="w-3 h-3" />
              +{{ sociosData.nuevosEsteMes || 0 }}
            </span>
          </div>
          <div>
            <p class="text-sm text-secondary mb-1">Socios Activos</p>
            <p class="text-2xl font-bold text-neutral">{{ sociosData.sociosActivos || 0 }}</p>
            <p class="text-xs text-tertiary mt-1">de {{ sociosData.totalSocios || 0 }} totales</p>
          </div>
        </div>

        <!-- Lotes Pendientes -->
        <div class="bg-surface border border-border rounded-xl p-5 hover:shadow-md transition-all">
          <div class="flex items-start justify-between mb-4">
            <div class="w-11 h-11 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <Clock class="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
            </div>
            <span class="text-xs text-secondary font-medium">
              {{ formatHours(lotesData.tiempoPromedioAprobacion || 0) }}
            </span>
          </div>
          <div>
            <p class="text-sm text-secondary mb-1">Pendientes Aprobación</p>
            <p class="text-2xl font-bold text-neutral">{{ lotesData.pendienteAprobacion || 0 }}</p>
            <p class="text-xs text-tertiary mt-1">tiempo promedio</p>
          </div>
        </div>

        <!-- Transportistas en Ruta -->
        <div class="bg-surface border border-border rounded-xl p-5 hover:shadow-md transition-all">
          <div class="flex items-start justify-between mb-4">
            <div class="w-11 h-11 bg-accent/10 rounded-lg flex items-center justify-center">
              <Truck class="w-5 h-5 text-accent" />
            </div>
            <span class="text-xs text-secondary font-medium">
              {{ transportistasData.totalDisponibles || 0 }} total
            </span>
          </div>
          <div>
            <p class="text-sm text-secondary mb-1">Camiones en Ruta</p>
            <p class="text-2xl font-bold text-neutral">{{ transportistasData.enRuta || 0 }}</p>
            <p class="text-xs text-tertiary mt-1">{{ transportistasData.completadosHoy || 0 }} completados hoy</p>
          </div>
        </div>

        <!-- Volumetría Mensual -->
        <div class="bg-surface border border-border rounded-xl p-5 hover:shadow-md transition-all">
          <div class="flex items-start justify-between mb-4">
            <div class="w-11 h-11 bg-success/10 rounded-lg flex items-center justify-center">
              <TrendingUp class="w-5 h-5 text-success" />
            </div>
            <span 
              :class="[
                'text-xs font-medium flex items-center gap-1',
                (volumetriaData.comparativoMesAnterior || 0) >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              ]"
            >
              <ArrowUpRight v-if="(volumetriaData.comparativoMesAnterior || 0) >= 0" class="w-3 h-3" />
              <ArrowDownRight v-else class="w-3 h-3" />
              {{ Math.abs(volumetriaData.comparativoMesAnterior || 0).toFixed(1) }}%
            </span>
          </div>
          <div>
            <p class="text-sm text-secondary mb-1">Toneladas Mes</p>
            <p class="text-2xl font-bold text-neutral">{{ formatNumber((volumetriaData.pesoTotalDespachadoMes || 0) / 1000) }}</p>
            <p class="text-xs text-tertiary mt-1">{{ volumetriaData.camionesDespachadosMes || 0 }} camiones</p>
          </div>
        </div>
      </div>

      <!-- Sección Principal: Cola de Aprobación + Monitores -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Cola de Aprobación (2/3) -->
        <div class="lg:col-span-2 bg-surface border border-border rounded-xl overflow-hidden">
          <div class="p-5 border-b border-border">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Package class="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 class="font-semibold text-neutral text-lg">Cola de Aprobación</h3>
                  <p class="text-sm text-secondary">{{ lotesPendientes.length }} lotes esperando</p>
                </div>
              </div>
              <button class="btn-outline text-sm py-2 px-3 flex items-center gap-2" @click="irALotes">
                <Package class="w-4 h-4" />
                <span class="hidden sm:inline">Ir a mis solicitudes de lotes</span>
              </button>
            </div>
          </div>

          <div class="p-5 space-y-4 max-h-[600px] overflow-y-auto scrollbar-custom">
            <div
              v-for="lote in lotesPendientes"
              :key="lote.id"
              class="bg-hover border border-border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
            >
              <!-- Header -->
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-start gap-3 flex-1">
                  <div class="w-10 h-10 rounded-lg bg-primary/10 center shrink-0">
                    <Package class="w-5 h-5 text-primary" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 class="font-semibold text-neutral">{{ lote.id }}</h4>
                      <span 
                        :class="[getPrioridadBadgeColor(lote.prioridad), 'px-2 py-0.5 rounded text-xs font-medium']"
                      >
                        {{ (lote.prioridad || 'baja').toUpperCase() }}
                      </span>
                    </div>
                    <p class="text-sm text-neutral font-medium">{{ lote.socioNombre }}</p>
                    <p class="text-xs text-secondary">{{ lote.minaNombre }}</p>
                  </div>
                </div>
              </div>

              <!-- Detalles -->
              <div class="grid grid-cols-2 gap-3 mb-3 pt-3 border-t border-border">
                <div>
                  <p class="text-xs text-tertiary mb-0.5">Tipo Operación</p>
                  <p class="text-sm text-neutral font-medium">{{ getTipoOperacionTexto(lote.tipoOperacion) }}</p>
                </div>
                <div>
                  <p class="text-xs text-tertiary mb-0.5">Camiones</p>
                  <p class="text-sm text-neutral font-medium">{{ lote.camionesSolicitados }} unidades</p>
                </div>
                <div>
                  <p class="text-xs text-tertiary mb-0.5">Peso Estimado</p>
                  <p class="text-sm text-neutral font-medium">{{ formatPeso(lote.pesoEstimado) }} kg</p>
                </div>
                <div>
                  <p class="text-xs text-tertiary mb-0.5">Fecha Creación</p>
                  <p class="text-sm text-neutral font-medium">{{ formatFecha(lote.fechaCreacion) }}</p>
                </div>
              </div>
            </div>

  <!-- Estado vacío -->
  <div v-if="lotesPendientes.length === 0" class="text-center py-12">
    <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
      <CheckCircle class="w-8 h-8 text-primary" />
    </div>
    <p class="text-secondary text-sm">No hay lotes pendientes de aprobación</p>
  </div>
</div>
        </div>

        <!-- Monitores (1/3) -->
        <div class="space-y-5">
          <!-- Monitor de Transportistas -->
          <div class="bg-surface border border-border rounded-xl overflow-hidden">
            <div class="p-4 border-b border-border">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Truck class="w-5 h-5 text-primary" />
                  <h3 class="font-semibold text-neutral">En Ruta Ahora</h3>
                </div>
                <span class="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-medium">
                  {{ transportistasEnRuta.length }}
                </span>
              </div>
            </div>
            <div class="p-4 space-y-3 max-h-[280px] overflow-y-auto scrollbar-custom">
              <div
                v-for="transportista in transportistasEnRuta"
                :key="transportista.id"
                class="bg-hover border border-border rounded-lg p-3"
              >
                <div class="flex items-start justify-between mb-2">
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm text-neutral truncate">{{ transportista.nombreCompleto }}</p>
                    <p class="text-xs text-secondary">{{ transportista.placaVehiculo }}</p>
                  </div>
                  <span class="px-2 py-0.5 bg-accent text-white rounded text-xs font-medium ml-2">
                    {{ transportista.progreso || 0 }}%
                  </span>
                </div>
                <p class="text-xs text-tertiary mb-2">{{ transportista.estadoViaje }}</p>
                <div class="h-1.5 bg-background rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-accent rounded-full transition-all duration-500"
                    :style="{ width: `${transportista.progreso || 0}%` }"
                  ></div>
                </div>
              </div>

              <!-- Estado vacío -->
              <div v-if="transportistasEnRuta.length === 0" class="text-center py-6">
                <p class="text-sm text-secondary">No hay transportistas en ruta</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Análisis de Aprobaciones y Distribución de Minas -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Gráfico de Aprobaciones -->
        <div class="bg-surface border border-border rounded-xl overflow-hidden">
          <div class="p-5 border-b border-border">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                <BarChart3 class="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 class="font-semibold text-neutral text-lg">Aprobaciones por Día</h3>
                <p class="text-sm text-secondary">Última semana</p>
              </div>
            </div>
          </div>
          <div class="p-5">
            <div v-if="aprobacionesPorDia.length > 0" class="space-y-4">
              <div v-for="item in aprobacionesPorDia" :key="item.fecha" class="space-y-2">
                <div class="flex items-center justify-between text-sm">
                  <span class="font-medium text-neutral">{{ item.fecha }}</span>
                  <div class="flex items-center gap-3">
                    <span class="text-xs text-secondary">Tasa: {{ (item.tasaAprobacion || 0).toFixed(1) }}%</span>
                    <span class="font-semibold text-neutral">{{ (item.aprobados || 0) + (item.rechazados || 0) }}</span>
                  </div>
                </div>
                <div class="relative h-9 bg-hover rounded-lg overflow-hidden">
                  <div 
                    class="absolute inset-y-0 left-0 bg-success rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                    :style="{ width: `${((item.aprobados || 0) / maxAprobados) * 100}%` }"
                  >
                    <span v-if="item.aprobados > 0" class="text-xs text-white font-medium">{{ item.aprobados }}</span>
                  </div>
                  <div 
                    class="absolute inset-y-0 bg-error rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                    :style="{ 
                      left: `${((item.aprobados || 0) / maxAprobados) * 100}%`,
                      width: `${((item.rechazados || 0) / maxAprobados) * 100}%` 
                    }"
                  >
                    <span v-if="item.rechazados > 0" class="text-xs text-white font-medium">{{ item.rechazados }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-12">
              <p class="text-secondary">No hay datos de aprobaciones</p>
            </div>

            <!-- Leyenda -->
            <div class="flex items-center gap-6 mt-6 pt-5 border-t border-border">
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 bg-success rounded"></div>
                <span class="text-xs text-secondary">Aprobados</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 bg-error rounded"></div>
                <span class="text-xs text-secondary">Rechazados</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Distribución de Minas por Sector -->
        <div class="bg-surface border border-border rounded-xl overflow-hidden">
          <div class="p-5 border-b border-border">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                <Mountain class="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 class="font-semibold text-neutral text-lg">Minas por Sector</h3>
                <p class="text-sm text-secondary">{{ sociosData.minasRegistradas || 0 }} minas totales</p>
              </div>
            </div>
          </div>
          <div class="p-5">
            <div v-if="minasPorSector.length > 0" class="space-y-4">
              <div 
                v-for="(sector, index) in minasPorSector" 
                :key="sector.sector"
                class="space-y-2"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div 
                      class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white bg-primary"
                    >
                      {{ sector.cantidad }}
                    </div>
                    <span class="text-sm font-medium text-neutral">{{ sector.sector }}</span>
                  </div>
                  <span class="text-xs text-secondary font-medium">
                    {{ sociosData.minasRegistradas > 0 ? ((sector.cantidad / sociosData.minasRegistradas) * 100).toFixed(1) : 0 }}%
                  </span>
                </div>
                <div class="h-2.5 bg-hover rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-primary rounded-full transition-all duration-500"
                    :style="{ width: sociosData.minasRegistradas > 0 ? `${(sector.cantidad / sociosData.minasRegistradas) * 100}%` : '0%' }"
                  ></div>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-12">
              <p class="text-secondary">No hay minas registradas</p>
            </div>

            <!-- Resumen -->
            <div class="mt-6 pt-5 border-t border-border grid grid-cols-2 gap-4">
              <div class="text-center p-3 bg-hover rounded-lg border border-border">
                <p class="text-2xl font-bold text-neutral">{{ sociosData.sociosActivos || 0 }}</p>
                <p class="text-xs text-secondary mt-1">Socios Activos</p>
              </div>
              <div class="text-center p-3 bg-hover rounded-lg border border-border">
                <p class="text-2xl font-bold text-neutral">
                  {{ sociosData.sociosActivos > 0 ? ((sociosData.minasRegistradas || 0) / sociosData.sociosActivos).toFixed(1) : 0 }}
                </p>
                <p class="text-xs text-secondary mt-1">Minas / Socio</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance de Transportistas -->
      <div class="bg-surface border border-border rounded-xl overflow-hidden">
        <div class="p-5 border-b border-border">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
              <Activity class="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 class="font-semibold text-neutral text-lg">Resumen de Transportistas</h3>
              <p class="text-sm text-secondary">Estado actual del mes</p>
            </div>
          </div>
        </div>
        <div class="p-5">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-hover border border-border rounded-lg p-4">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users class="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-neutral">{{ transportistasData.totalDisponibles || 0 }}</p>
                  <p class="text-xs text-secondary">Disponibles</p>
                </div>
              </div>
              <p class="text-sm text-secondary">Transportistas registrados</p>
            </div>

            <div class="bg-hover border border-border rounded-lg p-4">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Truck class="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-neutral">{{ transportistasData.enRuta || 0 }}</p>
                  <p class="text-xs text-secondary">En Ruta</p>
                </div>
              </div>
              <p class="text-sm text-secondary">Transportes activos ahora</p>
            </div>

            <div class="bg-hover border border-border rounded-lg p-4">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <CheckCircle class="w-5 h-5 text-success" />
                </div>
                <div>
                  <p class="text-2xl font-bold text-neutral">{{ transportistasData.viajesCompletadosMes || 0 }}</p>
                  <p class="text-xs text-secondary">Este Mes</p>
                </div>
              </div>
              <p class="text-sm text-secondary">Viajes completados</p>
            </div>
          </div>
        </div>
      </div>
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
</style>