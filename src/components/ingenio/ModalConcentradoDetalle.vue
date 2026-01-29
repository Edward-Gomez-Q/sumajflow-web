<!-- src/components/ingenio/ModalConcentradoDetalle.vue -->
<script setup>
import { ref, computed, watch } from 'vue'
import { useConcentradosIngenioStore } from '@/stores/ingenio/concentradosIngenioStore'
import {
  X,
  PackageCheck,
  Info,
  Kanban,
  FlaskConical,
  DollarSign,
  AlertCircle
} from 'lucide-vue-next'
import { getEstadoConfig } from '@/utils/concentradoEstados'
import ConcentradoDetalleTabGeneral from './ConcentradoDetalleTabGeneral.vue'
import ConcentradoDetalleTabKanban from './ConcentradoDetalleTabKanban.vue'
import ConcentradoDetalleTabReporte from './ConcentradoDetalleTabReporte.vue'
import ConcentradoDetalleTabLiquidacion from './ConcentradoDetalleTabLiquidacion.vue'

const props = defineProps({
  concentradoId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['close'])

const concentradosStore = useConcentradosIngenioStore()
const tabActual = ref('general')

watch(() => props.concentradoId, async (newId) => {
  if (newId) {
    await concentradosStore.fetchConcentradoDetalle(newId)
    tabActual.value = 'general'
  }
}, { immediate: true })

const concentrado = computed(() => concentradosStore.concentradoDetalle)

// Determinar qué tabs están disponibles según el estado
const tabsDisponibles = computed(() => {
  const tabs = [
    { id: 'general', label: 'General', icon: Info, disponible: true }
  ]

  // Kanban disponible desde "en_camino_a_planta" en adelante
  if (concentrado.value && concentrado.value.estado !== 'creado') {
    tabs.push({ id: 'kanban', label: 'Kanban', icon: Kanban, disponible: true })
  }

  // Reporte disponible desde "esperando_reporte_quimico" en adelante
  if (concentrado.value && ['esperando_reporte_quimico', 'reporte_quimico_registrado', 'listo_para_liquidacion'].includes(concentrado.value.estado)) {
    tabs.push({ id: 'reporte', label: 'Reporte Químico', icon: FlaskConical, disponible: true })
  }

  // Liquidación disponible desde "liquidacion_servicio_solicitada" en adelante
  if (concentrado.value && [
    'liquidacion_servicio_solicitada',
    'liquidacion_servicio_en_revision',
    'servicio_ingenio_liquidado',
    'servicio_ingenio_pagado',
    'listo_para_venta'
  ].includes(concentrado.value.estado)) {
    tabs.push({ id: 'liquidacion', label: 'Liquidación', icon: DollarSign, disponible: true })
  }

  return tabs
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-9999 flex items-center justify-center bg-neutral-900/20 backdrop-blur-sm p-4"
      @click.self="emit('close')"
    >
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] border border-border flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-hover shrink-0">
          <div class="flex items-center gap-3">
            <div 
              v-if="concentrado"
              class="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
              :class="getEstadoConfig(concentrado.estado).color"
            >
              <PackageCheck class="w-6 h-6 text-white" />
            </div>
            <div v-else class="w-12 h-12 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <PackageCheck class="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 class="text-xl font-semibold text-neutral">
                {{ concentrado?.codigoConcentrado || 'Cargando...' }}
              </h2>
              <p v-if="concentrado" class="text-sm text-secondary mt-0.5">
                {{ concentrado.socioNombres }} {{ concentrado.socioApellidos }}
              </p>
            </div>
          </div>
          <button
            @click="emit('close')"
            class="w-10 h-10 rounded-lg hover:bg-surface transition-colors flex items-center justify-center text-secondary hover:text-neutral"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Loading -->
        <div v-if="concentradosStore.loadingDetalle" class="p-12 text-center flex-1">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p class="text-secondary">Cargando detalle del concentrado...</p>
        </div>

        <!-- Error -->
        <div v-else-if="concentradosStore.error" class="p-12 text-center flex-1">
          <div class="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle class="w-8 h-8 text-white" />
          </div>
          <h3 class="text-lg font-semibold text-neutral mb-2">Error al cargar el concentrado</h3>
          <p class="text-sm text-secondary">{{ concentradosStore.error }}</p>
        </div>

        <!-- Content -->
        <div v-else-if="concentrado" class="flex-1 overflow-y-auto scrollbar-custom">
          <div class="p-4 sm:p-6">
            <!-- Card de Estado Principal -->
            <div class="bg-base rounded-xl border border-border p-6 mb-6">
              <div class="flex items-center justify-between flex-wrap gap-4">
                <div class="flex items-center gap-4">
                  <div 
                    class="w-14 h-14 rounded-xl center shrink-0"
                    :class="getEstadoConfig(concentrado.estado).color"
                  >
                    <PackageCheck class="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 class="text-xl font-bold text-neutral">{{ concentrado.codigoConcentrado }}</h2>
                    <p class="text-sm text-secondary mt-1">
                      {{ concentrado.socioNombres }} {{ concentrado.socioApellidos }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span 
                    class="px-4 py-2 rounded-lg text-sm font-medium"
                    :class="[getEstadoConfig(concentrado.estado).color, getEstadoConfig(concentrado.estado).textColor]"
                  >
                    {{ getEstadoConfig(concentrado.estado).label }}
                  </span>
                </div>
              </div>

              <!-- Info rápida -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
                <div>
                  <p class="text-xs text-secondary mb-1">Peso Inicial</p>
                  <p class="text-lg font-semibold text-neutral">
                    {{ concentrado.pesoInicial }} kg
                  </p>
                </div>
                <div>
                  <p class="text-xs text-secondary mb-1">Mineral Principal</p>
                  <p class="text-lg font-semibold text-neutral">
                    {{ concentrado.mineralPrincipal || '-' }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-secondary mb-1">Número de Sacos</p>
                  <p class="text-lg font-semibold text-neutral">
                    {{ concentrado.numeroSacos || 0 }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-secondary mb-1">Lotes Procesados</p>
                  <p class="text-lg font-semibold text-neutral">
                    {{ concentrado.lotes?.length || 0 }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Tabs -->
            <div class="bg-base rounded-xl border border-border">
              <!-- Tab Headers -->
              <div class="border-b border-border px-4 overflow-x-auto scrollbar-custom">
                <div class="flex gap-2 min-w-max">
                  <button
                    v-for="tab in tabsDisponibles"
                    :key="tab.id"
                    @click="tabActual = tab.id"
                    class="px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2"
                    :class="tabActual === tab.id
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-secondary hover:text-neutral'"
                  >
                    <component :is="tab.icon" class="w-4 h-4" />
                    {{ tab.label }}
                  </button>
                </div>
              </div>

              <!-- Tab Content -->
              <div class="p-6">
                <ConcentradoDetalleTabGeneral 
                  v-show="tabActual === 'general'" 
                  :concentrado="concentrado"
                />
                
                <ConcentradoDetalleTabKanban 
                  v-show="tabActual === 'kanban'" 
                  :concentrado="concentrado"
                  :concentrado-id="concentradoId"
                />
                
                <ConcentradoDetalleTabReporte 
                  v-show="tabActual === 'reporte'" 
                  :concentrado="concentrado"
                  :concentrado-id="concentradoId"
                />
                
                <ConcentradoDetalleTabLiquidacion 
                  v-show="tabActual === 'liquidacion'" 
                  :concentrado="concentrado"
                  :concentrado-id="concentradoId"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>