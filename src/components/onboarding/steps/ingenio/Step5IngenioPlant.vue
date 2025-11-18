<script setup>
import { computed } from 'vue'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Settings, Sparkles, TrendingUp, Factory, DollarSign, Package, Zap, FileText, AlertTriangle, CheckCircle, AlertCircle, MapPin } from 'lucide-vue-next'
import AddressForm from '../../shared/AddressForm.vue'
import FileUpload from '../../../common/FileUpload.vue'
import { usePublicDataStore } from '@/stores/publicDataStore'

const onboardingStore = useOnboardingStore()
const publicDataStore = usePublicDataStore()

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

// Minerales disponibles desde el backend
const availableMinerals = computed(() => publicDataStore.minerales)

const toggleMineral = (mineralId) => {
  const index = planta.value.minerales.indexOf(mineralId)
  if (index > -1) {
    planta.value.minerales.splice(index, 1)
  } else {
    planta.value.minerales.push(mineralId)
  }
}

// Procesos disponibles desde el backend
const procesosBase = computed(() => publicDataStore.procesos)

const toggleProceso = (procesoId) => {
  const index = planta.value.procesos.findIndex(p => p.id === procesoId)
  if (index > -1) {
    planta.value.procesos.splice(index, 1)
  } else {
    const proceso = procesosBase.value.find(p => p.id === procesoId)
    planta.value.procesos.push({
      id: proceso.id,
      nombre: proceso.nombre
    })
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
          <Factory class="w-5 h-5 text-primary" />
        </div>
        <h2 class="text-2xl font-semibold text-neutral">Información de la Planta</h2>
      </div>
      
      <p class="text-sm text-secondary leading-relaxed">
        Configura los detalles operativos de tu planta procesadora. Esta información permitirá a cooperativas y socios evaluar tus servicios.
      </p>
    </div>

<!-- Información contextual -->
<div
  class="bg-blue-100/70 dark:bg-blue-900/40 border border-blue-400/60 dark:border-blue-700 rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200"
>
  <div class="flex items-start gap-3">
    <div class="w-8 h-8 rounded-full bg-blue-200/50 dark:bg-blue-800/50 center shrink-0">
      <AlertCircle class="w-4 h-4 text-blue-700 dark:text-blue-300" />
    </div>
    <div class="text-sm">
      <p class="font-medium text-neutral mb-1">Información importante</p>
      <p class="text-secondary leading-relaxed">
        Estos datos son fundamentales para que cooperativas y socios puedan evaluar si tu planta cumple con sus
        necesidades de procesamiento. Asegúrate de proporcionar información precisa y actualizada.
      </p>
    </div>
  </div>
</div>


    <!-- Contenido del formulario -->
    <div class="space-y-6">
      
      <!-- Sección: Minerales que Procesa -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1 flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-primary" />
            Minerales que Procesa
            <span class="text-error">*</span>
          </h3>
          <p class="text-sm text-secondary leading-relaxed">
            Selecciona todos los minerales que tu planta puede procesar
          </p>
        </div>
        
        <div class="grid grid-cols-3 gap-4 max-w-2xl">
          <button
            v-for="mineral in availableMinerals"
            :key="mineral.id"
            @click="toggleMineral(mineral.id)"
            type="button"
            class="relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:shadow-md"
            :class="planta.minerales.includes(mineral.id)
              ? 'bg-primary border-primary shadow-lg'
              : 'bg-surface border-border hover:border-primary/50'"
          >
            <!-- Checkmark -->
            <div 
              v-if="planta.minerales.includes(mineral.id)"
              class="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/20 center"
            >
              <CheckCircle class="w-3 h-3 text-white" />
            </div>
            
            <!-- Símbolo químico -->
            <span 
              class="text-3xl font-bold"
              :class="planta.minerales.includes(mineral.id) ? 'text-white' : 'text-primary'"
            >
              {{ mineral.nomenclatura }}
            </span>
            
            <!-- Nombre del mineral -->
            <span 
              class="text-xs font-semibold text-center"
              :class="planta.minerales.includes(mineral.id) ? 'text-white' : 'text-neutral'"
            >
              {{ mineral.nombre }}
            </span>
          </button>
        </div>

<!-- Contador de minerales -->
<div
  v-if="planta.minerales.length > 0"
  class="inline-flex items-center gap-3 px-4 py-2 rounded-lg border border-green-400/60 bg-green-100/70 dark:border-green-700 dark:bg-green-900/40 shadow-sm backdrop-blur-[2px] transition-all duration-200"
>
  <div class="w-6 h-6 rounded-full bg-green-200/50 dark:bg-green-800/50 center shrink-0">
    <CheckCircle class="w-3.5 h-3.5 text-green-700 dark:text-green-300" />
  </div>
  <span class="text-sm font-medium text-neutral">
    {{ planta.minerales.length }}
    <span class="text-secondary">
      {{ planta.minerales.length === 1 ? 'mineral seleccionado' : 'minerales seleccionados' }}
    </span>
  </span>
</div>

      </div>

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Sección: Capacidades Operativas -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1 flex items-center gap-2">
            <TrendingUp class="w-4 h-4 text-primary" />
            Capacidades Operativas
          </h3>
          <p class="text-sm text-secondary leading-relaxed">
            Define las capacidades de procesamiento y costos de tu planta
          </p>
        </div>

        <div class="space-y-4 max-w-3xl">
          <!-- Primera fila: Cupo Mínimo y Capacidad -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Cupo Mínimo -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg center">
                  <Package class="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <label for="cupo-minimo" class="text-sm font-medium text-neutral block">
                    Cupo Mínimo (ton)<span class="text-error">*</span>
                  </label>
                  <p class="text-xs text-tertiary">Cantidad mínima requerida</p>
                </div>
              </div>
              
              <div class="relative">
                <input
                  id="cupo-minimo"
                  type="number"
                  step="0.01"
                  :value="planta.cupo_minimo"
                  @input="updatePlantField('cupo_minimo', parseFloat($event.target.value) || 0)"
                  placeholder="0.00"
                  class="w-full text-lg font-semibold text-center py-3 px-4 rounded-lg"
                  required
                />
              </div>
              <p class="text-xs text-secondary">
                Mínimo de material para procesar
              </p>
            </div>

            <!-- Capacidad de Procesamiento -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg center">
                  <Zap class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <label for="capacidad-procesamiento" class="text-sm font-medium text-neutral block">
                    Capacidad Diaria (ton/día)<span class="text-error">*</span>
                  </label>
                  <p class="text-xs text-tertiary">Procesamiento por día</p>
                </div>
              </div>
              
              <div class="relative">
                <input
                  id="capacidad-procesamiento"
                  type="number"
                  step="0.01"
                  :value="planta.capacidad_procesamiento"
                  @input="updatePlantField('capacidad_procesamiento', parseFloat($event.target.value) || 0)"
                  placeholder="0.00"
                  class="w-full text-lg font-semibold text-center py-3 px-4 rounded-lg"
                  required
                />
              </div>
              <p class="text-xs text-secondary">
                Máximo que puedes procesar diariamente
              </p>
            </div>
          </div>

          <!-- Segunda fila: Precio solo -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Precio de Procesamiento -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lgcenter">
                  <DollarSign class="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <label for="costo-procesamiento" class="text-sm font-medium text-neutral block">
                    Precio por Tonelada ($us)<span class="text-error">*</span>
                  </label>
                  <p class="text-xs text-tertiary">Costo de procesamiento</p>
                </div>
              </div>
              
              <div class="relative">
                <input
                  id="costo-procesamiento"
                  type="number"
                  step="0.01"
                  :value="planta.costo_procesamiento"
                  @input="updatePlantField('costo_procesamiento', parseFloat($event.target.value) || 0)"
                  placeholder="0.00"
                  class="w-full text-lg font-semibold text-center py-3 px-10 rounded-lg"
                  required
                />
              </div>
              <p class="text-xs text-secondary">
                Tarifa por tonelada procesada
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Sección: Procesos Disponibles -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1 flex items-center gap-2">
            <Settings class="w-4 h-4 text-primary" />
            Procesos Disponibles
            <span class="text-error">*</span>
          </h3>
          <p class="text-sm text-secondary leading-relaxed">
            Selecciona los procesos de beneficio que tu planta ofrece
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
          <button
            v-for="proceso in procesosBase"
            :key="proceso.id"
            @click="toggleProceso(proceso.id)"
            type="button"
            class="relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all hover:shadow-md"
            :class="isProcesoSelected(proceso.id)
              ? 'bg-primary/10 border-primary'
              : 'bg-surface border-border hover:border-primary/50'"
          >
            <!-- Checkbox -->
            <div 
              class="w-5 h-5 rounded border-2 center shrink-0 transition-all"
              :class="isProcesoSelected(proceso.id) 
                ? 'bg-primary border-primary' 
                : 'bg-white dark:bg-slate-800 border-border'"
            >
              <CheckCircle 
                v-if="isProcesoSelected(proceso.id)" 
                class="w-3 h-3 text-white" 
              />
            </div>

            <p class="font-medium text-sm text-neutral text-left flex-1">
              {{ proceso.nombre }}
            </p>
          </button>
        </div>

<!-- Contador de procesos -->
<div
  v-if="planta.procesos.length > 0"
  class="inline-flex items-center gap-3 px-4 py-2 rounded-lg border border-green-400/60 bg-green-100/70 dark:border-green-700 dark:bg-green-900/40 shadow-sm backdrop-blur-[2px] transition-all duration-200"
>
  <div class="w-6 h-6 rounded-full bg-green-200/50 dark:bg-green-800/50 center shrink-0">
    <CheckCircle class="w-3.5 h-3.5 text-green-700 dark:text-green-300" />
  </div>
  <span class="text-sm font-medium text-neutral">
    {{ planta.procesos.length }}
    <span class="text-secondary">
      {{ planta.procesos.length === 1 ? 'proceso seleccionado' : 'procesos seleccionados' }}
    </span>
  </span>
</div>

      </div>

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Sección: Licencia Ambiental -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1 flex items-center gap-2">
            <FileText class="w-4 h-4 text-primary" />
            Licencia Ambiental
          </h3>
          <p class="text-sm text-secondary leading-relaxed">
            Documento legal requerido para operaciones de procesamiento minero
          </p>
        </div>

        <div class="space-y-4">
          <div class="input-group">
            <label for="numero-licencia" class="input-label">
              Número de Licencia Ambiental <span class="text-error">*</span>
            </label>
            <input
              id="numero-licencia"
              type="text"
              :value="planta.numero_licencia"
              @input="updatePlantField('numero_licencia', $event.target.value)"
              placeholder="LEIA-001-2024"
              class="w-full"
              required
            />
            <p class="input-helper">
              Código de identificación de tu licencia ambiental
            </p>
          </div>

          <FileUpload
            :model-value="planta.licencia_ambiental_url"
            @update:model-value="updatePlantField('licencia_ambiental_url', $event)"
            label="Documento de Licencia Ambiental"
            helper-text="Archivo PDF de la licencia ambiental vigente"
            accept=".pdf"
            :max-size="10"
            :required="true"
          />
        </div>

      </div>

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Sección: Ubicación de la Planta -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1 flex items-center gap-2">
            <MapPin class="w-4 h-4 text-primary" />
            Ubicación de la Planta
          </h3>
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
          :show-map="true"
        />
      </div>
    </div>

<!-- ✅ Planta configurada correctamente -->
<div
  v-if="isFormValid"
  class="bg-green-100/70 dark:bg-green-900/40 border border-green-400/60 dark:border-green-700 rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200"
>
  <div class="flex items-start gap-3">
    <div class="w-8 h-8 rounded-full bg-green-200/50 dark:bg-green-800/50 center shrink-0">
      <CheckCircle class="w-4 h-4 text-green-700 dark:text-green-300" />
    </div>
    <div class="flex-1 text-sm">
      <p class="font-medium text-neutral mb-2">Planta configurada correctamente</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-secondary leading-relaxed">
        <div>
          <span class="font-medium text-neutral">Minerales:</span> {{ planta.minerales.length }}
        </div>
        <div>
          <span class="font-medium text-neutral">Capacidad:</span> {{ planta.capacidad_procesamiento }} ton/día
        </div>
        <div>
          <span class="font-medium text-neutral">Procesos:</span> {{ planta.procesos.length }}
        </div>
      </div>
    </div>
  </div>
</div>

<!-- 🔵 Completar configuración -->
<div
  v-else-if="planta.minerales.length === 0 || planta.procesos.length === 0"
  class="bg-blue-100/70 dark:bg-blue-900/40 border border-blue-400/60 dark:border-blue-700 rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200"
>
  <div class="flex items-center gap-3">
    <div class="w-8 h-8 rounded-full bg-blue-200/50 dark:bg-blue-800/50 center shrink-0">
      <AlertCircle class="w-4 h-4 text-blue-700 dark:text-blue-300" />
    </div>
    <div class="text-sm">
      <p class="font-medium text-neutral mb-1">Completa la configuración de la planta</p>
      <p class="text-secondary leading-relaxed">
        Selecciona al menos un mineral y un proceso de beneficio
      </p>
    </div>
  </div>
</div>


  </div>
</template>

