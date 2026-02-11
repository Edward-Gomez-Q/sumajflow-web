<!-- src/components/socio/venta/ModalVistaPreciosComercializadora.vue -->
<script setup>
import { computed } from 'vue'
import {
  X,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-vue-next'

const props = defineProps({
  comercializadora: { type: Object, required: true }
})

const emit = defineEmits(['close'])

const tablaPrecios = computed(() => props.comercializadora.tablaPrecios || {})

const tieneConfiguracion = computed(() => 
  tablaPrecios.value.tieneConfiguracion === true
)

const rangos = computed(() => tablaPrecios.value.rangos || {})

const totalRangos = computed(() => ({
  Pb: tablaPrecios.value.totalRangosPb || 0,
  Zn: tablaPrecios.value.totalRangosZn || 0,
  Ag: tablaPrecios.value.totalRangosAg || 0
}))

const minerales = [
  { 
    key: 'Pb', 
    label: 'Plomo', 
    simbolo: 'Pb'
  },
  { 
    key: 'Zn', 
    label: 'Zinc', 
    simbolo: 'Zn'
  },
  { 
    key: 'Ag', 
    label: 'Plata', 
    simbolo: 'Ag'
  }
]

const formatNumber = (num) => {
  return new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(num)
}

const formatCurrency = (num) => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(num)
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-9999 flex items-center justify-center bg-neutral-900/20 backdrop-blur-sm p-4"
      @click.self="emit('close')"
    >
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] border border-border flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-5 border-b border-border bg-hover shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign class="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-neutral">Tabla de Precios</h2>
              <p class="text-xs text-secondary mt-0.5">{{ comercializadora.razonSocial }}</p>
            </div>
          </div>
          <button
            @click="emit('close')"
            class="w-9 h-9 rounded-lg hover:bg-surface transition-colors flex items-center justify-center text-secondary hover:text-neutral"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto scrollbar-custom p-5 space-y-4">
          <!-- Estado de Configuración -->
          <div
            :class="[
              'rounded-lg p-4 border',
              tieneConfiguracion
                ? 'bg-success border-success'
                : 'bg-warning border-warning'
            ]"
          >
            <div class="flex items-start gap-3">
              <component
                :is="tieneConfiguracion ? CheckCircle2 : AlertCircle"
                class="w-5 h-5 text-white shrink-0 mt-0.5"
              />
              <div class="flex-1">
                <p class="text-sm font-semibold text-white">
                  {{ tieneConfiguracion
                    ? 'Configuración completa para lotes complejos'
                    : 'Configuración incompleta' }}
                </p>
                <p 
                  v-if="!tieneConfiguracion"
                  class="text-sm text-white mt-1 leading-relaxed"
                >
                  Esta comercializadora no tiene todos los precios configurados
                </p>
              </div>
            </div>
          </div>

          <!-- Resumen por Mineral -->
          <div class="grid grid-cols-3 gap-3">
            <div
              v-for="mineral in minerales"
              :key="mineral.key"
              class="bg-hover border border-border rounded-lg p-3.5"
            >
              <div class="flex items-center gap-2 mb-2">
                <div class="w-7 h-7 rounded bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <span class="text-primary text-xs font-semibold">{{ mineral.simbolo }}</span>
                </div>
                <span class="text-xs font-medium text-secondary">{{ mineral.label }}</span>
              </div>
              <p class="text-sm font-semibold text-neutral">
                {{ totalRangos[mineral.key] }} rango{{ totalRangos[mineral.key] !== 1 ? 's' : '' }}
              </p>
            </div>
          </div>

          <!-- Rangos por Mineral -->
          <div v-if="Object.keys(rangos).length > 0" class="space-y-3">
            <div
              v-for="mineral in minerales.filter(m => rangos[m.key]?.length > 0)"
              :key="mineral.key"
              class="border border-border rounded-lg overflow-hidden"
            >
              <!-- Header del Mineral -->
              <div class="px-4 py-3 bg-primary/10 border-b border-border flex items-center gap-2.5">
                <div class="w-7 h-7 rounded bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <span class="text-primary text-xs font-bold">{{ mineral.simbolo }}</span>
                </div>
                <span class="text-sm font-semibold text-neutral">{{ mineral.label }}</span>
              </div>

              <!-- Rangos -->
              <div class="divide-y divide-border">
                <div
                  v-for="(rango, idx) in rangos[mineral.key]"
                  :key="idx"
                  class="px-4 py-3 hover:bg-hover transition-colors"
                >
                  <div class="flex items-center justify-between gap-4">
                    <div class="flex items-center gap-2.5 flex-1">
                      <TrendingUp class="w-4 h-4 text-primary" />
                      <span class="text-sm font-medium text-neutral">
                        {{ formatNumber(rango.rangoMinimo) }} - {{ formatNumber(rango.rangoMaximo) }}
                      </span>
                      <span class="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/30 font-medium">
                        {{ rango.unidadMedida }}
                      </span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <DollarSign class="w-3.5 h-3.5 text-secondary" />
                      <span class="text-sm font-semibold text-neutral">
                        {{ formatNumber(rango.precioUsd) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sin Configuración -->
          <div v-else class="text-center py-10 border border-border rounded-lg bg-hover">
            <AlertCircle class="w-12 h-12 text-tertiary mx-auto mb-3" />
            <p class="text-sm font-medium text-secondary">No hay rangos de precios configurados</p>
            <p class="text-xs text-tertiary mt-1.5">
              Esta comercializadora aún no ha configurado su tabla de precios
            </p>
          </div>

          <!-- Info adicional -->
          <div class="bg-info rounded-lg p-4 border border-info">
            <div class="flex items-start gap-3">
              <Info class="w-5 h-5 text-white shrink-0 mt-0.5" />
              <p class="text-sm text-white leading-relaxed">
                Estos precios se aplicarán automáticamente al liquidar <strong class="font-semibold">lotes complejos</strong>. 
                Para ventas de concentrados, se utilizan las cotizaciones internacionales vigentes.
              </p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-3 p-5 border-t border-border bg-hover shrink-0">
          <button
            @click="emit('close')"
            class="btn"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>