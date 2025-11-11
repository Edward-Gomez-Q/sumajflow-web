<script setup>
import { computed } from 'vue'
import { useOnboardingStore } from '@/stores/onboardingStore'
import BalanceConfig from '../../shared/BalanceConfig.vue'

const onboardingStore = useOnboardingStore()

const ingenioData = computed({
  get: () => onboardingStore.ingenioData,
  set: (val) => {
    onboardingStore.ingenioData = val
  }
})

const balanza = computed({
  get: () => ingenioData.value.balanza,
  set: (val) => {
    ingenioData.value = {
      ...ingenioData.value,
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
        <p class="text-sm text-secondary">Registra la balanza principal de tu ingenio</p>
      </div>
    </div>

    <!-- Información contextual -->
    <div class="bg-info/10 border border-info/30 rounded-lg p-4">
      <div class="flex gap-3">
        <div class="text-info text-xl flex-shrink-0">💡</div>
        <div class="text-sm">
          <p class="font-medium text-neutral mb-1">Importancia del pesaje en ingenios</p>
          <p class="text-secondary">
            La balanza es esencial en las operaciones del ingenio para:
          </p>
          <ul class="mt-2 space-y-1 text-secondary">
            <li>• Pesaje de ingreso de mineral crudo</li>
            <li>• Control de merma en el proceso</li>
            <li>• Pesaje de salida de concentrados</li>
            <li>• Liquidaciones precisas a cooperativas y socios</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Contenido principal -->
    <div class="card">
      <BalanceConfig
        v-model="balanza"
        title="Datos de la Balanza Principal"
        entity-name="ingenio"
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
                <span class="font-medium">Serie:</span> {{ balanza.numero_serie }}
              </div>
              <div>
                <span class="font-medium">Capacidad:</span> {{ balanza.capacidad_maxima }} kg
              </div>
              <div>
                <span class="font-medium">Precisión:</span> ±{{ balanza.precision_minima }} kg
              </div>
              <div v-if="getNextCalibrationStatus" class="col-span-2">
                <span class="font-medium">Estado:</span> 
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

    <!-- Normativas y certificaciones -->
    <div class="border border-border rounded-lg p-4">
      <h4 class="font-medium text-neutral mb-3 flex items-center gap-2">
        <span>📜</span>
        <span>Normativas y Certificaciones</span>
      </h4>
      <div class="space-y-3 text-sm text-secondary">
        <div class="flex items-start gap-2">
          <span class="text-primary">→</span>
          <div>
            <p class="font-medium text-neutral">OIML R 76</p>
            <p>Instrumentos de pesaje de funcionamiento no automático</p>
          </div>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-primary">→</span>
          <div>
            <p class="font-medium text-neutral">ISO 9001</p>
            <p>Sistema de gestión de calidad en procesos de pesaje</p>
          </div>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-primary">→</span>
          <div>
            <p class="font-medium text-neutral">Calibración Periódica</p>
            <p>La normativa boliviana requiere calibración cada 6-12 meses</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tipos de pesaje en ingenios -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="border border-border rounded-lg p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl">📥</span>
          <h4 class="font-medium text-neutral">Pesaje de Ingreso</h4>
        </div>
        <ul class="space-y-2 text-sm text-secondary">
          <li>• Mineral crudo de cooperativas</li>
          <li>• Peso bruto (camión + mineral)</li>
          <li>• Peso tara (camión vacío)</li>
          <li>• Peso neto calculado</li>
        </ul>
      </div>

      <div class="border border-border rounded-lg p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl">📤</span>
          <h4 class="font-medium text-neutral">Pesaje de Salida</h4>
        </div>
        <ul class="space-y-2 text-sm text-secondary">
          <li>• Concentrados procesados</li>
          <li>• Control de merma</li>
          <li>• Verificación de rendimiento</li>
          <li>• Base para liquidaciones</li>
        </ul>
      </div>
    </div>

    <!-- Información adicional -->
    <div class="bg-accent/5 border border-accent/20 rounded-lg p-4">
      <div class="flex gap-3">
        <div class="text-accent text-xl flex-shrink-0">🎯</div>
        <div class="text-sm">
          <p class="font-medium text-neutral mb-1">¿Tienes más de una balanza?</p>
          <p class="text-secondary">
            Registra aquí tu balanza principal. Podrás agregar balanzas adicionales 
            (para diferentes procesos o ubicaciones) después del registro desde tu panel de control.
          </p>
        </div>
      </div>
    </div>

    <!-- Próximo paso -->
    <div class="border-l-4 border-primary bg-primary/5 rounded-r-lg p-4">
      <p class="text-sm text-neutral">
        <span class="font-semibold">Siguiente paso:</span> Configurarás los almacenes donde tu ingenio 
        guarda concentrados y otros materiales procesados.
      </p>
    </div>
  </div>
</template>