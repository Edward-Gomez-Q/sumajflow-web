<!-- src/components/socio/CamionTrackingDetalle.vue -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
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
  Circle,
  Map as MapIcon,
  History,
  Camera,
  FileText,
  Image as ImageIcon,
  MapPinned,
  Package
} from 'lucide-vue-next'
import CamionTrackingMapa from './CamionTrackingMapa.vue'
import CamionTrackingHistorial from './CamionTrackingHistorial.vue'
import { useSessionStore } from '@/stores/sessionStore'
import rutaApi from '@/assets/rutaApi.js'

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

const sessionStore = useSessionStore()
const tabActual = ref('tiempo-real')

// Estado para tracking completado
const trackingCompletado = ref(null)
const loadingResumen = ref(false)

// 🆕 Estado para evidencias
const evidencias = ref(null)
const loadingEvidencias = ref(false)

const viajeCompletado = computed(() => {
  return props.tracking?.estadoViaje === 'Completado' || 
         props.camion?.estado === 'Completado'
})

// Usar tracking completado si está disponible, sino usar el tracking en vivo
const trackingActual = computed(() => {
  return trackingCompletado.value || props.tracking
})

const ubicacionActual = computed(() => trackingActual.value?.ubicacionActual || null)
const metricas = computed(() => trackingActual.value?.metricas || null)
const puntosControl = computed(() => trackingActual.value?.puntosControl || [])
const eventosEstado = computed(() => trackingActual.value?.eventosEstado || [])

const estadoConexion = computed(() => {
  if (viajeCompletado.value) return 'completado'
  return trackingActual.value?.estadoConexion || 'offline'
})

const enLinea = computed(() => estadoConexion.value === 'online')

// Cargar resumen final si está completado
onMounted(async () => {
  if (viajeCompletado.value && props.camion?.id) {
    await cargarResumenFinal(props.camion.id)
  }
  // Cargar evidencias al montar
  await cargarEvidencias()
})

// 🆕 Watch para recargar evidencias cuando cambian los eventos de estado
watch(() => trackingActual.value?.eventosEstado?.length, (newLength, oldLength) => {
  if (newLength > oldLength && tabActual.value === 'evidencias') {
    cargarEvidencias()
  }
})

const cargarResumenFinal = async (asignacionId) => {
  loadingResumen.value = true
  
  try {
    const response = await fetch(
      `${rutaApi}/tracking/asignacion/${asignacionId}/resumen-final`,
      {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const data = await response.json()

    if (data.success) {
      trackingCompletado.value = data.data
      console.log('✅ Resumen final cargado:', trackingCompletado.value)
    } else {
      console.error('❌ Error al cargar resumen:', data.message)
    }
  } catch (error) {
    console.error('❌ Error cargando resumen final:', error)
  } finally {
    loadingResumen.value = false
  }
}

// 🆕 Cargar evidencias del viaje
const cargarEvidencias = async () => {
  if (!props.camion?.id) return
  
  loadingEvidencias.value = true
  
  try {
    const response = await fetch(
      `${rutaApi}/tracking/asignacion/${props.camion.id}/evidencias`,
      {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const data = await response.json()

    if (data.success) {
      evidencias.value = data.data
      console.log('✅ Evidencias cargadas:', evidencias.value)
    } else {
      console.error('❌ Error al cargar evidencias:', data.message)
    }
  } catch (error) {
    console.error('❌ Error cargando evidencias:', error)
  } finally {
    loadingEvidencias.value = false
  }
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

// 🆕 Obtener URL completa de imagen
const getImageUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${rutaApi}/files/${path}`
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-10001 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm p-4"
      @click.self="emit('close')"
    >
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] border border-border flex flex-col">
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
                <!-- Indicador de estado -->
                <div
                  v-if="viajeCompletado"
                  class="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-700"
                >
                  <CheckCircle2 class="w-3 h-3" />
                  Completado
                </div>
                <div
                  v-else
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

        <!-- Tabs -->
        <div class="flex border-b border-border px-4 sm:px-6 shrink-0 overflow-x-auto">
          <button
            @click="tabActual = 'tiempo-real'"
            class="px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap"
            :class="tabActual === 'tiempo-real' 
              ? 'text-primary' 
              : 'text-secondary hover:text-neutral'"
          >
            <div class="flex items-center gap-2">
              <MapIcon class="w-4 h-4" />
              <span>{{ viajeCompletado ? 'Resumen Final' : 'Tiempo Real' }}</span>
            </div>
            <div
              v-if="tabActual === 'tiempo-real'"
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            ></div>
          </button>
          
          <button
            @click="tabActual = 'historial'"
            class="px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap"
            :class="tabActual === 'historial' 
              ? 'text-primary' 
              : 'text-secondary hover:text-neutral'"
          >
            <div class="flex items-center gap-2">
              <History class="w-4 h-4" />
              <span>Historial</span>
            </div>
            <div
              v-if="tabActual === 'historial'"
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            ></div>
          </button>

          <!-- 🆕 Tab de Evidencias -->
          <button
            @click="tabActual = 'evidencias'; cargarEvidencias()"
            class="px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap"
            :class="tabActual === 'evidencias' 
              ? 'text-primary' 
              : 'text-secondary hover:text-neutral'"
          >
            <div class="flex items-center gap-2">
              <Camera class="w-4 h-4" />
              <span>Evidencias</span>
            </div>
            <div
              v-if="tabActual === 'evidencias'"
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            ></div>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto scrollbar-custom">
          <!-- Tab Resumen Final / Tiempo Real -->
          <div v-if="tabActual === 'tiempo-real'" class="p-4 sm:p-6">
            <!-- Loading resumen -->
            <div v-if="loadingResumen" class="text-center py-12">
              <div class="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Truck class="w-8 h-8 text-white" />
              </div>
              <p class="text-sm text-secondary">Cargando resumen final...</p>
            </div>

            <!-- Sin tracking -->
            <div v-else-if="!trackingActual" class="text-center py-12">
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

          <!-- Tab Historial -->
          <div v-if="tabActual === 'historial'">
            <CamionTrackingHistorial
              :asignacion-id="camion.id"
              :tracking="trackingActual"
            />
          </div>

          <!-- 🆕 Tab Evidencias -->
          <div v-if="tabActual === 'evidencias'" class="p-4 sm:p-6">
            <!-- Loading evidencias -->
            <div v-if="loadingEvidencias" class="text-center py-12">
              <div class="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Camera class="w-8 h-8 text-white" />
              </div>
              <p class="text-sm text-secondary">Cargando evidencias...</p>
            </div>

            <!-- Sin evidencias -->
            <div v-else-if="!evidencias" class="text-center py-12">
              <div class="w-16 h-16 rounded-full bg-gray-500 flex items-center justify-center mx-auto mb-4">
                <FileText class="w-8 h-8 text-white" />
              </div>
              <h3 class="text-lg font-semibold text-neutral mb-2">Sin evidencias</h3>
              <p class="text-sm text-secondary">
                Aún no hay evidencias registradas para este viaje
              </p>
            </div>

            <!-- Con evidencias -->
            <div v-else class="space-y-4">
              <!-- Inicio de viaje -->
              <div v-if="evidencias.inicioViaje" class="bg-base rounded-xl p-4 border border-border">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <MapPinned class="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <h4 class="text-sm font-semibold text-neutral">Inicio de Viaje</h4>
                    <p class="text-xs text-tertiary">{{ formatDateTime(evidencias.inicioViaje.timestamp) }}</p>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p class="text-xs text-tertiary">Ubicación</p>
                    <p class="text-neutral font-medium">{{ evidencias.inicioViaje.lat?.toFixed(6) }}, {{ evidencias.inicioViaje.lng?.toFixed(6) }}</p>
                  </div>
                  <div v-if="evidencias.inicioViaje.dispositivo">
                    <p class="text-xs text-tertiary">Dispositivo</p>
                    <p class="text-neutral font-medium capitalize">{{ evidencias.inicioViaje.dispositivo.replace('_', ' ') }}</p>
                  </div>
                </div>
              </div>

              <!-- Llegada a mina -->
              <div v-if="evidencias.llegadaMina" class="bg-base rounded-xl p-4 border border-border">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <MapPin class="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <h4 class="text-sm font-semibold text-neutral">Llegada a Mina</h4>
                    <p class="text-xs text-tertiary">{{ formatDateTime(evidencias.llegadaMina.timestamp) }}</p>
                  </div>
                </div>
                <div class="space-y-2">
                  <div v-if="evidencias.llegadaMina.observaciones" class="text-sm">
                    <p class="text-xs text-tertiary">Observaciones</p>
                    <p class="text-neutral">{{ evidencias.llegadaMina.observaciones }}</p>
                  </div>
                  <div class="flex gap-3">
                    <div v-if="evidencias.llegadaMina.palaOperativa !== null" class="flex items-center gap-1.5">
                      <CheckCircle2 v-if="evidencias.llegadaMina.palaOperativa" class="w-4 h-4 text-green-500" />
                      <X v-else class="w-4 h-4 text-red-500" />
                      <span class="text-xs text-secondary">Pala operativa</span>
                    </div>
                    <div v-if="evidencias.llegadaMina.mineralVisible !== null" class="flex items-center gap-1.5">
                      <CheckCircle2 v-if="evidencias.llegadaMina.mineralVisible" class="w-4 h-4 text-green-500" />
                      <X v-else class="w-4 h-4 text-red-500" />
                      <span class="text-xs text-secondary">Mineral visible</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Carguío completo -->
              <div v-if="evidencias.carguioCompleto" class="bg-base rounded-xl p-4 border border-border">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Package class="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <h4 class="text-sm font-semibold text-neutral">Carguío Completo</h4>
                    <p class="text-xs text-tertiary">{{ formatDateTime(evidencias.carguioCompleto.timestamp) }}</p>
                  </div>
                </div>
                <div class="space-y-3">
                  <div v-if="evidencias.carguioCompleto.mineralCargadoCompletamente !== null" class="flex items-center gap-1.5">
                    <CheckCircle2 v-if="evidencias.carguioCompleto.mineralCargadoCompletamente" class="w-4 h-4 text-green-500" />
                    <X v-else class="w-4 h-4 text-red-500" />
                    <span class="text-xs text-secondary">Mineral cargado completamente</span>
                  </div>
                  <div v-if="evidencias.carguioCompleto.fotoCamionCargadoUrl" class="space-y-2">
                    <p class="text-xs text-tertiary">Foto del camión cargado</p>
                    <img 
                      :src="getImageUrl(evidencias.carguioCompleto.fotoCamionCargadoUrl)" 
                      alt="Camión cargado"
                      class="w-full max-w-md rounded-lg border border-border cursor-pointer hover:opacity-90 transition"
                      @click="window.open(getImageUrl(evidencias.carguioCompleto.fotoCamionCargadoUrl), '_blank')"
                    />
                  </div>
                </div>
              </div>

              <!-- Pesaje origen -->
              <div v-if="evidencias.pesajeOrigen" class="bg-base rounded-xl p-4 border border-border">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Gauge class="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <h4 class="text-sm font-semibold text-neutral">Pesaje Origen</h4>
                    <p class="text-xs text-tertiary">{{ formatDateTime(evidencias.pesajeOrigen.timestamp) }}</p>
                  </div>
                </div>
                <div class="space-y-3">
                  <div class="grid grid-cols-3 gap-3">
                    <div class="text-center p-2 bg-hover rounded-lg">
                      <p class="text-xs text-tertiary">Peso Bruto</p>
                      <p class="text-lg font-bold text-neutral">{{ evidencias.pesajeOrigen.pesoBrutoKg }} kg</p>
                    </div>
                    <div class="text-center p-2 bg-hover rounded-lg">
                      <p class="text-xs text-tertiary">Peso Tara</p>
                      <p class="text-lg font-bold text-neutral">{{ evidencias.pesajeOrigen.pesoTaraKg }} kg</p>
                    </div>
                    <div class="text-center p-2 bg-green-500/10 rounded-lg">
                      <p class="text-xs text-green-700">Peso Neto</p>
                      <p class="text-lg font-bold text-green-700">{{ evidencias.pesajeOrigen.pesoNetoKg }} kg</p>
                    </div>
                  </div>
                  <div v-if="evidencias.pesajeOrigen.observaciones" class="text-sm">
                    <p class="text-xs text-tertiary">Observaciones</p>
                    <p class="text-neutral">{{ evidencias.pesajeOrigen.observaciones }}</p>
                  </div>
                  <div v-if="evidencias.pesajeOrigen.ticketPesajeUrl" class="space-y-2">
                    <p class="text-xs text-tertiary">Ticket de pesaje</p>
                    <img 
                      :src="getImageUrl(evidencias.pesajeOrigen.ticketPesajeUrl)" 
                      alt="Ticket de pesaje origen"
                      class="w-full max-w-md rounded-lg border border-border cursor-pointer hover:opacity-90 transition"
                      @click="window.open(getImageUrl(evidencias.pesajeOrigen.ticketPesajeUrl), '_blank')"
                    />
                  </div>
                </div>
              </div>

              <!-- Pesaje destino -->
              <div v-if="evidencias.pesajeDestino" class="bg-base rounded-xl p-4 border border-border">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Gauge class="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <h4 class="text-sm font-semibold text-neutral">Pesaje Destino</h4>
                    <p class="text-xs text-tertiary">{{ formatDateTime(evidencias.pesajeDestino.timestamp) }}</p>
                  </div>
                </div>
                <div class="space-y-3">
                  <div class="grid grid-cols-3 gap-3">
                    <div class="text-center p-2 bg-hover rounded-lg">
                      <p class="text-xs text-tertiary">Peso Bruto</p>
                      <p class="text-lg font-bold text-neutral">{{ evidencias.pesajeDestino.pesoBrutoKg }} kg</p>
                    </div>
                    <div class="text-center p-2 bg-hover rounded-lg">
                      <p class="text-xs text-tertiary">Peso Tara</p>
                      <p class="text-lg font-bold text-neutral">{{ evidencias.pesajeDestino.pesoTaraKg }} kg</p>
                    </div>
                    <div class="text-center p-2 bg-green-500/10 rounded-lg">
                      <p class="text-xs text-green-700">Peso Neto</p>
                      <p class="text-lg font-bold text-green-700">{{ evidencias.pesajeDestino.pesoNetoKg }} kg</p>
                    </div>
                  </div>
                  <div v-if="evidencias.pesajeDestino.observaciones" class="text-sm">
                    <p class="text-xs text-tertiary">Observaciones</p>
                    <p class="text-neutral">{{ evidencias.pesajeDestino.observaciones }}</p>
                  </div>
                  <div v-if="evidencias.pesajeDestino.ticketPesajeUrl" class="space-y-2">
                    <p class="text-xs text-tertiary">Ticket de pesaje</p>
                    <img 
                      :src="getImageUrl(evidencias.pesajeDestino.ticketPesajeUrl)" 
                      alt="Ticket de pesaje destino"
                      class="w-full max-w-md rounded-lg border border-border cursor-pointer hover:opacity-90 transition"
                      @click="window.open(getImageUrl(evidencias.pesajeDestino.ticketPesajeUrl), '_blank')"
                    />
                  </div>
                </div>
              </div>

              <!-- Llegada almacén -->
              <div v-if="evidencias.llegadaAlmacen" class="bg-base rounded-xl p-4 border border-border">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <MapPin class="w-4 h-4 text-indigo-500" />
                  </div>
                  <div>
                    <h4 class="text-sm font-semibold text-neutral">Llegada a Almacén</h4>
                    <p class="text-xs text-tertiary">{{ formatDateTime(evidencias.llegadaAlmacen.timestamp) }}</p>
                  </div>
                </div>
                <div class="space-y-2">
                  <div v-if="evidencias.llegadaAlmacen.observaciones" class="text-sm">
                    <p class="text-xs text-tertiary">Observaciones</p>
                    <p class="text-neutral">{{ evidencias.llegadaAlmacen.observaciones }}</p>
                  </div>
                  <div v-if="evidencias.llegadaAlmacen.confirmacionLlegada !== null" class="flex items-center gap-1.5">
                    <CheckCircle2 v-if="evidencias.llegadaAlmacen.confirmacionLlegada" class="w-4 h-4 text-green-500" />
                    <X v-else class="w-4 h-4 text-red-500" />
                    <span class="text-xs text-secondary">Confirmación de llegada</span>
                  </div>
                </div>
              </div>

              <!-- Descarga iniciada -->
              <div v-if="evidencias.descargaIniciada" class="bg-base rounded-xl p-4 border border-border">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Package class="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <h4 class="text-sm font-semibold text-neutral">Descarga Iniciada</h4>
                    <p class="text-xs text-tertiary">{{ formatDateTime(evidencias.descargaIniciada.timestamp) }}</p>
                  </div>
                </div>
                <div v-if="evidencias.descargaIniciada.observaciones" class="text-sm">
                  <p class="text-xs text-tertiary">Observaciones</p>
                  <p class="text-neutral">{{ evidencias.descargaIniciada.observaciones }}</p>
                </div>
              </div>

              <!-- Ruta finalizada -->
              <div v-if="evidencias.rutaFinalizada" class="bg-base rounded-xl p-4 border border-green-500/20">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 class="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <h4 class="text-sm font-semibold text-neutral">Ruta Finalizada</h4>
                    <p class="text-xs text-tertiary">{{ formatDateTime(evidencias.rutaFinalizada.timestamp) }}</p>
                  </div>
                </div>
                <div v-if="evidencias.rutaFinalizada.observacionesFinales" class="text-sm">
                  <p class="text-xs text-tertiary">Observaciones finales</p>
                  <p class="text-neutral">{{ evidencias.rutaFinalizada.observacionesFinales }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>