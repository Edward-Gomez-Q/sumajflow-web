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
let routeLines = [] // 🆕 Array para líneas segmentadas
let historialMarkers = [] // 🆕 Marcadores de cambios de estado
let puntosControlMarkers = [] // Marcadores de puntos de control
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

    // Crear mapa con Canvas para mejor rendimiento
    map = L.map(mapContainer.value, {
      center: [lat, lng],
      zoom: 13,
      zoomControl: true,
      preferCanvas: true // 🆕 Usar canvas para mejor rendimiento
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

    const circle = L.circle([punto.lat, punto.lng], {
      radius: punto.radio || 1000,
      color: color,
      fillColor: color,
      fillOpacity: 0.05,
      weight: 1,
      dashArray: '5, 5'
    }).addTo(map)

    puntosControlMarkers.push(marker)
    puntosControlMarkers.push(circle)
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

  // Simplificar si hay demasiados puntos
  const puntosProcesados = puntosOrdenados.length > 500
    ? simplificarUbicaciones(puntosOrdenados, 500)
    : puntosOrdenados

  console.log(`📊 Procesando ${puntosProcesados.length} puntos (simplificados de ${puntosOrdenados.length})`)

  // Dibujar ruta segmentada (por estado de conexión)
  if (mostrarRuta.value) {
    dibujarRutaSegmentada(puntosProcesados)
  }

  // Agregar marcadores de puntos intermedios
  if (mostrarMarcadores.value) {
    agregarMarcadoresPuntos(puntosProcesados)
  }

  // Marcar cambios de estado importantes
  marcarCambiosDeEstado(puntosOrdenados)

  // Ajustar vista
  ajustarVista()
}

// 🆕 Simplificar ubicaciones manteniendo puntos importantes
const simplificarUbicaciones = (ubicaciones, maxPuntos) => {
  if (ubicaciones.length <= maxPuntos) return ubicaciones

  const intervalo = Math.ceil(ubicaciones.length / maxPuntos)
  const simplificadas = []

  // Siempre incluir primer punto
  simplificadas.push(ubicaciones[0])

  // Incluir puntos intermedios cada 'intervalo'
  for (let i = intervalo; i < ubicaciones.length - 1; i += intervalo) {
    simplificadas.push(ubicaciones[i])
  }

  // Siempre incluir último punto
  simplificadas.push(ubicaciones[ubicaciones.length - 1])

  // Incluir todos los puntos donde hay cambio de estado offline/online
  ubicaciones.forEach((ubicacion, index) => {
    if (index > 0 && index < ubicaciones.length - 1) {
      if (ubicacion.esOffline !== ubicaciones[index - 1].esOffline) {
        if (!simplificadas.some(u => u.timestamp === ubicacion.timestamp)) {
          simplificadas.push(ubicacion)
        }
      }
    }
  })

  // Ordenar por timestamp
  simplificadas.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

  console.log(`🔄 Ubicaciones simplificadas: ${ubicaciones.length} → ${simplificadas.length}`)
  return simplificadas
}

// 🆕 Dibujar ruta dividida en segmentos por estado de conexión
const dibujarRutaSegmentada = (puntos) => {
  if (puntos.length < 2) return

  let segmentoActual = []
  let esOfflineActual = puntos[0].esOffline

  puntos.forEach((punto, index) => {
    // Si cambia el estado de conexión, dibuja el segmento anterior
    if (punto.esOffline !== esOfflineActual && segmentoActual.length > 0) {
      // Dibujar segmento
      crearSegmentoLinea(segmentoActual, esOfflineActual)
      
      // Iniciar nuevo segmento con el último punto del anterior (para continuidad)
      segmentoActual = [segmentoActual[segmentoActual.length - 1]]
      esOfflineActual = punto.esOffline
    }
    
    segmentoActual.push([punto.lat, punto.lng])

    // Si es el último punto, dibujar el segmento final
    if (index === puntos.length - 1 && segmentoActual.length > 1) {
      crearSegmentoLinea(segmentoActual, esOfflineActual)
    }
  })

  console.log(`✅ Dibujadas ${routeLines.length} líneas segmentadas`)
}

// 🆕 Crear un segmento de línea con estilo según estado - ACTUALIZADO
const crearSegmentoLinea = (puntos, esOffline) => {
  if (puntos.length < 2) return

  const linea = L.polyline(puntos, {
    color: esOffline ? '#FF0000 ' : '#005FF9',
    weight: esOffline ? 6 : 6, 
    opacity: esOffline ? 0.8 : 0.8, 
    dashArray: null, 
    smoothFactor: 1.5,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(map)

  routeLines.push(linea)
}

// 🆕 Marcar solo cambios importantes de estado
const marcarCambiosDeEstado = (ubicaciones) => {
  let inicioOffline = null
  let contadorDesconexiones = 0

  ubicaciones.forEach((ubicacion, index) => {
    // Detectar inicio de período offline
    if (ubicacion.esOffline && (index === 0 || !ubicaciones[index - 1].esOffline)) {
      inicioOffline = index
    }
    
    // Detectar fin de período offline
    if (inicioOffline !== null && !ubicacion.esOffline && index > 0 && ubicaciones[index - 1].esOffline) {
      contadorDesconexiones++
      
      const ubicacionInicio = ubicaciones[inicioOffline]
      const ubicacionFin = ubicacion
      
      const duracionMs = new Date(ubicacionFin.timestamp) - new Date(ubicacionInicio.timestamp)
      const duracionMin = Math.round(duracionMs / 60000)

      // Calcular distancia aproximada
      const distanciaKm = calcularDistanciaTotal(ubicaciones.slice(inicioOffline, index + 1))

      // Marcador de inicio de desconexión (rojo)
      const markerInicio = L.circleMarker(
        [ubicacionInicio.lat, ubicacionInicio.lng],
        {
          radius: 7,
          fillColor: '#EF4444',
          color: '#fff',
          weight: 2,
          fillOpacity: 0.9,
          zIndexOffset: 500
        }
      ).bindPopup(`
        <div style="min-width: 170px;">
          <p style="margin: 0 0 6px 0; font-weight: 600; color: #EF4444; font-size: 13px;">
            ⚠️ Pérdida de Conexión #${contadorDesconexiones}
          </p>
          <div style="font-size: 11px; color: #6B7280; line-height: 1.6;">
            <p style="margin: 2px 0;"><strong>Estado:</strong> ${ubicacionInicio.estadoViaje || 'N/A'}</p>
            <p style="margin: 2px 0;"><strong>Inicio:</strong> ${new Date(ubicacionInicio.timestamp).toLocaleTimeString('es-BO')}</p>
            <p style="margin: 2px 0;"><strong>Duración:</strong> ${duracionMin} min</p>
            <p style="margin: 2px 0;"><strong>Distancia:</strong> ${distanciaKm.toFixed(2)} km</p>
            <p style="margin: 2px 0;"><strong>Velocidad:</strong> ${Math.round(ubicacionInicio.velocidad || 0)} km/h</p>
          </div>
        </div>
      `).addTo(map)

      historialMarkers.push(markerInicio)

      // Marcador de recuperación de conexión (verde)
      const markerFin = L.circleMarker(
        [ubicacionFin.lat, ubicacionFin.lng],
        {
          radius: 7,
          fillColor: '#10B981',
          color: '#fff',
          weight: 2,
          fillOpacity: 0.9,
          zIndexOffset: 500
        }
      ).bindPopup(`
        <div style="min-width: 170px;">
          <p style="margin: 0 0 6px 0; font-weight: 600; color: #10B981; font-size: 13px;">
            ✓ Conexión Recuperada #${contadorDesconexiones}
          </p>
          <div style="font-size: 11px; color: #6B7280; line-height: 1.6;">
            <p style="margin: 2px 0;"><strong>Estado:</strong> ${ubicacionFin.estadoViaje || 'N/A'}</p>
            <p style="margin: 2px 0;"><strong>Hora:</strong> ${new Date(ubicacionFin.timestamp).toLocaleTimeString('es-BO')}</p>
            <p style="margin: 2px 0;"><strong>Tiempo offline:</strong> ${duracionMin} min</p>
            <p style="margin: 2px 0;"><strong>Velocidad:</strong> ${Math.round(ubicacionFin.velocidad || 0)} km/h</p>
          </div>
        </div>
      `).addTo(map)

      historialMarkers.push(markerFin)

      inicioOffline = null
    }
  })

  // Marcar inicio y fin del viaje
  if (ubicaciones.length > 0) {
    // Marcador de inicio del viaje
    const inicio = ubicaciones[0]
    const iconoInicio = L.divIcon({
      html: `
        <div style="position: relative; width: 36px; height: 36px;">
          <div style="width: 36px; height: 36px; background: #8B5CF6; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 10px rgba(0,0,0,0.3);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div style="position: absolute; top: -26px; left: 50%; transform: translateX(-50%); background: #8B5CF6; color: white; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
            INICIO
          </div>
        </div>
      `,
      className: 'marcador-inicio',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    })

    const marcadorInicio = L.marker([inicio.lat, inicio.lng], {
      icon: iconoInicio,
      zIndexOffset: 2000
    }).addTo(map)

    marcadorInicio.bindPopup(`
      <div style="min-width: 170px;">
        <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #8B5CF6; font-size: 14px;">🏁 Inicio del Viaje</h3>
        <div style="font-size: 11px; color: #6B7280; line-height: 1.6;">
          <p style="margin: 4px 0;"><strong>Fecha/Hora:</strong><br>${new Date(inicio.timestamp).toLocaleString('es-BO')}</p>
          <p style="margin: 4px 0;"><strong>Estado:</strong> ${inicio.estadoViaje || 'N/A'}</p>
          <p style="margin: 4px 0;"><strong>Velocidad:</strong> ${Math.round(inicio.velocidad || 0)} km/h</p>
          <p style="margin: 4px 0;"><strong>Coordenadas:</strong><br>${inicio.lat.toFixed(6)}, ${inicio.lng.toFixed(6)}</p>
        </div>
      </div>
    `)

    historialMarkers.push(marcadorInicio)

    // Marcador de fin del viaje
    const fin = ubicaciones[ubicaciones.length - 1]
    const iconoFin = L.divIcon({
      html: `
        <div style="position: relative; width: 36px; height: 36px;">
          <div style="width: 36px; height: 36px; background: #F97316; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 10px rgba(0,0,0,0.3);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <div style="position: absolute; top: -26px; left: 50%; transform: translateX(-50%); background: #F97316; color: white; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
            ÚLTIMO
          </div>
        </div>
      `,
      className: 'marcador-fin',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    })

    const marcadorFin = L.marker([fin.lat, fin.lng], {
      icon: iconoFin,
      zIndexOffset: 2000
    }).addTo(map)

    marcadorFin.bindPopup(`
      <div style="min-width: 170px;">
        <h3 style="margin: 0 0 8px 0; font-weight: 600; color: #F97316; font-size: 14px;">🏁 Última Ubicación</h3>
        <div style="font-size: 11px; color: #6B7280; line-height: 1.6;">
          <p style="margin: 4px 0;"><strong>Fecha/Hora:</strong><br>${new Date(fin.timestamp).toLocaleString('es-BO')}</p>
          <p style="margin: 4px 0;"><strong>Estado:</strong> ${fin.estadoViaje || 'N/A'}</p>
          <p style="margin: 4px 0;"><strong>Velocidad:</strong> ${Math.round(fin.velocidad || 0)} km/h</p>
          <p style="margin: 4px 0;"><strong>Coordenadas:</strong><br>${fin.lat.toFixed(6)}, ${fin.lng.toFixed(6)}</p>
        </div>
      </div>
    `)

    historialMarkers.push(marcadorFin)
  }

  console.log(`✅ Marcados ${contadorDesconexiones} cambios de estado + inicio/fin`)
}

// 🆕 Calcular distancia total de un segmento
const calcularDistanciaTotal = (ubicaciones) => {
  let distanciaTotal = 0

  for (let i = 1; i < ubicaciones.length; i++) {
    const lat1 = ubicaciones[i - 1].lat
    const lng1 = ubicaciones[i - 1].lng
    const lat2 = ubicaciones[i].lat
    const lng2 = ubicaciones[i].lng

    distanciaTotal += calcularDistancia(lat1, lng1, lat2, lng2)
  }

  return distanciaTotal
}

// 🆕 Calcular distancia entre dos puntos (fórmula de Haversine)
const calcularDistancia = (lat1, lng1, lat2, lng2) => {
  const R = 6371 // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
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
      <div style="min-width: 160px; font-size: 12px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
          <div style="width: 10px; height: 10px; background: ${color}; border-radius: 50%;"></div>
          <strong style="color: ${color};">${punto.esOffline ? 'Offline' : 'Online'}</strong>
        </div>
        <div style="font-size: 11px; color: #6B7280; line-height: 1.6;">
          <p style="margin: 3px 0;">📍 ${punto.lat.toFixed(6)}, ${punto.lng.toFixed(6)}</p>
          <p style="margin: 3px 0;">🚗 ${velocidad} km/h</p>
          <p style="margin: 3px 0;">📊 ${punto.estadoViaje || 'N/A'}</p>
          <p style="margin: 3px 0; color: #9CA3AF;">⏰ ${timestamp}</p>
        </div>
      </div>
    `)

    historialMarkers.push(marker)
  })

  console.log('✅ Marcadores intermedios agregados')
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
      padding: [60, 60],
      maxZoom: 15
    })
  }
}

const limpiarElementos = () => {
  // Limpiar líneas segmentadas
  if (routeLines.length > 0) {
    routeLines.forEach(line => {
      try {
        if (map && map.hasLayer(line)) {
          map.removeLayer(line)
        }
      } catch (e) {
        console.warn('Error removiendo línea:', e)
      }
    })
    routeLines = []
  }

  // Limpiar marcadores de historial
  if (historialMarkers.length > 0) {
    historialMarkers.forEach(marker => {
      try {
        if (map && map.hasLayer(marker)) {
          map.removeLayer(marker)
        }
      } catch (e) {
        console.warn('Error removiendo marcador:', e)
      }
    })
    historialMarkers = []
  }
}

const limpiarMapa = () => {
  limpiarElementos()
  
  // Limpiar puntos de control
  if (puntosControlMarkers.length > 0) {
    puntosControlMarkers.forEach(marker => {
      try {
        if (map && map.hasLayer(marker)) {
          map.removeLayer(marker)
        }
      } catch (e) {
        console.warn('Error removiendo punto de control:', e)
      }
    })
    puntosControlMarkers = []
  }

  if (map) {
    map.remove()
    map = null
  }
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
        title="Mostrar/Ocultar puntos intermedios"
      >
        <MapPin class="w-5 h-5" />
      </button>
    </div>

    <!-- Info de puntos -->
    <div class="absolute bottom-4 left-4 z-1000 bg-white rounded-lg shadow-lg px-3 py-2">
      <span class="text-xs font-medium text-gray-700">
        📊 {{ puntos.length.toLocaleString() }} ubicaciones registradas
      </span>
    </div>

    <!-- Leyenda actualizada - 🔥 CAMBIADA -->
    <div class="absolute bottom-4 right-4 z-1000 bg-white rounded-lg shadow-lg p-3" style="max-width: 220px;">
      <h4 class="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
        <Layers class="w-3 h-3" />
        Leyenda
      </h4>
      <div class="space-y-1.5 text-xs">
        <div class="flex items-center gap-2">
          <div class="w-8 h-0.5 bg-blue-500"></div>
          <span class="text-gray-600">Ruta online</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-8 h-0.5 bg-orange-500"></div>
          <span class="text-gray-600">Ruta offline</span>
        </div>
        <div class="flex items-center gap-2 pt-1 border-t border-gray-200">
          <div class="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span class="text-gray-600">Inicio viaje</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span class="text-gray-600">Último punto</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-red-500 rounded-full"></div>
          <span class="text-gray-600">Pérdida conexión</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-green-500 rounded-full"></div>
          <span class="text-gray-600">Recuperación</span>
        </div>
        <div class="flex items-center gap-2 pt-1 border-t border-gray-200">
          <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span class="text-gray-600">Punto intermedio</span>
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