<!-- src/components/socio/LoteDetalleTabTransporte.vue -->
<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Truck, MapPin, Radio, WifiOff, Eye } from 'lucide-vue-next'
import { useTrackingWebSocket } from '@/composables/useTrackingWebSocket'
import CamionTrackingDetalle from './CamionTrackingDetalle.vue'

const props = defineProps({
  lote: {
    type: Object,
    required: true
  },
  loteId: {
    type: Number,
    required: true
  }
})

// Usar composable de WebSocket
const {
  trackingData,
  isConectado,
  conectar,
  desconectar,
  suscribirLote,
  desuscribirLote,
  suscribirCamion,
  desuscribirCamion
} = useTrackingWebSocket()

const camionSeleccionado = ref(null)
const mostrarDetalleCamion = ref(false)

// Computeds
const camionesConTracking = computed(() => {
  if (!props.lote?.asignaciones) return []
  
  return props.lote.asignaciones.map(asignacion => {
    const tracking = trackingData[asignacion.id] || null
    
    return {
      ...asignacion,
      tracking,
      enLinea: tracking?.estadoConexion === 'online',
      ubicacion: tracking?.ubicacionActual || null,
      metricas: tracking?.metricas || null
    }
  })
})

const camionesEnMovimiento = computed(() => {
  return camionesConTracking.value.filter(c => 
    c.tracking && 
    c.estado !== 'Completado' && 
    c.estado !== 'Cancelado por rechazo'
  ).length
})

// Funciones helper
const getEstadoColorSolido = (estado) => {
  if (!estado) return 'bg-gray-500'
  if (estado.includes('Pendiente') || estado.includes('Esperando')) {
    return 'bg-yellow-500'
  } else if (estado === 'Completado') {
    return 'bg-green-500'
  } else if (estado.includes('En camino') || estado.includes('Descargando')) {
    return 'bg-blue-500'
  } else {
    return 'bg-gray-500'
  }
}

const formatDateShort = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatDistancia = (distanciaKm) => {
  if (!distanciaKm) return '-'
  if (distanciaKm < 1) {
    return `${Math.round(distanciaKm * 1000)}m`
  }
  return `${distanciaKm.toFixed(1)}km`
}

const formatVelocidad = (velocidadKmh) => {
  if (!velocidadKmh) return '-'
  return `${Math.round(velocidadKmh)} km/h`
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

const verDetalleCamion = (camion) => {
  camionSeleccionado.value = camion
  mostrarDetalleCamion.value = true
  
  if (camion.id) {
    suscribirCamion(camion.id)
  }
}

const cerrarDetalleCamion = () => {
  if (camionSeleccionado.value?.id) {
    desuscribirCamion(camionSeleccionado.value.id)
  }
  
  mostrarDetalleCamion.value = false
  camionSeleccionado.value = null
}

// Lifecycle
onMounted(async () => {
  console.log('🔌 Montando tab de transporte')
  
  try {
    await conectar()
    
    if (props.loteId) {
      console.log(`📡 Suscribiendo a lote ${props.loteId}`)
      suscribirLote(props.loteId)
    }
  } catch (error) {
    console.error('❌ Error montando tracking:', error)
  }
})

onUnmounted(() => {
  console.log('🔌 Desmontando tab de transporte')
  
  try {
    if (props.loteId) {
      desuscribirLote(props.loteId)
    }
    
    if (camionSeleccionado.value?.id) {
      desuscribirCamion(camionSeleccionado.value.id)
    }
    
    desconectar()
  } catch (error) {
    console.error('❌ Error desmontando tracking:', error)
  }
})

watch(() => props.loteId, (nuevoId, viejoId) => {
  if (viejoId && nuevoId !== viejoId) {
    try {
      desuscribirLote(viejoId)
    } catch (error) {
      console.error('Error desuscribiendo lote anterior:', error)
    }
  }
  
  if (nuevoId) {
    try {
      suscribirLote(nuevoId)
    } catch (error) {
      console.error('Error suscribiendo nuevo lote:', error)
    }
  }
})
</script>

<template>
  <div class="space-y-4">
    <!-- Header con estado de conexión -->
    <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
            <Truck class="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 class="font-semibold text-neutral">Monitoreo en Tiempo Real</h3>
            <p class="text-sm text-secondary">
              {{ camionesEnMovimiento }} camión(es) en movimiento
            </p>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <div
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            :class="isConectado ? 'bg-green-500/10' : 'bg-red-500/10'"
          >
            <div
              class="w-2 h-2 rounded-full animate-pulse"
              :class="isConectado ? 'bg-green-500' : 'bg-red-500'"
            ></div>
            <span
              class="text-xs font-medium"
              :class="isConectado ? 'text-green-700' : 'text-red-700'"
            >
              {{ isConectado ? 'Conectado' : 'Desconectado' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Lista de camiones -->
    <div v-if="camionesConTracking.length > 0" class="space-y-3">
      <div
        v-for="camion in camionesConTracking"
        :key="camion.id"
        class="bg-base rounded-xl p-4 border border-border shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="flex items-start gap-4">
          <!-- Icono -->
          <div class="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
            <Truck class="w-6 h-6 text-white" />
          </div>

          <!-- Contenido -->
          <div class="flex-1 min-w-0">
            <!-- Header -->
            <div class="flex items-start justify-between gap-4 mb-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h4 class="font-semibold text-neutral">Camión #{{ camion.numeroCamion }}</h4>
                  
                  <!-- Indicador conexión -->
                  <div
                    v-if="camion.tracking"
                    class="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                    :class="camion.enLinea 
                      ? 'bg-green-500/10 text-green-700' 
                      : 'bg-gray-500/10 text-gray-700'"
                  >
                    <component 
                      :is="camion.enLinea ? Radio : WifiOff" 
                      class="w-3 h-3"
                    />
                    {{ camion.enLinea ? 'En línea' : 'Offline' }}
                  </div>
                </div>
                
                <p class="text-sm text-secondary mt-0.5 truncate">
                  {{ camion.transportistaNombre }}
                </p>
              </div>
              
              <!-- Estado -->
              <span
                class="px-3 py-1 rounded-lg text-xs font-medium shrink-0 text-white"
                :class="getEstadoColorSolido(camion.estado)"
              >
                {{ camion.estado }}
              </span>
            </div>

            <!-- Con tracking -->
            <div v-if="camion.tracking" class="space-y-2">
              <!-- Ubicación -->
              <div 
                v-if="camion.ubicacion"
                class="flex items-center gap-2 text-sm"
              >
                <MapPin class="w-4 h-4 text-secondary shrink-0" />
                <span class="text-secondary">
                  {{ camion.ubicacion.lat.toFixed(6) }}, 
                  {{ camion.ubicacion.lng.toFixed(6) }}
                </span>
                <span class="text-tertiary text-xs">
                  • {{ formatTiempoRelativo(camion.ubicacion.timestamp) }}
                </span>
              </div>

              <!-- Métricas -->
              <div 
                v-if="camion.metricas"
                class="grid grid-cols-3 gap-3 pt-2 border-t border-border"
              >
                <div>
                  <p class="text-xs text-tertiary">Distancia</p>
                  <p class="font-medium text-neutral text-sm">
                    {{ formatDistancia(camion.metricas.distanciaRecorrida) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-tertiary">Velocidad</p>
                  <p class="font-medium text-neutral text-sm">
                    {{ formatVelocidad(camion.ubicacion?.velocidad) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-tertiary">Vel. Promedio</p>
                  <p class="font-medium text-neutral text-sm">
                    {{ formatVelocidad(camion.metricas.velocidadPromedio) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Sin tracking -->
            <div v-else class="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-tertiary">Placa:</span>
                <span class="ml-2 font-medium text-neutral">{{ camion.transportistaPlaca }}</span>
              </div>
              <div v-if="camion.transportistaTelefono">
                <span class="text-tertiary">Teléfono:</span>
                <span class="ml-2 font-medium text-neutral">{{ camion.transportistaTelefono }}</span>
              </div>
              <div>
                <span class="text-tertiary">Asignado:</span>
                <span class="ml-2 font-medium text-neutral">{{ formatDateShort(camion.fechaAsignacion) }}</span>
              </div>
            </div>

            <!-- Botón detalle -->
            <div class="mt-3 pt-3 border-t border-border">
              <button
                @click="verDetalleCamion(camion)"
                class="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <Eye class="w-4 h-4" />
                <span>Ver detalles y mapa en tiempo real</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-else class="text-center py-12">
      <div class="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-4">
        <Truck class="w-8 h-8 text-white" />
      </div>
      <h3 class="text-lg font-semibold text-neutral mb-2">No hay camiones asignados</h3>
      <p class="text-sm text-secondary">
        Los camiones serán asignados una vez que la cooperativa apruebe el lote
      </p>
    </div>

    <!-- Modal detalle camión -->
    <CamionTrackingDetalle
      v-if="mostrarDetalleCamion && camionSeleccionado"
      :camion="camionSeleccionado"
      :tracking="trackingData[camionSeleccionado.id]"
      :lote="lote"
      @close="cerrarDetalleCamion"
    />
  </div>
</template>