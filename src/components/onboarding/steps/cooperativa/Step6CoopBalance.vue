<script setup>
import { computed } from 'vue'
import { useOnboardingStore } from '@/stores/onboardingStore'
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
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 rounded-lg bg-primary/10 center text-2xl">
        ⚖️
      </div>
      <div>
        <h2 class="text-2xl font-semibold text-neutral">Configuración de Balanza</h2>
        <p class="text-sm text-secondary">Registra la balanza principal de tu cooperativa</p>
      </div>
    </div>

    <!-- Información contextual -->
    <div class="bg-info/10 border border-info/30 rounded-lg p-4">
      <div class="flex gap-3">
        <div class="text-info text-xl flex-shrink-0">💡</div>
        <div class="text-sm">
          <p class="font-medium text-neutral mb-1">¿Por qué registrar la balanza?</p>
          <p class="text-secondary">
            La balanza es el equipo crítico para el pesaje de minerales. Registrar sus especificaciones 
            técnicas y ubicación garantiza la trazabilidad y la precisión en las mediciones de producción.
          </p>
        </div>
      </div>
    </div>

    <!-- Contenido principal -->
    <div class="card">
      <BalanceConfig
        v-model="balanza"
        title="Datos de la Balanza Principal"
        entity-name="cooperativa"
      />
    </div>

    <!-- Estado de validación -->
    <div v-if="balanza">
      <div v-if="isBalanzaValid" class="bg-success/10 border border-success/30 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-full bg-success/20 center text-success text-xl flex-shrink-0">
            ✓
          </div>
          <div class="flex-1">
            <p class="font-medium text-success">Balanza configurada correctamente</p>
            <div class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-success/80">
              <div>
                <span class="font-medium">Marca/Modelo:</span> {{ balanza.marca }} {{ balanza.modelo }}
              </div>
              <div>
                <span class="font-medium">Capacidad:</span> {{ balanza.capacidad_maxima }} kg
              </div>
              <div>
                <span class="font-medium">Precisión:</span> {{ balanza.precision_minima }} kg
              </div>
              <div v-if="getNextCalibrationStatus">
                <span class="font-medium">Calibración:</span> 
                <span :class="`text-${getNextCalibrationStatus.color}`">
                  {{ getNextCalibrationStatus.text }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="bg-warning/10 border border-warning/30 rounded-lg p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-warning/20 center text-warning text-xl">
            ⚠️
          </div>
          <div>
            <p class="font-medium text-warning">Información incompleta</p>
            <p class="text-sm text-warning/80 mt-1">
              Completa todos los campos obligatorios de la balanza
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Importancia de la calibración -->
    <div class="border border-border rounded-lg p-4">
      <h4 class="font-medium text-neutral mb-3 flex items-center gap-2">
        <span>📋</span>
        <span>Importancia de la calibración</span>
      </h4>
      <ul class="space-y-2 text-sm text-secondary">
        <li class="flex items-start gap-2">
          <span class="text-primary">→</span>
          <span>La calibración garantiza la precisión de las mediciones</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-primary">→</span>
          <span>Es un requisito legal para operaciones mineras formales</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-primary">→</span>
          <span>Debe realizarse periódicamente según normativa vigente</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-primary">→</span>
          <span>Mantén actualizada la fecha de la próxima calibración</span>
        </li>
      </ul>
    </div>

    <!-- Información adicional -->
    <div class="bg-accent/5 border border-accent/20 rounded-lg p-4">
      <div class="flex gap-3">
        <div class="text-accent text-xl flex-shrink-0">🎯</div>
        <div class="text-sm">
          <p class="font-medium text-neutral mb-1">¿Tienes más de una balanza?</p>
          <p class="text-secondary">
            Por ahora, registra la balanza principal. Después del registro podrás agregar 
            balanzas adicionales desde tu panel de control.
          </p>
        </div>
      </div>
    </div>

    <!-- Resumen final -->
    <div v-if="isBalanzaValid" class="border-l-4 border-primary bg-primary/5 rounded-r-lg p-4">
      <p class="text-sm text-neutral">
        <span class="font-semibold">¡Casi listo!</span> Has completado toda la información de tu cooperativa. 
        Al hacer clic en "Finalizar Registro" crearemos tu cuenta y podrás comenzar a usar SumajFlow.
      </p>
    </div>
  </div>
</template>