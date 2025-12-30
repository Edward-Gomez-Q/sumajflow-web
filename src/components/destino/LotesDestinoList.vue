<!-- src/components/destino/LotesDestinoList.vue -->
<script setup>
import { ref, computed } from 'vue'
import { useLotesDestinoStore } from '@/stores/destino/lotesDestinoStore'
import { 
  PackageCheck, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp,
  Truck,
  MapPin,
  Calendar,
  Building2,
  Filter
} from 'lucide-vue-next'
import LoteDetalleDestinoModal from './LoteDetalleDestinoModal.vue'
import LoteAprobacionDestinoModal from './LoteAprobacionDestinoModal.vue'
import LoteRechazoDestinoModal from './LoteRechazoDestinoModal.vue'

const props = defineProps({
  tipoDestino: {
    type: String,
    required: true,
    validator: (value) => ['ingenio', 'comercializadora'].includes(value)
  },
  titulo: {
    type: String,
    required: true
  },
  descripcion: {
    type: String,
    required: true
  }
})

const lotesStore = useLotesDestinoStore()

const showDetalleModal = ref(false)
const showAprobacionModal = ref(false)
const showRechazoModal = ref(false)
const loteSeleccionado = ref(null)

// Filtros
const filtroTipoMineral = ref('')
const filtroBusqueda = ref('')

// Lotes filtrados
const lotesFiltrados = computed(() => {
  let lotes = lotesStore.lotesPendientes

  if (filtroTipoMineral.value) {
    lotes = lotes.filter(l => l.tipoMineral === filtroTipoMineral.value)
  }

  if (filtroBusqueda.value) {
    const busqueda = filtroBusqueda.value.toLowerCase()
    lotes = lotes.filter(l => 
      l.minaNombre.toLowerCase().includes(busqueda) ||
      l.socioNombre.toLowerCase().includes(busqueda) ||
      l.cooperativaNombre.toLowerCase().includes(busqueda) ||
      l.socioCi.toLowerCase().includes(busqueda)
    )
  }

  return lotes
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

const limpiarFiltros = () => {
  filtroTipoMineral.value = ''
  filtroBusqueda.value = ''
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
</script>

<template>
  <div class="h-[calc(100vh-6rem)] flex flex-col space-y-4">
    <!-- Header -->
    <div class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-neutral">{{ titulo }}</h1>
          <p class="text-secondary mt-1 text-sm sm:text-base">{{ descripcion }}</p>
        </div>
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
              <PackageCheck class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h3 class="text-xs sm:text-sm font-medium text-secondary">Complejo</h3>
              <p class="text-xl sm:text-2xl font-bold text-neutral">
                {{ lotesStore.lotesPorTipoMineral.complejo }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
          <div class="flex items-center gap-2 sm:gap-3">
            <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500 center shrink-0">
              <PackageCheck class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h3 class="text-xs sm:text-sm font-medium text-secondary">Concentrado</h3>
              <p class="text-xl sm:text-2xl font-bold text-neutral">
                {{ lotesStore.lotesPorTipoMineral.concentrado }}
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
                {{ lotesStore.lotesHoy }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <Filter class="w-5 h-5 text-primary" />
          <h3 class="font-semibold text-neutral">Filtros</h3>
        </div>
        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-secondary mb-1 block">Tipo de Mineral</label>
            <select v-model="filtroTipoMineral" class="w-full text-sm">
              <option value="">Todos</option>
              <option value="complejo">Complejo</option>
              <option value="concentrado">Concentrado</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-secondary mb-1 block">Buscar</label>
            <input 
              v-model="filtroBusqueda"
              type="text" 
              placeholder="Mina, socio, cooperativa..."
              class="w-full text-sm"
            />
          </div>
        </div>
        <div class="flex justify-end mt-3">
          <button @click="limpiarFiltros" class="btn-secondary text-xs px-3 py-1.5">
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>

    <!-- Lista de Lotes -->
    <div class="flex-1 overflow-y-auto scrollbar-custom">
      <div class="grid gap-4 pb-4">
        <!-- Lote Card -->
        <div
          v-for="lote in lotesFiltrados"
          :key="lote.id"
          class="bg-base rounded-xl p-4 border border-border shadow-sm hover:shadow-lg transition-all"
        >
          <div class="space-y-4">
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
                  </div>
                  <div class="flex items-center gap-2 text-xs sm:text-sm text-secondary">
                    <MapPin class="w-3 h-3 sm:w-4 sm:h-4" />
                    <span class="truncate">{{ lote.minaNombre }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Info del Solicitante -->
            <div class="grid sm:grid-cols-2 gap-3">
              <div class="bg-hover rounded-lg p-3 border border-border">
                <h4 class="text-xs text-secondary mb-1">Socio</h4>
                <p class="font-medium text-neutral text-sm">{{ lote.socioNombre }}</p>
                <p class="text-xs text-tertiary">CI: {{ lote.socioCi }}</p>
                <p v-if="lote.socioTelefono" class="text-xs text-tertiary">Tel: {{ lote.socioTelefono }}</p>
              </div>
              <div class="bg-hover rounded-lg p-3 border border-border">
                <h4 class="text-xs text-secondary mb-1">Cooperativa</h4>
                <p class="font-medium text-neutral text-sm truncate" :title="lote.cooperativaNombre">
                  {{ lote.cooperativaNombre }}
                </p>
                <p class="text-xs text-tertiary">Aprobado: {{ formatDate(lote.fechaAprobacionCooperativa) }}</p>
              </div>
            </div>

            <!-- Info Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                <p class="text-xs text-secondary">Transportistas</p>
                <p class="text-sm font-medium text-neutral mt-0.5">
                  {{ lote.transportistasAsignados?.length || 0 }} asignados
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

            <!-- Transportistas Asignados -->
            <div v-if="lote.transportistasAsignados && lote.transportistasAsignados.length > 0" 
              class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <h4 class="text-xs text-blue-900 dark:text-blue-200 font-semibold mb-2">Transportistas Asignados</h4>
              <div class="grid gap-2">
                <div v-for="transportista in lote.transportistasAsignados.slice(0, 2)" 
                  :key="transportista.asignacionId"
                  class="flex items-center gap-2 text-xs">
                  <span class="px-1.5 py-0.5 rounded bg-primary text-white font-bold">
                    #{{ transportista.numeroCamion }}
                  </span>
                  <span class="font-medium text-blue-900 dark:text-blue-200">
                    {{ transportista.nombreCompleto }}
                  </span>
                  <span class="text-blue-700 dark:text-blue-300">•</span>
                  <span class="text-blue-700 dark:text-blue-300">
                    {{ transportista.placaVehiculo }}
                  </span>
                </div>
                <p v-if="lote.transportistasAsignados.length > 2" class="text-xs text-blue-700 dark:text-blue-300">
                  +{{ lote.transportistasAsignados.length - 2 }} más...
                </p>
              </div>
            </div>

            <!-- Observaciones -->
            <div v-if="lote.observaciones" class="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-3 border border-gray-200 dark:border-gray-800">
              <p class="text-xs text-secondary mb-1">Observaciones:</p>
              <p class="text-sm text-neutral">{{ lote.observaciones }}</p>
            </div>

            <!-- Acciones -->
            <div class="flex gap-2 pt-3 border-t border-border">
              <button
                @click="openDetalleModal(lote)"
                class="flex-1 btn-outline text-xs sm:text-sm px-3 py-2 flex items-center justify-center gap-2"
              >
                <Eye class="w-4 h-4" />
                <span>Ver Detalle</span>
              </button>
              <button
                @click="openAprobacionModal(lote)"
                class="flex-1 btn text-xs sm:text-sm px-3 py-2 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 class="w-4 h-4" />
                <span>Aprobar</span>
              </button>
              <button
                @click="openRechazoModal(lote)"
                class="flex-1 btn-secondary text-xs sm:text-sm px-3 py-2 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white"
              >
                <XCircle class="w-4 h-4" />
                <span>Rechazar</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Estado vacío -->
        <div v-if="lotesFiltrados.length === 0 && !lotesStore.loading" class="text-center py-12">
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
        <div v-if="lotesStore.loading" class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <p class="text-secondary mt-4">Cargando lotes pendientes...</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Modales -->
  <LoteDetalleDestinoModal
    v-if="showDetalleModal && loteSeleccionado"
    :lote-id="loteSeleccionado.id"
    :tipo-destino="tipoDestino"
    @close="closeDetalleModal"
    @aprobar="openAprobacionModal(loteSeleccionado)"
    @rechazar="openRechazoModal(loteSeleccionado)"
  />

  <LoteAprobacionDestinoModal
    v-if="showAprobacionModal && loteSeleccionado"
    :lote="loteSeleccionado"
    :tipo-destino="tipoDestino"
    @close="closeAprobacionModal"
    @success="handleAprobacionExitosa"
  />

  <LoteRechazoDestinoModal
    v-if="showRechazoModal && loteSeleccionado"
    :lote="loteSeleccionado"
    :tipo-destino="tipoDestino"
    @close="closeRechazoModal"
    @success="handleRechazoExitoso"
  />
</template>