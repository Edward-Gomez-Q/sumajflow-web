<!-- src/views/cooperativa/SocioLista.vue -->
<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useSocioStore } from '@/stores/cooperativa/socioStore'
import { useNotificacionStore } from '@/stores/notificacionStore'
import AppLayout from '@/components/layout/AppLayout.vue'
import {
  Search,
  Filter,
  Users,
  UserCheck,
  UserX,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-vue-next'

const socioStore = useSocioStore()
const notificacionStore = useNotificacionStore()

// State local
const busquedaLocal = ref('')
const estadoFiltro = ref('')
const ordenarPor = ref('fechaAfiliacion')
const direccion = ref('desc')
const mostrarModalAprobacion = ref(false)
const mostrarModalDetalle = ref(false)
const socioSeleccionado = ref(null)
const accionActual = ref('') // 'aprobar' o 'rechazar'
const observaciones = ref('')
const isProcessing = ref(false)

// Computed
const estadisticas = computed(() => socioStore.estadisticas)
const socios = computed(() => socioStore.socios)
const isLoading = computed(() => socioStore.isLoading)
const paginacion = computed(() => socioStore.paginacion)

// Colores para badges de estado
const estadoColors = {
  aprobado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  rechazado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}

const estadoIcons = {
  aprobado: UserCheck,
  pendiente: Clock,
  rechazado: UserX
}

// Lifecycle
onMounted(async () => {
  await cargarDatos()
  setupWebSocketListener()
})

// Watcher para detectar nuevos socios desde WebSocket
watch(
  () => notificacionStore.notificaciones,
  (nuevasNotificaciones) => {
    // Buscar la notificación más reciente de tipo nuevo socio
    const nuevaSolicitud = nuevasNotificaciones.find(
      n => !n.leido && n.metadata?.tipo === 'nueva_solicitud_socio'
    )
    
    if (nuevaSolicitud) {
      console.log('🔔 Nueva solicitud de socio detectada:', nuevaSolicitud)
      socioStore.agregarNuevoSocio(nuevaSolicitud)
    }
  },
  { deep: true }
)

// Methods
const cargarDatos = async () => {
  await socioStore.fetchSocios()
}

const setupWebSocketListener = () => {
  socioStore.setupWebSocketListener()
}

const buscar = async () => {
  await socioStore.buscarSocio(busquedaLocal.value)
}

const aplicarFiltroEstado = async (estado) => {
  estadoFiltro.value = estado
  await socioStore.aplicarFiltros({ estado })
}

const cambiarOrden = async (campo) => {
  if (ordenarPor.value === campo) {
    direccion.value = direccion.value === 'asc' ? 'desc' : 'asc'
  } else {
    ordenarPor.value = campo
    direccion.value = 'desc'
  }
  
  await socioStore.aplicarFiltros({
    ordenarPor: ordenarPor.value,
    direccion: direccion.value
  })
}

const limpiarFiltros = async () => {
  busquedaLocal.value = ''
  estadoFiltro.value = ''
  ordenarPor.value = 'fechaAfiliacion'
  direccion.value = 'desc'
  await socioStore.limpiarFiltros()
}

const abrirModalAprobacion = (socio, accion) => {
  socioSeleccionado.value = socio
  accionActual.value = accion
  observaciones.value = ''
  mostrarModalAprobacion.value = true
}

const cerrarModalAprobacion = () => {
  mostrarModalAprobacion.value = false
  socioSeleccionado.value = null
  accionActual.value = ''
  observaciones.value = ''
}

const confirmarAccion = async () => {
  if (!socioSeleccionado.value) return

  isProcessing.value = true

  const estado = accionActual.value === 'aprobar' ? 'aprobado' : 'rechazado'
  
  const result = await socioStore.procesarSolicitud(
    socioSeleccionado.value.cooperativaSocioId,
    estado,
    observaciones.value
  )

  isProcessing.value = false

  if (result.success) {
    cerrarModalAprobacion()
    // Opcional: Mostrar toast de éxito
  } else {
    // Opcional: Mostrar toast de error
    alert(result.error)
  }
}

const verDetalle = async (socio) => {
  const result = await socioStore.fetchSocioDetalle(socio.cooperativaSocioId)
  
  if (result.success) {
    socioSeleccionado.value = result.data
    mostrarModalDetalle.value = true
  }
}

const cerrarModalDetalle = () => {
  mostrarModalDetalle.value = false
  socioSeleccionado.value = null
}

const cambiarPagina = async (pagina) => {
  await socioStore.cambiarPagina(pagina)
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
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-3xl font-bold text-neutral">Lista de Socios</h1>
        <p class="text-secondary mt-2">
          Gestiona las solicitudes y socios de tu cooperativa
        </p>
      </div>

      <!-- Estadísticas -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card-flat">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Users class="w-5 h-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p class="text-sm text-secondary">Total Socios</p>
              <p class="text-2xl font-bold text-neutral">{{ estadisticas.totalSocios }}</p>
            </div>
          </div>
        </div>

        <div class="card-flat cursor-pointer hover:shadow-md transition-shadow" @click="aplicarFiltroEstado('aprobado')">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <UserCheck class="w-5 h-5 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p class="text-sm text-secondary">Aprobados</p>
              <p class="text-2xl font-bold text-neutral">{{ estadisticas.totalAprobados }}</p>
            </div>
          </div>
        </div>

        <div class="card-flat cursor-pointer hover:shadow-md transition-shadow" @click="aplicarFiltroEstado('pendiente')">
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

        <div class="card-flat cursor-pointer hover:shadow-md transition-shadow" @click="aplicarFiltroEstado('rechazado')">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <UserX class="w-5 h-5 text-red-600 dark:text-red-300" />
            </div>
            <div>
              <p class="text-sm text-secondary">Rechazados</p>
              <p class="text-2xl font-bold text-neutral">{{ estadisticas.totalRechazados }}</p>
            </div>
          </div>
        </div>
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
                placeholder="Buscar por nombre, apellido o CI..."
                class="w-full pl-10"
                @keyup.enter="buscar"
              />
            </div>
          </div>

          <!-- Filtros -->
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

        <!-- Filtros por estado -->
        <div class="flex flex-wrap gap-2 mt-4">
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
            @click="aplicarFiltroEstado('pendiente')"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              estadoFiltro === 'pendiente' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-surface border border-border text-secondary hover:bg-hover'
            ]"
          >
            Pendientes
          </button>
          <button
            @click="aplicarFiltroEstado('aprobado')"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              estadoFiltro === 'aprobado' 
                ? 'bg-green-600 text-white' 
                : 'bg-surface border border-border text-secondary hover:bg-hover'
            ]"
          >
            Aprobados
          </button>
          <button
            @click="aplicarFiltroEstado('rechazado')"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              estadoFiltro === 'rechazado' 
                ? 'bg-red-600 text-white' 
                : 'bg-surface border border-border text-secondary hover:bg-hover'
            ]"
          >
            Rechazados
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="card-flat flex items-center justify-center py-12">
        <div class="text-center">
          <Loader2 class="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p class="text-secondary">Cargando socios...</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="socios.length === 0" class="card-flat flex items-center justify-center py-12">
        <div class="text-center">
          <AlertCircle class="w-12 h-12 text-tertiary mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-neutral mb-2">No se encontraron socios</h3>
          <p class="text-secondary">
            {{ estadoFiltro ? 'No hay socios con este estado' : 'Aún no tienes socios registrados' }}
          </p>
        </div>
      </div>

      <!-- Tabla de socios -->
      <div v-else class="card-flat overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-hover border-b border-border">
              <tr>
                <th 
                  class="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer hover:bg-background transition-colors"
                  @click="cambiarOrden('nombre')"
                >
                  <div class="flex items-center gap-2">
                    Nombre
                    <span v-if="ordenarPor === 'nombre'" class="text-primary">
                      {{ direccion === 'asc' ? '↑' : '↓' }}
                    </span>
                  </div>
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                  CI
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                  Correo
                </th>
                <th 
                  class="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer hover:bg-background transition-colors"
                  @click="cambiarOrden('fechaAfiliacion')"
                >
                  <div class="flex items-center gap-2">
                    Fecha Afiliación
                    <span v-if="ordenarPor === 'fechaAfiliacion'" class="text-primary">
                      {{ direccion === 'asc' ? '↑' : '↓' }}
                    </span>
                  </div>
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
                v-for="socio in socios" 
                :key="socio.cooperativaSocioId"
                class="hover:bg-hover transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {{ socio.nombres.charAt(0) }}{{ socio.primerApellido.charAt(0) }}
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-neutral">
                        {{ socio.nombreCompleto }}
                      </div>
                      <div class="text-sm text-secondary">
                        {{ socio.numeroCelular || 'Sin teléfono' }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral">
                  {{ socio.ci }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                  {{ socio.correo }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                  {{ formatearFecha(socio.fechaAfiliacion) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', estadoColors[socio.estado]]">
                    <component :is="estadoIcons[socio.estado]" class="w-3.5 h-3.5" />
                    {{ socio.estado.charAt(0).toUpperCase() + socio.estado.slice(1) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end gap-2">
                    <button
                      @click="verDetalle(socio)"
                      class="p-2 rounded-lg hover:bg-background transition-colors text-primary"
                      title="Ver detalle"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <template v-if="socio.estado === 'pendiente'">
                      <button
                        @click="abrirModalAprobacion(socio, 'aprobar')"
                        class="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900 transition-colors text-green-600 dark:text-green-400"
                        title="Aprobar"
                      >
                        <Check class="w-4 h-4" />
                      </button>
                      <button
                        @click="abrirModalAprobacion(socio, 'rechazar')"
                        class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 transition-colors text-red-600 dark:text-red-400"
                        title="Rechazar"
                      >
                        <X class="w-4 h-4" />
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
            de {{ paginacion.totalElementos }} socios
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

    <!-- Modal de Aprobación/Rechazo -->
    <div v-if="mostrarModalAprobacion" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-surface rounded-xl max-w-md w-full p-6 shadow-strong">
        <h3 class="text-xl font-bold text-neutral mb-4">
          {{ accionActual === 'aprobar' ? 'Aprobar Solicitud' : 'Rechazar Solicitud' }}
        </h3>

        <div v-if="socioSeleccionado" class="mb-4">
          <p class="text-secondary mb-2">
            ¿Estás seguro de {{ accionActual === 'aprobar' ? 'aprobar' : 'rechazar' }} la solicitud de:
          </p>
          <p class="text-neutral font-semibold">
            {{ socioSeleccionado.nombreCompleto }}
          </p>
          <p class="text-sm text-secondary">
            CI: {{ socioSeleccionado.ci }}
          </p>
        </div>

        <div class="input-group mb-6">
          <label class="input-label">
            Observaciones {{ accionActual === 'rechazar' ? '(requerido)' : '(opcional)' }}
          </label>
          <textarea
            v-model="observaciones"
            rows="3"
            :placeholder="accionActual === 'aprobar' ? 'Notas adicionales...' : 'Motivo del rechazo...'"
            class="w-full"
          ></textarea>
        </div>

        <div class="flex gap-3">
          <button
            @click="cerrarModalAprobacion"
            class="btn-outline flex-1"
            :disabled="isProcessing"
          >
            Cancelar
          </button>
          <button
            @click="confirmarAccion"
            :class="[
              'btn flex-1',
              accionActual === 'rechazar' && 'bg-red-600 hover:bg-red-700'
            ]"
            :disabled="isProcessing || (accionActual === 'rechazar' && !observaciones)"
          >
            <Loader2 v-if="isProcessing" class="w-4 h-4 animate-spin mr-2" />
            {{ accionActual === 'aprobar' ? 'Aprobar' : 'Rechazar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Detalle -->
    <div v-if="mostrarModalDetalle" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-surface rounded-xl max-w-2xl w-full p-6 shadow-strong max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-start mb-6">
          <h3 class="text-xl font-bold text-neutral">Detalle del Socio</h3>
          <button @click="cerrarModalDetalle" class="p-2 hover:bg-hover rounded-lg transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div v-if="socioSeleccionado" class="space-y-6">
          <!-- Información Personal -->
          <div>
            <h4 class="text-sm font-semibold text-secondary uppercase mb-3">Información Personal</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-tertiary">Nombre Completo</p>
                <p class="text-sm text-neutral font-medium">{{ socioSeleccionado.nombreCompleto }}</p>
              </div>
              <div>
                <p class="text-xs text-tertiary">CI</p>
                <p class="text-sm text-neutral font-medium">{{ socioSeleccionado.ci }}</p>
              </div>
              <div>
                <p class="text-xs text-tertiary">Correo</p>
                <p class="text-sm text-neutral font-medium">{{ socioSeleccionado.correo }}</p>
              </div>
              <div>
                <p class="text-xs text-tertiary">Teléfono</p>
                <p class="text-sm text-neutral font-medium">{{ socioSeleccionado.numeroCelular || '-' }}</p>
              </div>
              <div>
                <p class="text-xs text-tertiary">Género</p>
                <p class="text-sm text-neutral font-medium">{{ socioSeleccionado.genero || '-' }}</p>
              </div>
              <div>
                <p class="text-xs text-tertiary">Fecha de Nacimiento</p>
                <p class="text-sm text-neutral font-medium">{{ formatearFecha(socioSeleccionado.fechaNacimiento) }}</p>
              </div>
            </div>
          </div>

          <!-- Estado de Solicitud -->
          <div>
            <h4 class="text-sm font-semibold text-secondary uppercase mb-3">Estado de Solicitud</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-tertiary">Estado Actual</p>
                <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mt-1', estadoColors[socioSeleccionado.estado]]">
                  <component :is="estadoIcons[socioSeleccionado.estado]" class="w-3.5 h-3.5" />
                  {{ socioSeleccionado.estado.charAt(0).toUpperCase() + socioSeleccionado.estado.slice(1) }}
                </span>
              </div>
              <div>
                <p class="text-xs text-tertiary">Fecha de Envío</p>
                <p class="text-sm text-neutral font-medium">{{ formatearFecha(socioSeleccionado.fechaEnvio) }}</p>
              </div>
              <div v-if="socioSeleccionado.fechaAfiliacion" class="col-span-2">
                <p class="text-xs text-tertiary">Fecha de Afiliación</p>
                <p class="text-sm text-neutral font-medium">{{ formatearFecha(socioSeleccionado.fechaAfiliacion) }}</p>
              </div>
              <div v-if="socioSeleccionado.observaciones" class="col-span-2">
                <p class="text-xs text-tertiary">Observaciones</p>
                <p class="text-sm text-neutral font-medium">{{ socioSeleccionado.observaciones }}</p>
              </div>
            </div>
          </div>

          <!-- Documentos -->
          <div v-if="socioSeleccionado.carnetIdentidadUrl || socioSeleccionado.carnetAfiliacionUrl">
            <h4 class="text-sm font-semibold text-secondary uppercase mb-3">Documentos</h4>
            <div class="flex gap-3">
              <a 
                v-if="socioSeleccionado.carnetIdentidadUrl"
                :href="socioSeleccionado.carnetIdentidadUrl"
                target="_blank"
                class="btn-outline flex-1"
              >
                Ver Carnet de Identidad
              </a>
              <a 
                v-if="socioSeleccionado.carnetAfiliacionUrl"
                :href="socioSeleccionado.carnetAfiliacionUrl"
                target="_blank"
                class="btn-outline flex-1"
              >
                Ver Carnet de Afiliación
              </a>
            </div>
          </div>

          <!-- Acciones -->
          <div v-if="socioSeleccionado.estado === 'pendiente'" class="flex gap-3 pt-4 border-t border-border">
            <button
              @click="abrirModalAprobacion(socioSeleccionado, 'aprobar'); cerrarModalDetalle()"
              class="btn flex-1 bg-green-600 hover:bg-green-700"
            >
              <Check class="w-4 h-4 mr-2" />
              Aprobar Solicitud
            </button>
            <button
              @click="abrirModalAprobacion(socioSeleccionado, 'rechazar'); cerrarModalDetalle()"
              class="btn flex-1 bg-red-600 hover:bg-red-700"
            >
              <X class="w-4 h-4 mr-2" />
              Rechazar Solicitud
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>