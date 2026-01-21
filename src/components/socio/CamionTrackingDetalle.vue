<!-- src/components/socio/CamionTrackingDetalle.vue -->
<script setup>
import { computed } from 'vue'
import {
  X,
  Truck,
  MapPin,
  Navigation,
  Gauge,
  Clock,
  TrendingUp,
  Radio,
  WifiOff,
  CheckCircle2,
  Circle
} from 'lucide-vue-next'
import CamionTrackingMapa from './CamionTrackingMapa.vue'

const props = defineProps({
  camion: {
    type: Object,
    required: true
  },
  tracking: {
    type: Object,
    default: null
  },
    lote: { 
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

// Computed
const ubicacionActual = computed(() => props.tracking?.ubicacionActual || null)
const metricas = computed(() => props.tracking?.metricas || null)
const puntosControl = computed(() => props.tracking?.puntosControl || [])
const eventosEstado = computed(() => props.tracking?.eventosEstado || [])
const estadoConexion = computed(() => props.tracking?.estadoConexion || 'offline')

const enLinea = computed(() => estadoConexion.value === 'online')

// Formatters
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

const formatTiempoRelativo = (timestamp) => {
  if (!timestamp) return '-'
  const ahora = new Date()
  const fecha = new Date(timestamp)
  const diff = Math.floor((ahora - fecha) / 1000)
  
  if (diff < 60) return 'Justo ahora'
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`
  return `Hace ${Math.floor(diff / 86400)}d`
}

const formatDateTime = (timestamp) => {
  if (!timestamp) return '-'
  const fecha = new Date(timestamp)
  return fecha.toLocaleString('es-BO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getEstadoPuntoColor = (estado) => {
  switch (estado) {
    case 'completado':
      return 'text-green-500'
    case 'en_punto':
      return 'text-blue-500'
    case 'pendiente':
    default:
      return 'text-gray-400'
  }
}

const getEstadoPuntoIcon = (estado) => {
  return estado === 'completado' ? CheckCircle2 : Circle
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-10001 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4"
      @click.self="emit('close')"
    >
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] border border-border flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-hover shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
              <Truck class="w-6 h-6 text-white" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-semibold text-neutral">
                  Camión #{{ camion.numeroCamion }}
                </h2>
                <div
                  class="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                  :class="enLinea 
                    ? 'bg-green-500/10 text-green-700' 
                    : 'bg-gray-500/10 text-gray-700'"
                >
                  <component 
                    :is="enLinea ? Radio : WifiOff" 
                    class="w-3 h-3"
                  />
                  {{ enLinea ? 'En línea' : 'Offline' }}
                </div>
              </div>
              <p class="text-sm text-secondary mt-0.5">
                {{ camion.transportistaNombre }} • {{ camion.transportistaPlaca }}
              </p>
            </div>
          </div>
          <button
            @click="emit('close')"
            class="w-10 h-10 rounded-lg hover:bg-surface transition-colors flex items-center justify-center text-secondary hover:text-neutral"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto scrollbar-custom p-4 sm:p-6">
          <!-- Sin tracking -->
          <div v-if="!tracking" class="text-center py-12">
            <div class="w-16 h-16 rounded-full bg-gray-500 flex items-center justify-center mx-auto mb-4">
              <WifiOff class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-lg font-semibold text-neutral mb-2">Sin datos de tracking</h3>
            <p class="text-sm text-secondary">
              Este camión aún no ha iniciado su viaje
            </p>
          </div>

          <!-- Con tracking -->
          <div v-else class="space-y-6">
            <!-- Mapa en tiempo real -->
            <div class="bg-base rounded-xl border border-border overflow-hidden">
              <div class="p-4 border-b border-border bg-hover">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <MapPin class="w-4 h-4 text-primary" />
                    <h3 class="text-sm font-semibold text-neutral">Mapa en Tiempo Real</h3>
                  </div>
                  <div class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10">
                    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span class="text-xs font-medium text-green-700">En vivo</span>
                  </div>
                </div>
              </div>
              <div style="height: 400px;">
                <CamionTrackingMapa
                  :tracking-data="tracking"
                />
              </div>
            </div>

            <!-- Ubicación actual -->
            <div 
              v-if="ubicacionActual"
              class="bg-base rounded-xl p-4 border border-border"
            >
              <h3 class="text-sm font-medium text-secondary mb-3 flex items-center gap-2">
                <MapPin class="w-4 h-4" />
                Ubicación Actual
              </h3>
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <p class="text-xs text-tertiary">Coordenadas</p>
                  <p class="font-mono text-sm text-neutral mt-1">
                    {{ ubicacionActual.lat.toFixed(6) }}, {{ ubicacionActual.lng.toFixed(6) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-tertiary">Última actualización</p>
                  <p class="text-sm text-neutral mt-1">
                    {{ formatTiempoRelativo(ubicacionActual.timestamp) }}
                  </p>
                </div>
                <div v-if="ubicacionActual.velocidad !== undefined">
                  <p class="text-xs text-tertiary">Velocidad</p>
                  <p class="text-lg font-semibold text-neutral mt-1">
                    {{ formatVelocidad(ubicacionActual.velocidad) }}
                  </p>
                </div>
                <div v-if="ubicacionActual.rumbo !== undefined">
                  <p class="text-xs text-tertiary">Rumbo</p>
                  <div class="flex items-center gap-2 mt-1">
                    <Navigation 
                      class="w-4 h-4 text-primary"
                      :style="{ transform: `rotate(${ubicacionActual.rumbo}deg)` }"
                    />
                    <span class="text-sm text-neutral">{{ Math.round(ubicacionActual.rumbo) }}°</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Métricas del viaje -->
            <div 
              v-if="metricas"
              class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <div class="bg-base rounded-xl p-4 border border-border">
                <div class="flex items-center gap-2 mb-2">
                  <TrendingUp class="w-4 h-4 text-blue-500" />
                  <p class="text-xs text-tertiary">Distancia Recorrida</p>
                </div>
                <p class="text-2xl font-bold text-neutral">
                  {{ formatDistancia(metricas.distanciaRecorrida) }}
                </p>
              </div>

              <div class="bg-base rounded-xl p-4 border border-border">
                <div class="flex items-center gap-2 mb-2">
                  <Gauge class="w-4 h-4 text-purple-500" />
                  <p class="text-xs text-tertiary">Vel. Promedio</p>
                </div>
                <p class="text-2xl font-bold text-neutral">
                  {{ formatVelocidad(metricas.velocidadPromedio) }}
                </p>
              </div>

              <div class="bg-base rounded-xl p-4 border border-border">
                <div class="flex items-center gap-2 mb-2">
                  <Gauge class="w-4 h-4 text-red-500" />
                  <p class="text-xs text-tertiary">Vel. Máxima</p>
                </div>
                <p class="text-2xl font-bold text-neutral">
                  {{ formatVelocidad(metricas.velocidadMaxima) }}
                </p>
              </div>

              <div class="bg-base rounded-xl p-4 border border-border">
                <div class="flex items-center gap-2 mb-2">
                  <Clock class="w-4 h-4 text-green-500" />
                  <p class="text-xs text-tertiary">Tiempo en Movimiento</p>
                </div>
                <p class="text-2xl font-bold text-neutral">
                  {{ formatDuracion(metricas.tiempoEnMovimiento) }}
                </p>
              </div>
            </div>

            <!-- Puntos de control -->
            <div 
              v-if="puntosControl.length > 0"
              class="bg-base rounded-xl p-4 border border-border"
            >
              <h3 class="text-sm font-medium text-secondary mb-4">Puntos de Control</h3>
              <div class="space-y-3">
                <div
                  v-for="punto in puntosControl"
                  :key="punto.tipo"
                  class="flex items-start gap-3 p-3 rounded-lg bg-hover"
                >
                  <component
                    :is="getEstadoPuntoIcon(punto.estado)"
                    class="w-5 h-5 shrink-0 mt-0.5"
                    :class="getEstadoPuntoColor(punto.estado)"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <p class="font-medium text-neutral">{{ punto.nombre }}</p>
                        <p class="text-xs text-tertiary mt-0.5 capitalize">{{ punto.tipo.replace(/_/g, ' ') }}</p>
                      </div>
                      <span
                        class="px-2 py-0.5 rounded text-xs font-medium shrink-0"
                        :class="{
                          'bg-green-500/10 text-green-700': punto.estado === 'completado',
                          'bg-blue-500/10 text-blue-700': punto.estado === 'en_punto',
                          'bg-gray-500/10 text-gray-700': punto.estado === 'pendiente'
                        }"
                      >
                        {{ punto.estado === 'completado' ? 'Completado' : punto.estado === 'en_punto' ? 'En punto' : 'Pendiente' }}
                      </span>
                    </div>
                    <div v-if="punto.llegada || punto.salida" class="mt-2 text-xs text-secondary space-y-1">
                      <div v-if="punto.llegada">
                        <span class="text-tertiary">Llegada:</span> {{ formatDateTime(punto.llegada) }}
                      </div>
                      <div v-if="punto.salida">
                        <span class="text-tertiary">Salida:</span> {{ formatDateTime(punto.salida) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Eventos de estado -->
            <div 
              v-if="eventosEstado && eventosEstado.length > 0"
              class="bg-base rounded-xl p-4 border border-border"
            >
              <h3 class="text-sm font-medium text-secondary mb-4">Historial de Eventos</h3>
              <div class="space-y-2">
                <div
                  v-for="(evento, index) in eventosEstado"
                  :key="index"
                  class="flex items-start gap-3 p-3 rounded-lg bg-hover text-sm"
                >
                  <div class="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5"></div>
                  <div class="flex-1">
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <p class="font-medium text-neutral">{{ evento.tipoEvento.replace(/_/g, ' ') }}</p>
                        <p class="text-xs text-secondary mt-1">
                          {{ evento.estadoAnterior }} → {{ evento.estadoNuevo }}
                        </p>
                      </div>
                      <span class="text-xs text-tertiary whitespace-nowrap">
                        {{ formatDateTime(evento.timestamp) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>