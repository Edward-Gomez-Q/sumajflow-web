<!-- src/components/almacen/AlmacenMapViewer.vue -->
<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Layers, Navigation } from 'lucide-vue-next'

const props = defineProps({
  almacen: {
    type: Object,
    required: true
  }
})

const mapContainer = ref(null)
const map = ref(null)
const almacenMarker = ref(null)
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

watch(() => props.almacen, () => {
  if (isMapReady.value) {
    drawAlmacen()
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
    let centerLat = props.almacen.latitud || -19.583333
    let centerLng = props.almacen.longitud || -65.75
    let zoom = props.almacen.latitud ? 14 : 6

    map.value = window.L.map(mapContainer.value, {
      center: [centerLat, centerLng],
      zoom: zoom,
      zoomControl: true
    })

    updateMapLayer()

    isMapReady.value = true
    drawAlmacen()
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
  drawAlmacen()
}

const drawAlmacen = () => {
  if (!map.value || !window.L || !props.almacen || !props.almacen.latitud || !props.almacen.longitud) return

  if (almacenMarker.value) {
    try {
      map.value.removeLayer(almacenMarker.value)
    } catch (e) {}
  }

  const almacenIcon = window.L.divIcon({
    className: 'custom-almacen-marker',
    html: `
      <div style="
        position: relative;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #8B5CF6;
        color: white;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
        cursor: pointer;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 8h20"></path>
          <rect width="20" height="16" x="2" y="4" rx="2"></rect>
          <path d="M6 16h12"></path>
        </svg>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44]
  })

  almacenMarker.value = window.L.marker(
    [props.almacen.latitud, props.almacen.longitud],
    { icon: almacenIcon, zIndexOffset: 3000 }
  ).addTo(map.value)

  const ocupacionPct = props.almacen.porcentajeOcupacion?.toFixed(1) || 0
  const estadoColor = getEstadoColor(props.almacen.estadoCapacidad)

  almacenMarker.value.bindPopup(`
    <div style="text-align: center; min-width: 200px;">
      <strong style="font-size: 15px; color: #1E293B;">${props.almacen.nombre}</strong><br>
      <div style="margin: 8px 0; padding: 8px; background: #F1F5F9; border-radius: 4px;">
        <span style="font-size: 12px; color: #475569; font-weight: 600;">Capacidad: ${props.almacen.capacidadMaxima} t</span><br>
        <span style="font-size: 11px; color: #64748b;">Área: ${props.almacen.area} m²</span>
      </div>
      <div style="margin: 8px 0; padding: 8px; background: ${estadoColor}15; border: 1px solid ${estadoColor}40; border-radius: 4px;">
        <span style="font-size: 11px; color: #475569;">Ocupación: </span>
        <span style="font-size: 13px; color: ${estadoColor}; font-weight: 700;">${ocupacionPct}%</span><br>
        <span style="font-size: 10px; color: #64748b;">${props.almacen.ocupacionActual?.toFixed(2)} t / ${props.almacen.capacidadMaxima} t</span>
      </div>
      <div style="font-size: 10px; color: #64748b; margin-top: 6px;">
        Lat: ${props.almacen.latitud.toFixed(6)}<br>
        Lng: ${props.almacen.longitud.toFixed(6)}
      </div>
    </div>
  `)

  map.value.setView([props.almacen.latitud, props.almacen.longitud], 14)
}

const getEstadoColor = (estado) => {
  if (estado === 'critico') return '#EF4444'
  if (estado === 'lleno') return '#F97316'
  if (estado === 'medio') return '#EAB308'
  return '#10B981'
}

defineExpose({
  toggleMapMode,
  centerOnAlmacen: () => {
    if (map.value && props.almacen.latitud && props.almacen.longitud) {
      map.value.setView([props.almacen.latitud, props.almacen.longitud], 15)
    }
  }
})
</script>

<template>
  <div class="flex flex-col h-full relative">
    <div ref="mapContainer" class="w-full h-full"></div>
    
    <!-- Controles del mapa -->
    <div class="absolute top-4 right-4 z-100 flex flex-col gap-2">
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

:deep(.custom-almacen-marker) {
  background: transparent !important;
  border: none !important;
}
</style>