<!-- src/views/cooperativa/SocioSolicitudes.vue -->
<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useSocioStore } from '@/stores/cooperativa/socioStore'
import { useNotificacionStore } from '@/stores/notificacionStore'
import AppLayout from '@/components/layout/AppLayout.vue'
import {
  Search,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
  UserCheck,
  UserX
} from 'lucide-vue-next'

const socioStore = useSocioStore()
const notificacionStore = useNotificacionStore()

// State local
const busquedaLocal = ref('')
const ordenarPor = ref('fechaEnvio')
const direccion = ref('desc')
const mostrarModalAprobacion = ref(false)
const mostrarModalDetalle = ref(false)
const socioSeleccionado = ref(null)
const accionActual = ref('') // 'aprobar' o 'rechazar'
const observaciones = ref('')
const isProcessing = ref(false)

// Computed
const solicitudesPendientes = computed(() => socioStore.sociosPendientes)
const isLoading = computed(() => socioStore.isLoading)
const paginacion = computed(() => socioStore.paginacion)
const totalPendientes = computed(() => socioStore.estadisticas.totalPendientes)

// Colores para badges de estado
const estadoColors = {
  pendiente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
}

// Lifecycle
onMounted(async () => {
  await cargarSolicitudes()
  setupWebSocketListener()
})

// Watcher para detectar nuevas solicitudes desde WebSocket
watch(
  () => notificacionStore.notificaciones,
  (nuevasNotificaciones) => {
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
const cargarSolicitudes = async () => {
  await socioStore.fetchSocios({ 
    estado: 'pendiente',
    ordenarPor: ordenarPor.value,
    direccion: direccion.value
  })
}

const setupWebSocketListener = () => {
  socioStore.setupWebSocketListener()
}

const buscar = async () => {
  await socioStore.buscarSocio(busquedaLocal.value)
}

const cambiarOrden = async (campo) => {
  if (ordenarPor.value === campo) {
    direccion.value = direccion.value === 'asc' ? 'desc' : 'asc'
  } else {
    ordenarPor.value = campo
    direccion.value = 'desc'
  }
  
  await socioStore.aplicarFiltros({
    estado: 'pendiente',
    ordenarPor: ordenarPor.value,
    direccion: direccion.value
  })
}

const limpiarFiltros = async () => {
  busquedaLocal.value = ''
  ordenarPor.value = 'fechaEnvio'
  direccion.value = 'desc'
  await socioStore.aplicarFiltros({
    estado: 'pendiente',
    ordenarPor: ordenarPor.value,
    direccion: direccion.value
  })
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
    // Recargar solicitudes para actualizar la lista
    await cargarSolicitudes()
  } else {
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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const refrescar = async () => {
  await cargarSolicitudes()
}
const previewFile = (url) => {
  console.log('Previewing file:', url)
}
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-3xl font-bold text-neutral">Solicitudes de Socios</h1>
          <p class="text-secondary mt-2">
            Gestiona las solicitudes pendientes de afiliación
          </p>
        </div>
        <button
          @click="refrescar"
          class="btn-outline"
          :disabled="isLoading"
        >
          <RefreshCw :class="['w-4 h-4', isLoading && 'animate-spin']" />
          Actualizar
        </button>
      </div>

      <!-- Estadística de pendientes -->
      <div class="card-flat">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
            <Clock class="w-7 h-7 text-yellow-600 dark:text-yellow-300" />
          </div>
          <div>
            <p class="text-sm text-secondary">Solicitudes Pendientes</p>
            <p class="text-3xl font-bold text-neutral">{{ totalPendientes }}</p>
            <p class="text-xs text-tertiary mt-1">
              Esperando tu revisión y aprobación
            </p>
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

          <!-- Botones de acción -->
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
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="card-flat flex items-center justify-center py-12">
        <div class="text-center">
          <Loader2 class="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p class="text-secondary">Cargando solicitudes...</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="solicitudesPendientes.length === 0" class="card-flat flex items-center justify-center py-12">
        <div class="text-center">
          <Clock class="w-16 h-16 text-yellow-300 dark:text-yellow-600 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-neutral mb-2">
            {{ busquedaLocal ? 'No se encontraron solicitudes' : '¡Todo al día!' }}
          </h3>
          <p class="text-secondary max-w-md mx-auto">
            {{ busquedaLocal 
              ? 'No hay solicitudes que coincidan con tu búsqueda' 
              : 'No tienes solicitudes pendientes de aprobación en este momento' 
            }}
          </p>
        </div>
      </div>

      <!-- Tabla de solicitudes -->
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
                    Solicitante
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
                  @click="cambiarOrden('fechaEnvio')"
                >
                  <div class="flex items-center gap-2">
                    Fecha de Solicitud
                    <span v-if="ordenarPor === 'fechaEnvio'" class="text-primary">
                      {{ direccion === 'asc' ? '↑' : '↓' }}
                    </span>
                  </div>
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr 
                v-for="socio in solicitudesPendientes" 
                :key="socio.cooperativaSocioId"
                class="hover:bg-hover transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center text-yellow-700 dark:text-yellow-300 font-semibold">
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
                  {{ formatearFecha(socio.fechaEnvio) }}
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
                    <button
                      @click="abrirModalAprobacion(socio, 'aprobar')"
                      class="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900 transition-colors text-green-600 dark:text-green-400"
                      title="Aprobar solicitud"
                    >
                      <Check class="w-4 h-4" />
                    </button>
                    <button
                      @click="abrirModalAprobacion(socio, 'rechazar')"
                      class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 transition-colors text-red-600 dark:text-red-400"
                      title="Rechazar solicitud"
                    >
                      <X class="w-4 h-4" />
                    </button>
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
            de {{ paginacion.totalElementos }} solicitudes
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
          <h3 class="text-xl font-bold text-neutral">Detalle de la Solicitud</h3>
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
                <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mt-1', estadoColors.pendiente]">
                  <Clock class="w-3.5 h-3.5" />
                  Pendiente
                </span>
              </div>
              <div>
                <p class="text-xs text-tertiary">Fecha de Envío</p>
                <p class="text-sm text-neutral font-medium">{{ formatearFecha(socioSeleccionado.fechaEnvio) }}</p>
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
                @click="previewFile(socioSeleccionado.carnetIdentidadUrl)"
                class="btn-outline flex-1"
              >
                Ver Carnet de Identidad
              </a>
              <a 
                v-if="socioSeleccionado.carnetAfiliacionUrl"
                @click="previewFile(socioSeleccionado.carnetAfiliacionUrl)"
                class="btn-outline flex-1"
              >
                Ver Carnet de Afiliación
              </a>
            </div>
          </div>

          <!-- Acciones -->
          <div class="flex gap-3 pt-4 border-t border-border">
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