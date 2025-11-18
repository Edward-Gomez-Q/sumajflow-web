<script setup>
import { computed, ref } from 'vue'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useRouter } from 'vue-router'
import { CheckCircle, FileText, Clock, Mail, Phone, Copy, Building2, Search, PartyPopper, AlertCircle } from 'lucide-vue-next'

const router = useRouter()
const onboardingStore = useOnboardingStore()

const socioData = computed(() => onboardingStore.socioData)
const personalData = computed(() => onboardingStore.personalData)

// Generar ID de solicitud simulado
const solicitudId = ref(`SOL-${Date.now().toString(36).toUpperCase()}`)
const fechaEnvio = ref(new Date())

// Información de la cooperativa (simulada - vendría del backend)
const cooperativaInfo = ref({
  id: socioData.value.cooperativa_id,
  razon_social: 'Cooperativa Minera 15 de Agosto LTDA',
  nit: '1234567890',
  correo_contacto: 'contacto@cooperativa15.com',
  telefono: '(2) 6234567'
})

const formatDate = (date) => {
  return new Intl.DateTimeFormat('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
  alert('ID copiado al portapapeles')
}

const handleFinish = () => {
  // Cerrar sesión temporal y redirigir al login
  onboardingStore.resetOnboarding()
  router.push('/login')
}

// Tiempo estimado de revisión
const estimatedDays = ref(2) // 2-3 días laborables

const progressSteps = [
  {
    id: 1,
    title: 'Solicitud Enviada',
    description: 'Tu solicitud ha sido enviada exitosamente',
    icon: CheckCircle,
    status: 'completed',
    date: fechaEnvio.value
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
    icon: PartyPopper,
    status: 'pending',
    date: null
  }
]
</script>

<template>
  <div class="space-y-8">
    <!-- Header Success -->
    <div class="text-center space-y-4">
      <div class="inline-flex w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 center mb-2">
        <CheckCircle class="w-12 h-12 text-green-600 dark:text-green-400" />
      </div>
      <div>
        <h2 class="text-3xl font-bold text-neutral mb-2">¡Solicitud Enviada!</h2>
        <p class="text-lg text-secondary max-w-2xl mx-auto">
          Tu solicitud de asociación ha sido enviada exitosamente a la cooperativa
        </p>
      </div>
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
            {{ personalData.nombres }} {{ personalData.primer_apellido }} {{ personalData.segundo_apellido }}
          </p>
        </div>

        <div class="bg-surface border border-border rounded-lg p-4">
          <p class="text-xs text-tertiary mb-1">Carnet de Identidad</p>
          <p class="font-medium text-neutral">{{ personalData.ci }}</p>
        </div>

        <div class="bg-surface border border-border rounded-lg p-4">
          <p class="text-xs text-tertiary mb-1">Número de Socio</p>
          <p class="font-medium text-neutral">{{ socioData.numero_socio }}</p>
        </div>

        <div class="bg-surface border border-border rounded-lg p-4">
          <p class="text-xs text-tertiary mb-1">Fecha de Afiliación</p>
          <p class="font-medium text-neutral">
            {{ new Date(socioData.fecha_afiliacion).toLocaleDateString('es-BO', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }) }}
          </p>
        </div>
      </div>

      <div class="bg-primary/5 border border-primary/30 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-full bg-primary/20 center shrink-0">
            <Building2 class="w-5 h-5 text-primary" />
          </div>
          <div class="flex-1">
            <p class="text-xs text-tertiary mb-1">Cooperativa</p>
            <p class="font-semibold text-neutral">{{ cooperativaInfo.razon_social }}</p>
            <p class="text-sm text-secondary mt-1">NIT: {{ cooperativaInfo.nit }}</p>
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
              class="w-12 h-12 rounded-full center transition-all"
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

      <!-- Tiempo estimado -->
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div class="flex items-center gap-3">
          <Clock class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <div>
            <p class="font-medium text-blue-900 dark:text-blue-100">Tiempo Estimado de Revisión</p>
            <p class="text-sm text-blue-800 dark:text-blue-200 mt-1">
              {{ estimatedDays }}-{{ estimatedDays + 1 }} días laborables
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Contacto con la Cooperativa -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-neutral">Información de Contacto</h3>

      <p class="text-sm text-secondary">
        Si necesitas acelerar el proceso o tienes dudas, contacta directamente con tu cooperativa:
      </p>

      <div class="space-y-3">
        <div class="flex items-center gap-3 bg-surface border border-border rounded-lg p-3">
          <div class="w-10 h-10 rounded-full bg-primary/10 center">
            <Mail class="w-5 h-5 text-primary" />
          </div>
          <div>
            <p class="text-xs text-tertiary">Correo Electrónico</p>
            <a :href="`mailto:${cooperativaInfo.correo_contacto}`" class="text-sm font-medium text-primary hover:underline">
              {{ cooperativaInfo.correo_contacto }}
            </a>
          </div>
        </div>

        <div class="flex items-center gap-3 bg-surface border border-border rounded-lg p-3">
          <div class="w-10 h-10 rounded-full bg-primary/10 center">
            <Phone class="w-5 h-5 text-primary" />
          </div>
          <div>
            <p class="text-xs text-tertiary">Teléfono</p>
            <a :href="`tel:${cooperativaInfo.telefono}`" class="text-sm font-medium text-primary hover:underline">
              {{ cooperativaInfo.telefono }}
            </a>
          </div>
        </div>
      </div>

      <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div class="flex gap-3">
          <AlertCircle class="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
          <p class="text-sm text-yellow-900 dark:text-yellow-100">
            <strong>Tip:</strong> Menciona tu ID de solicitud <code class="bg-yellow-100 dark:bg-yellow-800 px-1.5 py-0.5 rounded">{{ solicitudId }}</code> al contactar con la cooperativa para agilizar la búsqueda de tu información.
          </p>
        </div>
      </div>
    </div>

    <!-- Próximos Pasos -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-neutral">¿Qué Sucede Ahora?</h3>

      <div class="space-y-3">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-primary/10 center text-primary font-bold text-sm shrink-0">
            1
          </div>
          <div>
            <p class="text-sm font-medium text-neutral">Recibirás un correo de confirmación</p>
            <p class="text-xs text-secondary mt-1">
              En {{ onboardingStore.userData.correo }} con los detalles de tu solicitud
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-primary/10 center text-primary font-bold text-sm shrink-0">
            2
          </div>
          <div>
            <p class="text-sm font-medium text-neutral">La cooperativa revisará tu información</p>
            <p class="text-xs text-secondary mt-1">
              Verificarán tus documentos y datos de afiliación
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-primary/10 center text-primary font-bold text-sm shrink-0">
            3
          </div>
          <div>
            <p class="text-sm font-medium text-neutral">Te notificaremos cuando sea aprobada</p>
            <p class="text-xs text-secondary mt-1">
              Recibirás un correo cuando tu cuenta esté activa
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 center shrink-0">
            <CheckCircle class="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p class="text-sm font-medium text-neutral">¡Podrás acceder a SumajFlow!</p>
            <p class="text-xs text-secondary mt-1">
              Comenzarás a registrar tu producción y gestionar tus lotes
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Botones de acción -->
    <div class="flex flex-col sm:flex-row gap-3 justify-center pt-4">
      <button
        @click="handleFinish"
        class="btn px-8 py-3"
      >
        Ir a Inicio de Sesión
      </button>
    </div>

    <!-- Mensaje final -->
    <div class="text-center pt-4">
      <p class="text-sm text-secondary">
        ¿Tienes preguntas? <a href="mailto:soporte@sumajflow.com" class="text-primary hover:underline">Contacta a nuestro soporte</a>
      </p>
    </div>
  </div>
</template>
