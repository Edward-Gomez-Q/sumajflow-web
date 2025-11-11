<script setup>
import { computed } from 'vue'
import { useOnboardingStore } from '@/stores/onboardingStore'
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
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 rounded-lg bg-primary/10 center text-2xl">
        📦
      </div>
      <div>
        <h2 class="text-2xl font-semibold text-neutral">Configuración de Almacenes</h2>
        <p class="text-sm text-secondary">Define los espacios de almacenamiento de tu ingenio</p>
      </div>
    </div>

    <!-- Información contextual -->
    <div class="bg-info/10 border border-info/30 rounded-lg p-4">
      <div class="flex gap-3">
        <div class="text-info text-xl flex-shrink-0">💡</div>
        <div class="text-sm">
          <p class="font-medium text-neutral mb-1">Gestión de almacenes en ingenios</p>
          <p class="text-secondary">
            Los almacenes son fundamentales para:
          </p>
          <ul class="mt-2 space-y-1 text-secondary">
            <li>• Almacenar concentrados antes de la venta</li>
            <li>• Separar diferentes tipos de minerales</li>
            <li>• Control de inventario y stock</li>
            <li>• Trazabilidad de la producción</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Estadísticas rápidas -->
    <div v-if="almacenes.length > 0" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="card bg-gradient-to-br from-primary/5 to-primary/10">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg bg-primary/20 center text-primary text-xl">
            📦
          </div>
          <div>
            <p class="text-xs text-tertiary">Total Almacenes</p>
            <p class="text-2xl font-bold text-neutral">{{ almacenes.length }}</p>
          </div>
        </div>
      </div>

      <div class="card bg-gradient-to-br from-accent/5 to-accent/10">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg bg-accent/20 center text-accent text-xl">
            ⚖️
          </div>
          <div>
            <p class="text-xs text-tertiary">Capacidad Total</p>
            <p class="text-2xl font-bold text-neutral">{{ totalCapacity.toFixed(2) }} <span class="text-sm">ton</span></p>
          </div>
        </div>
      </div>

      <div class="card bg-gradient-to-br from-success/5 to-success/10">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg bg-success/20 center text-success text-xl">
            📐
          </div>
          <div>
            <p class="text-xs text-tertiary">Área Total</p>
            <p class="text-2xl font-bold text-neutral">{{ totalArea.toFixed(2) }} <span class="text-sm">m²</span></p>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenido principal -->
    <div class="card">
      <WarehouseManager
        v-model="almacenes"
        :available-minerals="availableMinerals"
        :show-type="true"
      />
    </div>

    <!-- Estado de validación -->
    <div v-if="almacenes.length > 0">
      <div v-if="hasValidWarehouses" class="bg-success/10 border border-success/30 rounded-lg p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-success/20 center text-success text-xl">
            ✓
          </div>
          <div>
            <p class="font-medium text-success">Almacenes configurados correctamente</p>
            <p class="text-sm text-success/80 mt-1">
              Has registrado {{ almacenes.length }} {{ almacenes.length === 1 ? 'almacén' : 'almacenes' }} 
              con capacidad total de {{ totalCapacity.toFixed(2) }} toneladas
            </p>
          </div>
        </div>
      </div>

      <div v-else class="bg-warning/10 border border-warning/30 rounded-lg p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-warning/20 center text-warning text-xl">
            ⚠️
          </div>
          <div>
            <p class="font-medium text-warning">Almacenes incompletos</p>
            <p class="text-sm text-warning/80 mt-1">
              Asegúrate de que cada almacén tenga nombre y capacidad definida
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tipos de almacenes recomendados -->
    <div class="border border-border rounded-lg p-4">
      <h4 class="font-medium text-neutral mb-3 flex items-center gap-2">
        <span>📚</span>
        <span>Tipos de Almacenes Recomendados</span>
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-hover rounded-lg p-3">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xl">📦</span>
            <h5 class="font-medium text-neutral text-sm">Almacén de Concentrados</h5>
          </div>
          <p class="text-xs text-secondary">
            Para concentrados finales listos para comercialización. 
            Debe ser cerrado y seguro.
          </p>
        </div>

        <div class="bg-hover rounded-lg p-3">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xl">🏢</span>
            <h5 class="font-medium text-neutral text-sm">Almacén de Complejo</h5>
          </div>
          <p class="text-xs text-secondary">
            Para minerales mixtos o con múltiples elementos. 
            Requiere separación por tipo.
          </p>
        </div>

        <div class="bg-hover rounded-lg p-3">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xl">🌤️</span>
            <h5 class="font-medium text-neutral text-sm">Almacén Abierto</h5>
          </div>
          <p class="text-xs text-secondary">
            Para almacenamiento temporal de material en proceso. 
            Con drenaje adecuado.
          </p>
        </div>

        <div class="bg-hover rounded-lg p-3">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xl">🏠</span>
            <h5 class="font-medium text-neutral text-sm">Almacén Cerrado</h5>
          </div>
          <p class="text-xs text-secondary">
            Protección completa contra clima. Ideal para concentrados 
            de alto valor.
          </p>
        </div>
      </div>
    </div>

    <!-- Buenas prácticas -->
    <div class="border border-border rounded-lg p-4">
      <h4 class="font-medium text-neutral mb-3 flex items-center gap-2">
        <span>✅</span>
        <span>Buenas Prácticas de Almacenamiento</span>
      </h4>
      <ul class="space-y-2 text-sm text-secondary">
        <li class="flex items-start gap-2">
          <span class="text-primary">→</span>
          <span>Mantén almacenes separados por tipo de mineral para evitar contaminación cruzada</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-primary">→</span>
          <span>Implementa sistema de inventario FIFO (Primero en Entrar, Primero en Salir)</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-primary">→</span>
          <span>Asegura ventilación adecuada en almacenes cerrados</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-primary">→</span>
          <span>Registra ubicación GPS precisa para trazabilidad</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-primary">→</span>
          <span>Mantén documentación actualizada de capacidades y contenido</span>
        </li>
      </ul>
    </div>

    <!-- Resumen final -->
    <div v-if="hasValidWarehouses" class="border-l-4 border-success bg-success/5 rounded-r-lg p-4">
      <p class="text-sm text-neutral">
        <span class="font-semibold">¡Configuración completa!</span> Has completado toda la información 
        de tu ingenio minero. Al hacer clic en "Finalizar Registro" crearemos tu cuenta y podrás comenzar 
        a operar en SumajFlow.
      </p>
    </div>

    <!-- Información adicional -->
    <div class="bg-accent/5 border border-accent/20 rounded-lg p-4">
      <div class="flex gap-3">
        <div class="text-accent text-xl flex-shrink-0">🎯</div>
        <div class="text-sm">
          <p class="font-medium text-neutral mb-1">¿Necesitas más almacenes después?</p>
          <p class="text-secondary">
            Registra los almacenes principales ahora. Podrás agregar, modificar o eliminar almacenes 
            en cualquier momento desde tu panel de control.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>