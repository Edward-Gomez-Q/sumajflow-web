<script setup>
import { ref, computed } from 'vue'
import { useTransportistaStore } from '@/stores/cooperativa/transportistaStore'
import { X, Power, PowerOff, AlertTriangle, Loader2 } from 'lucide-vue-next'

const props = defineProps({
  transportista: {
    type: Object,
    required: true
  },
  accion: {
    type: String, // 'activar' o 'desactivar'
    required: true
  }
})

const emit = defineEmits(['close', 'estado-cambiado'])

const transportistaStore = useTransportistaStore()

const motivo = ref('')
const isProcessing = ref(false)

const esActivacion = computed(() => props.accion === 'activar')
const nuevoEstado = computed(() => esActivacion.value ? 'activo' : 'inactivo')

const isValid = computed(() => {
  if (esActivacion.value) {
    return true // Motivo opcional para activar
  } else {
    return motivo.value.trim() !== '' // Motivo requerido para desactivar
  }
})

const confirmarCambio = async () => {
  if (!isValid.value) return

  isProcessing.value = true

  const result = await transportistaStore.cambiarEstado(
    props.transportista.id,
    nuevoEstado.value,
    motivo.value
  )

  isProcessing.value = false

  if (result.success) {
    emit('estado-cambiado')
  } else {
    alert(result.error)
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-md border border-border">
        
        <div class="p-6">
          <!-- Icono -->
          <div :class="[
            'w-12 h-12 rounded-full center mx-auto mb-4',
            esActivacion 
              ? 'bg-green-100 dark:bg-green-900/30' 
              : 'bg-red-100 dark:bg-red-900/30'
          ]">
            <component 
              :is="esActivacion ? Power : PowerOff" 
              :class="[
                'w-6 h-6',
                esActivacion ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              ]"
            />
          </div>

          <!-- Título -->
          <h3 class="text-xl font-semibold text-neutral text-center mb-2">
            {{ esActivacion ? '¿Activar transportista?' : '¿Desactivar transportista?' }}
          </h3>

          <!-- Info del transportista -->
          <p class="text-sm text-secondary text-center mb-6">
            {{ esActivacion 
               ? 'El transportista podrá recibir nuevas asignaciones de viaje.' 
               : 'El transportista no podrá recibir nuevas asignaciones.' 
            }}
          </p>

          <div class="bg-hover rounded-lg p-3 mb-6">
            <p class="text-sm font-medium text-neutral">{{ transportista.nombreCompleto }}</p>
            <p class="text-xs text-secondary">{{ transportista.placaVehiculo }}</p>
          </div>

          <!-- Motivo -->
          <div class="input-group mb-6">
            <label class="input-label">
              Motivo {{ esActivacion ? '(opcional)' : '(requerido)' }}
            </label>
            <textarea
              v-model="motivo"
              rows="3"
              :placeholder="esActivacion 
                ? 'Razón de la activación...' 
                : 'Motivo de la desactivación...'"
              class="w-full"
            ></textarea>
          </div>

          <!-- Advertencia -->
          <div v-if="!esActivacion" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-6">
            <div class="flex gap-2">
              <AlertTriangle class="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
              <p class="text-xs text-secondary">
                El transportista no podrá recibir nuevas asignaciones mientras esté desactivado.
              </p>
            </div>
          </div>

          <!-- Botones -->
          <div class="flex gap-3">
            <button
              @click="emit('close')"
              class="flex-1 btn-secondary"
              :disabled="isProcessing"
            >
              Cancelar
            </button>
            <button
              @click="confirmarCambio"
              :disabled="!isValid || isProcessing"
              :class="[
                'flex-1 btn flex items-center justify-center gap-2',
                !esActivacion && 'bg-red-600 hover:bg-red-700'
              ]"
            >
              <Loader2 v-if="isProcessing" class="w-4 h-4 animate-spin" />
              <component 
                v-else
                :is="esActivacion ? Power : PowerOff" 
                class="w-4 h-4" 
              />
              <span>{{ esActivacion ? 'Activar' : 'Desactivar' }}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>