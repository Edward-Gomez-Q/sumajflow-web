<!-- src/components/destino/LoteAprobacionDestinoModal.vue -->
<script setup>
import { ref, computed } from 'vue'
import { useLotesDestinoStore } from '@/stores/destino/lotesDestinoStore'
import { 
  X, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  PackageCheck,
  Truck,
  MapPin,
  Building2
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
  observaciones: ''
})

const nombreDestino = computed(() => {
  return props.tipoDestino === 'ingenio' ? 'Ingenio Minero' : 'Comercializadora'
})

const validate = () => {
  errors.value = {}
  // Observaciones son opcionales, así que no hay validación requerida
  return true
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
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      @click.self="emit('close')"
    >
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-3xl border border-border my-8">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-hover">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-500 center">
              <CheckCircle2 class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 class="text-xl font-semibold text-neutral">Aprobar Lote #{{ lote.id }}</h2>
              <p class="text-sm text-secondary mt-0.5">Confirma la aprobación como {{ nombreDestino }}</p>
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
              <CheckCircle2 class="w-5 h-5 text-green-600 dark:text-green-400" />
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
          <div class="bg-hover rounded-lg p-4 border border-border">
            <h3 class="font-semibold text-neutral mb-3 flex items-center gap-2">
              <PackageCheck class="w-5 h-5 text-primary" />
              Resumen del Lote
            </h3>
            <div class="grid sm:grid-cols-2 gap-3 text-sm">
              <div class="flex items-center gap-2">
                <MapPin class="w-4 h-4 text-secondary" />
                <div>
                  <p class="text-xs text-secondary">Mina</p>
                  <p class="font-medium text-neutral">{{ lote.minaNombre }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Building2 class="w-4 h-4 text-secondary" />
                <div>
                  <p class="text-xs text-secondary">Socio</p>
                  <p class="font-medium text-neutral">{{ lote.socioNombre }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Truck class="w-4 h-4 text-secondary" />
                <div>
                  <p class="text-xs text-secondary">Camiones</p>
                  <p class="font-medium text-neutral">{{ lote.camionlesSolicitados }}</p>
                </div>
              </div>
              <div>
                <p class="text-xs text-secondary">Tipo de Mineral</p>
                <p class="font-medium text-neutral capitalize">{{ lote.tipoMineral }}</p>
              </div>
            </div>
            <div class="mt-3 pt-3 border-t border-border">
              <p class="text-xs text-secondary mb-1">Minerales</p>
              <div class="flex gap-1 flex-wrap">
                <span
                  v-for="(mineral, index) in lote.minerales"
                  :key="index"
                  class="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary font-medium"
                >
                  {{ mineral }}
                </span>
              </div>
            </div>
          </div>

          <!-- Transportistas Asignados -->
          <div v-if="lote.transportistasAsignados && lote.transportistasAsignados.length > 0" 
            class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 class="font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
              <Truck class="w-5 h-5" />
              Transportistas Asignados
            </h3>
            <div class="grid gap-2">
              <div
                v-for="transportista in lote.transportistasAsignados"
                :key="transportista.asignacionId"
                class="flex items-center gap-3 bg-white dark:bg-blue-950 rounded-lg p-2"
              >
                <div class="w-8 h-8 rounded-lg bg-primary center shrink-0">
                  <span class="text-white font-bold text-sm">#{{ transportista.numeroCamion }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-blue-900 dark:text-blue-200 text-sm">
                    {{ transportista.nombreCompleto }}
                  </p>
                  <p class="text-xs text-blue-700 dark:text-blue-300">
                    {{ transportista.placaVehiculo }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Observaciones -->
          <div class="input-group">
            <label class="input-label">
              Observaciones (Opcional)
            </label>
            <textarea
              v-model="formData.observaciones"
              rows="4"
              placeholder="Agrega observaciones sobre la aprobación..."
              class="resize-none"
            ></textarea>
            <p class="input-helper">
              Ejemplo: "{{ tipoDestino === 'ingenio' 
                ? 'Planta lista para procesar. Coordinar horario de llegada' 
                : 'Almacén preparado. Pueden iniciar el transporte' }}"
            </p>
          </div>

          <!-- Confirmación -->
          <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 class="font-semibold text-green-900 dark:text-green-200 mb-2">
              ✅ Confirma la aprobación
            </h4>
            <p class="text-sm text-green-800 dark:text-green-300">
              Al aprobar este lote, se notificará al socio y a la cooperativa que el lote está 
              <strong>completamente aprobado</strong> y listo para iniciar el transporte. 
              El estado cambiará a <strong>"Aprobado - Pendiente de iniciar"</strong>.
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
              class="flex-1 btn bg-green-600 hover:bg-green-700"
              :disabled="loading"
            >
              <Loader2 class="w-4 h-4 animate-spin" v-if="loading" />
              <CheckCircle2 class="w-4 h-4" v-else />
              <span>{{ loading ? 'Aprobando...' : 'Aprobar Lote' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>