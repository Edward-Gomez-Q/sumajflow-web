<!-- src/components/almacen/AlmacenEditModal.vue -->
<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { X, MapPin, Warehouse, Save, AlertCircle } from 'lucide-vue-next'
import { useAlmacenIngenioStore } from '@/stores/ingenio/almacenStore'
import { useAlmacenComercializadoraStore } from '@/stores/comercializadora/almacenStore'

const props = defineProps({
  almacen: {
    type: Object,
    required: true
  },
  tipoEntidad: {
    type: String,
    required: true,
    validator: (value) => ['ingenio', 'comercializadora'].includes(value)
  }
})

const emit = defineEmits(['close', 'saved'])

const almacenStore = computed(() => {
  return props.tipoEntidad === 'ingenio' 
    ? useAlmacenIngenioStore() 
    : useAlmacenComercializadoraStore()
})

const formData = reactive({
  nombre: '',
  capacidadMaxima: null,
  area: null,
  departamento: '',
  provincia: '',
  municipio: '',
  direccion: '',
  latitud: null,
  longitud: null
})

const loading = ref(false)
const errorMessage = ref('')

onMounted(() => {
  formData.nombre = props.almacen.nombre || ''
  formData.capacidadMaxima = props.almacen.capacidadMaxima || null
  formData.area = props.almacen.area || null
  formData.departamento = props.almacen.departamento || ''
  formData.provincia = props.almacen.provincia || ''
  formData.municipio = props.almacen.municipio || ''
  formData.direccion = props.almacen.direccion || ''
  formData.latitud = props.almacen.latitud || null
  formData.longitud = props.almacen.longitud || null
})

const handleSubmit = async () => {
  errorMessage.value = ''
  
  // Validaciones básicas
  if (!formData.nombre || !formData.capacidadMaxima) {
    errorMessage.value = 'Por favor completa los campos requeridos'
    return
  }

  loading.value = true

  try {
    const result = await almacenStore.value.updateAlmacen(formData)
    
    if (result.success) {
      emit('saved')
    } else {
      errorMessage.value = result.message || 'Error al actualizar el almacén'
    }
  } catch (error) {
    errorMessage.value = error.message || 'Error al actualizar el almacén'
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  if (!loading.value) {
    emit('close')
  }
}
</script>

<template>
  <div class="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div class="bg-surface rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col z-10000">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-border bg-hover">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary/10 center">
            <Warehouse class="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-neutral">Editar Almacén</h2>
            <p class="text-sm text-secondary">Actualiza la información de tu almacén</p>
          </div>
        </div>
        <button 
          @click="handleClose" 
          class="w-8 h-8 rounded-lg hover:bg-hover center transition-colors"
          :disabled="loading"
        >
          <X class="w-5 h-5 text-secondary" />
        </button>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleSubmit" class="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-custom">
        
        <!-- Alerta de error -->
        <div v-if="errorMessage" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle class="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="text-sm font-medium text-red-800 dark:text-red-200">{{ errorMessage }}</p>
          </div>
        </div>

        <!-- Información Básica -->
        <div class="space-y-4">
          <h3 class="text-sm font-semibold text-neutral uppercase tracking-wide">Información Básica</h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-neutral mb-2">
                Nombre del Almacén <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.nombre"
                type="text"
                required
                class="input w-full"
                placeholder="Ej: Almacén Principal"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral mb-2">
                Capacidad Máxima (toneladas) <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="formData.capacidadMaxima"
                type="number"
                step="0.001"
                min="0"
                required
                class="input w-full"
                placeholder="Ej: 500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral mb-2">
                Área (m²)
              </label>
              <input
                v-model.number="formData.area"
                type="number"
                step="0.01"
                min="0"
                class="input w-full"
                placeholder="Ej: 1000"
              />
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Ubicación -->
        <div class="space-y-4">
          <h3 class="text-sm font-semibold text-neutral uppercase tracking-wide flex items-center gap-2">
            <MapPin class="w-4 h-4" />
            Ubicación
          </h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-neutral mb-2">Departamento</label>
              <input
                v-model="formData.departamento"
                type="text"
                class="input w-full"
                placeholder="Ej: La Paz"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral mb-2">Provincia</label>
              <input
                v-model="formData.provincia"
                type="text"
                class="input w-full"
                placeholder="Ej: Murillo"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral mb-2">Municipio</label>
              <input
                v-model="formData.municipio"
                type="text"
                class="input w-full"
                placeholder="Ej: La Paz"
              />
            </div>

            <div class="sm:col-span-3">
              <label class="block text-sm font-medium text-neutral mb-2">Dirección</label>
              <textarea
                v-model="formData.direccion"
                rows="2"
                class="input w-full"
                placeholder="Ej: Av. 6 de Agosto #2100"
              ></textarea>
            </div>

            <div class="sm:col-span-3">
              <label class="block text-sm font-medium text-neutral mb-2">Coordenadas GPS</label>
              <div class="grid grid-cols-2 gap-4">
                <input
                  v-model.number="formData.latitud"
                  type="number"
                  step="0.000001"
                  class="input w-full"
                  placeholder="Latitud (Ej: -16.500000)"
                />
                <input
                  v-model.number="formData.longitud"
                  type="number"
                  step="0.000001"
                  class="input w-full"
                  placeholder="Longitud (Ej: -68.150000)"
                />
              </div>
              <p class="text-xs text-secondary mt-1">
                Puedes obtener las coordenadas desde Google Maps haciendo clic derecho en la ubicación
              </p>
            </div>
          </div>
        </div>
      </form>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 p-6 border-t border-border bg-hover">
        <button 
          type="button" 
          @click="handleClose" 
          class="btn-outline"
          :disabled="loading"
        >
          Cancelar
        </button>
        <button 
          @click="handleSubmit"
          class="btn flex items-center gap-2"
          :disabled="loading"
        >
          <Save class="w-4 h-4" />
          <span>{{ loading ? 'Guardando...' : 'Guardar Cambios' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>