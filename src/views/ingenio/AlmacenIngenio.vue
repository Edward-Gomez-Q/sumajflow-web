<!-- src/views/ingenio/AlmacenView.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { useAlmacenIngenioStore } from '@/stores/ingenio/almacenStore'
import AppLayout from '@/components/layout/AppLayout.vue'
import { 
  Warehouse, 
  Edit2, 
  Package, 
  MapPin, 
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-vue-next'
import AlmacenMapViewer from '@/components/almacen/AlmacenMapViewer.vue'
import AlmacenEditModal from '@/components/almacen/AlmacenEditModal.vue'

const almacenStore = useAlmacenIngenioStore()

const showEditModal = ref(false)
const mapViewerRef = ref(null)

onMounted(async () => {
  await almacenStore.fetchAlmacen()
})

const openEditModal = () => {
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
}

const handleAlmacenSaved = async () => {
  await almacenStore.fetchAlmacen()
  closeEditModal()
}

const getEstadoColorClass = (estado) => {
  if (estado === 'critico') return 'bg-red-500'
  if (estado === 'lleno') return 'bg-orange-500'
  if (estado === 'medio') return 'bg-yellow-500'
  return 'bg-green-500'
}

const getEstadoIcon = (estado) => {
  if (estado === 'critico') return AlertTriangle
  if (estado === 'lleno') return AlertTriangle
  if (estado === 'medio') return Info
  return CheckCircle2
}
</script>

<template>
  <AppLayout>
    <div class="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      <!-- Header -->
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-neutral">Gestión de Almacén</h1>
            <p class="text-secondary mt-1 text-sm sm:text-base">
              Monitoreo y configuración de tu almacén principal
            </p>
          </div>
          <button 
            @click="openEditModal" 
            class="btn flex items-center gap-2 justify-center sm:w-auto"
            :disabled="!almacenStore.almacen"
          >
            <Edit2 class="w-5 h-5" />
            <span>Editar Almacén</span>
          </button>
        </div>

        <!-- KPIs -->
        <div v-if="almacenStore.almacen" class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <!-- Capacidad Total -->
          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500 center shrink-0">
                <Warehouse class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Capacidad</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ almacenStore.almacen.capacidadMaxima }} t
                </p>
              </div>
            </div>
          </div>

          <!-- Ocupación Actual -->
          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500 center shrink-0">
                <Activity class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Ocupación</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ almacenStore.almacen.ocupacionActual?.toFixed(2) }} t
                </p>
              </div>
            </div>
          </div>

          <!-- Estado de Capacidad -->
          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div 
                class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg center shrink-0"
                :class="getEstadoColorClass(almacenStore.almacen.estadoCapacidad)"
              >
                <component 
                  :is="getEstadoIcon(almacenStore.almacen.estadoCapacidad)" 
                  class="w-4 h-4 sm:w-5 sm:h-5 text-white" 
                />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Estado</h3>
                <p class="text-sm sm:text-base font-bold text-neutral line-clamp-1">
                  {{ almacenStore.estadoCapacidad?.label || '-' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Lotes Almacenados -->
          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-500 center shrink-0">
                <Package class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Lotes Activos</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ almacenStore.almacen.totalLotesAlmacenados }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenido Principal: Mapa + Panel -->
      <div class="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        <!-- Mapa -->
        <div class="flex-1 bg-surface border border-border rounded-xl overflow-hidden shadow-lg relative min-h-[300px] lg:min-h-0">
          <AlmacenMapViewer
            v-if="almacenStore.almacen && almacenStore.almacen.latitud"
            ref="mapViewerRef"
            :almacen="almacenStore.almacen"
          />

          <!-- Estado vacío -->
          <div v-else-if="!almacenStore.loading" class="absolute inset-0 flex items-center justify-center p-4">
            <div class="text-center max-w-md">
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 center mx-auto mb-4">
                <MapPin class="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
              <h3 class="text-lg sm:text-xl font-semibold text-neutral mb-2">Ubicación no configurada</h3>
              <p class="text-sm sm:text-base text-secondary mb-4">
                Configura la ubicación de tu almacén para verlo en el mapa
              </p>
              <button @click="openEditModal" class="btn-outline">
                Configurar ubicación
              </button>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="almacenStore.loading" class="absolute inset-0 bg-surface/80 backdrop-blur-sm flex items-center justify-center">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        </div>

        <!-- Panel Lateral - Detalles -->
        <div class="lg:w-96 bg-surface border border-border rounded-xl overflow-hidden shadow-lg flex flex-col max-h-[400px] lg:max-h-none">
          <!-- Header -->
          <div class="p-3 sm:p-4 border-b border-border bg-hover">
            <div class="flex items-center gap-2">
              <Warehouse class="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h3 class="font-semibold text-neutral text-sm sm:text-base">Detalles del Almacén</h3>
            </div>
          </div>

          <!-- Contenido -->
          <div v-if="almacenStore.almacen" class="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 scrollbar-custom">
            <!-- Información Básica -->
            <div class="space-y-3">
              <h4 class="text-sm font-semibold text-neutral">Información Básica</h4>
              
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-secondary">Nombre:</span>
                  <span class="font-medium text-neutral">{{ almacenStore.almacen.nombre }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-secondary">Área:</span>
                  <span class="font-medium text-neutral">{{ almacenStore.almacen.area }} m²</span>
                </div>
              </div>
            </div>

            <div class="divider"></div>

            <!-- Capacidad y Ocupación -->
            <div class="space-y-3">
              <h4 class="text-sm font-semibold text-neutral">Capacidad y Ocupación</h4>
              
              <div class="space-y-3">
                <div class="flex justify-between text-sm">
                  <span class="text-secondary">Capacidad Total:</span>
                  <span class="font-medium text-neutral">{{ almacenStore.almacen.capacidadMaxima }} t</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-secondary">Ocupación Actual:</span>
                  <span class="font-medium text-neutral">{{ almacenStore.almacen.ocupacionActual?.toFixed(2) }} t</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-secondary">Disponible:</span>
                  <span class="font-medium text-neutral">{{ almacenStore.almacen.capacidadDisponible?.toFixed(2) }} t</span>
                </div>
                
                <!-- Barra de progreso -->
                <div class="space-y-2">
                  <div class="flex justify-between text-xs">
                    <span class="text-secondary">Porcentaje de ocupación</span>
                    <span class="font-semibold text-neutral">{{ almacenStore.almacen.porcentajeOcupacion?.toFixed(1) }}%</span>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div 
                      class="h-full transition-all duration-500"
                      :class="getEstadoColorClass(almacenStore.almacen.estadoCapacidad)"
                      :style="{ width: `${Math.min(almacenStore.almacen.porcentajeOcupacion || 0, 100)}%` }"
                    ></div>
                  </div>
                </div>

                <div class="flex justify-between text-sm">
                  <span class="text-secondary">Estado:</span>
                  <span 
                    class="px-2 py-1 rounded text-xs font-medium text-white"
                    :class="getEstadoColorClass(almacenStore.almacen.estadoCapacidad)"
                  >
                    {{ almacenStore.estadoCapacidad?.label }}
                  </span>
                </div>

                <div class="flex justify-between text-sm">
                  <span class="text-secondary">Lotes Almacenados:</span>
                  <span class="font-medium text-neutral">{{ almacenStore.almacen.totalLotesAlmacenados }}</span>
                </div>
              </div>

              <!-- Alerta si está crítico -->
              <div 
                v-if="almacenStore.almacen.estadoCapacidad === 'critico' || almacenStore.almacen.estadoCapacidad === 'lleno'"
                class="p-3 rounded-lg"
                :class="{
                  'bg-orange-100 dark:bg-orange-900/30 border border-orange-400/60': almacenStore.almacen.estadoCapacidad === 'lleno',
                  'bg-red-100 dark:bg-red-900/30 border border-red-400/60': almacenStore.almacen.estadoCapacidad === 'critico'
                }"
              >
                <div class="flex items-start gap-2">
                  <AlertTriangle 
                    class="w-4 h-4 shrink-0 mt-0.5"
                    :class="{
                      'text-orange-700 dark:text-orange-300': almacenStore.almacen.estadoCapacidad === 'lleno',
                      'text-red-700 dark:text-red-300': almacenStore.almacen.estadoCapacidad === 'critico'
                    }"
                  />
                  <p class="text-xs">
                    <span class="font-semibold">{{ almacenStore.estadoCapacidad?.mensaje }}</span>
                    <br/>
                    <span class="text-xs">Considera gestionar los lotes almacenados</span>
                  </p>
                </div>
              </div>
            </div>

            <div class="divider"></div>

            <!-- Ubicación -->
            <div class="space-y-3">
              <h4 class="text-sm font-semibold text-neutral">Ubicación</h4>
              
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-secondary">Departamento:</span>
                  <span class="font-medium text-neutral">{{ almacenStore.almacen.departamento }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-secondary">Municipio:</span>
                  <span class="font-medium text-neutral">{{ almacenStore.almacen.municipio }}</span>
                </div>
                <div class="text-sm">
                  <span class="text-secondary">Dirección:</span>
                  <p class="font-medium text-neutral mt-1">{{ almacenStore.almacen.direccion }}</p>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-secondary">Coordenadas:</span>
                  <span class="font-mono text-xs text-neutral">
                    {{ almacenStore.almacen.latitud?.toFixed(6) }}, {{ almacenStore.almacen.longitud?.toFixed(6) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Estado vacío -->
          <div v-else-if="!almacenStore.loading" class="flex-1 flex items-center justify-center p-6">
            <div class="text-center">
              <div class="w-12 h-12 rounded-full bg-primary/10 center mx-auto mb-3">
                <Warehouse class="w-6 h-6 text-primary" />
              </div>
              <p class="text-sm text-secondary">No hay información disponible</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Edición -->
    <AlmacenEditModal
      v-if="showEditModal && almacenStore.almacen"
      :almacen="almacenStore.almacen"
      tipo-entidad="ingenio"
      @close="closeEditModal"
      @saved="handleAlmacenSaved"
    />
  </AppLayout>
</template>