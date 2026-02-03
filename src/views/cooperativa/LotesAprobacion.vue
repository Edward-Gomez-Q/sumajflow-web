<!-- src/views/cooperativa/LotesAprobacion.vue -->
<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useLotesCooperativaStore } from '@/stores/cooperativa/lotesCooperativaStore'
import AppLayout from '@/components/layout/AppLayout.vue'
import { 
  PackageCheck, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp,
  Factory,
  Building2,
  Truck,
  MapPin,
  Calendar
} from 'lucide-vue-next'
import LoteDetalleCooperativaModal from '@/components/cooperativa/LoteDetalleCooperativaModal.vue'
import LoteAprobacionModal from '@/components/cooperativa/LoteAprobacionModal.vue'
import LoteRechazoModal from '@/components/cooperativa/LoteRechazoModal.vue'
import LotesFiltrosCooperativa from '@/components/cooperativa/LotesFiltrosCooperativa.vue'
import { useLotesWS } from '@/composables/useLotesWS'
import { useUIStore } from '@/stores/uiStore'

const lotesWS = useLotesWS()
const uiStore = useUIStore()
const lotesStore = useLotesCooperativaStore()

const showDetalleModal = ref(false)
const showAprobacionModal = ref(false)
const showRechazoModal = ref(false)
const loteSeleccionado = ref(null)

// Filtros
const filtros = ref({
  tipoOperacion: '',
  tipoMineral: '',
  busqueda: ''
})

onMounted(async () => {
  await lotesStore.fetchLotesPendientes()
    lotesWS.suscribirCola((evento) => {
    lotesStore.fetchLotesPendientes()
    
    if (evento.evento === 'lote_creado') {
      uiStore.showToast(
        `Nuevo lote #${evento.loteId} pendiente de aprobación`,
        'info'
      )
    } else if (evento.evento === 'lote_aprobado_destino' || evento.evento === 'lote_rechazado_destino') {
      uiStore.showToast(
        `Lote #${evento.loteId} ha sido procesado por el destino`,
        'success'
      )
    }
    
  })
})
onUnmounted(() => {
  lotesWS.limpiarSuscripciones()
})

// Lotes filtrados
const lotesFiltrados = computed(() => {
  let lotes = lotesStore.lotesPendientes

  if (filtros.value.tipoOperacion) {
    lotes = lotes.filter(l => l.tipoOperacion === filtros.value.tipoOperacion)
  }

  if (filtros.value.tipoMineral) {
    lotes = lotes.filter(l => l.tipoMineral === filtros.value.tipoMineral)
  }

  if (filtros.value.busqueda) {
    const busqueda = filtros.value.busqueda.toLowerCase()
    lotes = lotes.filter(l => 
      l.minaNombre.toLowerCase().includes(busqueda) ||
      l.socioNombre.toLowerCase().includes(busqueda) ||
      l.destinoNombre.toLowerCase().includes(busqueda) ||
      l.socioCi.toLowerCase().includes(busqueda)
    )
  }

  return lotes
})

const lotesHoy = computed(() => {
  return lotesFiltrados.value.filter(l => {
    const today = new Date().toDateString()
    const loteDate = new Date(l.fechaCreacion).toDateString()
    return today === loteDate
  }).length
})

const openDetalleModal = (lote) => {
  loteSeleccionado.value = lote
  showDetalleModal.value = true
}

const closeDetalleModal = () => {
  showDetalleModal.value = false
  loteSeleccionado.value = null
  lotesStore.limpiarDetalle()
}

const openAprobacionModal = (lote) => {
  loteSeleccionado.value = lote
  showAprobacionModal.value = true
}

const closeAprobacionModal = () => {
  showAprobacionModal.value = false
  loteSeleccionado.value = null
}

const openRechazoModal = (lote) => {
  loteSeleccionado.value = lote
  showRechazoModal.value = true
}

const closeRechazoModal = () => {
  showRechazoModal.value = false
  loteSeleccionado.value = null
}

const handleAprobacionExitosa = () => {
  closeAprobacionModal()
}

const handleRechazoExitoso = () => {
  closeRechazoModal()
}

const aplicarFiltros = (nuevosFiltros) => {
  filtros.value = { ...nuevosFiltros }
}

const limpiarFiltros = () => {
  filtros.value = {
    tipoOperacion: '',
    tipoMineral: '',
    busqueda: ''
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-BO', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTipoOperacionLabel = (tipo) => {
  return tipo === 'procesamiento_planta' ? 'Procesamiento' : 'Venta Directa'
}

const getTipoOperacionIcon = (tipo) => {
  return tipo === 'procesamiento_planta' ? Factory : Building2
}
</script>

<template>
  <AppLayout>
    <div class="space-y-4 pb-6">
      <!-- Header -->
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-neutral">Aprobación de Lotes</h1>
            <p class="text-secondary mt-1 text-sm sm:text-base">
              Revisa y aprueba las solicitudes de transporte de mineral
            </p>
          </div>
          <LotesFiltrosCooperativa
            :filtros-actuales="filtros"
            @aplicar="aplicarFiltros"
            @limpiar="limpiarFiltros"
          />
        </div>

        <!-- Estadísticas -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-yellow-500 center shrink-0">
                <Clock class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Pendientes</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ lotesStore.totalPendientes }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500 center shrink-0">
                <Factory class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Procesamiento</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ lotesStore.lotesPorTipoOperacion.procesamiento }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500 center shrink-0">
                <Building2 class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Venta Directa</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ lotesStore.lotesPorTipoOperacion.ventaDirecta }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500 center shrink-0">
                <TrendingUp class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Hoy</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ lotesHoy }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Lista de Lotes - Grid de 2 columnas -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Lote Card -->
        <div
          v-for="lote in lotesFiltrados"
          :key="lote.id"
          class="bg-base rounded-xl p-4 border border-border shadow-sm hover:shadow-lg transition-all"
        >
          <div class="space-y-3">
            <!-- Header del Lote -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-yellow-500 center shrink-0">
                  <PackageCheck class="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap mb-2">
                    <h3 class="font-semibold text-neutral text-base sm:text-lg">
                      Lote #{{ lote.id }}
                    </h3>
                    <span class="text-xs px-2 py-1 rounded-lg font-medium bg-indigo-500 text-white">
                      {{ lote.tipoMineral }}
                    </span>
                    <component 
                      :is="getTipoOperacionIcon(lote.tipoOperacion)"
                      class="w-4 h-4 text-primary"
                      :title="getTipoOperacionLabel(lote.tipoOperacion)"
                    />
                  </div>
                  <div class="flex items-center gap-2 text-xs sm:text-sm text-secondary">
                    <MapPin class="w-3 h-3 sm:w-4 sm:h-4" />
                    <span class="truncate">{{ lote.minaNombre }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Info del Socio -->
            <div class="bg-hover rounded-lg p-3 border border-border">
              <h4 class="text-xs text-secondary mb-1">Solicitante</h4>
              <p class="font-medium text-neutral text-sm">{{ lote.socioNombre }}</p>
              <p class="text-xs text-tertiary">CI: {{ lote.socioCi }}</p>
            </div>

            <!-- Info Grid -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-secondary">Destino</p>
                <p class="text-sm font-medium text-neutral mt-0.5">{{ lote.destinoTipo }}</p>
                <p class="text-xs text-tertiary truncate" :title="lote.destinoNombre">
                  {{ lote.destinoNombre }}
                </p>
              </div>
              <div>
                <p class="text-xs text-secondary">Camiones</p>
                <p class="text-sm font-medium text-neutral mt-0.5 flex items-center gap-1">
                  <Truck class="w-3 h-3" />
                  {{ lote.camionlesSolicitados }}
                </p>
              </div>
              <div>
                <p class="text-xs text-secondary">Peso Est.</p>
                <p class="text-sm font-medium text-neutral mt-0.5">
                  {{ lote.pesoTotalEstimado || '-' }}
                  <span v-if="lote.pesoTotalEstimado" class="text-xs">Ton</span>
                </p>
              </div>
              <div>
                <p class="text-xs text-secondary">Creado</p>
                <p class="text-sm font-medium text-neutral mt-0.5 flex items-center gap-1">
                  <Calendar class="w-3 h-3" />
                  {{ formatDate(lote.fechaCreacion) }}
                </p>
              </div>
            </div>

            <!-- Minerales -->
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs text-secondary">Minerales:</span>
              <div class="flex gap-1 flex-wrap">
                <span
                  v-for="(mineral, index) in lote.minerales"
                  :key="index"
                  class="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary font-medium"
                >
                  {{ mineral }}
                </span>
              </div>
            </div>

            <!-- Observaciones -->
            <div v-if="lote.observaciones" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <p class="text-xs text-secondary mb-1">Observaciones del socio:</p>
              <p class="text-sm text-neutral">{{ lote.observaciones }}</p>
            </div>

            <!-- Acciones -->
            <div class="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border">
              <button
                @click="openDetalleModal(lote)"
                class="btn-outline text-xs sm:text-sm px-3 py-2 flex items-center justify-center gap-2"
              >
                <Eye class="w-4 h-4" />
                <span>Ver Detalle</span>
              </button>
              <button
                @click="openAprobacionModal(lote)"
                class="btn text-xs sm:text-sm px-3 py-2 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 class="w-4 h-4" />
                <span>Aprobar</span>
              </button>
              <button
                @click="openRechazoModal(lote)"
                class="btn-secondary text-xs sm:text-sm px-3 py-2 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white"
              >
                <XCircle class="w-4 h-4" />
                <span>Rechazar</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Estado vacío -->
        <div v-if="lotesFiltrados.length === 0 && !lotesStore.loading" class="col-span-full text-center py-12">
          <div class="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 center mx-auto mb-4">
            <CheckCircle2 class="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 class="text-lg font-semibold text-neutral mb-2">
            {{ lotesStore.lotesPendientes.length === 0 ? '¡Todo al día!' : 'No se encontraron lotes' }}
          </h3>
          <p class="text-sm text-secondary">
            {{ lotesStore.lotesPendientes.length === 0 
              ? 'No hay lotes pendientes de aprobación' 
              : 'Intenta ajustar los filtros' }}
          </p>
        </div>

        <!-- Loading -->
        <div v-if="lotesStore.loading" class="col-span-full text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <p class="text-secondary mt-4">Cargando lotes pendientes...</p>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <LoteDetalleCooperativaModal
      v-if="showDetalleModal && loteSeleccionado"
      :lote-id="loteSeleccionado.id"
      @close="closeDetalleModal"
      @aprobar="openAprobacionModal(loteSeleccionado)"
      @rechazar="openRechazoModal(loteSeleccionado)"
    />

    <LoteAprobacionModal
      v-if="showAprobacionModal && loteSeleccionado"
      :lote="loteSeleccionado"
      @close="closeAprobacionModal"
      @success="handleAprobacionExitosa"
    />

    <LoteRechazoModal
      v-if="showRechazoModal && loteSeleccionado"
      :lote="loteSeleccionado"
      @close="closeRechazoModal"
      @success="handleRechazoExitoso"
    />
  </AppLayout>
</template>