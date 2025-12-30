<!-- src/components/socio/MinaLocationPicker.vue -->
<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { MapPin, Layers } from 'lucide-vue-next'

const props = defineProps({
  sectores: {
    type: Array,
    required: true
  },
  initialLocation: {
    type: Object,
    default: null
  },
  initialSectorId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['location-selected', 'sector-changed'])

const mapContainer = ref(null)
const map = ref(null)
const currentMarker = ref(null)
const polygons = ref([])
const isMapReady = ref(false)
const selectedSector = ref(null)
const selectedLocation = ref(null)

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

watch(() => props.sectores, () => {
  if (isMapReady.value) {
    drawSectores()
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

    if (props.initialLocation && props.initialLocation.latitud && props.initialLocation.longitud) {
      centerLat = props.initialLocation.latitud
      centerLng = props.initialLocation.longitud
      zoom = 14
    } 
    else if (props.sectores.length > 0) {
      const allCoords = props.sectores.flatMap(s => s.coordenadas || [])
      if (allCoords.length > 0) {
        centerLat = allCoords.reduce((sum, c) => sum + c.latitud, 0) / allCoords.length
        centerLng = allCoords.reduce((sum, c) => sum + c.longitud, 0) / allCoords.length
        zoom = 10
      }
    }

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

    drawSectores()

    map.value.on('click', handleMapClick)

    if (props.initialLocation && props.initialLocation.latitud && props.initialLocation.longitud) {
      const sector = props.sectores.find(s => s.id === props.initialSectorId)
      if (sector) {
        selectedSector.value = sector
      }
      placeMarker(props.initialLocation.latitud, props.initialLocation.longitud, false)
    }

    isMapReady.value = true
  } catch (error) {
    console.error('Error al inicializar mapa:', error)
  }
}

const drawSectores = () => {
  if (!map.value || !window.L) return

  polygons.value.forEach(p => {
    try {
      map.value.removeLayer(p)
    } catch (e) {}
  })
  polygons.value = []

  const allBounds = []

  props.sectores.forEach(sector => {
    if (sector.coordenadas && sector.coordenadas.length >= 3) {
      const latlngs = sector.coordenadas.map(c => [c.latitud, c.longitud])
      const color = sector.color || '#1E3A8A'
      
      const polygon = window.L.polygon(latlngs, {
        color: color,
        fillColor: color,
        fillOpacity: 0.15,
        weight: 2,
        interactive: false
      }).addTo(map.value)

      polygons.value.push(polygon)

      sector.coordenadas.forEach(c => {
        allBounds.push([c.latitud, c.longitud])
      })
    }
  })

  if (allBounds.length > 0 && !props.initialLocation) {
    const bounds = window.L.latLngBounds(allBounds)
    map.value.fitBounds(bounds, { padding: [50, 50] })
  }
}

const handleMapClick = (e) => {
  const { lat, lng } = e.latlng
  
  if (lat < -23 || lat > -9 || lng < -71 || lng > -57) {
    placeMarker(lat, lng, true, 'Fuera de Bolivia')
    emit('location-selected', null)
    emit('sector-changed', null)
    return
  }

  const sector = findSectorForPoint(lat, lng)
  
  if (!sector) {
    placeMarker(lat, lng, true, 'Fuera de sector')
    selectedSector.value = null
    selectedLocation.value = null
    emit('location-selected', null)
    emit('sector-changed', null)
    return
  }

  selectedSector.value = sector
  selectedLocation.value = { latitud: lat, longitud: lng }
  
  placeMarker(lat, lng, false)
  
  emit('location-selected', { latitud: lat, longitud: lng })
  emit('sector-changed', sector)
}

const findSectorForPoint = (lat, lng) => {
  for (const sector of props.sectores) {
    if (isPointInPolygon(lat, lng, sector.coordenadas)) {
      return sector
    }
  }
  return null
}

const isPointInPolygon = (lat, lng, coords) => {
  if (!coords || coords.length < 3) return false
  
  let inside = false
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const xi = coords[i].longitud
    const yi = coords[i].latitud
    const xj = coords[j].longitud
    const yj = coords[j].latitud
    
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

const placeMarker = (lat, lng, isInvalid = false, errorType = '') => {
  if (!map.value || !window.L) return

  if (currentMarker.value) {
    map.value.removeLayer(currentMarker.value)
  }

  const color = isInvalid ? '#EF4444' : (selectedSector.value?.color || '#1E3A8A')
  
  const icon = window.L.divIcon({
    className: 'custom-mine-marker-picker',
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
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        cursor: pointer;
        ${isInvalid ? 'animation: shake 0.5s;' : ''}
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m8 3 4 8 5-5 5 15H2L8 3z"></path>
        </svg>
      </div>
      ${isInvalid ? `
        <div style="
          position: absolute; 
          top: -8px; 
          right: -8px; 
          width: 20px; 
          height: 20px; 
          background: #EF4444; 
          border-radius: 50%; 
          border: 2px solid white; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 14px; 
          font-weight: bold;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        ">!</div>
      ` : ''}
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  })

  currentMarker.value = window.L.marker([lat, lng], {
    icon: icon,
    draggable: false
  }).addTo(map.value)

  let popupContent = ''
  
  if (isInvalid) {
    const errorMessage = errorType === 'Fuera de Bolivia' 
      ? 'La ubicación debe estar en Bolivia'
      : 'La mina debe estar dentro de un sector activo'
    
    popupContent = `
      <div style="text-align: center; min-width: 200px; padding: 4px;">
        <div style="color: #EF4444; font-weight: bold; margin-bottom: 6px; font-size: 15px;">
          ⚠️ Ubicación inválida
        </div>
        <span style="font-size: 13px; color: #666;">${errorMessage}</span>
      </div>
    `
  } else {
    popupContent = `
      <div style="text-align: center; min-width: 200px; padding: 4px;">
        <div style="width: 36px; height: 36px; background-color: ${color}; border-radius: 50%; margin: 0 auto 10px; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.2);"></div>
        <strong style="font-size: 15px; color: #1E293B;">${selectedSector.value?.nombre || 'Sector'}</strong>
        <div style="margin: 8px 0; padding: 6px; background: #f1f5f9; border-radius: 6px;">
          <span style="font-size: 11px; color: #64748b; display: block;">Lat: ${lat.toFixed(6)}</span>
          <span style="font-size: 11px; color: #64748b; display: block; margin-top: 2px;">Lng: ${lng.toFixed(6)}</span>
        </div>
        <div style="color: #10b981; font-size: 13px; font-weight: 500;">
          ✓ Ubicación válida
        </div>
      </div>
    `
  }

  currentMarker.value.bindPopup(popupContent, {
    closeButton: true,
    autoClose: false,
    closeOnClick: false
  }).openPopup()
}

defineExpose({
  centerOnLocation: (lat, lng) => {
    if (map.value) {
      map.value.setView([lat, lng], 15)
    }
  }
})
</script>

<template>
  <div class="relative w-full h-full">
    <div ref="mapContainer" class="absolute inset-0 rounded-lg overflow-hidden"></div>
    
    <Transition name="fade">
      <div v-if="!selectedLocation" class="absolute bottom-4 left-4 right-4 bg-primary text-white rounded-lg p-4 shadow-lg z-1000 text-center">
        <div class="flex items-center justify-center gap-2 mb-1">
          <MapPin class="w-5 h-5" />
          <p class="font-semibold">Ubicar mina en el mapa</p>
        </div>
        <p class="text-sm opacity-90">
          Haz clic dentro de un sector para colocar la mina
        </p>
      </div>
    </Transition>

    <div v-if="!isMapReady" class="absolute inset-0 bg-white dark:bg-slate-900 flex items-center justify-center z-2000">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-3"></div>
        <p class="text-sm text-gray-500">Cargando mapa...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.leaflet-container) {
  font-family: inherit;
  background: #f0f0f0;
  cursor: crosshair;
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: 0.75rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  padding: 4px;
}

:deep(.leaflet-popup-content) {
  margin: 0;
  font-family: inherit;
}

:deep(.leaflet-popup-close-button) {
  font-size: 20px;
  padding: 4px 8px;
}

:deep(.custom-mine-marker-picker) {
  background: transparent !important;
  border: none !important;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>