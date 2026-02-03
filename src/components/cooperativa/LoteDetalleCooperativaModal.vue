<!-- src/components/cooperativa/LoteDetalleCooperativaModal.vue -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useLotesCooperativaStore } from '@/stores/cooperativa/lotesCooperativaStore'
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
  CheckCircle2,
  XCircle,
  Info,
  Loader2,
  Map as MapIcon
} from 'lucide-vue-next'
import RouteMapViewer from '../socio/RouteMapViewer.vue'

const props = defineProps({
  loteId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['close', 'aprobar', 'rechazar'])

const lotesStore = useLotesCooperativaStore()

onMounted(async () => {
  await lotesStore.fetchLoteDetalle(props.loteId)
})

watch(() => props.loteId, async (newId) => {
  if (newId) {
    await lotesStore.fetchLoteDetalle(newId)
  }
})

const lote = computed(() => lotesStore.loteDetalle)

// Computed properties para el mapa (reutilizando la misma estructura)
const origenMapa = computed(() => {
  if (!lote.value || !lote.value.minaLatitud || !lote.value.minaLongitud) return null
  return {
    id: lote.value.minaId,
    nombre: lote.value.minaNombre,
    latitud: lote.value.minaLatitud,
    longitud: lote.value.minaLongitud,
    sectorColor: '#1E3A8A' // Color por defecto
  }
})

const destinoMapa = computed(() => {
  if (!lote.value || 
      !lote.value.destinoBalanzaLatitud || 
      !lote.value.destinoBalanzaLongitud ||
      !lote.value.destinoAlmacenLatitud ||
      !lote.value.destinoAlmacenLongitud) return null
  
  return {
    id: lote.value.destinoId,
    razonSocial: lote.value.destinoNombre,
    latitudAlmacen: lote.value.destinoAlmacenLatitud,
    longitudAlmacen: lote.value.destinoAlmacenLongitud,
    latitudBalanza: lote.value.destinoBalanzaLatitud,
    longitudBalanza: lote.value.destinoBalanzaLongitud,
    municipio: lote.value.destinoDireccion
  }
})

const balanzaCoopMapa = computed(() => {
  if (!lote.value || 
      !lote.value.cooperativaBalanzaLatitud || 
      !lote.value.cooperativaBalanzaLongitud) return null
  
  return {
    razonSocial: 'Cooperativa',
    latitudBalanza: lote.value.cooperativaBalanzaLatitud,
    longitudBalanza: lote.value.cooperativaBalanzaLongitud
  }
})

const tipoDestinoMapa = computed(() => {
  if (!lote.value) return 'ingenio'
  return lote.value.destinoTipo === 'comercializadora' ? 'comercializadora' : 'ingenio'
})


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

const formatDateShort = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const handleAprobar = () => {
  emit('aprobar')
  emit('close')
}

const handleRechazar = () => {
  emit('rechazar')
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-10000 flex items-center justify-center bg-neutral-900/20 backdrop-blur-sm p-4"
      @click.self="emit('close')"
    >
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] border border-border flex flex-col">
        <!-- Header -->
<div class="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-hover shrink-0">
  <div class="flex items-center gap-3">
    <div class="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
      <PackageCheck class="w-6 h-6 text-white" />
    </div>
    <div>
      <div class="flex items-center gap-2">
        <h2 class="text-xl font-semibold text-neutral">
          Detalle del Lote #{{ loteId }}
        </h2>
        <span
          v-if="lote"
          class="px-3 py-1 rounded-lg text-xs font-medium text-white"
          :class="getEstadoColorSolido(lote.estado)"
        >
          {{ lote.estado }}
        </span>
      </div>
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
          <Loader2 class="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
          <p class="text-secondary">Cargando detalle del lote...</p>
        </div>

        <!-- Content -->
        <div v-else-if="lote" class="flex-1 overflow-y-auto scrollbar-custom">
          <div class="p-4 sm:p-6 space-y-6">
            <!-- Mapa de Ruta -->
            <div class="bg-base rounded-xl border border-border shadow-sm overflow-hidden">
              <div class="p-4 border-b border-border bg-hover">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapIcon class="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-neutral">Mapa de Ruta</h3>
                    <p class="text-xs text-tertiary">Visualiza el recorrido completo del lote</p>
                  </div>
                </div>
              </div>
              <div class="h-[400px]">
                <RouteMapViewer
                  :origen="origenMapa"
                  :destino="destinoMapa"
                  :balanza-coop="balanzaCoopMapa"
                  :tipo-destino="tipoDestinoMapa"
                  class="h-full"
                />
              </div>
            </div>

            <!-- Grid de información principal -->
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

              <!-- Socio Propietario -->
              <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
                    <User class="w-5 h-5 text-white" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-medium text-secondary mb-2">Socio Solicitante</h3>
                    <p class="font-semibold text-neutral truncate">{{ lote.socioNombre }}</p>
                    <p class="text-sm text-secondary mt-1">CI: {{ lote.socioCi }}</p>
                    <p v-if="lote.socioTelefono" class="text-sm text-tertiary mt-1">
                      Tel: {{ lote.socioTelefono }}
                    </p>
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
                    <p class="text-sm text-secondary mt-1">NIT: {{ lote.destinoNit }}</p>
                    <p class="text-xs text-tertiary mt-1">
                      {{ lote.destinoDireccion }}
                    </p>
                    <p v-if="lote.destinoContacto" class="text-xs text-tertiary mt-1">
                      {{ lote.destinoContacto }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Operación -->
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

            <!-- Camiones y Peso -->
            <div class="grid md:grid-cols-3 gap-4">
              <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
                <div class="flex items-center gap-2 mb-2">
                  <Truck class="w-4 h-4 text-secondary" />
                  <h3 class="text-sm font-medium text-secondary">Camiones Solicitados</h3>
                </div>
                <p class="text-2xl font-bold text-neutral">
                  {{ lote.camionlesSolicitados }}
                </p>
              </div>
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
                  <Calendar class="w-4 h-4 text-secondary" />
                  <h3 class="text-sm font-medium text-secondary">Fecha Creación</h3>
                </div>
                <p class="text-sm font-medium text-neutral">
                  {{ formatDateShort(lote.fechaCreacion) }}
                </p>
              </div>
            </div>

            <!-- Observaciones del Socio -->
            <div v-if="lote.observaciones" class="bg-base rounded-xl p-4 border border-border shadow-sm">
              <h3 class="text-sm font-medium text-secondary mb-2">Observaciones del Socio</h3>
              <p class="text-sm text-neutral whitespace-pre-wrap">{{ lote.observaciones }}</p>
            </div>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="lotesStore.error" class="p-12 text-center flex-1">
          <div class="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-4">
            <XCircle class="w-8 h-8 text-white" />
          </div>
          <h3 class="text-lg font-semibold text-neutral mb-2">Error al cargar el lote</h3>
          <p class="text-sm text-secondary">{{ lotesStore.error }}</p>
        </div>

      </div>
    </div>
  </Teleport>
</template>