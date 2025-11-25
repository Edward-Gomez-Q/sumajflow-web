<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
import { MapPin, Trash2, Undo, Layers, Navigation, Search, Plus, X } from 'lucide-vue-next'

const props = defineProps({
  sectors: {
    type: Array,
    default: () => []
  },
  editMode: {
    type: Boolean,
    default: false
  },
  activeSector: {
    type: Object,
    default: null
  },
  showSearch: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:coordinates', 'point-added', 'point-removed'])

const mapContainer = ref(null)
const map = ref(null)
const polygons = ref([])
const markers = ref([])
const isMapReady = ref(false)
const mapMode = ref('street') // 'street' o 'satellite'
const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)

// Coordenadas locales para el sector activo en modo edición
const localCoordinates = ref([])

const hasValidPolygon = computed(() => {
  return localCoordinates.value.length >= 3
})

const polygonArea = computed(() => {
  if (!hasValidPolygon.value) return 0
  
  let area = 0
  const coords = localCoordinates.value
  
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length
    area += coords[i].longitud * coords[j].latitud
    area -= coords[j].longitud * coords[i].latitud
  }
  
  area = Math.abs(area / 2)
  const kmSquared = area * 111 * 106
  const hectares = kmSquared * 100
  
  return hectares.toFixed(2)
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

// Watch para actualizar coordenadas locales cuando cambia el sector activo
watch(() => props.activeSector, (newSector) => {
  if (newSector && props.editMode) {
    localCoordinates.value = newSector.coordenadas ? [...newSector.coordenadas] : []
    if (isMapReady.value) {
      drawAllSectors()
    }
  }
}, { immediate: true, deep: true })

// Watch para redibujar cuando cambian los sectores
watch(() => props.sectors, () => {
  if (isMapReady.value) {
    drawAllSectors()
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
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
    link.crossOrigin = ''
    document.head.appendChild(link)
  }

  return new Promise((resolve) => {
    if (!document.querySelector('script[src*="leaflet.js"]')) {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
      script.crossOrigin = ''
      script.onload = async () => {
        await nextTick()
        setTimeout(() => {
          initMap()
          resolve()
        }, 100)
      }
      document.head.appendChild(script)
    } else {
      resolve()
    }
  })
}

const initMap = () => {
  if (!window.L || !mapContainer.value || map.value) return

  try {
    // Determinar centro del mapa
    let centerLat = -19.583333
    let centerLng = -65.75
    let zoom = 6

    if (props.editMode && props.activeSector?.coordenadas?.length > 0) {
      centerLat = props.activeSector.coordenadas[0].latitud
      centerLng = props.activeSector.coordenadas[0].longitud
      zoom = 13
    } else if (!props.editMode && props.sectors.length > 0) {
      const allCoords = props.sectors.flatMap(s => s.coordenadas || [])
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

    if (props.editMode) {
      map.value.on('click', handleMapClick)
    }

    isMapReady.value = true
    drawAllSectors()
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
  drawAllSectors()
}

const handleMapClick = (e) => {
  if (!props.editMode || !props.activeSector) return
  
  const { lat, lng } = e.latlng
  addPolygonPoint(lat, lng)
}

const addPolygonPoint = (lat, lng) => {
  const newPoint = {
    orden: localCoordinates.value.length + 1,
    latitud: parseFloat(lat.toFixed(6)),
    longitud: parseFloat(lng.toFixed(6))
  }

  localCoordinates.value.push(newPoint)
  emit('update:coordinates', localCoordinates.value)
  emit('point-added', newPoint)
  drawAllSectors()
}

const removePolygonPoint = (index) => {
  localCoordinates.value.splice(index, 1)
  localCoordinates.value.forEach((coord, idx) => {
    coord.orden = idx + 1
  })
  
  emit('update:coordinates', localCoordinates.value)
  emit('point-removed', index)
  drawAllSectors()
}

const undoLastPoint = () => {
  if (localCoordinates.value.length > 0) {
    const removed = localCoordinates.value.pop()
    emit('update:coordinates', localCoordinates.value)
    emit('point-removed', localCoordinates.value.length)
    drawAllSectors()
  }
}

const clearAll = () => {
  if (confirm('¿Estás seguro de eliminar todos los puntos del polígono?')) {
    localCoordinates.value = []
    emit('update:coordinates', [])
    drawAllSectors()
  }
}

const drawAllSectors = () => {
  if (!map.value || !window.L) return

  // Limpiar todo ANTES de redibujar
  polygons.value.forEach(p => {
    try {
      map.value.removeLayer(p)
    } catch (e) {
      // Ignorar errores si ya fue removido
    }
  })
  markers.value.forEach(m => {
    try {
      map.value.removeLayer(m)
    } catch (e) {
      // Ignorar errores si ya fue removido
    }
  })
  polygons.value = []
  markers.value = []

  const allBounds = []

  // Primero: Dibujar sectores existentes (sin edición)
  if (props.sectors && props.sectors.length > 0) {
    props.sectors.forEach(sector => {
      if (sector.coordenadas && sector.coordenadas.length >= 3) {
        drawReadOnlySector(sector)
        sector.coordenadas.forEach(c => {
          allBounds.push([c.latitud, c.longitud])
        })
      }
    })
  }

  // Segundo: Si está en modo edición, dibujar el sector activo encima
  if (props.editMode && props.activeSector && localCoordinates.value.length > 0) {
    drawEditableSector(props.activeSector, localCoordinates.value)
    
    localCoordinates.value.forEach(c => {
      allBounds.push([c.latitud, c.longitud])
    })
  }

  // Ajustar vista si hay coordenadas
  if (allBounds.length > 0) {
    const bounds = window.L.latLngBounds(allBounds)
    map.value.fitBounds(bounds, { padding: [50, 50] })
  }
}

const drawEditableSector = (sector, coordinates) => {
  if (coordinates.length === 0) return

  const color = sector.color || '#1E3A8A'

  // Crear marcadores editables con iconos HTML personalizados
  coordinates.forEach((coord, index) => {
    // Crear un icono divIcon con HTML personalizado
    const markerIcon = window.L.divIcon({
      className: 'custom-polygon-marker',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: ${color};
          color: white;
          font-weight: bold;
          font-size: 14px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          cursor: move;
          transform: translate(-50%, -50%);
        ">
          ${coord.orden}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    })

    const marker = window.L.marker([coord.latitud, coord.longitud], {
      draggable: true,
      icon: markerIcon,
      zIndexOffset: 1000 // Asegurar que los marcadores estén siempre encima
    }).addTo(map.value)

    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng()
      localCoordinates.value[index].latitud = parseFloat(lat.toFixed(6))
      localCoordinates.value[index].longitud = parseFloat(lng.toFixed(6))
      emit('update:coordinates', localCoordinates.value)
      drawAllSectors()
    })

    marker.bindTooltip(
      `Punto ${coord.orden}<br>Lat: ${coord.latitud.toFixed(6)}<br>Lng: ${coord.longitud.toFixed(6)}`,
      { permanent: false, direction: 'top' }
    )

    markers.value.push(marker)
  })

  // Dibujar polígono si hay suficientes puntos
  if (coordinates.length >= 3) {
    const latlngs = coordinates.map(c => [c.latitud, c.longitud])
    
    const polygon = window.L.polygon(latlngs, {
      color: color,
      fillColor: color,
      fillOpacity: 0.25,
      weight: 3,
      dashArray: '10, 5'
    }).addTo(map.value)

    const areaText = `
      <div style="text-align: center;">
        <strong>${sector.nombre || 'Sector'}</strong><br>
        <span style="font-size: 12px;">Área aprox: ${polygonArea.value} ha</span><br>
        <span style="font-size: 11px; color: #666;">${coordinates.length} puntos</span>
      </div>
    `
    polygon.bindPopup(areaText)

    polygons.value.push(polygon)
  }
}

const drawReadOnlySector = (sector) => {
  if (!sector.coordenadas || sector.coordenadas.length < 3) return

  const color = sector.color || '#1E3A8A'
  const latlngs = sector.coordenadas.map(c => [c.latitud, c.longitud])
  
  const polygon = window.L.polygon(latlngs, {
    color: color,
    fillColor: color,
    fillOpacity: 0.3,
    weight: 2
  }).addTo(map.value)

  // Calcular área
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

// Exponer métodos para uso externo
defineExpose({
  refreshMap: drawAllSectors,
  centerOnCoordinates: (lat, lng, zoom = 13) => {
    if (map.value) {
      map.value.setView([lat, lng], zoom)
    }
  }
})
</script>

<template>
  <div class="flex flex-col h-full">


    <!-- Contenedor del mapa -->
    <div class="flex-1 relative min-h-0">
      <div ref="mapContainer" class="w-full h-full"></div>

      <!-- Instrucciones flotantes en modo edición sin puntos -->
      <div v-if="editMode && localCoordinates.length === 0" class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="bg-surface/95 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-border max-w-md">
          <div class="text-center">
            <div class="w-16 h-16 rounded-full bg-primary/10 center mx-auto mb-4">
              <Plus class="w-8 h-8 text-primary" />
            </div>
            <h4 class="font-semibold text-neutral mb-2">Comienza a definir el sector</h4>
            <p class="text-sm text-secondary leading-relaxed">
              Haz clic en el mapa para agregar puntos del perímetro. Necesitas al menos 3 puntos para crear un área válida.
            </p>
          </div>
        </div>
      </div>

      <!-- Mensaje cuando no hay sectores en modo lectura -->
      <div v-if="!editMode && sectors.length === 0" class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="bg-surface/95 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-border max-w-md">
          <div class="text-center">
            <div class="w-16 h-16 rounded-full bg-primary/10 center mx-auto mb-4">
              <MapPin class="w-8 h-8 text-primary" />
            </div>
            <h4 class="font-semibold text-neutral mb-2">No hay sectores para mostrar</h4>
            <p class="text-sm text-secondary leading-relaxed">
              Los sectores definidos aparecerán aquí en el mapa
            </p>
          </div>
        </div>
      </div>
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

:deep(.custom-polygon-marker) {
  background: transparent !important;
  border: none !important;
}
</style>