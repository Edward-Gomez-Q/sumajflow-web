<script setup>
import { computed } from 'vue'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { 
  Scale, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Target, 
  ClipboardList, 
  ArrowRight 
} from 'lucide-vue-next'
import BalanceConfig from '../../shared/BalanceConfig.vue'

const onboardingStore = useOnboardingStore()

const cooperativaData = computed({
  get: () => onboardingStore.cooperativaData,
  set: (val) => {
    onboardingStore.cooperativaData = val
  }
})

const balanza = computed({
  get: () => cooperativaData.value.balanza,
  set: (val) => {
    cooperativaData.value = {
      ...cooperativaData.value,
      balanza: val
    }
  }
})

// Validación de balanza
const isBalanzaValid = computed(() => {
  if (!balanza.value) return false
  
  return (
    balanza.value.nombre?.trim() !== '' &&
    balanza.value.marca?.trim() !== '' &&
    balanza.value.modelo?.trim() !== '' &&
    balanza.value.numero_serie?.trim() !== '' &&
    balanza.value.capacidad_maxima > 0 &&
    balanza.value.precision_minima > 0 &&
    balanza.value.fecha_ultima_calibracion &&
    balanza.value.fecha_proxima_calibracion &&
    balanza.value.direccion?.trim() !== ''
  )
})

// Estado de calibración
const getNextCalibrationStatus = computed(() => {
  if (!balanza.value?.fecha_proxima_calibracion) return null
  
  const today = new Date()
  const nextCalibration = new Date(balanza.value.fecha_proxima_calibracion)
  const diffTime = nextCalibration - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { status: 'overdue', text: 'Calibración vencida', color: 'error' }
  } else if (diffDays <= 30) {
    return { status: 'warning', text: `${diffDays} días para calibración`, color: 'warning' }
  } else {
    return { status: 'ok', text: `${diffDays} días para calibración`, color: 'success' }
  }
})
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-lg bg-primary/10 center">
          <Scale class="w-5 h-5 text-primary" />
        </div>
        <h2 class="text-2xl font-semibold text-neutral">Configuración de Balanza</h2>
      </div>
      <p class="text-sm text-secondary leading-relaxed">
        Registra la balanza principal de tu cooperativa. Este equipo es crítico para garantizar la precisión y trazabilidad en el pesaje de minerales.
      </p>
    </div>

    <!-- Información contextual -->
    <div class="bg-info/10 border border-info/30 rounded-lg p-4">
      <div class="flex gap-3">
        <div class="text-info text-xl flex-shrink-0">
          <Info class="w-5 h-5" />
        </div>
        <div class="text-sm">
          <p class="font-medium text-neutral mb-1">¿Por qué registrar la balanza?</p>
          <p class="text-secondary leading-relaxed">
            La balanza es el equipo crítico para el pesaje de minerales. Registrar sus especificaciones técnicas y ubicación garantiza la trazabilidad y la precisión en las mediciones de producción.
          </p>
        </div>
      </div>
    </div>

    <!-- Contenido principal -->
    <div class="space-y-6">
      <BalanceConfig
        v-model="balanza"
        title="Datos de la Balanza Principal"
        entity-name="cooperativa"
      />
    </div>

    <div class="divider"></div>

    <!-- Estado de validación -->
    <div v-if="balanza">
      <div
        v-if="isBalanzaValid"
        class="rounded-xl p-4 border border-green-400/60 bg-green-100/70 dark:border-green-700 dark:bg-green-900/40 shadow-sm backdrop-blur-[2px] transition-all duration-200"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-green-200/50 dark:bg-green-800/50 center">
            <CheckCircle2 class="w-5 h-5 text-green-700 dark:text-green-300" />
          </div>
          <div>
            <p class="text-sm font-semibold text-green-950 dark:text-green-100">
              Balanza configurada correctamente
            </p>
            <p class="text-sm text-green-900 dark:text-green-200 mt-1">
              Marca: {{ balanza.marca }} — Modelo: {{ balanza.modelo }}
              <br />
              Capacidad: {{ balanza.capacidad_maxima }} kg | Precisión: {{ balanza.precision_minima }} kg
              <br />
              <span v-if="getNextCalibrationStatus" :class="{
                'text-green-700 dark:text-green-300': getNextCalibrationStatus.color === 'success',
                'text-yellow-700 dark:text-yellow-300': getNextCalibrationStatus.color === 'warning',
                'text-red-700 dark:text-red-300': getNextCalibrationStatus.color === 'error'
              }">
                {{ getNextCalibrationStatus.text }}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div
        v-else
        class="rounded-xl p-4 border border-yellow-400/60 bg-yellow-100/70 dark:border-yellow-700 dark:bg-yellow-900/40 shadow-sm backdrop-blur-[2px] transition-all duration-200"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-yellow-200/50 dark:bg-yellow-800/50 center">
            <AlertCircle class="w-5 h-5 text-yellow-700 dark:text-yellow-300" />
          </div>
          <div>
            <p class="text-sm font-semibold text-yellow-950 dark:text-yellow-100">
              Información incompleta
            </p>
            <p class="text-sm text-yellow-900 dark:text-yellow-200 mt-1">
              Completa todos los campos obligatorios de la balanza para continuar
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Sección informativa: Calibración -->
    <div class="bg-surface border border-border rounded-lg p-4">
      <div class="flex items-center gap-2 mb-3">
        <ClipboardList class="w-5 h-5 text-primary" />
        <h4 class="font-medium text-neutral">Importancia de la calibración</h4>
      </div>
      <ul class="space-y-2 text-sm text-secondary">
        <li class="flex items-start gap-2">
          <ArrowRight class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <span>La calibración garantiza la precisión de las mediciones</span>
        </li>
        <li class="flex items-start gap-2">
          <ArrowRight class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <span>Es un requisito legal para operaciones mineras formales</span>
        </li>
        <li class="flex items-start gap-2">
          <ArrowRight class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <span>Debe realizarse periódicamente según normativa vigente</span>
        </li>
        <li class="flex items-start gap-2">
          <ArrowRight class="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <span>Mantén actualizada la fecha de la próxima calibración</span>
        </li>
      </ul>
    </div>


  </div>
</template>

<style scoped>
.center {
  @apply flex justify-center items-center;
}
</style>
