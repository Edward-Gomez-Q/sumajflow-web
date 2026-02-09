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
    simbolo: 'Pb',
    color: 'bg-slate-600 dark:bg-slate-700',
    textColor: 'text-slate-700 dark:text-slate-300',
    badgeBg: 'bg-slate-100 dark:bg-slate-800'
  },
  { 
    key: 'Zn', 
    label: 'Zinc', 
    simbolo: 'Zn',
    color: 'bg-slate-700 dark:bg-slate-800',
    textColor: 'text-slate-700 dark:text-slate-300',
    badgeBg: 'bg-slate-100 dark:bg-slate-800'
  },
  { 
    key: 'Ag', 
    label: 'Plata', 
    simbolo: 'Ag',
    color: 'bg-slate-500 dark:bg-slate-600',
    textColor: 'text-slate-700 dark:text-slate-300',
    badgeBg: 'bg-slate-100 dark:bg-slate-800'
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
        <div class="flex items-center justify-between p-5 border-b border-border bg-slate-50 dark:bg-slate-800/30 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <DollarSign class="w-5 h-5 text-slate-700 dark:text-slate-300" />
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
        <div class="flex-1 overflow-y-auto p-5 space-y-4">
          <!-- Estado de Configuración -->
          <div
            :class="[
              'rounded-lg p-4 border',
              tieneConfiguracion
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
            ]"
          >
            <div class="flex items-start gap-2.5">
              <component
                :is="tieneConfiguracion ? CheckCircle2 : AlertCircle"
                :class="[
                  'w-5 h-5 shrink-0 mt-0.5',
                  tieneConfiguracion ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                ]"
              />
              <div class="flex-1">
                <p 
                  :class="[
                    'text-sm font-semibold',
                    tieneConfiguracion 
                      ? 'text-emerald-900 dark:text-emerald-100' 
                      : 'text-amber-900 dark:text-amber-100'
                  ]"
                >
                  {{ tieneConfiguracion
                    ? 'Configuración completa para lotes complejos'
                    : 'Configuración incompleta' }}
                </p>
                <p 
                  v-if="!tieneConfiguracion"
                  :class="[
                    'text-xs mt-1',
                    'text-amber-700 dark:text-amber-300'
                  ]"
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
              class="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3.5"
            >
              <div class="flex items-center gap-2 mb-2">
                <div 
                  :class="[
                    'w-7 h-7 rounded flex items-center justify-center text-white text-xs font-semibold',
                    mineral.color
                  ]"
                >
                  {{ mineral.simbolo }}
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
              class="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
            >
              <!-- Header del Mineral -->
              <div :class="['px-4 py-3 flex items-center gap-2.5', mineral.color]">
                <div class="w-7 h-7 rounded bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <span class="text-white text-xs font-bold">{{ mineral.simbolo }}</span>
                </div>
                <span class="text-sm font-semibold text-white">{{ mineral.label }}</span>
              </div>

              <!-- Rangos -->
              <div class="divide-y divide-slate-200 dark:divide-slate-700">
                <div
                  v-for="(rango, idx) in rangos[mineral.key]"
                  :key="idx"
                  class="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div class="flex items-center justify-between gap-4">
                    <div class="flex items-center gap-2.5 flex-1">
                      <TrendingUp :class="['w-4 h-4', mineral.textColor]" />
                      <span class="text-sm font-medium text-neutral">
                        {{ formatNumber(rango.rangoMinimo) }} - {{ formatNumber(rango.rangoMaximo) }}
                      </span>
                      <span class="text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        {{ rango.unidadMedida }}
                      </span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <DollarSign class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
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
          <div v-else class="text-center py-10 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/20">
            <AlertCircle class="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
            <p class="text-sm font-medium text-secondary">No hay rangos de precios configurados</p>
            <p class="text-xs text-tertiary mt-1.5">
              Esta comercializadora aún no ha configurado su tabla de precios
            </p>
          </div>

          <!-- Info adicional -->
          <div class="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <div class="flex items-start gap-2.5">
              <Info class="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0 mt-0.5" />
              <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Estos precios se aplicarán automáticamente al liquidar <strong class="font-semibold">lotes complejos</strong>. 
                Para ventas de concentrados, se utilizan las cotizaciones internacionales vigentes.
              </p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-3 p-5 border-t border-border bg-slate-50 dark:bg-slate-800/30 shrink-0">
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