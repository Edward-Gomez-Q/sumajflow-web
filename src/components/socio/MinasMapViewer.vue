<!-- src/components/socio/MinasMapViewer.vue -->
<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Search, Layers, Navigation } from 'lucide-vue-next'

const props = defineProps({
  sectores: {
    type: Array,
    required: true
  },
  minas: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['mina-selected'])

const mapContainer = ref(null)
const map = ref(null)
const polygons = ref([])
const mineMarkers = ref([])
const isMapReady = ref(false)
const mapMode = ref('street')
const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)

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

watch(() => props.minas, () => {
  if (isMapReady.value) {
    drawMinas()
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

    if (props.sectores.length > 0) {
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
      zoomControl: true
    })

    updateMapLayer()

    isMapReady.value = true
    drawSectores()
    drawMinas()
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
  drawMinas()
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
        fillOpacity: 0.3,
        weight: 2
      }).addTo(map.value)

      let area = 0
      const coords = sector.coordenadas
      for (let i = 0; i < coords.length; i++) {
        const j = (i + 1) % coords.length
        area += coords[i].longitud * coords[j].latitud
        area -= coords[j].longitud * coords[i].latitud
      }
      area = Math.abs(area / 2)
      const kmSquared = area * 111 * 106
      const hectares = (kmSquared * 100).toFixed(2)

      const popupContent = `
        <div style="text-align: center; min-width: 150px;">
          <div style="width: 30px; height: 30px; background-color: ${color}; border-radius: 50%; margin: 0 auto 8px; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
          <strong style="font-size: 14px;">${sector.nombre}</strong><br>
          <span style="font-size: 12px; color: #666;">Área: ${hectares} ha</span><br>
          <span style="font-size: 11px; color: #999;">${sector.coordenadas.length} puntos</span>
        </div>
      `
      polygon.bindPopup(popupContent)

      polygons.value.push(polygon)

      sector.coordenadas.forEach(c => {
        allBounds.push([c.latitud, c.longitud])
      })
    }
  })

  if (allBounds.length > 0) {
    const bounds = window.L.latLngBounds(allBounds)
    map.value.fitBounds(bounds, { padding: [50, 50] })
  }
}

const drawMinas = () => {
  if (!map.value || !window.L || !props.minas || props.minas.length === 0) return

  mineMarkers.value.forEach(m => {
    try {
      map.value.removeLayer(m)
    } catch (e) {}
  })
  mineMarkers.value = []

  props.minas.forEach(mina => {
    const color = mina.sectorColor || '#1E3A8A'
    
    const mineIcon = window.L.divIcon({
      className: 'custom-mine-marker',
      html: `
        <div style="
          position: relative;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: ${color};
          color: white;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
          cursor: pointer;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m8 3 4 8 5-5 5 15H2L8 3z"></path>
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    })

    const marker = window.L.marker([mina.latitud, mina.longitud], {
      icon: mineIcon,
      zIndexOffset: 2000
    }).addTo(map.value)

    marker.bindPopup(`
      <div style="text-align: center; min-width: 140px;">
        <strong style="font-size: 14px; color: #1E293B;">${mina.nombre}</strong><br>
        <div style="margin: 8px 0; padding: 4px; background: #f1f5f9; border-radius: 4px;">
          <span style="font-size: 11px; color: #64748b;">Lat: ${mina.latitud.toFixed(6)}</span><br>
          <span style="font-size: 11px; color: #64748b;">Lng: ${mina.longitud.toFixed(6)}</span>
        </div>
        <div style="display: inline-flex; align-items: center; gap: 4px; margin-top: 4px;">
          <div style="width: 12px; height: 12px; background-color: ${color}; border-radius: 50%;"></div>
          <span style="font-size: 11px; color: #64748b;">${mina.sectorNombre}</span>
        </div>
      </div>
    `)

    marker.on('click', () => {
      emit('mina-selected', mina)
    })

    mineMarkers.value.push(marker)
  })
}

const searchLocation = async () => {
  if (!searchQuery.value.trim()) return

  isSearching.value = true
  searchResults.value = []

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.value)}&countrycodes=bo&limit=5`
    )
    const data = await response.json()
    searchResults.value = data
  } catch (error) {
    console.error('Error al buscar ubicación:', error)
  } finally {
    isSearching.value = false
  }
}

const selectSearchResult = (result) => {
  const lat = parseFloat(result.lat)
  const lng = parseFloat(result.lon)
  
  if (map.value) {
    map.value.setView([lat, lng], 15)
  }
  
  searchResults.value = []
  searchQuery.value = ''
}

defineExpose({
  refreshMap: () => {
    drawSectores()
    drawMinas()
  },
  centerOnMina: (mina) => {
    if (map.value && mina) {
      map.value.setView([mina.latitud, mina.longitud], 15)
    }
  }
})
</script>

<template>
  <div class="flex flex-col h-full relative">

    <div ref="mapContainer" class="w-full h-full"></div>
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

:deep(.custom-mine-marker) {
  background: transparent !important;
  border: none !important;
}
</style>