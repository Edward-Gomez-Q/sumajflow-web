<!-- src/components/destino/LoteDetalleDestinoModal.vue -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useLotesDestinoStore } from '@/stores/destino/lotesDestinoStore'
import {
  X,
  PackageCheck,
  MapPin,
  Building2,
  Truck,
  Calendar,
  Weight,
  User,
  CheckCircle2,
  XCircle,
  Info,
  Loader2,
  Factory
} from 'lucide-vue-next'

const props = defineProps({
  loteId: {
    type: Number,
    required: true
  },
  tipoDestino: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'aprobar', 'rechazar'])

const lotesStore = useLotesDestinoStore()

onMounted(async () => {
  await lotesStore.fetchLoteDetalle(props.loteId)
})

watch(() => props.loteId, async (newId) => {
  if (newId) {
    await lotesStore.fetchLoteDetalle(newId)
  }
})

const lote = computed(() => lotesStore.loteDetalle)

const nombreDestino = computed(() => {
  return props.tipoDestino === 'ingenio' ? 'Ingenio Minero' : 'Comercializadora'
})

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
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] border border-border flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-hover shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-primary/10 center">
              <PackageCheck class="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 class="text-xl font-semibold text-neutral">
                Detalle del Lote #{{ loteId }}
              </h2>
              <p v-if="lote" class="text-sm text-secondary mt-0.5">
                Solicitado el {{ formatDateShort(lote.fechaCreacion) }}
              </p>
            </div>
          </div>
          <button
            @click="emit('close')"
            class="w-10 h-10 rounded-lg hover:bg-surface transition-colors center text-secondary hover:text-neutral"
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
            <!-- Estado Actual -->
            <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div class="flex items-center gap-2">
                <Info class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <h3 class="font-semibold text-yellow-900 dark:text-yellow-200">
                    Estado: {{ lote.estado }}
                  </h3>
                  <p class="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                    Este lote está esperando tu aprobación como {{ nombreDestino }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Grid de información principal -->
            <div class="grid md:grid-cols-2 gap-4">
              <!-- Mina de Origen -->
              <div class="card">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 center shrink-0">
                    <MapPin class="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-medium text-secondary mb-2">Mina de Origen</h3>
                    <p class="font-semibold text-neutral truncate">{{ lote.minaNombre }}</p>
                  </div>
                </div>
              </div>

              <!-- Socio Propietario -->
              <div class="card">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 center shrink-0">
                    <User class="w-5 h-5 text-orange-600 dark:text-orange-400" />
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

              <!-- Cooperativa -->
              <div class="card">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 center shrink-0">
                    <Building2 class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-medium text-secondary mb-2">Cooperativa</h3>
                    <p class="font-semibold text-neutral truncate">{{ lote.cooperativaNombre }}</p>
                    <p class="text-sm text-secondary mt-1">
                      Aprobó el {{ formatDateShort(lote.fechaAprobacionCooperativa) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Tipo de Mineral -->
              <div class="card">
                <h3 class="text-sm font-medium text-secondary mb-3">Tipo de Mineral</h3>
                <div class="space-y-2">
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-secondary">Clasificación:</span>
                    <span class="text-sm font-medium text-neutral capitalize">{{ lote.tipoMineral }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Minerales -->
            <div class="card">
              <h3 class="text-sm font-medium text-secondary mb-3 flex items-center gap-2">
                <Factory class="w-4 h-4" />
                Minerales a Procesar/Comprar
              </h3>
              <div class="flex gap-2 flex-wrap">
                <div
                  v-for="(mineral, index) in lote.minerales"
                  :key="index"
                  class="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20"
                >
                  <div class="font-medium text-primary">{{ mineral }}</div>
                </div>
              </div>
            </div>

            <!-- Camiones y Peso -->
            <div class="grid md:grid-cols-3 gap-4">
              <div class="card">
                <div class="flex items-center gap-2 mb-2">
                  <Truck class="w-4 h-4 text-secondary" />
                  <h3 class="text-sm font-medium text-secondary">Camiones</h3>
                </div>
                <p class="text-2xl font-bold text-neutral">
                  {{ lote.camionlesSolicitados }}
                </p>
              </div>
              <div class="card">
                <div class="flex items-center gap-2 mb-2">
                  <Weight class="w-4 h-4 text-secondary" />
                  <h3 class="text-sm font-medium text-secondary">Peso Estimado</h3>
                </div>
                <p class="text-2xl font-bold text-neutral">
                  {{ lote.pesoTotalEstimado || '-' }}
                  <span v-if="lote.pesoTotalEstimado" class="text-sm font-normal text-secondary ml-1">Ton</span>
                </p>
              </div>
              <div class="card">
                <div class="flex items-center gap-2 mb-2">
                  <Calendar class="w-4 h-4 text-secondary" />
                  <h3 class="text-sm font-medium text-secondary">Fecha Asignación</h3>
                </div>
                <p class="text-sm font-medium text-neutral">
                  {{ formatDateShort(lote.fechaAsignacionTransporte) }}
                </p>
              </div>
            </div>

            <!-- Transportistas Asignados -->
            <div v-if="lote.transportistasAsignados && lote.transportistasAsignados.length > 0" class="card">
              <h3 class="text-sm font-medium text-secondary mb-3 flex items-center gap-2">
                <Truck class="w-4 h-4" />
                Transportistas Asignados por la Cooperativa
              </h3>
              <div class="grid gap-3">
                <div
                  v-for="transportista in lote.transportistasAsignados"
                  :key="transportista.asignacionId"
                  class="bg-hover rounded-lg p-3 border border-border"
                >
                  <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3 flex-1">
                      <div class="w-8 h-8 rounded-lg bg-primary center shrink-0">
                        <span class="text-white font-bold text-sm">#{{ transportista.numeroCamion }}</span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="font-medium text-neutral">{{ transportista.nombreCompleto }}</p>
                        <p class="text-sm text-secondary">{{ transportista.placaVehiculo }}</p>
                      </div>
                    </div>
                    <span class="px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                      {{ transportista.estado }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Observaciones -->
            <div v-if="lote.observaciones" class="card">
              <h3 class="text-sm font-medium text-secondary mb-2">Observaciones</h3>
              <p class="text-sm text-neutral whitespace-pre-wrap">{{ lote.observaciones }}</p>
            </div>

            <!-- Timeline de Aprobaciones -->
            <div class="card">
              <h3 class="text-sm font-medium text-secondary mb-3">Timeline de Aprobaciones</h3>
              <div class="space-y-3">
                <div class="flex items-start gap-3">
                  <CheckCircle2 class="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <div class="flex-1">
                    <p class="font-medium text-neutral text-sm">Creado por el Socio</p>
                    <p class="text-xs text-secondary">{{ formatDate(lote.fechaCreacion) }}</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <CheckCircle2 class="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <div class="flex-1">
                    <p class="font-medium text-neutral text-sm">Aprobado por Cooperativa</p>
                    <p class="text-xs text-secondary">{{ formatDate(lote.fechaAprobacionCooperativa) }}</p>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <div class="w-5 h-5 rounded-full bg-yellow-500 center shrink-0 mt-0.5">
                    <div class="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <div class="flex-1">
                    <p class="font-medium text-neutral text-sm">Pendiente de aprobación por {{ nombreDestino }}</p>
                    <p class="text-xs text-yellow-600 dark:text-yellow-400">Esperando tu decisión</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="lotesStore.error" class="p-12 text-center flex-1">
          <div class="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 center mx-auto mb-4">
            <XCircle class="w-8 h-8 text-error" />
          </div>
          <h3 class="text-lg font-semibold text-neutral mb-2">Error al cargar el lote</h3>
          <p class="text-sm text-secondary">{{ lotesStore.error }}</p>
        </div>

        <!-- Footer con Acciones -->
        <div v-if="lote" class="p-4 sm:p-6 border-t border-border bg-hover shrink-0">
          <div class="flex gap-3">
            <button
              @click="emit('close')"
              class="flex-1 btn-secondary"
            >
              Cerrar
            </button>
            <button
              @click="handleRechazar"
              class="flex-1 btn bg-red-600 hover:bg-red-700"
            >
              <XCircle class="w-4 h-4" />
              <span>Rechazar</span>
            </button>
            <button
              @click="handleAprobar"
              class="flex-1 btn bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 class="w-4 h-4" />
              <span>Aprobar Lote</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>