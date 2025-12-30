<!-- src/views/comercializadora/Dashboard.vue -->
<script setup>
import { onMounted, ref } from 'vue'
import { useSessionStore } from '@/stores/sessionStore'
import AppLayout from '@/components/layout/AppLayout.vue'

const sessionStore = useSessionStore()
const cargando = ref(true)

onMounted(async () => {
  try {
    // Aquí puedes cargar datos específicos de la comercializadora
    // await comercializadoraStore.obtenerDatos()
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
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="card">
            <h3 class="text-sm font-medium text-secondary mb-2">Compras del Mes</h3>
            <p class="text-3xl font-bold text-neutral">450 Ton</p>
            <p class="text-xs text-green-600 mt-1">+12% vs mes anterior</p>
          </div>
          <div class="card">
            <h3 class="text-sm font-medium text-secondary mb-2">Ventas del Mes</h3>
            <p class="text-3xl font-bold text-green-600">380 Ton</p>
            <p class="text-xs text-green-600 mt-1">+8% vs mes anterior</p>
          </div>
          <div class="card">
            <h3 class="text-sm font-medium text-secondary mb-2">Inventario Actual</h3>
            <p class="text-3xl font-bold text-primary">1,240 Ton</p>
            <p class="text-xs text-secondary mt-1">En almacén</p>
          </div>
        </div>

        <!-- Métricas secundarias -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="card">
            <h3 class="text-sm font-medium text-secondary mb-2">Proveedores Activos</h3>
            <p class="text-2xl font-bold text-neutral">18</p>
          </div>
          <div class="card">
            <h3 class="text-sm font-medium text-secondary mb-2">Clientes Activos</h3>
            <p class="text-2xl font-bold text-neutral">24</p>
          </div>
        </div>
      </div>
    </AppLayout>
  </div>
</template>