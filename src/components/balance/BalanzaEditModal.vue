<!-- src/components/balance/BalanzaMapViewer.vue -->
<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Layers, Navigation } from 'lucide-vue-next'

const props = defineProps({
  sectores: {
    type: Array,
    default: () => []
  },
  balanza: {
    type: Object,
    required: true
  }
})

const mapContainer = ref(null)
const map = ref(null)
const polygons = ref([])
const balanzaMarker = ref(null)
const isMapReady = ref(false)
const mapMode = ref('street')

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

watch(() => props.balanza, () => {
  if (isMapReady.value) {
    drawBalanza()
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
    let centerLat = props.balanza.latitud || -19.583333
    let centerLng = props.balanza.longitud || -65.75
    let zoom = props.balanza.latitud ? 14 : 6

    map.value = window.L.map(mapContainer.value, {
      center: [centerLat, centerLng],
      zoom: zoom,
      zoomControl: true
    })

    updateMapLayer()

    isMapReady.value = true
    drawSectores()
    drawBalanza()
  } catch (error) {
    console.error('Error al inicializar mapa:', error)
  }
}

const updateMapLayer = () => {
  if (!map.value || !window.L) return

  map.value.eachLayer(layer => {
    if (layer instanceof window.L.TileLayer) {
      map.value.removeLayer(layer)
    }
  })

  if (mapMode.value === 'satellite') {
    window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 19
    }).addTo(map.value)
    
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
      attribution: '©OpenStreetMap, ©CartoDB',
      maxZoom: 19,
      pane: 'shadowPane'
    }).addTo(map.value)
  } else {
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map.value)
  }
}

const toggleMapMode = () => {
  mapMode.value = mapMode.value === 'satellite' ? 'street' : 'satellite'
  updateMapLayer()
  drawSectores()
  drawBalanza()
}

const drawSectores = () => {
  if (!map.value || !window.L || !props.sectores || props.sectores.length === 0) return

  polygons.value.forEach(p => {
    try {
      map.value.removeLayer(p)
    } catch (e) {}
  })
  polygons.value = []

  props.sectores.forEach(sector => {
    if (sector.coordenadas && sector.coordenadas.length >= 3) {
      const latlngs = sector.coordenadas.map(c => [c.latitud, c.longitud])
      const color = sector.color || '#1E3A8A'
      
      const polygon = window.L.polygon(latlngs, {
        color: color,
        fillColor: color,
        fillOpacity: 0.2,
        weight: 2
      }).addTo(map.value)

      const popupContent = `
        <div style="text-align: center; min-width: 150px;">
          <div style="width: 30px; height: 30px; background-color: ${color}; border-radius: 50%; margin: 0 auto 8px; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
          <strong style="font-size: 14px;">${sector.nombre}</strong><br>
          <span style="font-size: 11px; color: #999;">${sector.coordenadas.length} puntos</span>
        </div>
      `
      polygon.bindPopup(popupContent)

      polygons.value.push(polygon)
    }
  })
}

const drawBalanza = () => {
  if (!map.value || !window.L || !props.balanza || !props.balanza.latitud || !props.balanza.longitud) return

  if (balanzaMarker.value) {
    try {
      map.value.removeLayer(balanzaMarker.value)
    } catch (e) {}
  }

  const balanzaIcon = window.L.divIcon({
    className: 'custom-balanza-marker',
    html: `
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #3B82F6;
        color: white;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
        cursor: pointer;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3v18"></path>
          <path d="M5 9l7-7 7 7"></path>
          <path d="M3 21h18"></path>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  })

  balanzaMarker.value = window.L.marker(
    [props.balanza.latitud, props.balanza.longitud],
    { icon: balanzaIcon, zIndexOffset: 3000 }
  ).addTo(map.value)

  balanzaMarker.value.bindPopup(`
    <div style="text-align: center; min-width: 180px;">
      <strong style="font-size: 15px; color: #1E293B;">${props.balanza.nombre}</strong><br>
      <div style="margin: 8px 0; padding: 6px; background: #EFF6FF; border-radius: 4px;">
        <span style="font-size: 12px; color: #1E40AF; font-weight: 600;">${props.balanza.marca} ${props.balanza.modelo}</span><br>
        <span style="font-size: 11px; color: #64748b;">Capacidad: ${props.balanza.capacidadMaxima} kg</span>
      </div>
      <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
        Lat: ${props.balanza.latitud.toFixed(6)}<br>
        Lng: ${props.balanza.longitud.toFixed(6)}
      </div>
    </div>
  `)

  map.value.setView([props.balanza.latitud, props.balanza.longitud], 14)
}

defineExpose({
  toggleMapMode,
  centerOnBalanza: () => {
    if (map.value && props.balanza.latitud && props.balanza.longitud) {
      map.value.setView([props.balanza.latitud, props.balanza.longitud], 15)
    }
  }
})
</script>

<template>
  <div class="flex flex-col h-full relative">
    <div ref="mapContainer" class="w-full h-full"></div>
    
    <!-- Controles del mapa -->
    <div class="absolute top-4 right-4 z-1000 flex flex-col gap-2">
      <button
        @click="toggleMapMode"
        class="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-border center"
        :title="mapMode === 'satellite' ? 'Vista de Mapa' : 'Vista Satelital'"
      >
        <Layers v-if="mapMode === 'street'" class="w-5 h-5 text-neutral" />
        <Navigation v-else class="w-5 h-5 text-neutral" />
      </button>
    </div>
  </div>
</template>

<style scoped>
:deep(.leaflet-container) {
  font-family: inherit;
  background: #f0f0f0;
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.leaflet-popup-content) {
  margin: 12px;
  font-family: inherit;
}

:deep(.custom-balanza-marker) {
  background: transparent !important;
  border: none !important;
}
</style>