<!-- src/components/cooperativa/LoteRechazoModal.vue -->
<script setup>
import { ref } from 'vue'
import { useLotesCooperativaStore } from '@/stores/cooperativa/lotesCooperativaStore'
import { 
  X, 
  XCircle, 
  AlertCircle,
  Loader2
} from 'lucide-vue-next'

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
  motivoRechazo: ''
})

const validate = () => {
  errors.value = {}

  if (!formData.value.motivoRechazo || formData.value.motivoRechazo.trim() === '') {
    errors.value.motivoRechazo = 'El motivo de rechazo es requerido'
  } else if (formData.value.motivoRechazo.trim().length < 10) {
    errors.value.motivoRechazo = 'El motivo debe tener al menos 10 caracteres'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validate()) return

  loading.value = true
  successMessage.value = ''

  const result = await lotesStore.rechazarLote(props.lote.id, formData.value)

  if (result.success) {
    successMessage.value = result.message || 'Lote rechazado exitosamente'
    setTimeout(() => {
      emit('success')
      emit('close')
    }, 1500)
  } else {
    errors.value.submit = result.error
  }

  loading.value = false
}

// Motivos predefinidos
const motivosPredefinidos = [
  'No hay transportistas disponibles en este momento',
  'El peso estimado excede nuestra capacidad actual',
  'La fecha solicitada no es viable',
  'Falta documentación requerida',
  'El destino no está operativo',
  'Conflicto con otros lotes programados'
]

const seleccionarMotivoPredefinido = (motivo) => {
  formData.value.motivoRechazo = motivo
}
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
            <div class="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center shrink-0">
              <XCircle class="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 class="text-xl font-semibold text-neutral">Rechazar Lote #{{ lote.id }}</h2>
              <p class="text-sm text-secondary mt-0.5">Especifica el motivo del rechazo</p>
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
                <XCircle class="w-6 h-6 text-white shrink-0 mt-0.5" />
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
            <div class="bg-red-500 rounded-lg p-4 shadow-sm">
              <h3 class="font-semibold text-white mb-3">
                Información del Lote a Rechazar
              </h3>
              <div class="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p class="text-xs text-white/70">Mina</p>
                  <p class="font-medium text-white">{{ lote.minaNombre }}</p>
                </div>
                <div>
                  <p class="text-xs text-white/70">Socio</p>
                  <p class="font-medium text-white">{{ lote.socioNombre }}</p>
                </div>
                <div>
                  <p class="text-xs text-white/70">Camiones solicitados</p>
                  <p class="font-medium text-white">{{ lote.camionlesSolicitados }}</p>
                </div>
                <div>
                  <p class="text-xs text-white/70">Tipo de operación</p>
                  <p class="font-medium text-white">
                    {{ lote.tipoOperacion === 'procesamiento_planta' ? 'Procesamiento' : 'Venta Directa' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Motivos Predefinidos -->
            <div class="input-group">
              <label class="input-label">Motivos comunes (opcional - clic para usar)</label>
              <div class="grid gap-2">
                <button
                  v-for="(motivo, index) in motivosPredefinidos"
                  :key="index"
                  type="button"
                  @click="seleccionarMotivoPredefinido(motivo)"
                  class="text-left px-3 py-2 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-sm text-secondary hover:text-neutral"
                >
                  {{ motivo }}
                </button>
              </div>
            </div>

            <!-- Motivo de Rechazo -->
            <div class="input-group">
              <label class="input-label">
                Motivo de Rechazo *
              </label>
              <textarea
                v-model="formData.motivoRechazo"
                rows="5"
                placeholder="Explica por qué se rechaza este lote..."
                class="resize-none"
                :class="{ 'border-error': errors.motivoRechazo }"
              ></textarea>
              <p v-if="errors.motivoRechazo" class="input-error">{{ errors.motivoRechazo }}</p>
              <p v-else class="input-helper">
                Este motivo será visible para el socio. Sé claro y específico (mínimo 10 caracteres).
              </p>
            </div>

            <!-- Advertencia -->
            <div class="bg-yellow-500 rounded-lg p-4 shadow-sm">
              <div class="flex items-start gap-3">
                <AlertCircle class="w-6 h-6 text-white shrink-0 mt-0.5" />
                <div class="flex-1">
                  <h4 class="font-semibold text-white mb-2">
                    Esta acción es irreversible
                  </h4>
                  <p class="text-sm text-white/95">
                    Al rechazar este lote, el socio será notificado inmediatamente con el motivo especificado.
                    El lote pasará a estado <strong>"Rechazado"</strong> y no podrá ser procesado. El socio
                    deberá crear un nuevo lote si desea realizar el transporte.
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
                class="flex-1 btn bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2"
                :disabled="loading"
              >
                <Loader2 class="w-4 h-4 animate-spin" v-if="loading" />
                <XCircle class="w-4 h-4" v-else />
                <span>{{ loading ? 'Rechazando...' : 'Confirmar Rechazo' }}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>