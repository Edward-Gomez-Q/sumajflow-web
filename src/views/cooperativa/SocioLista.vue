<!-- src/views/cooperativa/SocioLista.vue -->
<script setup>
import AppLayout from '@/components/layout/AppLayout.vue'
</script>
<template>
  <AppLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-neutral">Lista de Socios</h1>
        <p class="text-secondary mt-2">
          Aquí puedes ver y gestionar todos los socios de la cooperativa.
        </p>
      </div>

      <!-- Tabla de socios -->
      <div class="card">
        <h3 class="text-lg font-medium text-neutral mb-4">Socios Registrados</h3>
        <table class="w-full table-auto">
          <thead>
            <tr>
              <th class="px-4 py-2 text-left text-secondary">Nombre</th>
              <th class="px-4 py-2 text-left text-secondary">ID de Socio</th>
              <th class="px-4 py-2 text-left text-secondary">Estado</th>
              <th class="px-4 py-2 text-left text-secondary">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <!-- Ejemplo de fila de socio -->
            <tr>
              <td class="border-t px-4 py-2">María Gómez</td>
              <td class="border-t px-4 py-2">S12345</td>
              <td class="border-t px-4 py-2">Activo</td>
              <td class="border-t px-4 py-2">
                <button class="btn btn-sm btn-primary mr-2">Ver Detalles</button>
                <button class="btn btn-sm btn-danger">Desactivar</button>
              </td>
            </tr>
            <!-- Más filas pueden ser añadidas aquí -->
          </tbody>
        </table>
      </div>
    </div>
  </AppLayout>
</template>