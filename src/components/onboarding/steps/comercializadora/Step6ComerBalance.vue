<script setup>
import { computed } from 'vue'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Scale, Calendar, AlertTriangle, CheckCircle, Award, FileCheck, Info, TrendingUp, Target, ClipboardList, ArrowRight } from 'lucide-vue-next'
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
    return { status: 'overdue', text: 'Calibración vencida', color: 'error', days: Math.abs(diffDays) }
  } else if (diffDays <= 30) {
    return { status: 'warning', text: `${diffDays} días para calibración`, color: 'warning', days: diffDays }
  } else {
    return { status: 'ok', text: `${diffDays} días para calibración`, color: 'success', days: diffDays }
  }
})
</script>

<template>
  <div class="space-y-8">


    <!-- Contenido del formulario -->
    <div class="space-y-6">
      
      <!-- Sección: Datos de la Balanza -->
      <div class="space-y-4">

        <BalanceConfig
          v-model="balanza"
          entity-name="comercializadora"
        />
      </div>
    </div>

    <!-- Estado de validación -->
    <div v-if="balanza">
      <!-- ✅ Balanza configurada correctamente -->
      <div v-if="isBalanzaValid" class="bg-green-100/70 dark:bg-green-900/40 border border-green-400/60 dark:border-green-700 rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-green-200/50 dark:bg-green-800/50 center shrink-0">
            <CheckCircle class="w-4 h-4 text-green-700 dark:text-green-300" />
          </div>
          <div class="flex-1">
            <p class="font-medium text-neutral mb-2">Balanza configurada correctamente</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-secondary leading-relaxed">
              <div>
                <span class="font-medium text-neutral">Marca/Modelo:</span> 
                {{ balanza.marca }} {{ balanza.modelo }}
              </div>
              <div>
                <span class="font-medium text-neutral">Serie:</span> 
                {{ balanza.numero_serie }}
              </div>
              <div>
                <span class="font-medium text-neutral">Capacidad:</span> 
                {{ balanza.capacidad_maxima }} kg
              </div>
              <div>
                <span class="font-medium text-neutral">Precisión:</span> 
                ±{{ balanza.precision_minima }} kg
              </div>
              <div v-if="getNextCalibrationStatus" class="col-span-2">
                <span class="font-medium text-neutral">Estado de calibración:</span>
                <span 
                  class="ml-1"
                  :class="{
                    'text-green-700 dark:text-green-300': getNextCalibrationStatus.status === 'ok',
                    'text-orange-700 dark:text-orange-300': getNextCalibrationStatus.status === 'warning',
                    'text-red-700 dark:text-red-300': getNextCalibrationStatus.status === 'overdue'
                  }"
                >
                  {{ getNextCalibrationStatus.text }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ⚠️ Información incompleta -->
      <div v-else class="bg-orange-100/70 dark:bg-orange-900/40 border border-orange-400/60 dark:border-orange-700 rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-orange-200/50 dark:bg-orange-800/50 center shrink-0">
            <AlertTriangle class="w-4 h-4 text-orange-700 dark:text-orange-300" />
          </div>
          <div>
            <p class="font-medium text-neutral mb-1">Información incompleta</p>
            <p class="text-sm text-secondary leading-relaxed">
              Completa todos los campos obligatorios de la balanza para continuar
            </p>
          </div>
        </div>
      </div>
    </div>





    <!-- Programa de mantenimiento -->
    <div class="bg-orange-100/70 dark:bg-orange-900/40 border border-orange-400/60 dark:border-orange-700 rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200">
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-orange-200/50 dark:bg-orange-800/50 center shrink-0">
          <ClipboardList class="w-4 h-4 text-orange-700 dark:text-orange-300" />
        </div>
        <div class="text-sm">
          <p class="font-medium text-neutral mb-2">Programa de Mantenimiento Obligatorio</p>
          <p class="text-secondary leading-relaxed mb-2">
            Para mantener la certificación y precisión de tu balanza:
          </p>
          <ul class="space-y-1.5 text-secondary leading-relaxed">
            <li class="flex items-start gap-2">
              <ArrowRight class="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
              <span>Calibración oficial cada 6 meses (IBMETRO)</span>
            </li>
            <li class="flex items-start gap-2">
              <ArrowRight class="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
              <span>Verificación diaria con pesas patrón certificadas</span>
            </li>
            <li class="flex items-start gap-2">
              <ArrowRight class="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
              <span>Limpieza y mantenimiento preventivo mensual</span>
            </li>
            <li class="flex items-start gap-2">
              <ArrowRight class="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
              <span>Registro documental de todas las calibraciones</span>
            </li>
            <li class="flex items-start gap-2">
              <ArrowRight class="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
              <span>Actualización de certificados antes del vencimiento</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Riesgos de balanza sin calibración -->
    <div class="bg-red-100/70 dark:bg-red-900/40 border border-red-400/60 dark:border-red-700 rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200">
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-red-200/50 dark:bg-red-800/50 center shrink-0">
          <AlertTriangle class="w-4 h-4 text-red-700 dark:text-red-300" />
        </div>
        <div class="text-sm">
          <p class="font-medium text-neutral mb-2">Riesgos de Balanza sin Calibración Vigente</p>
          <ul class="space-y-1.5 text-secondary leading-relaxed">
            <li class="flex items-start gap-2">
              <span class="text-red-600 dark:text-red-400 mt-0.5">•</span>
              <span>Multas de SENARECOM y autoridades competentes</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-red-600 dark:text-red-400 mt-0.5">•</span>
              <span>Invalidación de transacciones comerciales</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-red-600 dark:text-red-400 mt-0.5">•</span>
              <span>Pérdidas económicas por pesaje inexacto</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-red-600 dark:text-red-400 mt-0.5">•</span>
              <span>Daño reputacional y pérdida de confianza</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-red-600 dark:text-red-400 mt-0.5">•</span>
              <span>Imposibilidad de exportar (falta de certificación aduanera)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>


    <!-- Resumen final -->
    <div v-if="isBalanzaValid" class="border-l-4 border-green-600 dark:border-green-400 bg-green-50/50 dark:bg-green-900/20 rounded-r-lg p-4">
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 center shrink-0">
          <CheckCircle class="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
        <p class="text-sm text-neutral leading-relaxed">
          <span class="font-semibold">¡Registro completo!</span> Has configurado exitosamente tu comercializadora minera. 
          Al hacer clic en "Finalizar Registro" crearemos tu cuenta y podrás comenzar a operar en SumajFlow, 
          conectándote con cooperativas, ingenios y el mercado internacional.
        </p>
      </div>
    </div>
  </div>
</template>
