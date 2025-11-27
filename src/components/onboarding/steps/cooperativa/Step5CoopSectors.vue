<!-- src/components/onboarding/steps/cooperativa/Step5CoopSectors.vue -->
<script setup>
import { computed } from 'vue'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Map, AlertCircle, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-vue-next'
import SectorManager from '../../shared/SectorManager.vue'
import PolygonMapPicker from '../../shared/PolygonMapPicker.vue'

const onboardingStore = useOnboardingStore()

const cooperativaData = computed({
  get: () => onboardingStore.cooperativaData,
  set: (val) => {
    onboardingStore.cooperativaData = val
  }
})

const sectores = computed({
  get: () => cooperativaData.value.sectores,
  set: (val) => {
    cooperativaData.value = {
      ...cooperativaData.value,
      sectores: val
    }
  }
})

// Validación: al menos un sector con mínimo 3 coordenadas
const hasValidSectors = computed(() => {
  return sectores.value.length > 0 && 
         sectores.value.every(sector => 
           sector.coordenadas && 
           sector.coordenadas.length >= 3
         )
})
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-lg bg-primary/10 center">
          <Map class="w-5 h-5 text-primary" />
        </div>
        <h2 class="text-2xl font-semibold text-neutral">Sectores de Operación</h2>
      </div>
      
      <p class="text-sm text-secondary leading-relaxed">
        Define las zonas geográficas donde opera tu cooperativa
      </p>
    </div>

    <!-- Información contextual -->
    <div class="bg-blue-100/70 dark:bg-blue-900/40 border border-blue-400/60 dark:border-blue-700 rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200">
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-blue-200/50 dark:bg-blue-800/50 center shrink-0">
          <AlertCircle class="w-4 h-4 text-blue-700 dark:text-blue-300" />
        </div>
        <div class="text-sm">
          <p class="font-medium text-neutral mb-1">¿Qué son los sectores?</p>
          <p class="text-secondary leading-relaxed">
            Los sectores son las áreas geográficas delimitadas donde tu cooperativa tiene autorización 
            para realizar actividades mineras. Cada sector debe tener al menos 3 coordenadas GPS para 
            formar un polígono en el mapa.
          </p>
        </div>
      </div>
    </div>

    <!-- Contenido principal -->
    <div class="space-y-6">
      <SectorManager v-model="sectores" />
    </div>

    <!-- Estado de validación -->
    <div v-if="sectores.length > 0">
      <!-- ✅ Sectores válidos -->
      <div
        v-if="hasValidSectors"
        class="bg-green-100/70 dark:bg-green-900/40 border border-green-400/60 dark:border-green-700 rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-green-200/50 dark:bg-green-800/50 center">
            <CheckCircle2 class="w-5 h-5 text-green-700 dark:text-green-300" />
          </div>
          <div class="text-sm">
            <p class="font-medium text-neutral mb-1">Sectores configurados correctamente</p>
            <p class="text-secondary leading-relaxed">
              Has registrado {{ sectores.length }} {{ sectores.length === 1 ? 'sector' : 'sectores' }}
              con coordenadas válidas
            </p>
          </div>
        </div>
      </div>

      <!-- ⚠️ Sectores incompletos -->
      <div
        v-else
        class="bg-yellow-100/70 dark:bg-yellow-900/40 border border-yellow-400/60 dark:border-yellow-700 rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-yellow-200/50 dark:bg-yellow-800/50 center">
            <AlertTriangle class="w-5 h-5 text-yellow-700 dark:text-yellow-300" />
          </div>
          <div class="text-sm">
            <p class="font-medium text-neutral mb-1">Sectores incompletos</p>
            <p class="text-secondary leading-relaxed">
              Asegúrate de que cada sector tenga al menos 3 coordenadas GPS
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Mapa de resumen con z-index corregido -->
    <div v-if="hasValidSectors" class="space-y-3 relative z-0">
      <div class="flex items-center gap-2">
        <Map class="w-5 h-5 text-primary" />
        <h3 class="text-lg font-semibold text-neutral">Vista General de Sectores</h3>
      </div>
      
      <div class="bg-surface border border-border rounded-xl overflow-hidden shadow-lg">
        <div class="h-[500px]">
          <PolygonMapPicker
            :sectors="sectores"
            :edit-mode="false"
            :show-search="false"
          />
        </div>
        
        <!-- Leyenda de sectores -->
        <div class="p-4 bg-hover border-t border-border">
          <p class="text-xs text-tertiary mb-3">Leyenda de sectores:</p>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div
              v-for="(sector, index) in sectores"
              :key="index"
              class="flex items-center gap-2"
            >
              <div
                class="w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 shadow-sm shrink-0"
                :style="{ backgroundColor: sector.color }"
              ></div>
              <span class="text-xs text-neutral truncate">{{ sector.nombre }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ayuda adicional -->
    <div class="bg-surface border border-border rounded-lg p-4">
      <div class="flex items-center gap-2 mb-3">
        <Map class="w-5 h-5 text-primary" />
        <h4 class="text-sm font-semibold text-neutral">Consejos para definir sectores</h4>
      </div>
      <ul class="space-y-2 text-sm text-secondary">
        <li class="flex items-start gap-2">
          <ChevronRight class="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>Haz clic directamente en el mapa para agregar puntos del perímetro</span>
        </li>
        <li class="flex items-start gap-2">
          <ChevronRight class="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>Usa el buscador del mapa para encontrar ubicaciones específicas</span>
        </li>
        <li class="flex items-start gap-2">
          <ChevronRight class="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>Arrastra los marcadores para ajustar la posición de cada punto</span>
        </li>
        <li class="flex items-start gap-2">
          <ChevronRight class="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>Asigna un nombre único y color diferente a cada sector</span>
        </li>
        <li class="flex items-start gap-2">
          <ChevronRight class="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>Evita que los sectores se solapen entre sí</span>
        </li>
      </ul>
    </div>
  </div>
</template>