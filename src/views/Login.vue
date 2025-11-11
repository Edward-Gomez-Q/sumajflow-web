<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import LeftInfoView from '@/components/common/LeftInfoView.vue'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)

const isFormValid = computed(() => {
  return email.value.trim() !== '' && password.value.trim() !== ''
})

const handleSubmit = async () => {
  if (!isFormValid.value) return

  authStore.resetError()
  
  const result = await authStore.login(email.value, password.value)
  
  if (result.success) {
    router.push('/dashboard')
  }
}
</script>

<template>
  <div class="auth-container">
    <!-- Left Side - Info Panel (Fixed) -->
    <LeftInfoView 
      title="Bienvenido a SumajFlow"
      subtitle="Plataforma integral de trazabilidad minera para Bolivia."
      description="Conectando cooperativas, socios mineros, ingenios y comercializadoras en un flujo digital transparente."
      :show-features="true"
      :features="[
        { icon: 'CheckCircle2', text: 'Transparencia total en cada transacción' },
        { icon: 'Shield', text: 'Seguridad y cumplimiento normativo' },
        { icon: 'Zap', text: 'Eficiencia en procesos digitales' }
      ]"
      :show-footer="true"
      :footer-links="[
        { text: 'Privacidad', href: '#' },
        { text: 'Legal', href: '#' },
        { text: 'Contacto', href: '#' }
      ]"
    />

    <!-- Right Side - Login Form (Scrollable) -->
    <div class="auth-form-panel smooth-scroll">
      <div class="auth-form-container">
        <!-- Mobile Logo -->
        <div class="lg:hidden flex items-center justify-center mb-10">
          <img 
            src="@/assets/logo/logo-light.png" 
            alt="SumajFlow" 
            class="h-12 w-auto"
          />
        </div>

        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-2">
            <h1 class="text-3xl font-bold text-neutral">Iniciar Sesión</h1>
          </div>
          <p class="text-secondary text-[0.9375rem]">
            Ingresa tus credenciales para acceder
          </p>
        </div>

        <!-- Error message -->
        <div 
          v-if="authStore.error" 
          class="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm"
        >
          {{ authStore.error }}
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Email -->
          <div class="input-group">
            <label for="email" class="input-label">
              Correo electrónico
            </label>
            <input 
              id="email"
              v-model="email"
              type="email" 
              placeholder="tu@correo.com"
              class="w-full"
              required
              :disabled="authStore.isLoading"
              autocomplete="email"
            />
          </div>

          <!-- Password -->
          <div class="input-group">
            <label for="password" class="input-label">
              Contraseña
            </label>
            <div class="password-input-wrapper">
              <input 
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'" 
                placeholder="••••••••"
                class="w-full pr-11"
                required
                :disabled="authStore.isLoading"
                autocomplete="current-password"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="password-toggle-btn focus-ring rounded"
                :disabled="authStore.isLoading"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              >
                <Eye v-if="!showPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Remember me -->
          <div class="flex items-center">
            <label class="flex items-center gap-2 cursor-pointer group">
              <input 
                v-model="rememberMe"
                type="checkbox" 
                class="checkbox-custom"
                :disabled="authStore.isLoading"
              >
              <span class="text-sm text-secondary group-hover:text-neutral transition-colors">
                Recordarme
              </span>
            </label>
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            class="btn w-full py-3 focus-ring"
            :disabled="authStore.isLoading || !isFormValid"
          >
            <span v-if="!authStore.isLoading">Iniciar Sesión</span>
            <span v-else class="flex items-center justify-center gap-2">
              <Loader2 class="w-5 h-5 animate-spin" />
              Iniciando sesión...
            </span>
          </button>
        </form>

        <!-- Sign up link -->
        <p class="text-center text-[0.9375rem] text-secondary mt-8">
          ¿No tienes cuenta? 
          <router-link 
            to="/onboarding" 
            class="text-primary hover:text-accent font-medium transition-colors focus-ring rounded px-1"
          >
            Regístrate gratis
          </router-link>
        </p>

        <!-- Footer note -->
        <p class="text-xs text-center text-tertiary mt-8 leading-relaxed">
          Al iniciar sesión, aceptas nuestros 
          <a href="#" class="text-primary hover:underline focus-ring rounded">Términos de Servicio</a> y 
          <a href="#" class="text-primary hover:underline focus-ring rounded">Política de Privacidad</a>
        </p>
      </div>
    </div>
  </div>
</template>