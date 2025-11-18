<script setup>
import { computed } from 'vue'
import { useOnboardingStore } from '@/stores/onboardingStore'
import BalanceConfig from '../../shared/BalanceConfig.vue'

const onboardingStore = useOnboardingStore()

const comercializadoraData = computed({
  get: () => onboardingStore.comercializadoraData,
  set: (val) => {
    onboardingStore.comercializadoraData = val
  }
})

const balanza = computed({
  get: () => comercializadoraData.value.balanza,
  set: (val) => {
    comercializadoraData.value = {
      ...comercializadoraData.value,
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
    return { status: 'overdue', text: 'Calibración vencida', color: 'error', icon: '❌' }
  } else if (diffDays <= 30) {
    return { status: 'warning', text: `${diffDays} días restantes`, color: 'warning', icon: '⚠️' }
  } else if (diffDays <= 60) {
    return { status: 'ok', text: `${diffDays} días restantes`, color: 'success', icon: '✓' }
  } else {
    return { status: 'excellent', text: `${diffDays} días restantes`, color: 'success', icon: '✓' }
  }
})

// Minerales comercializados
const mineralesComercializados = computed(() => {
  return comercializadoraData.value.minerales_comercializados || []
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
        <p class="text-sm text-secondary">Registra tu balanza principal para compra y venta de concentrados</p>
      </div>
    </div>

    <!-- Información contextual -->
    <div class="bg-info/10 border border-info/30 rounded-lg p-4">
      <div class="flex gap-3">
        <div class="text-info text-xl shrink-0">💡</div>
        <div class="text-sm">
          <p class="font-medium text-neutral mb-1">Importancia del pesaje en comercializadoras</p>
          <p class="text-secondary mb-2">
            La balanza es el corazón de tu operación comercial. Un pesaje preciso y certificado garantiza:
          </p>
          <ul class="space-y-1 text-secondary">
            <li>• Transacciones justas con proveedores</li>
            <li>• Liquidaciones correctas</li>
            <li>• Cumplimiento de contratos de exportación</li>
            <li>• Respaldo legal en disputas comerciales</li>
            <li>• Confianza de cooperativas e ingenios</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Minerales comercializados -->
    <div v-if="mineralesComercializados.length > 0" class="card bg-gradient-to-br from-primary/5 to-accent/5">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-lg bg-primary/20 center text-primary">
          💎
        </div>
        <div>
          <p class="text-xs text-tertiary">Minerales que Comercializas</p>
          <p class="font-medium text-neutral">{{ mineralesComercializados.join(', ') }}</p>
        </div>
      </div>
      <p class="text-xs text-secondary">
        Tu balanza debe tener capacidad y precisión adecuada para pesar estos concentrados
      </p>
    </div>

    <!-- Contenido principal -->
    <div class="card">
      <BalanceConfig
        v-model="balanza"
        title="Datos de la Balanza Principal"
        entity-name="comercializadora"
      />
    </div>

    <!-- Estado de validación -->
    <div v-if="balanza">
      <div v-if="isBalanzaValid" class="bg-success/10 border border-success/30 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-full bg-success/20 center text-success text-xl shrink-0">
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
              <div v-if="getNextCalibrationStatus" class="col-span-2 flex items-center gap-2">
                <span class="font-medium">Calibración:</span>
                <span :class="`text-${getNextCalibrationStatus.color}`">
                  {{ getNextCalibrationStatus.icon }} {{ getNextCalibrationStatus.text }}
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

    <!-- Tipos de pesaje -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="border border-border rounded-lg p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl">📥</span>
          <h4 class="font-medium text-neutral">Pesaje de Compra</h4>
        </div>
        <ul class="space-y-2 text-sm text-secondary">
          <li class="flex items-start gap-2">
            <span class="text-primary">•</span>
            <span>Verificación de peso neto recibido</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-primary">•</span>
            <span>Control de merma en transporte</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-primary">•</span>
            <span>Base para liquidaciones a proveedores</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-primary">•</span>
            <span>Registro de ingreso a inventario</span>
          </li>
        </ul>
      </div>

      <div class="border border-border rounded-lg p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl">📤</span>
          <h4 class="font-medium text-neutral">Pesaje de Venta</h4>
        </div>
        <ul class="space-y-2 text-sm text-secondary">
          <li class="flex items-start gap-2">
            <span class="text-primary">•</span>
            <span>Certificación de peso para exportación</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-primary">•</span>
            <span>Cumplimiento de contratos</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-primary">•</span>
            <span>Documentación aduanera</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-primary">•</span>
            <span>Salida de inventario</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Normativas y certificaciones -->
    <div class="border border-border rounded-lg p-4">
      <h4 class="font-medium text-neutral mb-3 flex items-center gap-2">
        <span>📜</span>
        <span>Normativas y Certificaciones Requeridas</span>
      </h4>
      <div class="space-y-3">
        <div class="flex items-start gap-3 bg-hover rounded-lg p-3">
          <div class="w-10 h-10 rounded-lg bg-primary/10 center text-primary shrink-0">
            ✓
          </div>
          <div class="flex-1">
            <p class="font-medium text-neutral text-sm">OIML R 76-1</p>
            <p class="text-xs text-secondary mt-1">
              Requisitos metrológicos y técnicos para instrumentos de pesaje de funcionamiento no automático. 
              Obligatorio para transacciones comerciales.
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3 bg-hover rounded-lg p-3">
          <div class="w-10 h-10 rounded-lg bg-primary/10 center text-primary shrink-0">
            ✓
          </div>
          <div class="flex-1">
            <p class="font-medium text-neutral text-sm">Certificación IBMETRO</p>
            <p class="text-xs text-secondary mt-1">
              Instituto Boliviano de Metrología. Calibración y certificación oficial requerida 
              cada 6 meses para comercializadoras.
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3 bg-hover rounded-lg p-3">
          <div class="w-10 h-10 rounded-lg bg-primary/10 center text-primary shrink-0">
            ✓
          </div>
          <div class="flex-1">
            <p class="font-medium text-neutral text-sm">Clase de Precisión III</p>
            <p class="text-xs text-secondary mt-1">
              Recomendada para pesaje comercial de concentrados. Precisión mínima de 0.5 kg 
              para balanzas de hasta 5 toneladas.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Recomendaciones técnicas -->
    <div class="border border-border rounded-lg p-4">
      <h4 class="font-medium text-neutral mb-3 flex items-center gap-2">
        <span>🔧</span>
        <span>Recomendaciones Técnicas</span>
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h5 class="text-sm font-medium text-neutral mb-2">Capacidad Recomendada</h5>
          <ul class="space-y-1 text-xs text-secondary">
            <li>• Pequeña comercializadora: 5-10 ton</li>
            <li>• Mediana comercializadora: 10-30 ton</li>
            <li>• Grande comercializadora: 30-60 ton</li>
            <li>• Con romana vehicular: hasta 80 ton</li>
          </ul>
        </div>

        <div>
          <h5 class="text-sm font-medium text-neutral mb-2">Precisión Recomendada</h5>
          <ul class="space-y-1 text-xs text-secondary">
            <li>• Balanzas hasta 5 ton: ±0.5 kg</li>
            <li>• Balanzas de 5-20 ton: ±1 kg</li>
            <li>• Balanzas de 20-60 ton: ±2 kg</li>
            <li>• Romanas vehiculares: ±5 kg</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Mantenimiento y calibración -->
    <div class="bg-warning/10 border border-warning/30 rounded-lg p-4">
      <div class="flex gap-3">
        <div class="text-warning text-xl shrink-0">🔧</div>
        <div class="text-sm">
          <p class="font-medium text-warning mb-1">Programa de Mantenimiento Obligatorio</p>
          <p class="text-warning mb-2">
            Para mantener la certificación y precisión de tu balanza:
          </p>
          <ul class="space-y-1 text-warning">
            <li>• Calibración oficial cada 6 meses (IBMETRO)</li>
            <li>• Verificación diaria con pesas patrón</li>
            <li>• Limpieza y mantenimiento preventivo mensual</li>
            <li>• Registro documental de todas las calibraciones</li>
            <li>• Actualización de certificados antes del vencimiento</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Consecuencias de balanza descalibrada -->
    <div class="bg-error/10 border border-error/30 rounded-lg p-4">
      <div class="flex gap-3">
        <div class="text-error text-xl shrink-0">⚠️</div>
        <div class="text-sm">
          <p class="font-medium text-error mb-1">Riesgos de Balanza sin Calibración Vigente</p>
          <ul class="space-y-1 text-error">
            <li>• Multas de SENARECOM y autoridades competentes</li>
            <li>• Invalidación de transacciones comerciales</li>
            <li>• Pérdidas económicas por pesaje inexacto</li>
            <li>• Daño reputacional y pérdida de confianza</li>
            <li>• Imposibilidad de exportar (certificación aduanera)</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Resumen final -->
    <div v-if="isBalanzaValid" class="border-l-4 border-success bg-success/5 rounded-r-lg p-4">
      <p class="text-sm text-neutral">
        <span class="font-semibold">¡Registro completo!</span> Has configurado exitosamente tu comercializadora minera. 
        Al hacer clic en "Finalizar Registro" crearemos tu cuenta y podrás comenzar a operar en SumajFlow, 
        conectándote con cooperativas, ingenios y el mercado internacional.
      </p>
    </div>

    <!-- Información adicional -->
    <div class="bg-accent/5 border border-accent/20 rounded-lg p-4">
      <div class="flex gap-3">
        <div class="text-accent text-xl shrink-0">🎯</div>
        <div class="text-sm">
          <p class="font-medium text-neutral mb-1">¿Tienes múltiples balanzas?</p>
          <p class="text-secondary">
            Registra aquí tu balanza principal. Si tienes balanzas adicionales en diferentes ubicaciones 
            o para diferentes propósitos, podrás agregarlas después desde tu panel de control.
          </p>
        </div>
      </div>
    </div>

    <!-- Próximos pasos después del registro -->
    <div class="border border-border rounded-lg p-4">
      <h4 class="font-medium text-neutral mb-3 flex items-center gap-2">
        <span>🚀</span>
        <span>Después del Registro</span>
      </h4>
      <div class="space-y-2 text-sm text-secondary">
        <div class="flex items-start gap-2">
          <span class="text-primary">1.</span>
          <span>Recibirás acceso completo a la plataforma SumajFlow</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-primary">2.</span>
          <span>Podrás conectarte con cooperativas e ingenios registrados</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-primary">3.</span>
          <span>Gestionarás compras, inventario y ventas de concentrados</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-primary">4.</span>
          <span>Generarás reportes de trazabilidad para exportación</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="text-primary">5.</span>
          <span>Accederás a análisis de mercado y precios internacionales</span>
        </div>
      </div>
    </div>
  </div>
</template>