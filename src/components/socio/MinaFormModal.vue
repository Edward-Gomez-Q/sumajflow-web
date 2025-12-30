<!-- src/components/socio/MinaFormModal.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { X, Mountain, MapPin, Save, Loader2, AlertCircle } from 'lucide-vue-next'
import { useMinasStore } from '@/stores/socio/minasStore'
import { useSectoresSocioStore } from '@/stores/socio/sectoresSocioStore'
import FileUpload from '@/components/common/FileUpload.vue'
import MinaLocationPicker from '@/components/socio/MinaLocationPicker.vue'

const props = defineProps({
  minaId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])

const minasStore = useMinasStore()
const sectoresStore = useSectoresSocioStore()

const formData = ref({
  nombre: '',
  fotoUrl: '',
  latitud: null,
  longitud: null,
  sectorId: null
})

const errors = ref({})
const loading = ref(false)
const selectedSector = ref(null)
const initialLocation = ref(null)

const isEditMode = computed(() => props.minaId !== null)
const modalTitle = computed(() => isEditMode.value ? 'Editar Mina' : 'Registrar Nueva Mina')
const submitButtonText = computed(() => isEditMode.value ? 'Guardar Cambios' : 'Crear Mina')

const hasCoordinates = computed(() => {
  return formData.value.latitud !== null && formData.value.longitud !== null
})

const coordinatesDisplay = computed(() => {
  if (!hasCoordinates.value) return 'Sin ubicación seleccionada'
  return `${formData.value.latitud.toFixed(6)}, ${formData.value.longitud.toFixed(6)}`
})

onMounted(async () => {
  if (!sectoresStore.sectoresActivos.length) {
    await sectoresStore.fetchSectores()
  }

  if (isEditMode.value) {
    await loadMinaData()
  }
})

const loadMinaData = async () => {
  loading.value = true
  try {
    const result = await minasStore.getMinaById(props.minaId)
    if (result.success) {
      const mina = result.data
      formData.value = {
        nombre: mina.nombre,
        fotoUrl: mina.fotoUrl || '',
        latitud: mina.latitud,
        longitud: mina.longitud,
        sectorId: mina.sectorId
      }
      
      selectedSector.value = sectoresStore.sectoresActivos.find(s => s.id === mina.sectorId)
      
      initialLocation.value = {
        latitud: mina.latitud,
        longitud: mina.longitud
      }
    }
  } catch (err) {
    console.error('Error al cargar mina:', err)
  } finally {
    loading.value = false
  }
}

const handleLocationSelected = (location) => {
  if (location) {
    formData.value.latitud = location.latitud
    formData.value.longitud = location.longitud
    errors.value.coordenadas = null
  } else {
    formData.value.latitud = null
    formData.value.longitud = null
    formData.value.sectorId = null
    selectedSector.value = null
  }
}

const handleSectorChanged = (sector) => {
  if (sector) {
    formData.value.sectorId = sector.id
    selectedSector.value = sector
    errors.value.sectorId = null
  } else {
    formData.value.sectorId = null
    selectedSector.value = null
  }
}

const validateForm = () => {
  errors.value = {}

  if (!formData.value.nombre.trim()) {
    errors.value.nombre = 'El nombre de la mina es requerido'
  }

  if (!formData.value.sectorId) {
    errors.value.sectorId = 'La mina debe estar ubicada dentro de un sector'
  }

  if (!hasCoordinates.value) {
    errors.value.coordenadas = 'Debes seleccionar la ubicación en el mapa'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  loading.value = true

  try {
    let result

    if (isEditMode.value) {
      result = await minasStore.updateMina(props.minaId, formData.value)
    } else {
      result = await minasStore.createMina(formData.value)
    }

    if (result.success) {
      emit('saved', result.data)
      emit('close')
    } else {
      errors.value.general = result.error
    }
  } catch (err) {
    errors.value.general = err.message || 'Error al guardar mina'
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      @click.self="handleClose"
    >
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-border">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-hover shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
              <Mountain class="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 class="text-xl font-semibold text-neutral">{{ modalTitle }}</h3>
              <p class="text-sm text-secondary mt-0.5">
                {{ isEditMode ? 'Modifica los datos de tu mina' : 'Ubica tu mina dentro de un sector en el mapa' }}
              </p>
            </div>
          </div>
          <button @click="handleClose" class="w-10 h-10 rounded-lg hover:bg-hover flex items-center justify-center transition-colors">
            <X class="w-5 h-5 text-tertiary" />
          </button>
        </div>

        <!-- Contenido -->
        <div class="flex-1 overflow-hidden">
          <div class="grid grid-cols-1 lg:grid-cols-5 h-full">
            <!-- Mapa (3/5) -->
            <div class="lg:col-span-3 relative min-h-[400px] lg:min-h-0 border-b lg:border-b-0 lg:border-r border-border">
              <MinaLocationPicker
                v-if="sectoresStore.sectoresActivos.length > 0"
                :sectores="sectoresStore.sectoresActivos"
                :initial-location="initialLocation"
                :initial-sector-id="formData.sectorId"
                @location-selected="handleLocationSelected"
                @sector-changed="handleSectorChanged"
              />
              
              <!-- Estado vacío -->
              <div v-else class="absolute inset-0 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
                <div class="text-center max-w-sm">
                  <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <MapPin class="w-10 h-10 text-primary" />
                  </div>
                  <h3 class="text-lg font-semibold text-neutral mb-2">No hay sectores disponibles</h3>
                  <p class="text-sm text-secondary">
                    Espera a que tu cooperativa defina los sectores de operación para poder registrar minas
                  </p>
                </div>
              </div>
            </div>

            <!-- Formulario (2/5) -->
            <div class="lg:col-span-2 flex flex-col">
              <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-custom">
                <!-- Error general -->
                <div v-if="errors.general" class="bg-error/10 border border-error/30 rounded-lg p-4">
                  <div class="flex items-start gap-2">
                    <AlertCircle class="w-5 h-5 text-error shrink-0 mt-0.5" />
                    <div>
                      <p class="font-medium text-error">Error al guardar</p>
                      <p class="text-sm text-error/80 mt-1">{{ errors.general }}</p>
                    </div>
                  </div>
                </div>

                <form @submit.prevent="handleSubmit" class="space-y-6">
                  <!-- Nombre -->
                  <div class="input-group">
                    <label class="input-label">
                      Nombre de la mina <span class="text-error">*</span>
                    </label>
                    <input
                      v-model="formData.nombre"
                      type="text"
                      placeholder="Ej: Mina San José"
                      :class="{ 'border-error': errors.nombre }"
                      maxlength="100"
                    />
                    <p v-if="errors.nombre" class="input-error">{{ errors.nombre }}</p>
                    <p v-else class="input-helper">Nombre descriptivo para identificar tu mina</p>
                  </div>

                  <!-- Ubicación (info) -->
                  <div class="input-group">
                    <label class="input-label">
                      Ubicación <span class="text-error">*</span>
                    </label>
                    <div 
                      class="p-4 border-2 rounded-lg transition-all"
                      :class="{
                        'border-green-500 bg-green-50 dark:bg-green-900/20': hasCoordinates && selectedSector,
                        'border-error bg-error/5': errors.coordenadas || errors.sectorId,
                        'border-dashed border-border': !hasCoordinates && !errors.coordenadas
                      }"
                    >
                      <div class="flex items-start gap-3">
                        <div 
                          class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                          :class="{
                            'bg-green-100 dark:bg-green-900/30': hasCoordinates && selectedSector,
                            'bg-error/10': errors.coordenadas || errors.sectorId,
                            'bg-primary/10': !hasCoordinates && !errors.coordenadas
                          }"
                        >
                          <MapPin 
                            class="w-5 h-5"
                            :class="{
                              'text-green-600 dark:text-green-400': hasCoordinates && selectedSector,
                              'text-error': errors.coordenadas || errors.sectorId,
                              'text-primary': !hasCoordinates && !errors.coordenadas
                            }"
                          />
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="font-medium text-neutral text-sm">
                            {{ hasCoordinates ? 'Ubicación seleccionada' : 'Sin ubicación' }}
                          </p>
                          <p class="text-xs text-secondary mt-1 break-all font-mono">
                            {{ coordinatesDisplay }}
                          </p>
                          <div v-if="selectedSector" class="mt-2 flex items-center gap-2">
                            <div 
                              class="w-3 h-3 rounded-full" 
                              :style="{ backgroundColor: selectedSector.color }"
                            ></div>
                            <span class="text-xs font-medium text-green-600 dark:text-green-400">
                              {{ selectedSector.nombre }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p v-if="errors.coordenadas" class="input-error">{{ errors.coordenadas }}</p>
                    <p v-else-if="errors.sectorId" class="input-error">{{ errors.sectorId }}</p>
                    <p v-else class="input-helper">
                      Haz clic en el mapa dentro de un sector para ubicar tu mina
                    </p>
                  </div>

                  <!-- Foto -->
                  <FileUpload
                    v-model="formData.fotoUrl"
                    label="Foto de la mina (opcional)"
                    accept="image/*"
                    :max-size="10"
                    folder="minas"
                    helper-text="Sube una foto representativa de tu mina (máx. 10MB)"
                  />
                </form>
              </div>

              <!-- Footer con botones -->
              <div class="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-border bg-hover shrink-0">
                <button 
                  type="button" 
                  @click="handleClose" 
                  class="btn-secondary px-6" 
                  :disabled="loading"
                >
                  Cancelar
                </button>
                <button 
                  @click="handleSubmit" 
                  :disabled="loading || !hasCoordinates || !selectedSector" 
                  class="btn px-6 flex items-center justify-center gap-2"
                >
                  <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
                  <Save v-else class="w-4 h-4" />
                  {{ loading ? 'Guardando...' : submitButtonText }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>