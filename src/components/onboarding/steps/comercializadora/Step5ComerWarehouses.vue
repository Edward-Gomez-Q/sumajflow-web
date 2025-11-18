<script setup>
import { computed } from 'vue'
import { useOnboardingStore } from '@/stores/onboardingStore'
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
  return comercializadoraData.value.minerales_comercializados || ['Ag', 'Pb', 'Zn', 'Sn']
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

// Valor estimado de almacenamiento (ejemplo)
const estimatedValue = computed(() => {
  // Cálculo simplificado: capacidad * precio promedio por tonelada
  const avgPrice = 15000 // USD por tonelada (estimado)
  return (totalCapacity.value * avgPrice).toLocaleString('es-BO')
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 rounded-lg bg-primary/10 center text-2xl">
        🏢
      </div>
      <div>
        <h2 class="text-2xl font-semibold text-neutral">Configuración de Almacenes</h2>
        <p class="text-sm text-secondary">Define los espacios donde almacenas concentrados minerales</p>
      </div>
    </div>

    <!-- Información contextual -->
    <div class="bg-info/10 border border-info/30 rounded-lg p-4">
      <div class="flex gap-3">
        <div class="text-info text-xl shrink-0">💡</div>
        <div class="text-sm">
          <p class="font-medium text-neutral mb-1">Importancia de los almacenes en comercializadoras</p>
          <p class="text-secondary">
            Los almacenes son críticos para tu operación porque:
          </p>
          <ul class="mt-2 space-y-1 text-secondary">
            <li>• Custodian concentrados de alto valor</li>
            <li>• Permiten consolidar lotes para exportación</li>
            <li>• Facilitan el control de inventario</li>
            <li>• Garantizan la trazabilidad del mineral</li>
            <li>• Optimizan logística y reducen costos</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Estadísticas rápidas -->
    <div v-if="almacenes.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card bg-gradient-to-br from-primary/5 to-primary/10">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg bg-primary/20 center text-primary text-xl">
            🏢
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
            <p class="text-2xl font-bold text-neutral">
              {{ totalCapacity.toFixed(2) }} <span class="text-sm">ton</span>
            </p>
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
            <p class="text-2xl font-bold text-neutral">
              {{ totalArea.toFixed(2) }} <span class="text-sm">m²</span>
            </p>
          </div>
        </div>
      </div>

      <div class="card bg-gradient-to-br from-warning/5 to-warning/10">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg bg-warning/20 center text-warning text-xl">
            💰
          </div>
          <div>
            <p class="text-xs text-tertiary">Valor Estimado</p>
            <p class="text-lg font-bold text-neutral">
              $us {{ estimatedValue }}
            </p>
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

    <!-- Requisitos de almacenamiento -->
    <div class="border border-border rounded-lg p-4">
      <h4 class="font-medium text-neutral mb-3 flex items-center gap-2">
        <span>✅</span>
        <span>Requisitos de Almacenamiento para Comercializadoras</span>
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-hover rounded-lg p-3">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xl">🔒</span>
            <h5 class="font-medium text-neutral text-sm">Seguridad</h5>
          </div>
          <ul class="space-y-1 text-xs text-secondary">
            <li>• Cercos perimetrales y vigilancia 24/7</li>
            <li>• Sistemas de alarma y cámaras</li>
            <li>• Control de acceso registrado</li>
            <li>• Iluminación adecuada</li>
          </ul>
        </div>

        <div class="bg-hover rounded-lg p-3">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xl">🏗️</span>
            <h5 class="font-medium text-neutral text-sm">Infraestructura</h5>
          </div>
          <ul class="space-y-1 text-xs text-secondary">
            <li>• Piso de concreto o compactado</li>
            <li>• Techo para protección climática</li>
            <li>• Ventilación adecuada</li>
            <li>• Señalización de seguridad</li>
          </ul>
        </div>

        <div class="bg-hover rounded-lg p-3">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xl">🔥</span>
            <h5 class="font-medium text-neutral text-sm">Prevención de Riesgos</h5>
          </div>
          <ul class="space-y-1 text-xs text-secondary">
            <li>• Extintores certificados</li>
            <li>• Plan de emergencias</li>
            <li>• Rutas de evacuación</li>
            <li>• Capacitación del personal</li>
          </ul>
        </div>

        <div class="bg-hover rounded-lg p-3">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xl">📊</span>
            <h5 class="font-medium text-neutral text-sm">Control de Inventario</h5>
          </div>
          <ul class="space-y-1 text-xs text-secondary">
            <li>• Sistema de registro de entradas/salidas</li>
            <li>• Identificación de lotes</li>
            <li>• Inspecciones periódicas</li>
            <li>• Conciliación de stocks</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Separación por tipo de mineral -->
    <div class="bg-warning/10 border border-warning/30 rounded-lg p-4">
      <div class="flex gap-3">
        <div class="text-warning text-xl shrink-0">⚠️</div>
        <div class="text-sm">
          <p class="font-medium text-warning mb-1">Separación Obligatoria</p>
          <p class="text-warning">
            Es obligatorio mantener separados físicamente los diferentes tipos de concentrados para:
          </p>
          <ul class="mt-2 space-y-1 text-warning">
            <li>• Evitar contaminación cruzada</li>
            <li>• Facilitar la trazabilidad</li>
            <li>• Cumplir normativas de comercialización</li>
            <li>• Garantizar calidad certificada</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Mejores prácticas -->
    <div class="border border-border rounded-lg p-4">
      <h4 class="font-medium text-neutral mb-3 flex items-center gap-2">
        <span>💡</span>
        <span>Mejores Prácticas de Almacenamiento</span>
      </h4>
      <ul class="space-y-2 text-sm text-secondary">
        <li class="flex items-start gap-2">
          <span class="text-primary">→</span>
          <span><strong>Rotación FIFO:</strong> Primero en Entrar, Primero en Salir para optimizar inventarios</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-primary">→</span>
          <span><strong>Codificación clara:</strong> Etiqueta cada lote con código, fecha, origen y análisis</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-primary">→</span>
          <span><strong>Muestreo regular:</strong> Verifica calidad periódicamente</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-primary">→</span>
          <span><strong>Documentación completa:</strong> Mantén registros de entrada, análisis, almacenamiento y salida</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-primary">→</span>
          <span><strong>Seguro de mercancías:</strong> Protege tu inversión con pólizas adecuadas</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-primary">→</span>
          <span><strong>Inspecciones periódicas:</strong> Audita condiciones de almacenamiento regularmente</span>
        </li>
      </ul>
    </div>

    <!-- Capacidades recomendadas -->
    <div class="bg-info/10 border border-info/30 rounded-lg p-4">
      <div class="flex gap-3">
        <div class="text-info text-xl shrink-0">📊</div>
        <div class="text-sm">
          <p class="font-medium text-neutral mb-1">Capacidades Recomendadas</p>
          <p class="text-secondary mb-2">
            Según el volumen promedio de comercialización en Bolivia:
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div class="bg-surface rounded p-2">
              <p class="font-medium text-neutral">Pequeña</p>
              <p class="text-tertiary">50-200 ton</p>
            </div>
            <div class="bg-surface rounded p-2">
              <p class="font-medium text-neutral">Mediana</p>
              <p class="text-tertiary">200-500 ton</p>
            </div>
            <div class="bg-surface rounded p-2">
              <p class="font-medium text-neutral">Grande</p>
              <p class="text-tertiary">500+ ton</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Próximo paso -->
    <div class="border-l-4 border-primary bg-primary/5 rounded-r-lg p-4">
      <p class="text-sm text-neutral">
        <span class="font-semibold">Siguiente paso:</span> Configurarás la balanza que utilizas para el 
        pesaje de compra y venta de concentrados.
      </p>
    </div>

    <!-- Información adicional -->
    <div class="bg-accent/5 border border-accent/20 rounded-lg p-4">
      <div class="flex gap-3">
        <div class="text-accent text-xl shrink-0">🎯</div>
        <div class="text-sm">
          <p class="font-medium text-neutral mb-1">¿Planeas expandir tus almacenes?</p>
          <p class="text-secondary">
            Registra tus almacenes actuales. Podrás agregar nuevos almacenes, modificar capacidades 
            o actualizar información en cualquier momento desde tu panel de control.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>