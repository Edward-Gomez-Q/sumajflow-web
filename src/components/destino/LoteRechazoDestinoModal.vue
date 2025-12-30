<!-- src/components/destino/LoteRechazoDestinoModal.vue -->
<script setup>
import { ref, computed } from 'vue'
import { useLotesDestinoStore } from '@/stores/destino/lotesDestinoStore'
import { 
  X, 
  XCircle, 
  AlertCircle,
  Loader2,
  PackageCheck
} from 'lucide-vue-next'

const props = defineProps({
  lote: {
    type: Object,
    required: true
  },
  tipoDestino: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'success'])

const lotesStore = useLotesDestinoStore()

const loading = ref(false)
const errors = ref({})
const successMessage = ref('')

// Form data
const formData = ref({
  motivoRechazo: ''
})

const nombreDestino = computed(() => {
  return props.tipoDestino === 'ingenio' ? 'Ingenio Minero' : 'Comercializadora'
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

// Motivos predefinidos según el tipo de destino
const motivosPredefinidos = computed(() => {
  if (props.tipoDestino === 'ingenio') {
    return [
      'Planta sin capacidad disponible actualmente',
      'No procesamos este tipo de mineral',
      'Mantenimiento programado de la planta',
      'Falta documentación técnica requerida',
      'Ley del mineral no cumple con nuestros estándares'
    ]
  } else {
    return [
      'No hay espacio disponible en almacén',
      'No estamos comprando este tipo de mineral actualmente',
      'Precio del mercado no favorable',
      'Falta certificación requerida',
      'Capacidad de compra mensual alcanzada'
    ]
  }
})

const seleccionarMotivoPredefinido = (motivo) => {
  formData.value.motivoRechazo = motivo
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      @click.self="emit('close')"
    >
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-2xl border border-border my-8">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-hover">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-red-500 center">
              <XCircle class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 class="text-xl font-semibold text-neutral">Rechazar Lote #{{ lote.id }}</h2>
              <p class="text-sm text-secondary mt-0.5">Especifica el motivo del rechazo</p>
            </div>
          </div>
          <button
            @click="emit('close')"
            class="w-8 h-8 rounded-lg hover:bg-surface transition-colors center text-secondary hover:text-neutral"
            :disabled="loading"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="p-4 sm:p-6 space-y-6">
          <!-- Success Message -->
          <div v-if="successMessage" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div class="flex items-center gap-2">
              <XCircle class="w-5 h-5 text-green-600 dark:text-green-400" />
              <p class="text-sm text-green-800 dark:text-green-200 font-medium">
                {{ successMessage }}
              </p>
            </div>
          </div>

          <!-- Error General -->
          <div v-if="errors.submit" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div class="flex gap-2">
              <AlertCircle class="w-5 h-5 text-error shrink-0 mt-0.5" />
              <p class="text-sm text-error">{{ errors.submit }}</p>
            </div>
          </div>

          <!-- Resumen del Lote -->
          <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <h3 class="font-semibold text-red-900 dark:text-red-200 mb-3 flex items-center gap-2">
              <PackageCheck class="w-5 h-5" />
              Información del Lote a Rechazar
            </h3>
            <div class="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p class="text-xs text-red-700 dark:text-red-400">Mina</p>
                <p class="font-medium text-red-900 dark:text-red-200">{{ lote.minaNombre }}</p>
              </div>
              <div>
                <p class="text-xs text-red-700 dark:text-red-400">Socio</p>
                <p class="font-medium text-red-900 dark:text-red-200">{{ lote.socioNombre }}</p>
              </div>
              <div>
                <p class="text-xs text-red-700 dark:text-red-400">Camiones solicitados</p>
                <p class="font-medium text-red-900 dark:text-red-200">{{ lote.camionlesSolicitados }}</p>
              </div>
              <div>
                <p class="text-xs text-red-700 dark:text-red-400">Tipo de mineral</p>
                <p class="font-medium text-red-900 dark:text-red-200 capitalize">{{ lote.tipoMineral }}</p>
              </div>
            </div>
          </div>

          <!-- Motivos Predefinidos -->
          <div class="input-group">
            <label class="input-label">Motivos comunes (clic para usar)</label>
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
              Este motivo será visible para el socio y la cooperativa. Sé claro y específico (mínimo 10 caracteres).
            </p>
          </div>

          <!-- Advertencia -->
          <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 class="font-semibold text-yellow-900 dark:text-yellow-200 mb-2 flex items-center gap-2">
              <AlertCircle class="w-5 h-5" />
              ⚠️ Esta acción es irreversible
            </h4>
            <p class="text-sm text-yellow-800 dark:text-yellow-300">
              Al rechazar este lote, el socio y la cooperativa serán notificados inmediatamente.
              El lote pasará a estado <strong>"Rechazado por destino"</strong> y no podrá continuar
              con el proceso. El socio deberá crear un nuevo lote si desea realizar el transporte.
            </p>
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
              class="flex-1 btn bg-red-600 hover:bg-red-700"
              :disabled="loading"
            >
              <Loader2 class="w-4 h-4 animate-spin" v-if="loading" />
              <XCircle class="w-4 h-4" v-else />
              <span>{{ loading ? 'Rechazando...' : 'Confirmar Rechazo' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>