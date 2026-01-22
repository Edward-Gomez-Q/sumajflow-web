<!-- src/components/socio/CamionHistorialMapa.vue -->
<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { MapPin, Target, Layers } from 'lucide-vue-next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  puntos: {
    type: Array,
    required: true
  },
  trackingActual: {
    type: Object,
    default: null
  },
  filtroActual: {
    type: String,
    default: 'todos'
  }
})

const mapContainer = ref(null)
let map = null
let polyline = null
let marcadores = []
const mostrarRuta = ref(true)
const mostrarMarcadores = ref(false)

onMounted(async () => {
  await nextTick()
  setTimeout(() => {
    inicializarMapa()
  }, 500)
})

onUnmounted(() => {
  limpiarMapa()
})

watch(() => props.puntos, () => {
  if (map) {
    actualizarMapa()
  }
}, { deep: true })

watch(mostrarRuta, () => {
  if (map) {
    actualizarMapa()
  }
})

watch(mostrarMarcadores, () => {
  if (map) {
    actualizarMapa()
  }
})

const inicializarMapa = () => {
  console.log('🗺️ Inicializando mapa de historial...')
  
  if (!L || !mapContainer.value) {
    console.error('❌ Leaflet o contenedor no disponible')
    return
  }

  try {
    // Determinar centro
    const primerPunto = props.puntos[0]
    const lat = primerPunto?.lat || -19.5
    const lng = primerPunto?.lng || -65.8

    // Crear mapa
    map = L.map(mapContainer.value, {
      center: [lat, lng],
      zoom: 13,
      zoomControl: true
    })

    // Agregar tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }).addTo(map)

    // Agregar puntos de control si están disponibles
    if (props.trackingActual?.puntosControl) {
      agregarPuntosControl()
    }

    // Dibujar historial
    actualizarMapa()

    setTimeout(() => {
      if (map) {
        map.invalidateSize()
        ajustarVista()
      }
    }, 300)

    console.log('✅ Mapa de historial inicializado')
  } catch (error) {
    console.error('❌ Error inicializando mapa:', error)
  }
}

const agregarPuntosControl = () => {
  const puntosControl = props.trackingActual.puntosControl || []
  
  puntosControl.forEach(punto => {
    let color = '#6B7280'
    if (punto.tipo === 'mina') color = '#10B981'
    else if (punto.tipo.includes('balanza')) color = '#F59E0B'
    else if (punto.tipo.includes('almacen')) color = '#6366F1'

    const marker = L.circleMarker([punto.lat, punto.lng], {
      radius: 10,
      fillColor: color,
      color: '#fff',
      weight: 3,
      fillOpacity: 0.9,
      zIndexOffset: 1000
    }).addTo(map)

    marker.bindPopup(`
      <div style="min-width: 150px;">
        <h3 style="margin: 0 0 8px 0; font-weight: 600; color: ${color};">${punto.nombre}</h3>
        <p style="margin: 0; font-size: 12px; color: #6B7280;">${punto.tipo.replace(/_/g, ' ')}</p>
        <div style="margin-top: 8px; padding: 4px 8px; background: ${color}20; color: ${color}; border-radius: 4px; font-size: 11px; font-weight: 500; display: inline-block;">
          ${punto.estado === 'completado' ? '✓ Completado' : punto.estado === 'en_punto' ? '◉ En punto' : '○ Pendiente'}
        </div>
      </div>
    `)

    L.circle([punto.lat, punto.lng], {
      radius: punto.radio || 1000,
      color: color,
      fillColor: color,
      fillOpacity: 0.05,
      weight: 1,
      dashArray: '5, 5'
    }).addTo(map)
  })

  console.log(`✅ ${puntosControl.length} puntos de control agregados`)
}

const actualizarMapa = () => {
  if (!map) return

  // Limpiar elementos anteriores
  limpiarElementos()

  if (props.puntos.length === 0) {
    console.log('⚠️ No hay puntos para mostrar')
    return
  }

  console.log(`📍 Actualizando mapa con ${props.puntos.length} puntos`)

  // Ordenar por timestamp
  const puntosOrdenados = [...props.puntos].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  )

  // Dibujar ruta (polyline)
  if (mostrarRuta.value) {
    dibujarRuta(puntosOrdenados)
  }

  // Agregar marcadores
  if (mostrarMarcadores.value) {
    agregarMarcadoresPuntos(puntosOrdenados)
  }

  // Agregar marcadores de inicio y fin
  agregarMarcadoresInicioFin(puntosOrdenados)

  // Ajustar vista
  ajustarVista()
}

const dibujarRuta = (puntos) => {
  // Agrupar por estado para diferentes colores
  const segmentosPorEstado = {}
  
  puntos.forEach(punto => {
    const estado = punto.estadoViaje || 'Sin estado'
    if (!segmentosPorEstado[estado]) {
      segmentosPorEstado[estado] = []
    }
    segmentosPorEstado[estado].push([punto.lat, punto.lng])
  })

  // Dibujar cada segmento con su color
  Object.entries(segmentosPorEstado).forEach(([estado, coordenadas]) => {
    const color = getColorEstado(estado)
    
    const line = L.polyline(coordenadas, {
      color: color,
      weight: 4,
      opacity: 0.7,
      smoothFactor: 1
    }).addTo(map)

    // Agregar efecto de línea offline si corresponde
    const puntosOfflineEnEstado = puntos.filter(p => 
      p.estadoViaje === estado && p.esOffline
    )
    
    if (puntosOfflineEnEstado.length > 0) {
      const coordenadasOffline = puntosOfflineEnEstado.map(p => [p.lat, p.lng])
      L.polyline(coordenadasOffline, {
        color: '#F59E0B',
        weight: 6,
        opacity: 0.4,
        dashArray: '10, 10'
      }).addTo(map)
    }

    marcadores.push(line)
  })

  console.log('✅ Ruta dibujada')
}

const agregarMarcadoresPuntos = (puntos) => {
  // Agregar solo cada N puntos para no saturar el mapa
  const step = Math.max(1, Math.floor(puntos.length / 50))
  
  puntos.forEach((punto, index) => {
    if (index % step !== 0 && index !== puntos.length - 1) return

    const color = punto.esOffline ? '#F59E0B' : '#3B82F6'
    
    const marker = L.circleMarker([punto.lat, punto.lng], {
      radius: 3,
      fillColor: color,
      color: '#fff',
      weight: 1,
      fillOpacity: 0.8
    }).addTo(map)

    const timestamp = new Date(punto.timestamp).toLocaleString('es-BO')
    const velocidad = punto.velocidad ? Math.round(punto.velocidad) : 0
    
    marker.bindPopup(`
      <div style="min-width: 150px; font-size: 12px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
          <div style="width: 8px; height: 8px; background: ${color}; border-radius: 50%;"></div>
          <strong>${punto.esOffline ? 'Offline' : 'Online'}</strong>
        </div>
        <p style="margin: 4px 0; color: #6B7280;">📍 ${punto.lat.toFixed(6)}, ${punto.lng.toFixed(6)}</p>
        <p style="margin: 4px 0; color: #6B7280;">🚗 ${velocidad} km/h</p>
        <p style="margin: 4px 0; color: #6B7280;">📊 ${punto.estadoViaje}</p>
        <p style="margin: 4px 0; color: #9CA3AF;">⏰ ${timestamp}</p>
      </div>
    `)

    marcadores.push(marker)
  })

  console.log('✅ Marcadores agregados')
}

const agregarMarcadoresInicioFin = (puntos) => {
  if (puntos.length === 0) return

  // Marcador de inicio
  const primerPunto = puntos[0]
  const iconoInicio = L.divIcon({
    html: `
      <div style="position: relative; width: 32px; height: 32px;">
        <div style="width: 32px; height: 32px; background: #10B981; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div style="position: absolute; top: -24px; left: 50%; transform: translateX(-50%); background: #10B981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; white-space: nowrap;">
          Inicio
        </div>
      </div>
    `,
    className: 'marcador-inicio',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  })

  const marcadorInicio = L.marker([primerPunto.lat, primerPunto.lng], {
    icon: iconoInicio,
    zIndexOffset: 2000
  }).addTo(map)

  marcadorInicio.bindPopup(`
    <div style="min-width: 150px;">
      <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #10B981;">🚩 Inicio del Viaje</h3>
      <p style="margin: 4px 0; font-size: 12px; color: #6B7280;">
        ${new Date(primerPunto.timestamp).toLocaleString('es-BO')}
      </p>
      <p style="margin: 4px 0; font-size: 12px; color: #6B7280;">
        Estado: ${primerPunto.estadoViaje}
      </p>
    </div>
  `)

  marcadores.push(marcadorInicio)

  // Marcador de fin
  const ultimoPunto = puntos[puntos.length - 1]
  const iconoFin = L.divIcon({
    html: `
      <div style="position: relative; width: 32px; height: 32px;">
        <div style="width: 32px; height: 32px; background: #EF4444; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
        </div>
        <div style="position: absolute; top: -24px; left: 50%; transform: translateX(-50%); background: #EF4444; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; white-space: nowrap;">
          Último
        </div>
      </div>
    `,
    className: 'marcador-fin',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  })

  const marcadorFin = L.marker([ultimoPunto.lat, ultimoPunto.lng], {
    icon: iconoFin,
    zIndexOffset: 2000
  }).addTo(map)

  marcadorFin.bindPopup(`
    <div style="min-width: 150px;">
      <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #EF4444;">🏁 Última Ubicación</h3>
      <p style="margin: 4px 0; font-size: 12px; color: #6B7280;">
        ${new Date(ultimoPunto.timestamp).toLocaleString('es-BO')}
      </p>
      <p style="margin: 4px 0; font-size: 12px; color: #6B7280;">
        Estado: ${ultimoPunto.estadoViaje}
      </p>
      <p style="margin: 4px 0; font-size: 12px; color: #6B7280;">
        Velocidad: ${Math.round(ultimoPunto.velocidad || 0)} km/h
      </p>
    </div>
  `)

  marcadores.push(marcadorFin)

  console.log('✅ Marcadores de inicio/fin agregados')
}

const ajustarVista = () => {
  if (!map || props.puntos.length === 0) return

  const bounds = []

  // Agregar puntos del historial
  props.puntos.forEach(punto => {
    bounds.push([punto.lat, punto.lng])
  })

  // Agregar puntos de control si existen
  if (props.trackingActual?.puntosControl) {
    props.trackingActual.puntosControl.forEach(punto => {
      bounds.push([punto.lat, punto.lng])
    })
  }

  if (bounds.length > 0) {
    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 15
    })
  }
}

const limpiarElementos = () => {
  if (polyline) {
    map.removeLayer(polyline)
    polyline = null
  }
  
  marcadores.forEach(marcador => {
    try {
      map.removeLayer(marcador)
    } catch (e) {
      // Ignorar errores si el marcador ya fue removido
    }
  })
  marcadores = []
}

const limpiarMapa = () => {
  limpiarElementos()
  if (map) {
    map.remove()
    map = null
  }
}

const getColorEstado = (estado) => {
  const colores = {
    'En camino a la mina': '#3B82F6',
    'Esperando carguío': '#F59E0B',
    'En camino balanza cooperativa': '#10B981',
    'En camino balanza destino': '#8B5CF6',
    'En camino almacén destino': '#EC4899',
    'Descargando': '#14B8A6',
    'Completado': '#22C55E'
  }
  return colores[estado] || '#6B7280'
}

defineExpose({
  ajustarVista,
  actualizarMapa
})
</script>

<template>
  <div class="relative w-full h-full">
    <!-- Contenedor del mapa -->
    <div 
      ref="mapContainer" 
      class="absolute inset-0 w-full h-full bg-gray-200 rounded-lg"
      style="min-height: 500px;"
    ></div>

    <!-- Controles -->
    <div class="absolute top-4 right-4 z-1000 flex flex-col gap-2">
      <button
        @click="ajustarVista"
        class="bg-white rounded-lg shadow-lg p-2 hover:bg-gray-50 transition-colors"
        title="Ajustar vista"
      >
        <Target class="w-5 h-5 text-gray-700" />
      </button>

      <button
        @click="mostrarRuta = !mostrarRuta"
        class="bg-white rounded-lg shadow-lg p-2 transition-colors"
        :class="mostrarRuta ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'"
        title="Mostrar/Ocultar ruta"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
        </svg>
      </button>

      <button
        @click="mostrarMarcadores = !mostrarMarcadores"
        class="bg-white rounded-lg shadow-lg p-2 transition-colors"
        :class="mostrarMarcadores ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'"
        title="Mostrar/Ocultar puntos"
      >
        <MapPin class="w-5 h-5" />
      </button>
    </div>

    <!-- Info de puntos -->
    <div class="absolute bottom-4 left-4 z-1000 bg-white rounded-lg shadow-lg px-3 py-2">
      <span class="text-xs font-medium text-gray-700">
        {{ puntos.length.toLocaleString() }} ubicaciones
      </span>
    </div>

    <!-- Leyenda -->
    <div class="absolute bottom-4 right-4 z-1000 bg-white rounded-lg shadow-lg p-3" style="max-width: 200px;">
      <h4 class="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
        <Layers class="w-3 h-3" />
        Leyenda
      </h4>
      <div class="space-y-1.5 text-xs">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span class="text-gray-600">Online</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span class="text-gray-600">Offline</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-green-500 rounded-full"></div>
          <span class="text-gray-600">Inicio</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-red-500 rounded-full"></div>
          <span class="text-gray-600">Último</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.marcador-inicio,
.marcador-fin {
  background: transparent;
  border: none;
}
</style>