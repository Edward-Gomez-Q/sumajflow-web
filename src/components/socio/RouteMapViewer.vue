<!-- src/components/socio/RouteMapViewer.vue -->
<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
import { MapPin, Navigation, Clock, Route as RouteIcon, AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  origen: {
    type: Object, // { id, nombre, latitud, longitud, sectorColor }
    default: null
  },
  destino: {
    type: Object, // { id, razonSocial, latitud, longitud, municipio }
    default: null
  },
  tipoDestino: {
    type: String, // 'ingenio' o 'comercializadora'
    default: 'ingenio'
  }
})

const mapContainer = ref(null)
const map = ref(null)
const isMapReady = ref(false)
const originMarker = ref(null)
const destinationMarker = ref(null)
const routeLine = ref(null)

// Datos de la ruta
const routeData = ref({
  distance: null, // en km
  duration: null, // en minutos
  geometry: null,
  loading: false,
  error: null
})

// Computed
const hasCompleteData = computed(() => {
  return props.origen && props.destino && 
         props.origen.latitud && props.origen.longitud &&
         props.destino.latitud && props.destino.longitud
})

const distanceFormatted = computed(() => {
  if (!routeData.value.distance) return '-'
  return `${routeData.value.distance.toFixed(1)} km`
})

const durationFormatted = computed(() => {
  if (!routeData.value.duration) return '-'
  const hours = Math.floor(routeData.value.duration / 60)
  const minutes = Math.round(routeData.value.duration % 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`
  }
  return `${minutes} min`
})

onMounted(async () => {
  await nextTick()
  loadLeafletAndInit()
})

onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})

// Watch para actualizar el mapa cuando cambien origen/destino
watch([() => props.origen, () => props.destino], async () => {
  if (isMapReady.value && hasCompleteData.value) {
    await drawRoute()
  } else if (isMapReady.value) {
    clearRoute()
  }
}, { deep: true })

const loadLeafletAndInit = async () => {
  if (typeof window.L !== 'undefined') {
    await nextTick()
    initMap()
    return
  }

  if (!document.querySelector('link[href*="leaflet.css"]')) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
  }

  if (!document.querySelector('script[src*="leaflet.js"]')) {
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = async () => {
      await nextTick()
      setTimeout(() => {
        initMap()
      }, 100)
    }
    document.head.appendChild(script)
  }
}

const initMap = () => {
  if (!window.L || !mapContainer.value || map.value) return

  try {
    // Centro de Bolivia por defecto
    let centerLat = -19.583333
    let centerLng = -65.75
    let zoom = 6

    map.value = window.L.map(mapContainer.value, {
      center: [centerLat, centerLng],
      zoom: zoom,
      zoomControl: true,
      preferCanvas: true
    })

    // Capa de mapa
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map.value)

    isMapReady.value = true

    // Si ya hay datos, dibujar la ruta
    if (hasCompleteData.value) {
      drawRoute()
    }
  } catch (error) {
    console.error('Error al inicializar mapa:', error)
  }
}

const clearRoute = () => {
  // Limpiar marcadores
  if (originMarker.value) {
    map.value.removeLayer(originMarker.value)
    originMarker.value = null
  }
  if (destinationMarker.value) {
    map.value.removeLayer(destinationMarker.value)
    destinationMarker.value = null
  }
  
  // Limpiar línea de ruta
  if (routeLine.value) {
    map.value.removeLayer(routeLine.value)
    routeLine.value = null
  }

  // Reset datos
  routeData.value = {
    distance: null,
    duration: null,
    geometry: null,
    loading: false,
    error: null
  }
}

const drawRoute = async () => {
  if (!map.value || !window.L || !hasCompleteData.value) return

  clearRoute()
  routeData.value.loading = true
  routeData.value.error = null

  try {
    // 1. Obtener la ruta desde OSRM
    const route = await fetchRoute(
      props.origen.latitud, 
      props.origen.longitud,
      props.destino.latitud,
      props.destino.longitud
    )

    if (!route) {
      throw new Error('No se pudo calcular la ruta')
    }

    routeData.value.distance = route.distance / 1000 // convertir a km
    routeData.value.duration = route.duration / 60 // convertir a minutos
    routeData.value.geometry = route.geometry

    // 2. Dibujar marcador de origen
    const originColor = props.origen.sectorColor || '#1E3A8A'
    originMarker.value = createMarker(
      props.origen.latitud,
      props.origen.longitud,
      originColor,
      'origen',
      props.origen.nombre
    )

    // 3. Dibujar marcador de destino
    const destinationColor = props.tipoDestino === 'ingenio' ? '#059669' : '#DC2626'
    destinationMarker.value = createMarker(
      props.destino.latitud,
      props.destino.longitud,
      destinationColor,
      'destino',
      props.destino.razonSocial,
      props.destino.municipio
    )

    // 4. Dibujar línea de ruta
    const routeCoordinates = decodePolyline(route.geometry)
    routeLine.value = window.L.polyline(routeCoordinates, {
      color: '#3B82F6',
      weight: 4,
      opacity: 0.7,
      smoothFactor: 1
    }).addTo(map.value)

    // 5. Ajustar vista del mapa para mostrar toda la ruta
    const bounds = window.L.latLngBounds([
      [props.origen.latitud, props.origen.longitud],
      [props.destino.latitud, props.destino.longitud]
    ])
    map.value.fitBounds(bounds, { padding: [60, 60] })

  } catch (error) {
    console.error('Error al dibujar ruta:', error)
    routeData.value.error = error.message || 'Error al calcular la ruta'
    
    // Aún así mostrar los puntos sin ruta
    const originColor = props.origen.sectorColor || '#1E3A8A'
    originMarker.value = createMarker(
      props.origen.latitud,
      props.origen.longitud,
      originColor,
      'origen',
      props.origen.nombre
    )

    const destinationColor = props.tipoDestino === 'ingenio' ? '#059669' : '#DC2626'
    destinationMarker.value = createMarker(
      props.destino.latitud,
      props.destino.longitud,
      destinationColor,
      'destino',
      props.destino.razonSocial,
      props.destino.municipio
    )

    // Dibujar línea directa como fallback
    const straightLine = window.L.polyline([
      [props.origen.latitud, props.origen.longitud],
      [props.destino.latitud, props.destino.longitud]
    ], {
      color: '#9CA3AF',
      weight: 2,
      opacity: 0.5,
      dashArray: '10, 10'
    }).addTo(map.value)
    routeLine.value = straightLine

    // Calcular distancia en línea recta
    const distance = calculateStraightDistance(
      props.origen.latitud, 
      props.origen.longitud,
      props.destino.latitud,
      props.destino.longitud
    )
    routeData.value.distance = distance

    const bounds = window.L.latLngBounds([
      [props.origen.latitud, props.origen.longitud],
      [props.destino.latitud, props.destino.longitud]
    ])
    map.value.fitBounds(bounds, { padding: [60, 60] })

  } finally {
    routeData.value.loading = false
  }
}

const fetchRoute = async (originLat, originLng, destLat, destLng) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=polyline`
    
    const response = await fetch(url)
    const data = await response.json()

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No se encontró una ruta')
    }

    return {
      distance: data.routes[0].distance,
      duration: data.routes[0].duration,
      geometry: data.routes[0].geometry
    }
  } catch (error) {
    console.error('Error al obtener ruta de OSRM:', error)
    throw error
  }
}

const createMarker = (lat, lng, color, type, name, subtitle = '') => {
  const isOrigin = type === 'origen'
  
  const icon = window.L.divIcon({
    className: 'custom-route-marker',
    html: `
      <div style="
        position: relative;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: ${color};
        color: white;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      ">
        ${isOrigin ? `
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m8 3 4 8 5-5 5 15H2L8 3z"></path>
          </svg>
        ` : `
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        `}
      </div>
      <div style="
        position: absolute;
        top: -32px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        color: #1E293B;
        padding: 6px 12px;
        border-radius: 8px;
        white-space: nowrap;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        border: 2px solid ${color};
      ">${isOrigin ? 'ORIGEN' : 'DESTINO'}</div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -48]
  })

  const marker = window.L.marker([lat, lng], {
    icon: icon,
    zIndexOffset: isOrigin ? 1000 : 900
  }).addTo(map.value)

  const popupContent = `
    <div style="text-align: center; min-width: 200px; padding: 6px;">
      <div style="width: 36px; height: 36px; background-color: ${color}; border-radius: 50%; margin: 0 auto 10px; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.2);"></div>
      <strong style="font-size: 15px; color: #1E293B; display: block; margin-bottom: 4px;">${name}</strong>
      ${subtitle ? `<span style="font-size: 12px; color: #64748b; display: block; margin-bottom: 8px;">${subtitle}</span>` : ''}
      <div style="margin: 8px 0; padding: 6px; background: #f1f5f9; border-radius: 6px;">
        <span style="font-size: 11px; color: #64748b; display: block;">Lat: ${lat.toFixed(6)}</span>
        <span style="font-size: 11px; color: #64748b; display: block; margin-top: 2px;">Lng: ${lng.toFixed(6)}</span>
      </div>
      <div style="color: ${color}; font-size: 12px; font-weight: 600; text-transform: uppercase;">
        ${isOrigin ? '📍 Punto de partida' : '🎯 Destino'}
      </div>
    </div>
  `

  marker.bindPopup(popupContent)
  return marker
}

// Decodificar polyline de OSRM
const decodePolyline = (encoded) => {
  if (!encoded) return []
  
  const coordinates = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    let shift = 0
    let result = 0
    let byte

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
    lat += deltaLat

    shift = 0
    result = 0

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
    lng += deltaLng

    coordinates.push([lat / 1e5, lng / 1e5])
  }

  return coordinates
}

// Calcular distancia en línea recta (Haversine)
const calculateStraightDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

defineExpose({
  refreshRoute: () => {
    if (hasCompleteData.value) {
      drawRoute()
    }
  }
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Mapa -->
    <div class="relative flex-1 min-h-0">
      <div ref="mapContainer" class="absolute inset-0 rounded-lg overflow-hidden"></div>
      
      <!-- Loading overlay -->
      <Transition name="fade">
        <div v-if="routeData.loading" class="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-1000 rounded-lg">
          <div class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-2xl">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-3"></div>
            <p class="text-sm text-secondary">Calculando ruta...</p>
          </div>
        </div>
      </Transition>

      <!-- Placeholder cuando no hay datos -->
      <Transition name="fade">
        <div v-if="!hasCompleteData && !routeData.loading" class="absolute inset-0 bg-surface/50 backdrop-blur-sm flex items-center justify-center z-1000 rounded-lg">
          <div class="text-center px-6">
            <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Navigation class="w-10 h-10 text-primary" />
            </div>
            <p class="text-lg font-semibold text-neutral mb-2">Selecciona origen y destino</p>
            <p class="text-sm text-secondary max-w-sm">
              Elige una mina y un destino para visualizar la ruta y calcular distancia y tiempo estimado
            </p>
          </div>
        </div>
      </Transition>

      <!-- Error message -->
      <Transition name="slide-up">
        <div v-if="routeData.error && hasCompleteData" class="absolute top-4 left-4 right-4 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-lg p-4 shadow-lg z-1000">
          <div class="flex gap-3">
            <AlertCircle class="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-orange-800 dark:text-orange-200 mb-1">
                No se pudo calcular la ruta por carretera
              </p>
              <p class="text-xs text-orange-700 dark:text-orange-300">
                Se muestra la distancia en línea recta como referencia
              </p>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Info de ruta -->
    <Transition name="slide-up">
      <div v-if="hasCompleteData && !routeData.loading" class="shrink-0 bg-hover border-t-2 border-border p-4">
        <div class="grid grid-cols-2 gap-4">
          <!-- Distancia -->
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <RouteIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p class="text-xs text-tertiary uppercase tracking-wide">Distancia</p>
              <p class="text-lg font-bold text-neutral">{{ distanceFormatted }}</p>
            </div>
          </div>

          <!-- Tiempo estimado -->
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Clock class="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p class="text-xs text-tertiary uppercase tracking-wide">Tiempo estimado</p>
              <p class="text-lg font-bold text-neutral">
                {{ routeData.duration ? durationFormatted : 'N/A' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Nota si es línea recta -->
        <div v-if="routeData.error" class="mt-3 pt-3 border-t border-border">
          <p class="text-xs text-tertiary text-center">
            * Distancia calculada en línea recta
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
:deep(.leaflet-container) {
  font-family: inherit;
  background: #e5e7eb;
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: 0.75rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 4px;
}

:deep(.leaflet-popup-content) {
  margin: 0;
  font-family: inherit;
}

:deep(.custom-route-marker) {
  background: transparent !important;
  border: none !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s ease;
}

.slide-up-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>