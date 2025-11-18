<script setup>
import { computed } from 'vue'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Warehouse, Package, TrendingUp, Maximize2, CheckCircle, AlertTriangle, Info, BookOpen, CheckSquare, Target } from 'lucide-vue-next'
import WarehouseManager from '../../shared/WarehouseManager.vue'

const onboardingStore = useOnboardingStore()

const ingenioData = computed({
  get: () => onboardingStore.ingenioData,
  set: (val) => {
    onboardingStore.ingenioData = val
  }
})

const almacenes = computed({
  get: () => ingenioData.value.almacenes,
  set: (val) => {
    ingenioData.value = {
      ...ingenioData.value,
      almacenes: val
    }
  }
})

// Minerales disponibles según la planta
const availableMinerals = computed(() => {
  return ingenioData.value.planta?.minerales || ['Ag', 'Pb', 'Zn']
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
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-lg bg-primary/10 center">
          <Warehouse class="w-5 h-5 text-primary" />
        </div>
        <h2 class="text-2xl font-semibold text-neutral">Configuración de Almacenes</h2>
      </div>
      
      <p class="text-sm text-secondary leading-relaxed">
        Define los espacios de almacenamiento de tu ingenio para gestionar concentrados y materiales procesados.
      </p>
    </div>

    <!-- Información contextual -->
    <div class="bg-blue-100/70 dark:bg-blue-900/40 border border-blue-400/60 dark:border-blue-700 rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200">
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-blue-200/50 dark:bg-blue-800/50 center flex-shrink-0">
          <Info class="w-4 h-4 text-blue-700 dark:text-blue-300" />
        </div>
        <div class="text-sm">
          <p class="font-medium text-neutral mb-1">Gestión de almacenes en ingenios</p>
          <p class="text-secondary leading-relaxed mb-2">
            Los almacenes son fundamentales para la operación eficiente de tu ingenio:
          </p>
          <ul class="space-y-1 text-secondary leading-relaxed">
            <li class="flex items-start gap-2">
              <span class="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Almacenar concentrados antes de la venta o exportación</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Separar diferentes tipos de minerales y evitar contaminación</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Control preciso de inventario y stock disponible</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Trazabilidad completa de la producción por lotes</span>
            </li>
          </ul>
        </div>
      </div>
    </div>


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
            Registra los almacenes de tu ingenio con su capacidad y características
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
          <div class="w-8 h-8 rounded-full bg-green-200/50 dark:bg-green-800/50 center flex-shrink-0">
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
          <div class="w-8 h-8 rounded-full bg-orange-200/50 dark:bg-orange-800/50 center flex-shrink-0">
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
          Conoce los diferentes tipos de almacenes según tus necesidades operativas
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Almacén de Concentrados -->
        <div class="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg center flex-shrink-0">
              <Package class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div class="flex-1">
              <h5 class="font-medium text-neutral text-sm mb-1">Almacén de Concentrados</h5>
              <p class="text-xs text-secondary leading-relaxed">
                Para concentrados finales listos para comercialización. 
                Debe ser cerrado y seguro con control de acceso.
              </p>
            </div>
          </div>
        </div>

        <!-- Almacén de Complejo -->
        <div class="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg center flex-shrink-0">
              <TrendingUp class="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div class="flex-1">
              <h5 class="font-medium text-neutral text-sm mb-1">Almacén de Complejo</h5>
              <p class="text-xs text-secondary leading-relaxed">
                Para minerales mixtos o con múltiples elementos. 
                Requiere separación por tipo para evitar mezclas.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Divider -->
    <div class="divider"></div>


    <!-- Resumen final -->
    <div v-if="hasValidWarehouses" class="border-l-4 border-green-600 dark:border-green-400 bg-green-50/50 dark:bg-green-900/20 rounded-r-lg p-4">
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 center flex-shrink-0">
          <CheckCircle class="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
        <p class="text-sm text-neutral leading-relaxed">
          <span class="font-semibold">¡Configuración completa!</span> Has completado toda la información 
          de tu ingenio minero. Al hacer clic en "Finalizar Registro" crearemos tu cuenta y podrás comenzar 
          a operar en SumajFlow.
        </p>
      </div>
    </div>

  </div>
</template>

<style scoped>
.center {
  @apply flex justify-center items-center;
}
</style>