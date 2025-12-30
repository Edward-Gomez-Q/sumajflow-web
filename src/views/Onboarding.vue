<script setup>
import { computed, watch, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useOnboardingStore } from '@/stores/onboardingStore'
import LeftInfoView from '@/components/common/LeftInfoView.vue'
// Steps comunes
import Step1PersonalData from '@/components/onboarding/steps/Step1PersonalData.vue'
import Step2UserCredentials from '@/components/onboarding/steps/Step2UserCredentials.vue'
import Step3RoleSelection from '@/components/onboarding/steps/Step3RoleSelection.vue'

// Steps de Cooperativa
import Step4CoopBasicInfo from '@/components/onboarding/steps/cooperativa/Step4CoopBasicInfo.vue'
import Step5CoopSectors from '@/components/onboarding/steps/cooperativa/Step5CoopSectors.vue'
import Step6CoopBalance from '@/components/onboarding/steps/cooperativa/Step6CoopBalance.vue'

// Steps de Socio
import Step4SocioAssociation from '@/components/onboarding/steps/socio/Step4SocioAssociation.vue'
import Step5SocioPending from '@/components/onboarding/steps/socio/Step5SocioPending.vue'

// Steps de Ingenio
import Step4IngenioBasicInfo from '@/components/onboarding/steps/ingenio/Step4IngenioBasicInfo.vue'
import Step5IngenioPlant from '@/components/onboarding/steps/ingenio/Step5IngenioPlant.vue'
import Step6IngenioBalance from '@/components/onboarding/steps/ingenio/Step6IngenioBalance.vue'
import Step7IngenioWarehouses from '@/components/onboarding/steps/ingenio/Step7IngenioWarehouses.vue'

// Steps de Comercializadora
import Step4ComerBasicInfo from '@/components/onboarding/steps/comercializadora/Step4ComerBasicInfo.vue'
import Step5ComerWarehouses from '@/components/onboarding/steps/comercializadora/Step5ComerWarehouses.vue'
import Step6ComerBalance from '@/components/onboarding/steps/comercializadora/Step6ComerBalance.vue'

const router = useRouter()
const onboardingStore = useOnboardingStore()

const rightSidePanel = ref(null)
const currentComponent = computed(() => {
  const step = onboardingStore.currentStep
  const role = onboardingStore.selectedRole

  // Steps comunes (1-3)
  if (step === 1) return Step1PersonalData
  if (step === 2) return Step2UserCredentials
  if (step === 3) return Step3RoleSelection

  // Steps específicos por rol (4+)
  if (role === 'cooperativa') {
    if (step === 4) return Step4CoopBasicInfo
    if (step === 5) return Step5CoopSectors
    if (step === 6) return Step6CoopBalance
  }

  if (role === 'socio') {
    if (step === 4) return Step4SocioAssociation
    if (step === 5) return Step5SocioPending
  }

  if (role === 'ingenio') {
    if (step === 4) return Step4IngenioBasicInfo
    if (step === 5) return Step5IngenioPlant
    if (step === 6) return Step6IngenioBalance
    if (step === 7) return Step7IngenioWarehouses
  }

  if (role === 'comercializadora') {
    if (step === 4) return Step4ComerBasicInfo
    if (step === 5) return Step5ComerWarehouses
    if (step === 6) return Step6ComerBalance
  }

  return Step1PersonalData
})

const leftInfoContent = computed(() => {
  const step = onboardingStore.currentStep
  const role = onboardingStore.selectedRole

  if (step === 1) {
    return {
      title: 'Bienvenido a SumajFlow',
      subtitle: 'Comencemos con tu información personal',
      description: 'Tu información está segura con nosotros. Cumplimos con todas las normativas de protección de datos.',
      showFeatures: true,
      features: [
        { icon: 'Shield', text: 'Datos seguros y encriptados' },
        { icon: 'CheckCircle2', text: 'Verificación rápida' },
        { icon: 'Zap', text: 'Proceso simple en minutos' }
      ]
    }
  }

  if (step === 2) {
    return {
      title: 'Crea tu cuenta',
      subtitle: 'Configura tus credenciales de acceso',
      description: 'Elige una contraseña fuerte para proteger tu cuenta. Recuerda guardarla en un lugar seguro.',
      showFeatures: false
    }
  }

  if (step === 3) {
    return {
      title: 'Tu rol en la cadena minera',
      subtitle: 'Cada actor es importante',
      description: 'SumajFlow conecta a todos los actores de la cadena de trazabilidad minera en Bolivia.',
      showFeatures: true,
      features: [
        { icon: 'CheckCircle2', text: 'Socios mineros' },
        { icon: 'Shield', text: 'Cooperativas' },
        { icon: 'Zap', text: 'Ingenios y Comercializadoras' }
      ]
    }
  }

  if (role === 'cooperativa') {
    return {
      title: 'Registro de Cooperativa',
      subtitle: 'Información institucional',
      description: 'Configura tu cooperativa para comenzar a gestionar socios, sectores y operaciones.',
      showFeatures: false
    }
  }

  if (role === 'socio') {
    return {
      title: 'Registro de Socio',
      subtitle: 'Asociación a cooperativa',
      description: 'Únete a tu cooperativa y comienza a registrar tu producción minera.',
      showFeatures: false
    }
  }

  if (role === 'ingenio') {
    return {
      title: 'Registro de Ingenio',
      subtitle: 'Planta de procesamiento',
      description: 'Configura tu ingenio para gestionar el procesamiento de minerales.',
      showFeatures: false
    }
  }

  if (role === 'comercializadora') {
    return {
      title: 'Registro de Comercializadora',
      subtitle: 'Comercialización de minerales',
      description: 'Configura tu comercializadora para gestionar compra y venta de concentrados.',
      showFeatures: false
    }
  }

  return {
    title: 'SumajFlow',
    subtitle: 'Trazabilidad Minera',
    description: 'Sistema de trazabilidad para la minería boliviana'
  }
})

const progress = computed(() => {
  return Math.round((onboardingStore.currentStep / onboardingStore.totalSteps) * 100)
})

const isLastStep = computed(() => {
  return onboardingStore.currentStep === onboardingStore.totalSteps
})

const handleNext = async () => {
  if (isLastStep.value) {
    const result = await onboardingStore.submitOnboarding()
    
    if (result.success) {
      onboardingStore.resetOnboarding(false)
      alert('Registro completado con éxito. Por favor, inicia sesión.')
      router.push('/login')
    } else {
      alert('Error al registrar: ' + result.error)
    }
  } else {
    onboardingStore.nextStep()
  }
}

// Watch para detectar cuando se selecciona un rol
watch(() => onboardingStore.selectedRole, (newRole) => {
  if (newRole && onboardingStore.currentStep === 3) {
    setTimeout(() => {
      onboardingStore.nextStep()
    }, 500)
  }
})

// Watch para hacer scroll al cambiar de paso
watch(() => onboardingStore.currentStep, async () => {
  await nextTick()
  
  // Intentar con el elemento ref
  if (rightSidePanel.value) { 
    rightSidePanel.value.scrollTop = 0
  }
  
  // También intentar con window por si acaso
  window.scrollTo({ top: 0, behavior: 'smooth' })
})
</script>

<template>
  <div class="auth-container">
    <!-- Left Side - Info Panel (Fixed) -->
    <LeftInfoView
      v-bind="leftInfoContent"
      :show-footer="onboardingStore.currentStep <= 3"
      :footer-links="[
        { text: 'Privacidad', href: '#' },
        { text: 'Legal', href: '#' },
        { text: 'Contacto', href: '#' }
      ]"
    />

    <!-- Right Side - Form (Scrollable) -->
    <div class="auth-form-panel smooth-scroll" ref="rightSidePanel">
      <div class="auth-form-container">
        <!-- Mobile Logo -->
        <div class="lg:hidden flex items-center justify-center mb-10">
          <img 
            src="@/assets/logo/logo-light.png" 
            alt="SumajFlow" 
            class="h-12 w-auto dark:hidden"
          />
          <img 
            src="@/assets/logo/logo-dark.png" 
            alt="SumajFlow" 
            class="h-12 w-auto hidden dark:block"
          />
        </div>

        <!-- Progress Bar (Stripe style) -->
        <div class="mb-8">
          <div class="h-1 bg-border rounded-full overflow-hidden">
            <div 
              class="h-full bg-primary transition-all duration-500 ease-out"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
        </div>

        <!-- Form Content -->
        <component :is="currentComponent" />

        <!-- Continue Button -->
        <button
          @click="handleNext"
          :disabled="!onboardingStore.canGoNext"
          class="btn w-full py-3 mt-8 focus-ring"
        >
          {{ isLastStep ? 'Finalizar Registro' : 'Continuar' }}
        </button>

        <!-- DEBUG: show data of Onboarding store
        <div class="mt-8">
          <h4 class="font-medium text-neutral mb-3">Datos ingresados (DEBUG)</h4>
          <pre class="bg-surface border border-border rounded-lg p-4 text-xs overflow-x-auto">
            {{ JSON.stringify(onboardingStore.$state, null, 2) }}
          </pre>
        </div>-->

        <!-- Back Button -->
        <button
          v-if="onboardingStore.currentStep > 1"
          @click="onboardingStore.prevStep()"
          class="btn-outline w-full py-3 mt-4 focus-ring"
        >
          Volver
        </button>

        <!-- Login link -->
        <p class="text-center text-sm text-secondary mt-6">
          ¿Ya tienes cuenta? 
          <router-link 
            to="/login" 
            class="text-primary hover:text-accent font-medium transition-colors"
          >
            Inicia sesión
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>