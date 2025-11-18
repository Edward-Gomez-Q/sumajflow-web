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
const mapMode = ref('satellite')
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

// Watch para redibujar cuando cambian los sectores (modo lectura)
watch(() => props.sectors, () => {
  if (isMapReady.value && !props.editMode) {
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

  // Limpiar todo
  polygons.value.forEach(p => map.value.removeLayer(p))
  markers.value.forEach(m => map.value.removeLayer(m))
  polygons.value = []
  markers.value = []

  const allBounds = []

  if (props.editMode && props.activeSector) {
    // Modo edición: dibujar sector activo con marcadores editables
    drawEditableSector(props.activeSector, localCoordinates.value)
    
    if (localCoordinates.value.length > 0) {
      localCoordinates.value.forEach(c => {
        allBounds.push([c.latitud, c.longitud])
      })
    }
  } else {
    // Modo lectura: dibujar todos los sectores
    props.sectors.forEach(sector => {
      if (sector.coordenadas && sector.coordenadas.length >= 3) {
        drawReadOnlySector(sector)
        sector.coordenadas.forEach(c => {
          allBounds.push([c.latitud, c.longitud])
        })
      }
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

  // Crear marcadores editables
  coordinates.forEach((coord, index) => {
    const markerIcon = window.L.divIcon({
      className: 'custom-polygon-marker',
      html: `
        <div class="marker-wrapper">
          <div class="marker-number" style="background-color: ${color};">
            ${coord.orden}
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    })

    const marker = window.L.marker([coord.latitud, coord.longitud], {
      draggable: true,
      icon: markerIcon
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
    <!-- Barra de herramientas -->
    <div v-if="editMode || showSearch" class="p-4 border-b border-border bg-hover space-y-3 shrink-0">
      <!-- Buscador -->
      <div v-if="showSearch" class="flex gap-2">
        <div class="relative flex-1">
          <input
            v-model="searchQuery"
            @keyup.enter="searchLocation"
            type="text"
            placeholder="Buscar ubicación en Bolivia..."
            class="w-full pl-10"
          />
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary pointer-events-none" />
        </div>
        <button
          @click="searchLocation"
          :disabled="isSearching || !searchQuery.trim()"
          class="btn-outline px-4 flex items-center gap-2"
        >
          <Navigation class="w-4 h-4" />
          {{ isSearching ? 'Buscando...' : 'Buscar' }}
        </button>
        <button
          @click="toggleMapMode"
          class="btn-outline px-4 flex items-center gap-2"
          :title="`Cambiar a vista ${mapMode === 'satellite' ? 'de calles' : 'satelital'}`"
        >
          <Layers class="w-4 h-4" />
        </button>
      </div>

      <!-- Resultados de búsqueda -->
      <div v-if="searchResults.length > 0" class="space-y-1 max-h-32 overflow-y-auto bg-surface rounded-lg border border-border">
        <button
          v-for="result in searchResults"
          :key="result.place_id"
          @click="selectSearchResult(result)"
          class="w-full text-left p-3 hover:bg-primary/10 transition flex items-start gap-2"
        >
          <MapPin class="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div class="text-sm text-neutral">{{ result.display_name }}</div>
        </button>
      </div>

      <!-- Info del polígono en modo edición -->
      <div v-if="editMode && localCoordinates.length > 0" class="flex items-center justify-between bg-surface rounded-lg p-3 border border-border">
        <div class="flex items-center gap-4 text-sm">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: activeSector?.color }"></div>
            <span class="text-neutral font-medium">{{ localCoordinates.length }} puntos</span>
          </div>
          <div v-if="hasValidPolygon" class="flex items-center gap-2">
            <span class="text-tertiary">Área aprox:</span>
            <span class="text-neutral font-medium">{{ polygonArea }} ha</span>
          </div>
          <div v-else class="text-warning text-xs">
            ⚠️ Se necesitan al menos 3 puntos
          </div>
        </div>
        <div class="flex gap-2">
          <button
            @click="undoLastPoint"
            :disabled="localCoordinates.length === 0"
            class="btn-ghost px-3 py-1.5 text-sm flex items-center gap-1"
            title="Deshacer último punto"
          >
            <Undo class="w-4 h-4" />
            Deshacer
          </button>
          <button
            @click="clearAll"
            :disabled="localCoordinates.length === 0"
            class="btn-ghost px-3 py-1.5 text-sm text-error flex items-center gap-1"
            title="Limpiar todo"
          >
            <Trash2 class="w-4 h-4" />
            Limpiar
          </button>
        </div>
      </div>
    </div>

    <!-- Contenedor del mapa -->
    <div class="flex-1 relative min-h-0 flex">
      <!-- Mapa -->
      <div class="flex-1 relative">
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

      <!-- Panel lateral con lista de puntos (solo en modo edición) -->
      <div v-if="editMode && localCoordinates.length > 0" class="w-80 border-l border-border bg-hover overflow-y-auto shrink-0">
        <div class="p-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-semibold text-neutral">Puntos del Polígono</h4>
            <span class="text-xs text-secondary">{{ localCoordinates.length }} punto{{ localCoordinates.length !== 1 ? 's' : '' }}</span>
          </div>
          
          <div class="space-y-2">
            <div
              v-for="(coord, index) in localCoordinates"
              :key="index"
              class="bg-surface border border-border rounded-lg p-3 hover:shadow-md transition-shadow"
            >
              <div class="flex items-start gap-3">
                <div 
                  class="w-8 h-8 rounded-full center font-bold text-white text-sm shrink-0"
                  :style="{ backgroundColor: activeSector?.color }"
                >
                  {{ coord.orden }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-mono text-xs space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="text-tertiary w-8">Lat:</span>
                      <span class="text-neutral">{{ coord.latitud.toFixed(6) }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-tertiary w-8">Lng:</span>
                      <span class="text-neutral">{{ coord.longitud.toFixed(6) }}</span>
                    </div>
                  </div>
                </div>
                <button
                  @click="removePolygonPoint(index)"
                  class="w-7 h-7 rounded hover:bg-red-50 dark:hover:bg-red-900/20 center text-error transition-colors shrink-0"
                  title="Eliminar punto"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Consejos -->
          <div class="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p class="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
              💡 <strong>Consejo:</strong> Arrastra los marcadores en el mapa para ajustar su posición.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

:deep(.custom-polygon-marker) {
  background: transparent;
  border: none;
}

:deep(.marker-wrapper) {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

:deep(.marker-number) {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  cursor: move;
}

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
</style>