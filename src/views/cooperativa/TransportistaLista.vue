<!-- src/views/cooperativa/TransportistaLista.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTransportistaStore } from '@/stores/cooperativa/transportistaStore'
import AppLayout from '@/components/layout/AppLayout.vue'
import TransportistaInvitacionModal from '@/components/cooperativa/TransportistaInvitacionModal.vue'
import TransportistaDetalleModal from '@/components/cooperativa/TransportistaDetalleModal.vue'
import TransportistaEstadoModal from '@/components/cooperativa/TransportistaEstadoModal.vue'
import {
  Search,
  Truck,
  UserCheck,
  UserX,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus,
  Power,
  PowerOff,
  Navigation,
  Package
} from 'lucide-vue-next'

const transportistaStore = useTransportistaStore()

// State local
const busquedaLocal = ref('')
const estadoCuentaFiltro = ref('')
const estadoTrazabilidadFiltro = ref('')
const mostrarModalInvitacion = ref(false)
const mostrarModalDetalle = ref(false)
const mostrarModalEstado = ref(false)
const transportistaSeleccionado = ref(null)
const accionEstado = ref('') // 'activar' o 'desactivar'

// Computed
const estadisticas = computed(() => transportistaStore.estadisticas)
const transportistas = computed(() => transportistaStore.transportistas)
const isLoading = computed(() => transportistaStore.isLoading)
const paginacion = computed(() => transportistaStore.paginacion)

// Colores para badges de estado de cuenta
const estadoCuentaColors = {
  activo: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  inactivo: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  transportando: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
}

// Colores para badges de estado de trazabilidad
const estadoTrazabilidadColors = {
  habilitado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  asignado: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  en_ruta: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  de_regreso: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
}

// Iconos para estados
const estadoCuentaIcons = {
  activo: UserCheck,
  inactivo: UserX,
  transportando: Navigation
}

const estadoTrazabilidadIcons = {
  habilitado: UserCheck,
  asignado: Package,
  en_ruta: Navigation,
  de_regreso: Navigation
}

// Lifecycle
onMounted(async () => {
  await cargarDatos()
})

// Methods
const cargarDatos = async () => {
  await transportistaStore.fetchTransportistas()
}

const abrirModalInvitacion = () => {
  mostrarModalInvitacion.value = true
}

const cerrarModalInvitacion = () => {
  mostrarModalInvitacion.value = false
}

const handleInvitacionCreada = async () => {
  cerrarModalInvitacion()
  // Recargar estadísticas para actualizar el contador de pendientes
  await cargarDatos()
}

const buscar = async () => {
  await transportistaStore.buscarTransportista(busquedaLocal.value)
}

const aplicarFiltroEstadoCuenta = async (estado) => {
  estadoCuentaFiltro.value = estado
  await transportistaStore.aplicarFiltros({ estadoCuenta: estado })
}

const aplicarFiltroEstadoTrazabilidad = async (estado) => {
  estadoTrazabilidadFiltro.value = estado
  await transportistaStore.aplicarFiltros({ estadoTrazabilidad: estado })
}

const limpiarFiltros = async () => {
  busquedaLocal.value = ''
  estadoCuentaFiltro.value = ''
  estadoTrazabilidadFiltro.value = ''
  await transportistaStore.limpiarFiltros()
}

const verDetalle = async (transportista) => {
  const result = await transportistaStore.fetchTransportistaDetalle(transportista.id)
  
  if (result.success) {
    transportistaSeleccionado.value = result.data
    mostrarModalDetalle.value = true
  }
}

const cerrarModalDetalle = () => {
  mostrarModalDetalle.value = false
  transportistaSeleccionado.value = null
}

const abrirModalCambioEstado = (transportista, accion) => {
  transportistaSeleccionado.value = transportista
  accionEstado.value = accion
  mostrarModalEstado.value = true
}

const cerrarModalEstado = () => {
  mostrarModalEstado.value = false
  transportistaSeleccionado.value = null
  accionEstado.value = ''
}

const handleEstadoCambiado = async () => {
  cerrarModalEstado()
  await cargarDatos()
}

const cambiarPagina = async (pagina) => {
  await transportistaStore.cambiarPagina(pagina)
}

const formatearFecha = (fecha) => {
  if (!fecha) return '-'
  const date = new Date(fecha)
  return date.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatearNumero = (num) => {
  if (!num) return '0'
  return num.toLocaleString('es-BO')
}
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-neutral">Transportistas</h1>
          <p class="text-secondary mt-2">
            Gestiona los transportistas de tu cooperativa
          </p>
        </div>
        <button
          @click="abrirModalInvitacion"
          class="btn flex items-center gap-2"
        >
          <Plus class="w-5 h-5" />
          Crear Invitación
        </button>
      </div>

      <!-- Estadísticas 
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card-flat cursor-pointer hover:shadow-md transition-shadow" @click="aplicarFiltroEstadoCuenta('activo')">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <UserCheck class="w-5 h-5 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p class="text-sm text-secondary">Activos</p>
              <p class="text-2xl font-bold text-neutral">{{ estadisticas.totalActivos }}</p>
            </div>
          </div>
        </div>

        <div class="card-flat cursor-pointer hover:shadow-md transition-shadow" @click="aplicarFiltroEstadoCuenta('inactivo')">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <UserX class="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <p class="text-sm text-secondary">Inactivos</p>
              <p class="text-2xl font-bold text-neutral">{{ estadisticas.totalInactivos }}</p>
            </div>
          </div>
        </div>

        <div class="card-flat cursor-pointer hover:shadow-md transition-shadow" @click="aplicarFiltroEstadoCuenta('transportando')">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Navigation class="w-5 h-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p class="text-sm text-secondary">En Ruta</p>
              <p class="text-2xl font-bold text-neutral">{{ estadisticas.totalTransportando }}</p>
            </div>
          </div>
        </div>

        <div class="card-flat cursor-pointer hover:shadow-md transition-shadow">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <Clock class="w-5 h-5 text-yellow-600 dark:text-yellow-300" />
            </div>
            <div>
              <p class="text-sm text-secondary">Pendientes</p>
              <p class="text-2xl font-bold text-neutral">{{ estadisticas.totalPendientes }}</p>
            </div>
          </div>
        </div>
      </div>-->

      <!-- Estadísticas adicionales 
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="card-flat">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-secondary">Viajes Completados</p>
              <p class="text-2xl font-bold text-neutral">{{ formatearNumero(estadisticas.viajesCompletadosTotal) }}</p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package class="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div class="card-flat">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-secondary">Toneladas Transportadas</p>
              <p class="text-2xl font-bold text-neutral">{{ formatearNumero(estadisticas.tonaladasTransportadasTotal) }} t</p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Truck class="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div class="card-flat">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-secondary">Kilómetros Recorridos</p>
              <p class="text-2xl font-bold text-neutral">{{ formatearNumero(estadisticas.kilometrosRecorridosTotal) }} km</p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Navigation class="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
      </div>-->

      <!-- Filtros y búsqueda -->
      <div class="card-flat">
        <div class="flex flex-col lg:flex-row gap-4">
          <!-- Búsqueda -->
          <div class="flex-1">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
              <input
                v-model="busquedaLocal"
                type="text"
                placeholder="Buscar por nombre o placa..."
                class="w-full pl-10"
                @keyup.enter="buscar"
              />
            </div>
          </div>

          <!-- Botones -->
          <div class="flex gap-2">
            <button
              @click="buscar"
              class="btn"
              :disabled="isLoading"
            >
              <Search class="w-4 h-4" />
              Buscar
            </button>

            <button
              @click="limpiarFiltros"
              class="btn-outline"
              :disabled="isLoading"
            >
              <RefreshCw class="w-4 h-4" />
              Limpiar
            </button>
          </div>
        </div>

        <!-- Filtros por estado de cuenta -->
        <div class="mt-4">
          <p class="text-sm font-medium text-secondary mb-2">Estado de Cuenta:</p>
          <div class="flex flex-wrap gap-2">
            <button
              @click="aplicarFiltroEstadoCuenta('')"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                estadoCuentaFiltro === '' 
                  ? 'bg-primary text-white' 
                  : 'bg-surface border border-border text-secondary hover:bg-hover'
              ]"
            >
              Todos
            </button>
            <button
              @click="aplicarFiltroEstadoCuenta('activo')"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                estadoCuentaFiltro === 'activo' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-surface border border-border text-secondary hover:bg-hover'
              ]"
            >
              Activos
            </button>
            <button
              @click="aplicarFiltroEstadoCuenta('inactivo')"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                estadoCuentaFiltro === 'inactivo' 
                  ? 'bg-slate-600 text-white' 
                  : 'bg-surface border border-border text-secondary hover:bg-hover'
              ]"
            >
              Inactivos
            </button>
            <button
              @click="aplicarFiltroEstadoCuenta('transportando')"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                estadoCuentaFiltro === 'transportando' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-surface border border-border text-secondary hover:bg-hover'
              ]"
            >
              Transportando
            </button>
          </div>
        </div>

        <!-- Filtros por estado de trazabilidad -->
        <div class="mt-4">
          <p class="text-sm font-medium text-secondary mb-2">Estado de Trazabilidad:</p>
          <div class="flex flex-wrap gap-2">
            <button
              @click="aplicarFiltroEstadoTrazabilidad('')"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                estadoTrazabilidadFiltro === '' 
                  ? 'bg-primary text-white' 
                  : 'bg-surface border border-border text-secondary hover:bg-hover'
              ]"
            >
              Todos
            </button>
            <button
              @click="aplicarFiltroEstadoTrazabilidad('habilitado')"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                estadoTrazabilidadFiltro === 'habilitado' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-surface border border-border text-secondary hover:bg-hover'
              ]"
            >
              Habilitado
            </button>
            <button
              @click="aplicarFiltroEstadoTrazabilidad('asignado')"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                estadoTrazabilidadFiltro === 'asignado' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-surface border border-border text-secondary hover:bg-hover'
              ]"
            >
              Asignado
            </button>
            <button
              @click="aplicarFiltroEstadoTrazabilidad('en_ruta')"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                estadoTrazabilidadFiltro === 'en_ruta' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-surface border border-border text-secondary hover:bg-hover'
              ]"
            >
              En Ruta
            </button>
            <button
              @click="aplicarFiltroEstadoTrazabilidad('de_regreso')"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                estadoTrazabilidadFiltro === 'de_regreso' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-surface border border-border text-secondary hover:bg-hover'
              ]"
            >
              De Regreso
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="card-flat flex items-center justify-center py-12">
        <div class="text-center">
          <Loader2 class="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p class="text-secondary">Cargando transportistas...</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="transportistas.length === 0" class="card-flat flex items-center justify-center py-12">
        <div class="text-center">
          <Truck class="w-12 h-12 text-tertiary mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-neutral mb-2">No se encontraron transportistas</h3>
          <p class="text-secondary mb-4">
            {{ estadoCuentaFiltro || estadoTrazabilidadFiltro ? 'No hay transportistas con este filtro' : 'Comienza creando una invitación' }}
          </p>
          <button
            v-if="!estadoCuentaFiltro && !estadoTrazabilidadFiltro"
            @click="abrirModalInvitacion"
            class="btn flex items-center gap-2 mx-auto"
          >
            <Plus class="w-4 h-4" />
            Crear Invitación
          </button>
        </div>
      </div>

      <!-- Tabla de transportistas -->
      <div v-else class="card-flat overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-hover border-b border-border">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                  Transportista
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                  Vehículo
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                  Contacto
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                  Viajes
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                  Estado Cuenta
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                  Trazabilidad
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr 
                v-for="transportista in transportistas" 
                :key="transportista.id"
                class="hover:bg-hover transition-colors"
              >
                <!-- Transportista -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {{ transportista.nombreCompleto.charAt(0) }}
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-neutral">
                        {{ transportista.nombreCompleto }}
                      </div>
                      <div class="text-sm text-secondary">
                        CI: {{ transportista.ci }}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Vehículo -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-neutral">
                    {{ transportista.placaVehiculo }}
                  </div>
                  <div class="text-sm text-secondary">
                    {{ transportista.marcaVehiculo || 'Sin marca' }} {{ transportista.modeloVehiculo || '' }}
                  </div>
                </td>

                <!-- Contacto -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-neutral">
                    {{ transportista.numeroCelular || 'Sin teléfono' }}
                  </div>
                  <div class="text-sm text-secondary">
                    {{ transportista.correo }}
                  </div>
                </td>

                <!-- Viajes -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral">
                  <div class="flex items-center gap-2">
                    <Package class="w-4 h-4 text-tertiary" />
                    {{ transportista.viajesCompletados || 0 }}
                  </div>
                </td>

                <!-- Estado Cuenta -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', estadoCuentaColors[transportista.estadoCuenta]]">
                    <component :is="estadoCuentaIcons[transportista.estadoCuenta]" class="w-3.5 h-3.5" />
                    {{ transportista.estadoCuenta.charAt(0).toUpperCase() + transportista.estadoCuenta.slice(1) }}
                  </span>
                </td>

                <!-- Trazabilidad -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', estadoTrazabilidadColors[transportista.estadoTrazabilidad]]">
                    <component :is="estadoTrazabilidadIcons[transportista.estadoTrazabilidad]" class="w-3.5 h-3.5" />
                    {{ transportista.estadoTrazabilidad.replace('_', ' ').charAt(0).toUpperCase() + transportista.estadoTrazabilidad.replace('_', ' ').slice(1) }}
                  </span>
                </td>

                <!-- Acciones -->
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end gap-2">
                    <button
                      @click="verDetalle(transportista)"
                      class="p-2 rounded-lg hover:bg-background transition-colors text-primary"
                      title="Ver detalle"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    
                    <template v-if="transportista.estadoCuenta !== 'transportando'">
                      <button
                        v-if="transportista.estadoCuenta === 'activo'"
                        @click="abrirModalCambioEstado(transportista, 'desactivar')"
                        class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 transition-colors text-red-600 dark:text-red-400"
                        title="Desactivar"
                      >
                        <PowerOff class="w-4 h-4" />
                      </button>
                      <button
                        v-else-if="transportista.estadoCuenta === 'inactivo'"
                        @click="abrirModalCambioEstado(transportista, 'activar')"
                        class="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900 transition-colors text-green-600 dark:text-green-400"
                        title="Activar"
                      >
                        <Power class="w-4 h-4" />
                      </button>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div v-if="paginacion.totalPaginas > 1" class="px-6 py-4 border-t border-border flex items-center justify-between">
          <div class="text-sm text-secondary">
            Mostrando {{ (paginacion.paginaActual * paginacion.elementosPorPagina) + 1 }} 
            - 
            {{ Math.min((paginacion.paginaActual + 1) * paginacion.elementosPorPagina, paginacion.totalElementos) }}
            de {{ paginacion.totalElementos }} transportistas
          </div>

          <div class="flex gap-2">
            <button
              @click="cambiarPagina(paginacion.paginaActual - 1)"
              :disabled="paginacion.paginaActual === 0"
              class="p-2 rounded-lg border border-border hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>

            <div class="flex gap-1">
              <button
                v-for="pagina in paginacion.totalPaginas"
                :key="pagina"
                @click="cambiarPagina(pagina - 1)"
                :class="[
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  paginacion.paginaActual === pagina - 1
                    ? 'bg-primary text-white'
                    : 'border border-border hover:bg-hover'
                ]"
              >
                {{ pagina }}
              </button>
            </div>

            <button
              @click="cambiarPagina(paginacion.paginaActual + 1)"
              :disabled="paginacion.paginaActual === paginacion.totalPaginas - 1"
              class="p-2 rounded-lg border border-border hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <TransportistaInvitacionModal
      v-if="mostrarModalInvitacion"
      @close="cerrarModalInvitacion"
      @invitacion-creada="handleInvitacionCreada"
    />

    <TransportistaDetalleModal
      v-if="mostrarModalDetalle && transportistaSeleccionado"
      :transportista="transportistaSeleccionado"
      @close="cerrarModalDetalle"
    />

    <TransportistaEstadoModal
      v-if="mostrarModalEstado && transportistaSeleccionado"
      :transportista="transportistaSeleccionado"
      :accion="accionEstado"
      @close="cerrarModalEstado"
      @estado-cambiado="handleEstadoCambiado"
    />
  </AppLayout>
</template>