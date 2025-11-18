<script setup>
import { ref, computed, watch } from 'vue'
import { MapPin, CheckCircle, X } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  showMap: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: 'Dirección'
  },
  helperText: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])

// Estado del modal
const showMapModal = ref(false)
const mapContainer = ref(null)
let map = null
let marker = null

const localValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const updateField = (field, value) => {
  emit('update:modelValue', {
    ...localValue.value,
    [field]: value
  })
}

// Datos de Bolivia
const departamentos = [
  'Chuquisaca', 'La Paz', 'Cochabamba', 'Oruro', 'Potosí', 
  'Tarija', 'Santa Cruz', 'Beni', 'Pando'
]

// Abrir modal y cargar mapa
const openMapModal = async () => {
  showMapModal.value = true
  
  await new Promise(resolve => setTimeout(resolve, 100))
  
  if (!mapContainer.value) return
  
  // Cargar Leaflet dinámicamente
  if (!window.L) {
    await loadLeaflet()
  }
  
  initMap()
}

// Cargar Leaflet CSS y JS
const loadLeaflet = () => {
  return new Promise((resolve, reject) => {
    // Cargar CSS
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    
    // Cargar JS
    if (!document.querySelector('script[src*="leaflet.js"]')) {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    } else {
      resolve()
    }
  })
}

// Inicializar mapa
const initMap = () => {
  if (!window.L || !mapContainer.value) return
  
  // Coordenadas por defecto (Bolivia - centro aprox.)
  const defaultLat = localValue.value.latitud || -16.5
  const defaultLng = localValue.value.longitud || -68.15
  
  // Crear mapa
  map = window.L.map(mapContainer.value).setView([defaultLat, defaultLng], 6)
  
  // Añadir capa de OpenStreetMap
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map)
  
  // Añadir marcador si hay coordenadas
  if (localValue.value.latitud && localValue.value.longitud) {
    marker = window.L.marker([localValue.value.latitud, localValue.value.longitud], {
      draggable: true
    }).addTo(map)
    
    marker.on('dragend', function(e) {
      const position = e.target.getLatLng()
      updateCoordinates(position.lat, position.lng)
    })
  }
  
  // Click en el mapa para añadir/mover marcador
  map.on('click', function(e) {
    const { lat, lng } = e.latlng
    
    if (marker) {
      marker.setLatLng([lat, lng])
    } else {
      marker = window.L.marker([lat, lng], {
        draggable: true
      }).addTo(map)
      
      marker.on('dragend', function(e) {
        const position = e.target.getLatLng()
        console.log('Marcador movido a:', position)
        updateCoordinates(position.lat, position.lng)
      })
    }
    
    updateCoordinates(lat, lng)
  })
  
  // Forzar actualización del tamaño del mapa
  setTimeout(() => {
    map.invalidateSize()
  }, 200)
}

// Actualizar coordenadas
const updateCoordinates = (lat, lng) => {
  updateField('latitud', lat)
  //Esperar un momento para evitar problemas de reactividad
  setTimeout(() => {
    updateField('longitud', lng)
  }, 0)
}

// Cerrar modal
const closeMapModal = () => {
  showMapModal.value = false
  if (map) {
    map.remove()
    map = null
    marker = null
  }
}

// Confirmar selección
const confirmLocation = () => {
  closeMapModal()
}

// Centrar mapa en ubicación actual (si el navegador lo permite)
const centerOnCurrentLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Ubicación actual:', position)
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        
        if (map) {
          map.setView([lat, lng], 13)
          
          if (marker) {
            marker.setLatLng([lat, lng])
          } else {
            marker = window.L.marker([lat, lng], {
              draggable: true
            }).addTo(map)
            
            marker.on('dragend', function(e) {
              const position = e.target.getLatLng()
              updateCoordinates(position.lat, position.lng)
            })
          }
          
          updateCoordinates(lat, lng)
        }
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error)
        alert('No se pudo obtener tu ubicación actual')
      }
    )
  } else {
    alert('Tu navegador no soporta geolocalización')
  }
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <h3 class="text-sm font-semibold text-neutral mb-1">{{ label }}</h3>
      <p v-if="helperText" class="text-sm text-secondary leading-relaxed">
        {{ helperText }}
      </p>
    </div>

    <!-- Departamento, Provincia, Municipio -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="input-group">
        <label for="departamento" class="input-label">
          Departamento <span v-if="required" class="text-error">*</span>
        </label>
        <select
          id="departamento"
          :value="localValue.departamento"
          @change="updateField('departamento', $event.target.value)"
          class="w-full"
          :required="required"
        >
          <option value="">Seleccionar</option>
          <option v-for="dep in departamentos" :key="dep" :value="dep">
            {{ dep }}
          </option>
        </select>
      </div>

      <div class="input-group">
        <label for="provincia" class="input-label">
          Provincia <span v-if="required" class="text-error">*</span>
        </label>
        <input
          id="provincia"
          type="text"
          :value="localValue.provincia"
          @input="updateField('provincia', $event.target.value)"
          placeholder="Ej: Tomás Frías"
          class="w-full"
          :required="required"
        />
      </div>

      <div class="input-group">
        <label for="municipio" class="input-label">
          Municipio <span v-if="required" class="text-error">*</span>
        </label>
        <input
          id="municipio"
          type="text"
          :value="localValue.municipio"
          @input="updateField('municipio', $event.target.value)"
          placeholder="Ej: Potosí"
          class="w-full"
          :required="required"
        />
      </div>
    </div>

    <!-- Dirección -->
    <div class="input-group">
      <label for="direccion" class="input-label">
        Dirección <span v-if="required" class="text-error">*</span>
      </label>
      <input
        id="direccion"
        type="text"
        :value="localValue.direccion"
        @input="updateField('direccion', $event.target.value)"
        placeholder="Ej: Av. Cívica #123, Zona Central"
        class="w-full"
        :required="required"
      />
      <p class="input-helper">
        Incluye calle, número, zona y referencias si es necesario
      </p>
    </div>

    <!-- Coordenadas y Mapa -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="input-group">
        <label for="latitud" class="input-label">Latitud</label>
        <input
          id="latitud"
          type="number"
          step="0.000001"
          :value="localValue.latitud"
          @input="updateField('latitud', parseFloat($event.target.value) || null)"
          placeholder="-19.583333"
          class="w-full"
        />
      </div>

      <div class="input-group">
        <label for="longitud" class="input-label">Longitud</label>
        <input
          id="longitud"
          type="number"
          step="0.000001"
          :value="localValue.longitud"
          @input="updateField('longitud', parseFloat($event.target.value) || null)"
          placeholder="-65.75"
          class="w-full"
        />
      </div>

      <div class="flex items-end" v-if="showMap">
        <button
          type="button"
          @click="openMapModal"
          class="btn-outline w-full flex items-center justify-center gap-2"
        >
          <MapPin class="w-4 h-4" />
          Seleccionar en mapa
        </button>
      </div>
    </div>

    <!-- Información adicional si tiene coordenadas -->
    <div
      v-if="localValue.latitud && localValue.longitud"
      class="bg-green-100/70 dark:bg-green-900/40 border border-green-400/60 dark:border-green-700 rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200"
    >
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-green-200/50 dark:bg-green-800/50 center">
          <CheckCircle class="w-4 h-4 text-green-700 dark:text-green-300" />
        </div>
        <div class="text-sm">
          <p class="font-medium text-neutral mb-0.5">Ubicación registrada</p>
          <p class="text-secondary font-mono">
            {{ localValue.latitud?.toFixed(6) }}, {{ localValue.longitud?.toFixed(6) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Modal del Mapa -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showMapModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click.self="closeMapModal"
        >
          <div class="bg-surface rounded-xl shadow-strong w-full max-w-4xl max-h-[90vh] flex flex-col">
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 class="text-xl font-semibold text-neutral">Seleccionar Ubicación</h3>
                <p class="text-sm text-secondary mt-1">
                  Haz click en el mapa o arrastra el marcador para seleccionar la ubicación
                </p>
              </div>
              <button
                @click="closeMapModal"
                class="p-2 rounded-lg hover:bg-hover transition-colors"
              >
                <X class="w-5 h-5 text-tertiary" />
              </button>
            </div>

            <!-- Contenedor del Mapa -->
            <div class="flex-1 relative min-h-[500px]">
              <div ref="mapContainer" class="absolute inset-0 rounded-b-xl overflow-hidden"></div>
              
              <!-- Botón para centrar en ubicación actual -->
              <button
                @click="centerOnCurrentLocation"
                class="absolute top-4 right-4 z-1000 bg-surface border border-border rounded-lg px-4 py-2 shadow-elevated hover:bg-hover transition-all flex items-center gap-2"
              >
                <MapPin class="w-4 h-4" />
                <span class="text-sm font-medium">Mi ubicación</span>
              </button>

              <!-- Info de coordenadas actuales -->
              <div
                v-if="localValue.latitud && localValue.longitud"
                class="absolute bottom-4 left-4 z-1000 bg-surface border border-border rounded-lg px-4 py-2 shadow-elevated"
              >
                <p class="text-xs text-secondary mb-1">Coordenadas seleccionadas:</p>
                <p class="text-sm font-mono text-neutral">
                  {{ localValue.latitud?.toFixed(6) }}, {{ localValue.longitud?.toFixed(6) }}
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-3 p-6 border-t border-border">
              <button
                @click="closeMapModal"
                class="btn-ghost px-6"
              >
                Cancelar
              </button>
              <button
                @click="confirmLocation"
                class="btn px-6"
                :disabled="!localValue.latitud || !localValue.longitud"
              >
                Confirmar ubicación
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>


/* Transiciones del modal */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .bg-surface,
.modal-leave-active .bg-surface {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from .bg-surface,
.modal-leave-to .bg-surface {
  transform: scale(0.95);
  opacity: 0;
}
</style>