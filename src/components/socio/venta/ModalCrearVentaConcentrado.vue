<!-- src/components/socio/venta/ModalCrearVentaConcentrado.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useVentaConcentradoStore } from '@/stores/socio/ventaConcentradoStore'
import { useUIStore } from '@/stores/uiStore'
import {
  X,
  ShoppingCart,
  CheckCircle2,
  PackageCheck,
  Building2,
  AlertCircle
} from 'lucide-vue-next'

const emit = defineEmits(['close', 'creado'])

const ventaStore = useVentaConcentradoStore()
const uiStore = useUIStore()

const seleccionados = ref([])
const comercializadoraId = ref(null)
const observaciones = ref('')

onMounted(async () => {
  await ventaStore.fetchConcentradosDisponibles()
  await ventaStore.fetchComercializadoras()
})

const toggleConcentrado = (id) => {
  const idx = seleccionados.value.indexOf(id)
  if (idx >= 0) seleccionados.value.splice(idx, 1)
  else seleccionados.value.push(id)
}

const puedeCrear = computed(() =>
  seleccionados.value.length > 0 && comercializadoraId.value !== null
)

const crearVenta = async () => {
  if (!puedeCrear.value) return

  const confirmacion = await uiStore.showConfirm(
    `¿Crear venta de ${seleccionados.value.length} concentrado(s)? Se enviará a la comercializadora para aprobación.`,
    'Confirmar Venta'
  )
  if (!confirmacion) return

  const resultado = await ventaStore.crearVentaConcentrado({
    concentradosIds: seleccionados.value,
    comercializadoraId: comercializadoraId.value,
    observaciones: observaciones.value || null
  })

  if (resultado.success) {
    emit('creado', resultado.data)
  }
}

const formatPeso = (peso) => peso ? parseFloat(peso).toFixed(2) : '0.00'
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-9999 flex items-center justify-center bg-neutral-900/20 backdrop-blur-sm p-4"
      @click.self="emit('close')"
    >
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-[900px] max-h-[90vh] border border-border flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-hover shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-primary center shrink-0">
              <ShoppingCart class="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 class="text-xl font-semibold text-neutral">Nueva Venta de Concentrado</h2>
              <p class="text-sm text-secondary mt-0.5">Selecciona concentrados y comercializadora</p>
            </div>
          </div>
          <button @click="emit('close')" class="w-10 h-10 rounded-lg hover:bg-surface transition-colors flex items-center justify-center text-secondary hover:text-neutral">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto scrollbar-custom p-4 sm:p-6 space-y-6">
          <!-- Comercializadora -->
          <div>
            <label class="block text-sm font-semibold text-neutral mb-3">
              <Building2 class="w-4 h-4 inline mr-1" />
              Seleccionar Comercializadora <span class="text-error">*</span>
            </label>
            <select
              v-model="comercializadoraId"
              class="w-full px-4 py-3 rounded-lg border border-border bg-surface text-neutral focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option :value="null">-- Selecciona una comercializadora --</option>
              <option
                v-for="com in ventaStore.comercializadoras"
                :key="com.id"
                :value="com.id"
              >
                {{ com.razonSocial }} {{ com.nit ? '(NIT: ' + com.nit + ')' : '' }}
              </option>
            </select>
          </div>

          <!-- Concentrados disponibles -->
          <div>
            <label class="block text-sm font-semibold text-neutral mb-3">
              <PackageCheck class="w-4 h-4 inline mr-1" />
              Seleccionar Concentrados <span class="text-error">*</span>
              <span class="text-xs text-secondary ml-2">({{ seleccionados.length }} seleccionados)</span>
            </label>

            <div v-if="ventaStore.concentradosDisponibles.length === 0" class="text-center py-8 bg-hover rounded-xl border border-border">
              <AlertCircle class="w-10 h-10 text-secondary mx-auto mb-2" />
              <p class="text-secondary text-sm">No tienes concentrados disponibles para venta</p>
              <p class="text-xs text-tertiary mt-1">Deben estar en estado "Listo para venta"</p>
            </div>

            <div v-else class="space-y-2 max-h-[300px] overflow-y-auto scrollbar-custom">
              <div
                v-for="conc in ventaStore.concentradosDisponibles"
                :key="conc.id"
                class="flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer"
                :class="seleccionados.includes(conc.id)
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-surface hover:bg-hover'"
                @click="toggleConcentrado(conc.id)"
              >
                <div
                  class="w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                  :class="seleccionados.includes(conc.id)
                    ? 'bg-primary border-primary'
                    : 'border-border'"
                >
                  <CheckCircle2 v-if="seleccionados.includes(conc.id)" class="w-4 h-4 text-white" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-semibold text-neutral text-sm">00{{ conc.id }}</span>
                    <span v-if="conc.mineralPrincipal" class="text-xs px-2 py-0.5 rounded bg-indigo-500 text-white font-medium">
                      {{ conc.mineralPrincipal }}
                    </span>
                  </div>
                  <p class="text-xs text-secondary mt-0.5">{{ conc.ingenioNombre }}</p>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-sm font-medium text-neutral">{{ formatPeso(conc.pesoTms || conc.pesoFinal) }} Ton</p>
                  <p class="text-xs text-tertiary">{{ conc.numeroSacos || 0 }} sacos</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Observaciones -->
          <div>
            <label class="block text-sm font-medium text-neutral mb-2">Observaciones (opcional)</label>
            <textarea
              v-model="observaciones"
              rows="2"
              maxlength="500"
              placeholder="Información adicional para la comercializadora..."
              class="w-full px-4 py-2 rounded-lg border border-border bg-surface text-neutral placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            ></textarea>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex gap-3 p-4 sm:p-6 border-t border-border shrink-0">
          <button
            @click="emit('close')"
            class="flex-1 py-2.5 px-4 border border-border rounded-lg hover:bg-hover transition-colors text-secondary font-medium"
          >
            Cancelar
          </button>
          <button
            @click="crearVenta"
            :disabled="!puedeCrear || ventaStore.loadingCrear"
            class="flex-1 btn flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart v-if="!ventaStore.loadingCrear" class="w-5 h-5" />
            <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {{ ventaStore.loadingCrear ? 'Creando...' : 'Crear Venta' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>