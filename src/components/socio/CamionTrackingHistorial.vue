<!-- src/components/socio/CamionTrackingHistorial.vue -->
<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  Map as MapIcon,
  Filter,
  BarChart3,
  MapPin,
  WifiOff,
  Radio,
  RefreshCw,
  Loader2,
  TrendingUp,
  Clock,
  Gauge
} from 'lucide-vue-next'
import { useTrackingHistorialStore } from '@/stores/trackingHistorialStore'
import CamionHistorialMapa from './CamionHistorialMapa.vue'

const props = defineProps({
  asignacionId: {
    type: Number,
    required: true
  },
  tracking: {
    type: Object,
    default: null
  }
})

const historialStore = useTrackingHistorialStore()

const vistaActual = ref('mapa') // 'mapa', 'estadisticas'
const mostrarFiltros = ref(false)

const loading = computed(() => historialStore.loading)
const estadisticas = computed(() => historialStore.estadisticas)
const puntosFiltrados = computed(() => historialStore.puntosFiltrados)
const estadosDisponibles = computed(() => historialStore.estadosDisponibles)

const filtroConexion = computed({
  get: () => historialStore.filtroActual,
  set: (value) => historialStore.setFiltro(value)
})

const estadoSeleccionado = computed({
  get: () => historialStore.estadoSeleccionado,
  set: (value) => historialStore.setEstadoSeleccionado(value)
})

onMounted(async () => {
  console.log('🗺️ Cargando historial para asignación:', props.asignacionId)
  await cargarHistorial()
})

onUnmounted(() => {
  historialStore.reset()
})

watch(() => props.asignacionId, async (nuevoId) => {
  if (nuevoId) {
    await cargarHistorial()
  }
})

const cargarHistorial = async () => {
  await historialStore.fetchHistorialPorEstado(props.asignacionId)
}

const aplicarFiltroConexion = (filtro) => {
  filtroConexion.value = filtro
  mostrarFiltros.value = false
}

const aplicarFiltroEstado = (estado) => {
  if (estadoSeleccionado.value === estado) {
    estadoSeleccionado.value = null
  } else {
    estadoSeleccionado.value = estado
  }
}

const limpiarFiltros = () => {
  historialStore.limpiarFiltros()
}

const getColorEstado = (estado) => {
  const colores = {
    'En camino a la mina': '#3B82F6',
    'Esperando carguío': '#F59E0B',
    'En camino balanza cooperativa': '#10B981',
    'En camino balanza destino': '#8B5CF6',
    'En camino almacén destino': '#EC4899',
    'Descargando': '#14B8A6',
    'Completado': '#22C55E'
  }
  return colores[estado] || '#6B7280'
}

const formatDistancia = (distanciaKm) => {
  if (!distanciaKm) return '0 km'
  if (distanciaKm < 1) {
    return `${Math.round(distanciaKm * 1000)} m`
  }
  return `${distanciaKm.toFixed(2)} km`
}

const formatVelocidad = (velocidadKmh) => {
  if (!velocidadKmh) return '0 km/h'
  return `${Math.round(velocidadKmh)} km/h`
}

const formatDuracion = (segundos) => {
  if (!segundos) return '0min'
  
  const horas = Math.floor(segundos / 3600)
  const minutos = Math.floor((segundos % 3600) / 60)
  
  if (horas > 0) {
    return `${horas}h ${minutos}min`
  }
  return `${minutos}min`
}
</script>

<template>
  <div class="p-4 sm:p-6 space-y-4">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <Loader2 class="w-8 h-8 text-primary animate-spin" />
    </div>

    <!-- Content -->
    <div v-else-if="estadisticas" class="space-y-4">
      <!-- Header con stats generales -->
      <div class="grid sm:grid-cols-4 gap-4">
        <div class="bg-base rounded-xl p-4 border border-border">
          <div class="flex items-center gap-2 mb-2">
            <MapPin class="w-4 h-4 text-blue-500" />
            <p class="text-xs text-tertiary">Total Ubicaciones</p>
          </div>
          <p class="text-2xl font-bold text-neutral">
            {{ estadisticas.totalUbicaciones.toLocaleString() }}
          </p>
        </div>

        <div class="bg-base rounded-xl p-4 border border-border">
          <div class="flex items-center gap-2 mb-2">
            <Radio class="w-4 h-4 text-green-500" />
            <p class="text-xs text-tertiary">Online</p>
          </div>
          <p class="text-2xl font-bold text-neutral">
            {{ estadisticas.ubicacionesOnline.toLocaleString() }}
          </p>
        </div>

        <div class="bg-base rounded-xl p-4 border border-border">
          <div class="flex items-center gap-2 mb-2">
            <WifiOff class="w-4 h-4 text-orange-500" />
            <p class="text-xs text-tertiary">Offline</p>
          </div>
          <p class="text-2xl font-bold text-neutral">
            {{ estadisticas.ubicacionesOffline.toLocaleString() }}
          </p>
          <p class="text-xs text-tertiary mt-1">
            {{ estadisticas.porcentajeOffline }}% del total
          </p>
        </div>

        <div class="bg-base rounded-xl p-4 border border-border">
          <button
            @click="cargarHistorial"
            class="w-full h-full flex flex-col items-center justify-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <RefreshCw class="w-5 h-5" />
            <span class="text-xs font-medium">Actualizar</span>
          </button>
        </div>
      </div>

      <!-- Filtros y Vistas -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <!-- Filtros -->
        <div class="flex flex-wrap items-center gap-2">
          <button
            @click="mostrarFiltros = !mostrarFiltros"
            class="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-base hover:bg-hover transition-colors text-sm font-medium text-neutral"
          >
            <Filter class="w-4 h-4" />
            <span>Filtros</span>
            <span 
              v-if="filtroConexion !== 'todos' || estadoSeleccionado"
              class="w-2 h-2 bg-primary rounded-full"
            ></span>
          </button>

          <!-- Filtros de conexión -->
          <div class="flex gap-2">
            <button
              @click="aplicarFiltroConexion('todos')"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              :class="filtroConexion === 'todos'
                ? 'bg-blue-500 text-white'
                : 'bg-base border border-border text-secondary hover:text-neutral'"
            >
              Todos
            </button>
            <button
              @click="aplicarFiltroConexion('online')"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              :class="filtroConexion === 'online'
                ? 'bg-green-500 text-white'
                : 'bg-base border border-border text-secondary hover:text-neutral'"
            >
              <Radio class="w-3 h-3 inline mr-1" />
              Online
            </button>
            <button
              @click="aplicarFiltroConexion('offline')"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              :class="filtroConexion === 'offline'
                ? 'bg-orange-500 text-white'
                : 'bg-base border border-border text-secondary hover:text-neutral'"
            >
              <WifiOff class="w-3 h-3 inline mr-1" />
              Offline
            </button>
          </div>

          <!-- Botón limpiar filtros -->
          <button
            v-if="filtroConexion !== 'todos' || estadoSeleccionado"
            @click="limpiarFiltros"
            class="px-3 py-1.5 rounded-lg text-xs font-medium bg-base border border-border text-secondary hover:text-neutral transition-colors"
          >
            Limpiar
          </button>
        </div>

        <!-- Toggle Vista -->
        <div class="flex rounded-lg border border-border overflow-hidden">
          <button
            @click="vistaActual = 'mapa'"
            class="px-4 py-2 text-sm font-medium transition-colors"
            :class="vistaActual === 'mapa'
              ? 'bg-primary text-white'
              : 'bg-base text-secondary hover:text-neutral'"
          >
            <MapIcon class="w-4 h-4 inline mr-1" />
            Mapa
          </button>
          <button
            @click="vistaActual = 'estadisticas'"
            class="px-4 py-2 text-sm font-medium transition-colors border-l border-border"
            :class="vistaActual === 'estadisticas'
              ? 'bg-primary text-white'
              : 'bg-base text-secondary hover:text-neutral'"
          >
            <BarChart3 class="w-4 h-4 inline mr-1" />
            Estadísticas
          </button>
        </div>
      </div>

      <!-- Panel de filtros expandible -->
      <div
        v-if="mostrarFiltros"
        class="bg-base rounded-xl p-4 border border-border space-y-3"
      >
        <h4 class="text-sm font-semibold text-neutral mb-3">Filtrar por Estado del Viaje</h4>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="estadoInfo in estadosDisponibles"
            :key="estadoInfo.estado"
            @click="aplicarFiltroEstado(estadoInfo.estado)"
            class="px-3 py-2 rounded-lg text-xs font-medium transition-colors border"
            :class="estadoSeleccionado === estadoInfo.estado
              ? 'bg-primary text-white border-primary'
              : 'bg-hover border-border text-neutral hover:border-primary'"
          >
            <span
              class="inline-block w-2 h-2 rounded-full mr-2"
              :style="{ backgroundColor: getColorEstado(estadoInfo.estado) }"
            ></span>
            {{ estadoInfo.estado }}
            <span class="ml-2 opacity-70">({{ estadoInfo.cantidad }})</span>
          </button>
        </div>
      </div>

      <!-- Vista Mapa -->
      <div v-if="vistaActual === 'mapa'" class="bg-base rounded-xl border border-border overflow-hidden">
        <div class="p-4 border-b border-border bg-hover">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <MapPin class="w-4 h-4 text-primary" />
              <h3 class="text-sm font-semibold text-neutral">Historial de Ubicaciones</h3>
            </div>
            <span class="text-xs text-secondary">
              Mostrando {{ puntosFiltrados.length.toLocaleString() }} ubicaciones
            </span>
          </div>
        </div>
        <div style="height: 500px;">
          <CamionHistorialMapa
            :puntos="puntosFiltrados"
            :tracking-actual="tracking"
            :filtro-actual="filtroConexion"
          />
        </div>
      </div>

      <!-- Vista Estadísticas -->
      <div v-if="vistaActual === 'estadisticas'" class="space-y-4">
        <!-- Estadísticas por estado -->
        <div class="bg-base rounded-xl p-4 border border-border">
          <h3 class="text-sm font-semibold text-neutral mb-4">Estadísticas por Estado</h3>
          <div class="space-y-3">
            <div
              v-for="estado in estadisticas.porEstado"
              :key="estado.estado"
              class="p-4 rounded-lg bg-hover"
            >
              <div class="flex items-start justify-between gap-4 mb-3">
                <div class="flex items-center gap-2">
                  <div
                    class="w-3 h-3 rounded-full"
                    :style="{ backgroundColor: getColorEstado(estado.estado) }"
                  ></div>
                  <h4 class="font-medium text-neutral">{{ estado.estado }}</h4>
                </div>
                <span class="text-xs font-medium px-2 py-1 rounded bg-blue-500/10 text-blue-700">
                  {{ estado.cantidad }} ubicaciones
                </span>
              </div>

              <div class="grid sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <div class="flex items-center gap-1 text-tertiary mb-1">
                    <TrendingUp class="w-3 h-3" />
                    <span class="text-xs">Distancia</span>
                  </div>
                  <p class="font-medium text-neutral">
                    {{ formatDistancia(estado.distancia) }}
                  </p>
                </div>

                <div>
                  <div class="flex items-center gap-1 text-tertiary mb-1">
                    <Clock class="w-3 h-3" />
                    <span class="text-xs">Duración</span>
                  </div>
                  <p class="font-medium text-neutral">
                    {{ formatDuracion(estado.duracion) }}
                  </p>
                </div>

                <div>
                  <div class="flex items-center gap-1 text-tertiary mb-1">
                    <Gauge class="w-3 h-3" />
                    <span class="text-xs">Vel. Promedio</span>
                  </div>
                  <p class="font-medium text-neutral">
                    {{ formatVelocidad(estado.velocidadPromedio) }}
                  </p>
                </div>

                <div>
                  <div class="flex items-center gap-1 text-tertiary mb-1">
                    <WifiOff class="w-3 h-3" />
                    <span class="text-xs">Offline</span>
                  </div>
                  <p class="font-medium text-neutral">
                    {{ estado.offline }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sin datos -->
    <div v-else class="text-center py-12">
      <div class="w-16 h-16 rounded-full bg-gray-500 flex items-center justify-center mx-auto mb-4">
        <MapPin class="w-8 h-8 text-white" />
      </div>
      <h3 class="text-lg font-semibold text-neutral mb-2">Sin historial disponible</h3>
      <p class="text-sm text-secondary">
        No hay datos de ubicaciones para este camión
      </p>
    </div>
  </div>
</template>