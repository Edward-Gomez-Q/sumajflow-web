<script setup>
import { ref, computed } from 'vue'
import { Warehouse, Plus, Edit2, Trash2, X, MapPin, Package, Maximize2, CheckCircle } from 'lucide-vue-next'
import AddressForm from './AddressForm.vue'
import MapPicker from './MapPicker.vue'
import { usePublicDataStore } from '@/stores/publicDataStore'

const publicDataStore = usePublicDataStore()

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  availableMinerals: {
    type: Array,
    default: () => ['Ag', 'Pb', 'Zn']
  },
  showType: {
    type: Boolean,
    default: true
  }
})

//Obtener los minerales desde el store por el id que se pasa en availableMinerals
const minerals = computed(() => {
  return publicDataStore.minerales.filter(mineral => 
    props.availableMinerals.includes(mineral.id)
  )
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

// Tipos de almacén con colores
const warehouseTypes = [
  { 
    value: 'concentrado', 
    label: 'Concentrado',
    color: 'blue',
    icon: Package
  },
  { 
    value: 'complejo', 
    label: 'Complejo',
    color: 'purple',
    icon: Warehouse
  }
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

// Obtener configuración del tipo
const getTypeConfig = (type) => {
  return warehouseTypes.find(t => t.value === type) || warehouseTypes[0]
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-neutral">Almacenes</h3>
      <button
        @click="openModal()"
        type="button"
        class="btn-outline inline-flex items-center gap-2"
      >
        <Plus class="w-4 h-4" />
        <span>Agregar Almacén</span>
      </button>
    </div>

    <!-- Lista de almacenes -->
    <div v-if="warehouses.length > 0" class="space-y-3">
      <div
        v-for="(warehouse, index) in warehouses"
        :key="index"
        class="border border-border rounded-lg p-5 hover:border-primary/50 transition-all hover:shadow-md"
      >
        <div class="flex items-start gap-4">
          <!-- Icono sin fondo de color -->
          <div class="w-12 h-12 rounded-lg border-2 center shrink-0"
            :class="{
              '': warehouse.tipo === 'concentrado',
              '': warehouse.tipo === 'complejo',
              'border-primary': !warehouse.tipo
            }"
          >
            <component 
              :is="getTypeConfig(warehouse.tipo).icon"
              class="w-6 h-6"
              :class="{
                'text-blue-600 dark:text-blue-400': warehouse.tipo === 'concentrado',
                'text-purple-600 dark:text-purple-400': warehouse.tipo === 'complejo',
                'text-primary': !warehouse.tipo
              }"
            />
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-3 mb-4">
              <h4 class="font-semibold text-neutral text-lg">{{ warehouse.nombre }}</h4>
              <div 
                v-if="showType && warehouse.tipo" 
                class="px-3 py-1.5 rounded-full text-xs font-semibold border-2 whitespace-nowrap"
                :class="{
                  ' text-blue-700 ': warehouse.tipo === 'concentrado',
                  ' text-purple-700': warehouse.tipo === 'complejo'
                }"
              >
                {{ getTypeConfig(warehouse.tipo).label }}
              </div>
            </div>

            <div class="space-y-3">
              <!-- Capacidad y Área -->
              <div class="flex flex-wrap gap-4 text-sm">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/20 center shrink-0">
                    <Package class="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <span class="text-tertiary text-xs block leading-tight">Capacidad</span>
                    <span class="font-semibold text-neutral">{{ warehouse.capacidad_maxima }} ton</span>
                  </div>
                </div>
                
                <div v-if="warehouse.area" class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 center shrink-0">
                    <Maximize2 class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <span class="text-tertiary text-xs block leading-tight">Área</span>
                    <span class="font-semibold text-neutral">{{ warehouse.area }} m²</span>
                  </div>
                </div>
              </div>


              <!-- Ubicación -->
              <div v-if="warehouse.direccion" class="flex items-start gap-2 pt-1 text-sm text-secondary">
                <MapPin class="w-4 h-4 shrink-0 mt-0.5 text-tertiary" />
                <span class="leading-relaxed">{{ warehouse.direccion }}, {{ warehouse.municipio }}</span>
              </div>
            </div>
          </div>

          <!-- Acciones -->
          <div class="flex gap-2">
            <button
              @click="openModal(warehouse, index)"
              type="button"
              class="w-9 h-9 rounded-lg border border-border hover:border-primary hover:bg-primary/5 center transition-all"
              title="Editar"
            >
              <Edit2 class="w-4 h-4 text-secondary" />
            </button>
            <button
              @click="deleteWarehouse(index)"
              type="button"
              class="w-9 h-9 rounded-lg border border-border hover:border-error hover:bg-error/5 center transition-all"
              title="Eliminar"
            >
              <Trash2 class="w-4 h-4 text-error" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-else class="border border-dashed border-border rounded-lg p-8 text-center">
      <div class="w-16 h-16 rounded-full bg-primary/10 center mx-auto mb-4">
        <Warehouse class="w-8 h-8 text-primary" />
      </div>
      <h4 class="font-semibold text-neutral mb-2">No hay almacenes registrados</h4>
      <p class="text-sm text-secondary mb-4 max-w-md mx-auto">
        Registra los almacenes donde guardas minerales o concentrados
      </p>
      <button
        @click="openModal()"
        type="button"
        class="btn inline-flex items-center gap-2"
      >
        <Plus class="w-4 h-4" />
        <span>Agregar Primer Almacén</span>
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
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-primary/10 center">
                <Warehouse class="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 class="text-xl font-semibold text-neutral">
                  {{ isEditing ? 'Editar Almacén' : 'Nuevo Almacén' }}
                </h3>
                <p class="text-sm text-secondary mt-1">
                  Registra la información del almacén
                </p>
              </div>
            </div>
            <button
              @click="closeModal"
              type="button"
              class="w-10 h-10 rounded-lg hover:bg-hover center transition-colors"
            >
              <X class="w-5 h-5 text-secondary" />
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
                <p class="input-helper">
                  Nombre descriptivo del almacén
                </p>
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
                  <option value="">Seleccionar tipo</option>
                  <option v-for="type in warehouseTypes" :key="type.value" :value="type.value">
                    {{ type.label }}
                  </option>
                </select>
                <p class="input-helper">
                  Categoría según su uso
                </p>
              </div>
            </div>

            <!-- Minerales -->
            <div class="input-group">
              <label class="input-label">Minerales que Almacena</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="mineral in minerals"
                  :key="mineral.id"
                  @click="toggleMineral(mineral.id)"
                  type="button"
                  class="relative px-4 py-2 rounded-lg border-2 transition-all font-medium"
                  :class="warehouseForm.minerales.includes(mineral.id)
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface text-neutral border-border hover:border-primary/50'"
                >
                  <CheckCircle 
                    v-if="warehouseForm.minerales.includes(mineral.id)"
                    class="w-3 h-3 absolute top-1 right-1"
                  />
                  {{ mineral.nombre }}
                </button>
              </div>
              <p class="input-helper">
                Selecciona los tipos de mineral que se almacenan aquí
              </p>
            </div>

            <!-- Capacidad y Área -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="input-group">
                <label class="input-label">
                  Capacidad Máxima (ton) <span class="text-error">*</span>
                </label>
                <div class="relative">
                  <Package class="w-5 h-5 text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    v-model.number="warehouseForm.capacidad_maxima"
                    type="number"
                    step="0.01"
                    placeholder="100.00"
                    class="w-full pl-10"
                    required
                  />
                </div>
                <p class="input-helper">
                  Capacidad máxima en toneladas
                </p>
              </div>

              <div class="input-group">
                <label class="input-label">Área (m²)</label>
                <div class="relative">
                  <Maximize2 class="w-5 h-5 text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    v-model.number="warehouseForm.area"
                    type="number"
                    step="0.01"
                    placeholder="500.00"
                    class="w-full pl-10"
                  />
                </div>
                <p class="input-helper">
                  Área física del almacén
                </p>
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
          <div class="flex items-center justify-between gap-4 p-6 border-t border-border bg-hover">
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
              class="btn inline-flex items-center gap-2"
            >
              <CheckCircle class="w-4 h-4" />
              <span>{{ isEditing ? 'Guardar Cambios' : 'Crear Almacén' }}</span>
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
