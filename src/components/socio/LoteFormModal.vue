<!-- src/components/socio/LoteFormModal.vue -->
<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useLotesStore } from '@/stores/socio/lotesStore'
import { useMinasStore } from '@/stores/socio/minasStore'
import { useDestinosStore } from '@/stores/socio/destinosStore'
import { usePublicDataStore } from '@/stores/publicDataStore'
import { X, Save, PackageCheck, Truck, MapPin, AlertCircle, Map as MapIcon } from 'lucide-vue-next'
import RouteMapViewer from './RouteMapViewer.vue'

const emit = defineEmits(['close', 'saved'])

const lotesStore = useLotesStore()
const minasStore = useMinasStore()
const destinosStore = useDestinosStore()
const publicDataStore = usePublicDataStore()

const loading = ref(false)
const errors = ref({})
const successMessage = ref('')
const showMap = ref(true) // Mostrar mapa por defecto

// Form data
const formData = ref({
  minaId: null,
  mineralesIds: [],
  camionlesSolicitados: 1,
  tipoOperacion: 'procesamiento_planta',
  destinoId: null,
  tipoMineral: 'complejo',
  pesoTotalEstimado: null,
  observaciones: ''
})

// Computed
const destinosDisponibles = computed(() => {
  if (formData.value.tipoOperacion === 'procesamiento_planta') {
    return destinosStore.ingenios
  } else {
    return destinosStore.comercializadoras
  }
})

const puedeSeleccionarConcentrado = computed(() => {
  return formData.value.tipoOperacion === 'venta_directa'
})

// Datos para el mapa
const minaSeleccionada = computed(() => {
  if (!formData.value.minaId) return null
  return minasStore.minasActivas.find(m => m.id === formData.value.minaId)
})

const destinoSeleccionado = computed(() => {
  if (!formData.value.destinoId) return null
  return destinosDisponibles.value.find(d => d.id === formData.value.destinoId)
})

const origenMapa = computed(() => {
  if (!minaSeleccionada.value) return null
  return {
    id: minaSeleccionada.value.id,
    nombre: minaSeleccionada.value.nombre,
    latitud: minaSeleccionada.value.latitud,
    longitud: minaSeleccionada.value.longitud,
    sectorColor: minaSeleccionada.value.sectorColor || '#1E3A8A'
  }
})

const destinoMapa = computed(() => {
  if (!destinoSeleccionado.value) return null
  return {
    id: destinoSeleccionado.value.id,
    razonSocial: destinoSeleccionado.value.razonSocial,
    latitud: destinoSeleccionado.value.latitud,
    longitud: destinoSeleccionado.value.longitud,
    municipio: destinoSeleccionado.value.municipio
  }
})

// Watch tipo de operación para resetear destino
watch(() => formData.value.tipoOperacion, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    formData.value.destinoId = null
    formData.value.tipoMineral = newVal === 'procesamiento_planta' ? 'complejo' : formData.value.tipoMineral
  }
})

// Watch tipo mineral - Si selecciona concentrado, forzar venta_directa
watch(() => formData.value.tipoMineral, (newVal) => {
  if (newVal === 'concentrado') {
    formData.value.tipoOperacion = 'venta_directa'
    formData.value.destinoId = null
  }
})

onMounted(async () => {
  await Promise.all([
    minasStore.fetchMinas(),
    destinosStore.fetchIngenios(),
    destinosStore.fetchComercializadoras(),
    publicDataStore.fetchMinerales()
  ])
})

const validate = () => {
  errors.value = {}

  if (!formData.value.minaId) {
    errors.value.minaId = 'Debes seleccionar una mina'
  }

  if (formData.value.mineralesIds.length === 0) {
    errors.value.mineralesIds = 'Debes seleccionar al menos un mineral'
  }

  if (!formData.value.camionlesSolicitados || formData.value.camionlesSolicitados < 1) {
    errors.value.camionlesSolicitados = 'Debes solicitar al menos 1 camión'
  }

  if (!formData.value.destinoId) {
    errors.value.destinoId = 'Debes seleccionar un destino'
  }

  if (formData.value.tipoMineral === 'concentrado' && formData.value.tipoOperacion === 'procesamiento_planta') {
    errors.value.tipoMineral = 'Mineral concentrado solo puede enviarse a comercializadora'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validate()) return

  loading.value = true
  successMessage.value = ''

  const result = await lotesStore.createLote(formData.value)

  if (result.success) {
    successMessage.value = result.message || 'Lote creado exitosamente'
    setTimeout(() => {
      emit('saved')
      emit('close')
    }, 1500)
  } else {
    errors.value.submit = result.error
  }

  loading.value = false
}

const toggleMineral = (mineralId) => {
  const index = formData.value.mineralesIds.indexOf(mineralId)
  if (index > -1) {
    formData.value.mineralesIds.splice(index, 1)
  } else {
    formData.value.mineralesIds.push(mineralId)
  }
}

const isMineralSelected = (mineralId) => {
  return formData.value.mineralesIds.includes(mineralId)
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
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
              <h2 class="text-xl font-semibold text-neutral">Crear Nuevo Lote</h2>
              <p class="text-sm text-secondary mt-0.5">Solicita el transporte de mineral</p>
            </div>
          </div>
          <button
            @click="emit('close')"
            class="w-10 h-10 rounded-lg hover:bg-surface transition-colors flex items-center justify-center text-secondary hover:text-neutral"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Content con grid de 2 columnas -->
        <div class="flex-1 overflow-hidden flex flex-col sm:flex-row">
          <!-- Columna izquierda: Formulario -->
          <div class="flex-1 overflow-y-auto scrollbar-custom">
            <form @submit.prevent="handleSubmit" class="p-4 sm:p-6 space-y-6">
              <!-- Success Message -->
              <div v-if="successMessage" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p class="text-sm text-green-800 dark:text-green-200 text-center font-medium">
                  {{ successMessage }}
                </p>
              </div>

              <!-- Error General -->
              <div v-if="errors.submit" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div class="flex gap-2">
                  <AlertCircle class="w-5 h-5 text-error shrink-0 mt-0.5" />
                  <p class="text-sm text-error">{{ errors.submit }}</p>
                </div>
              </div>

              <!-- Selección de Mina -->
              <div class="input-group">
                <label class="input-label flex items-center gap-2">
                  <MapPin class="w-4 h-4 text-primary" />
                  Mina de Origen
                </label>
                <select
                  v-model="formData.minaId"
                  class="w-full"
                  :class="{ 'border-error': errors.minaId }"
                >
                  <option :value="null">Selecciona una mina</option>
                  <option
                    v-for="mina in minasStore.minasActivas"
                    :key="mina.id"
                    :value="mina.id"
                  >
                    {{ mina.nombre }} - {{ mina.sectorNombre }}
                  </option>
                </select>
                <p v-if="errors.minaId" class="input-error">{{ errors.minaId }}</p>
              </div>

              <!-- Minerales -->
              <div class="input-group">
                <label class="input-label">Minerales a Transportar</label>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    v-for="mineral in publicDataStore.minerales"
                    :key="mineral.id"
                    type="button"
                    @click="toggleMineral(mineral.id)"
                    class="px-4 py-3 rounded-lg border-2 transition-all text-left"
                    :class="isMineralSelected(mineral.id)
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border hover:border-primary/50 text-secondary hover:text-neutral'"
                  >
                    <div class="text-xs opacity-70">{{ mineral.nomenclatura }}</div>
                    <div class="font-medium text-sm">{{ mineral.nombre }}</div>
                  </button>
                </div>
                <p v-if="errors.mineralesIds" class="input-error">{{ errors.mineralesIds }}</p>
              </div>

              <!-- Grid: Tipo de Operación y Tipo de Mineral -->
              <div class="grid sm:grid-cols-2 gap-4">
                <!-- Tipo de Operación -->
                <div class="input-group">
                  <label class="input-label">Tipo de Operación</label>
                  <select
                    v-model="formData.tipoOperacion"
                    class="w-full"
                    :disabled="formData.tipoMineral === 'concentrado'"
                  >
                    <option value="procesamiento_planta">Procesamiento en Planta</option>
                    <option value="venta_directa">Venta Directa</option>
                  </select>
                  <p v-if="formData.tipoMineral === 'concentrado'" class="input-helper">
                    El mineral concentrado solo puede venderse directamente
                  </p>
                </div>

                <!-- Tipo de Mineral -->
                <div class="input-group">
                  <label class="input-label">Tipo de Mineral</label>
                  <select
                    v-model="formData.tipoMineral"
                    class="w-full"
                    :class="{ 'border-error': errors.tipoMineral }"
                  >
                    <option value="complejo">Complejo</option>
                    <option
                      value="concentrado"
                      :disabled="!puedeSeleccionarConcentrado"
                    >
                      Concentrado {{ !puedeSeleccionarConcentrado ? '(Solo para venta directa)' : '' }}
                    </option>
                  </select>
                  <p v-if="errors.tipoMineral" class="input-error">{{ errors.tipoMineral }}</p>
                </div>
              </div>

              <!-- Destino -->
              <div class="input-group">
                <label class="input-label">
                  Destino
                  <span class="text-xs text-tertiary ml-1">
                    ({{ formData.tipoOperacion === 'procesamiento_planta' ? 'Ingenio Minero' : 'Comercializadora' }})
                  </span>
                </label>
                <select
                  v-model="formData.destinoId"
                  class="w-full"
                  :class="{ 'border-error': errors.destinoId }"
                >
                  <option :value="null">
                    Selecciona {{ formData.tipoOperacion === 'procesamiento_planta' ? 'un ingenio' : 'una comercializadora' }}
                  </option>
                  <option
                    v-for="destino in destinosDisponibles"
                    :key="destino.id"
                    :value="destino.id"
                  >
                    {{ destino.razonSocial }} - {{ destino.municipio }}
                  </option>
                </select>
                <p v-if="errors.destinoId" class="input-error">{{ errors.destinoId }}</p>
              </div>

              <!-- Grid: Camiones y Peso -->
              <div class="grid sm:grid-cols-2 gap-4">
                <!-- Camiones -->
                <div class="input-group">
                  <label class="input-label flex items-center gap-2">
                    <Truck class="w-4 h-4 text-primary" />
                    Camiones Solicitados
                  </label>
                  <input
                    v-model.number="formData.camionlesSolicitados"
                    type="number"
                    min="1"
                    placeholder="Ej: 4"
                    :class="{ 'border-error': errors.camionlesSolicitados }"
                  />
                  <p v-if="errors.camionlesSolicitados" class="input-error">{{ errors.camionlesSolicitados }}</p>
                </div>

                <!-- Peso Estimado -->
                <div class="input-group">
                  <label class="input-label">Peso Total Estimado (Ton)</label>
                  <input
                    v-model.number="formData.pesoTotalEstimado"
                    type="number"
                    step="0.01"
                    placeholder="Ej: 50.5"
                  />
                  <p class="input-helper">Opcional: Peso aproximado del lote</p>
                </div>
              </div>

              <!-- Observaciones -->
              <div class="input-group">
                <label class="input-label">Observaciones</label>
                <textarea
                  v-model="formData.observaciones"
                  rows="3"
                  placeholder="Información adicional sobre el lote..."
                  class="resize-none"
                ></textarea>
              </div>

              <!-- Actions -->
              <div class="flex gap-3 pt-4">
                <button
                  type="button"
                  @click="emit('close')"
                  class="flex-1 btn-secondary"
                  :disabled="loading"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="flex-1 btn flex items-center justify-center gap-2"
                  :disabled="loading"
                >
                  <Save class="w-4 h-4" v-if="!loading" />
                  <div v-else class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{{ loading ? 'Creando...' : 'Crear Lote' }}</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Columna derecha: Mapa -->
          <div class="sm:w-2/5 border-t sm:border-t-0 sm:border-l border-border bg-hover">
            <div class="h-full flex flex-col">
              <!-- Header del mapa -->
              <div class="p-4 border-b border-border">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapIcon class="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 class="text-sm font-semibold text-neutral">Mapa de Ruta</h3>
                      <p class="text-xs text-tertiary">Visualiza la distancia y tiempo</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Componente de mapa -->
              <div class="flex-1 min-h-0 p-4">
                <RouteMapViewer
                  :origen="origenMapa"
                  :destino="destinoMapa"
                  :tipo-destino="formData.tipoOperacion === 'procesamiento_planta' ? 'ingenio' : 'comercializadora'"
                  class="h-full rounded-lg overflow-hidden shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>