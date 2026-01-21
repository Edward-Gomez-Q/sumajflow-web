<!-- src/components/socio/LoteDetalleTabGeneral.vue -->
<script setup>
import {
  MapPin,
  Building2,
  Truck,
  Weight,
  Calendar,
  FileText,
  User
} from 'lucide-vue-next'

const props = defineProps({
  lote: {
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
</script>

<template>
  <div class="space-y-6">
    <!-- Grid de información -->
    <div class="grid md:grid-cols-2 gap-4">
      <!-- Mina de Origen -->
      <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center shrink-0">
            <MapPin class="w-5 h-5 text-white" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-medium text-secondary mb-2">Mina de Origen</h3>
            <p class="font-semibold text-neutral truncate">{{ lote.minaNombre }}</p>
            <p class="text-sm text-secondary mt-1">Sector: {{ lote.sectorNombre }}</p>
            <div v-if="lote.minaLatitud && lote.minaLongitud" class="text-xs text-tertiary mt-1 truncate">
              {{ lote.minaLatitud }}, {{ lote.minaLongitud }}
            </div>
          </div>
        </div>
      </div>

      <!-- Destino -->
      <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
            <Building2 class="w-5 h-5 text-white" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-medium text-secondary mb-2">
              {{ lote.destinoTipo === 'ingenio' ? 'Ingenio Minero' : 'Comercializadora' }}
            </h3>
            <p class="font-semibold text-neutral truncate">{{ lote.destinoNombre }}</p>
            <p class="text-sm text-secondary mt-1">NIT: {{ lote.destinoNIT }}</p>
            <p class="text-xs text-tertiary mt-1 truncate">
              {{ lote.destinoMunicipio }}, {{ lote.destinoDepartamento }}
            </p>
            <p v-if="lote.destinoTelefono" class="text-xs text-tertiary mt-1">
              Tel: {{ lote.destinoTelefono }}
            </p>
          </div>
        </div>
      </div>

      <!-- Operación y Mineral -->
      <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <h3 class="text-sm font-medium text-secondary mb-3">Tipo de Operación</h3>
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-sm text-secondary">Operación:</span>
            <span class="text-sm font-medium text-neutral">
              {{ lote.tipoOperacion === 'procesamiento_planta' ? 'Procesamiento' : 'Venta Directa' }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-secondary">Tipo Mineral:</span>
            <span class="text-sm font-medium text-neutral capitalize">{{ lote.tipoMineral }}</span>
          </div>
        </div>
      </div>

      <!-- Camiones -->
      <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center shrink-0">
            <Truck class="w-5 h-5 text-white" />
          </div>
          <div class="flex-1">
            <h3 class="text-sm font-medium text-secondary mb-2">Camiones</h3>
            <p class="text-2xl font-bold text-neutral">
              {{ lote.camioneAsignados || 0 }} / {{ lote.camionlesSolicitados }}
            </p>
            <p class="text-xs text-secondary mt-1">
              {{ lote.camioneAsignados === lote.camionlesSolicitados 
                ? 'Todos asignados' 
                : lote.camioneAsignados > 0
                ? 'Asignación parcial'
                : 'Pendiente de asignación' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Minerales -->
    <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
      <h3 class="text-sm font-medium text-secondary mb-3 flex items-center gap-2">
        <FileText class="w-4 h-4" />
        Minerales a Transportar
      </h3>
      <div class="flex gap-2 flex-wrap">
        <div
          v-for="mineral in lote.minerales"
          :key="mineral.id"
          class="px-4 py-2 rounded-lg bg-blue-500 text-white"
        >
          <div class="text-xs opacity-70">{{ mineral.nomenclatura }}</div>
          <div class="font-medium">{{ mineral.nombre }}</div>
        </div>
      </div>
    </div>

    <!-- Pesos -->
    <div class="grid md:grid-cols-2 gap-4">
      <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <Weight class="w-4 h-4 text-secondary" />
          <h3 class="text-sm font-medium text-secondary">Peso Estimado</h3>
        </div>
        <p class="text-2xl font-bold text-neutral">
          {{ lote.pesoTotalEstimado || '-' }}
          <span v-if="lote.pesoTotalEstimado" class="text-sm font-normal text-secondary ml-1">Ton</span>
        </p>
      </div>
      <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <Weight class="w-4 h-4 text-secondary" />
          <h3 class="text-sm font-medium text-secondary">Peso Real</h3>
        </div>
        <p class="text-2xl font-bold text-neutral">
          {{ lote.pesoTotalReal || '-' }}
          <span v-if="lote.pesoTotalReal" class="text-sm font-normal text-secondary ml-1">Ton</span>
        </p>
      </div>
    </div>

    <!-- Fechas Importantes -->
    <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
      <h3 class="text-sm font-medium text-secondary mb-3 flex items-center gap-2">
        <Calendar class="w-4 h-4" />
        Fechas Importantes
      </h3>
      <div class="grid sm:grid-cols-2 gap-3 text-sm">
        <div>
          <p class="text-xs text-tertiary">Creación</p>
          <p class="font-medium text-neutral mt-0.5">{{ formatDate(lote.fechaCreacion) }}</p>
        </div>
        <div v-if="lote.fechaAprobacionCooperativa">
          <p class="text-xs text-tertiary">Aprobación Cooperativa</p>
          <p class="font-medium text-neutral mt-0.5">{{ formatDate(lote.fechaAprobacionCooperativa) }}</p>
        </div>
        <div v-if="lote.fechaAprobacionDestino">
          <p class="text-xs text-tertiary">Aprobación Destino</p>
          <p class="font-medium text-neutral mt-0.5">{{ formatDate(lote.fechaAprobacionDestino) }}</p>
        </div>
        <div v-if="lote.fechaInicioTransporte">
          <p class="text-xs text-tertiary">Inicio Transporte</p>
          <p class="font-medium text-neutral mt-0.5">{{ formatDate(lote.fechaInicioTransporte) }}</p>
        </div>
        <div v-if="lote.fechaFinTransporte">
          <p class="text-xs text-tertiary">Fin Transporte</p>
          <p class="font-medium text-neutral mt-0.5">{{ formatDate(lote.fechaFinTransporte) }}</p>
        </div>
      </div>
    </div>

    <!-- Observaciones -->
    <div v-if="lote.observaciones" class="bg-base rounded-xl p-4 border border-border shadow-sm">
      <h3 class="text-sm font-medium text-secondary mb-2">Observaciones</h3>
      <p class="text-sm text-neutral whitespace-pre-wrap">{{ lote.observaciones }}</p>
    </div>

    <!-- Socio Propietario -->
    <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
          <User class="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 class="text-sm font-medium text-secondary">Socio Propietario</h3>
          <p class="font-medium text-neutral">{{ lote.socioNombres }} {{ lote.socioApellidos }}</p>
        </div>
      </div>
    </div>
  </div>
</template>