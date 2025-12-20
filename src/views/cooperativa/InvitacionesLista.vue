<!-- src/views/cooperativa/InvitacionesLista.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTransportistaStore } from '@/stores/cooperativa/transportistaStore'
import AppLayout from '@/components/layout/AppLayout.vue'
import TransportistaInvitacionModal from '@/components/cooperativa/TransportistaInvitacionModal.vue'
import {
  Search,
  QrCode,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  RefreshCw,
  Plus,
  Download,
  Share2,
  X
} from 'lucide-vue-next'

const transportistaStore = useTransportistaStore()

// State local
const busquedaLocal = ref('')
const estadoFiltro = ref('')
const mostrarModalInvitacion = ref(false)
const invitacionSeleccionada = ref(null)
const mostrarDetalleQR = ref(false)

// Computed
const invitaciones = computed(() => transportistaStore.invitaciones)
const isLoading = computed(() => transportistaStore.isLoading)
const paginacion = computed(() => transportistaStore.paginacionInvitaciones)

// Estadísticas computadas
const estadisticas = computed(() => ({
  pendientes: transportistaStore.invitacionesPendientes.length,
  enProceso: transportistaStore.invitacionesEnProceso.length,
  completadas: transportistaStore.invitacionesCompletadas.length,
  expiradas: transportistaStore.invitacionesExpiradas.length
}))

// Colores para badges de estado
const estadoColors = {
  pendiente_qr: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  codigo_enviado: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  verificado: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  completado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  expirado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}

// Iconos para estados
const estadoIcons = {
  pendiente_qr: QrCode,
  codigo_enviado: Clock,
  verificado: CheckCircle2,
  completado: CheckCircle2,
  expirado: XCircle
}

// Lifecycle
onMounted(async () => {
  await cargarDatos()
})

// Methods
const cargarDatos = async () => {
  await transportistaStore.fetchInvitaciones()
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
  await transportistaStore.aplicarFiltrosInvitaciones({ busqueda: busquedaLocal.value })
}

const aplicarFiltroEstado = async (estado) => {
  estadoFiltro.value = estado
  await transportistaStore.aplicarFiltrosInvitaciones({ estado })
}

const limpiarFiltros = async () => {
  busquedaLocal.value = ''
  estadoFiltro.value = ''
  await transportistaStore.limpiarFiltrosInvitaciones()
}

const verDetalleQR = (invitacion) => {
  invitacionSeleccionada.value = invitacion
  mostrarDetalleQR.value = true
}

const cerrarDetalleQR = () => {
  mostrarDetalleQR.value = false
  invitacionSeleccionada.value = null
}

const descargarQR = (invitacion) => {
  if (!invitacion.qrCodeBase64) return

  const link = document.createElement('a')
  link.href = invitacion.qrCodeBase64
  link.download = `QR-${invitacion.nombreCompleto.replace(/ /g, '-')}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const compartirQR = async (invitacion) => {
  if (!invitacion.qrCodeBase64) return

  try {
    const response = await fetch(invitacion.qrCodeBase64)
    const blob = await response.blob()
    const file = new File([blob], `QR-${invitacion.nombreCompleto}.png`, { type: 'image/png' })

    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'Invitación de Transportista',
        text: `Invitación para ${invitacion.nombreCompleto}`,
        files: [file]
      })
    } else {
      descargarQR(invitacion)
    }
  } catch (error) {
    console.error('Error al compartir:', error)
    descargarQR(invitacion)
  }
}

const cambiarPagina = async (pagina) => {
  await transportistaStore.cambiarPaginaInvitaciones(pagina)
}

const formatearFecha = (fecha) => {
  if (!fecha) return '-'
  const date = new Date(fecha)
  return date.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getEstadoTexto = (estado) => {
  const textos = {
    pendiente_qr: 'QR Pendiente',
    codigo_enviado: 'Código Enviado',
    verificado: 'Verificado',
    completado: 'Completado',
    expirado: 'Expirado'
  }
  return textos[estado] || estado
}

const estaExpirado = (fechaExpiracion) => {
  return new Date(fechaExpiracion) < new Date()
}
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-neutral">Invitaciones</h1>
          <p class="text-secondary mt-2">
            Gestiona las invitaciones de transportistas con código QR
          </p>
        </div>
        <button
          @click="abrirModalInvitacion"
          class="btn flex items-center gap-2"
        >
          <Plus class="w-5 h-5" />
          Nueva Invitación
        </button>
      </div>

      <!-- Estadísticas 
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          class="card-flat cursor-pointer hover:shadow-md transition-shadow" 
          @click="aplicarFiltroEstado('pendiente_qr')"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <QrCode class="w-5 h-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p class="text-sm text-secondary">QR Pendientes</p>
              <p class="text-2xl font-bold text-neutral">{{ estadisticas.pendientes }}</p>
            </div>
          </div>
        </div>

        <div 
          class="card-flat cursor-pointer hover:shadow-md transition-shadow" 
          @click="aplicarFiltroEstado('codigo_enviado')"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
              <Clock class="w-5 h-5 text-yellow-600 dark:text-yellow-300" />
            </div>
            <div>
              <p class="text-sm text-secondary">En Proceso</p>
              <p class="text-2xl font-bold text-neutral">{{ estadisticas.enProceso }}</p>
            </div>
          </div>
        </div>

        <div 
          class="card-flat cursor-pointer hover:shadow-md transition-shadow" 
          @click="aplicarFiltroEstado('completado')"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle2 class="w-5 h-5 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p class="text-sm text-secondary">Completadas</p>
              <p class="text-2xl font-bold text-neutral">{{ estadisticas.completadas }}</p>
            </div>
          </div>
        </div>

        <div 
          class="card-flat cursor-pointer hover:shadow-md transition-shadow" 
          @click="aplicarFiltroEstado('expirado')"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <XCircle class="w-5 h-5 text-red-600 dark:text-red-300" />
            </div>
            <div>
              <p class="text-sm text-secondary">Expiradas</p>
              <p class="text-2xl font-bold text-neutral">{{ estadisticas.expiradas }}</p>
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
                placeholder="Buscar por nombre o celular..."
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
              @click="aplicarFiltroEstado('pendiente_qr')"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                estadoFiltro === 'pendiente_qr' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-surface border border-border text-secondary hover:bg-hover'
              ]"
            >
              QR Pendiente
            </button>
            <button
              @click="aplicarFiltroEstado('codigo_enviado')"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                estadoFiltro === 'codigo_enviado' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-surface border border-border text-secondary hover:bg-hover'
              ]"
            >
              En Proceso
            </button>
            <button
              @click="aplicarFiltroEstado('verificado')"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                estadoFiltro === 'verificado' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-surface border border-border text-secondary hover:bg-hover'
              ]"
            >
              Verificado
            </button>
            <button
              @click="aplicarFiltroEstado('completado')"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                estadoFiltro === 'completado' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-surface border border-border text-secondary hover:bg-hover'
              ]"
            >
              Completado
            </button>
            <button
              @click="aplicarFiltroEstado('expirado')"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                estadoFiltro === 'expirado' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-surface border border-border text-secondary hover:bg-hover'
              ]"
            >
              Expirado
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="card-flat flex items-center justify-center py-12">
        <div class="text-center">
          <Loader2 class="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p class="text-secondary">Cargando invitaciones...</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="invitaciones.length === 0" class="card-flat flex items-center justify-center py-12">
        <div class="text-center">
          <QrCode class="w-12 h-12 text-tertiary mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-neutral mb-2">No se encontraron invitaciones</h3>
          <p class="text-secondary mb-4">
            {{ estadoFiltro ? 'No hay invitaciones con este filtro' : 'Comienza creando tu primera invitación' }}
          </p>
          <button
            v-if="!estadoFiltro"
            @click="abrirModalInvitacion"
            class="btn flex items-center gap-2 mx-auto"
          >
            <Plus class="w-4 h-4" />
            Nueva Invitación
          </button>
        </div>
      </div>

      <!-- Tabla de invitaciones -->
      <div v-else class="card-flat overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-hover border-b border-border">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                  Transportista
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                  Contacto
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                  Estado
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                  Creada
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                  Expira
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr 
                v-for="invitacion in invitaciones" 
                :key="invitacion.id"
                class="hover:bg-hover transition-colors"
              >
                <!-- Transportista -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {{ invitacion.nombreCompleto.charAt(0) }}
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-neutral">
                        {{ invitacion.nombreCompleto }}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Contacto -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-neutral">
                    {{ invitacion.numeroCelular }}
                  </div>
                </td>

                <!-- Estado -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', estadoColors[invitacion.estado]]">
                    <component :is="estadoIcons[invitacion.estado]" class="w-3.5 h-3.5" />
                    {{ getEstadoTexto(invitacion.estado) }}
                  </span>
                </td>

                <!-- Creada -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                  {{ formatearFecha(invitacion.fechaCreacion) }}
                </td>

                <!-- Expira -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm" :class="estaExpirado(invitacion.fechaExpiracion) ? 'text-error' : 'text-secondary'">
                    {{ formatearFecha(invitacion.fechaExpiracion) }}
                  </div>
                  <div v-if="estaExpirado(invitacion.fechaExpiracion)" class="text-xs text-error flex items-center gap-1 mt-1">
                    <AlertCircle class="w-3 h-3" />
                    Expirado
                  </div>
                </td>

                <!-- Acciones -->
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end gap-2">
                    <button
                      @click="verDetalleQR(invitacion)"
                      class="p-2 rounded-lg hover:bg-background transition-colors text-primary"
                      title="Ver QR"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    
                    <button
                      v-if="invitacion.estado === 'pendiente_qr'"
                      @click="descargarQR(invitacion)"
                      class="p-2 rounded-lg hover:bg-background transition-colors text-blue-600"
                      title="Descargar QR"
                    >
                      <Download class="w-4 h-4" />
                    </button>

                    <button
                      v-if="invitacion.estado === 'pendiente_qr'"
                      @click="compartirQR(invitacion)"
                      class="p-2 rounded-lg hover:bg-background transition-colors text-green-600"
                      title="Compartir QR"
                    >
                      <Share2 class="w-4 h-4" />
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
            de {{ paginacion.totalElementos }} invitaciones
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

    <!-- Modal Detalle QR -->
    <Teleport v-if="mostrarDetalleQR && invitacionSeleccionada" to="body">
      <div class="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div class="bg-surface rounded-xl shadow-2xl w-full max-w-md border border-border">
          <div class="p-6">
            <div class="flex justify-between items-start mb-4">
              <h3 class="text-xl font-semibold text-neutral">Código QR</h3>
              <button @click="cerrarDetalleQR" class="p-2 hover:bg-hover rounded-lg">
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="bg-white dark:bg-slate-900 rounded-xl p-6 mb-4">
              <img 
                :src="invitacionSeleccionada.qrCodeBase64" 
                alt="Código QR"
                class="w-full rounded-lg"
              />
            </div>

            <div class="space-y-2 mb-4">
              <div class="flex justify-between text-sm">
                <span class="text-secondary">Nombre:</span>
                <span class="text-neutral font-medium">{{ invitacionSeleccionada.nombreCompleto }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-secondary">Estado:</span>
                <span :class="['font-medium', invitacionSeleccionada.expirado ? 'text-error' : 'text-neutral']">
                  {{ getEstadoTexto(invitacionSeleccionada.estado) }}
                </span>
              </div>
            </div>

            <div class="flex gap-2">
              <button
                @click="descargarQR(invitacionSeleccionada)"
                class="flex-1 btn-outline"
              >
                <Download class="w-4 h-4" />
                Descargar
              </button>
              <button
                @click="compartirQR(invitacionSeleccionada)"
                class="flex-1 btn"
              >
                <Share2 class="w-4 h-4" />
                Compartir
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>