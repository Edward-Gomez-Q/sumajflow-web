<script setup>
import { CheckCircle2, Shield, Zap } from 'lucide-vue-next'

const props = defineProps({
  title: {
    type: String,
    default: 'Bienvenido a SumajFlow'
  },
  subtitle: {
    type: String,
    default: 'Plataforma integral de trazabilidad minera para Bolivia.'
  },
  description: {
    type: String,
    default: 'Conectando cooperativas, socios mineros, ingenios y comercializadoras en un flujo digital transparente.'
  },
  features: {
    type: Array,
    default: () => [
      { icon: 'CheckCircle2', text: 'Transparencia total en cada transacción' },
      { icon: 'Shield', text: 'Seguridad y cumplimiento normativo' },
      { icon: 'Zap', text: 'Eficiencia en procesos digitales' }
    ]
  },
  showFeatures: {
    type: Boolean,
    default: true
  },
  showFooter: {
    type: Boolean,
    default: true
  },
  footerLinks: {
    type: Array,
    default: () => [
      { text: 'Privacidad', href: '#' },
      { text: 'Legal', href: '#' },
      { text: 'Contacto', href: '#' }
    ]
  }
})

const iconComponents = {
  CheckCircle2,
  Shield,
  Zap
}
</script>

<template>
  <div class="auth-info-panel">
    <!-- Decorative elements -->
    <div class="absolute inset-0 opacity-[0.07] pointer-events-none">
      <div class="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
      <div class="absolute bottom-32 right-20 w-96 h-96 bg-cyan-300 rounded-full blur-3xl"></div>
      <div class="absolute top-1/2 left-1/4 w-56 h-56 bg-white rounded-full blur-3xl"></div>
    </div>

    <!-- Grid pattern overlay -->
    <div class="absolute inset-0 opacity-[0.03] pointer-events-none">
      <div 
        class="h-full w-full"
        style="background-image: linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px); background-size: 50px 50px;"
      ></div>
    </div>

    <!-- Content -->
    <div class="relative z-10 flex flex-col justify-between h-full">
      <!-- Logo -->
      <div class="flex items-center gap-3">
        <img 
          src="@/assets/logo/logo-text-light.png" 
          alt="SumajFlow Logo" 
          class="h-12 w-auto"
        />
      </div>

      <!-- Main content -->
      <div class="space-y-8 max-w-md">
        <div class="space-y-4">
          <h1 class="text-4xl xl:text-[2.75rem] font-bold leading-tight tracking-tight text-white">
            {{ title }}
          </h1>
          
          <p v-if="subtitle" class="text-lg text-white/90 leading-relaxed">
            {{ subtitle }}
          </p>
          
          <p v-if="description" class="text-[0.9375rem] text-white/75 leading-relaxed">
            {{ description }}
          </p>
        </div>

        <!-- Features -->
        <div v-if="showFeatures && features.length > 0" class="space-y-4 pt-2">
          <div 
            v-for="(feature, index) in features" 
            :key="index"
            class="flex items-start gap-3 group"
          >
            <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm center border border-white/20 group-hover:bg-white/15 transition-all duration-200">
              <component 
                :is="iconComponents[feature.icon]"
                class="w-5 h-5 text-white"
              />
            </div>
            <div class="flex-1 pt-1.5">
              <p class="text-[0.9375rem] text-white/90 leading-relaxed">{{ feature.text }}</p>
            </div>
          </div>
        </div>

        <!-- Slot para contenido personalizado -->
        <slot name="content"></slot>
      </div>

      <!-- Footer -->
      <div v-if="showFooter && footerLinks.length > 0" class="flex flex-wrap gap-6 text-sm text-white/70">
        <a 
          v-for="(link, index) in footerLinks" 
          :key="index"
          :href="link.href" 
          class="hover:text-white transition-colors"
        >
          {{ link.text }}
        </a>
      </div>

      <!-- Slot para footer personalizado -->
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<style scoped>
.center {
  @apply flex justify-center items-center;
}
</style>