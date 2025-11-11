<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { X, Search, MapPin, Trash2, Check, Navigation } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ latitud: null, longitud: null })
  },
  title: {
    type: String,
    default: 'Seleccionar Ubicación'
  },
  initialZoom: {
    type: Number,
    default: 13
  },
  allowMultiple: {
    type: Boolean,
    default: false
  },
  coordinates: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'update:coordinates', 'close'])

const mapContainer = ref(null)
const map = ref(null)
const marker = ref(null)
const polygon = ref(null)
const markers = ref([])
const isMapReady = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)

// Estado local
const localCoordinates = ref([...props.coordinates])
const tempLat = ref(props.modelValue.latitud || -19.583333)
const tempLng = ref(props.modelValue.longitud || -65.75)

const hasValidCoordinates = computed(() => {
  return tempLat.value !== null && tempLng.value !== null
})

// Inicializar mapa
onMounted(() => {
  initMap()
})

const initMap = () => {
  try {
    // Verificar que Leaflet esté disponible
    if (typeof L === 'undefined') {
      console.error('Leaflet no está cargado')
      loadLeaflet()
      return
    }

    // Centro inicial (Bolivia - Potosí)
    const initialLat = props.modelValue.latitud || -19.583333
    const initialLng = props.modelValue.longitud || -65.75

    // Crear mapa
    map.value = L.map(mapContainer.value).setView([initialLat, initialLng], props.initialZoom)

    // Agregar tiles de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map.value)

    // Si es modo múltiple, dibujar polígono existente
    if (props.allowMultiple && localCoordinates.value.length > 0) {
      drawPolygon()
    } else if (hasValidCoordinates.value) {
      // Agregar marcador inicial
      addMarker(initialLat, initialLng)
    }

    // Evento de clic en el mapa
    map.value.on('click', handleMapClick)

    isMapReady.value = true
  } catch (error) {
    console.error('Error al inicializar mapa:', error)
  }
}

const loadLeaflet = () => {
  // Cargar Leaflet dinámicamente
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
  document.head.appendChild(link)

  const script = document.createElement('script')
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
  script.onload = () => {
    setTimeout(initMap, 100)
  }
  document.head.appendChild(script)
}

const handleMapClick = (e) => {
  const { lat, lng } = e.latlng

  if (props.allowMultiple) {
    // Modo múltiple: agregar punto al polígono
    addPolygonPoint(lat, lng)
  } else {
    // Modo simple: mover marcador
    tempLat.value = lat
    tempLng.value = lng
    updateMarker(lat, lng)
  }
}

const addMarker = (lat, lng) => {
  if (marker.value) {
    map.value.removeLayer(marker.value)
  }

  marker.value = L.marker([lat, lng], {
    draggable: true,
    icon: L.divIcon({
      className: 'custom-marker',
      html: '<div style="background: #1E3A8A; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    })
  }).addTo(map.value)

  // Evento de arrastre
  marker.value.on('dragend', (e) => {
    const { lat, lng } = e.target.getLatLng()
    tempLat.value = lat
    tempLng.value = lng
  })
}

const updateMarker = (lat, lng) => {
  if (marker.value) {
    marker.value.setLatLng([lat, lng])
  } else {
    addMarker(lat, lng)
  }
  map.value.panTo([lat, lng])
}

const addPolygonPoint = (lat, lng) => {
  const newPoint = {
    orden: localCoordinates.value.length + 1,
    latitud: parseFloat(lat.toFixed(6)),
    longitud: parseFloat(lng.toFixed(6))
  }

  localCoordinates.value.push(newPoint)
  drawPolygon()
}

const drawPolygon = () => {
  // Limpiar polígono y marcadores anteriores
  if (polygon.value) {
    map.value.removeLayer(polygon.value)
  }
  markers.value.forEach(m => map.value.removeLayer(m))
  markers.value = []

  if (localCoordinates.value.length === 0) return

  // Crear marcadores para cada punto
  localCoordinates.value.forEach((coord, index) => {
    const marker = L.marker([coord.latitud, coord.longitud], {
      draggable: true,
      icon: L.divIcon({
        className: 'custom-marker-numbered',
        html: `<div style="background: #1E3A8A; color: white; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">${index + 1}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      })
    }).addTo(map.value)

    // Evento de arrastre
    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng()
      localCoordinates.value[index].latitud = parseFloat(lat.toFixed(6))
      localCoordinates.value[index].longitud = parseFloat(lng.toFixed(6))
      drawPolygon()
    })

    markers.value.push(marker)
  })

  // Dibujar polígono si hay al menos 3 puntos
  if (localCoordinates.value.length >= 3) {
    const latlngs = localCoordinates.value.map(c => [c.latitud, c.longitud])
    
    polygon.value = L.polygon(latlngs, {
      color: '#1E3A8A',
      fillColor: '#0891B2',
      fillOpacity: 0.2,
      weight: 2
    }).addTo(map.value)

    // Ajustar vista al polígono
    map.value.fitBounds(polygon.value.getBounds(), { padding: [50, 50] })
  } else if (localCoordinates.value.length > 0) {
    // Si hay puntos pero menos de 3, centrar en el último
    const lastCoord = localCoordinates.value[localCoordinates.value.length - 1]
    map.value.setView([lastCoord.latitud, lastCoord.longitud], props.initialZoom)
  }
}

const removePolygonPoint = (index) => {
  localCoordinates.value.splice(index, 1)
  // Reordenar
  localCoordinates.value.forEach((coord, idx) => {
    coord.orden = idx + 1
  })
  drawPolygon()
}

const searchLocation = async () => {
  if (!searchQuery.value.trim()) return

  isSearching.value = true
  searchResults.value = []

  try {
    // Usar Nominatim de OpenStreetMap para búsqueda
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

  if (props.allowMultiple) {
    addPolygonPoint(lat, lng)
  } else {
    tempLat.value = lat
    tempLng.value = lng
    updateMarker(lat, lng)
  }

  searchResults.value = []
  searchQuery.value = ''
  map.value.setView([lat, lng], 15)
}

const confirmLocation = () => {
  if (props.allowMultiple) {
    emit('update:coordinates', localCoordinates.value)
  } else {
    emit('update:modelValue', {
      latitud: tempLat.value,
      longitud: tempLng.value
    })
  }
  emit('close')
}

const cancelSelection = () => {
  emit('close')
}

const clearAll = () => {
  if (props.allowMultiple) {
    localCoordinates.value = []
    drawPolygon()
  } else {
    tempLat.value = null
    tempLng.value = null
    if (marker.value) {
      map.value.removeLayer(marker.value)
      marker.value = null
    }
  }
}

// Watch para actualizar mapa cuando cambian las props
watch(() => props.coordinates, (newCoords) => {
  if (props.allowMultiple && isMapReady.value) {
    localCoordinates.value = [...newCoords]
    drawPolygon()
  }
}, { deep: true })
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div class="bg-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-border">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-border">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary/10 center">
            <MapPin class="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 class="text-xl font-semibold text-neutral">{{ title }}</h3>
            <p class="text-sm text-secondary mt-1">
              {{ allowMultiple ? 'Haz clic en el mapa para agregar puntos del polígono' : 'Haz clic en el mapa o arrastra el marcador' }}
            </p>
          </div>
        </div>
        <button
          @click="cancelSelection"
          class="w-10 h-10 rounded-lg hover:bg-hover center transition-colors"
          title="Cerrar"
        >
          <X class="w-5 h-5 text-tertiary" />
        </button>
      </div>

      <!-- Buscador -->
      <div class="p-4 border-b border-border bg-hover">
        <div class="relative">
          <input
            v-model="searchQuery"
            @keyup.enter="searchLocation"
            type="text"
            placeholder="Buscar ubicación en Bolivia..."
            class="w-full pr-32 pl-10"
          />
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary pointer-events-none" />
          <button
            @click="searchLocation"
            :disabled="isSearching || !searchQuery.trim()"
            class="absolute right-2 top-1/2 -translate-y-1/2 btn-outline px-4 py-1.5 text-sm flex items-center gap-2"
          >
            <Navigation class="w-4 h-4" />
            {{ isSearching ? 'Buscando...' : 'Buscar' }}
          </button>
        </div>

        <!-- Resultados de búsqueda -->
        <div v-if="searchResults.length > 0" class="mt-2 space-y-1 max-h-40 overflow-y-auto bg-surface rounded-lg border border-border">
          <button
            v-for="result in searchResults"
            :key="result.place_id"
            @click="selectSearchResult(result)"
            class="w-full text-left p-3 hover:bg-primary/10 transition flex items-start gap-2"
          >
            <MapPin class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div class="text-sm text-neutral">{{ result.display_name }}</div>
          </button>
        </div>
      </div>

      <!-- Map Container -->
      <div class="flex-1 relative min-h-0">
        <div ref="mapContainer" class="w-full h-full"></div>

        <!-- Coordenadas actuales (modo simple) -->
        <div v-if="!allowMultiple && hasValidCoordinates" class="absolute top-4 right-4 bg-surface/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border">
          <div class="flex items-center gap-2 mb-2">
            <MapPin class="w-4 h-4 text-primary" />
            <div class="text-xs font-medium text-neutral">Coordenadas</div>
          </div>
          <div class="font-mono text-sm text-neutral space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xs text-tertiary">Lat:</span>
              <span>{{ tempLat?.toFixed(6) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-tertiary">Lng:</span>
              <span>{{ tempLng?.toFixed(6) }}</span>
            </div>
          </div>
        </div>

        <!-- Lista de puntos (modo múltiple) -->
        <div v-if="allowMultiple && localCoordinates.length > 0" class="absolute top-4 right-4 bg-surface/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border max-w-xs max-h-64 overflow-y-auto">
          <div class="flex items-center justify-between mb-3">
            <div class="text-sm font-medium text-neutral">Puntos: {{ localCoordinates.length }}</div>
            <button
              @click="clearAll"
              class="text-xs text-error hover:underline flex items-center gap-1"
            >
              <Trash2 class="w-3 h-3" />
              Limpiar todo
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="(coord, index) in localCoordinates"
              :key="index"
              class="flex items-center gap-2 bg-hover p-2 rounded-lg"
            >
              <div class="w-6 h-6 rounded-full bg-primary text-white center font-bold text-xs flex-shrink-0">
                {{ coord.orden }}
              </div>
              <div class="flex-1 min-w-0 font-mono text-xs space-y-0.5">
                <div class="truncate text-neutral">{{ coord.latitud?.toFixed(6) }}</div>
                <div class="truncate text-tertiary">{{ coord.longitud?.toFixed(6) }}</div>
              </div>
              <button
                @click="removePolygonPoint(index)"
                class="w-6 h-6 rounded hover:bg-red-50 dark:hover:bg-red-900/20 center text-error transition-colors flex-shrink-0"
                title="Eliminar punto"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between p-4 border-t border-border bg-hover">
        <button
          @click="clearAll"
          class="btn-ghost flex items-center gap-2"
        >
          <Trash2 class="w-4 h-4" />
          Limpiar
        </button>
        <div class="flex gap-3">
          <button
            @click="cancelSelection"
            class="btn-secondary px-6"
          >
            Cancelar
          </button>
          <button
            @click="confirmLocation"
            :disabled="allowMultiple ? localCoordinates.length === 0 : !hasValidCoordinates"
            class="btn px-6 flex items-center gap-2"
          >
            <Check class="w-4 h-4" />
            Confirmar Ubicación
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.center {
  @apply flex justify-center items-center;
}

/* Estilos específicos para el mapa */
:deep(.leaflet-container) {
  font-family: inherit;
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: 0.5rem;
}
</style>