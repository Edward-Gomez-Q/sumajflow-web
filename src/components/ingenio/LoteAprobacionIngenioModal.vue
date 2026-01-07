<!-- src/components/ingenio/LoteAprobacionIngenioModal.vue -->
<script setup>
import { ref } from 'vue'
import { useLotesIngenioStore } from '@/stores/ingenio/lotesIngenioStore'
import { 
  X, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  PackageCheck
} from 'lucide-vue-next'

const props = defineProps({
  lote: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'success'])

const lotesStore = useLotesIngenioStore()

const loading = ref(false)
const errors = ref({})
const successMessage = ref('')

// Form data
const formData = ref({
  observaciones: ''
})

const validate = () => {
  errors.value = {}
  // Las observaciones son opcionales
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
      class="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      @click.self="emit('close')"
    >
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] border border-border flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-hover shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center shrink-0">
              <CheckCircle2 class="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 class="text-xl font-semibold text-neutral">Aprobar Lote #{{ lote.id }}</h2>
              <p class="text-sm text-secondary mt-0.5">Confirma la aprobación del lote</p>
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
            <div class="bg-green-500 rounded-lg p-4 shadow-sm">
              <div class="flex items-start gap-3">
                <PackageCheck class="w-6 h-6 text-white shrink-0 mt-0.5" />
                <div class="flex-1">
                  <h3 class="font-semibold text-white mb-3">
                    Información del Lote a Aprobar
                  </h3>
                  <div class="grid sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p class="text-xs text-white/70">Cooperativa</p>
                      <p class="font-medium text-white">{{ lote.cooperativaNombre }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-white/70">Socio</p>
                      <p class="font-medium text-white">{{ lote.socioNombres }} {{ lote.socioApellidos }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-white/70">Mina</p>
                      <p class="font-medium text-white">{{ lote.minaNombre }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-white/70">Camiones asignados</p>
                      <p class="font-medium text-white">{{ lote.camioneAsignados || 0 }} / {{ lote.camionlesSolicitados }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-white/70">Tipo de operación</p>
                      <p class="font-medium text-white">
                        {{ lote.tipoOperacion === 'procesamiento_planta' ? 'Procesamiento' : 'Venta Directa' }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-white/70">Tipo de mineral</p>
                      <p class="font-medium text-white capitalize">{{ lote.tipoMineral }}</p>
                    </div>
                  </div>
                  <div class="mt-3 pt-3 border-t border-white/20">
                    <p class="text-xs text-white/70 mb-1">Minerales</p>
                    <div class="flex gap-1 flex-wrap">
                      <span
                        v-for="mineral in lote.minerales"
                        :key="mineral.id"
                        class="px-2 py-0.5 rounded text-xs bg-white/20 text-white font-medium"
                      >
                        {{ mineral.nombre }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Observaciones -->
            <div class="input-group">
              <label class="input-label">Observaciones (Opcional)</label>
              <textarea
                v-model="formData.observaciones"
                rows="4"
                placeholder="Agrega observaciones sobre la aprobación..."
                class="resize-none"
              ></textarea>
              <p class="input-helper">
                Ejemplo: "Lote aprobado. Coordinar horario de llegada", "Verificar peso en balanza"
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
                    Al aprobar este lote, se notificará a la cooperativa y al socio que el ingenio está listo para recibir el mineral.
                    El lote pasará a estado <strong>"Aprobado - Pendiente de iniciar"</strong> y los transportistas podrán comenzar el traslado.
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
                :disabled="loading"
              >
                <Loader2 class="w-4 h-4 animate-spin" v-if="loading" />
                <CheckCircle2 class="w-4 h-4" v-else />
                <span>{{ loading ? 'Aprobando...' : 'Confirmar Aprobación' }}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>