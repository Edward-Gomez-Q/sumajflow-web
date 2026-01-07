<!-- src/views/ingenio/Lotes.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { useLotesIngenioStore } from '@/stores/ingenio/lotesIngenioStore'
import AppLayout from '@/components/layout/AppLayout.vue'
import { 
  PackageCheck, 
  Eye, 
  Truck, 
  Clock, 
  CheckCircle2,
  User,
  MapPin,
  Calendar,
  Building2,
  XCircle
} from 'lucide-vue-next'
import LoteDetalleIngenioModal from '@/components/ingenio/LoteDetalleIngenioModal.vue'
import LoteAprobacionIngenioModal from '@/components/ingenio/LoteAprobacionIngenioModal.vue'
import LoteRechazoIngenioModal from '@/components/ingenio/LoteRechazoIngenioModal.vue'
import LotesFiltrosIngenio from '@/components/ingenio/LotesFiltrosIngenio.vue'
import Paginacion from '@/components/socio/Paginacion.vue'

const lotesStore = useLotesIngenioStore()

const showDetalleModal = ref(false)
const showAprobacionModal = ref(false)
const showRechazoModal = ref(false)
const loteSeleccionado = ref(null)

onMounted(async () => {
  await lotesStore.fetchLotes()
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

const handleDetalleAprobar = (lote) => {
  closeDetalleModal()
  openAprobacionModal(lote)
}

const handleDetalleRechazar = (lote) => {
  closeDetalleModal()
  openRechazoModal(lote)
}

const aplicarFiltros = async (filtros) => {
  await lotesStore.aplicarFiltros(filtros)
}

const limpiarFiltros = async () => {
  await lotesStore.limpiarFiltros()
}

const cambiarPagina = async (pagina) => {
  await lotesStore.cambiarPagina(pagina)
}

const cambiarTamanoPagina = async (tamano) => {
  await lotesStore.cambiarTamanoPagina(tamano)
}

const getEstadoColorSolido = (estado) => {
  if (!estado) return 'bg-gray-500'
  if (estado.includes('Pendiente')) {
    return 'bg-yellow-500'
  } else if (estado === 'Rechazado') {
    return 'bg-red-500'
  } else if (estado === 'Completado') {
    return 'bg-green-500'
  } else {
    return 'bg-blue-500'
  }
}

const getTipoOperacionLabel = (tipo) => {
  return tipo === 'procesamiento_planta' ? 'Procesamiento' : 'Venta Directa'
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

const esPendienteAprobacion = (lote) => {
  return lote.estado === 'Pendiente de aprobación por Ingenio/Comercializadora'
}
</script>

<template>
  <AppLayout>
    <div class="space-y-4 pb-6">
      <!-- Header -->
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-neutral">Gestión de Lotes</h1>
            <p class="text-secondary mt-1 text-sm sm:text-base">
              Revisa y administra los lotes de mineral destinados a tu ingenio
            </p>
          </div>
          <LotesFiltrosIngenio
            :filtros-actuales="lotesStore.filtros"
            @aplicar="aplicarFiltros"
            @limpiar="limpiarFiltros"
          />
        </div>

        <!-- Estadísticas -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500 center shrink-0">
                <PackageCheck class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Total</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ lotesStore.paginacion.totalElementos }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-yellow-500 center shrink-0">
                <Clock class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Pendientes</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ lotesStore.lotesPendientes.length }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-500 center shrink-0">
                <Truck class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">En Proceso</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ lotesStore.lotesEnProceso.length }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500 center shrink-0">
                <CheckCircle2 class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Completados</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ lotesStore.lotesCompletados.length }}
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
          v-for="lote in lotesStore.lotes"
          :key="lote.id"
          class="bg-base rounded-xl p-4 border border-border shadow-sm hover:shadow-lg transition-all"
        >
          <div class="space-y-3">
            <!-- Header del Lote -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <div 
                  class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg center shrink-0"
                  :class="getEstadoColorSolido(lote.estado)"
                >
                  <PackageCheck class="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="font-semibold text-neutral text-base sm:text-lg">
                      Lote #{{ lote.id }}
                    </h3>
                    <span class="text-xs px-2 py-1 rounded-lg font-medium bg-indigo-500 text-white">
                      {{ lote.tipoMineral }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2 mt-1 text-xs sm:text-sm text-secondary">
                    <Building2 class="w-3 h-3 sm:w-4 sm:h-4" />
                    <span class="truncate">{{ lote.cooperativaNombre }}</span>
                  </div>
                </div>
              </div>
              <span 
                class="px-2 py-1 rounded-lg text-xs font-medium shrink-0 text-center text-white"
                :class="getEstadoColorSolido(lote.estado)"
              >
                {{ lote.estado }}
              </span>
            </div>

            <!-- Info Grid -->
            <div class="grid grid-cols-2 gap-3 pt-3 border-t border-border">
              <div>
                <p class="text-xs text-secondary flex items-center gap-1">
                  <User class="w-3 h-3" />
                  Socio
                </p>
                <p class="text-sm font-medium text-neutral mt-0.5 truncate" :title="`${lote.socioNombres} ${lote.socioApellidos}`">
                  {{ lote.socioNombres }} {{ lote.socioApellidos }}
                </p>
              </div>
              <div>
                <p class="text-xs text-secondary flex items-center gap-1">
                  <MapPin class="w-3 h-3" />
                  Mina
                </p>
                <p class="text-sm font-medium text-neutral mt-0.5 truncate" :title="lote.minaNombre">
                  {{ lote.minaNombre }}
                </p>
              </div>
              <div>
                <p class="text-xs text-secondary">Operación</p>
                <p class="text-sm font-medium text-neutral mt-0.5">
                  {{ getTipoOperacionLabel(lote.tipoOperacion) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-secondary">Camiones</p>
                <p class="text-sm font-medium text-neutral mt-0.5 flex items-center gap-1">
                  <Truck class="w-3 h-3" />
                  {{ lote.camioneAsignados || 0 }}/{{ lote.camionlesSolicitados }}
                </p>
              </div>
              <div>
                <p class="text-xs text-secondary">Sector</p>
                <p class="text-sm font-medium text-neutral mt-0.5 truncate">
                  {{ lote.sectorNombre }}
                </p>
              </div>
              <div>
                <p class="text-xs text-secondary flex items-center gap-1">
                  <Calendar class="w-3 h-3" />
                  Creado
                </p>
                <p class="text-sm font-medium text-neutral mt-0.5">
                  {{ formatDate(lote.fechaCreacion) }}
                </p>
              </div>
            </div>

            <!-- Minerales -->
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs text-secondary">Minerales:</span>
              <div class="flex gap-1 flex-wrap">
                <span
                  v-for="mineral in lote.minerales"
                  :key="mineral.id"
                  class="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary font-medium"
                >
                  {{ mineral.nomenclatura }}
                </span>
              </div>
            </div>

            <!-- Acciones -->
            <div class="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
              <button
                @click="openDetalleModal(lote)"
                class="btn-outline text-xs sm:text-sm px-3 py-2 flex items-center justify-center gap-2"
              >
                <Eye class="w-4 h-4" />
                <span>Ver Detalle</span>
              </button>
              <template v-if="esPendienteAprobacion(lote)">
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
              </template>
            </div>
          </div>
        </div>

        <!-- Estado vacío -->
        <div v-if="lotesStore.lotes.length === 0 && !lotesStore.loading" class="col-span-full text-center py-12">
          <div class="w-16 h-16 rounded-full bg-primary/10 center mx-auto mb-4">
            <PackageCheck class="w-8 h-8 text-primary" />
          </div>
          <h3 class="text-lg font-semibold text-neutral mb-2">
            No se encontraron lotes
          </h3>
          <p class="text-sm text-secondary">
            Intenta ajustar los filtros o espera a que lleguen nuevos lotes
          </p>
        </div>

        <!-- Loading -->
        <div v-if="lotesStore.loading" class="col-span-full text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <p class="text-secondary mt-4">Cargando lotes...</p>
        </div>
      </div>

      <!-- Paginación -->
      <Paginacion
        :pagina-actual="lotesStore.paginacion.paginaActual"
        :total-paginas="lotesStore.paginacion.totalPaginas"
        :total-elementos="lotesStore.paginacion.totalElementos"
        :elementos-por-pagina="lotesStore.paginacion.elementosPorPagina"
        :tiene-siguiente="lotesStore.paginacion.tieneSiguiente"
        :tiene-anterior="lotesStore.paginacion.tieneAnterior"
        @cambiar-pagina="cambiarPagina"
        @cambiar-tamano="cambiarTamanoPagina"
      />
    </div>

    <!-- Modales -->
    <LoteDetalleIngenioModal
      v-if="showDetalleModal && loteSeleccionado"
      :lote-id="loteSeleccionado.id"
      @close="closeDetalleModal"
      @aprobar="handleDetalleAprobar(loteSeleccionado)"
      @rechazar="handleDetalleRechazar(loteSeleccionado)"
    />

    <LoteAprobacionIngenioModal
      v-if="showAprobacionModal && loteSeleccionado"
      :lote="loteSeleccionado"
      @close="closeAprobacionModal"
      @success="handleAprobacionExitosa"
    />

    <LoteRechazoIngenioModal
      v-if="showRechazoModal && loteSeleccionado"
      :lote="loteSeleccionado"
      @close="closeRechazoModal"
      @success="handleRechazoExitoso"
    />
  </AppLayout>
</template>