<script setup>
import { computed } from 'vue'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Warehouse, Package, TrendingUp, CheckCircle, AlertTriangle, BookOpen } from 'lucide-vue-next'
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
    <!-- Header -->
    <div>
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-lg bg-primary/10 center">
          <Warehouse class="w-5 h-5 text-primary" />
        </div>
        <h2 class="text-2xl font-semibold text-neutral">Configuración de Almacén</h2>
      </div>
      
      <p class="text-sm text-secondary leading-relaxed">
        Define el almacén principal de tu comercializadora para gestionar concentrados.
      </p>
    </div>

    <!-- Información contextual -->
    <div class="bg-blue-100/70 dark:bg-blue-900/40 border border-blue-400/60 dark:border-blue-700 rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200">
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-blue-200/50 dark:bg-blue-800/50 center shrink-0">
          <Package class="w-4 h-4 text-blue-700 dark:text-blue-300" />
        </div>
        <div class="text-sm">
          <p class="font-medium text-neutral mb-1">Almacén principal en comercializadoras</p>
          <p class="text-secondary leading-relaxed mb-2">
            El almacén es esencial para las operaciones comerciales:
          </p>
          <ul class="space-y-1 text-secondary leading-relaxed">
            <li class="flex items-start gap-2">
              <span class="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Almacenar concentrados antes de la exportación</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Control estricto de inventario y calidad</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Seguridad y trazabilidad del producto</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Cumplimiento de normativas de almacenamiento</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Contenido del formulario -->
    <div class="space-y-6">
      
      <!-- Sección: Gestión de Almacén -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1 flex items-center gap-2">
            <Warehouse class="w-4 h-4 text-primary" />
            Almacén Principal
          </h3>
          <p class="text-sm text-secondary leading-relaxed">
            Registra tu almacén principal con su capacidad y características
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
      <!-- ✅ Almacén configurado correctamente -->
      <div v-if="hasValidWarehouses" class="bg-green-100/70 dark:bg-green-900/40 border border-green-400/60 dark:border-green-700 rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-green-200/50 dark:bg-green-800/50 center shrink-0">
            <CheckCircle class="w-4 h-4 text-green-700 dark:text-green-300" />
          </div>
          <div>
            <p class="font-medium text-neutral mb-1">Almacén configurado correctamente</p>
            <p class="text-sm text-secondary leading-relaxed">
              Tu almacén principal tiene una capacidad de {{ totalCapacity.toFixed(2) }} toneladas
            </p>
          </div>
        </div>
      </div>

      <!-- ⚠️ Almacén incompleto -->
      <div v-else class="bg-orange-100/70 dark:bg-orange-900/40 border border-orange-400/60 dark:border-orange-700 rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-orange-200/50 dark:bg-orange-800/50 center shrink-0">
            <AlertTriangle class="w-4 h-4 text-orange-700 dark:text-orange-300" />
          </div>
          <div>
            <p class="font-medium text-neutral mb-1">Almacén incompleto</p>
            <p class="text-sm text-secondary leading-relaxed">
              Asegúrate de que el almacén tenga nombre y capacidad definida
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

    <!-- Divider -->
    <div class="divider"></div>

    <!-- Resumen final -->
    <div v-if="hasValidWarehouses" class="border-l-4 border-green-600 dark:border-green-400 bg-green-50/50 dark:bg-green-900/20 rounded-r-lg p-4">
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 center shrink-0">
          <CheckCircle class="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
        <p class="text-sm text-neutral leading-relaxed">
          <span class="font-semibold">¡Configuración completa!</span> Has completado toda la información 
          de tu comercializadora. Al hacer clic en "Finalizar Registro" crearemos tu cuenta y podrás comenzar 
          a operar en SumajFlow.
        </p>
      </div>
    </div>

  </div>
</template>