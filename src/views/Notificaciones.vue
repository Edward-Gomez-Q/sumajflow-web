<!-- src/views/Notificaciones.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useNotificacionStore } from '@/stores/notificacionStore'
import AppLayout from '@/components/layout/AppLayout.vue'
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
  RefreshCw
} from 'lucide-vue-next'

const notificacionStore = useNotificacionStore()

const cargando = ref(true)
const mostrarFiltros = ref(false)

const tipos = [
  { value: null, label: 'Todos los tipos', icon: Bell },
  { value: 'success', label: 'Éxito', icon: CheckCircle2 },
  { value: 'warning', label: 'Advertencia', icon: AlertCircle },
  { value: 'info', label: 'Información', icon: Info },
  { value: 'error', label: 'Error', icon: AlertCircle }
]

const estadisticas = computed(() => ({
  total: notificacionStore.paginacion.totalElementos,
  noLeidas: notificacionStore.notificaciones.filter(n => !n.leido).length,
  leidas: notificacionStore.notificaciones.filter(n => n.leido).length
}))

onMounted(async () => {
  try {
    await notificacionStore.fetchNotificaciones()
  } catch (error) {
    console.error('Error al cargar notificaciones:', error)
  } finally {
    cargando.value = false
  }
})

const getNotificationIcon = (tipo) => {
  switch (tipo) {
    case 'success': return CheckCircle2
    case 'warning': return AlertCircle
    case 'info': return Info
    case 'error': return AlertCircle
    default: return Bell
  }
}

const getNotificationColor = (tipo) => {
  switch (tipo) {
    case 'success': return 'bg-green-500'
    case 'warning': return 'bg-yellow-500'
    case 'info': return 'bg-blue-500'
    case 'error': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

const handleMarcarComoLeida = async (notificacionId) => {
  await notificacionStore.marcarComoLeida(notificacionId)
}

const handleMarcarTodasLeidas = async () => {
  await notificacionStore.marcarTodasComoLeidas()
  await notificacionStore.fetchNotificaciones()
}

const handleEliminar = async (notificacionId) => {
  if (confirm('¿Estás seguro de eliminar esta notificación?')) {
    await notificacionStore.eliminarNotificacion(notificacionId)
  }
}

const aplicarFiltroTipo = async (tipo) => {
  await notificacionStore.aplicarFiltros({ tipo })
}

const aplicarFiltroLeido = async (soloNoLeidas) => {
  await notificacionStore.aplicarFiltros({ soloNoLeidas })
}

const limpiarFiltros = async () => {
  await notificacionStore.limpiarFiltros()
}

const cambiarPagina = async (nuevaPagina) => {
  await notificacionStore.cambiarPagina(nuevaPagina)
}
</script>

<template>
  <div>
    <!-- Loader -->
    <div v-if="cargando" class="min-h-screen bg-background flex items-center justify-center">
      <div class="text-center">
        <Loader2 class="inline-block animate-spin h-12 w-12 text-primary mb-4" />
        <p class="text-secondary">Cargando notificaciones...</p>
      </div>
    </div>

    <!-- Contenido Principal -->
    <AppLayout v-else>
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-neutral">Notificaciones</h1>
            <p class="text-secondary mt-2">
              Gestiona y revisa todas tus notificaciones
            </p>
          </div>

          <div class="flex gap-2">
            <button
              @click="limpiarFiltros"
              class="btn-outline flex items-center gap-2"
              :disabled="notificacionStore.loading"
            >
              <RefreshCw class="w-4 h-4" />
              Actualizar
            </button>

            <button
              v-if="estadisticas.noLeidas > 0"
              @click="handleMarcarTodasLeidas"
              class="btn flex items-center gap-2"
              :disabled="notificacionStore.loading"
            >
              <CheckCircle2 class="w-4 h-4" />
              Marcar todas como leídas
            </button>
          </div>
        </div>

        <!-- Estadísticas -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="card">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Bell class="w-5 h-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p class="text-sm text-secondary">Total</p>
                <p class="text-2xl font-bold text-neutral">{{ estadisticas.total }}</p>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <AlertCircle class="w-5 h-5 text-yellow-600 dark:text-yellow-300" />
              </div>
              <div>
                <p class="text-sm text-secondary">Sin leer</p>
                <p class="text-2xl font-bold text-neutral">{{ estadisticas.noLeidas }}</p>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle2 class="w-5 h-5 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p class="text-sm text-secondary">Leídas</p>
                <p class="text-2xl font-bold text-neutral">{{ estadisticas.leidas }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Filtros -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-neutral flex items-center gap-2">
              <Filter class="w-5 h-5" />
              Filtros
            </h3>
            <button
              v-if="notificacionStore.filtros.tipo || notificacionStore.filtros.soloNoLeidas"
              @click="limpiarFiltros"
              class="text-sm text-primary hover:text-primary/80"
            >
              Limpiar filtros
            </button>
          </div>

          <div class="space-y-4">
            <!-- Filtro por estado -->
            <div>
              <p class="text-sm font-medium text-secondary mb-2">Estado:</p>
              <div class="flex flex-wrap gap-2">
                <button
                  @click="aplicarFiltroLeido(false)"
                  :class="[
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    !notificacionStore.filtros.soloNoLeidas
                      ? 'bg-primary text-white'
                      : 'bg-surface border border-border text-secondary hover:bg-hover'
                  ]"
                >
                  Todas
                </button>
                <button
                  @click="aplicarFiltroLeido(true)"
                  :class="[
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    notificacionStore.filtros.soloNoLeidas
                      ? 'bg-primary text-white'
                      : 'bg-surface border border-border text-secondary hover:bg-hover'
                  ]"
                >
                  Solo no leídas
                </button>
              </div>
            </div>

            <!-- Filtro por tipo -->
            <div>
              <p class="text-sm font-medium text-secondary mb-2">Tipo:</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="tipo in tipos"
                  :key="tipo.value || 'all'"
                  @click="aplicarFiltroTipo(tipo.value)"
                  :class="[
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                    notificacionStore.filtros.tipo === tipo.value
                      ? 'bg-primary text-white'
                      : 'bg-surface border border-border text-secondary hover:bg-hover'
                  ]"
                >
                  <component :is="tipo.icon" class="w-4 h-4" />
                  {{ tipo.label }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="notificacionStore.loading" class="card flex items-center justify-center py-12">
          <div class="text-center">
            <Loader2 class="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
            <p class="text-secondary">Cargando notificaciones...</p>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="notificacionStore.notificaciones.length === 0" class="card flex items-center justify-center py-12">
          <div class="text-center">
            <Bell class="w-12 h-12 text-tertiary mx-auto mb-4" />
            <h3 class="text-lg font-semibold text-neutral mb-2">No hay notificaciones</h3>
            <p class="text-secondary">
              {{ notificacionStore.filtros.soloNoLeidas || notificacionStore.filtros.tipo
                ? 'No hay notificaciones con estos filtros'
                : 'No tienes notificaciones en este momento'
              }}
            </p>
          </div>
        </div>

        <!-- Lista de Notificaciones -->
        <div v-else class="space-y-3">
          <div
            v-for="notificacion in notificacionStore.notificaciones"
            :key="notificacion.id"
            class="card hover:shadow-md transition-shadow"
            :class="!notificacion.leido ? 'bg-primary/5 border-l-4 border-primary' : ''"
          >
            <div class="flex gap-4">
              <!-- Icono -->
              <div class="flex-shrink-0">
                <div
                  :class="[
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    getNotificationColor(notificacion.tipo)
                  ]"
                >
                  <component
                    :is="getNotificationIcon(notificacion.tipo)"
                    class="w-6 h-6 text-white"
                  />
                </div>
              </div>

              <!-- Contenido -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <h4 class="text-sm font-semibold text-neutral mb-1">
                      {{ notificacion.titulo }}
                    </h4>
                    <p class="text-sm text-secondary mb-2">
                      {{ notificacion.mensaje }}
                    </p>
                    <p class="text-xs text-tertiary">
                      {{ notificacion.time }}
                    </p>
                  </div>

                  <!-- Badge no leído -->
                  <span
                    v-if="!notificacion.leido"
                    class="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-1"
                  ></span>
                </div>
              </div>

              <!-- Acciones -->
              <div class="flex-shrink-0 flex gap-2">
                <button
                  v-if="!notificacion.leido"
                  @click="handleMarcarComoLeida(notificacion.id)"
                  class="p-2 rounded-lg hover:bg-hover transition-colors text-secondary hover:text-primary"
                  title="Marcar como leída"
                >
                  <CheckCircle2 class="w-5 h-5" />
                </button>

                <button
                  @click="handleEliminar(notificacion.id)"
                  class="p-2 rounded-lg hover:bg-hover transition-colors text-secondary hover:text-error"
                  title="Eliminar"
                >
                  <Trash2 class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Paginación -->
        <div
          v-if="notificacionStore.paginacion.totalPaginas > 1"
          class="card flex items-center justify-between"
        >
          <div class="text-sm text-secondary">
            Mostrando {{ (notificacionStore.paginacion.paginaActual * notificacionStore.paginacion.elementosPorPagina) + 1 }}
            -
            {{ Math.min((notificacionStore.paginacion.paginaActual + 1) * notificacionStore.paginacion.elementosPorPagina, notificacionStore.paginacion.totalElementos) }}
            de {{ notificacionStore.paginacion.totalElementos }} notificaciones
          </div>

          <div class="flex gap-2">
            <button
              @click="cambiarPagina(notificacionStore.paginacion.paginaActual - 1)"
              :disabled="!notificacionStore.paginacion.tieneAnterior"
              class="p-2 rounded-lg border border-border hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>

            <div class="flex gap-1">
              <button
                v-for="pagina in notificacionStore.paginacion.totalPaginas"
                :key="pagina"
                @click="cambiarPagina(pagina - 1)"
                :class="[
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  notificacionStore.paginacion.paginaActual === pagina - 1
                    ? 'bg-primary text-white'
                    : 'border border-border hover:bg-hover'
                ]"
              >
                {{ pagina }}
              </button>
            </div>

            <button
              @click="cambiarPagina(notificacionStore.paginacion.paginaActual + 1)"
              :disabled="!notificacionStore.paginacion.tieneSiguiente"
              class="p-2 rounded-lg border border-border hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  </div>
</template>