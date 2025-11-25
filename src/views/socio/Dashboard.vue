<!-- src/views/socio/Dashboard.vue -->
<script setup>
import { onMounted, ref } from 'vue'
import { useSessionStore } from '@/stores/sessionStore'
import { useSocioStore } from '@/stores/socio/socioStore'
import Step5SocioPending from '../../components/onboarding/steps/socio/Step5SocioPending.vue'
import AppLayout from '@/components/layout/AppLayout.vue'

const sessionStore = useSessionStore()
const socioStore = useSocioStore()
const cargando = ref(true)

onMounted(async () => {
  try {
    await socioStore.obtenerEstadoSocio()
  } catch (error) {
    console.error('Error al obtener estado del socio:', error)
  } finally {
    cargando.value = false
  }
})
</script>

<template>
  <div>
    <!-- Loader -->
    <div v-if="cargando" class="min-h-screen bg-background flex items-center justify-center">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p class="mt-4 text-secondary">Verificando estado...</p>
      </div>
    </div>

    <!-- Pendiente (sin sidebar) -->
    <Step5SocioPending v-else-if="socioStore.estaPendiente" />

    <!-- Aprobado (con sidebar) -->
    <AppLayout v-else-if="socioStore.estaAprobado">
      <div class="space-y-6">
        <div>
          <h1 class="text-3xl font-bold text-neutral">Mi Dashboard</h1>
          <p class="text-secondary mt-2">
            Bienvenido, {{ sessionStore.user?.nombres }} {{ sessionStore.user?.primerApellido }}
          </p>
        </div>

        <!-- Contenido del dashboard del socio -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="card">
            <h3 class="text-sm font-medium text-secondary mb-2">Mis Minas</h3>
            <p class="text-3xl font-bold text-neutral">3</p>
          </div>
          <div class="card">
            <h3 class="text-sm font-medium text-secondary mb-2">Lotes Activos</h3>
            <p class="text-3xl font-bold text-green-600">12</p>
          </div>
          <div class="card">
            <h3 class="text-sm font-medium text-secondary mb-2">Producción Total</h3>
            <p class="text-3xl font-bold text-primary">248 Ton</p>
          </div>
        </div>
      </div>
    </AppLayout>

    <!-- Estado desconocido -->
    <div v-else class="min-h-screen bg-background flex items-center justify-center">
      <div class="text-center">
        <p class="text-lg text-neutral mb-4">Estado no reconocido</p>
      </div>
    </div>
  </div>
</template>