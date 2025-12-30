<!-- src/components/cooperativa/LoteAprobacionModal.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useLotesCooperativaStore } from '@/stores/cooperativa/lotesCooperativaStore'
import { 
  X, 
  CheckCircle2, 
  Calendar, 
  Truck, 
  AlertCircle,
  Loader2
} from 'lucide-vue-next'
import TransportistaSelector from './TransportistaSelector.vue'

const props = defineProps({
  lote: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'success'])

const lotesStore = useLotesCooperativaStore()

const loading = ref(false)
const errors = ref({})
const successMessage = ref('')

// Form data
const formData = ref({
  asignaciones: [],
  fechaAsignacion: '',
  observaciones: ''
})

onMounted(async () => {
  await lotesStore.fetchTransportistasDisponibles()
  
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  formData.value.fechaAsignacion = tomorrow.toISOString().split('T')[0]
})

const transportistasOrdenados = computed(() => {
  return [...lotesStore.transportistasDisponibles].sort((a, b) => {
    if (b.calificacionPromedio !== a.calificacionPromedio) {
      return (b.calificacionPromedio || 0) - (a.calificacionPromedio || 0)
    }
    return b.viajesCompletados - a.viajesCompletados
  })
})

const validate = () => {
  errors.value = {}

  if (formData.value.asignaciones.length !== props.lote.camionlesSolicitados) {
    errors.value.asignaciones = `Debes seleccionar exactamente ${props.lote.camionlesSolicitados} transportista(s)`
  }

  if (!formData.value.fechaAsignacion) {
    errors.value.fechaAsignacion = 'La fecha de asignación es requerida'
  } else {
    const fecha = new Date(formData.value.fechaAsignacion)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    if (fecha < hoy) {
      errors.value.fechaAsignacion = 'La fecha no puede ser anterior a hoy'
    }
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validate()) return

  loading.value = true
  successMessage.value = ''

  const result = await lotesStore.aprobarLote(props.lote.id, formData.value)

  if (result.success) {
    successMessage.value = result.message || 'Lote aprobado exitosamente'
    setTimeout(() => {
      emit('success')
      emit('close')
    }, 1500)
  } else {
    errors.value.submit = result.error
  }

  loading.value = false
}

const asignacionesValidas = computed(() => {
  return formData.value.asignaciones.length === props.lote.camionlesSolicitados
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      @click.self="emit('close')"
    >
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] border border-border flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-hover shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center shrink-0">
              <CheckCircle2 class="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 class="text-xl font-semibold text-neutral">Aprobar Lote #{{ lote.id }}</h2>
              <p class="text-sm text-secondary mt-0.5">Asigna transportistas y confirma la aprobación</p>
            </div>
          </div>
          <button
            @click="emit('close')"
            class="w-10 h-10 rounded-lg hover:bg-surface transition-colors flex items-center justify-center text-secondary hover:text-neutral"
            :disabled="loading"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="flex-1 overflow-y-auto scrollbar-custom">
          <div class="p-4 sm:p-6 space-y-6">
            <!-- Success Message -->
            <div v-if="successMessage" class="bg-green-500 rounded-lg p-4 shadow-sm">
              <div class="flex items-start gap-3">
                <CheckCircle2 class="w-6 h-6 text-white shrink-0 mt-0.5" />
                <p class="text-sm text-white font-medium">
                  {{ successMessage }}
                </p>
              </div>
            </div>

            <!-- Error General -->
            <div v-if="errors.submit" class="bg-red-500 rounded-lg p-4 shadow-sm">
              <div class="flex items-start gap-3">
                <AlertCircle class="w-6 h-6 text-white shrink-0 mt-0.5" />
                <p class="text-sm text-white">{{ errors.submit }}</p>
              </div>
            </div>

            <!-- Resumen del Lote -->
            <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
              <h3 class="font-semibold text-neutral mb-3 flex items-center gap-2">
                <Truck class="w-5 h-5 text-primary" />
                Resumen del Lote
              </h3>
              <div class="grid sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p class="text-xs text-secondary">Mina</p>
                  <p class="font-medium text-neutral">{{ lote.minaNombre }}</p>
                </div>
                <div>
                  <p class="text-xs text-secondary">Socio</p>
                  <p class="font-medium text-neutral">{{ lote.socioNombre }}</p>
                </div>
                <div>
                  <p class="text-xs text-secondary">Destino</p>
                  <p class="font-medium text-neutral truncate" :title="lote.destinoNombre">
                    {{ lote.destinoNombre }}
                  </p>
                </div>
              </div>
              <div class="mt-3 pt-3 border-t border-border">
                <p class="text-xs text-secondary mb-1">Minerales</p>
                <div class="flex gap-1 flex-wrap">
                  <span
                    v-for="(mineral, index) in lote.minerales"
                    :key="index"
                    class="px-2 py-0.5 rounded text-xs bg-blue-500 text-white font-medium"
                  >
                    {{ mineral }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Selección de Transportistas -->
            <div class="input-group">
              <label class="input-label flex items-center gap-2">
                <Truck class="w-4 h-4 text-primary" />
                Asignar Transportistas
                <span class="text-xs text-tertiary">
                  ({{ lote.camionlesSolicitados }} camión/es requerido/s)
                </span>
              </label>

              <!-- Loading transportistas -->
              <div v-if="lotesStore.loadingTransportistas" class="text-center py-8">
                <Loader2 class="w-8 h-8 animate-spin mx-auto text-primary" />
                <p class="text-sm text-secondary mt-2">Cargando transportistas...</p>
              </div>

              <!-- Selector -->
              <TransportistaSelector
                v-else
                v-model="formData.asignaciones"
                :transportistas="transportistasOrdenados"
                :cantidad-requerida="lote.camionlesSolicitados"
              />

              <p v-if="errors.asignaciones" class="input-error">{{ errors.asignaciones }}</p>
              
              <!-- Indicador de progreso -->
              <div v-if="!lotesStore.loadingTransportistas" class="mt-2">
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-secondary">Progreso de selección</span>
                  <span class="font-medium" 
                    :class="asignacionesValidas ? 'text-green-600' : 'text-yellow-600'"
                  >
                    {{ formData.asignaciones.length }} / {{ lote.camionlesSolicitados }}
                  </span>
                </div>
                <div class="w-full bg-border rounded-full h-2 overflow-hidden">
                  <div 
                    class="h-full transition-all duration-300"
                    :class="asignacionesValidas ? 'bg-green-500' : 'bg-yellow-500'"
                    :style="{ width: `${(formData.asignaciones.length / lote.camionlesSolicitados) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Fecha de Asignación -->
            <div class="input-group">
              <label class="input-label flex items-center gap-2">
                <Calendar class="w-4 h-4 text-primary" />
                Fecha Tentativa de Inicio de Transporte
              </label>
              <input
                v-model="formData.fechaAsignacion"
                type="date"
                :class="{ 'border-error': errors.fechaAsignacion }"
                :min="new Date().toISOString().split('T')[0]"
              />
              <p v-if="errors.fechaAsignacion" class="input-error">{{ errors.fechaAsignacion }}</p>
              <p v-else class="input-helper">
                Fecha en la que se espera iniciar el transporte del mineral
              </p>
            </div>

            <!-- Observaciones -->
            <div class="input-group">
              <label class="input-label">Observaciones (Opcional)</label>
              <textarea
                v-model="formData.observaciones"
                rows="3"
                placeholder="Agrega observaciones sobre la aprobación..."
                class="resize-none"
              ></textarea>
              <p class="input-helper">
                Ejemplo: "Iniciar carga en horario matutino", "Contactar con el ingenio antes de salir"
              </p>
            </div>

            <!-- Confirmación -->
            <div class="bg-blue-500 rounded-lg p-4 shadow-sm">
              <div class="flex items-start gap-3">
                <AlertCircle class="w-6 h-6 text-white shrink-0 mt-0.5" />
                <div class="flex-1">
                  <h4 class="font-semibold text-white mb-2">
                    Confirma la aprobación
                  </h4>
                  <p class="text-sm text-white/95">
                    Al aprobar este lote, se asignarán los transportistas seleccionados y se notificará al socio 
                    y al destino ({{ lote.destinoTipo === 'Ingenio Minero' ? 'ingenio minero' : 'comercializadora' }}).
                    El lote pasará a estado <strong>"Pendiente de aprobación por {{ lote.destinoTipo }}"</strong>.
                  </p>
                </div>
              </div>
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
                class="flex-1 btn bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                :disabled="loading || !asignacionesValidas"
              >
                <Loader2 class="w-4 h-4 animate-spin" v-if="loading" />
                <CheckCircle2 class="w-4 h-4" v-else />
                <span>{{ loading ? 'Aprobando...' : 'Aprobar Lote' }}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>