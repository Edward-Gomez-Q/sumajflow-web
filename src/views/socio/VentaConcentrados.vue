<!-- src/views/socio/VentaConcentrados.vue -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useVentaConcentradoStore } from '@/stores/socio/ventaConcentradoStore'
import { useConcentradoWS } from '@/composables/useConcentradoWS'
import AppLayout from '@/components/layout/AppLayout.vue'
import {
  ShoppingCart,
  Plus,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  FileText,
  TrendingUp,
  Package
} from 'lucide-vue-next'
import { getVentaEstadoConfig } from '@/utils/ventaEstados'
import VentaFiltros from '@/components/socio/venta/VentaFiltros.vue'
import Paginacion from '@/components/socio/Paginacion.vue'
import ModalCrearVentaConcentrado from '@/components/socio/venta/ModalCrearVentaConcentrado.vue'
import ModalVentaDetalleSocio from '@/components/socio/venta/ModalVentaDetalleSocio.vue'

const ventaStore = useVentaConcentradoStore()
const concentradoWs = useConcentradoWS()

const mostrarModalCrear = ref(false)
const mostrarModalDetalle = ref(false)
const ventaSeleccionadaId = ref(null)

onMounted(async () => {
  await concentradoWs.suscribirCola((data) => {
    ventaStore.fetchVentas()
    ventaStore.fetchEstadisticas()
  })
  await ventaStore.fetchVentas()
  await ventaStore.fetchEstadisticas()
})

onUnmounted(() => {
  concentradoWs.desuscribirCola()
})

const verDetalle = (venta) => {
  ventaSeleccionadaId.value = venta.id
  mostrarModalDetalle.value = true
}

const handleVentaCreada = () => {
  mostrarModalCrear.value = false
  ventaStore.fetchVentas()
  ventaStore.fetchEstadisticas()
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('es-BO', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

const formatCurrency = (value, currency = 'BOB') => {
  if (!value) return '-'
  return new Intl.NumberFormat('es-BO', { style: 'currency', currency }).format(value)
}
</script>

<template>
  <AppLayout>
    <div class="space-y-4 pb-6">
      <!-- Header -->
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-neutral">Venta de Concentrados</h1>
            <p class="text-secondary mt-1 text-sm sm:text-base">
              Gestiona la venta de tus concentrados a comercializadoras
            </p>
          </div>
          <div class="flex items-center gap-3">
            <VentaFiltros
              :filtros-actuales="ventaStore.filtros"
              @aplicar="ventaStore.aplicarFiltros"
              @limpiar="ventaStore.limpiarFiltros"
            />
            <button
              @click="mostrarModalCrear = true"
              class="btn flex items-center gap-2"
            >
              <Plus class="w-4 h-4" />
              <span class="hidden sm:inline">Nueva Venta</span>
            </button>
          </div>
        </div>

        <!-- Estadísticas -->
        <div v-if="ventaStore.estadisticas" class="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500 center shrink-0">
                <ShoppingCart class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Total</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ ventaStore.estadisticas.total }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-yellow-500 center shrink-0">
                <Clock class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Pendientes</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ ventaStore.estadisticas.pendienteAprobacion }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-500 center shrink-0">
                <FileText class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Esperando Cierre</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ ventaStore.estadisticas.esperandoCierreVenta }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500 center shrink-0">
                <CheckCircle2 class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Pagadas</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ ventaStore.estadisticas.pagadas }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-600 center shrink-0">
                <DollarSign class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Cobrado</h3>
                <p class="text-lg font-bold text-neutral">
                  {{ formatCurrency(ventaStore.estadisticas.totalCobradoBob) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Lista de Ventas -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
        v-for="venta in ventaStore.ventas"
        :key="venta.id"
        class="bg-base rounded-xl p-4 border border-border shadow-sm hover:shadow-lg transition-all cursor-pointer"
        @click="verDetalle(venta)"
      >
        <div class="space-y-3">
          <!-- Header -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3 flex-1 min-w-0">
              <div
                class="w-12 h-12 rounded-lg center shrink-0"
                :class="getVentaEstadoConfig(venta.estado).color"
              >
                <ShoppingCart class="w-6 h-6 text-white" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="font-semibold text-neutral text-lg">
                    Liquidación #{{ venta.id }}
                  </h3>
                  <span
                    v-if="venta.mineralPrincipal"
                    class="text-xs px-2 py-1 rounded-lg font-medium bg-indigo-500 text-white"
                  >
                    {{ venta.mineralPrincipal }}
                  </span>
                </div>
                <p class="text-sm text-secondary mt-1 truncate">
                  {{ venta.comercializadoraNombre }}
                </p>
              </div>
            </div>
            <span
              class="px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 text-white"
              :class="getVentaEstadoConfig(venta.estado).badgeClass"
            >
              {{ getVentaEstadoConfig(venta.estado).label }}
            </span>
          </div>

          <!-- Info Grid -->
          <div class="grid grid-cols-2 gap-3 pt-3 border-t border-border">
            <div>
              <p class="text-xs text-secondary">Concentrados</p>
              <p class="text-sm font-medium text-neutral mt-0.5">
                {{ venta.concentrados?.length || 0 }} unidad(es)
              </p>
            </div>
            <div>
              <p class="text-xs text-secondary">Moneda</p>
              <p class="text-sm font-medium text-neutral mt-0.5">
                {{ venta.moneda || 'BOB' }}
              </p>
            </div>
            <div>
              <p class="text-xs text-secondary">Peso TMS</p>
              <p class="text-sm font-medium text-neutral mt-0.5">
                {{ venta.pesoTms?.toFixed(4) || '0.0000' }}
              </p>
            </div>
            <div>
              <p class="text-xs text-secondary">Final TMS</p>
              <p class="text-sm font-medium text-neutral mt-0.5">
                {{ venta.pesoFinalTms?.toFixed(4) || '0.0000' }}
              </p>
            </div>
            <div class="col-span-2">
              <p class="text-xs text-secondary">Creado</p>
              <p class="text-sm font-medium text-neutral mt-0.5">
                {{ formatDate(venta.createdAt) }}
              </p>
            </div>
          </div>

          <!-- Observaciones si existen -->
          <div v-if="venta.observaciones" class="pt-2 border-t border-border">
            <p class="text-xs text-secondary mb-1">Observaciones</p>
            <p class="text-sm text-neutral line-clamp-2">
              {{ venta.observaciones }}
            </p>
          </div>

          <!-- Acción -->
          <div class="pt-2 border-t border-border">
            <button
              @click.stop="verDetalle(venta)"
              class="btn-outline text-xs sm:text-sm px-3 py-2 flex items-center justify-center gap-2 w-full"
            >
              <Eye class="w-4 h-4" />
              <span>Ver Detalle</span>
            </button>
          </div>
        </div>
      </div>


        <!-- Estado vacío -->
        <div v-if="ventaStore.ventas.length === 0 && !ventaStore.error" class="col-span-full text-center py-12">
          <div class="w-16 h-16 rounded-full bg-primary/10 center mx-auto mb-4">
            <ShoppingCart class="w-8 h-8 text-primary" />
          </div>
          <h3 class="text-lg font-semibold text-neutral mb-2">No tienes ventas</h3>
          <p class="text-sm text-secondary mb-4">Crea tu primera venta de concentrado</p>
          <button @click="mostrarModalCrear = true" class="btn">
            <Plus class="w-4 h-4" /> Nueva Venta
          </button>
        </div>
      </div>

      <!-- Paginación -->
      <Paginacion
        v-if="ventaStore.ventas.length > 0"
        :pagina-actual="ventaStore.paginacion.paginaActual"
        :total-paginas="ventaStore.paginacion.totalPaginas"
        :total-elementos="ventaStore.paginacion.totalElementos"
        :elementos-por-pagina="ventaStore.paginacion.elementosPorPagina"
        :tiene-siguiente="ventaStore.paginacion.tieneSiguiente"
        :tiene-anterior="ventaStore.paginacion.tieneAnterior"
        @cambiar-pagina="ventaStore.cambiarPagina"
        @cambiar-tamano="ventaStore.cambiarTamanoPagina"
      />
    </div>

    <!-- Modal Crear -->
    <ModalCrearVentaConcentrado
      v-if="mostrarModalCrear"
      @close="mostrarModalCrear = false"
      @creado="handleVentaCreada"
    />

    <!-- Modal Detalle -->
    <ModalVentaDetalleSocio
      v-if="mostrarModalDetalle"
      :venta-id="ventaSeleccionadaId"
      @close="mostrarModalDetalle = false"
      @actualizado="() => { ventaStore.fetchVentas(); ventaStore.fetchEstadisticas() }"
    />
  </AppLayout>
</template>