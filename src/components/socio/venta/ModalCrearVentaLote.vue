<!-- src/components/socio/venta/ModalCrearVentaLote.vue -->
<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useVentaConcentradoStore } from '@/stores/socio/ventaConcentradoStore'
import { useUIStore } from '@/stores/uiStore'
import {
  X, Layers, CheckCircle2, Building2, AlertCircle, Truck
} from 'lucide-vue-next'

const emit = defineEmits(['close', 'creado'])

const ventaStore = useVentaConcentradoStore()
const uiStore = useUIStore()

const seleccionados = ref([])
const comercializadoraId = ref(null)
const observaciones = ref('')

onMounted(async () => {
  await ventaStore.fetchComercializadoras()
})

// Cuando cambia la comercializadora, cargar sus lotes y resetear selección
watch(comercializadoraId, async (newVal) => {
  seleccionados.value = []
  if (newVal) {
    await ventaStore.fetchLotesDisponibles()
  }
})

const toggleLote = (id) => {
  const idx = seleccionados.value.indexOf(id)
  if (idx >= 0) seleccionados.value.splice(idx, 1)
  else seleccionados.value.push(id)
}

// Filtrar lotes por comercializadora seleccionada
const lotesFiltrados = computed(() => {
  if (!comercializadoraId.value) return []
  return ventaStore.lotesDisponibles.filter(
    l => l.comercializadoraId === comercializadoraId.value.toString()
  )
})

const puedeCrear = computed(() =>
  seleccionados.value.length > 0 && comercializadoraId.value !== null
)

const pesoTotalSeleccionado = computed(() => {
  return lotesFiltrados.value
    .filter(l => seleccionados.value.includes(l.id))
    .reduce((sum, l) => sum + (l.pesoTotalReal || 0), 0)
})

const crearVenta = async () => {
  if (!puedeCrear.value) return

  const confirmacion = await uiStore.showConfirm(
    `¿Crear venta de ${seleccionados.value.length} lote(s) complejo(s)?\n\nPeso total: ${formatTon(pesoTotalSeleccionado.value)} Ton\n\nSe enviará a la comercializadora para aprobación.`,
    'Confirmar Venta de Lote'
  )
  if (!confirmacion) return

  const resultado = await ventaStore.crearVentaLote({
    lotesIds: seleccionados.value,
    comercializadoraId: comercializadoraId.value,
    observaciones: observaciones.value || null
  })

  if (resultado.success) {
    emit('creado', resultado.data)
  }
}

const formatTon = (kg) => kg ? (kg / 1000).toFixed(4) : '0.0000'
const formatKg = (kg) => kg ? parseFloat(kg).toFixed(2) : '0.00'

const comercializadoraSeleccionada = computed(() => {
  if (!comercializadoraId.value) return null
  return ventaStore.comercializadoras.find(c => c.id === comercializadoraId.value)
})
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
            <div class="w-12 h-12 rounded-lg bg-amber-600 center shrink-0">
              <Layers class="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 class="text-xl font-semibold text-neutral">Nueva Venta de Lote Complejo</h2>
              <p class="text-sm text-secondary mt-0.5">Venta directa de mineral sin procesamiento en ingenio</p>
            </div>
          </div>
          <button @click="emit('close')" class="w-10 h-10 rounded-lg hover:bg-surface transition-colors flex items-center justify-center text-secondary hover:text-neutral">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto scrollbar-custom p-4 sm:p-6 space-y-6">
          <!-- Info -->
          <div class="bg-amber-500/10 rounded-lg p-3 border border-amber-500/30">
            <p class="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
              <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
              El precio se calculará usando la tabla de precios de la comercializadora (no cotizaciones internacionales).
            </p>
          </div>

          <!-- Paso 1: Comercializadora -->
          <div>
            <label class="block text-sm font-semibold text-neutral mb-3">
              <Building2 class="w-4 h-4 inline mr-1" />
              Paso 1: Seleccionar Comercializadora <span class="text-error">*</span>
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

          <!-- Paso 2: Lotes (solo visible si hay comercializadora) -->
          <div v-if="comercializadoraId">
            <label class="block text-sm font-semibold text-neutral mb-3">
              <Truck class="w-4 h-4 inline mr-1" />
              Paso 2: Seleccionar Lotes de {{ comercializadoraSeleccionada?.razonSocial }}
              <span class="text-error">*</span>
              <span class="text-xs text-secondary ml-2">({{ seleccionados.length }} seleccionados)</span>
            </label>

            <!-- Loading -->
            <div v-if="ventaStore.loadingLotes" class="text-center py-8 bg-hover rounded-xl border border-border">
              <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p class="text-secondary text-sm">Cargando lotes disponibles...</p>
            </div>

            <!-- Sin lotes -->
            <div v-else-if="lotesFiltrados.length === 0" class="text-center py-8 bg-hover rounded-xl border border-border">
              <AlertCircle class="w-10 h-10 text-secondary mx-auto mb-2" />
              <p class="text-secondary text-sm">No hay lotes disponibles para esta comercializadora</p>
              <p class="text-xs text-tertiary mt-1">Deben estar en estado "Transporte completo"</p>
            </div>

            <!-- Lista de lotes -->
            <div v-else class="space-y-2 max-h-[300px] overflow-y-auto scrollbar-custom">
              <div
                v-for="lote in lotesFiltrados"
                :key="lote.id"
                class="flex items-center gap-3 p-4 rounded-lg border transition-all cursor-pointer"
                :class="seleccionados.includes(lote.id)
                  ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500'
                  : 'border-border bg-surface hover:bg-hover'"
                @click="toggleLote(lote.id)"
              >
                <div
                  class="w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                  :class="seleccionados.includes(lote.id)
                    ? 'bg-amber-600 border-amber-600'
                    : 'border-border'"
                >
                  <CheckCircle2 v-if="seleccionados.includes(lote.id)" class="w-4 h-4 text-white" />
                </div>
                
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap mb-1">
                    <span class="font-semibold text-neutral">
                      Lote #{{ lote.id }}
                    </span>
                    <span class="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs rounded-full border border-blue-500/20">
                      {{ lote.estado }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2 text-xs text-secondary">
                    <span class="flex items-center gap-1">
                      <Building2 class="w-3 h-3" />
                      {{ lote.minaNombre || 'Sin origen' }}
                    </span>
                    <span class="text-tertiary">•</span>
                    <span>{{ lote.tipoMineral || 'Sin tipo' }}</span>
                  </div>
                </div>

                <div class="text-right shrink-0">
                  <p class="text-lg font-bold text-amber-600">
                    {{ formatTon(lote.pesoTotalReal) }} Ton
                  </p>
                  <p class="text-xs text-tertiary">
                    {{ formatKg(lote.pesoTotalReal) }} kg
                  </p>
                </div>
              </div>
            </div>

            <!-- Resumen selección -->
            <div v-if="seleccionados.length > 0" class="mt-3 bg-amber-500/10 rounded-lg p-4 border border-amber-500/20">
              <div class="flex justify-between items-center">
                <span class="text-sm text-amber-700 dark:text-amber-400 font-medium">Peso total seleccionado:</span>
                <div class="text-right">
                  <p class="text-xl font-bold text-amber-700 dark:text-amber-400">
                    {{ formatTon(pesoTotalSeleccionado) }} Ton
                  </p>
                  <p class="text-xs text-amber-600/70">
                    {{ formatKg(pesoTotalSeleccionado) }} kg
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Observaciones (solo visible si hay comercializadora) -->
          <div v-if="comercializadoraId">
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
            :disabled="!puedeCrear || ventaStore.loadingCrearLote"
            class="flex-1 bg-amber-600 text-white py-2.5 px-4 rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Layers v-if="!ventaStore.loadingCrearLote" class="w-5 h-5" />
            <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {{ ventaStore.loadingCrearLote ? 'Creando...' : 'Crear Venta de Lote' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>