<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-6">
    <div class="text-center space-y-6 max-w-md">
      <div class="text-8xl md:text-9xl font-bold text-primary/20">
        404
      </div>
      
      <div class="space-y-2">
        <h1 class="text-2xl md:text-3xl font-bold text-neutral">
          Página no encontrada
        </h1>
        <p class="text-secondary">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <button @click="goBack" class="btn-outline">
          ← Volver atrás
        </button>
        <button @click="goHome" class="btn">
          Ir al inicio
        </button>
      </div>
    </div>
  </div>
</template>