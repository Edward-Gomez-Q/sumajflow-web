<!-- src/views/comercializadora/Concentrados.vue -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useConcentradosComercializadoraStore } from '@/stores/comercializadora/concentradosComercializadoraStore'
import AppLayout from '@/components/layout/AppLayout.vue'
import {
  PackageCheck,
  Eye,
  Building2,
  Calendar,
  User,
  Droplet
} from 'lucide-vue-next'
import { getEstadoConfig } from '@/utils/concentradoEstados'
import ConcentradosFiltrosComercializadora from '@/components/comercializadora/ConcentradosFiltrosComercializadora.vue'
import Paginacion from '@/components/socio/Paginacion.vue'
import ModalConcentradoDetalleComercializadora from '@/components/comercializadora/ModalConcentradoDetalleComercializadora.vue'
import { useConcentradoWS } from '@/composables/useConcentradoWS'
const concentradosStore = useConcentradosComercializadoraStore()

const mostrarModalDetalle = ref(false)
const concentradoSeleccionadoId = ref(null)
const concentradoWs = useConcentradoWS()

onMounted(async () => {
  await concentradoWs.suscribirCola((data) => {
    console.log('🔔 Actualización recibida:', data)
    concentradosStore.fetchConcentrados()
  })
  await concentradosStore.fetchConcentrados()
})

onUnmounted(() => {
  concentradoWs.desuscribirCola()
})

const verDetalle = (concentrado) => {
  concentradoSeleccionadoId.value = concentrado.id
  mostrarModalDetalle.value = true
}

const aplicarFiltros = async (filtros) => {
  await concentradosStore.aplicarFiltros(filtros)
}

const limpiarFiltros = async () => {
  await concentradosStore.limpiarFiltros()
}

const cambiarPagina = async (pagina) => {
  await concentradosStore.cambiarPagina(pagina)
}

const cambiarTamanoPagina = async (tamano) => {
  await concentradosStore.cambiarTamanoPagina(tamano)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-BO', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  })
}

const formatPeso = (peso) => {
  if (!peso) return '0'
  return parseFloat(peso).toFixed(2)
}
</script>

<template>
  <AppLayout>
    <div class="space-y-4 pb-6">
      <!-- Header -->
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-neutral">Concentrados</h1>
            <p class="text-secondary mt-1 text-sm sm:text-base">
              Concentrados de tus compras aprobadas
            </p>
          </div>
          <div class="flex items-center gap-3">
            <ConcentradosFiltrosComercializadora
              :filtros-actuales="concentradosStore.filtros"
              @aplicar="aplicarFiltros"
              @limpiar="limpiarFiltros"
            />
          </div>
        </div>

        <!-- Resumen rápido -->
        <div class="grid grid-cols-3 gap-3 sm:gap-4">
          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500 center shrink-0">
                <PackageCheck class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Total</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ concentradosStore.paginacion.totalElementos }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-orange-500 center shrink-0">
                <PackageCheck class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">En Venta</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ concentradosStore.concentradosEnVenta.length }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500 center shrink-0">
                <PackageCheck class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Vendidos</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ concentradosStore.concentradosVendidos.length }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Lista de Concentrados -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          v-for="concentrado in concentradosStore.concentrados"
          :key="concentrado.id"
          class="bg-base rounded-xl p-4 border border-border shadow-sm hover:shadow-lg transition-all cursor-pointer"
          @click="verDetalle(concentrado)"
        >
          <div class="space-y-3">
            <!-- Header -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <div 
                  class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg center shrink-0"
                  :class="getEstadoConfig(concentrado.estado).color"
                >
                  <PackageCheck class="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="font-semibold text-neutral text-base sm:text-lg truncate">
                      00{{ concentrado.id }}
                    </h3>
                    <span 
                      v-if="concentrado.mineralPrincipal"
                      class="text-xs px-2 py-1 rounded-lg font-medium bg-indigo-500 text-white"
                    >
                      {{ concentrado.mineralPrincipal }}
                    </span>
                  </div>
                  
                  <!-- Socio -->
                  <div class="flex items-center gap-2 mt-1 text-xs sm:text-sm text-secondary">
                    <User class="w-3 h-3 sm:w-4 sm:h-4" />
                    <span class="truncate">{{ concentrado.socioNombres }} {{ concentrado.socioApellidos }}</span>
                  </div>
                  
                  <!-- Ingenio -->
                  <div class="flex items-center gap-2 mt-0.5 text-xs text-secondary">
                    <Building2 class="w-3 h-3" />
                    <span class="truncate">{{ concentrado.ingenioNombre }}</span>
                  </div>
                </div>
              </div>
              <span 
                class="px-2 py-1 rounded-lg text-xs font-medium shrink-0"
                :class="[getEstadoConfig(concentrado.estado).color, getEstadoConfig(concentrado.estado).textColor]"
              >
                {{ getEstadoConfig(concentrado.estado).label }}
              </span>
            </div>

            <!-- Info Grid -->
            <div class="grid grid-cols-2 gap-3 pt-3 border-t border-border">
              <div>
                <p class="text-xs text-secondary flex items-center gap-1">
                  <Droplet class="w-3 h-3" />
                  Peso Final
                </p>
                <p class="text-sm font-medium text-neutral mt-0.5">
                  {{ formatPeso(concentrado.pesoFinal) }} Ton
                </p>
              </div>
              <div>
                <p class="text-xs text-secondary flex items-center gap-1">
                  <PackageCheck class="w-3 h-3" />
                  Lotes
                </p>
                <p class="text-sm font-medium text-neutral mt-0.5">
                  {{ concentrado.lotes?.length || 0 }}
                </p>
              </div>
              <div class="col-span-2">
                <p class="text-xs text-secondary flex items-center gap-1">
                  <Calendar class="w-3 h-3" />
                  Creado
                </p>
                <p class="text-sm font-medium text-neutral mt-0.5">
                  {{ formatDate(concentrado.fechaInicio) }}
                </p>
              </div>
            </div>

            <!-- Liquidaciones de Venta -->
            <div v-if="concentrado.liquidacionesVenta && concentrado.liquidacionesVenta.length > 0" 
                 class="pt-3 border-t border-border">
              <p class="text-xs text-secondary mb-2">Liquidaciones asociadas:</p>
              <div class="flex flex-wrap gap-1.5">
                <span 
                  v-for="liq in concentrado.liquidacionesVenta" 
                  :key="liq.id"
                  class="px-2 py-1 rounded-md text-xs font-medium"
                  :class="liq.estado === 'pagado' 
                    ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
                    : 'bg-orange-500/10 text-orange-600 border border-orange-500/20'"
                >
                  #{{ liq.id }}
                </span>
              </div>
            </div>

            <!-- Acción -->
            <div class="pt-2 border-t border-border">
              <button
                @click.stop="verDetalle(concentrado)"
                class="btn-outline text-xs sm:text-sm px-3 py-2 flex items-center justify-center gap-2 w-full"
              >
                <Eye class="w-4 h-4" />
                <span>Ver Detalle</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Estado vacío -->
        <div v-if="concentradosStore.concentrados.length === 0 && !concentradosStore.error" 
             class="col-span-full text-center py-12">
          <div class="w-16 h-16 rounded-full bg-primary/10 center mx-auto mb-4">
            <PackageCheck class="w-8 h-8 text-primary" />
          </div>
          <h3 class="text-lg font-semibold text-neutral mb-2">
            No hay concentrados
          </h3>
          <p class="text-sm text-secondary">
            Aún no tienes concentrados de ventas aprobadas
          </p>
        </div>
      </div>

      <!-- Paginación -->
      <Paginacion
        v-if="concentradosStore.concentrados.length > 0"
        :pagina-actual="concentradosStore.paginacion.paginaActual"
        :total-paginas="concentradosStore.paginacion.totalPaginas"
        :total-elementos="concentradosStore.paginacion.totalElementos"
        :elementos-por-pagina="concentradosStore.paginacion.elementosPorPagina"
        :tiene-siguiente="concentradosStore.paginacion.tieneSiguiente"
        :tiene-anterior="concentradosStore.paginacion.tieneAnterior"
        @cambiar-pagina="cambiarPagina"
        @cambiar-tamano="cambiarTamanoPagina"
      />
    </div>

    <!-- Modal Detalle -->
    <ModalConcentradoDetalleComercializadora
      v-if="mostrarModalDetalle"
      :concentrado-id="concentradoSeleccionadoId"
      @close="mostrarModalDetalle = false"
    />
  </AppLayout>
</template>