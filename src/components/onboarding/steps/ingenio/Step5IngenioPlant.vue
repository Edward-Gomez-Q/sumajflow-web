<script setup>
import { computed, ref } from 'vue'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Settings, Sparkles, TrendingUp, Clock, Zap, FileText, AlertTriangle, CheckCircle2, Plus, X, AlertCircle } from 'lucide-vue-next'
import AddressForm from '../../shared/AddressForm.vue'
import FileUpload from '../../../common/FileUpload.vue'

const onboardingStore = useOnboardingStore()

const ingenioData = computed({
  get: () => onboardingStore.ingenioData,
  set: (val) => {
    onboardingStore.ingenioData = val
  }
})

const planta = computed({
  get: () => ingenioData.value.planta,
  set: (val) => {
    ingenioData.value = {
      ...ingenioData.value,
      planta: val
    }
  }
})

const updatePlantField = (field, value) => {
  planta.value = {
    ...planta.value,
    [field]: value
  }
}

const updatePlantAddress = (addressData) => {
  planta.value = {
    ...planta.value,
    ...addressData
  }
}

// Minerales disponibles
const availableMinerals = [
  { id: 'Ag', name: 'Plata', icon: '⚪' },
  { id: 'Zn', name: 'Zinc', icon: '🔵' },
  { id: 'Pb', name: 'Plomo', icon: '⚫' },
  { id: 'Sn', name: 'Estaño', icon: '⚪' },
  { id: 'Au', name: 'Oro', icon: '🟡' },
  { id: 'Cu', name: 'Cobre', icon: '🟠' }
]

const toggleMineral = (mineralId) => {
  const index = planta.value.minerales.indexOf(mineralId)
  if (index > -1) {
    planta.value.minerales.splice(index, 1)
  } else {
    planta.value.minerales.push(mineralId)
  }
}

// Turnos de trabajo
const availableTurnos = [
  { id: 'mañana', name: 'Mañana', icon: '☀️', hours: '06:00 - 14:00' },
  { id: 'tarde', name: 'Tarde', icon: '🌤️', hours: '14:00 - 22:00' },
  { id: 'noche', name: 'Noche', icon: '🌙', hours: '22:00 - 06:00' }
]

const toggleTurno = (turnoId) => {
  const index = planta.value.turnos.indexOf(turnoId)
  if (index > -1) {
    planta.value.turnos.splice(index, 1)
  } else {
    planta.value.turnos.push(turnoId)
  }
}

// Procesos base disponibles
const procesosBase = [
  { id: 'chancado', name: 'Chancado', icon: '🔨', description: 'Trituración del mineral' },
  { id: 'molienda', name: 'Molienda', icon: '⚙️', description: 'Reducción a partículas finas' },
  { id: 'concentracion', name: 'Concentración', icon: '🎯', description: 'Separación por gravedad' },
  { id: 'flotacion', name: 'Flotación', icon: '💧', description: 'Separación por flotación' },
  { id: 'secado', name: 'Secado', icon: '🔥', description: 'Eliminación de humedad' },
  { id: 'lixiviacion', name: 'Lixiviación', icon: '🧪', description: 'Extracción química' },
  { id: 'fundicion', name: 'Fundición', icon: '🔥', description: 'Proceso térmico' },
  { id: 'refinacion', name: 'Refinación', icon: '✨', description: 'Purificación final' }
]

const showCustomProcessModal = ref(false)
const customProcessName = ref('')

const toggleProceso = (procesoId) => {
  const index = planta.value.procesos.findIndex(p => p.id === procesoId)
  if (index > -1) {
    planta.value.procesos.splice(index, 1)
  } else {
    const proceso = procesosBase.find(p => p.id === procesoId)
    planta.value.procesos.push({
      id: proceso.id,
      nombre: proceso.name
    })
  }
}

const addCustomProcess = () => {
  if (!customProcessName.value.trim()) return
  
  const customId = `custom_${Date.now()}`
  planta.value.procesos.push({
    id: customId,
    nombre: customProcessName.value.trim(),
    custom: true
  })
  
  customProcessName.value = ''
  showCustomProcessModal.value = false
}

const removeCustomProcess = (procesoId) => {
  const index = planta.value.procesos.findIndex(p => p.id === procesoId)
  if (index > -1) {
    planta.value.procesos.splice(index, 1)
  }
}

const isProcesoSelected = (procesoId) => {
  return planta.value.procesos.some(p => p.id === procesoId)
}

// Validaciones
const isFormValid = computed(() => {
  return (
    planta.value.minerales.length > 0 &&
    planta.value.cupo_minimo > 0 &&
    planta.value.capacidad_procesamiento > 0 &&
    planta.value.costo_procesamiento > 0 &&
    planta.value.turnos.length > 0 &&
    planta.value.procesos.length > 0 &&
    planta.value.numero_licencia?.trim() !== '' &&
    planta.value.licencia_ambiental_url !== '' &&
    planta.value.direccion?.trim() !== ''
  )
})
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-lg bg-primary/10 center">
          <Settings class="w-5 h-5 text-primary" />
        </div>
        <h2 class="text-2xl font-semibold text-neutral">Información de la Planta</h2>
      </div>
      
      <p class="text-sm text-secondary leading-relaxed">
        Configura los detalles operativos de tu planta procesadora
      </p>
    </div>

    <!-- Información contextual -->
    <div class="rounded-xl p-4 border border-blue-400/60 bg-blue-100/70 dark:border-blue-700 dark:bg-blue-900/40 shadow-sm backdrop-blur-[2px] transition-all duration-200">
      <div class="flex gap-3">
        <div class="flex-shrink-0 mt-0.5">
          <AlertCircle class="w-5 h-5 text-blue-700 dark:text-blue-300" />
        </div>
        <div class="flex-1">
          <p class="text-sm font-semibold text-blue-950 dark:text-blue-100 mb-1 tracking-tight">
            Información Importante
          </p>
          <p class="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
            Estos datos son fundamentales para que cooperativas y socios puedan evaluar si tu planta 
            cumple con sus necesidades de procesamiento. Asegúrate de proporcionar información precisa y actualizada.
          </p>
        </div>
      </div>
    </div>

    <!-- Contenido del formulario -->
    <div class="space-y-6">
      <!-- Sección: Minerales que Procesa -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1">
            Minerales que Procesa <span class="text-error">*</span>
          </h3>
          <p class="text-sm text-secondary leading-relaxed">
            Selecciona todos los minerales que tu planta puede procesar
          </p>
        </div>
        
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <button
            v-for="mineral in availableMinerals"
            :key="mineral.id"
            @click="toggleMineral(mineral.id)"
            type="button"
            class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:scale-105"
            :class="planta.minerales.includes(mineral.id)
              ? 'bg-primary text-white border-primary shadow-lg'
              : 'bg-surface text-neutral border-border hover:border-primary'"
          >
            <span class="text-3xl">{{ mineral.icon }}</span>
            <span class="text-sm font-medium">{{ mineral.name }}</span>
            <span class="text-xs opacity-80">{{ mineral.id }}</span>
          </button>
        </div>

        <div v-if="planta.minerales.length > 0" class="rounded-xl p-3 border border-green-400/60 bg-green-100/70 dark:border-green-700 dark:bg-green-900/40 shadow-sm backdrop-blur-[2px]">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-green-700 dark:text-green-300 flex-shrink-0" />
            <p class="text-sm text-green-900 dark:text-green-200">
              Seleccionados: {{ planta.minerales.join(', ') }}
            </p>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Sección: Capacidades Operativas -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1">Capacidades Operativas</h3>
          <p class="text-sm text-secondary leading-relaxed">
            Define las capacidades de procesamiento y costos de tu planta
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="input-group">
            <label for="cupo-minimo" class="input-label">
              Cupo Mínimo <span class="text-error">*</span>
            </label>
            <div class="relative">
              <input
                id="cupo-minimo"
                type="number"
                step="0.01"
                :value="planta.cupo_minimo"
                @input="updatePlantField('cupo_minimo', parseFloat($event.target.value) || 0)"
                placeholder="0.00"
                class="w-full pr-20"
                required
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-tertiary">
                toneladas
              </span>
            </div>
            <p class="input-helper">
              Mínimo requerido para procesar
            </p>
          </div>

          <div class="input-group">
            <label for="capacidad-procesamiento" class="input-label">
              Capacidad de Procesamiento <span class="text-error">*</span>
            </label>
            <div class="relative">
              <input
                id="capacidad-procesamiento"
                type="number"
                step="0.01"
                :value="planta.capacidad_procesamiento"
                @input="updatePlantField('capacidad_procesamiento', parseFloat($event.target.value) || 0)"
                placeholder="0.00"
                class="w-full pr-16"
                required
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-tertiary">
                ton/día
              </span>
            </div>
            <p class="input-helper">
              Capacidad diaria de la planta
            </p>
          </div>

          <div class="input-group">
            <label for="costo-procesamiento" class="input-label">
              Precio de Procesamiento <span class="text-error">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-tertiary">
                $us
              </span>
              <input
                id="costo-procesamiento"
                type="number"
                step="0.01"
                :value="planta.costo_procesamiento"
                @input="updatePlantField('costo_procesamiento', parseFloat($event.target.value) || 0)"
                placeholder="0.00"
                class="w-full pl-12 pr-16"
                required
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-tertiary">
                / ton
              </span>
            </div>
            <p class="input-helper">
              Costo por tonelada procesada
            </p>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Sección: Turnos de Trabajo -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1">
            Turnos de Trabajo <span class="text-error">*</span>
          </h3>
          <p class="text-sm text-secondary leading-relaxed">
            Selecciona los turnos en los que opera tu planta
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            v-for="turno in availableTurnos"
            :key="turno.id"
            @click="toggleTurno(turno.id)"
            type="button"
            class="flex items-center gap-3 p-4 rounded-lg border-2 transition-all"
            :class="planta.turnos.includes(turno.id)
              ? 'bg-primary text-white border-primary'
              : 'bg-surface text-neutral border-border hover:border-primary'"
          >
            <div class="text-3xl">{{ turno.icon }}</div>
            <div class="text-left flex-1">
              <p class="font-medium">{{ turno.name }}</p>
              <p class="text-xs opacity-80">{{ turno.hours }}</p>
            </div>
            <div 
              class="w-6 h-6 rounded-full border-2 center"
              :class="planta.turnos.includes(turno.id) ? 'border-white' : 'border-border'"
            >
              <CheckCircle2 v-if="planta.turnos.includes(turno.id)" class="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Sección: Procesos Disponibles -->
      <div class="space-y-4">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <h3 class="text-sm font-semibold text-neutral mb-1">
              Procesos Disponibles <span class="text-error">*</span>
            </h3>
            <p class="text-sm text-secondary leading-relaxed">
              Selecciona los procesos que tu planta ofrece
            </p>
          </div>
          <button
            @click="showCustomProcessModal = true"
            type="button"
            class="btn-outline text-sm flex items-center gap-2 flex-shrink-0"
          >
            <Plus class="w-4 h-4" />
            <span class="hidden sm:inline">Proceso Personalizado</span>
            <span class="sm:hidden">Añadir</span>
          </button>
        </div>

        <!-- Procesos Base -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            v-for="proceso in procesosBase"
            :key="proceso.id"
            @click="toggleProceso(proceso.id)"
            type="button"
            class="flex flex-col items-start gap-2 p-3 rounded-lg border-2 transition-all text-left"
            :class="isProcesoSelected(proceso.id)
              ? 'bg-primary/10 border-primary'
              : 'bg-surface border-border hover:border-primary'"
          >
            <div class="flex items-center justify-between w-full">
              <span class="text-2xl">{{ proceso.icon }}</span>
              <div 
                class="w-5 h-5 rounded-full border-2 center"
                :class="isProcesoSelected(proceso.id) ? 'bg-primary border-primary' : 'border-border'"
              >
                <CheckCircle2 v-if="isProcesoSelected(proceso.id)" class="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <p class="font-medium text-sm text-neutral">{{ proceso.name }}</p>
              <p class="text-xs text-tertiary">{{ proceso.description }}</p>
            </div>
          </button>
        </div>

        <!-- Procesos Personalizados -->
        <div v-if="planta.procesos.some(p => p.custom)" class="space-y-2">
          <p class="text-sm font-medium text-neutral">Procesos Personalizados</p>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="proceso in planta.procesos.filter(p => p.custom)"
              :key="proceso.id"
              class="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-3 py-2"
            >
              <span class="text-sm font-medium text-neutral">{{ proceso.nombre }}</span>
              <button
                @click="removeCustomProcess(proceso.id)"
                type="button"
                class="text-error hover:bg-error/10 rounded p-1"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="planta.procesos.length > 0" class="rounded-xl p-3 border border-green-400/60 bg-green-100/70 dark:border-green-700 dark:bg-green-900/40 shadow-sm backdrop-blur-[2px]">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-green-700 dark:text-green-300 flex-shrink-0" />
            <p class="text-sm text-green-900 dark:text-green-200">
              {{ planta.procesos.length }} {{ planta.procesos.length === 1 ? 'proceso seleccionado' : 'procesos seleccionados' }}
            </p>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Sección: Licencia Ambiental -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1">Licencia Ambiental</h3>
          <p class="text-sm text-secondary leading-relaxed">
            Documento legal requerido para operaciones de procesamiento minero
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="input-group md:col-span-2">
            <label for="numero-licencia" class="input-label">
              Número de Licencia Ambiental <span class="text-error">*</span>
            </label>
            <div class="relative">
              <input
                id="numero-licencia"
                type="text"
                :value="planta.numero_licencia"
                @input="updatePlantField('numero_licencia', $event.target.value)"
                placeholder="LEIA-001-2024"
                class="w-full pl-10"
                required
              />
              <FileText class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary pointer-events-none" />
            </div>
            <p class="input-helper">
              Código de identificación de tu licencia ambiental
            </p>
          </div>

          <div class="md:col-span-2">
            <FileUpload
              :model-value="planta.licencia_ambiental_url"
              @update:model-value="updatePlantField('licencia_ambiental_url', $event)"
              label="Documento de Licencia Ambiental (PDF)"
              accept=".pdf"
              :max-size="10"
              required
            />
          </div>
        </div>

        <div class="rounded-xl p-3 border border-yellow-400/60 bg-yellow-100/70 dark:border-yellow-700 dark:bg-yellow-900/40 shadow-sm backdrop-blur-[2px]">
          <div class="flex gap-2">
            <AlertTriangle class="w-5 h-5 text-yellow-700 dark:text-yellow-300 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-yellow-900 dark:text-yellow-200">
              La licencia ambiental es un requisito legal obligatorio para operar. 
              Asegúrate de que esté vigente y sea legible.
            </p>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Sección: Ubicación de la Planta -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1">Ubicación de la Planta</h3>
          <p class="text-sm text-secondary leading-relaxed">
            Dirección física donde se encuentra tu planta procesadora
          </p>
        </div>

        <AddressForm
          :model-value="{
            departamento: planta.departamento,
            provincia: planta.provincia,
            municipio: planta.municipio,
            direccion: planta.direccion,
            latitud: planta.latitud,
            longitud: planta.longitud
          }"
          @update:model-value="updatePlantAddress"
          label="Ubicación de la Planta"
          :show-map="true"
        />
      </div>
    </div>

    <!-- Estado de validación -->
    <div v-if="isFormValid" class="rounded-xl p-4 border border-green-400/60 bg-green-100/70 dark:border-green-700 dark:bg-green-900/40 shadow-sm backdrop-blur-[2px] transition-all duration-200">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-green-200/50 dark:bg-green-800/50 center flex-shrink-0">
          <CheckCircle2 class="w-5 h-5 text-green-700 dark:text-green-300" />
        </div>
        <div class="flex-1">
          <p class="text-sm font-semibold text-green-950 dark:text-green-100">Planta configurada correctamente</p>
          <div class="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-green-900 dark:text-green-200">
            <div>
              <span class="font-medium">Minerales:</span> {{ planta.minerales.length }}
            </div>
            <div>
              <span class="font-medium">Capacidad:</span> {{ planta.capacidad_procesamiento }} ton/día
            </div>
            <div>
              <span class="font-medium">Turnos:</span> {{ planta.turnos.length }}
            </div>
            <div>
              <span class="font-medium">Procesos:</span> {{ planta.procesos.length }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="planta.minerales.length === 0 || planta.procesos.length === 0" class="rounded-xl p-4 border border-blue-400/60 bg-blue-100/70 dark:border-blue-700 dark:bg-blue-900/40 shadow-sm backdrop-blur-[2px] transition-all duration-200">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-blue-200/50 dark:bg-blue-800/50 center">
          <AlertCircle class="w-5 h-5 text-blue-700 dark:text-blue-300" />
        </div>
        <div>
          <p class="text-sm font-semibold text-blue-950 dark:text-blue-100">Completa la configuración de la planta</p>
          <p class="text-sm text-blue-900 dark:text-blue-200 mt-1">
            Selecciona al menos un mineral y un proceso de beneficio
          </p>
        </div>
      </div>
    </div>

    <!-- Modal de Proceso Personalizado -->
    <Teleport to="body">
      <div
        v-if="showCustomProcessModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        @click.self="showCustomProcessModal = false"
      >
        <div class="bg-surface rounded-xl shadow-2xl w-full max-w-md border border-border">
          <div class="flex items-center justify-between p-6 border-b border-border">
            <h3 class="text-lg font-semibold text-neutral">Agregar Proceso Personalizado</h3>
            <button
              @click="showCustomProcessModal = false"
              type="button"
              class="btn-ghost w-10 h-10 p-0 center"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="p-6">
            <div class="input-group">
              <label for="custom-process-name" class="input-label">Nombre del Proceso</label>
              <input
                id="custom-process-name"
                v-model="customProcessName"
                type="text"
                placeholder="Ej: Cianuración, Amalgamación, etc."
                class="w-full"
                @keyup.enter="addCustomProcess"
              />
              <p class="input-helper">
                Ingresa un nombre descriptivo para el proceso
              </p>
            </div>
          </div>

          <div class="flex gap-3 p-6 border-t border-border">
            <button
              @click="showCustomProcessModal = false"
              type="button"
              class="btn-outline flex-1"
            >
              Cancelar
            </button>
            <button
              @click="addCustomProcess"
              :disabled="!customProcessName.trim()"
              type="button"
              class="btn flex-1"
            >
              Agregar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.center {
  @apply flex justify-center items-center;
}
</style>