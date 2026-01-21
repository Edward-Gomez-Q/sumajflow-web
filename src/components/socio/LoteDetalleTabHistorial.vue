<!-- src/components/socio/LoteDetalleTabHistorial.vue -->
<script setup>
import { Clock, CheckCircle2, AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  lote: {
    type: Object,
    required: true
  }
})

const formatDateShort = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="space-y-3">
    <div v-if="lote.historialCambios && lote.historialCambios.length > 0">
      <div class="relative">
        <!-- Timeline line -->
        <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>

        <!-- Timeline items -->
        <div
          v-for="(cambio, index) in lote.historialCambios"
          :key="cambio.id"
          class="relative pl-14 pb-6"
          :class="{ 'pb-0': index === lote.historialCambios.length - 1 }"
        >
          <!-- Timeline dot -->
          <div 
            class="absolute left-4 w-5 h-5 rounded-full flex items-center justify-center"
            :class="cambio.accion.includes('aprobar') || cambio.accion.includes('crear')
              ? 'bg-green-500'
              : cambio.accion.includes('rechazar')
              ? 'bg-red-500'
              : 'bg-blue-500'"
          >
            <CheckCircle2 
              v-if="cambio.accion.includes('aprobar') || cambio.accion.includes('crear')" 
              class="w-3 h-3 text-white" 
            />
            <AlertCircle 
              v-else-if="cambio.accion.includes('rechazar')" 
              class="w-3 h-3 text-white" 
            />
            <Clock v-else class="w-3 h-3 text-white" />
          </div>

          <!-- Content -->
          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-start justify-between gap-4 mb-2">
              <h4 class="font-medium text-neutral flex-1">{{ cambio.accion }}</h4>
              <span class="text-xs text-tertiary whitespace-nowrap">
                {{ formatDateShort(cambio.fechaRegistro) }}
              </span>
            </div>
            
            <p v-if="cambio.descripcion" class="text-sm text-secondary mb-2">
              {{ cambio.descripcion }}
            </p>
            
            <div 
              v-if="cambio.estadoAnterior || cambio.estadoNuevo" 
              class="flex items-center gap-2 text-xs flex-wrap"
            >
              <span 
                v-if="cambio.estadoAnterior" 
                class="px-2 py-1 rounded bg-hover text-secondary"
              >
                {{ cambio.estadoAnterior }}
              </span>
              <span v-if="cambio.estadoAnterior && cambio.estadoNuevo">→</span>
              <span 
                v-if="cambio.estadoNuevo" 
                class="px-2 py-1 rounded bg-primary/10 text-primary font-medium"
              >
                {{ cambio.estadoNuevo }}
              </span>
            </div>
            
            <p v-if="cambio.observaciones" class="text-xs text-tertiary mt-2 italic">
              {{ cambio.observaciones }}
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Estado vacío -->
    <div v-else class="text-center py-12">
      <div class="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center mx-auto mb-4">
        <Clock class="w-8 h-8 text-white" />
      </div>
      <h3 class="text-lg font-semibold text-neutral mb-2">Sin historial</h3>
      <p class="text-sm text-secondary">
        No hay cambios registrados para este lote
      </p>
    </div>
  </div>
</template>