<!-- src/views/cooperativa/SocioSolicitudes.vue -->
<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-neutral">Solicitudes de Socios</h1>
        <p class="text-secondary mt-2">
          Aquí puedes gestionar las solicitudes de los socios.
        </p>
      </div>

      <!-- Contenido de las solicitudes -->
      <div class="card">
        <h3 class="text-lg font-medium text-neutral mb-4">Solicitudes Pendientes</h3>
        <table class="w-full table-auto">
          <thead>
            <tr>
              <th class="px-4 py-2 text-left text-secondary">Nombre del Socio</th>
              <th class="px-4 py-2 text-left text-secondary">Fecha de Solicitud</th>
              <th class="px-4 py-2 text-left text-secondary">Estado</th>
              <th class="px-4 py-2 text-left text-secondary">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <!-- Ejemplo de fila de solicitud -->
            <tr>
              <td class="border-t px-4 py-2">Juan Pérez</td>
              <td class="border-t px-4 py-2">2024-06-15</td>
              <td class="border-t px-4 py-2">Pendiente</td>
              <td class="border-t px-4 py-2">
                <button class="btn btn-sm btn-primary mr-2">Aprobar</button>
                <button class="btn btn-sm btn-danger">Rechazar</button>
              </td>
            </tr>
            <!-- Más filas pueden ser añadidas aquí -->
          </tbody>
        </table>
      </div>
    </div>
  </AppLayout>
</template>