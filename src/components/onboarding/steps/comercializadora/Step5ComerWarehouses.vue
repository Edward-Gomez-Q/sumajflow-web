<script setup>
import { computed } from 'vue'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Warehouse, Package, TrendingUp, Maximize2, CheckCircle, AlertTriangle, Info, BookOpen, Shield, DollarSign, Target } from 'lucide-vue-next'
import WarehouseManager from '../../shared/WarehouseManager.vue'

const onboardingStore = useOnboardingStore()

const comercializadoraData = computed({
  get: () => onboardingStore.comercializadoraData,
  set: (val) => {
    onboardingStore.comercializadoraData = val
  }
})

const almacenes = computed({
  get: () => comercializadoraData.value.almacenes,
  set: (val) => {
    comercializadoraData.value = {
      ...comercializadoraData.value,
      almacenes: val
    }
  }
})

// Minerales disponibles según lo que comercializa
const availableMinerals = computed(() => {
  return comercializadoraData.value.minerales_comercializados || []
})

// Validación: al menos un almacén
const hasValidWarehouses = computed(() => {
  return almacenes.value.length > 0 && 
         almacenes.value.every(almacen => 
           almacen.nombre?.trim() !== '' &&
           almacen.capacidad_maxima > 0
         )
})

// Estadísticas
const totalCapacity = computed(() => {
  return almacenes.value.reduce((sum, a) => sum + (a.capacidad_maxima || 0), 0)
})

const totalArea = computed(() => {
  return almacenes.value.reduce((sum, a) => sum + (a.area || 0), 0)
})

// Valor estimado de almacenamiento
const estimatedValue = computed(() => {
  const avgPrice = 15000 // USD por tonelada (estimado)
  return (totalCapacity.value * avgPrice).toLocaleString('es-BO')
})
</script>

<template>
  <div class="space-y-8">



    <!-- Contenido del formulario -->
    <div class="space-y-6">
      
      <!-- Sección: Gestión de Almacenes -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1 flex items-center gap-2">
            <Warehouse class="w-4 h-4 text-primary" />
            Gestión de Almacenes
          </h3>
          <p class="text-sm text-secondary leading-relaxed">
            Registra los almacenes de tu comercializadora con su capacidad y características
          </p>
        </div>

        <WarehouseManager
          v-model="almacenes"
          :available-minerals="availableMinerals"
          :show-type="true"
        />
      </div>
    </div>

    <!-- Estado de validación -->
    <div v-if="almacenes.length > 0">
      <!-- ✅ Almacenes configurados correctamente -->
      <div v-if="hasValidWarehouses" class="bg-green-100/70 dark:bg-green-900/40 border border-green-400/60 dark:border-green-700 rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-green-200/50 dark:bg-green-800/50 center shrink-0">
            <CheckCircle class="w-4 h-4 text-green-700 dark:text-green-300" />
          </div>
          <div>
            <p class="font-medium text-neutral mb-1">Almacenes configurados correctamente</p>
            <p class="text-sm text-secondary leading-relaxed">
              Has registrado {{ almacenes.length }} {{ almacenes.length === 1 ? 'almacén' : 'almacenes' }} 
              con capacidad total de {{ totalCapacity.toFixed(2) }} toneladas
            </p>
          </div>
        </div>
      </div>

      <!-- ⚠️ Almacenes incompletos -->
      <div v-else class="bg-orange-100/70 dark:bg-orange-900/40 border border-orange-400/60 dark:border-orange-700 rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-orange-200/50 dark:bg-orange-800/50 center shrink-0">
            <AlertTriangle class="w-4 h-4 text-orange-700 dark:text-orange-300" />
          </div>
          <div>
            <p class="font-medium text-neutral mb-1">Almacenes incompletos</p>
            <p class="text-sm text-secondary leading-relaxed">
              Asegúrate de que cada almacén tenga nombre y capacidad definida
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div class="divider"></div>

    <!-- Tipos de almacenes recomendados -->
    <div class="space-y-4">
      <div>
        <h3 class="text-sm font-semibold text-neutral mb-1 flex items-center gap-2">
          <BookOpen class="w-4 h-4 text-primary" />
          Tipos de Almacenes Recomendados
        </h3>
        <p class="text-sm text-secondary leading-relaxed">
          Conoce los diferentes tipos de almacenes según tus necesidades comerciales
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Almacén de Concentrados -->
        <div class="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 center shrink-0">
              <Package class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div class="flex-1">
              <h5 class="font-medium text-neutral text-sm mb-1">Almacén de Concentrados</h5>
              <p class="text-xs text-secondary leading-relaxed">
                Para concentrados listos para exportación. 
                Debe ser cerrado, seguro y con control de acceso estricto.
              </p>
            </div>
          </div>
        </div>

        <!-- Almacén de Complejo -->
        <div class="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 center shrink-0">
              <TrendingUp class="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div class="flex-1">
              <h5 class="font-medium text-neutral text-sm mb-1">Almacén de Complejo</h5>
              <p class="text-xs text-secondary leading-relaxed">
                Para minerales mixtos o polimetálicos. 
                Requiere separación física estricta por tipo de mineral.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>


  </div>
</template>
