<!-- src/components/socio/CamionTrackingMapa.vue -->
<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { MapPin, Target, WifiOff, Radio } from 'lucide-vue-next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  trackingData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['conexion-change'])

const mapContainer = ref(null)
let map = null
let marcadorCamion = null
let routeLine = null
let markers = []

// 🆕 Estado de conexión viene del trackingData (manejado por el composable)
const estaOnline = computed(() => {
  return props.trackingData?.estadoConexion === 'online'
})

// 🆕 Emitir cambios cuando cambia el estado en trackingData
watch(() => props.trackingData?.estadoConexion, (nuevoEstado) => {
  if (nuevoEstado) {
    emit('conexion-change', nuevoEstado)
    console.log(`📡 Estado de conexión actualizado desde WebSocket: ${nuevoEstado}`)
  }
}, { immediate: true })

onMounted(async () => {
  await nextTick()
  setTimeout(() => {
    inicializarMapa()
  }, 500)
})

onUnmounted(() => {
  limpiarRuta()
  limpiarMarcadores()
  if (map) {
    map.remove()
    map = null
  }
})

watch(() => props.trackingData?.ubicacionActual, (newUbicacion, oldUbicacion) => {
  if (newUbicacion && map) {
    const cambioUbicacion = !oldUbicacion || 
      oldUbicacion.lat !== newUbicacion.lat || 
      oldUbicacion.lng !== newUbicacion.lng

    if (cambioUbicacion) {
      console.log('🔄 Nueva ubicación detectada, actualizando mapa')
      actualizarMarcadorCamion(newUbicacion)
      actualizarRutaProximoPunto()
    } else {
      // Aunque no cambió la ubicación, actualizar marcador por velocidad/rumbo
      actualizarMarcadorCamion(newUbicacion)
    }
  }
}, { deep: true })

watch(() => props.trackingData?.puntosControl, (newPuntos, oldPuntos) => {
  if (map && newPuntos) {
    const cambioEstado = JSON.stringify(newPuntos) !== JSON.stringify(oldPuntos)
    
    if (cambioEstado) {
      console.log('🔄 Estado de puntos cambió, reconstruyendo marcadores y ruta')
      console.log('📍 Estados actuales:', newPuntos.map(p => `${p.nombre}: ${p.estado}`).join(', '))
      
      limpiarRuta()
      limpiarMarcadores()
      agregarPuntosControl()
      actualizarRutaProximoPunto()
    }
  }
}, { deep: true })

const inicializarMapa = () => {
  console.log('🗺️ Inicializando mapa...')
  
  if (!L) { 
    console.error('❌ Leaflet no está disponible')
    return
  }

  if (!mapContainer.value) {
    console.error('❌ Contenedor no existe')
    return
  }

  try {
    const ubicacion = props.trackingData?.ubicacionActual
    const lat = ubicacion?.lat || -19.5
    const lng = ubicacion?.lng || -65.8

    map = L.map(mapContainer.value, { 
      center: [lat, lng],
      zoom: 13,
      zoomControl: true
    })

    console.log('✅ Mapa creado')

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }).addTo(map)

    console.log('✅ Tiles agregados')

    if (props.trackingData?.puntosControl) {
      agregarPuntosControl()
    }

    if (ubicacion) {
      actualizarMarcadorCamion(ubicacion)
    }

    actualizarRutaProximoPunto()

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

const limpiarMarcadores = () => {
  if (markers.length > 0) {
    markers.forEach(markerGroup => {
      if (markerGroup.marker && map.hasLayer(markerGroup.marker)) {
        map.removeLayer(markerGroup.marker)
      }
      if (markerGroup.circle && map.hasLayer(markerGroup.circle)) {
        map.removeLayer(markerGroup.circle)
      }
    })
    markers = []
    console.log('🗑️ Marcadores de puntos de control eliminados')
  }
}

const agregarPuntosControl = () => {
  const puntosControl = props.trackingData.puntosControl || []
  
  console.log(`📍 Agregando ${puntosControl.length} puntos de control`)
  
  puntosControl.forEach(punto => {
    let color = '#6B7280'
    
    if (punto.tipo === 'mina') {
      color = '#10B981'
    } else if (punto.tipo.includes('balanza')) {
      color = '#F59E0B'
    } else if (punto.tipo.includes('almacen')) {
      color = '#6366F1'
    }

    let fillOpacity = 0.8
    let weight = 2
    
    if (punto.estado === 'completado') {
      fillOpacity = 0.4
      weight = 1
    } else if (punto.estado === 'en_punto') {
      fillOpacity = 1.0
      weight = 3
    }

    const marker = L.circleMarker([punto.lat, punto.lng], {
      radius: punto.estado === 'en_punto' ? 10 : 8,
      fillColor: color,
      color: '#fff',
      weight: weight,
      fillOpacity: fillOpacity
    }).addTo(map)

    const estadoEmoji = {
      'completado': '✓',
      'en_punto': '◉',
      'pendiente': '○'
    }

    const estadoTexto = {
      'completado': 'Completado',
      'en_punto': 'En punto',
      'pendiente': 'Pendiente'
    }

    let tiemposHtml = ''
    if (punto.llegada) {
      const llegadaDate = new Date(punto.llegada)
      tiemposHtml += `<p style="margin: 4px 0; font-size: 11px;">🕐 Llegada: ${llegadaDate.toLocaleTimeString('es-BO')}</p>`
    }
    if (punto.salida) {
      const salidaDate = new Date(punto.salida)
      tiemposHtml += `<p style="margin: 4px 0; font-size: 11px;">🕑 Salida: ${salidaDate.toLocaleTimeString('es-BO')}</p>`
    }

    marker.bindPopup(`
      <div style="min-width: 150px;">
        <h3 style="margin: 0 0 8px 0; font-weight: 600; color: ${color};">${punto.nombre}</h3>
        <p style="margin: 0; font-size: 12px; color: #6B7280; text-transform: capitalize;">${punto.tipo.replace(/_/g, ' ')}</p>
        <div style="margin-top: 8px; padding: 4px 8px; background: ${color}20; color: ${color}; border-radius: 4px; font-size: 11px; font-weight: 500; display: inline-block;">
          ${estadoEmoji[punto.estado] || '○'} ${estadoTexto[punto.estado] || 'Pendiente'}
        </div>
        ${tiemposHtml}
      </div>
    `)

    const circle = L.circle([punto.lat, punto.lng], {
      radius: punto.radio || 1000,
      color: color,
      fillColor: color,
      fillOpacity: 0.05,
      weight: 1,
      dashArray: '5, 5'
    }).addTo(map)

    markers.push({ marker, circle, punto })
    console.log(`  ✅ ${punto.nombre} - Estado: ${punto.estado}`)
  })

  console.log(`✅ ${puntosControl.length} puntos de control agregados`)
}

const actualizarMarcadorCamion = (ubicacion) => {
  if (!map) return

  if (marcadorCamion) {
    map.removeLayer(marcadorCamion)
  }

  const colorCamion = estaOnline.value ? '#3B82F6' : '#9CA3AF'
  const colorPulso = estaOnline.value ? '#3B82F6' : '#6B7280'

  const iconoHTML = `
    <div style="position: relative; width: 32px; height: 32px;">
      ${estaOnline.value ? `<div style="position: absolute; top: 50%; left: 50%; width: 48px; height: 48px; background: ${colorPulso}; border-radius: 50%; opacity: 0.3; animation: pulse 2s infinite; transform: translate(-50%, -50%);"></div>` : ''}
      <div style="position: relative; width: 32px; height: 32px; background: ${colorCamion}; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; transform: rotate(${ubicacion.rumbo || 0}deg); box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M18 18.5a1.5 1.5 0 0 1-1 1.415V21a1 1 0 1 1-2 0v-1.085a1.5 1.5 0 1 1 3 0zM9 18.5a1.5 1.5 0 0 1-1 1.415V21a1 1 0 1 1-2 0v-1.085a1.5 1.5 0 1 1 3 0zM6 5a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V5z"/>
        </svg>
      </div>
    </div>
  `

  const icono = L.divIcon({
    html: iconoHTML,
    className: 'camion-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  })

  marcadorCamion = L.marker([ubicacion.lat, ubicacion.lng], {
    icon: icono,
    zIndexOffset: 1000
  }).addTo(map)

  const velocidad = ubicacion.velocidad ? Math.round(ubicacion.velocidad) : 0
  const timestamp = new Date(ubicacion.timestamp).toLocaleTimeString('es-BO')
  const estadoTexto = estaOnline.value ? 'En Línea' : 'Sin Conexión'
  const estadoColor = estaOnline.value ? '#10B981' : '#EF4444'
  
  marcadorCamion.bindPopup(`
    <div style="min-width: 180px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <div style="width: 8px; height: 8px; background: ${estadoColor}; border-radius: 50%; ${estaOnline.value ? 'animation: pulse 2s infinite;' : ''}"></div>
        <h3 style="margin: 0; font-weight: 600;">${estadoTexto}</h3>
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

const limpiarRuta = () => {
  if (routeLine && map) {
    try {
      if (map.hasLayer(routeLine)) {
        map.removeLayer(routeLine)
        console.log('🗑️ Ruta anterior eliminada correctamente')
      }
    } catch (e) {
      console.warn('⚠️ Error al eliminar ruta anterior:', e)
    }
    routeLine = null
  }
}

const actualizarRutaProximoPunto = async () => {
  if (!map || !props.trackingData?.ubicacionActual) {
    console.log('⚠️ No se puede actualizar ruta: mapa o ubicación no disponible')
    return
  }

  limpiarRuta()

  const proximoPunto = obtenerProximoPuntoControl()
  
  if (!proximoPunto) {
    console.log('ℹ️ No hay próximo punto de control pendiente, no se dibuja ruta')
    return
  }

  const { lat: origenLat, lng: origenLng } = props.trackingData.ubicacionActual
  const { lat: destinoLat, lng: destinoLng } = proximoPunto

  console.log(`🗺️ Dibujando ruta hacia próximo punto: ${proximoPunto.nombre} (${proximoPunto.estado})`)
  console.log('📍 Desde:', origenLat.toFixed(4), origenLng.toFixed(4))
  console.log('📍 Hasta:', destinoLat.toFixed(4), destinoLng.toFixed(4))

  try {
    const route = await fetchRoute(origenLat, origenLng, destinoLat, destinoLng)
    
    if (route && route.geometry) {
      const coordinates = decodePolyline(route.geometry)
      
      if (coordinates.length < 2) {
        throw new Error('Coordenadas insuficientes para dibujar ruta')
      }

      if (routeLine) {
        console.warn('⚠️ Se intentó dibujar una ruta cuando ya existe una, limpiando primero')
        limpiarRuta()
      }

      routeLine = L.polyline(coordinates, {
        color: estaOnline.value ? '#3B82F6' : '#9CA3AF',
        weight: 4,
        opacity: estaOnline.value ? 0.7 : 0.4,
        smoothFactor: 1,
        dashArray: estaOnline.value ? null : '10, 10'
      }).addTo(map)

      console.log(`✅ Ruta dibujada exitosamente con ${coordinates.length} puntos hacia ${proximoPunto.nombre}`)
    } else {
      throw new Error('No se pudo obtener geometría de ruta')
    }
  } catch (error) {
    console.warn('⚠️ No se pudo obtener ruta de OSRM, usando línea directa:', error.message)
    
    if (routeLine) {
      console.warn('⚠️ Se intentó dibujar una línea cuando ya existe una ruta, limpiando primero')
      limpiarRuta()
    }

    routeLine = L.polyline([
      [origenLat, origenLng],
      [destinoLat, destinoLng]
    ], {
      color: estaOnline.value ? '#6B7280' : '#9CA3AF',
      weight: 3,
      opacity: 0.5,
      dashArray: '10, 10'
    }).addTo(map)

    console.log(`✅ Línea directa dibujada como fallback hacia ${proximoPunto.nombre}`)
  }
}

const obtenerProximoPuntoControl = () => {
  const puntosControl = props.trackingData?.puntosControl || []
  
  console.log('🔍 Buscando próximo punto de control...')
  console.log('  Puntos disponibles:', puntosControl.map(p => `${p.nombre} (${p.estado})`).join(', '))
  
  const proximoPunto = puntosControl.find(punto => punto.estado !== 'completado')
  
  if (proximoPunto) {
    console.log(`🎯 Próximo punto encontrado: ${proximoPunto.nombre} - Estado: ${proximoPunto.estado}`)
  } else {
    console.log('ℹ️ No hay puntos pendientes (todos completados)')
  }
  
  return proximoPunto || null
}

const fetchRoute = async (lat1, lng1, lat2, lng2) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=polyline`
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000)
    })
    
    const data = await response.json()

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No se encontró una ruta válida')
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

const ajustarVista = () => {
  if (!map) return

  const bounds = []

  if (props.trackingData?.ubicacionActual) {
    const { lat, lng } = props.trackingData.ubicacionActual
    bounds.push([lat, lng])
  }

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
  ajustarVista,
  estadoConexion: estaOnline
})
</script>

<template>
  <div class="relative w-full h-full">
    <div 
      ref="mapContainer" 
      class="absolute inset-0 w-full h-full bg-gray-200 rounded-lg"
      style="min-height: 400px;"
    ></div>

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

    <div class="absolute bottom-4 left-4 z-1000">
      <div 
        class="bg-white rounded-lg shadow-lg px-3 py-2 flex items-center gap-2 transition-all"
        :class="estaOnline ? 'border-2 border-green-500' : 'border-2 border-red-500'"
      >
        <component 
          :is="estaOnline ? Radio : WifiOff" 
          class="w-4 h-4"
          :class="estaOnline ? 'text-green-500' : 'text-red-500'"
        />
        <div class="flex items-center gap-2">
          <div 
            class="w-2 h-2 rounded-full"
            :class="estaOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'"
          ></div>
          <span 
            class="text-xs font-medium"
            :class="estaOnline ? 'text-green-700' : 'text-red-700'"
          >
            {{ estaOnline ? 'En línea' : 'Sin conexión' }}
          </span>
        </div>
      </div>
    </div>

    <div class="absolute bottom-4 right-4 z-1000 bg-white rounded-lg shadow-lg p-3" style="max-width: 200px;">
      <h4 class="text-xs font-semibold text-gray-700 mb-2">Leyenda</h4>
      <div class="space-y-1 text-xs">
        <div class="flex items-center gap-2">
          <div 
            class="w-3 h-3 rounded-full"
            :class="estaOnline ? 'bg-blue-500' : 'bg-gray-400'"
          ></div>
          <span class="text-gray-600">Camión {{ estaOnline ? '(activo)' : '(offline)' }}</span>
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
        <div class="flex items-center gap-2 pt-1 border-t border-gray-200">
          <div 
            class="w-8 h-0.5"
            :class="estaOnline ? 'bg-blue-500' : 'bg-gray-400'"
            :style="estaOnline ? '' : 'background-image: repeating-linear-gradient(to right, #9CA3AF 0, #9CA3AF 5px, transparent 5px, transparent 10px)'"
          ></div>
          <span class="text-gray-600">Ruta</span>
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