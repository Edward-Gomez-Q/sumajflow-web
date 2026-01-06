<!-- src/components/cooperativa/TransportistaDetalleModal.vue -->
<script setup>
import { ref, computed } from 'vue'
import { useFilesStore } from '@/stores/filesStore'
import {
  X,
  Truck,
  User,
  Phone,
  Mail,
  Calendar,
  Star,
  MapPin,
  Package,
  Clock,
  IdCard,
  Award,
  FileText,
  Eye
} from 'lucide-vue-next'

const props = defineProps({
  transportista: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const filesStore = useFilesStore()

// Formateo de datos
const formatearFecha = (fecha) => {
  if (!fecha) return '-'
  const date = new Date(fecha)
  return date.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

const formatearNumero = (num) => {
  if (num == null) return '0'
  return Number(num).toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Computed para colores del estado - usando colores sólidos como los KPIs
const estadoColor = computed(() => {
  const colores = {
    activo: {
      bg: 'bg-green-100 dark:bg-green-900',
      text: 'text-green-900 dark:text-green-100',
      border: 'border-green-200 dark:border-green-800'
    },
    inactivo: {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-900 dark:text-slate-100',
      border: 'border-slate-200 dark:border-slate-700'
    },
    en_ruta: {
      bg: 'bg-blue-100 dark:bg-blue-900',
      text: 'text-blue-900 dark:text-blue-100',
      border: 'border-blue-200 dark:border-blue-800'
    },
    aprobado: {
      bg: 'bg-green-100 dark:bg-green-900',
      text: 'text-green-900 dark:text-green-100',
      border: 'border-green-200 dark:border-green-800'
    }
  }
  return colores[props.transportista.estadoCuenta] || colores.activo
})

// Función para visualizar documentos
const previewFile = (url) => {
  if (url) {
    filesStore.openFile(props.transportista.licenciaConducir)
  }
}

// Computed para la URL completa de la licencia
const licenciaUrl = computed(() => {
  if (!props.transportista.licenciaConducir) return null
  // Si ya es una URL completa, retornarla
  if (props.transportista.licenciaConducir.startsWith('http')) {
    return props.transportista.licenciaConducir
  }
  // Si no, construir la URL usando el patrón del FileController
  const parts = props.transportista.licenciaConducir.split('/')
  if (parts.length >= 2) {
    const folder = parts[0]
    const filename = parts.slice(1).join('/')
    return `${import.meta.env.VITE_API_URL}/files/${folder}/${filename}`
  }
  return null
})
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-border">
        
        <!-- Header -->
        <div class="flex justify-between items-start p-6 border-b border-border sticky top-0 bg-surface z-10">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Truck class="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h3 class="text-xl font-semibold text-neutral">{{ transportista.nombreCompleto || 'Sin nombre' }}</h3>
              <p class="text-sm text-secondary">CI: {{ transportista.ci }}</p>
            </div>
          </div>
          <button @click="emit('close')" class="p-2 hover:bg-hover rounded-lg transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Contenido -->
        <div class="p-6 space-y-6">
          
          <!-- Estado Actual - Mejorado con colores sólidos -->
          <div :class="['rounded-lg p-5 border-2', estadoColor.bg, estadoColor.border]">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p :class="['text-sm font-medium mb-1', estadoColor.text]">Estado de Cuenta</p>
                <p :class="['text-2xl font-bold capitalize', estadoColor.text]">
                  {{ transportista.estadoCuenta }}
                </p>
              </div>
              <div class="md:text-right">
                <p :class="['text-sm font-medium mb-1', estadoColor.text]">Estado de Trazabilidad</p>
                <p :class="['text-lg font-semibold capitalize', estadoColor.text]">
                  {{ transportista.estadoTrazabilidad?.replace('_', ' ') || 'Habilitado' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Información Personal -->
          <div>
            <h4 class="text-sm font-semibold text-secondary uppercase mb-3 flex items-center gap-2">
              <User class="w-4 h-4" />
              Información Personal
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <p class="text-xs text-tertiary">Nombre Completo</p>
                <p class="text-sm text-neutral font-medium">{{ transportista.nombreCompleto || 'Sin nombre' }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-tertiary flex items-center gap-1">
                  <IdCard class="w-3 h-3" />
                  Carnet de Identidad
                </p>
                <p class="text-sm text-neutral font-medium">{{ transportista.ci }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-tertiary flex items-center gap-1">
                  <Mail class="w-3 h-3" />
                  Correo Electrónico
                </p>
                <p class="text-sm text-neutral">{{ transportista.correo }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-tertiary flex items-center gap-1">
                  <Phone class="w-3 h-3" />
                  Número de Celular
                </p>
                <p class="text-sm text-neutral">{{ transportista.numeroCelular || 'Sin teléfono' }}</p>
              </div>
            </div>
          </div>

          <!-- Información del Vehículo -->
          <div>
            <h4 class="text-sm font-semibold text-secondary uppercase mb-3 flex items-center gap-2">
              <Truck class="w-4 h-4" />
              Información del Vehículo
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <p class="text-xs text-tertiary">Placa</p>
                <p class="text-sm text-neutral font-medium">{{ transportista.placaVehiculo }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-tertiary">Marca</p>
                <p class="text-sm text-neutral">{{ transportista.marcaVehiculo || 'No especificada' }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-tertiary">Modelo</p>
                <p class="text-sm text-neutral">{{ transportista.modeloVehiculo || 'No especificado' }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-tertiary">Color</p>
                <p class="text-sm text-neutral">{{ transportista.colorVehiculo || 'No especificado' }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-tertiary">Capacidad de Carga</p>
                <p class="text-sm text-neutral font-medium">{{ formatearNumero(transportista.capacidadCarga) }} kg</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-tertiary">Peso Tara</p>
                <p class="text-sm text-neutral">{{ formatearNumero(transportista.pesoTara) }} kg</p>
              </div>
            </div>
          </div>

          <!-- Licencia de Conducir -->
          <div v-if="transportista.licenciaConducir || transportista.categoriaLicencia">
            <h4 class="text-sm font-semibold text-secondary uppercase mb-3 flex items-center gap-2">
              <Award class="w-4 h-4" />
              Licencia de Conducir
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <p class="text-xs text-tertiary">Categoría</p>
                <p class="text-sm text-neutral font-medium">{{ transportista.categoriaLicencia || '-' }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-tertiary">Fecha de Vencimiento</p>
                <p class="text-sm text-neutral">{{ formatearFecha(transportista.fechaVencimientoLicencia) }}</p>
              </div>
              
              <!-- Botón para ver documento -->
              <div v-if="licenciaUrl" class="col-span-full">
                <button
                  @click="previewFile(licenciaUrl)"
                  class="btn-outline w-full flex items-center justify-center gap-2"
                  :disabled="filesStore.loading"
                >
                  <Eye class="w-4 h-4" />
                  Ver Licencia de Conducir
                </button>
              </div>
            </div>
          </div>

          <!-- Estadísticas -->
          <div>
            <h4 class="text-sm font-semibold text-secondary uppercase mb-3 flex items-center gap-2">
              <Package class="w-4 h-4" />
              Estadísticas de Trabajo
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="bg-blue-100 dark:bg-blue-900 rounded-lg p-4 text-center border-2 border-blue-200 dark:border-blue-800">
                <Package class="w-6 h-6 text-blue-600 dark:text-blue-300 mx-auto mb-2" />
                <p class="text-2xl font-bold text-blue-900 dark:text-blue-100">{{ transportista.viajesCompletados || 0 }}</p>
                <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">Viajes Completados</p>
              </div>
              <div class="bg-yellow-100 dark:bg-yellow-900 rounded-lg p-4 text-center border-2 border-yellow-200 dark:border-yellow-800">
                <Star class="w-6 h-6 text-yellow-600 dark:text-yellow-300 mx-auto mb-2" />
                <p class="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{{ formatearNumero(transportista.calificacionPromedio) }}</p>
                <p class="text-xs text-yellow-700 dark:text-yellow-300 mt-1">Calificación</p>
              </div>
              <div class="bg-green-100 dark:bg-green-900 rounded-lg p-4 text-center border-2 border-green-200 dark:border-green-800">
                <Clock class="w-6 h-6 text-green-600 dark:text-green-300 mx-auto mb-2" />
                <p class="text-2xl font-bold text-green-900 dark:text-green-100">
                  {{ transportista.estadoCuenta === 'en_ruta' ? 'Activo' : 'Disponible' }}
                </p>
                <p class="text-xs text-green-700 dark:text-green-300 mt-1">Estado Actual</p>
              </div>
            </div>
          </div>

          <!-- Fechas Importantes -->
          <div>
            <h4 class="text-sm font-semibold text-secondary uppercase mb-3 flex items-center gap-2">
              <Calendar class="w-4 h-4" />
              Fechas
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <p class="text-xs text-tertiary">Fecha de Aprobación</p>
                <p class="text-sm text-neutral">{{ formatearFecha(transportista.fechaAprobacion) }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-tertiary">Registrado Desde</p>
                <p class="text-sm text-neutral">{{ formatearFecha(transportista.createdAt) }}</p>
              </div>
            </div>
          </div>

          <!-- Invitación (si existe) - Mejorado con colores sólidos -->
          <div v-if="transportista.invitacion" class="bg-blue-100 dark:bg-blue-900 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-5">
            <h4 class="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
              <Mail class="w-4 h-4" />
              Información de Invitación
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">Fecha de Invitación</p>
                <p class="text-sm text-blue-900 dark:text-blue-100 font-semibold">
                  {{ formatearFecha(transportista.invitacion.fechaInvitacion) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">Fecha de Aceptación</p>
                <p class="text-sm text-blue-900 dark:text-blue-100 font-semibold">
                  {{ formatearFecha(transportista.invitacion.fechaAceptacion) }}
                </p>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="flex gap-3 p-6 border-t border-border sticky bottom-0 bg-surface">
          <button @click="emit('close')" class="flex-1 btn-secondary">
            Cerrar
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Asegurar que el z-index sea suficientemente alto */
.z-\[10000\] {
  z-index: 10000;
}
</style>