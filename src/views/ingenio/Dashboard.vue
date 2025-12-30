<!-- src/views/ingenio/Dashboard.vue -->
<script setup>
import { onMounted, ref } from 'vue'
import { useSessionStore } from '@/stores/sessionStore'
import AppLayout from '@/components/layout/AppLayout.vue'

const sessionStore = useSessionStore()
const cargando = ref(true)

onMounted(async () => {
  try {
    // Aquí puedes cargar datos específicos del ingenio
    // await ingenioStore.obtenerDatos()
  } catch (error) {
    console.error('Error al cargar datos:', error)
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
        <p class="mt-4 text-secondary">Cargando datos...</p>
      </div>
    </div>

    <!-- Dashboard con sidebar -->
    <AppLayout v-else>
      <div class="space-y-6">
        <div>
          <h1 class="text-3xl font-bold text-neutral">Mi Dashboard</h1>
          <p class="text-secondary mt-2">
            Bienvenido, {{ sessionStore.user?.nombres }} {{ sessionStore.user?.primerApellido }}
          </p>
        </div>

        <!-- Métricas principales -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="card">
            <h3 class="text-sm font-medium text-secondary mb-2">Recepciones Hoy</h3>
            <p class="text-3xl font-bold text-neutral">8</p>
            <p class="text-xs text-secondary mt-1">Lotes recibidos</p>
          </div>
          <div class="card">
            <h3 class="text-sm font-medium text-secondary mb-2">En Procesamiento</h3>
            <p class="text-3xl font-bold text-yellow-600">12</p>
            <p class="text-xs text-secondary mt-1">Lotes activos</p>
          </div>
          <div class="card">
            <h3 class="text-sm font-medium text-secondary mb-2">Procesados Hoy</h3>
            <p class="text-3xl font-bold text-green-600">15</p>
            <p class="text-xs text-green-600 mt-1">Completados</p>
          </div>
          <div class="card">
            <h3 class="text-sm font-medium text-secondary mb-2">Producción del Mes</h3>
            <p class="text-3xl font-bold text-primary">342 Ton</p>
            <p class="text-xs text-green-600 mt-1">+5% vs mes anterior</p>
          </div>
        </div>

        <!-- Métricas de inventario -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="card">
            <h3 class="text-sm font-medium text-secondary mb-2">Inventario Materia Prima</h3>
            <p class="text-2xl font-bold text-neutral">850 Ton</p>
            <p class="text-xs text-secondary mt-1">Material sin procesar</p>
          </div>
          <div class="card">
            <h3 class="text-sm font-medium text-secondary mb-2">Producto Terminado</h3>
            <p class="text-2xl font-bold text-green-600">620 Ton</p>
            <p class="text-xs text-secondary mt-1">Listo para venta</p>
          </div>
        </div>
      </div>
    </AppLayout>
  </div>
</template>