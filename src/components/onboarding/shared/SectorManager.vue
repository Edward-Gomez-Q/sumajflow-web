<script setup>
import { ref, computed } from 'vue'
import { Plus, Edit2, Trash2, Mountain, X, Save, MapPin } from 'lucide-vue-next'
import CoordinatesList from './CoordinatesList.vue'
import MapPicker from './MapPicker.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const sectors = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Estado del modal
const showModal = ref(false)
const isEditing = ref(false)
const editingIndex = ref(-1)
const showMapPicker = ref(false)

// Formulario del sector
const sectorForm = ref({
  nombre: '',
  color: '#1E3A8A',
  coordenadas: []
})

// Colores predefinidos
const availableColors = [
  { name: 'Azul', value: '#1E3A8A' },
  { name: 'Verde', value: '#059669' },
  { name: 'Rojo', value: '#DC2626' },
  { name: 'Naranja', value: '#D97706' },
  { name: 'Morado', value: '#7C3AED' },
  { name: 'Rosa', value: '#DB2777' },
  { name: 'Cyan', value: '#0891B2' },
  { name: 'Lima', value: '#65A30D' }
]

const openModal = (sector = null, index = -1) => {
  if (sector) {
    // Editar
    isEditing.value = true
    editingIndex.value = index
    sectorForm.value = {
      nombre: sector.nombre,
      color: sector.color || '#1E3A8A',
      coordenadas: [...(sector.coordenadas || [])]
    }
  } else {
    // Nuevo
    isEditing.value = false
    editingIndex.value = -1
    sectorForm.value = {
      nombre: '',
      color: '#1E3A8A',
      coordenadas: []
    }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  showMapPicker.value = false
  sectorForm.value = {
    nombre: '',
    color: '#1E3A8A',
    coordenadas: []
  }
}

const saveSector = () => {
  if (!sectorForm.value.nombre.trim()) {
    alert('Por favor ingresa un nombre para el sector')
    return
  }

  if (sectorForm.value.coordenadas.length < 3) {
    alert('El sector debe tener al menos 3 coordenadas')
    return
  }

  const sectorData = { ...sectorForm.value }

  if (isEditing.value) {
    // Actualizar sector existente
    const updated = [...sectors.value]
    updated[editingIndex.value] = sectorData
    sectors.value = updated
  } else {
    // Agregar nuevo sector
    sectors.value = [...sectors.value, sectorData]
  }

  closeModal()
}

const deleteSector = (index) => {
  if (confirm('¿Estás seguro de eliminar este sector?')) {
    sectors.value = sectors.value.filter((_, i) => i !== index)
  }
}

const openMapForSector = () => {
  showMapPicker.value = true
}

const handleMapUpdate = (coordinates) => {
  sectorForm.value.coordenadas = coordinates
  showMapPicker.value = false
}

const isFormValid = computed(() => {
  return sectorForm.value.nombre.trim() !== '' &&
         sectorForm.value.coordenadas.length >= 3
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-semibold text-neutral mb-1">Sectores de Operación</h3>
        <p class="text-sm text-secondary">
          Define las zonas geográficas donde opera tu cooperativa
        </p>
      </div>
      <button
        @click="openModal()"
        type="button"
        class="btn-outline flex items-center gap-2"
      >
        <Plus class="w-4 h-4" />
        Agregar Sector
      </button>
    </div>

    <!-- Lista de sectores -->
    <div v-if="sectors.length > 0" class="space-y-3">
      <div
        v-for="(sector, index) in sectors"
        :key="index"
        class="bg-surface border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start gap-4">
          <!-- Color badge -->
          <div 
            class="w-12 h-12 rounded-lg flex-shrink-0 shadow-md border-2 border-white dark:border-slate-800"
            :style="{ backgroundColor: sector.color }"
          ></div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-neutral">{{ sector.nombre }}</h4>
            <div class="flex items-center gap-2 mt-1">
              <MapPin class="w-4 h-4 text-tertiary" />
              <p class="text-sm text-secondary">
                {{ sector.coordenadas?.length || 0 }} puntos geográficos
              </p>
            </div>
            
            <!-- Preview de coordenadas -->
            <div v-if="sector.coordenadas?.length > 0" class="mt-2 flex flex-wrap gap-1">
              <span
                v-for="(coord, idx) in sector.coordenadas.slice(0, 3)"
                :key="idx"
                class="text-xs bg-hover px-2 py-1 rounded font-mono"
              >
                {{ coord.orden }}: {{ coord.latitud?.toFixed(4) }}, {{ coord.longitud?.toFixed(4) }}
              </span>
              <span
                v-if="sector.coordenadas.length > 3"
                class="text-xs text-tertiary px-2 py-1"
              >
                +{{ sector.coordenadas.length - 3 }} más
              </span>
            </div>
          </div>

          <!-- Acciones -->
          <div class="flex gap-2">
            <button
              @click="openModal(sector, index)"
              type="button"
              class="w-9 h-9 rounded-lg hover:bg-primary/10 center text-primary transition-colors"
              title="Editar"
            >
              <Edit2 class="w-4 h-4" />
            </button>
            <button
              @click="deleteSector(index)"
              type="button"
              class="w-9 h-9 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 center text-error transition-colors"
              title="Eliminar"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-else class="bg-surface border border-border rounded-lg p-8 text-center">
      <div class="w-16 h-16 rounded-full bg-primary/10 center mx-auto mb-4">
        <Mountain class="w-8 h-8 text-primary" />
      </div>
      <h4 class="font-semibold text-neutral mb-2">No hay sectores registrados</h4>
      <p class="text-sm text-secondary mb-4">
        Los sectores son las zonas geográficas donde tu cooperativa opera
      </p>
      <button
        @click="openModal()"
        type="button"
        class="btn flex items-center gap-2 mx-auto"
      >
        <Plus class="w-4 h-4" />
        Agregar Primer Sector
      </button>
    </div>

    <!-- Modal de Sector -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        @click.self="closeModal"
      >
        <div class="bg-surface rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-border">
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-border">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-primary/10 center">
                <Mountain class="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 class="text-xl font-semibold text-neutral">
                  {{ isEditing ? 'Editar Sector' : 'Nuevo Sector' }}
                </h3>
                <p class="text-sm text-secondary mt-1">
                  Define el nombre, color y coordenadas del sector
                </p>
              </div>
            </div>
            <button
              @click="closeModal"
              type="button"
              class="w-10 h-10 rounded-lg hover:bg-hover center transition-colors"
            >
              <X class="w-5 h-5 text-tertiary" />
            </button>
          </div>

          <!-- Contenido -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- Nombre -->
            <div class="input-group">
              <label for="sector-nombre" class="input-label">
                Nombre del Sector <span class="text-error">*</span>
              </label>
              <input
                id="sector-nombre"
                v-model="sectorForm.nombre"
                type="text"
                placeholder="Ej: Sector Norte, Cerro Rico, Zona Central"
                class="w-full"
                required
              />
              <p class="input-helper">
                Nombre descriptivo que identifique esta zona de operación
              </p>
            </div>

            <!-- Color -->
            <div class="input-group">
              <label class="input-label">
                Color Identificador <span class="text-error">*</span>
              </label>
              <div class="grid grid-cols-4 sm:grid-cols-8 gap-3">
                <button
                  v-for="color in availableColors"
                  :key="color.value"
                  @click="sectorForm.color = color.value"
                  type="button"
                  class="w-12 h-12 rounded-lg transition-all hover:scale-110 focus:scale-110 border-2"
                  :class="{ 
                    'ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900 border-primary': sectorForm.color === color.value,
                    'border-slate-200 dark:border-slate-700': sectorForm.color !== color.value
                  }"
                  :style="{ backgroundColor: color.value }"
                  :title="color.name"
                ></button>
              </div>
              <p class="input-helper">
                Color para identificar este sector en mapas y reportes
              </p>
            </div>

            <!-- Coordenadas -->
            <div>
              <CoordinatesList
                v-model="sectorForm.coordenadas"
                @open-map="openMapForSector"
                :show-map="true"
              />
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between p-6 border-t border-border bg-hover">
            <button
              @click="closeModal"
              type="button"
              class="btn-secondary px-6"
            >
              Cancelar
            </button>
            <button
              @click="saveSector"
              :disabled="!isFormValid"
              type="button"
              class="btn px-6 flex items-center gap-2"
            >
              <Save v-if="isEditing" class="w-4 h-4" />
              <Plus v-else class="w-4 h-4" />
              {{ isEditing ? 'Guardar Cambios' : 'Crear Sector' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Map Picker -->
      <MapPicker
        v-if="showMapPicker"
        :coordinates="sectorForm.coordenadas"
        :allow-multiple="true"
        title="Definir Polígono del Sector"
        @update:coordinates="handleMapUpdate"
        @close="showMapPicker = false"
      />
    </Teleport>
  </div>
</template>