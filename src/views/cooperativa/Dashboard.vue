<!-- src/views/cooperativa/Dashboard.vue -->
<script setup>
import { useSessionStore } from '@/stores/sessionStore'
import AppLayout from '@/components/layout/AppLayout.vue'

const sessionStore = useSessionStore()
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-neutral">Dashboard</h1>
        <p class="text-secondary mt-2">
          Bienvenido, {{ sessionStore.user?.nombres }} {{ sessionStore.user?.primerApellido }}
        </p>
      </div>

      <!-- Aquí irá el contenido del dashboard -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="card">
          <h3 class="text-sm font-medium text-secondary mb-2">Total Socios</h3>
          <p class="text-3xl font-bold text-neutral">186</p>
        </div>
        <div class="card">
          <h3 class="text-sm font-medium text-secondary mb-2">Socios Activos</h3>
          <p class="text-3xl font-bold text-green-600">142</p>
        </div>
        <div class="card">
          <h3 class="text-sm font-medium text-secondary mb-2">Solicitudes</h3>
          <p class="text-3xl font-bold text-purple-600">4</p>
        </div>
        <div class="card">
          <h3 class="text-sm font-medium text-secondary mb-2">Inactivos</h3>
          <p class="text-3xl font-bold text-red-600">40</p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>