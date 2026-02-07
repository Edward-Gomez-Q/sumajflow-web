<!-- src/components/ingenio/ConcentradoDetalleTabGeneral.vue -->
<script setup>
import { computed } from 'vue'
import {
  PackageCheck,
  User,
  Building2,
  Calendar,
  Droplet,
  Scale,
  FileText,
  GitBranch,
  Layers
} from 'lucide-vue-next'

const props = defineProps({
  concentrado: {
    type: Object,
    required: true
  }
})

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-BO', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatPeso = (peso) => {
  if (!peso) return '0.00'
  return parseFloat(peso).toFixed(2)
}

// Computed para determinar si es lote múltiple
const esLoteMultiple = computed(() => {
  return props.concentrado.loteOrigenMultiple === true
})

// Computed para obtener concentrados hermanos
const concentradosHermanos = computed(() => {
  if (!props.concentrado.observaciones?.concentrados_hermanos) return []
  return props.concentrado.observaciones.concentrados_hermanos
})
</script>

<template>
  <div class="space-y-6">
    <!-- Información Principal -->
    <div>
      <h3 class="text-lg font-semibold text-neutral mb-4">Información del Concentrado</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Código -->
        <div class="space-y-1">
          <p class="text-sm text-secondary flex items-center gap-2">
            <PackageCheck class="w-4 h-4" />
            Código de Concentrado
          </p>
          <p class="text-base font-medium text-neutral">00{{ concentrado.id }}</p>
        </div>

        <!-- Peso Inicial -->
        <div class="space-y-1">
          <p class="text-sm text-secondary flex items-center gap-2">
            <Scale class="w-4 h-4" />
            Peso Inicial
          </p>
          <p class="text-base font-medium text-neutral">{{ formatPeso(concentrado.pesoInicial) }} Ton</p>
        </div>

        <!-- Peso Final -->
        <div class="space-y-1">
          <p class="text-sm text-secondary flex items-center gap-2">
            <Scale class="w-4 h-4" />
            Peso Final
          </p>
          <p class="text-base font-medium text-neutral">
            {{ concentrado.pesoFinal ? formatPeso(concentrado.pesoFinal) + ' kg' : 'Pendiente' }}
          </p>
        </div>

        <!-- Merma -->
        <div class="space-y-1">
          <p class="text-sm text-secondary flex items-center gap-2">
            <Scale class="w-4 h-4" />
            Merma
          </p>
          <p class="text-base font-medium text-neutral">
            {{ concentrado.merma ? formatPeso(concentrado.merma) + ' kg' : '-' }}
          </p>
        </div>

        <!-- Mineral Principal -->
        <div class="space-y-1">
          <p class="text-sm text-secondary flex items-center gap-2">
            <Droplet class="w-4 h-4" />
            Mineral Principal
          </p>
          <p class="text-base font-medium text-neutral">{{ concentrado.mineralPrincipal || '-' }}</p>
        </div>

        <!-- Minerales Secundarios -->
        <div class="space-y-1">
          <p class="text-sm text-secondary flex items-center gap-2">
            <Layers class="w-4 h-4" />
            Minerales Secundarios
          </p>
          <p class="text-base font-medium text-neutral">{{ concentrado.mineralesSecundarios || '-' }}</p>
        </div>

        <!-- Tipo de Origen -->
        <div class="space-y-1">
          <p class="text-sm text-secondary flex items-center gap-2">
            <GitBranch class="w-4 h-4" />
            Tipo de Origen
          </p>
          <div class="flex items-center gap-2">
            <p class="text-base font-medium text-neutral">
              {{ esLoteMultiple ? 'Lote Múltiple' : 'Lote Único' }}
            </p>
            <span 
              v-if="esLoteMultiple"
              class="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20"
            >
              Múltiple
            </span>
          </div>
        </div>

        <!-- Número de Sacos -->
        <div class="space-y-1">
          <p class="text-sm text-secondary flex items-center gap-2">
            <PackageCheck class="w-4 h-4" />
            Número de Sacos
          </p>
          <p class="text-base font-medium text-neutral">{{ concentrado.numeroSacos || 0 }}</p>
        </div>

        <!-- Fecha Inicio -->
        <div class="space-y-1">
          <p class="text-sm text-secondary flex items-center gap-2">
            <Calendar class="w-4 h-4" />
            Fecha de Inicio
          </p>
          <p class="text-base font-medium text-neutral">{{ formatDate(concentrado.fechaInicio) }}</p>
        </div>

        <!-- Fecha Fin -->
        <div class="space-y-1">
          <p class="text-sm text-secondary flex items-center gap-2">
            <Calendar class="w-4 h-4" />
            Fecha de Finalización
          </p>
          <p class="text-base font-medium text-neutral">
            {{ concentrado.fechaFin ? formatDate(concentrado.fechaFin) : 'En proceso' }}
          </p>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Información del Socio Propietario -->
    <div>
      <h3 class="text-lg font-semibold text-neutral mb-4">Socio Propietario</h3>
      <div class="bg-hover rounded-xl p-4 border border-border">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-full bg-primary center shrink-0">
            <User class="w-6 h-6 text-white" />
          </div>
          <div class="flex-1">
            <p class="font-semibold text-neutral">
              {{ concentrado.socioNombres }} {{ concentrado.socioApellidos }}
            </p>
            <p class="text-sm text-secondary mt-1">CI: {{ concentrado.socioCi }}</p>
            <p class="text-sm text-secondary">ID Socio: {{ concentrado.socioId }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Lotes Incluidos -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-neutral">
          Lotes Procesados ({{ concentrado.lotes?.length || 0 }})
        </h3>
        <span 
          v-if="esLoteMultiple && concentrado.observaciones?.cantidad_lotes"
          class="text-sm text-secondary"
        >
          {{ concentrado.observaciones.cantidad_lotes }} lote(s) en total
        </span>
      </div>
      <div class="space-y-3">
        <div
          v-for="lote in concentrado.lotes"
          :key="lote.id"
          class="bg-hover rounded-xl p-4 border border-border"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-start gap-3 flex-1">
              <div class="w-10 h-10 rounded-lg bg-blue-500 center shrink-0">
                <PackageCheck class="w-5 h-5 text-white" />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <p class="font-semibold text-neutral">Lote #{{ lote.id }}</p>
                  <span class="text-xs px-2 py-1 rounded-lg bg-indigo-500 text-white font-medium">
                    {{ lote.tipoMineral }}
                  </span>
                  <span 
                    v-if="lote.estado"
                    class="text-xs px-2 py-1 rounded-lg bg-green-500/10 text-green-600 border border-green-500/20 font-medium"
                  >
                    {{ lote.estado }}
                  </span>
                </div>
                <p class="text-sm text-secondary mt-1">{{ lote.minaNombre }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm text-secondary">Peso</p>
              <p class="font-semibold text-neutral">{{ formatPeso(lote.pesoTotalReal) }} kg</p>
            </div>
          </div>
        </div>

        <div v-if="!concentrado.lotes || concentrado.lotes.length === 0" class="text-center py-6">
          <p class="text-secondary text-sm">No hay lotes asociados</p>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Concentrados Hermanos (si es lote múltiple) -->
    <div v-if="esLoteMultiple && concentradosHermanos.length > 0" class="divider"></div>
    <div v-if="esLoteMultiple && concentradosHermanos.length > 0">
      <h3 class="text-lg font-semibold text-neutral mb-4">
        Concentrados Hermanos
      </h3>
      <div class="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <div class="flex items-start gap-3">
          <GitBranch class="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="text-sm font-medium text-neutral mb-2">
              Este concentrado fue creado junto con otros concentrados del mismo lote
            </p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="hermanoId in concentradosHermanos"
                :key="hermanoId"
                class="px-3 py-1 rounded-lg bg-blue-500 text-white text-sm font-medium"
              >
                #{{ hermanoId }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>


    <div class="divider"></div>

    <!-- Información del Ingenio -->
    <div>
      <h3 class="text-lg font-semibold text-neutral mb-4">Ingenio Procesador</h3>
      <div class="bg-hover rounded-xl p-4 border border-border">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-full bg-blue-500 center shrink-0">
            <Building2 class="w-6 h-6 text-white" />
          </div>
          <div class="flex-1">
            <p class="font-semibold text-neutral">{{ concentrado.ingenioNombre }}</p>
            <p class="text-sm text-secondary mt-1">ID Ingenio: {{ concentrado.ingenioId }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Metadatos -->
    <div class="bg-hover rounded-xl p-4 border border-border">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <p class="text-secondary">Creado el:</p>
          <p class="text-neutral font-medium">{{ formatDate(concentrado.createdAt) }}</p>
        </div>
        <div>
          <p class="text-secondary">Última actualización:</p>
          <p class="text-neutral font-medium">{{ formatDate(concentrado.updatedAt) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>