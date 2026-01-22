<!-- src/components/socio/LoteDetalleTabHistorial.vue -->
<script setup>
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Truck,
  MapPin,
  Scale,
  Package,
  User,
  Building2,
  PlayCircle,
  Navigation,
  FileCheck,
  AlertCircle,
  TrendingUp
} from 'lucide-vue-next'

const props = defineProps({
  lote: {
    type: Object,
    required: true
  }
})

// Configuración de iconos y estilos por tipo de acción
const getEventConfig = (accion) => {
  const configs = {
    // Aprobaciones
    'APROBAR_COOPERATIVA': {
      icon: CheckCircle2,
      iconBg: 'bg-success',
      borderColor: 'border-l-success'
    },
    'APROBAR_INGENIO': {
      icon: Building2,
      iconBg: 'bg-primary',
      borderColor: 'border-l-primary'
    },
    'APROBAR_COMERCIALIZADORA': {
      icon: Building2,
      iconBg: 'bg-primary',
      borderColor: 'border-l-primary'
    },
    
    // Rechazos
    'RECHAZAR_COOPERATIVA': {
      icon: XCircle,
      iconBg: 'bg-error',
      borderColor: 'border-l-error'
    },
    'RECHAZAR_INGENIO': {
      icon: XCircle,
      iconBg: 'bg-error',
      borderColor: 'border-l-error'
    },
    'RECHAZAR_COMERCIALIZADORA': {
      icon: XCircle,
      iconBg: 'bg-error',
      borderColor: 'border-l-error'
    },
    
    // Asignación de transportista
    'ASIGNAR_TRANSPORTISTA': {
      icon: User,
      iconBg: 'bg-accent',
      borderColor: 'border-l-accent'
    },
    
    // Eventos de transporte
    'INICIAR_VIAJE': {
      icon: PlayCircle,
      iconBg: 'bg-info',
      borderColor: 'border-l-info'
    },
    'LLEGADA_MINA': {
      icon: MapPin,
      iconBg: 'bg-warning',
      borderColor: 'border-l-warning'
    },
    'FIN_CARGUIO': {
      icon: Package,
      iconBg: 'bg-accent',
      borderColor: 'border-l-accent'
    },
    'PESAJE_COOPERATIVA': {
      icon: Scale,
      iconBg: 'bg-primary',
      borderColor: 'border-l-primary'
    },
    'PESAJE_DESTINO': {
      icon: Scale,
      iconBg: 'bg-primary',
      borderColor: 'border-l-primary'
    },
    'LLEGADA_ALMACEN': {
      icon: Navigation,
      iconBg: 'bg-info',
      borderColor: 'border-l-info'
    },
    'FIN_DESCARGA': {
      icon: FileCheck,
      iconBg: 'bg-success',
      borderColor: 'border-l-success'
    },
    'FIN_RUTA': {
      icon: CheckCircle2,
      iconBg: 'bg-success',
      borderColor: 'border-l-success'
    }
  }
  
  return configs[accion] || {
    icon: Clock,
    iconBg: 'bg-secondary',
    borderColor: 'border-l-secondary'
  }
}

// Formatear fecha
const formatDateLong = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-BO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDateShort = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Obtener badge de tipo de usuario
const getUserTypeBadge = (tipoUsuario) => {
  const badges = {
    'cooperativa': { text: 'Cooperativa', class: 'bg-success/10 text-success border border-success/20' },
    'ingenio': { text: 'Ingenio', class: 'bg-primary/10 text-primary border border-primary/20' },
    'comercializadora': { text: 'Comercializadora', class: 'bg-accent/10 text-accent border border-accent/20' },
    'transportista': { text: 'Transportista', class: 'bg-warning/10 text-warning border border-warning/20' }
  }
  return badges[tipoUsuario] || { text: tipoUsuario, class: 'bg-hover text-secondary border border-border' }
}

// Extraer peso de la descripción
const extractWeight = (descripcion) => {
  if (!descripcion) return null
  const match = descripcion.match(/(\d+\.?\d*)\s*kg/)
  return match ? match[1] : null
}

// Formatear título de acción
const getActionTitle = (accion) => {
  const titles = {
    'APROBAR_COOPERATIVA': 'Aprobación por Cooperativa',
    'APROBAR_INGENIO': 'Aprobación por Ingenio',
    'APROBAR_COMERCIALIZADORA': 'Aprobación por Comercializadora',
    'RECHAZAR_COOPERATIVA': 'Rechazo por Cooperativa',
    'RECHAZAR_INGENIO': 'Rechazo por Ingenio',
    'RECHAZAR_COMERCIALIZADORA': 'Rechazo por Comercializadora',
    'ASIGNAR_TRANSPORTISTA': 'Asignación de Transportista',
    'INICIAR_VIAJE': 'Inicio de Viaje',
    'LLEGADA_MINA': 'Llegada a Mina',
    'FIN_CARGUIO': 'Carguío Completado',
    'PESAJE_COOPERATIVA': 'Pesaje en Cooperativa',
    'PESAJE_DESTINO': 'Pesaje en Destino',
    'LLEGADA_ALMACEN': 'Llegada a Almacén',
    'FIN_DESCARGA': 'Descarga Completada',
    'FIN_RUTA': 'Ruta Completada'
  }
  return titles[accion] || accion
}

// Ordenar historial del más reciente al más antiguo
const getHistorialOrdenado = () => {
  if (!props.lote.historialCambios) return []
  return [...props.lote.historialCambios].sort((a, b) => 
    new Date(b.fechaRegistro) - new Date(a.fechaRegistro)
  )
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="lote.historialCambios && lote.historialCambios.length > 0">
      <!-- Header con estadísticas -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <!-- Total Eventos -->
        <div class="bg-surface rounded-lg p-4 border border-border">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-secondary mb-1">Total Eventos</p>
              <p class="text-2xl font-bold text-neutral">{{ lote.historialCambios.length }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-primary/10 center">
              <TrendingUp class="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
        
        <!-- Camiones Asignados -->
        <div class="bg-surface rounded-lg p-4 border border-border">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-secondary mb-1">Camiones</p>
              <p class="text-2xl font-bold text-neutral">{{ lote.camioneAsignados || 0 }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-accent/10 center">
              <Truck class="w-5 h-5 text-accent" />
            </div>
          </div>
        </div>
        
        <!-- En Ruta -->
        <div class="bg-surface rounded-lg p-4 border border-border">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-secondary mb-1">En Ruta</p>
              <p class="text-2xl font-bold text-neutral">
                {{ lote.asignaciones?.filter(a => 
                  !['Completado', 'Esperando iniciar'].includes(a.estado)
                ).length || 0 }}
              </p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-warning/10 center">
              <Navigation class="w-5 h-5 text-warning" />
            </div>
          </div>
        </div>
        
        <!-- Completados -->
        <div class="bg-surface rounded-lg p-4 border border-border">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-secondary mb-1">Completados</p>
              <p class="text-2xl font-bold text-neutral">
                {{ lote.asignaciones?.filter(a => a.estado === 'Completado').length || 0 }}
              </p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-success/10 center">
              <CheckCircle2 class="w-5 h-5 text-success" />
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="relative">
        <!-- Línea de tiempo -->
        <div class="absolute left-5 top-0 bottom-0 w-0.5 bg-border"></div>

        <!-- Items del timeline -->
        <div
          v-for="(cambio, index) in getHistorialOrdenado()"
          :key="cambio.id"
          class="relative pl-14 pb-6"
          :class="{ 'pb-0': index === getHistorialOrdenado().length - 1 }"
        >
          <!-- Icono del evento -->
          <div 
            class="absolute left-2.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-background"
            :class="getEventConfig(cambio.accion).iconBg"
          >
            <component 
              :is="getEventConfig(cambio.accion).icon" 
              class="w-3.5 h-3.5 text-white" 
            />
          </div>

          <!-- Card del evento -->
          <div 
            class="bg-surface rounded-lg border-l-4 border-t border-r border-b border-border hover:shadow-md transition-shadow"
            :class="getEventConfig(cambio.accion).borderColor"
          >
            <div class="p-4">
              <!-- Header -->
              <div class="flex items-start justify-between gap-4 mb-3">
                <div class="flex-1">
                  <h4 class="font-semibold text-neutral mb-2">
                    {{ getActionTitle(cambio.accion) }}
                  </h4>
                  <div class="flex items-center gap-2 flex-wrap">
                    <!-- Badge de tipo de usuario -->
                    <span 
                      class="text-xs px-2.5 py-1 rounded-md font-medium"
                      :class="getUserTypeBadge(cambio.tipoUsuario).class"
                    >
                      {{ getUserTypeBadge(cambio.tipoUsuario).text }}
                    </span>
                    
                    <!-- Badge de número de camión -->
                    <span 
                      v-if="cambio.metadata?.numero_camion"
                      class="text-xs px-2.5 py-1 rounded-md font-medium bg-hover text-secondary border border-border flex items-center gap-1"
                    >
                      <Truck class="w-3 h-3" />
                      Camión #{{ cambio.metadata.numero_camion }}
                    </span>
                  </div>
                </div>
                
                <div class="text-right shrink-0">
                  <div class="text-xs font-medium text-neutral">
                    {{ formatDateShort(cambio.fechaRegistro) }}
                  </div>
                </div>
              </div>
              
              <!-- Descripción -->
              <p 
                v-if="cambio.descripcion" 
                class="text-sm text-secondary mb-3"
              >
                {{ cambio.descripcion }}
              </p>
              
              <!-- Cambio de estados -->
              <div 
                v-if="cambio.estadoAnterior || cambio.estadoNuevo" 
                class="flex items-center gap-2 mb-3 flex-wrap"
              >
                <span 
                  v-if="cambio.estadoAnterior" 
                  class="px-3 py-1.5 rounded-md bg-hover text-secondary text-sm font-medium border border-border"
                >
                  {{ cambio.estadoAnterior }}
                </span>
                <span v-if="cambio.estadoAnterior && cambio.estadoNuevo" class="text-tertiary text-sm">
                  →
                </span>
                <span 
                  v-if="cambio.estadoNuevo" 
                  class="px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm font-semibold border border-primary/20"
                >
                  {{ cambio.estadoNuevo }}
                </span>
              </div>

              <!-- Metadata adicional -->
              <div v-if="cambio.metadata && Object.keys(cambio.metadata).length > 0" class="mt-3">
                <div class="bg-hover/50 rounded-lg p-3 space-y-2 border border-border">
                  <!-- Placa del vehículo -->
                  <div 
                    v-if="cambio.metadata.placa_vehiculo" 
                    class="flex items-center justify-between text-sm"
                  >
                    <span class="text-secondary flex items-center gap-2">
                      <Truck class="w-4 h-4" />
                      Placa:
                    </span>
                    <span class="font-semibold text-neutral">{{ cambio.metadata.placa_vehiculo }}</span>
                  </div>

                  <!-- Peso registrado -->
                  <div v-if="extractWeight(cambio.descripcion)" class="flex items-center justify-between text-sm">
                    <span class="text-secondary flex items-center gap-2">
                      <Scale class="w-4 h-4" />
                      Peso neto:
                    </span>
                    <span class="font-semibold text-neutral">
                      {{ extractWeight(cambio.descripcion) }} kg
                      <span class="text-xs text-tertiary ml-1">
                        ({{ (parseFloat(extractWeight(cambio.descripcion)) / 1000).toFixed(2) }} Ton)
                      </span>
                    </span>
                  </div>

                  <!-- Coordenadas de inicio -->
                  <div 
                    v-if="cambio.metadata.coordenadas_inicio" 
                    class="flex items-center justify-between text-sm"
                  >
                    <span class="text-secondary flex items-center gap-2">
                      <Navigation class="w-4 h-4" />
                      Coordenadas:
                    </span>
                    <span class="font-mono text-xs text-neutral">
                      {{ cambio.metadata.coordenadas_inicio.lat }}, 
                      {{ cambio.metadata.coordenadas_inicio.lng }}
                    </span>
                  </div>

                  <!-- Motivo de rechazo -->
                  <div 
                    v-if="cambio.metadata.motivo_rechazo" 
                    class="p-2.5 bg-error/10 border border-error/20 rounded-md"
                  >
                    <div class="flex items-start gap-2 text-sm">
                      <AlertCircle class="w-4 h-4 text-error mt-0.5 shrink-0" />
                      <div>
                        <span class="text-secondary font-medium">Motivo de rechazo:</span>
                        <p class="text-error font-medium mt-1">{{ cambio.metadata.motivo_rechazo }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Tipo de destino -->
                  <div 
                    v-if="cambio.metadata.tipo_destino" 
                    class="flex items-center justify-between text-sm"
                  >
                    <span class="text-secondary flex items-center gap-2">
                      <Building2 class="w-4 h-4" />
                      Tipo destino:
                    </span>
                    <span class="font-medium text-neutral capitalize">
                      {{ cambio.metadata.tipo_destino }}
                    </span>
                  </div>

                  <!-- Transportistas asignados -->
                  <div 
                    v-if="cambio.metadata.transportistas_asignados" 
                    class="flex items-center justify-between text-sm"
                  >
                    <span class="text-secondary flex items-center gap-2">
                      <User class="w-4 h-4" />
                      Transportistas:
                    </span>
                    <span class="font-semibold text-neutral">
                      {{ cambio.metadata.transportistas_asignados }}
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Observaciones -->
              <div 
                v-if="cambio.observaciones" 
                class="mt-3 p-3 bg-warning/10 border border-warning/20 rounded-lg"
              >
                <p class="text-xs text-secondary">
                  <span class="font-semibold text-warning">Nota:</span> 
                  {{ cambio.observaciones }}
                </p>
              </div>

              <!-- Fecha completa -->
              <div class="text-xs text-tertiary mt-3 pt-3 border-t border-border flex items-center gap-1">
                <Clock class="w-3 h-3" />
                {{ formatDateLong(cambio.fechaRegistro) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Estado vacío -->
    <div v-else class="text-center py-16">
      <div class="w-20 h-20 rounded-full bg-primary/10 center mx-auto mb-4 border border-primary/20">
        <Clock class="w-10 h-10 text-primary" />
      </div>
      <h3 class="text-xl font-semibold text-neutral mb-2">Sin historial registrado</h3>
      <p class="text-sm text-secondary max-w-md mx-auto">
        Aún no hay eventos registrados para este lote. El historial se actualizará 
        conforme avance el proceso de transporte.
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Transición suave para hover */
.bg-surface {
  transition: box-shadow 0.2s ease-in-out;
}
</style>