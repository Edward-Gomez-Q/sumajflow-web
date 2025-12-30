<!-- src/components/socio/LoteDetalleModal.vue -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useLotesStore } from '@/stores/socio/lotesStore'
import {
  X,
  PackageCheck,
  MapPin,
  Building2,
  Truck,
  Calendar,
  Weight,
  FileText,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-vue-next'

const props = defineProps({
  loteId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['close'])

const lotesStore = useLotesStore()
const tabActual = ref('general')

onMounted(async () => {
  await lotesStore.fetchLoteDetalle(props.loteId)
})

watch(() => props.loteId, async (newId) => {
  if (newId) {
    await lotesStore.fetchLoteDetalle(newId)
  }
})

const lote = computed(() => lotesStore.loteDetalle)

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

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-BO', {
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
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-10000 flex items-center justify-center bg-neutral-900/20 backdrop-blur-sm p-4"
      @click.self="emit('close')"
    >
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] border border-border flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-hover shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
              <PackageCheck class="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 class="text-xl font-semibold text-neutral">
                Detalle del Lote #{{ loteId }}
              </h2>
              <p v-if="lote" class="text-sm text-secondary mt-0.5">
                Creado el {{ formatDateShort(lote.fechaCreacion) }}
              </p>
            </div>
          </div>
          <button
            @click="emit('close')"
            class="w-10 h-10 rounded-lg hover:bg-surface transition-colors flex items-center justify-center text-secondary hover:text-neutral"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Loading -->
        <div v-if="lotesStore.loadingDetalle" class="p-12 text-center flex-1">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p class="text-secondary">Cargando detalle del lote...</p>
        </div>

        <!-- Content -->
        <div v-else-if="lote" class="flex-1 overflow-y-auto scrollbar-custom">
          <div class="p-4 sm:p-6">
            <!-- Estado Principal -->
            <div class="mb-6">
              <div class="flex items-center gap-3">
                <span
                  class="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  :class="getEstadoColorSolido(lote.estado)"
                >
                  {{ lote.estado }}
                </span>
                <div class="flex-1 h-px bg-border"></div>
              </div>
            </div>

            <!-- Tabs -->
            <div class="border-b border-border mb-6">
              <div class="flex gap-4 overflow-x-auto scrollbar-custom">
                <button
                  @click="tabActual = 'general'"
                  class="px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-1"
                  :class="tabActual === 'general'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-secondary hover:text-neutral'"
                >
                  <Info class="w-4 h-4" />
                  General
                </button>
                <button
                  @click="tabActual = 'transporte'"
                  class="px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-1"
                  :class="tabActual === 'transporte'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-secondary hover:text-neutral'"
                >
                  <Truck class="w-4 h-4" />
                  Transporte
                  <span v-if="lote.camioneAsignados > 0" class="ml-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
                    {{ lote.camioneAsignados }}
                  </span>
                </button>
                <button
                  @click="tabActual = 'historial'"
                  class="px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-1"
                  :class="tabActual === 'historial'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-secondary hover:text-neutral'"
                >
                  <Clock class="w-4 h-4" />
                  Historial
                  <span v-if="lote.historialCambios?.length > 0" class="ml-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
                    {{ lote.historialCambios.length }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Tab: General -->
            <div v-show="tabActual === 'general'" class="space-y-4">
              <!-- Grid de información -->
              <div class="grid md:grid-cols-2 gap-4">
                <!-- Mina de Origen -->
                <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center shrink-0">
                      <MapPin class="w-5 h-5 text-white" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="text-sm font-medium text-secondary mb-2">Mina de Origen</h3>
                      <p class="font-semibold text-neutral truncate">{{ lote.minaNombre }}</p>
                      <p class="text-sm text-secondary mt-1">Sector: {{ lote.sectorNombre }}</p>
                      <div v-if="lote.minaLatitud && lote.minaLongitud" class="text-xs text-tertiary mt-1 truncate">
                        {{ lote.minaLatitud }}, {{ lote.minaLongitud }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Destino -->
                <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
                      <Building2 class="w-5 h-5 text-white" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="text-sm font-medium text-secondary mb-2">
                        {{ lote.destinoTipo === 'ingenio' ? 'Ingenio Minero' : 'Comercializadora' }}
                      </h3>
                      <p class="font-semibold text-neutral truncate">{{ lote.destinoNombre }}</p>
                      <p class="text-sm text-secondary mt-1">NIT: {{ lote.destinoNIT }}</p>
                      <p class="text-xs text-tertiary mt-1 truncate">
                        {{ lote.destinoMunicipio }}, {{ lote.destinoDepartamento }}
                      </p>
                      <p v-if="lote.destinoTelefono" class="text-xs text-tertiary mt-1">
                        Tel: {{ lote.destinoTelefono }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Operación y Mineral -->
                <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
                  <h3 class="text-sm font-medium text-secondary mb-3">Tipo de Operación</h3>
                  <div class="space-y-2">
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-secondary">Operación:</span>
                      <span class="text-sm font-medium text-neutral">
                        {{ lote.tipoOperacion === 'procesamiento_planta' ? 'Procesamiento' : 'Venta Directa' }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-sm text-secondary">Tipo Mineral:</span>
                      <span class="text-sm font-medium text-neutral capitalize">{{ lote.tipoMineral }}</span>
                    </div>
                  </div>
                </div>

                <!-- Camiones -->
                <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center shrink-0">
                      <Truck class="w-5 h-5 text-white" />
                    </div>
                    <div class="flex-1">
                      <h3 class="text-sm font-medium text-secondary mb-2">Camiones</h3>
                      <p class="text-2xl font-bold text-neutral">
                        {{ lote.camioneAsignados || 0 }} / {{ lote.camionlesSolicitados }}
                      </p>
                      <p class="text-xs text-secondary mt-1">
                        {{ lote.camioneAsignados === lote.camionlesSolicitados 
                          ? 'Todos asignados' 
                          : lote.camioneAsignados > 0
                          ? 'Asignación parcial'
                          : 'Pendiente de asignación' }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Minerales -->
              <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
                <h3 class="text-sm font-medium text-secondary mb-3 flex items-center gap-2">
                  <FileText class="w-4 h-4" />
                  Minerales a Transportar
                </h3>
                <div class="flex gap-2 flex-wrap">
                  <div
                    v-for="mineral in lote.minerales"
                    :key="mineral.id"
                    class="px-4 py-2 rounded-lg bg-blue-500 text-white"
                  >
                    <div class="text-xs opacity-70">{{ mineral.nomenclatura }}</div>
                    <div class="font-medium">{{ mineral.nombre }}</div>
                  </div>
                </div>
              </div>

              <!-- Pesos -->
              <div class="grid md:grid-cols-2 gap-4">
                <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
                  <div class="flex items-center gap-2 mb-2">
                    <Weight class="w-4 h-4 text-secondary" />
                    <h3 class="text-sm font-medium text-secondary">Peso Estimado</h3>
                  </div>
                  <p class="text-2xl font-bold text-neutral">
                    {{ lote.pesoTotalEstimado || '-' }}
                    <span v-if="lote.pesoTotalEstimado" class="text-sm font-normal text-secondary ml-1">Ton</span>
                  </p>
                </div>
                <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
                  <div class="flex items-center gap-2 mb-2">
                    <Weight class="w-4 h-4 text-secondary" />
                    <h3 class="text-sm font-medium text-secondary">Peso Real</h3>
                  </div>
                  <p class="text-2xl font-bold text-neutral">
                    {{ lote.pesoTotalReal || '-' }}
                    <span v-if="lote.pesoTotalReal" class="text-sm font-normal text-secondary ml-1">Ton</span>
                  </p>
                </div>
              </div>

              <!-- Fechas Importantes -->
              <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
                <h3 class="text-sm font-medium text-secondary mb-3 flex items-center gap-2">
                  <Calendar class="w-4 h-4" />
                  Fechas Importantes
                </h3>
                <div class="grid sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p class="text-xs text-tertiary">Creación</p>
                    <p class="font-medium text-neutral mt-0.5">{{ formatDate(lote.fechaCreacion) }}</p>
                  </div>
                  <div v-if="lote.fechaAprobacionCooperativa">
                    <p class="text-xs text-tertiary">Aprobación Cooperativa</p>
                    <p class="font-medium text-neutral mt-0.5">{{ formatDate(lote.fechaAprobacionCooperativa) }}</p>
                  </div>
                  <div v-if="lote.fechaAprobacionDestino">
                    <p class="text-xs text-tertiary">Aprobación Destino</p>
                    <p class="font-medium text-neutral mt-0.5">{{ formatDate(lote.fechaAprobacionDestino) }}</p>
                  </div>
                  <div v-if="lote.fechaInicioTransporte">
                    <p class="text-xs text-tertiary">Inicio Transporte</p>
                    <p class="font-medium text-neutral mt-0.5">{{ formatDate(lote.fechaInicioTransporte) }}</p>
                  </div>
                  <div v-if="lote.fechaFinTransporte">
                    <p class="text-xs text-tertiary">Fin Transporte</p>
                    <p class="font-medium text-neutral mt-0.5">{{ formatDate(lote.fechaFinTransporte) }}</p>
                  </div>
                </div>
              </div>

              <!-- Observaciones -->
              <div v-if="lote.observaciones" class="bg-base rounded-xl p-4 border border-border shadow-sm">
                <h3 class="text-sm font-medium text-secondary mb-2">Observaciones</h3>
                <p class="text-sm text-neutral whitespace-pre-wrap">{{ lote.observaciones }}</p>
              </div>

              <!-- Socio Propietario -->
              <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
                    <User class="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 class="text-sm font-medium text-secondary">Socio Propietario</h3>
                    <p class="font-medium text-neutral">{{ lote.socioNombres }} {{ lote.socioApellidos }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab: Transporte -->
            <div v-show="tabActual === 'transporte'" class="space-y-4">
              <div v-if="lote.asignaciones && lote.asignaciones.length > 0">
                <div
                  v-for="asignacion in lote.asignaciones"
                  :key="asignacion.id"
                  class="bg-base rounded-xl p-4 border border-border shadow-sm"
                >
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                      <Truck class="w-6 h-6 text-white" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between gap-4 mb-3">
                        <div class="min-w-0">
                          <h4 class="font-semibold text-neutral">Camión #{{ asignacion.numeroCamion }}</h4>
                          <p class="text-sm text-secondary mt-0.5 truncate">{{ asignacion.transportistaNombre }}</p>
                        </div>
                        <span
                          class="px-3 py-1 rounded-lg text-xs font-medium shrink-0 text-white"
                          :class="getEstadoColorSolido(asignacion.estado)"
                        >
                          {{ asignacion.estado }}
                        </span>
                      </div>
                      <div class="grid sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span class="text-tertiary">Placa:</span>
                          <span class="ml-2 font-medium text-neutral">{{ asignacion.transportistaPlaca }}</span>
                        </div>
                        <div v-if="asignacion.transportistaTelefono">
                          <span class="text-tertiary">Teléfono:</span>
                          <span class="ml-2 font-medium text-neutral">{{ asignacion.transportistaTelefono }}</span>
                        </div>
                        <div>
                          <span class="text-tertiary">Asignado:</span>
                          <span class="ml-2 font-medium text-neutral">{{ formatDateShort(asignacion.fechaAsignacion) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-12">
                <div class="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-4">
                  <Truck class="w-8 h-8 text-white" />
                </div>
                <h3 class="text-lg font-semibold text-neutral mb-2">No hay camiones asignados</h3>
                <p class="text-sm text-secondary">
                  Los camiones serán asignados una vez que la cooperativa apruebe el lote
                </p>
              </div>
            </div>

            <!-- Tab: Historial -->
            <div v-show="tabActual === 'historial'" class="space-y-3">
              <div v-if="lote.historialCambios && lote.historialCambios.length > 0">
                <div class="relative">
                  <!-- Timeline line -->
                  <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>

                  <!-- Timeline items -->
                  <div
                    v-for="(cambio, index) in lote.historialCambios"
                    :key="cambio.id"
                    class="relative pl-14 pb-6"
                    :class="{ 'pb-0': index === lote.historialCambios.length - 1 }"
                  >
                    <!-- Timeline dot -->
                    <div class="absolute left-4 w-5 h-5 rounded-full flex items-center justify-center"
                      :class="cambio.accion.includes('aprobar') || cambio.accion.includes('crear')
                        ? 'bg-green-500'
                        : cambio.accion.includes('rechazar')
                        ? 'bg-red-500'
                        : 'bg-blue-500'"
                    >
                      <CheckCircle2 v-if="cambio.accion.includes('aprobar') || cambio.accion.includes('crear')" class="w-3 h-3 text-white" />
                      <AlertCircle v-else-if="cambio.accion.includes('rechazar')" class="w-3 h-3 text-white" />
                      <Clock v-else class="w-3 h-3 text-white" />
                    </div>

                    <!-- Content -->
                    <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
                      <div class="flex items-start justify-between gap-4 mb-2">
                        <h4 class="font-medium text-neutral flex-1">{{ cambio.accion }}</h4>
                        <span class="text-xs text-tertiary whitespace-nowrap">
                          {{ formatDateShort(cambio.fechaRegistro) }}
                        </span>
                      </div>
                      <p v-if="cambio.descripcion" class="text-sm text-secondary mb-2">
                        {{ cambio.descripcion }}
                      </p>
                      <div v-if="cambio.estadoAnterior || cambio.estadoNuevo" class="flex items-center gap-2 text-xs flex-wrap">
                        <span v-if="cambio.estadoAnterior" class="px-2 py-1 rounded bg-hover text-secondary">
                          {{ cambio.estadoAnterior }}
                        </span>
                        <span v-if="cambio.estadoAnterior && cambio.estadoNuevo">→</span>
                        <span v-if="cambio.estadoNuevo" class="px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                          {{ cambio.estadoNuevo }}
                        </span>
                      </div>
                      <p v-if="cambio.observaciones" class="text-xs text-tertiary mt-2 italic">
                        {{ cambio.observaciones }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-12">
                <div class="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center mx-auto mb-4">
                  <Clock class="w-8 h-8 text-white" />
                </div>
                <h3 class="text-lg font-semibold text-neutral mb-2">Sin historial</h3>
                <p class="text-sm text-secondary">
                  No hay cambios registrados para este lote
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="lotesStore.error" class="p-12 text-center flex-1">
          <div class="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle class="w-8 h-8 text-white" />
          </div>
          <h3 class="text-lg font-semibold text-neutral mb-2">Error al cargar el lote</h3>
          <p class="text-sm text-secondary">{{ lotesStore.error }}</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>