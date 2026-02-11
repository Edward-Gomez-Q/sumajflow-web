<!-- src/views/comercializadora/TablaPrecios.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTablaPreciosStore } from '@/stores/comercializadora/tablaPreciosStore'
import { useUIStore } from '@/stores/uiStore'
import AppLayout from '@/components/layout/AppLayout.vue'
import {
  DollarSign,
  Plus,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Trash2,
  Info,
  TrendingUp,
  Loader2,
  Settings,
  BarChart3,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-vue-next'
import ModalCrearPrecio from '@/components/comercializadora/tablaPrecios/ModalCrearPrecio.vue'
import ModalEditarPrecio from '@/components/comercializadora/tablaPrecios/ModalEditarPrecio.vue'

const tablaPreciosStore = useTablaPreciosStore()
const uiStore = useUIStore()

const mostrarModalCrear = ref(false)
const mostrarModalEditar = ref(false)
const precioEditar = ref(null)
const mineralSeleccionado = ref('todos')

const minerales = [
  { 
    value: 'todos', 
    label: 'Todos los Minerales'
  },
  { 
    value: 'Pb', 
    label: 'Plomo', 
    simbolo: 'Pb'
  },
  { 
    value: 'Zn', 
    label: 'Zinc', 
    simbolo: 'Zn'
  },
  { 
    value: 'Ag', 
    label: 'Plata', 
    simbolo: 'Ag'
  }
]

onMounted(async () => {
  await tablaPreciosStore.fetchPreciosAgrupados()
  await tablaPreciosStore.validarConfiguracion()
})

const preciosFiltrados = computed(() => {
  if (mineralSeleccionado.value === 'todos') {
    return tablaPreciosStore.preciosAgrupados
  }
  
  const mineral = mineralSeleccionado.value
  return {
    [mineral]: tablaPreciosStore.preciosAgrupados[mineral] || []
  }
})

const configuracionCompleta = computed(() => 
  tablaPreciosStore.tieneConfiguracionCompleta
)

const handleCrear = () => {
  mostrarModalCrear.value = true
}

const handleEditar = (precio) => {
  precioEditar.value = precio
  mostrarModalEditar.value = true
}

const handleEliminar = async (precio) => {
  const ok = await uiStore.showConfirm(
    `¿Eliminar el rango ${precio.mineral} de ${formatNumber(precio.rangoMinimo)} a ${formatNumber(precio.rangoMaximo)} ${precio.unidadMedida}?`,
    'Confirmar Eliminación'
  )
  if (!ok) return

  await tablaPreciosStore.eliminar(precio.id)
}

const handleDesactivar = async (precio) => {
  const ok = await uiStore.showConfirm(
    `¿Desactivar este rango de precios?`,
    'Confirmar Desactivación'
  )
  if (!ok) return

  await tablaPreciosStore.desactivar(precio.id)
}

const getMineralConfig = (mineral) => {
  return minerales.find(m => m.value === mineral) || minerales[0]
}

const formatNumber = (num) => {
  return new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(num)
}

const formatCurrency = (num) => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(num)
}

const totalRangosTodos = computed(() => {
  return (tablaPreciosStore.totalRangos.Pb || 0) +
         (tablaPreciosStore.totalRangos.Zn || 0) +
         (tablaPreciosStore.totalRangos.Ag || 0)
})
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <DollarSign class="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-neutral">Tabla de Precios de Minerales</h1>
            <p class="text-secondary text-sm mt-0.5">
              Configura los rangos de precios para Pb, Zn y Ag
            </p>
          </div>
        </div>
      </div>

      <!-- Estado de Configuración -->
      <div
        v-if="tablaPreciosStore.validacion"
        :class="[
          'card',
          configuracionCompleta 
            ? 'border-success/30' 
            : 'border-warning/30'
        ]"
      >
        <div class="flex items-start gap-3">
          <div
            :class="[
              'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
              configuracionCompleta 
                ? 'bg-success/10' 
                : 'bg-warning/10'
            ]"
          >
            <component 
              :is="configuracionCompleta ? CheckCircle2 : AlertCircle"
              :class="[
                'w-5 h-5',
                configuracionCompleta ? 'text-success' : 'text-warning'
              ]"
            />
          </div>
          <div class="flex-1">
            <h3 :class="['font-semibold text-base text-neutral']">
              {{ configuracionCompleta 
                  ? 'Configuración Completa' 
                  : 'Configuración Incompleta' }}
            </h3>
            <p :class="['text-sm mt-1 text-secondary']">
              {{ configuracionCompleta
                  ? 'Todos los minerales tienen rangos configurados. Puedes aprobar ventas de lotes complejos.'
                  : 'Faltan configurar precios para algunos minerales. No podrás aprobar ventas de lotes complejos hasta completar la configuración.' }}
            </p>

            <!-- Errores -->
            <div v-if="tablaPreciosStore.validacion.errores?.length" class="mt-4 space-y-2">
              <p class="text-xs font-semibold text-error">Errores detectados:</p>
              <ul class="space-y-1.5">
                <li 
                  v-for="(error, idx) in tablaPreciosStore.validacion.errores" 
                  :key="idx" 
                  class="flex items-start gap-2 text-xs text-error"
                >
                  <AlertCircle class="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{{ error }}</span>
                </li>
              </ul>
            </div>

            <!-- Advertencias -->
            <div v-if="tablaPreciosStore.validacion.advertencias?.length" class="mt-4 space-y-2">
              <p class="text-xs font-semibold text-warning">Advertencias:</p>
              <ul class="space-y-1.5">
                <li 
                  v-for="(adv, idx) in tablaPreciosStore.validacion.advertencias" 
                  :key="idx" 
                  class="flex items-start gap-2 text-xs text-warning"
                >
                  <Info class="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{{ adv }}</span>
                </li>
              </ul>
            </div>

            <!-- Resumen -->
            <div class="mt-5 grid grid-cols-3 gap-3">
              <div class="bg-hover rounded-lg px-3 py-2.5 border border-border">
                <div class="flex items-center gap-2 mb-1.5">
                  <div class="w-7 h-7 rounded border-2 border-info bg-info/10 flex items-center justify-center">
                    <span class="text-info text-xs font-semibold">Pb</span>
                  </div>
                  <p class="text-xs text-secondary">Plomo</p>
                </div>
                <p class="text-sm font-semibold text-neutral">
                  {{ tablaPreciosStore.totalRangos.Pb || 0 }} rangos
                </p>
              </div>
              <div class="bg-hover rounded-lg px-3 py-2.5 border border-border">
                <div class="flex items-center gap-2 mb-1.5">
                  <div class="w-7 h-7 rounded border-2 border-success bg-success/10 flex items-center justify-center">
                    <span class="text-success text-xs font-semibold">Zn</span>
                  </div>
                  <p class="text-xs text-secondary">Zinc</p>
                </div>
                <p class="text-sm font-semibold text-neutral">
                  {{ tablaPreciosStore.totalRangos.Zn || 0 }} rangos
                </p>
              </div>
              <div class="bg-hover rounded-lg px-3 py-2.5 border border-border">
                <div class="flex items-center gap-2 mb-1.5">
                  <div class="w-7 h-7 rounded border-2 border-warning bg-warning/10 flex items-center justify-center">
                    <span class="text-warning text-xs font-semibold">Ag</span>
                  </div>
                  <p class="text-xs text-secondary">Plata</p>
                </div>
                <p class="text-sm font-semibold text-neutral">
                  {{ tablaPreciosStore.totalRangos.Ag || 0 }} rangos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions y Filtros -->
      <div class="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="mineral in minerales"
            :key="mineral.value"
            @click="mineralSeleccionado = mineral.value"
            :class="[
              'px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2.5',
              mineralSeleccionado === mineral.value
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface border border-border text-secondary hover:text-neutral hover:border-primary/30'
            ]"
          >
            <div 
              v-if="mineral.simbolo"
              class="w-5 h-5 rounded flex items-center justify-center text-xs font-bold border"
              :class="mineralSeleccionado === mineral.value 
                ? 'bg-white/15 text-white border-white/30' 
                : 'bg-primary/10 text-primary border-primary/30'"
            >
              {{ mineral.simbolo }}
            </div>
            <BarChart3 v-else class="w-4 h-4" />
            <span>{{ mineral.label }}</span>
            <span 
              v-if="mineral.value === 'todos' && totalRangosTodos > 0"
              class="px-2 py-0.5 rounded-full text-xs font-semibold"
              :class="mineralSeleccionado === mineral.value 
                ? 'bg-white/15 text-white' 
                : 'bg-primary/10 text-primary'"
            >
              {{ totalRangosTodos }}
            </span>
          </button>
        </div>

        <button
          @click="handleCrear"
          class="btn flex items-center gap-2 whitespace-nowrap"
        >
          <Plus class="w-4 h-4" />
          <span>Nuevo Rango</span>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="tablaPreciosStore.loading" class="card p-12 text-center">
        <Loader2 class="inline-block animate-spin h-12 w-12 text-primary mb-4" />
        <p class="text-secondary">Cargando tabla de precios...</p>
      </div>

      <!-- Tabla de Precios por Mineral -->
      <div v-else-if="Object.keys(preciosFiltrados).length > 0" class="space-y-5">
        <div
          v-for="(rangos, mineral) in preciosFiltrados"
          :key="mineral"
          class="card-flat overflow-hidden p-0"
        >
          <!-- Header por Mineral -->
          <div class="px-5 py-4 border-b border-border bg-hover flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div 
                class="w-10 h-10 rounded-lg flex items-center justify-center border-2"
                :class="{
                  'border-info bg-info/10': mineral === 'Pb',
                  'border-success bg-success/10': mineral === 'Zn',
                  'border-warning bg-warning/10': mineral === 'Ag'
                }"
              >
                <span 
                  class="text-base font-bold"
                  :class="{
                    'text-info': mineral === 'Pb',
                    'text-success': mineral === 'Zn',
                    'text-warning': mineral === 'Ag'
                  }"
                >
                  {{ getMineralConfig(mineral).simbolo || mineral }}
                </span>
              </div>
              <div>
                <h3 class="font-semibold text-neutral text-base">
                  {{ getMineralConfig(mineral).label }}
                </h3>
                <p class="text-xs text-secondary">
                  {{ rangos.length }} rango{{ rangos.length !== 1 ? 's' : '' }} configurado{{ rangos.length !== 1 ? 's' : '' }}
                </p>
              </div>
            </div>
            <Settings class="w-5 h-5 text-secondary" />
          </div>

          <!-- Tabla -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-hover text-xs text-secondary uppercase tracking-wider">
                <tr>
                  <th class="px-5 py-3.5 text-left font-semibold">Rango</th>
                  <th class="px-5 py-3.5 text-left font-semibold">Unidad</th>
                  <th class="px-5 py-3.5 text-right font-semibold">Precio (USD)</th>
                  <th class="px-5 py-3.5 text-left font-semibold">Vigencia</th>
                  <th class="px-5 py-3.5 text-center font-semibold">Estado</th>
                  <th class="px-5 py-3.5 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr
                  v-for="precio in rangos"
                  :key="precio.id"
                  :class="[
                    'hover:bg-hover transition-colors',
                    !precio.activo && 'opacity-60'
                  ]"
                >
                  <td class="px-5 py-4">
                    <div class="flex items-center gap-2">
                      <div class="flex items-center gap-1">
                        <ArrowUpCircle class="w-3.5 h-3.5 text-success" />
                        <span class="text-sm font-medium text-neutral">
                          {{ formatNumber(precio.rangoMinimo) }}
                        </span>
                      </div>
                      <span class="text-tertiary">-</span>
                      <div class="flex items-center gap-1">
                        <ArrowDownCircle class="w-3.5 h-3.5 text-error" />
                        <span class="text-sm font-medium text-neutral">
                          {{ formatNumber(precio.rangoMaximo) }}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td class="px-5 py-4">
                    <span class="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary font-medium border border-primary/30">
                      {{ precio.unidadMedida }}
                    </span>
                  </td>
                  <td class="px-5 py-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <DollarSign class="w-3.5 h-3.5 text-secondary" />
                      <span class="text-sm font-semibold text-neutral">
                        {{ formatNumber(precio.precioUsd) }}
                      </span>
                    </div>
                  </td>
                  <td class="px-5 py-4">
                    <div class="text-xs space-y-1">
                      <div class="flex items-center gap-1.5 text-secondary">
                        <TrendingUp class="w-3 h-3" />
                        <span>{{ precio.fechaInicio }}</span>
                      </div>
                      <div v-if="precio.fechaFin" class="flex items-center gap-1.5 text-secondary">
                        <TrendingUp class="w-3 h-3 rotate-180" />
                        <span>{{ precio.fechaFin }}</span>
                      </div>
                      <p v-else class="text-success font-medium flex items-center gap-1">
                        <CheckCircle2 class="w-3 h-3" />
                        Vigente
                      </p>
                    </div>
                  </td>
                  <td class="px-5 py-4 text-center">
                    <span
                      :class="[
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                        precio.activo
                          ? 'bg-success/10 text-success border-success/30'
                          : 'bg-neutral-secondary/10 text-neutral-secondary border-neutral-secondary/30'
                      ]"
                    >
                      <div :class="['w-1.5 h-1.5 rounded-full', precio.activo ? 'bg-success' : 'bg-neutral-secondary']"></div>
                      {{ precio.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="px-5 py-4">
                    <div class="flex items-center justify-end gap-1">
                      <button
                        @click="handleEditar(precio)"
                        class="p-2 hover:bg-hover rounded-lg text-secondary hover:text-primary transition-colors"
                        title="Editar"
                      >
                        <Edit2 class="w-4 h-4" />
                      </button>
                      <button
                        @click="handleEliminar(precio)"
                        class="p-2 hover:bg-error/10 rounded-lg text-secondary hover:text-error transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Observaciones -->
          <div v-if="rangos.some(r => r.observaciones)" class="px-5 py-4 bg-hover border-t border-border">
            <div class="flex items-start gap-2">
              <Info class="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              <div class="flex-1">
                <p class="text-xs font-semibold text-secondary mb-2">Observaciones:</p>
                <div class="space-y-1.5">
                  <div
                    v-for="(precio, idx) in rangos.filter(r => r.observaciones)"
                    :key="idx"
                    class="text-xs text-tertiary flex gap-2"
                  >
                    <span class="font-medium text-neutral shrink-0">
                      {{ formatNumber(precio.rangoMinimo) }}-{{ formatNumber(precio.rangoMaximo) }}:
                    </span>
                    <span>{{ precio.observaciones }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="card p-12 text-center">
        <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <DollarSign class="w-8 h-8 text-primary" />
        </div>
        <h3 class="text-lg font-semibold text-neutral mb-2">
          No hay rangos de precios configurados
        </h3>
        <p class="text-sm text-secondary mb-6 max-w-md mx-auto">
          {{ mineralSeleccionado === 'todos' 
            ? 'Crea tu primera escala de precios para comenzar a liquidar lotes complejos' 
            : `Configura rangos de precios para ${getMineralConfig(mineralSeleccionado).label}` }}
        </p>
        <button
          @click="handleCrear"
          class="btn mx-auto flex items-center gap-2"
        >
          <Plus class="w-4 h-4" />
          <span>Crear Primer Rango</span>
        </button>
      </div>
    </div>

    <!-- Modales -->
    <ModalCrearPrecio
      v-if="mostrarModalCrear"
      @close="mostrarModalCrear = false"
    />

    <ModalEditarPrecio
      v-if="mostrarModalEditar && precioEditar"
      :precio="precioEditar"
      @close="mostrarModalEditar = false; precioEditar = null"
    />
  </AppLayout>
</template>