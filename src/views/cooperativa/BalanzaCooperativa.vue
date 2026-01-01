<!-- src/views/cooperativa/BalanzaView.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useBalanzaCooperativaStore } from '@/stores/cooperativa/balanzaStore'
import { useSectoresStore } from '@/stores/cooperativa/sectoresStore'
import AppLayout from '@/components/layout/AppLayout.vue'
import { 
  Scale, 
  Edit2, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Award
} from 'lucide-vue-next'
import BalanzaMapViewer from '@/components/balance/BalanzaMapViewer.vue'
import BalanzaEditModal from '@/components/balance/BalanzaEditModal.vue'

const balanzaStore = useBalanzaCooperativaStore()
const sectoresStore = useSectoresStore()

const showEditModal = ref(false)
const mapViewerRef = ref(null)

onMounted(async () => {
  await Promise.all([
    balanzaStore.fetchBalanza(),
    sectoresStore.fetchSectores()
  ])
})

const openEditModal = () => {
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
}

const handleBalanzaSaved = async () => {
  await balanzaStore.fetchBalanza()
  closeEditModal()
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-BO', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  })
}

const getEstadoColorClass = (estado) => {
  if (estado === 'vencido') return 'bg-red-500'
  if (estado === 'proximo_vencimiento') return 'bg-yellow-500'
  return 'bg-green-500'
}

const sectoresParaMapa = computed(() => sectoresStore.sectoresActivos || [])
</script>

<template>
  <AppLayout>
    <div class="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      <!-- Header -->
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-neutral">Gestión de Balanza</h1>
            <p class="text-secondary mt-1 text-sm sm:text-base">
              Configuración y monitoreo de tu balanza principal
            </p>
          </div>
          <button 
            @click="openEditModal" 
            class="btn flex items-center gap-2 justify-center sm:w-auto"
            :disabled="!balanzaStore.balanza"
          >
            <Edit2 class="w-5 h-5" />
            <span>Editar Balanza</span>
          </button>
        </div>

        <!-- KPIs -->
        <div v-if="balanzaStore.balanza" class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <!-- Capacidad -->
          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500 center shrink-0">
                <Scale class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Capacidad</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ balanzaStore.balanza.capacidadMaxima }} kg
                </p>
              </div>
            </div>
          </div>

          <!-- Precisión -->
          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-500 center shrink-0">
                <Award class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Precisión</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  ±{{ balanzaStore.balanza.precisionMinima }} kg
                </p>
              </div>
            </div>
          </div>

          <!-- Estado Calibración -->
          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div 
                class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg center shrink-0"
                :class="getEstadoColorClass(balanzaStore.balanza.estadoCalibracion)"
              >
                <CheckCircle2 v-if="balanzaStore.balanza.estadoCalibracion === 'vigente'" class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <Clock v-else-if="balanzaStore.balanza.estadoCalibracion === 'proximo_vencimiento'" class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <AlertTriangle v-else class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Calibración</h3>
                <p class="text-sm sm:text-base font-bold text-neutral line-clamp-1">
                  {{ balanzaStore.estadoCalibracion?.label || '-' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Días para Calibración -->
          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500 center shrink-0">
                <Calendar class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Próxima Calibración</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ balanzaStore.balanza.diasParaCalibracion }} días
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
          <BalanzaMapViewer
            v-if="balanzaStore.balanza && balanzaStore.balanza.latitud"
            ref="mapViewerRef"
            :sectores="sectoresParaMapa"
            :balanza="balanzaStore.balanza"
          />

          <!-- Estado vacío -->
          <div v-else-if="!balanzaStore.loading" class="absolute inset-0 flex items-center justify-center p-4">
            <div class="text-center max-w-md">
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 center mx-auto mb-4">
                <MapPin class="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
              <h3 class="text-lg sm:text-xl font-semibold text-neutral mb-2">Ubicación no configurada</h3>
              <p class="text-sm sm:text-base text-secondary mb-4">
                Configura la ubicación de tu balanza para verla en el mapa
              </p>
              <button @click="openEditModal" class="btn-outline">
                Configurar ubicación
              </button>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="balanzaStore.loading" class="absolute inset-0 bg-surface/80 backdrop-blur-sm flex items-center justify-center">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        </div>

        <!-- Panel Lateral - Detalles -->
        <div class="lg:w-96 bg-surface border border-border rounded-xl overflow-hidden shadow-lg flex flex-col max-h-[400px] lg:max-h-none">
          <!-- Header -->
          <div class="p-3 sm:p-4 border-b border-border bg-hover">
            <div class="flex items-center gap-2">
              <Scale class="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h3 class="font-semibold text-neutral text-sm sm:text-base">Detalles de la Balanza</h3>
            </div>
          </div>

          <!-- Contenido -->
          <div v-if="balanzaStore.balanza" class="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 scrollbar-custom">
            <!-- Información Básica -->
            <div class="space-y-3">
              <h4 class="text-sm font-semibold text-neutral">Información Básica</h4>
              
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-secondary">Nombre:</span>
                  <span class="font-medium text-neutral">{{ balanzaStore.balanza.nombre }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-secondary">Marca:</span>
                  <span class="font-medium text-neutral">{{ balanzaStore.balanza.marca }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-secondary">Modelo:</span>
                  <span class="font-medium text-neutral">{{ balanzaStore.balanza.modelo }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-secondary">Serie:</span>
                  <span class="font-mono text-neutral">{{ balanzaStore.balanza.numeroSerie }}</span>
                </div>
              </div>
            </div>

            <div class="divider"></div>

            <!-- Especificaciones -->
            <div class="space-y-3">
              <h4 class="text-sm font-semibold text-neutral">Especificaciones</h4>
              
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-secondary">Capacidad Máxima:</span>
                  <span class="font-medium text-neutral">{{ balanzaStore.balanza.capacidadMaxima }} kg</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-secondary">Precisión:</span>
                  <span class="font-medium text-neutral">±{{ balanzaStore.balanza.precisionMinima }} kg</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-secondary">Divisiones:</span>
                  <span class="font-medium text-neutral">{{ balanzaStore.balanza.totalDivisiones?.toLocaleString() }}</span>
                </div>
              </div>
            </div>

            <div class="divider"></div>

            <!-- Calibración -->
            <div class="space-y-3">
              <h4 class="text-sm font-semibold text-neutral">Calibración</h4>
              
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-secondary">Última:</span>
                  <span class="font-medium text-neutral">{{ formatDate(balanzaStore.balanza.fechaUltimaCalibracion) }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-secondary">Próxima:</span>
                  <span class="font-medium text-neutral">{{ formatDate(balanzaStore.balanza.fechaProximaCalibracion) }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-secondary">Estado:</span>
                  <span 
                    class="px-2 py-1 rounded text-xs font-medium text-white"
                    :class="getEstadoColorClass(balanzaStore.balanza.estadoCalibracion)"
                  >
                    {{ balanzaStore.estadoCalibracion?.label }}
                  </span>
                </div>
              </div>

              <!-- Alerta si está por vencer o vencida -->
              <div 
                v-if="balanzaStore.balanza.estadoCalibracion !== 'vigente'"
                class="p-3 rounded-lg"
                :class="{
                  'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400/60': balanzaStore.balanza.estadoCalibracion === 'proximo_vencimiento',
                  'bg-red-100 dark:bg-red-900/30 border border-red-400/60': balanzaStore.balanza.estadoCalibracion === 'vencido'
                }"
              >
                <div class="flex items-start gap-2">
                  <AlertTriangle 
                    class="w-4 h-4 shrink-0 mt-0.5"
                    :class="{
                      'text-yellow-700 dark:text-yellow-300': balanzaStore.balanza.estadoCalibracion === 'proximo_vencimiento',
                      'text-red-700 dark:text-red-300': balanzaStore.balanza.estadoCalibracion === 'vencido'
                    }"
                  />
                  <p class="text-xs">
                    <span class="font-semibold">{{ balanzaStore.estadoCalibracion?.mensaje }}</span>
                    <br/>
                    <span class="text-xs">Programa tu calibración lo antes posible</span>
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
                  <span class="font-medium text-neutral">{{ balanzaStore.balanza.departamento }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-secondary">Municipio:</span>
                  <span class="font-medium text-neutral">{{ balanzaStore.balanza.municipio }}</span>
                </div>
                <div class="text-sm">
                  <span class="text-secondary">Dirección:</span>
                  <p class="font-medium text-neutral mt-1">{{ balanzaStore.balanza.direccion }}</p>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-secondary">Coordenadas:</span>
                  <span class="font-mono text-xs text-neutral">
                    {{ balanzaStore.balanza.latitud?.toFixed(6) }}, {{ balanzaStore.balanza.longitud?.toFixed(6) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Estado vacío -->
          <div v-else-if="!balanzaStore.loading" class="flex-1 flex items-center justify-center p-6">
            <div class="text-center">
              <div class="w-12 h-12 rounded-full bg-primary/10 center mx-auto mb-3">
                <Scale class="w-6 h-6 text-primary" />
              </div>
              <p class="text-sm text-secondary">No hay información disponible</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Edición -->
    <BalanzaEditModal
      v-if="showEditModal && balanzaStore.balanza"
      :balanza="balanzaStore.balanza"
      tipo-entidad="cooperativa"
      @close="closeEditModal"
      @saved="handleBalanzaSaved"
    />
  </AppLayout>
</template>