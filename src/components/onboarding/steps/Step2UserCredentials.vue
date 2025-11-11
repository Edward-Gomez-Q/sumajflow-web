<script setup>
import { computed, ref } from 'vue'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Lock, Eye, EyeOff, Mail } from 'lucide-vue-next'

const onboardingStore = useOnboardingStore()

const userData = computed(() => onboardingStore.userData)

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const updateField = (field, value) => {
  onboardingStore.userData[field] = value
}

const passwordStrength = computed(() => {
  const password = userData.value.contrasena
  if (!password) return { level: 0, text: '', color: '' }

  let strength = 0
  if (password.length >= 6) strength++
  if (password.length >= 10) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[^a-zA-Z\d]/.test(password)) strength++

  const levels = [
    { level: 0, text: '', color: '' },
    { level: 1, text: 'Muy débil', color: 'bg-red-500' },
    { level: 2, text: 'Débil', color: 'bg-orange-500' },
    { level: 3, text: 'Media', color: 'bg-yellow-500' },
    { level: 4, text: 'Fuerte', color: 'bg-green-500' },
    { level: 5, text: 'Muy fuerte', color: 'bg-green-600' }
  ]

  return levels[strength]
})

const passwordsMatch = computed(() => {
  if (!userData.value.contrasena || !userData.value.confirmar_contrasena) return null
  return userData.value.contrasena === userData.value.confirmar_contrasena
})
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-lg bg-primary/10 center">
          <Lock class="w-5 h-5 text-primary" />
        </div>
        <h2 class="text-2xl font-semibold text-neutral">Credenciales de Acceso</h2>
      </div>
      
      <p class="text-sm text-secondary leading-relaxed">
        Configura tu correo electrónico y contraseña para acceder a tu cuenta. Asegúrate de usar una contraseña segura que solo tú conozcas.
      </p>
    </div>

    <!-- Form -->
    <div class="space-y-6">
      <!-- Correo Electrónico -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1">Correo electrónico</h3>
          <p class="text-sm text-secondary leading-relaxed">
            Este será tu nombre de usuario para iniciar sesión. Asegúrate de tener acceso a este correo.
          </p>
        </div>

        <div class="input-group">
          <label for="correo" class="input-label">
            Correo Electrónico <span class="text-error">*</span>
          </label>
          <div class="relative">
            <input
              id="correo"
              type="email"
              :value="userData.correo"
              @input="updateField('correo', $event.target.value)"
              placeholder="tu@ejemplo.com"
              class="w-full pl-10"
              required
              autocomplete="email"
            />
            <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary pointer-events-none" />
          </div>
          <p class="input-helper">
            Usarás este correo para iniciar sesión y recibir notificaciones importantes
          </p>
        </div>
      </div>

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Contraseña -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1">Contraseña</h3>
          <p class="text-sm text-secondary leading-relaxed">
            Crea una contraseña segura que contenga al menos 6 caracteres. Para mayor seguridad, usa una combinación de letras, números y símbolos.
          </p>
        </div>

        <div class="input-group">
          <label for="contrasena" class="input-label">
            Contraseña <span class="text-error">*</span>
          </label>
          <div class="password-input-wrapper">
            <input
              id="contrasena"
              :type="showPassword ? 'text' : 'password'"
              :value="userData.contrasena"
              @input="updateField('contrasena', $event.target.value)"
              placeholder="Mínimo 6 caracteres"
              class="w-full pr-11"
              required
              autocomplete="new-password"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="password-toggle-btn focus-ring rounded"
            >
              <Eye v-if="!showPassword" class="w-5 h-5" />
              <EyeOff v-else class="w-5 h-5" />
            </button>
          </div>

          <!-- Password Strength -->
          <div v-if="userData.contrasena" class="mt-2 space-y-2">
            <div class="flex gap-1">
              <div
                v-for="i in 5"
                :key="i"
                class="h-1.5 flex-1 rounded-full transition-all duration-300"
                :class="i <= passwordStrength.level ? passwordStrength.color : 'bg-slate-200 dark:bg-slate-700'"
              ></div>
            </div>
            <p v-if="passwordStrength.text" class="text-xs font-medium" :class="`text-${passwordStrength.color.split('-')[1]}-600 dark:text-${passwordStrength.color.split('-')[1]}-400`">
              Seguridad: {{ passwordStrength.text }}
            </p>
          </div>

          <p class="input-helper mt-2">
            Recomendación: Usa mayúsculas, minúsculas, números y símbolos para mayor seguridad
          </p>
        </div>

        <div class="input-group">
          <label for="confirmar_contrasena" class="input-label">
            Confirmar Contraseña <span class="text-error">*</span>
          </label>
          <div class="password-input-wrapper">
            <input
              id="confirmar_contrasena"
              :type="showConfirmPassword ? 'text' : 'password'"
              :value="userData.confirmar_contrasena"
              @input="updateField('confirmar_contrasena', $event.target.value)"
              placeholder="Repite tu contraseña"
              class="w-full pr-11"
              :class="{
                'border-red-500 dark:border-red-500': passwordsMatch === false,
                'border-green-500 dark:border-green-500': passwordsMatch === true
              }"
              required
              autocomplete="new-password"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="password-toggle-btn focus-ring rounded"
            >
              <Eye v-if="!showConfirmPassword" class="w-5 h-5" />
              <EyeOff v-else class="w-5 h-5" />
            </button>
          </div>

          <p v-if="passwordsMatch === false" class="input-error">
            Las contraseñas no coinciden
          </p>
          <p v-if="passwordsMatch === true" class="text-xs mt-1 text-green-600 dark:text-green-400 flex items-center gap-1">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            Las contraseñas coinciden
          </p>
        </div>
      </div>

      <!-- Divider -->
      <div class="divider"></div>

    </div>
  </div>
</template>

<style scoped>
.center {
  @apply flex justify-center items-center;
}
</style>