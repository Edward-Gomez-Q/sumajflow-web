<!-- src/components/socio/CamionTrackingMapa.vue -->
<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { MapPin, Target } from 'lucide-vue-next'
import L from 'leaflet' // ← AGREGAR ESTA IMPORTACIÓN
import 'leaflet/dist/leaflet.css' // ← AGREGAR ESTILOS

const props = defineProps({
  trackingData: {
    type: Object,
    required: true
  }
})

const mapContainer = ref(null)
let map = null
let marcadorCamion = null
const markers = []

onMounted(async () => {
  await nextTick()
  setTimeout(() => {
    inicializarMapa()
  }, 500)
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

watch(() => props.trackingData?.ubicacionActual, (newUbicacion) => {
  if (newUbicacion && map) {
    actualizarMarcadorCamion(newUbicacion)
  }
}, { deep: true })

const inicializarMapa = () => {
  console.log('🗺️ Inicializando mapa...')
  console.log('Leaflet disponible:', !!L) // ← CAMBIAR window.L por L
  console.log('Contenedor:', mapContainer.value)
  console.log('Datos:', props.trackingData)
  
  if (!L) { 
    console.error('❌ Leaflet no está disponible')
    return
  }

  if (!mapContainer.value) {
    console.error('❌ Contenedor no existe')
    return
  }

  try {
    // Obtener ubicación actual
    const ubicacion = props.trackingData?.ubicacionActual
    const lat = ubicacion?.lat || -19.5
    const lng = ubicacion?.lng || -65.8

    // Crear mapa
    map = L.map(mapContainer.value, { // ← CAMBIAR window.L por L
      center: [lat, lng],
      zoom: 13,
      zoomControl: true
    })

    console.log('✅ Mapa creado')

    // Agregar tiles de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { // ← CAMBIAR window.L por L
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }).addTo(map)

    console.log('✅ Tiles agregados')

    // Agregar puntos de control
    if (props.trackingData?.puntosControl) {
      agregarPuntosControl()
    }

    // Agregar marcador del camión
    if (ubicacion) {
      actualizarMarcadorCamion(ubicacion)
    }

    // Ajustar vista
    setTimeout(() => {
      if (map) {
        map.invalidateSize()
        ajustarVista()
      }
    }, 300)

    console.log('✅ Mapa inicializado completamente')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

const agregarPuntosControl = () => {
  const puntosControl = props.trackingData.puntosControl || []
  
  puntosControl.forEach(punto => {
    // Determinar color según tipo
    let color = '#6B7280'
    if (punto.tipo === 'mina') color = '#10B981'
    else if (punto.tipo.includes('balanza')) color = '#F59E0B'
    else if (punto.tipo.includes('almacen')) color = '#6366F1'

    // Crear marcador
    const marker = L.circleMarker([punto.lat, punto.lng], { // ← CAMBIAR window.L por L
      radius: 8,
      fillColor: color,
      color: '#fff',
      weight: 2,
      fillOpacity: 0.8
    }).addTo(map)

    // Popup
    marker.bindPopup(`
      <div style="min-width: 150px;">
        <h3 style="margin: 0 0 8px 0; font-weight: 600; color: ${color};">${punto.nombre}</h3>
        <p style="margin: 0; font-size: 12px; color: #6B7280;">${punto.tipo.replace(/_/g, ' ')}</p>
        <div style="margin-top: 8px; padding: 4px 8px; background: ${color}20; color: ${color}; border-radius: 4px; font-size: 11px; font-weight: 500; display: inline-block;">
          ${punto.estado === 'completado' ? '✓ Completado' : punto.estado === 'en_punto' ? '◉ En punto' : '○ Pendiente'}
        </div>
      </div>
    `)

    // Agregar círculo de geofencing
    L.circle([punto.lat, punto.lng], { // ← CAMBIAR window.L por L
      radius: punto.radio || 1000,
      color: color,
      fillColor: color,
      fillOpacity: 0.05,
      weight: 1,
      dashArray: '5, 5'
    }).addTo(map)

    markers.push(marker)
  })

  console.log(`✅ ${puntosControl.length} puntos de control agregados`)
}

const actualizarMarcadorCamion = (ubicacion) => {
  if (!map) return

  // Remover marcador anterior
  if (marcadorCamion) {
    map.removeLayer(marcadorCamion)
  }

  // Crear icono personalizado del camión
const iconoHTML = `
  <div style="position: relative; width: 32px; height: 32px;">
    <div style="position: absolute; top: 50%; left: 50%; width: 48px; height: 48px; background: #3B82F6; border-radius: 50%; opacity: 0.3; animation: pulse 2s infinite; transform: translate(-50%, -50%);"></div>
      <div style="position: relative; width: 32px; height: 32px; background: #3B82F6; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; transform: rotate(${ubicacion.rumbo || 0}deg);">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M18 18.5a1.5 1.5 0 0 1-1 1.415V21a1 1 0 1 1-2 0v-1.085a1.5 1.5 0 1 1 3 0zM9 18.5a1.5 1.5 0 0 1-1 1.415V21a1 1 0 1 1-2 0v-1.085a1.5 1.5 0 1 1 3 0zM6 5a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V5z"/>
        </svg>
      </div>
    </div>
  `

  const icono = L.divIcon({ // ← CAMBIAR window.L por L
    html: iconoHTML,
    className: 'camion-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  })

  // Crear marcador
  marcadorCamion = L.marker([ubicacion.lat, ubicacion.lng], { // ← CAMBIAR window.L por L
    icon: icono,
    zIndexOffset: 1000
  }).addTo(map)

  // Popup
  const velocidad = ubicacion.velocidad ? Math.round(ubicacion.velocidad) : 0
  const timestamp = new Date(ubicacion.timestamp).toLocaleTimeString('es-BO')
  
  marcadorCamion.bindPopup(`
    <div style="min-width: 180px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <div style="width: 8px; height: 8px; background: #10B981; border-radius: 50%; animation: pulse 2s infinite;"></div>
        <h3 style="margin: 0; font-weight: 600;">Ubicación en Vivo</h3>
      </div>
      <div style="font-size: 12px; color: #6B7280; line-height: 1.5;">
        <p style="margin: 4px 0;">📍 ${ubicacion.lat.toFixed(6)}, ${ubicacion.lng.toFixed(6)}</p>
        <p style="margin: 4px 0;">🚗 ${velocidad} km/h</p>
        <p style="margin: 4px 0;">🧭 ${Math.round(ubicacion.rumbo || 0)}°</p>
        <p style="margin: 4px 0; color: #9CA3AF;">⏰ ${timestamp}</p>
      </div>
    </div>
  `)

  console.log('✅ Marcador del camión actualizado')
}

const ajustarVista = () => {
  if (!map) return

  const bounds = []

  // Agregar ubicación del camión
  if (props.trackingData?.ubicacionActual) {
    const { lat, lng } = props.trackingData.ubicacionActual
    bounds.push([lat, lng])
  }

  // Agregar puntos de control
  if (props.trackingData?.puntosControl) {
    props.trackingData.puntosControl.forEach(punto => {
      bounds.push([punto.lat, punto.lng])
    })
  }

  if (bounds.length > 0) {
    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 14
    })
  }
}

const centrarEnCamion = () => {
  if (!map || !props.trackingData?.ubicacionActual) return
  
  const { lat, lng } = props.trackingData.ubicacionActual
  map.setView([lat, lng], 15, { animate: true })
}

defineExpose({
  centrarEnCamion,
  ajustarVista
})
</script>

<template>
  <div class="relative w-full h-full">
    <!-- Contenedor del mapa -->
    <div 
      ref="mapContainer" 
      class="absolute inset-0 w-full h-full bg-gray-200 rounded-lg"
      style="min-height: 400px;"
    ></div>

    <!-- Controles -->
    <div class="absolute top-4 right-4 z-1000 flex flex-col gap-2">
      <button
        v-if="trackingData?.ubicacionActual"
        @click="centrarEnCamion"
        class="bg-white rounded-lg shadow-lg p-2 hover:bg-gray-50 transition-colors"
        title="Centrar en camión"
      >
        <Target class="w-5 h-5 text-blue-500" />
      </button>
      
      <button
        @click="ajustarVista"
        class="bg-white rounded-lg shadow-lg p-2 hover:bg-gray-50 transition-colors"
        title="Ver todo"
      >
        <MapPin class="w-5 h-5 text-gray-700" />
      </button>
    </div>

    <!-- Indicador en vivo -->
    <div class="absolute bottom-4 left-4 z-1000 bg-white rounded-lg shadow-lg px-3 py-2 flex items-center gap-2">
      <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span class="text-xs font-medium text-gray-700">Tracking en vivo</span>
    </div>

    <!-- Leyenda -->
    <div class="absolute bottom-4 right-4 z-1000 bg-white rounded-lg shadow-lg p-3" style="max-width: 200px;">
      <h4 class="text-xs font-semibold text-gray-700 mb-2">Leyenda</h4>
      <div class="space-y-1 text-xs">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span class="text-gray-600">Camión</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-green-500 rounded-full"></div>
          <span class="text-gray-600">Mina</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span class="text-gray-600">Balanza</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-indigo-500 rounded-full"></div>
          <span class="text-gray-600">Almacén</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.camion-marker {
  background: transparent;
  border: none;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>