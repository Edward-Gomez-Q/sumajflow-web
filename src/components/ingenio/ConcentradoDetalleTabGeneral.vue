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
  FileText
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
          <p class="text-base font-medium text-neutral">{{ concentrado.codigoConcentrado }}</p>
        </div>

        <!-- Peso Inicial -->
        <div class="space-y-1">
          <p class="text-sm text-secondary flex items-center gap-2">
            <Scale class="w-4 h-4" />
            Peso Inicial
          </p>
          <p class="text-base font-medium text-neutral">{{ formatPeso(concentrado.pesoInicial) }} kg</p>
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
      <h3 class="text-lg font-semibold text-neutral mb-4">Lotes Procesados ({{ concentrado.lotes?.length || 0 }})</h3>
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

    <!-- Minerales Detectados -->
    <div v-if="concentrado.minerales && concentrado.minerales.length > 0">
      <h3 class="text-lg font-semibold text-neutral mb-4">Minerales Detectados</h3>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="mineral in concentrado.minerales"
          :key="mineral.id"
          class="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20"
        >
          <p class="text-sm font-medium text-primary">
            {{ mineral.nombre }} ({{ mineral.nomenclatura }})
          </p>
        </div>
      </div>
    </div>

    <!-- Observaciones -->
    <div v-if="concentrado.observaciones">
      <h3 class="text-lg font-semibold text-neutral mb-4">Observaciones</h3>
      <div class="bg-hover rounded-xl p-4 border border-border">
        <div class="flex items-start gap-3">
          <FileText class="w-5 h-5 text-secondary shrink-0 mt-0.5" />
          <div class="flex-1">
            <p v-if="concentrado.observaciones.descripcion" class="text-sm text-neutral">
              {{ concentrado.observaciones.descripcion }}
            </p>
            <p v-if="concentrado.observaciones.observaciones" class="text-sm text-neutral mt-2">
              {{ concentrado.observaciones.observaciones }}
            </p>
            <p v-if="concentrado.observaciones.timestamp" class="text-xs text-secondary mt-2">
              Registrado: {{ formatDate(concentrado.observaciones.timestamp) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Información del Ingenio -->
    <div class="divider"></div>
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