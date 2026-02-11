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

// ✅ Usar snake_case para que coincida con BalanceConfig
const formData = reactive({
  nombre: '',
  marca: '',
  modelo: '',
  numero_serie: '',
  capacidad_maxima: 0,
  precision_minima: 0,
  fecha_ultima_calibracion: '',
  fecha_proxima_calibracion: '',
  departamento: '',
  provincia: '',
  municipio: '',
  direccion: '',
  latitud: null,
  longitud: null
})

const saving = ref(false)
const errorMessage = ref('')

// ✅ Convertir de camelCase a snake_case al cargar
watch(() => props.balanza, (newBalanza) => {
  if (newBalanza) {
    Object.assign(formData, {
      nombre: newBalanza.nombre || '',
      marca: newBalanza.marca || '',
      modelo: newBalanza.modelo || '',
      numero_serie: newBalanza.numeroSerie || '',
      capacidad_maxima: newBalanza.capacidadMaxima || 0,
      precision_minima: newBalanza.precisionMinima || 0,
      fecha_ultima_calibracion: newBalanza.fechaUltimaCalibracion || '',
      fecha_proxima_calibracion: newBalanza.fechaProximaCalibracion || '',
      departamento: newBalanza.departamento || '',
      provincia: newBalanza.provincia || '',
      municipio: newBalanza.municipio || '',
      direccion: newBalanza.direccion || '',
      latitud: newBalanza.latitud,
      longitud: newBalanza.longitud
    })
  }
}, { immediate: true })

// ✅ Manejar las actualizaciones del formulario
const handleFormUpdate = (updatedData) => {
  // Actualizar formData con los nuevos valores
  Object.assign(formData, updatedData)
  
  // 🔍 DEBUG - ver qué se está actualizando
  console.log('📝 Formulario actualizado:', { ...formData })
}

const handleSave = async () => {
  errorMessage.value = ''
  
  // 🔍 DEBUG - ver qué se va a guardar
  console.log('💾 Intentando guardar:', { ...formData })
  
  if (!formData.nombre || !formData.marca || !formData.modelo || !formData.numero_serie) {
    errorMessage.value = 'Todos los campos básicos son requeridos'
    return
  }

  if (formData.capacidad_maxima <= 0 || formData.precision_minima <= 0) {
    errorMessage.value = 'Capacidad y precisión deben ser mayores a 0'
    return
  }

  if (!formData.fecha_ultima_calibracion || !formData.fecha_proxima_calibracion) {
    errorMessage.value = 'Las fechas de calibración son requeridas'
    return
  }

  const fechaUltima = new Date(formData.fecha_ultima_calibracion)
  const fechaProxima = new Date(formData.fecha_proxima_calibracion)
  
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
    // ✅ Convertir de snake_case a camelCase al guardar
    const dataToSave = {
      nombre: formData.nombre,
      marca: formData.marca,
      modelo: formData.modelo,
      numeroSerie: formData.numero_serie,
      capacidadMaxima: formData.capacidad_maxima,
      precisionMinima: formData.precision_minima,
      fechaUltimaCalibracion: formData.fecha_ultima_calibracion,
      fechaProximaCalibracion: formData.fecha_proxima_calibracion,
      departamento: formData.departamento,
      provincia: formData.provincia,
      municipio: formData.municipio,
      direccion: formData.direccion,
      latitud: formData.latitud,
      longitud: formData.longitud
    }

    console.log('📤 Enviando al backend:', dataToSave)

    const result = await store.updateBalanza(dataToSave)
    
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

          <!-- Formulario - ✅ Usar @update:modelValue en lugar de v-model -->
          <BalanceConfig
            :model-value="formData"
            @update:model-value="handleFormUpdate"
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