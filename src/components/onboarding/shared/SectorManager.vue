<script setup>
import { ref, computed } from 'vue'
import { Plus, Edit2, Trash2, Mountain, X, Save, MapPin, AlertTriangle } from 'lucide-vue-next'
import PolygonMapPicker from './PolygonMapPicker.vue'

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

// Formulario del sector
const sectorForm = ref({
  nombre: '',
  color: '#1E3A8A',
  coordenadas: []
})

// Errores de validación
const validationErrors = ref({
  nombre: '',
  color: '',
  overlap: ''
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
    isEditing.value = true
    editingIndex.value = index
    sectorForm.value = {
      nombre: sector.nombre,
      color: sector.color || '#1E3A8A',
      coordenadas: [...(sector.coordenadas || [])]
    }
  } else {
    isEditing.value = false
    editingIndex.value = -1
    sectorForm.value = {
      nombre: '',
      color: '#1E3A8A',
      coordenadas: []
    }
  }
  
  validationErrors.value = {
    nombre: '',
    color: '',
    overlap: ''
  }
  
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  sectorForm.value = {
    nombre: '',
    color: '#1E3A8A',
    coordenadas: []
  }
  validationErrors.value = {
    nombre: '',
    color: '',
    overlap: ''
  }
}

// Validar nombre duplicado
const validateName = () => {
  const nombreTrimmed = sectorForm.value.nombre.trim()
  
  if (!nombreTrimmed) {
    validationErrors.value.nombre = 'El nombre es requerido'
    return false
  }
  
  const isDuplicate = sectors.value.some((sector, index) => {
    if (isEditing.value && index === editingIndex.value) return false
    return sector.nombre.trim().toLowerCase() === nombreTrimmed.toLowerCase()
  })
  
  if (isDuplicate) {
    validationErrors.value.nombre = 'Ya existe un sector con este nombre'
    return false
  }
  
  validationErrors.value.nombre = ''
  return true
}

// Validar color duplicado
const validateColor = () => {
  const isDuplicate = sectors.value.some((sector, index) => {
    if (isEditing.value && index === editingIndex.value) return false
    return sector.color === sectorForm.value.color
  })
  
  if (isDuplicate) {
    validationErrors.value.color = 'Este color ya está en uso por otro sector'
    return false
  }
  
  validationErrors.value.color = ''
  return true
}

// Verificar si dos polígonos se solapan
const checkPolygonOverlap = (poly1Coords, poly2Coords) => {
  if (poly1Coords.length < 3 || poly2Coords.length < 3) return false
  
  // Función auxiliar para verificar si un punto está dentro de un polígono
  const pointInPolygon = (point, polygon) => {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].longitud, yi = polygon[i].latitud
      const xj = polygon[j].longitud, yj = polygon[j].latitud
      
      const intersect = ((yi > point.latitud) !== (yj > point.latitud))
        && (point.longitud < (xj - xi) * (point.latitud - yi) / (yj - yi) + xi)
      if (intersect) inside = !inside
    }
    return inside
  }
  
  // Verificar si algún vértice de poly1 está dentro de poly2
  for (const point of poly1Coords) {
    if (pointInPolygon(point, poly2Coords)) return true
  }
  
  // Verificar si algún vértice de poly2 está dentro de poly1
  for (const point of poly2Coords) {
    if (pointInPolygon(point, poly1Coords)) return true
  }
  
  // Verificar intersección de bordes (simplificado)
  const linesIntersect = (p1, p2, p3, p4) => {
    const det = (p2.longitud - p1.longitud) * (p4.latitud - p3.latitud) - 
                (p4.longitud - p3.longitud) * (p2.latitud - p1.latitud)
    if (det === 0) return false
    
    const lambda = ((p4.latitud - p3.latitud) * (p4.longitud - p1.longitud) + 
                    (p3.longitud - p4.longitud) * (p4.latitud - p1.latitud)) / det
    const gamma = ((p1.latitud - p2.latitud) * (p4.longitud - p1.longitud) + 
                   (p2.longitud - p1.longitud) * (p4.latitud - p1.latitud)) / det
    
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1)
  }
  
  for (let i = 0; i < poly1Coords.length; i++) {
    const p1 = poly1Coords[i]
    const p2 = poly1Coords[(i + 1) % poly1Coords.length]
    
    for (let j = 0; j < poly2Coords.length; j++) {
      const p3 = poly2Coords[j]
      const p4 = poly2Coords[(j + 1) % poly2Coords.length]
      
      if (linesIntersect(p1, p2, p3, p4)) return true
    }
  }
  
  return false
}

// Validar solapamiento con otros sectores
const validateOverlap = () => {
  if (sectorForm.value.coordenadas.length < 3) {
    validationErrors.value.overlap = ''
    return true
  }
  
  for (let i = 0; i < sectors.value.length; i++) {
    if (isEditing.value && i === editingIndex.value) continue
    
    const otherSector = sectors.value[i]
    if (otherSector.coordenadas && otherSector.coordenadas.length >= 3) {
      if (checkPolygonOverlap(sectorForm.value.coordenadas, otherSector.coordenadas)) {
        validationErrors.value.overlap = `Este sector se solapa con "${otherSector.nombre}"`
        return false
      }
    }
  }
  
  validationErrors.value.overlap = ''
  return true
}

const saveSector = () => {
  // Validaciones
  const nameValid = validateName()
  const colorValid = validateColor()
  
  if (!nameValid || !colorValid) {
    return
  }

  if (sectorForm.value.coordenadas.length < 3) {
    alert('El sector debe tener al menos 3 coordenadas')
    return
  }
  
  const overlapValid = validateOverlap()
  if (!overlapValid) {
    // Mostrar el error pero permitir continuar si el usuario lo confirma
    const confirmed = confirm(
      `${validationErrors.value.overlap}\n\n¿Deseas guardar el sector de todas formas?`
    )
    if (!confirmed) return
  }

  const sectorData = { ...sectorForm.value }

  if (isEditing.value) {
    const updated = [...sectors.value]
    updated[editingIndex.value] = sectorData
    sectors.value = updated
  } else {
    sectors.value = [...sectors.value, sectorData]
  }

  closeModal()
}

const deleteSector = (index) => {
  const sector = sectors.value[index]
  if (confirm(`¿Estás seguro de eliminar el sector "${sector.nombre}"?`)) {
    sectors.value = sectors.value.filter((_, i) => i !== index)
  }
}

const handleCoordinatesUpdate = (coordinates) => {
  sectorForm.value.coordenadas = coordinates
  // Validar solapamiento en tiempo real si hay suficientes coordenadas
  if (coordinates.length >= 3) {
    validateOverlap()
  }
}

const isFormValid = computed(() => {
  return sectorForm.value.nombre.trim() !== '' &&
         sectorForm.value.coordenadas.length >= 3 &&
         !validationErrors.value.nombre &&
         !validationErrors.value.color
})

// Computed para sector activo en el mapa
const activeSectorForMap = computed(() => {
  if (!showModal.value) return null
  return {
    nombre: sectorForm.value.nombre || 'Nuevo Sector',
    color: sectorForm.value.color,
    coordenadas: sectorForm.value.coordenadas
  }
})

// Sectores a mostrar en el mapa (existentes + el que se está editando)
const sectorsForMap = computed(() => {
  if (!showModal.value) return []
  
  // Si estamos editando, excluir el sector siendo editado de la lista
  if (isEditing.value) {
    return sectors.value.filter((_, index) => index !== editingIndex.value)
  }
  
  // Si es nuevo sector, mostrar todos los existentes
  return [...sectors.value]
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-semibold text-neutral mb-1">Gestión de Sectores</h3>
        <p class="text-sm text-secondary">
          Agrega y configura los sectores mineros de tu cooperativa
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
            class="w-12 h-12 rounded-lg shrink-0 shadow-md border-2 border-white dark:border-slate-800"
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
                P{{ coord.orden }}: {{ coord.latitud?.toFixed(4) }}, {{ coord.longitud?.toFixed(4) }}
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
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        @click.self="closeModal"
      >
        <div class="bg-surface rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col border border-border relative z-[10000]">
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-border shrink-0">
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

          <!-- Contenido dividido -->
          <div class="flex-1 flex min-h-0">
            <!-- Panel izquierdo: Formulario -->
            <div class="w-96 border-r border-border overflow-y-auto shrink-0">
              <div class="p-6 space-y-6">
                <!-- Nombre -->
                <div class="input-group">
                  <label for="sector-nombre" class="input-label">
                    Nombre del Sector <span class="text-error">*</span>
                  </label>
                  <input
                    id="sector-nombre"
                    v-model="sectorForm.nombre"
                    @blur="validateName"
                    @input="validationErrors.nombre = ''"
                    type="text"
                    placeholder="Ej: Sector Norte, Cerro Rico"
                    class="w-full"
                    :class="{ 'border-error': validationErrors.nombre }"
                    required
                  />
                  <p v-if="validationErrors.nombre" class="text-error text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle class="w-3 h-3" />
                    {{ validationErrors.nombre }}
                  </p>
                  <p v-else class="input-helper">
                    Nombre único que identifique esta zona
                  </p>
                </div>

                <!-- Color -->
                <div class="input-group">
                  <label class="input-label">
                    Color Identificador <span class="text-error">*</span>
                  </label>
                  <div class="grid grid-cols-4 gap-3">
                    <button
                      v-for="color in availableColors"
                      :key="color.value"
                      @click="sectorForm.color = color.value; validateColor()"
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
                  <p v-if="validationErrors.color" class="text-error text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle class="w-3 h-3" />
                    {{ validationErrors.color }}
                  </p>
                  <p v-else class="input-helper">
                    Color único para este sector
                  </p>
                </div>

                <!-- Alerta de solapamiento -->
                <div v-if="validationErrors.overlap" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-700 rounded-lg p-3">
                  <div class="flex items-start gap-2">
                    <AlertTriangle class="w-4 h-4 text-yellow-700 dark:text-yellow-400 shrink-0 mt-0.5" />
                    <div class="text-xs text-yellow-900 dark:text-yellow-200">
                      <p class="font-semibold mb-1">Advertencia de solapamiento</p>
                      <p>{{ validationErrors.overlap }}</p>
                    </div>
                  </div>
                </div>

                <!-- Lista de puntos (reemplaza las instrucciones) -->
                <div v-if="sectorForm.coordenadas.length > 0" class="space-y-3">
                  <div class="flex items-center justify-between">
                    <h4 class="text-sm font-semibold text-neutral">Puntos del Polígono</h4>
                    <span class="text-xs text-secondary">{{ sectorForm.coordenadas.length }} punto{{ sectorForm.coordenadas.length !== 1 ? 's' : '' }}</span>
                  </div>
                  
                  <div class="space-y-2 max-h-96 overflow-y-auto">
                    <div
                      v-for="(coord, index) in sectorForm.coordenadas"
                      :key="index"
                      class="bg-hover border border-border rounded-lg p-3 hover:shadow-sm transition-shadow"
                    >
                      <div class="flex items-start gap-3">
                        <div 
                          class="w-7 h-7 rounded-full center font-bold text-white text-xs shrink-0"
                          :style="{ backgroundColor: sectorForm.color }"
                        >
                          {{ coord.orden }}
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="font-mono text-xs space-y-1">
                            <div class="flex items-center gap-2">
                              <span class="text-tertiary w-8">Lat:</span>
                              <span class="text-neutral">{{ coord.latitud.toFixed(6) }}</span>
                            </div>
                            <div class="flex items-center gap-2">
                              <span class="text-tertiary w-8">Lng:</span>
                              <span class="text-neutral">{{ coord.longitud.toFixed(6) }}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          @click="() => {
                            sectorForm.coordenadas.splice(index, 1)
                            sectorForm.coordenadas.forEach((c, i) => { c.orden = i + 1 })
                            handleCoordinatesUpdate(sectorForm.coordenadas)
                          }"
                          class="w-7 h-7 rounded hover:bg-red-50 dark:hover:bg-red-900/20 center text-error transition-colors shrink-0"
                          title="Eliminar punto"
                        >
                          <Trash2 class="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Consejos -->
                  <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p class="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                      💡 <strong>Consejo:</strong> Arrastra los marcadores en el mapa para ajustar su posición.
                    </p>
                  </div>
                </div>

                <!-- Mensaje cuando no hay puntos -->
                <div v-else class="bg-surface border border-border rounded-lg p-4 text-center">
                  <p class="text-sm text-secondary">
                    Haz clic en el mapa para comenzar a agregar puntos
                  </p>
                </div>
              </div>
            </div>

            <!-- Panel derecho: Mapa -->
            <div class="flex-1 min-w-0">
              <PolygonMapPicker
                :sectors="sectorsForMap"
                :edit-mode="true"
                :active-sector="activeSectorForMap"
                :show-search="true"
                @update:coordinates="handleCoordinatesUpdate"
              />
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between p-4 border-t border-border bg-hover shrink-0">
            <div class="text-sm">
              <span v-if="sectorForm.coordenadas.length >= 3" class="text-success">
                ✓ {{ sectorForm.coordenadas.length }} puntos definidos
              </span>
              <span v-else-if="sectorForm.coordenadas.length > 0" class="text-warning">
                ⚠️ Faltan {{ 3 - sectorForm.coordenadas.length }} puntos
              </span>
              <span v-else class="text-tertiary">
                Sin puntos agregados
              </span>
            </div>
            <div class="flex gap-3">
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
      </div>
    </Teleport>
  </div>
</template>