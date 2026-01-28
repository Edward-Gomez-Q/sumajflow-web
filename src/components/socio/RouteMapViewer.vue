<!-- src/components/socio/RouteMapViewer.vue -->
<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
import { MapPin, Navigation, Route as RouteIcon, AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  origen: {
    type: Object,
    default: null
  },
  destino: {
    type: Object,
    default: null
  },
  balanzaCoop: {
    type: Object,
    default: null
  },
  tipoDestino: {
    type: String,
    default: 'ingenio'
  }
})

const mapContainer = ref(null)
const map = ref(null)
const isMapReady = ref(false)
const markers = ref([])
const routeLines = ref([])

// Datos de la ruta
const routeData = ref({
  distance: null,
  duration: null,
  loading: false,
  error: null
})

// Computed
const hasCompleteData = computed(() => {
  return props.origen && props.destino && props.balanzaCoop &&
         props.origen.latitud && props.origen.longitud &&
         props.destino.latitudAlmacen && props.destino.longitudAlmacen &&
         props.destino.latitudBalanza && props.destino.longitudBalanza &&
         props.balanzaCoop.latitudBalanza && props.balanzaCoop.longitudBalanza
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

watch([() => props.origen, () => props.destino, () => props.balanzaCoop], async () => {
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
    let centerLat = -19.583333
    let centerLng = -65.75
    let zoom = 6

    map.value = window.L.map(mapContainer.value, {
      center: [centerLat, centerLng],
      zoom: zoom,
      zoomControl: true,
      preferCanvas: true
    })

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map.value)

    isMapReady.value = true

    if (hasCompleteData.value) {
      drawRoute()
    }
  } catch (error) {
    console.error('Error al inicializar mapa:', error)
  }
}

const clearRoute = () => {
  markers.value.forEach(marker => {
    if (marker) {
      try {
        map.value.removeLayer(marker)
      } catch (e) {}
    }
  })
  markers.value = []
  
  routeLines.value.forEach(line => {
    if (line) {
      try {
        map.value.removeLayer(line)
      } catch (e) {}
    }
  })
  routeLines.value = []

  routeData.value = {
    distance: null,
    duration: null,
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
    // Definir los puntos de la ruta en orden
    const waypoints = [
      { lat: props.origen.latitud, lng: props.origen.longitud },
      { lat: props.balanzaCoop.latitudBalanza, lng: props.balanzaCoop.longitudBalanza },
      { lat: props.destino.latitudBalanza, lng: props.destino.longitudBalanza },
      { lat: props.destino.latitudAlmacen, lng: props.destino.longitudAlmacen }
    ]

    // Obtener la ruta completa pasando por todos los puntos
    const route = await fetchRouteWithWaypoints(waypoints)

    if (!route) {
      throw new Error('No se pudo calcular la ruta')
    }

    routeData.value.distance = route.distance / 1000
    routeData.value.duration = route.duration / 60

    // Dibujar cada segmento de la ruta con su color
    const routeCoordinates = decodePolyline(route.geometry)
    
    // Segmento completo en azul
    const routeLine = window.L.polyline(routeCoordinates, {
      color: '#3B82F6',
      weight: 5,
      opacity: 0.8,
      smoothFactor: 1
    }).addTo(map.value)
    routeLines.value.push(routeLine)

    // Dibujar marcadores
    const originColor = props.origen.sectorColor || '#1E3A8A'
    const destinationColor = props.tipoDestino === 'ingenio' ? '#059669' : '#DC2626'
    
    markers.value.push(createMarker(
      props.origen.latitud,
      props.origen.longitud,
      originColor,
      'mina',
      props.origen.nombre,
      '1. Punto de partida',
      1000
    ))

    markers.value.push(createMarker(
      props.balanzaCoop.latitudBalanza,
      props.balanzaCoop.longitudBalanza,
      '#F59E0B',
      'balanza-coop',
      props.balanzaCoop.razonSocial,
      '2. Pesaje en cooperativa',
      900
    ))

    markers.value.push(createMarker(
      props.destino.latitudBalanza,
      props.destino.longitudBalanza,
      '#F59E0B',
      'balanza-destino',
      props.destino.razonSocial,
      '3. Pesaje en destino',
      800
    ))

    markers.value.push(createMarker(
      props.destino.latitudAlmacen,
      props.destino.longitudAlmacen,
      destinationColor,
      'almacen',
      props.destino.razonSocial,
      `4. Almacén ${props.tipoDestino === 'ingenio' ? 'Ingenio' : 'Comercializadora'}`,
      700
    ))

    // Ajustar vista
    const bounds = window.L.latLngBounds([
      [props.origen.latitud, props.origen.longitud],
      [props.balanzaCoop.latitudBalanza, props.balanzaCoop.longitudBalanza],
      [props.destino.latitudBalanza, props.destino.longitudBalanza],
      [props.destino.latitudAlmacen, props.destino.longitudAlmacen]
    ])
    map.value.fitBounds(bounds, { padding: [60, 60] })

  } catch (error) {
    console.error('Error al dibujar ruta:', error)
    routeData.value.error = error.message || 'Error al calcular la ruta'
    await drawFallbackRoute()
  } finally {
    routeData.value.loading = false
  }
}

const drawFallbackRoute = async () => {
  const originColor = props.origen.sectorColor || '#1E3A8A'
  const destinationColor = props.tipoDestino === 'ingenio' ? '#059669' : '#DC2626'

  // Líneas directas punteadas entre cada punto
  const segment1 = window.L.polyline([
    [props.origen.latitud, props.origen.longitud],
    [props.balanzaCoop.latitudBalanza, props.balanzaCoop.longitudBalanza]
  ], {
    color: '#9CA3AF',
    weight: 3,
    opacity: 0.6,
    dashArray: '10, 10'
  }).addTo(map.value)
  routeLines.value.push(segment1)

  const segment2 = window.L.polyline([
    [props.balanzaCoop.latitudBalanza, props.balanzaCoop.longitudBalanza],
    [props.destino.latitudBalanza, props.destino.longitudBalanza]
  ], {
    color: '#9CA3AF',
    weight: 3,
    opacity: 0.6,
    dashArray: '10, 10'
  }).addTo(map.value)
  routeLines.value.push(segment2)

  const segment3 = window.L.polyline([
    [props.destino.latitudBalanza, props.destino.longitudBalanza],
    [props.destino.latitudAlmacen, props.destino.longitudAlmacen]
  ], {
    color: '#9CA3AF',
    weight: 3,
    opacity: 0.6,
    dashArray: '10, 10'
  }).addTo(map.value)
  routeLines.value.push(segment3)

  // Marcadores
  markers.value.push(createMarker(
    props.origen.latitud,
    props.origen.longitud,
    originColor,
    'mina',
    props.origen.nombre,
    '1. Punto de partida',
    1000
  ))

  markers.value.push(createMarker(
    props.balanzaCoop.latitudBalanza,
    props.balanzaCoop.longitudBalanza,
    '#F59E0B',
    'balanza-coop',
    props.balanzaCoop.razonSocial,
    '2. Pesaje en cooperativa',
    900
  ))

  markers.value.push(createMarker(
    props.destino.latitudBalanza,
    props.destino.longitudBalanza,
    '#F59E0B',
    'balanza-destino',
    props.destino.razonSocial,
    '3. Pesaje en destino',
    800
  ))

  markers.value.push(createMarker(
    props.destino.latitudAlmacen,
    props.destino.longitudAlmacen,
    destinationColor,
    'almacen',
    props.destino.razonSocial,
    `4. Almacén ${props.tipoDestino === 'ingenio' ? 'Ingenio' : 'Comercializadora'}`,
    700
  ))

  // Calcular distancia total en línea recta
  const d1 = calculateStraightDistance(
    props.origen.latitud, 
    props.origen.longitud,
    props.balanzaCoop.latitudBalanza,
    props.balanzaCoop.longitudBalanza
  )
  const d2 = calculateStraightDistance(
    props.balanzaCoop.latitudBalanza,
    props.balanzaCoop.longitudBalanza,
    props.destino.latitudBalanza,
    props.destino.longitudBalanza
  )
  const d3 = calculateStraightDistance(
    props.destino.latitudBalanza,
    props.destino.longitudBalanza,
    props.destino.latitudAlmacen,
    props.destino.longitudAlmacen
  )
  
  routeData.value.distance = d1 + d2 + d3

  const bounds = window.L.latLngBounds([
    [props.origen.latitud, props.origen.longitud],
    [props.balanzaCoop.latitudBalanza, props.balanzaCoop.longitudBalanza],
    [props.destino.latitudBalanza, props.destino.longitudBalanza],
    [props.destino.latitudAlmacen, props.destino.longitudAlmacen]
  ])
  map.value.fitBounds(bounds, { padding: [60, 60] })
}

const fetchRouteWithWaypoints = async (waypoints) => {
  try {
    // Construir la URL con todos los waypoints
    const coords = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(';')
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=polyline`
    
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

const createMarker = (lat, lng, color, type, name, subtitle = '', zIndexOffset = 1000) => {
  let iconSvg = ''
  
  if (type === 'mina') {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m8 3 4 8 5-5 5 15H2L8 3z"></path>
    </svg>`
  } else if (type === 'balanza-coop' || type === 'balanza-destino') {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path>
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path>
      <path d="M7 21h10"></path>
      <path d="M12 3v18"></path>
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"></path>
    </svg>`
  } else {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"></path>
      <path d="M6 18h12"></path>
      <path d="M6 14h12"></path>
      <rect width="12" height="12" x="6" y="10"></rect>
    </svg>`
  }
  
  const icon = window.L.divIcon({
    className: 'custom-route-marker',
    html: `
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: ${color};
        color: white;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      ">
        ${iconSvg}
      </div>
      <div style="
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        color: #1E293B;
        padding: 4px 10px;
        border-radius: 6px;
        white-space: nowrap;
        font-size: 11px;
        font-weight: 700;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        border: 2px solid ${color};
        text-transform: uppercase;
        letter-spacing: 0.3px;
      ">${subtitle.split('.')[0]}</div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -44]
  })

  const marker = window.L.marker([lat, lng], {
    icon: icon,
    zIndexOffset: zIndexOffset
  }).addTo(map.value)

  let typeLabel = ''
  if (type === 'mina') typeLabel = '📍 Mina de Origen'
  else if (type === 'balanza-coop') typeLabel = '⚖️ Balanza Cooperativa'
  else if (type === 'balanza-destino') typeLabel = '⚖️ Balanza Destino'
  else typeLabel = '🏭 Almacén Final'

  const popupContent = `
    <div style="text-align: center; min-width: 200px; padding: 6px;">
      <div style="width: 36px; height: 36px; background-color: ${color}; border-radius: 50%; margin: 0 auto 10px; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.2);"></div>
      <strong style="font-size: 15px; color: #1E293B; display: block; margin-bottom: 4px;">${name}</strong>
      <span style="font-size: 12px; color: #64748b; display: block; margin-bottom: 8px;">${subtitle}</span>
      <div style="margin: 8px 0; padding: 6px; background: #f1f5f9; border-radius: 6px;">
        <span style="font-size: 11px; color: #64748b; display: block;">Lat: ${lat.toFixed(6)}</span>
        <span style="font-size: 11px; color: #64748b; display: block; margin-top: 2px;">Lng: ${lng.toFixed(6)}</span>
      </div>
      <div style="color: ${color}; font-size: 12px; font-weight: 600;">
        ${typeLabel}
      </div>
    </div>
  `

  marker.bindPopup(popupContent)
  return marker
}

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

const calculateStraightDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371
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
    <div class="relative flex-1 min-h-0">
      <div ref="mapContainer" class="absolute inset-0 rounded-lg overflow-hidden"></div>
      
      <Transition name="fade">
        <div v-if="routeData.loading" class="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-1000 rounded-lg">
          <div class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-2xl">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-3"></div>
            <p class="text-sm text-secondary">Calculando ruta...</p>
          </div>
        </div>
      </Transition>

      <Transition name="fade">
        <div v-if="!hasCompleteData && !routeData.loading" class="absolute inset-0 bg-surface/50 backdrop-blur-sm flex items-center justify-center z-1000 rounded-lg">
          <div class="text-center px-6">
            <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Navigation class="w-10 h-10 text-primary" />
            </div>
            <p class="text-lg font-semibold text-neutral mb-2">Selecciona origen y destino</p>
            <p class="text-sm text-secondary max-w-sm">
              Elige una mina y un destino para visualizar la ruta completa del transporte
            </p>
          </div>
        </div>
      </Transition>

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

    <Transition name="slide-up">
      <div v-if="hasCompleteData && !routeData.loading" class="shrink-0 bg-hover border-t-2 border-border p-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <RouteIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p class="text-xs text-tertiary uppercase tracking-wide">Distancia</p>
              <p class="text-lg font-bold text-neutral">{{ distanceFormatted }}</p>
            </div>
          </div>

          <div class="flex items-center gap-3" v-if="routeData.duration && !routeData.error">
            <div class="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-emerald-600 dark:text-emerald-400">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div>
              <p class="text-xs text-tertiary uppercase tracking-wide">Tiempo</p>
              <p class="text-lg font-bold text-neutral">{{ durationFormatted }}</p>
            </div>
          </div>
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