<!-- src/views/cooperativa/TransportistaLista.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTransportistaStore } from '@/stores/cooperativa/transportistaStore'
import AppLayout from '@/components/layout/AppLayout.vue'
import TransportistaInvitacionModal from '@/components/cooperativa/TransportistaInvitacionModal.vue'
import TransportistaDetalleModal from '@/components/cooperativa/TransportistaDetalleModal.vue'
import {
  Search,
  Truck,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Plus,
  Power,
  PowerOff,
  Package
} from 'lucide-vue-next'

const transportistaStore = useTransportistaStore()

// State local
const busquedaLocal = ref('')
const estadoFiltro = ref('')
const mostrarModalInvitacion = ref(false)
const mostrarModalDetalle = ref(false)
const transportistaSeleccionado = ref(null)

// Computed
const transportistas = computed(() => transportistaStore.transportistas)
const paginacion = computed(() => transportistaStore.paginacion)

// Colores para badges de estado
const estadoColors = {
  activo: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  inactivo: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  en_ruta: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
}

// Iconos para estados
const estadoIcons = {
  activo: UserCheck,
  inactivo: UserX,
  en_ruta: Truck
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
  await cargarDatos()
}

const buscar = async () => {
  await transportistaStore.buscarTransportista(busquedaLocal.value)
}

const aplicarFiltroEstado = async (estado) => {
  estadoFiltro.value = estado
  await transportistaStore.aplicarFiltros({ estado })
}

const limpiarFiltros = async () => {
  busquedaLocal.value = ''
  estadoFiltro.value = ''
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

const cambiarEstadoTransportista = async (transportista, nuevoEstado) => {
  const result = await transportistaStore.cambiarEstado(transportista.id, nuevoEstado)
  
  if (result.success) {
    await cargarDatos()
  }
}

const cambiarPagina = async (pagina) => {
  await transportistaStore.cambiarPagina(pagina)
}

const getEstadoTexto = (estado) => {
  const textos = {
    activo: 'Activo',
    inactivo: 'Inactivo',
    en_ruta: 'En Ruta'
  }
  return textos[estado] || estado
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
                placeholder="Buscar por nombre, CI o placa..."
                class="w-full pl-10"
                @keyup.enter="buscar"
              />
            </div>
          </div>

          <!-- Botones -->
          <div class="flex gap-2">
            <button @click="buscar" class="btn">
              <Search class="w-4 h-4" />
              Buscar
            </button>

            <button @click="limpiarFiltros" class="btn-outline">
              <RefreshCw class="w-4 h-4" />
              Limpiar
            </button>
          </div>
        </div>

        <!-- Filtros por estado -->
        <div class="mt-4">
          <p class="text-sm font-medium text-secondary mb-2">Estado:</p>
          <div class="flex flex-wrap gap-2">
            <button
              @click="aplicarFiltroEstado('')"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                estadoFiltro === '' 
                  ? 'bg-primary text-white' 
                  : 'bg-surface border border-border text-secondary hover:bg-hover'
              ]"
            >
              Todos
            </button>
            <button
              @click="aplicarFiltroEstado('activo')"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                estadoFiltro === 'activo' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-surface border border-border text-secondary hover:bg-hover'
              ]"
            >
              Activos
            </button>
            <button
              @click="aplicarFiltroEstado('inactivo')"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                estadoFiltro === 'inactivo' 
                  ? 'bg-slate-600 text-white' 
                  : 'bg-surface border border-border text-secondary hover:bg-hover'
              ]"
            >
              Inactivos
            </button>
            <button
              @click="aplicarFiltroEstado('en_ruta')"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                estadoFiltro === 'en_ruta' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-surface border border-border text-secondary hover:bg-hover'
              ]"
            >
              En Ruta
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="transportistas.length === 0" class="card-flat flex items-center justify-center py-12">
        <div class="text-center">
          <Truck class="w-12 h-12 text-tertiary mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-neutral mb-2">No se encontraron transportistas</h3>
          <p class="text-secondary mb-4">
            {{ estadoFiltro ? 'No hay transportistas con este filtro' : 'Comienza creando una invitación' }}
          </p>
          <button
            v-if="!estadoFiltro"
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
                  Estado
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
                      {{ transportista.nombreCompleto?.charAt(0) || '?' }}
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-neutral">
                        {{ transportista.nombreCompleto || 'Sin nombre' }}
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

                <!-- Estado -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', estadoColors[transportista.estadoCuenta]]">
                    <component :is="estadoIcons[transportista.estadoCuenta]" class="w-3.5 h-3.5" />
                    {{ getEstadoTexto(transportista.estadoCuenta) }}
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
                    
                    <template v-if="transportista.estadoCuenta !== 'en_ruta'">
                      <button
                        v-if="transportista.estadoCuenta === 'activo'"
                        @click="cambiarEstadoTransportista(transportista, 'inactivo')"
                        class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 transition-colors text-red-600 dark:text-red-400"
                        title="Desactivar"
                      >
                        <PowerOff class="w-4 h-4" />
                      </button>
                      <button
                        v-else-if="transportista.estadoCuenta === 'inactivo'"
                        @click="cambiarEstadoTransportista(transportista, 'activo')"
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
  </AppLayout>
</template>