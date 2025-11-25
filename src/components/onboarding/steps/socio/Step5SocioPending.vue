<!-- src/components/onboarding/steps/socio/Step5SocioPending.vue -->
<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { 
  CheckCircle, 
  FileText, 
  Clock, 
  Mail, 
  Phone, 
  Copy, 
  Building2, 
  Search, 
  LogOut,
  RefreshCw
} from 'lucide-vue-next'
import { useSocioStore } from '@/stores/socio/socioStore'
import { useSessionStore } from '@/stores/sessionStore'
import { useAuthStore } from '@/stores/authStore'
import AlertMessage from '../../../common/AlertMessage.vue'

const socioStore = useSocioStore()
const sessionStore = useSessionStore()
const authStore = useAuthStore()
const router = useRouter()

const verificando = ref(false)
const mensajeVerificacion = ref(null)

const estadoData = computed(() => socioStore.estadoSocio?.data)
const cooperativa = computed(() => estadoData.value?.cooperativa)
const solicitudId = computed(() => estadoData.value?.solicitudId)

const formatDate = (date) => {
  if (!date) return ''
  return new Intl.DateTimeFormat('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

const formatDateOnly = (date) => {
  if (!date) return ''
  return new Intl.DateTimeFormat('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date))
}

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
  mensajeVerificacion.value = {
    type: 'success',
    message: 'ID copiado al portapapeles'
  }
  setTimeout(() => {
    mensajeVerificacion.value = null
  }, 3000)
}

const verificarEstado = async () => {
  verificando.value = true
  mensajeVerificacion.value = null

  try {
    const resultado = await socioStore.obtenerEstadoSocio()
    
    if (resultado.success) {
      if (socioStore.estaAprobado) {
        mensajeVerificacion.value = {
          type: 'success',
          message: '¡Tu cuenta ha sido aprobada! Redirigiendo...'
        }
        
        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else if (socioStore.estaPendiente) {
        mensajeVerificacion.value = {
          type: 'info',
          message: 'Tu solicitud aún está en revisión. Te notificaremos cuando sea aprobada.'
        }
      } else if (socioStore.estaRechazado) {
        mensajeVerificacion.value = {
          type: 'error',
          message: 'Tu solicitud ha sido rechazada. Por favor, contacta con la cooperativa.'
        }
      }
    } else {
      mensajeVerificacion.value = {
        type: 'error',
        message: 'Error al verificar el estado. Inténtalo nuevamente.'
      }
    }
  } catch (error) {
    console.error('Error al verificar estado:', error)
    mensajeVerificacion.value = {
      type: 'error',
      message: 'Error de conexión. Por favor, verifica tu conexión a internet.'
    }
  } finally {
    verificando.value = false
  }
}

const cerrarSesion = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
  }
}

const estimatedDays = 2

const progressSteps = computed(() => [
  {
    id: 1,
    title: 'Solicitud Enviada',
    description: 'Tu solicitud ha sido enviada exitosamente',
    icon: CheckCircle,
    status: 'completed',
    date: estadoData.value?.fechaEnvio
  },
  {
    id: 2,
    title: 'Revisión Cooperativa',
    description: 'La cooperativa está verificando tu información',
    icon: Search,
    status: 'current',
    date: null
  },
  {
    id: 3,
    title: 'Aprobado',
    description: 'Tu cuenta será activada',
    icon: CheckCircle,
    status: 'pending',
    date: null
  }
])
</script>

<template>
  <div class="min-h-screen bg-background p-8">
    <div class="max-w-4xl mx-auto space-y-8">
      <!-- Header Success -->
      <div class="text-center space-y-4">
        <div class="inline-flex w-20 h-20 rounded-full bg-primary/10 dark:bg-primary/30 items-center justify-center mb-2">
          <Clock class="w-12 h-12 text-primary" />
        </div>
        <div>
          <h2 class="text-3xl font-bold text-neutral mb-2">Solicitud en Revisión</h2>
          <p class="text-lg text-secondary max-w-2xl mx-auto">
            {{ socioStore.mensajeEstado }}
          </p>
        </div>
      </div>

      <!-- Mensaje de verificación -->
      <AlertMessage
        v-if="mensajeVerificacion"
        :type="mensajeVerificacion.type"
        :message="mensajeVerificacion.message"
        :dismissible="true"
        @dismiss="mensajeVerificacion = null"
      />

      <!-- Botones de acción -->
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          @click="verificarEstado"
          :disabled="verificando"
          class="btn btn-primary flex items-center justify-center gap-2"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': verificando }" />
          {{ verificando ? 'Verificando...' : 'Verificar Estado' }}
        </button>
        
        <button
          @click="cerrarSesion"
          class="btn btn-outline flex items-center justify-center gap-2"
        >
          <LogOut class="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>

      <!-- ID de Solicitud -->
      <div class="bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20 rounded-xl p-6">
        <div class="text-center space-y-3">
          <p class="text-sm font-medium text-secondary">ID de Solicitud</p>
          <div class="flex items-center justify-center gap-3">
            <code class="text-2xl font-bold text-primary font-mono bg-white dark:bg-slate-800 px-6 py-3 rounded-lg">
              {{ solicitudId }}
            </code>
            <button
              @click="copyToClipboard(solicitudId)"
              class="btn-ghost w-10 h-10 p-0"
              title="Copiar ID"
            >
              <Copy class="w-5 h-5" />
            </button>
          </div>
          <p class="text-xs text-tertiary">
            Guarda este ID para consultar el estado de tu solicitud
          </p>
        </div>
      </div>

      <!-- Información de la Solicitud -->
      <div class="space-y-4">
        <div class="flex items-center gap-2 mb-4">
          <FileText class="w-5 h-5 text-primary" />
          <h3 class="text-lg font-semibold text-neutral">Resumen de tu Solicitud</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-surface border border-border rounded-lg p-4">
            <p class="text-xs text-tertiary mb-1">Nombre Completo</p>
            <p class="font-medium text-neutral">
              {{ sessionStore.user?.nombres }} {{ sessionStore.user?.primerApellido }} {{ sessionStore.user?.segundoApellido }}
            </p>
          </div>

          <div class="bg-surface border border-border rounded-lg p-4">
            <p class="text-xs text-tertiary mb-1">Fecha de Envío</p>
            <p class="font-medium text-neutral">{{ formatDateOnly(estadoData?.fechaEnvio) }}</p>
          </div>

          <div class="bg-surface border border-border rounded-lg p-4">
            <p class="text-xs text-tertiary mb-1">Fecha de Afiliación</p>
            <p class="font-medium text-neutral">{{ formatDateOnly(estadoData?.fechaAfiliacion) }}</p>
          </div>

          <div class="bg-surface border border-border rounded-lg p-4">
            <p class="text-xs text-tertiary mb-1">Estado</p>
            <span class="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              <div class="w-2 h-2 rounded-full bg-yellow-600 animate-pulse"></div>
              {{ estadoData?.estado }}
            </span>
          </div>
        </div>

        <div v-if="cooperativa" class="bg-primary/5 border border-primary/30 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Building2 class="w-5 h-5 text-primary" />
            </div>
            <div class="flex-1">
              <p class="text-xs text-tertiary mb-1">Cooperativa</p>
              <p class="font-semibold text-neutral">{{ cooperativa.razonSocial }}</p>
              <p class="text-sm text-secondary mt-1">NIT: {{ cooperativa.nit }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Progreso de la Solicitud -->
      <div class="space-y-6">
        <div class="flex items-center gap-2">
          <Clock class="w-5 h-5 text-primary" />
          <h3 class="text-lg font-semibold text-neutral">Estado de tu Solicitud</h3>
        </div>

        <div class="space-y-4">
          <div
            v-for="step in progressSteps"
            :key="step.id"
            class="flex items-start gap-4"
          >
            <!-- Icono de estado -->
            <div class="flex flex-col items-center">
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                :class="[
                  step.status === 'completed' ? 'bg-green-500 text-white' : '',
                  step.status === 'current' ? 'bg-primary text-white ring-4 ring-primary/20' : '',
                  step.status === 'pending' ? 'bg-slate-200 dark:bg-slate-700 text-slate-400' : ''
                ]"
              >
                <component :is="step.icon" class="w-6 h-6" />
              </div>
              <div
                v-if="step.id < progressSteps.length"
                class="w-0.5 h-12 mt-2"
                :class="step.status === 'completed' ? 'bg-green-500' : 'bg-border'"
              ></div>
            </div>

            <!-- Contenido -->
            <div class="flex-1 pb-4">
              <h4
                class="font-semibold mb-1"
                :class="step.status === 'pending' ? 'text-tertiary' : 'text-neutral'"
              >
                {{ step.title }}
              </h4>
              <p class="text-sm text-secondary mb-2">{{ step.description }}</p>
              <p v-if="step.date" class="text-xs text-tertiary">
                {{ formatDate(step.date) }}
              </p>
              <div v-if="step.status === 'current'" class="mt-2">
                <div class="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                  <div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  En proceso
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tiempo estimado usando AlertMessage -->
        <AlertMessage
          type="info"
          :icon="Clock"
          title="Tiempo Estimado de Revisión"
          :message="`${estimatedDays}-${estimatedDays + 1} días laborables`"
        />
      </div>

      <!-- Contacto con la Cooperativa -->
      <div v-if="cooperativa" class="space-y-4">
        <h3 class="text-lg font-semibold text-neutral">Información de Contacto</h3>

        <p class="text-sm text-secondary">
          Si necesitas acelerar el proceso o tienes dudas, contacta directamente con tu cooperativa:
        </p>

        <div class="space-y-3">
          <div class="flex items-center gap-3 bg-surface border border-border rounded-lg p-3">
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail class="w-5 h-5 text-primary" />
            </div>
            <div>
              <p class="text-xs text-tertiary">Correo Electrónico</p>
              <a :href="`mailto:${cooperativa.correoContacto}`" class="text-sm font-medium text-primary hover:underline">
                {{ cooperativa.correoContacto }}
              </a>
            </div>
          </div>

          <div v-if="cooperativa.numeroTelefonoMovil" class="flex items-center gap-3 bg-surface border border-border rounded-lg p-3">
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone class="w-5 h-5 text-primary" />
            </div>
            <div>
              <p class="text-xs text-tertiary">Teléfono</p>
              <a :href="`tel:${cooperativa.numeroTelefonoMovil}`" class="text-sm font-medium text-primary hover:underline">
                {{ cooperativa.numeroTelefonoMovil }}
              </a>
            </div>
          </div>
        </div>

        <!-- Mensaje de tip usando AlertMessage -->
        <AlertMessage
          type="warning"
          title="Tip"
        >
          <template #default>
            Menciona tu ID de solicitud <code class="bg-yellow-100 dark:bg-yellow-800 px-1.5 py-0.5 rounded font-mono">{{ solicitudId }}</code> al contactar con la cooperativa para agilizar la búsqueda de tu información.
          </template>
        </AlertMessage>
      </div>
    </div>
  </div>
</template>