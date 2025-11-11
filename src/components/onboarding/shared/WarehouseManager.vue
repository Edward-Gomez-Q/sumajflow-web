<script setup>
import { ref, computed } from 'vue'
import AddressForm from './AddressForm.vue'
import MapPicker from './MapPicker.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  availableMinerals: {
    type: Array,
    default: () => ['Ag', 'Pb', 'Zn', 'Sn']
  },
  showType: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])

const warehouses = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Estado del modal
const showModal = ref(false)
const isEditing = ref(false)
const editingIndex = ref(-1)
const showMapPicker = ref(false)

// Tipos de almacén
const warehouseTypes = [
  { value: 'concentrado', label: 'Concentrado' },
  { value: 'complejo', label: 'Complejo' },
  { value: 'abierto', label: 'Abierto' },
  { value: 'cerrado', label: 'Cerrado' }
]

// Formulario del almacén
const warehouseForm = ref({
  nombre: '',
  tipo: '',
  minerales: [],
  capacidad_maxima: null,
  area: null,
  departamento: 'Potosí',
  provincia: '',
  municipio: '',
  direccion: '',
  latitud: null,
  longitud: null
})

const openModal = (warehouse = null, index = -1) => {
  if (warehouse) {
    // Editar
    isEditing.value = true
    editingIndex.value = index
    warehouseForm.value = { ...warehouse }
  } else {
    // Nuevo
    isEditing.value = false
    editingIndex.value = -1
    warehouseForm.value = {
      nombre: '',
      tipo: '',
      minerales: [],
      capacidad_maxima: null,
      area: null,
      departamento: 'Potosí',
      provincia: '',
      municipio: '',
      direccion: '',
      latitud: null,
      longitud: null
    }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  showMapPicker.value = false
}

const saveWarehouse = () => {
  if (!warehouseForm.value.nombre.trim()) {
    alert('Por favor ingresa un nombre para el almacén')
    return
  }

  if (props.showType && !warehouseForm.value.tipo) {
    alert('Por favor selecciona un tipo de almacén')
    return
  }

  if (!warehouseForm.value.capacidad_maxima || warehouseForm.value.capacidad_maxima <= 0) {
    alert('Por favor ingresa una capacidad válida')
    return
  }

  const warehouseData = { ...warehouseForm.value }

  if (isEditing.value) {
    // Actualizar almacén existente
    const updated = [...warehouses.value]
    updated[editingIndex.value] = warehouseData
    warehouses.value = updated
  } else {
    // Agregar nuevo almacén
    warehouses.value = [...warehouses.value, warehouseData]
  }

  closeModal()
}

const deleteWarehouse = (index) => {
  if (confirm('¿Estás seguro de eliminar este almacén?')) {
    warehouses.value = warehouses.value.filter((_, i) => i !== index)
  }
}

const toggleMineral = (mineral) => {
  const index = warehouseForm.value.minerales.indexOf(mineral)
  if (index > -1) {
    warehouseForm.value.minerales.splice(index, 1)
  } else {
    warehouseForm.value.minerales.push(mineral)
  }
}

const updateAddress = (addressData) => {
  warehouseForm.value = {
    ...warehouseForm.value,
    ...addressData
  }
}

const openMapForWarehouse = () => {
  showMapPicker.value = true
}

const handleMapUpdate = (coordinates) => {
  warehouseForm.value.latitud = coordinates.latitud
  warehouseForm.value.longitud = coordinates.longitud
  showMapPicker.value = false
}

const isFormValid = computed(() => {
  return warehouseForm.value.nombre.trim() !== '' &&
         warehouseForm.value.capacidad_maxima > 0 &&
         (!props.showType || warehouseForm.value.tipo !== '')
})

// Iconos por tipo
const getTypeIcon = (type) => {
  const icons = {
    'concentrado': '📦',
    'complejo': '🏢',
    'abierto': '🌤️',
    'cerrado': '🏠'
  }
  return icons[type] || '📦'
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-neutral">Almacenes</h3>
      <button
        @click="openModal()"
        type="button"
        class="btn-outline"
      >
        ➕ Agregar Almacén
      </button>
    </div>

    <!-- Lista de almacenes -->
    <div v-if="warehouses.length > 0" class="space-y-3">
      <div
        v-for="(warehouse, index) in warehouses"
        :key="index"
        class="card p-4 hover:shadow-lg transition-shadow"
      >
        <div class="flex items-start gap-4">
          <!-- Icono -->
          <div class="w-12 h-12 rounded-lg bg-primary/10 center text-2xl flex-shrink-0">
            {{ getTypeIcon(warehouse.tipo) }}
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <h4 class="font-semibold text-neutral">{{ warehouse.nombre }}</h4>
              <div v-if="showType && warehouse.tipo" class="badge badge-neutral">
                {{ warehouseTypes.find(t => t.value === warehouse.tipo)?.label }}
              </div>
            </div>

            <div class="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <div>
                <span class="text-tertiary">Capacidad:</span>
                <span class="font-medium text-neutral ml-1">{{ warehouse.capacidad_maxima }} ton</span>
              </div>
              <div v-if="warehouse.area">
                <span class="text-tertiary">Área:</span>
                <span class="font-medium text-neutral ml-1">{{ warehouse.area }} m²</span>
              </div>
              <div v-if="warehouse.minerales?.length > 0" class="col-span-2">
                <span class="text-tertiary">Minerales:</span>
                <span class="font-medium text-neutral ml-1">{{ warehouse.minerales.join(', ') }}</span>
              </div>
            </div>

            <p v-if="warehouse.direccion" class="text-sm text-secondary mt-2">
              📍 {{ warehouse.direccion }}, {{ warehouse.municipio }}
            </p>
          </div>

          <!-- Acciones -->
          <div class="flex gap-2">
            <button
              @click="openModal(warehouse, index)"
              type="button"
              class="btn-ghost w-10 h-10 p-0"
              title="Editar"
            >
              ✏️
            </button>
            <button
              @click="deleteWarehouse(index)"
              type="button"
              class="btn-ghost w-10 h-10 p-0 text-error"
              title="Eliminar"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-else class="card p-8 text-center">
      <div class="text-5xl mb-3">📦</div>
      <h4 class="font-semibold text-neutral mb-2">No hay almacenes registrados</h4>
      <p class="text-sm text-secondary mb-4">
        Registra los almacenes donde guardas minerales o concentrados
      </p>
      <button
        @click="openModal()"
        type="button"
        class="btn"
      >
        ➕ Agregar Primer Almacén
      </button>
    </div>

    <!-- Modal de Almacén -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        @click.self="closeModal"
      >
        <div class="bg-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-border">
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h3 class="text-xl font-semibold text-neutral">
                {{ isEditing ? 'Editar Almacén' : 'Nuevo Almacén' }}
              </h3>
              <p class="text-sm text-secondary mt-1">
                Registra la información del almacén
              </p>
            </div>
            <button
              @click="closeModal"
              type="button"
              class="btn-ghost w-10 h-10 p-0"
            >
              ✕
            </button>
          </div>

          <!-- Contenido -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- Nombre y Tipo -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="input-group">
                <label class="input-label">
                  Nombre del Almacén <span class="text-error">*</span>
                </label>
                <input
                  v-model="warehouseForm.nombre"
                  type="text"
                  placeholder="Ej: Almacén Central"
                  class="w-full"
                  required
                />
              </div>

              <div v-if="showType" class="input-group">
                <label class="input-label">
                  Tipo de Almacén <span class="text-error">*</span>
                </label>
                <select
                  v-model="warehouseForm.tipo"
                  class="w-full"
                  required
                >
                  <option value="">Seleccionar</option>
                  <option v-for="type in warehouseTypes" :key="type.value" :value="type.value">
                    {{ type.label }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Minerales -->
            <div class="input-group">
              <label class="input-label">Minerales que Almacena</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="mineral in availableMinerals"
                  :key="mineral"
                  @click="toggleMineral(mineral)"
                  type="button"
                  class="px-4 py-2 rounded-lg border-2 transition-all"
                  :class="warehouseForm.minerales.includes(mineral)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface text-neutral border-border hover:border-primary'"
                >
                  {{ mineral }}
                </button>
              </div>
            </div>

            <!-- Capacidad y Área -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="input-group">
                <label class="input-label">
                  Capacidad Máxima (ton) <span class="text-error">*</span>
                </label>
                <input
                  v-model.number="warehouseForm.capacidad_maxima"
                  type="number"
                  step="0.01"
                  placeholder="100"
                  class="w-full"
                  required
                />
              </div>

              <div class="input-group">
                <label class="input-label">Área (m²)</label>
                <input
                  v-model.number="warehouseForm.area"
                  type="number"
                  step="0.01"
                  placeholder="500"
                  class="w-full"
                />
              </div>
            </div>

            <!-- Dirección -->
            <AddressForm
              :model-value="{
                departamento: warehouseForm.departamento,
                provincia: warehouseForm.provincia,
                municipio: warehouseForm.municipio,
                direccion: warehouseForm.direccion,
                latitud: warehouseForm.latitud,
                longitud: warehouseForm.longitud
              }"
              @update:model-value="updateAddress"
              @open-map="openMapForWarehouse"
              label="Ubicación del Almacén"
              :show-map="true"
            />
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between p-6 border-t border-border bg-hover">
            <button
              @click="closeModal"
              type="button"
              class="btn-secondary"
            >
              Cancelar
            </button>
            <button
              @click="saveWarehouse"
              :disabled="!isFormValid"
              type="button"
              class="btn"
            >
              {{ isEditing ? '💾 Guardar Cambios' : '➕ Crear Almacén' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Map Picker -->
      <MapPicker
        v-if="showMapPicker"
        :model-value="{ latitud: warehouseForm.latitud, longitud: warehouseForm.longitud }"
        :allow-multiple="false"
        title="Ubicación del Almacén"
        @update:model-value="handleMapUpdate"
        @close="showMapPicker = false"
      />
    </Teleport>
  </div>
</template>