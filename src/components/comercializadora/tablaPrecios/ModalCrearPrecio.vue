<!-- src/components/comercializadora/tablaPrecios/ModalCrearPrecio.vue -->
<script setup>
import { ref } from 'vue'
import { useTablaPreciosStore } from '@/stores/comercializadora/tablaPreciosStore'
import { X, Plus, DollarSign, Info, Calendar } from 'lucide-vue-next'

const emit = defineEmits(['close'])

const tablaPreciosStore = useTablaPreciosStore()

const form = ref({
  mineral: 'Pb',
  unidadMedida: '%',
  rangoMinimo: null,
  rangoMaximo: null,
  precioUsd: null,
  fechaInicio: new Date().toISOString().split('T')[0],
  fechaFin: null,
  activo: true,
  observaciones: ''
})

const loading = ref(false)
const error = ref(null)

const minerales = [
  { value: 'Pb', label: 'Plomo', unidad: '%', color: 'bg-gray-600' },
  { value: 'Zn', label: 'Zinc', unidad: '%', color: 'bg-blue-600' },
  { value: 'Ag', label: 'Plata', unidad: 'DM', color: 'bg-gray-400' }
]

const onMineralChange = () => {
  const selected = minerales.find(m => m.value === form.value.mineral)
  if (selected) {
    form.value.unidadMedida = selected.unidad
  }
}

const handleSubmit = async () => {
  error.value = null

  // Validaciones
  if (!form.value.rangoMinimo || !form.value.rangoMaximo || !form.value.precioUsd) {
    error.value = 'Todos los campos obligatorios deben completarse'
    return
  }

  if (parseFloat(form.value.rangoMaximo) <= parseFloat(form.value.rangoMinimo)) {
    error.value = 'El rango máximo debe ser mayor al rango mínimo'
    return
  }

  if (parseFloat(form.value.precioUsd) <= 0) {
    error.value = 'El precio debe ser mayor a 0'
    return
  }

  loading.value = true

  const resultado = await tablaPreciosStore.crear(form.value)

  loading.value = false

  if (resultado.success) {
    emit('close')
  } else {
    error.value = resultado.error
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-9999 flex items-center justify-center bg-neutral-900/20 backdrop-blur-sm p-4"
      @click.self="emit('close')"
    >
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-2xl border border-border max-h-[90vh] flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-border bg-hover shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Plus class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-neutral">Crear Rango de Precios</h2>
              <p class="text-xs text-secondary">Configura un nuevo rango para liquidaciones</p>
            </div>
          </div>
          <button
            @click="emit('close')"
            class="w-8 h-8 rounded-lg hover:bg-surface transition-colors flex items-center justify-center text-secondary hover:text-neutral"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="p-4 space-y-4 overflow-y-auto">
          <!-- Error -->
          <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div class="flex items-start gap-2">
              <X class="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p class="text-sm text-red-700 dark:text-red-300">{{ error }}</p>
            </div>
          </div>

          <!-- Info -->
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div class="flex items-start gap-2">
              <Info class="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p class="text-xs text-blue-700 dark:text-blue-300">
                Define un rango de concentración y su precio. Los rangos no deben solaparse con rangos existentes del mismo mineral.
              </p>
            </div>
          </div>

          <!-- Mineral -->
          <div>
            <label class="block text-xs font-medium text-secondary mb-1.5">
              Mineral <span class="text-red-500">*</span>
            </label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="m in minerales"
                :key="m.value"
                type="button"
                @click="form.mineral = m.value; onMineralChange()"
                :class="[
                  'px-3 py-2.5 rounded-lg text-sm font-medium transition-all border',
                  form.mineral === m.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface border-border text-secondary hover:border-primary/30'
                ]"
              >
                <div class="flex flex-col items-center gap-1">
                  <div 
                    :class="[
                      'w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold',
                      form.mineral === m.value ? 'bg-white/20' : m.color
                    ]"
                  >
                    {{ m.value }}
                  </div>
                  <span>{{ m.label }}</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Rangos -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-secondary mb-1.5">
                Rango Mínimo <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  v-model.number="form.rangoMinimo"
                  type="number"
                  step="0.0001"
                  min="0"
                  required
                  placeholder="Ej: 5.0000"
                  class="text-sm pr-12"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-tertiary">
                  {{ form.unidadMedida }}
                </span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-secondary mb-1.5">
                Rango Máximo <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  v-model.number="form.rangoMaximo"
                  type="number"
                  step="0.0001"
                  min="0"
                  required
                  placeholder="Ej: 10.0000"
                  class="text-sm pr-12"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-tertiary">
                  {{ form.unidadMedida }}
                </span>
              </div>
            </div>
          </div>

          <!-- Precio -->
          <div>
            <label class="block text-xs font-medium text-secondary mb-1.5">
              Precio por {{ form.unidadMedida }} <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <DollarSign class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
              <input
                v-model.number="form.precioUsd"
                type="number"
                step="0.0001"
                min="0"
                required
                placeholder="Ej: 5.2500"
                class="text-sm pl-10"
              />
            </div>
            <p class="text-xs text-tertiary mt-1.5">Precio en dólares estadounidenses (USD)</p>
          </div>

          <!-- Fechas -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-secondary mb-1.5">
                Fecha Inicio <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary pointer-events-none" />
                <input
                  v-model="form.fechaInicio"
                  type="date"
                  required
                  class="text-sm pl-10"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-secondary mb-1.5">
                Fecha Fin <span class="text-tertiary">(Opcional)</span>
              </label>
              <div class="relative">
                <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary pointer-events-none" />
                <input
                  v-model="form.fechaFin"
                  type="date"
                  class="text-sm pl-10"
                />
              </div>
            </div>
          </div>

          <!-- Observaciones -->
          <div>
            <label class="block text-xs font-medium text-secondary mb-1.5">
              Observaciones <span class="text-tertiary">(Opcional)</span>
            </label>
            <textarea
              v-model="form.observaciones"
              rows="2"
              maxlength="500"
              placeholder="Notas adicionales sobre este rango..."
              class="text-sm resize-none"
            ></textarea>
            <p class="text-xs text-tertiary mt-1">{{ form.observaciones?.length || 0 }}/500 caracteres</p>
          </div>

          <!-- Activo -->
          <div class="flex items-center gap-2 p-3 bg-hover rounded-lg">
            <input
              v-model="form.activo"
              type="checkbox"
              id="activo"
              class="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/30"
            />
            <label for="activo" class="text-sm text-neutral cursor-pointer flex-1">
              Activar este rango inmediatamente
            </label>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-3 border-t border-border">
            <button
              type="button"
              @click="emit('close')"
              class="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="btn flex-1"
            >
              <span v-if="loading">Creando...</span>
              <span v-else>Crear Rango</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>