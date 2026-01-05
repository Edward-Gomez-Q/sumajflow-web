<!-- src/components/balance/BalanzaEditModal.vue -->
<script setup>
import { ref, reactive, watch } from 'vue'
import { X, Save, AlertCircle } from 'lucide-vue-next'
import BalanceConfig from '../onboarding/shared/BalanceConfig.vue'
import { useBalanzaCooperativaStore } from '@/stores/cooperativa/balanzaStore'
import { useBalanzaIngenioStore } from '@/stores/ingenio/balanzaStore'
import { useBalanzaComercializadoraStore } from '@/stores/comercializadora/balanzaStore'

const props = defineProps({
  balanza: {
    type: Object,
    required: true
  },
  tipoEntidad: {
    type: String,
    required: true,
    validator: (value) => ['cooperativa', 'ingenio', 'comercializadora'].includes(value)
  }
})

const emit = defineEmits(['close', 'saved'])

const getStore = () => {
  switch (props.tipoEntidad) {
    case 'cooperativa':
      return useBalanzaCooperativaStore()
    case 'ingenio':
      return useBalanzaIngenioStore()
    case 'comercializadora':
      return useBalanzaComercializadoraStore()
  }
}

const store = getStore()

const formData = reactive({
  nombre: '',
  marca: '',
  modelo: '',
  numeroSerie: '',
  capacidadMaxima: 0,
  precisionMinima: 0,
  fechaUltimaCalibracion: '',
  fechaProximaCalibracion: '',
  departamento: '',
  provincia: '',
  municipio: '',
  direccion: '',
  latitud: null,
  longitud: null
})

const saving = ref(false)
const errorMessage = ref('')

watch(() => props.balanza, (newBalanza) => {
  if (newBalanza) {
    Object.assign(formData, {
      nombre: newBalanza.nombre || '',
      marca: newBalanza.marca || '',
      modelo: newBalanza.modelo || '',
      numeroSerie: newBalanza.numeroSerie || '',
      capacidadMaxima: newBalanza.capacidadMaxima || 0,
      precisionMinima: newBalanza.precisionMinima || 0,
      fechaUltimaCalibracion: newBalanza.fechaUltimaCalibracion || '',
      fechaProximaCalibracion: newBalanza.fechaProximaCalibracion || '',
      departamento: newBalanza.departamento || '',
      provincia: newBalanza.provincia || '',
      municipio: newBalanza.municipio || '',
      direccion: newBalanza.direccion || '',
      latitud: newBalanza.latitud,
      longitud: newBalanza.longitud
    })
  }
}, { immediate: true })

const handleSave = async () => {
  errorMessage.value = ''
  
  if (!formData.nombre || !formData.marca || !formData.modelo || !formData.numeroSerie) {
    errorMessage.value = 'Todos los campos básicos son requeridos'
    return
  }

  if (formData.capacidadMaxima <= 0 || formData.precisionMinima <= 0) {
    errorMessage.value = 'Capacidad y precisión deben ser mayores a 0'
    return
  }

  if (!formData.fechaUltimaCalibracion || !formData.fechaProximaCalibracion) {
    errorMessage.value = 'Las fechas de calibración son requeridas'
    return
  }

  const fechaUltima = new Date(formData.fechaUltimaCalibracion)
  const fechaProxima = new Date(formData.fechaProximaCalibracion)
  
  if (fechaProxima <= fechaUltima) {
    errorMessage.value = 'La fecha de próxima calibración debe ser posterior a la última'
    return
  }

  if (!formData.direccion || !formData.latitud || !formData.longitud) {
    errorMessage.value = 'La ubicación es requerida'
    return
  }

  saving.value = true

  try {
    const result = await store.updateBalanza(formData)
    
    if (result.success) {
      emit('saved')
    } else {
      errorMessage.value = result.message || 'Error al actualizar la balanza'
    }
  } catch (error) {
    errorMessage.value = error.message || 'Error al actualizar la balanza'
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  if (!saving.value) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <div 
      class="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      @click.self="handleClose"
    >
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-4xl border border-border max-h-[90vh] flex flex-col">
        <!-- Header -->
        <div class="p-4 sm:p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 class="text-xl sm:text-2xl font-semibold text-neutral">Editar Balanza</h2>
            <p class="text-sm text-secondary mt-1">Actualiza la información de tu balanza</p>
          </div>
          <button
            @click="handleClose"
            :disabled="saving"
            class="w-8 h-8 rounded-lg hover:bg-hover center transition-colors"
          >
            <X class="w-5 h-5 text-secondary" />
          </button>
        </div>

        <!-- Contenido -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-custom">
          <!-- Mensaje de error -->
          <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400/60 rounded-lg">
            <div class="flex items-start gap-2">
              <AlertCircle class="w-4 h-4 text-red-700 dark:text-red-300 shrink-0 mt-0.5" />
              <p class="text-sm text-red-700 dark:text-red-300">{{ errorMessage }}</p>
            </div>
          </div>

          <!-- Formulario -->
          <BalanceConfig
            v-model="formData"
            title=""
            :entity-name="tipoEntidad"
          />
        </div>

        <!-- Footer -->
        <div class="p-4 sm:p-6 border-t border-border flex gap-3 justify-end">
          <button
            @click="handleClose"
            :disabled="saving"
            class="px-4 py-2 rounded-lg font-medium transition-colors hover:bg-hover text-neutral"
          >
            Cancelar
          </button>
          <button
            @click="handleSave"
            :disabled="saving"
            class="btn flex items-center gap-2"
          >
            <Save class="w-4 h-4" />
            <span>{{ saving ? 'Guardando...' : 'Guardar Cambios' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>