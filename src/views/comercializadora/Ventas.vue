<!-- src/views/comercializadora/Ventas.vue -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useVentaComercializadoraStore } from '@/stores/comercializadora/ventaComercializadoraStore'
import AppLayout from '@/components/layout/AppLayout.vue'
import {
  ShoppingCart, Eye, Clock, CheckCircle2, DollarSign,
  FileText, Filter, X, Search, Calendar, Trash2, Package,
  Weight, Coins, TrendingUp, Droplet, Layers
} from 'lucide-vue-next'
import { getVentaEstadoConfig, ESTADOS_FILTRO_COMERCIALIZADORA } from '@/utils/ventaEstados'
import Paginacion from '@/components/socio/Paginacion.vue'
import ModalVentaDetalleComercializadora from '@/components/comercializadora/venta/ModalVentaDetalleComercializadora.vue'

import { useLiquidacionesWS } from '@/composables/useLiquidacionesWS'
import { useUIStore } from '@/stores/uiStore'

const liquidacionesWS = useLiquidacionesWS()
const uiStore = useUIStore()
const ventaStore = useVentaComercializadoraStore()

const mostrarModalDetalle = ref(false)
const ventaSeleccionadaId = ref(null)
const mostrarFiltros = ref(false)
const filtrosLocales = ref({ estado: null, fechaDesde: null, fechaHasta: null })

onMounted(async () => {
  await liquidacionesWS.suscribirCola((data) => {
    console.log('🔔 Liquidación event (Comercializadora):', data.evento)
    ventaStore.fetchVentas()
    ventaStore.fetchEstadisticas()
    switch (data.evento) {
      case 'venta_creada':
        uiStore.showToast('Nueva solicitud de venta recibida', 'info')
        break
      case 'reporte_quimico_subido':
        if (data.tipoReporte === 'socio') {
          uiStore.showToast('El socio ha subido su reporte químico', 'info')
        }
        break
      case 'venta_cerrada':
        uiStore.showToast(`Venta cerrada - Monto: ${data.valorNetoBob} BOB`, 'success')
        break
      default:
        console.log('Evento recibido:', data.evento)
    }
  })

  await ventaStore.fetchVentas()
  await ventaStore.fetchEstadisticas()
})

onUnmounted(() => {
  liquidacionesWS.limpiarSuscripciones()
})

const verDetalle = (venta) => {
  ventaSeleccionadaId.value = venta.id
  mostrarModalDetalle.value = true
}

const aplicarFiltros = () => {
  ventaStore.aplicarFiltros({ ...filtrosLocales.value, page: 0 })
  mostrarFiltros.value = false
}

const limpiarFiltros = () => {
  filtrosLocales.value = { estado: null, fechaDesde: null, fechaHasta: null }
  ventaStore.limpiarFiltros()
  mostrarFiltros.value = false
}

const formatDate = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatCurrency = (v, c = 'BOB') => {
  if (!v) return '-'
  return new Intl.NumberFormat('es-BO', { style: 'currency', currency: c }).format(v)
}

const esLoteComplejo = (venta) => {
  return venta.tipoLiquidacion === 'venta_lote_complejo'
}

const getConfig = (venta) => {
  if (esLoteComplejo(venta)) {
    return {
      icon: Layers,
      iconColor: 'bg-amber-600',
      tipoBadge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
      label: 'Lote Complejo'
    }
  }
  return {
    icon: Droplet,
    iconColor: 'bg-blue-600',
    tipoBadge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    label: 'Concentrado'
  }
}

const getTipoMineral = (venta) => {
  if (!esLoteComplejo(venta) || !venta.lotes || venta.lotes.length === 0) {
    return 'Complejo'
  }
  return venta.lotes[0]?.tipoMineral || 'Complejo'
}
</script>

<template>
  <AppLayout>
    <div class="space-y-4 pb-6">
      <!-- Header -->
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-neutral">Liquidaciones</h1>
            <p class="text-secondary mt-1 text-sm sm:text-base">
              Gestión de compras de concentrados y lotes complejos
            </p>
          </div>
          <div class="relative">
            <button
              @click="mostrarFiltros = !mostrarFiltros"
              class="btn-outline flex items-center justify-center gap-2"
            >
              <Filter class="w-4 h-4" />
              <span class="hidden sm:inline">Filtros</span>
            </button>
            <div v-if="mostrarFiltros" class="absolute top-full right-0 mt-2 w-80 bg-surface rounded-xl shadow-2xl border border-border z-50 p-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-semibold text-neutral">Filtros</h3>
                <button @click="mostrarFiltros = false" class="w-8 h-8 rounded-lg hover:bg-hover flex items-center justify-center text-secondary">
                  <X class="w-4 h-4" />
                </button>
              </div>
              <div class="space-y-4">
                <div class="input-group">
                  <label class="input-label">Estado</label>
                  <select v-model="filtrosLocales.estado">
                    <option :value="null">Todos</option>
                    <option v-for="e in ESTADOS_FILTRO_COMERCIALIZADORA" :key="e.value" :value="e.value">
                      {{ e.label }}
                    </option>
                  </select>
                </div>
                <div class="input-group">
                  <label class="input-label">Desde</label>
                  <input v-model="filtrosLocales.fechaDesde" type="datetime-local" />
                </div>
                <div class="input-group">
                  <label class="input-label">Hasta</label>
                  <input v-model="filtrosLocales.fechaHasta" type="datetime-local" />
                </div>
                <div class="flex gap-2 pt-2">
                  <button @click="limpiarFiltros" class="flex-1 btn-secondary flex items-center justify-center gap-2">
                    <Trash2 class="w-4 h-4" /> Limpiar
                  </button>
                  <button @click="aplicarFiltros" class="flex-1 btn flex items-center justify-center gap-2">
                    <Search class="w-4 h-4" /> Aplicar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Estadísticas -->
        <div v-if="ventaStore.estadisticas" class="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-yellow-500 center shrink-0">
                <Clock class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Por Aprobar</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ ventaStore.estadisticas.pendienteAprobacion }}
                </p>
              </div>
            </div>
          </div>
          
          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500 center shrink-0">
                <FileText class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">En Proceso</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ (ventaStore.estadisticas.aprobadas || 0) + (ventaStore.estadisticas.esperandoCierre || 0) }}
                </p>
              </div>
            </div>
          </div>
          
          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500 center shrink-0">
                <DollarSign class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Pago Pendiente</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ ventaStore.estadisticas.cerradas }}
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
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Total Pagado</h3>
                <p class="text-lg font-bold text-neutral">
                  {{ formatCurrency(ventaStore.estadisticas.totalPagadoBob) }}
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
          <div class="space-y-4">
            <!-- Header -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <div
                  class="w-12 h-12 rounded-lg center shrink-0"
                  :class="getConfig(venta).iconColor"
                >
                  <component :is="getConfig(venta).icon" class="w-6 h-6 text-white" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="font-semibold text-neutral text-lg">
                      Liquidación #{{ venta.id }}
                    </h3>
                    <span
                      class="text-xs px-2 py-1 rounded-lg font-medium border"
                      :class="getConfig(venta).tipoBadge"
                    >
                      {{ getConfig(venta).label }}
                    </span>
                  </div>
                  <p class="text-sm text-secondary mt-1">
                    Socio: {{ venta.socioNombres }} {{ venta.socioApellidos }}
                  </p>
                  <p class="text-xs text-secondary/80 mt-0.5">
                    CI: {{ venta.socioCi }}
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

            <!-- Info Grid Principal -->
            <div class="grid grid-cols-2 gap-3">
              <div class="flex items-start gap-2">
                <Package class="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <div class="min-w-0">
                  <p class="text-xs text-secondary">
                    {{ esLoteComplejo(venta) ? 'Cantidad Lotes' : 'Concentrados' }}
                  </p>
                  <p class="text-sm font-medium text-neutral mt-0.5">
                    {{ esLoteComplejo(venta) 
                      ? `${venta.lotes?.length || 0} lote(s)` 
                      : `${venta.concentrados?.length || 0} unidad(es)` }}
                  </p>
                </div>
              </div>

              <div class="flex items-start gap-2">
                <Weight class="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <div class="min-w-0">
                  <p class="text-xs text-secondary">
                    {{ esLoteComplejo(venta) ? 'Peso Total' : 'Peso TMS' }}
                  </p>
                  <p class="text-sm font-bold text-neutral mt-0.5">
                    {{ esLoteComplejo(venta) 
                      ? `${venta.pesoTmh?.toFixed(4) || '0.0000'} Ton` 
                      : `${venta.pesoTms?.toFixed(4) || '0.0000'}` }}
                  </p>
                </div>
              </div>

              <div class="flex items-start gap-2">
                <Coins class="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <div class="min-w-0">
                  <p class="text-xs text-secondary">Moneda</p>
                  <p class="text-sm font-medium text-neutral mt-0.5">
                    {{ venta.moneda || 'BOB' }}
                  </p>
                </div>
              </div>

              <div v-if="!esLoteComplejo(venta)" class="flex items-start gap-2">
                <TrendingUp class="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <div class="min-w-0">
                  <p class="text-xs text-secondary">Ley Promedio</p>
                  <p class="text-sm font-medium text-neutral mt-0.5">
                    {{ venta.leyMineralPrincipalPromedio 
                      ? `${venta.leyMineralPrincipalPromedio.toFixed(2)}%` 
                      : '-' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Info Grid Secundaria -->
            <div class="grid grid-cols-2 gap-3 pt-3 border-t border-border">
              <div class="flex items-start gap-2">
                <Weight class="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <div class="min-w-0">
                  <p class="text-xs text-secondary">
                    {{ esLoteComplejo(venta) ? 'Tipo Mineral' : 'Final TMS' }}
                  </p>
                  <p class="text-sm font-medium text-neutral mt-0.5">
                    {{ esLoteComplejo(venta) 
                      ? getTipoMineral(venta)
                      : `${venta.pesoFinalTms?.toFixed(4) || '0.0000'}` }}
                  </p>
                </div>
              </div>

              <div v-if="!esLoteComplejo(venta)" class="flex items-start gap-2">
                <TrendingUp class="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <div class="min-w-0">
                  <p class="text-xs text-secondary">Mineral Principal</p>
                  <p class="text-sm font-medium text-neutral mt-0.5">
                    {{ venta.mineralPrincipal || '-' }}
                  </p>
                </div>
              </div>
            </div>


            <!-- Fecha -->
            <div class="flex items-center gap-2 pt-2 border-t border-border">
              <Calendar class="w-4 h-4 text-secondary" />
              <p class="text-xs text-secondary">
                Creado el {{ formatDate(venta.createdAt) }}
              </p>
            </div>

            <!-- Botón de acción -->
            <button
              @click.stop="verDetalle(venta)"
              class="btn-outline text-xs sm:text-sm px-3 py-2 flex items-center justify-center gap-2 w-full"
            >
              <Eye class="w-4 h-4" />
              <span>Ver Detalle Completo</span>
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="ventaStore.ventas.length === 0" class="col-span-full text-center py-12">
          <div class="w-16 h-16 rounded-full bg-primary/10 center mx-auto mb-4">
            <ShoppingCart class="w-8 h-8 text-primary" />
          </div>
          <h3 class="text-lg font-semibold text-neutral mb-2">No hay liquidaciones</h3>
          <p class="text-sm text-secondary">Las solicitudes de venta de los socios aparecerán aquí</p>
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

    <!-- Modal -->
    <ModalVentaDetalleComercializadora
      v-if="mostrarModalDetalle"
      :venta-id="ventaSeleccionadaId"
      @close="mostrarModalDetalle = false"
      @actualizado="() => { ventaStore.fetchVentas(); ventaStore.fetchEstadisticas() }"
    />
  </AppLayout>
</template>