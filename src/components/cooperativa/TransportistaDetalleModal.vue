<script setup>
import { ref, computed } from 'vue'
import { X, Truck, User, Phone, Mail, Calendar, Star } from 'lucide-vue-next'

const props = defineProps({
  transportista: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

// Formateo de datos
const formatearFecha = (fecha) => {
  // ...
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-border">
        
        <!-- Header -->
        <div class="flex justify-between items-start p-6 border-b border-border sticky top-0 bg-surface z-10">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-primary/10 center">
              <Truck class="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 class="text-xl font-semibold text-neutral">{{ transportista.nombreCompleto }}</h3>
              <p class="text-sm text-secondary">CI: {{ transportista.ci }}</p>
            </div>
          </div>
          <button @click="emit('close')" class="p-2 hover:bg-hover rounded-lg transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Contenido -->
        <div class="p-6 space-y-6">
          
          <!-- Información Personal -->
          <div>
            <h4 class="text-sm font-semibold text-secondary uppercase mb-3">Información Personal</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-tertiary">Nombre Completo</p>
                <p class="text-sm text-neutral font-medium">{{ transportista.nombreCompleto }}</p>
              </div>
              <!-- Más campos... -->
            </div>
          </div>

          <!-- Información del Vehículo -->
          <div>
            <h4 class="text-sm font-semibold text-secondary uppercase mb-3">Vehículo</h4>
            <!-- ... -->
          </div>

          <!-- Estadísticas -->
          <div>
            <h4 class="text-sm font-semibold text-secondary uppercase mb-3">Estadísticas</h4>
            <div class="grid grid-cols-3 gap-4">
              <!-- ... -->
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="flex gap-3 p-6 border-t border-border">
          <button @click="emit('close')" class="flex-1 btn-secondary">
            Cerrar
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>