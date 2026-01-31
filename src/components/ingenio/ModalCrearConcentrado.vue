<!-- src/components/ingenio/ModalCrearConcentrado.vue -->
<script setup>
import { ref, computed, watch } from 'vue'
import { useConcentradosIngenioStore } from '@/stores/ingenio/concentradosIngenioStore'
import { useLotesIngenioStore } from '@/stores/ingenio/lotesIngenioStore'
import { useUIStore } from '@/stores/uiStore'
import {
  PackageCheck,
  X,
  Plus,
  AlertCircle,
  Droplet,
  Scale,
  User,
  Info,
  CheckCircle2,
  Factory,
  ChevronRight
} from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'concentrado-creado'])

const concentradosStore = useConcentradosIngenioStore()
const lotesStore = useLotesIngenioStore()
const uiStore = useUIStore()

const paso = ref(1)
const lotesSeleccionados = ref([])
const loteAncla = ref(null)

const formulario = ref({
  pesoInicial: 0,
  observacionesIniciales: ''
})

// ==================== FUNCIONES AUXILIARES ====================

const getMineralesSet = (lote) => {
  if (!lote.minerales || lote.minerales.length === 0) return new Set()
  return new Set(lote.minerales.map(m => m.nomenclatura))
}

const tieneMineral = (lote, mineral) => {
  const minerales = getMineralesSet(lote)
  return minerales.has(mineral)
}

const determinarConcentradosACrear = computed(() => {
  if (lotesSeleccionados.value.length === 0) return []

  const batchTieneZn = lotesSeleccionados.value.some(l => tieneMineral(l, 'Zn'))
  const batchTienePb = lotesSeleccionados.value.some(l => tieneMineral(l, 'Pb'))
  const batchTieneAg = lotesSeleccionados.value.some(l => tieneMineral(l, 'Ag'))

  const concentrados = []

  if (batchTieneZn && batchTienePb) {
    concentrados.push({ mineral: 'Zn', nombre: 'Concentrado de Zinc' })
    concentrados.push({ mineral: 'Pb', nombre: 'Concentrado de Plomo' })
  } else if (batchTieneZn) {
    concentrados.push({ mineral: 'Zn', nombre: 'Concentrado de Zinc' })
  } else if (batchTienePb) {
    concentrados.push({ mineral: 'Pb', nombre: 'Concentrado de Plomo' })
  } else if (batchTieneAg) {
    concentrados.push({ mineral: 'Ag', nombre: 'Concentrado de Plata' })
  }

  return concentrados
})

const esLoteCompatible = (lote) => {
  if (!loteAncla.value) return true

  const mineralesAncla = getMineralesSet(loteAncla.value)
  const mineralesLote = getMineralesSet(lote)

  const anclaZn = mineralesAncla.has('Zn')
  const anclaPb = mineralesAncla.has('Pb')
  const anclaAg = mineralesAncla.has('Ag')

  const loteZn = mineralesLote.has('Zn')
  const lotePb = mineralesLote.has('Pb')
  const loteAg = mineralesLote.has('Ag')

  if (anclaAg && !anclaZn && !anclaPb) {
    return loteAg && !loteZn && !lotePb
  }

  if (anclaZn && anclaPb) {
    if (loteAg && !loteZn && !lotePb) return false
    return loteZn || lotePb
  }

  if (anclaZn && !anclaPb) {
    return loteZn
  }

  if (anclaPb && !anclaZn) {
    return lotePb
  }

  return true
}

const validacionCupoMinimo = computed(() => {
  if (!concentradosStore.infoPlanta) return { valido: true, mensaje: '' }
  
  const pesoTotal = parseFloat(pesoTotalCalculado.value)
  const cupoMinimo = parseFloat(concentradosStore.infoPlanta.cupoMinimo)
  const diferencia = pesoTotal - cupoMinimo
  
  return {
    valido: pesoTotal >= cupoMinimo,
    pesoTotal,
    cupoMinimo,
    diferencia,
    mensaje: pesoTotal < cupoMinimo 
      ? `Faltan ${Math.abs(diferencia).toFixed(2)} kg`
      : `+${diferencia.toFixed(2)} kg adicionales`
  }
})

const lotesDisponiblesFiltrados = computed(() => {
  if (!loteAncla.value) return lotesStore.lotes

  const lotesPorSocio = lotesStore.lotes.filter(l => 
    l.socioId === loteAncla.value.socioId
  )

  return lotesPorSocio.filter(esLoteCompatible)
})

// ==================== COMPUTED ====================

const pesoTotalCalculado = computed(() => {
  return lotesSeleccionados.value.reduce((total, lote) => {
    return total + parseFloat(lote.pesoTotalReal || 0)
  }, 0).toFixed(2)
})

const socioDelPrimerLote = computed(() => {
  if (lotesSeleccionados.value.length === 0) return null
  const primerLote = lotesSeleccionados.value[0]
  return {
    nombre: `${primerLote.socioNombres} ${primerLote.socioApellidos}`,
    id: primerLote.socioId
  }
})

const todosMismoSocio = computed(() => {
  if (lotesSeleccionados.value.length === 0) return true
  const primerSocioId = lotesSeleccionados.value[0].socioId
  return lotesSeleccionados.value.every(lote => lote.socioId === primerSocioId)
})

const mensajeCompatibilidad = computed(() => {
  if (!loteAncla.value) return null

  const minerales = getMineralesSet(loteAncla.value)
  const tieneZn = minerales.has('Zn')
  const tienePb = minerales.has('Pb')
  const tieneAg = minerales.has('Ag')

  if (tieneZn && tienePb) {
    return 'Lote Mixto: Compatible con Zn o Pb'
  } else if (tieneZn) {
    return 'Lote de Zinc: Compatible con lotes que contengan Zn'
  } else if (tienePb) {
    return 'Lote de Plomo: Compatible con lotes que contengan Pb'
  } else if (tieneAg) {
    return 'Lote de Plata: Solo compatible con otros lotes de Ag'
  }

  return null
})

const puedeAvanzar = computed(() => {
  if (paso.value === 1) {
    return lotesSeleccionados.value.length > 0 && 
           todosMismoSocio.value && 
           validacionCupoMinimo.value.valido 
  } else if (paso.value === 2) {
    return formulario.value.pesoInicial > 0
  }
  return false
})

// ==================== WATCHERS ====================

watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    await concentradosStore.fetchInfoPlanta()
    await lotesStore.fetchLotes({
      estado: 'Transporte completo',
      size: 100
    })
    paso.value = 1
    lotesSeleccionados.value = []
    loteAncla.value = null
    formulario.value = {
      pesoInicial: 0,
      observacionesIniciales: ''
    }
  }
})

// ==================== MÉTODOS ====================

const cerrarModal = () => {
  emit('update:modelValue', false)
}

const toggleSeleccionLote = (lote) => {
  const index = lotesSeleccionados.value.findIndex(l => l.id === lote.id)
  
  if (index > -1) {
    lotesSeleccionados.value.splice(index, 1)
    
    if (loteAncla.value && loteAncla.value.id === lote.id) {
      if (lotesSeleccionados.value.length > 0) {
        loteAncla.value = lotesSeleccionados.value[0]
      } else {
        loteAncla.value = null
      }
    }
  } else {
    if (lotesSeleccionados.value.length > 0) {
      const primerSocioId = lotesSeleccionados.value[0].socioId
      if (lote.socioId !== primerSocioId) {
        uiStore.showError(
          'Todos los lotes deben pertenecer al mismo socio',
          'Error de Validación'
        )
        return
      }
    }

    if (loteAncla.value && !esLoteCompatible(lote)) {
      uiStore.showError(
        'Este lote no es compatible con el lote ancla según los minerales',
        'Lote Incompatible'
      )
      return
    }

    lotesSeleccionados.value.push(lote)
    
    if (!loteAncla.value) {
      loteAncla.value = lote
    }
  }
}

const estaSeleccionado = (lote) => {
  return lotesSeleccionados.value.some(l => l.id === lote.id)
}

const esLoteAncla = (lote) => {
  return loteAncla.value && loteAncla.value.id === lote.id
}

const avanzarPaso = () => {
  if (paso.value === 1) {
    formulario.value.pesoInicial = parseFloat(pesoTotalCalculado.value)
    paso.value = 2
  }
}

const retrocederPaso = () => {
  if (paso.value === 2) {
    paso.value = 1
  }
}

const crearConcentrado = async () => {
  if (!puedeAvanzar.value) return

  const datos = {
    lotesIds: lotesSeleccionados.value.map(l => l.id),
    pesoInicial: parseFloat(formulario.value.pesoInicial),
    observacionesIniciales: formulario.value.observacionesIniciales || null
  }

  const result = await concentradosStore.crearConcentrado(datos)

  if (result.success) {
    const concentradosCreados = Array.isArray(result.data) ? result.data : [result.data]
    emit('concentrado-creado', concentradosCreados[0])
    cerrarModal()
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-BO', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  })
}

const getMineralesNombres = (lote) => {
  if (!lote.minerales || lote.minerales.length === 0) return []
  return lote.minerales.map(m => m.nomenclatura)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-9999 flex items-center justify-center bg-neutral-900/20 backdrop-blur-sm p-4"
        @click.self="cerrarModal"
      >
        <Transition name="modal-content">
          <div 
            v-if="modelValue"
            class="bg-surface rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] border border-border flex flex-col"
          >
            <!-- Header -->
            <div class="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-hover shrink-0">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <Plus class="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 class="text-xl font-semibold text-neutral">Crear Nuevo Concentrado</h2>
                  <p class="text-sm text-secondary mt-0.5">
                    Paso {{ paso }} de 2: {{ paso === 1 ? 'Seleccionar lotes' : 'Confirmar detalles' }}
                  </p>
                </div>
              </div>
              <button
                @click="cerrarModal"
                class="w-10 h-10 rounded-lg hover:bg-surface transition-colors flex items-center justify-center text-secondary hover:text-neutral"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto scrollbar-custom">
              <div class="p-4 sm:p-6 space-y-6">
                <!-- Indicador de pasos -->
                <div class="flex items-center gap-2">
                  <div class="flex-1 relative">
                    <div class="h-1.5 rounded-full bg-primary transition-all duration-300"></div>
                    <p class="text-xs text-center mt-2 font-medium text-primary">1. Seleccionar</p>
                  </div>
                  <ChevronRight class="w-4 h-4 text-border" />
                  <div class="flex-1 relative">
                    <div 
                      class="h-1.5 rounded-full transition-all duration-300" 
                      :class="paso === 2 ? 'bg-primary' : 'bg-border'"
                    ></div>
                    <p 
                      class="text-xs text-center mt-2 transition-colors duration-300" 
                      :class="paso === 2 ? 'font-medium text-primary' : 'text-secondary'"
                    >
                      2. Confirmar
                    </p>
                  </div>
                </div>

                <!-- Info Planta - Minimalista -->
                <Transition name="slide-fade">
                  <div 
                    v-if="concentradosStore.infoPlanta" 
                    class="bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5"
                  >
                    <div class="flex items-center gap-4 text-sm">
                      <div class="flex items-center gap-2">
                        <Factory class="w-4 h-4 text-primary" />
                        <span class="text-secondary">Cupo mínimo:</span>
                        <span class="font-semibold text-neutral">{{ concentradosStore.infoPlanta.cupoMinimo }} kg</span>
                      </div>
                      <div class="w-px h-4 bg-border"></div>
                      <div class="flex items-center gap-2">
                        <span class="text-secondary">Capacidad:</span>
                        <span class="font-semibold text-neutral">{{ concentradosStore.infoPlanta.capacidadProcesamiento }} kg</span>
                      </div>
                    </div>
                  </div>
                </Transition>

                <!-- PASO 1: Seleccionar lotes -->
                <Transition name="slide-fade" mode="out-in">
                  <div v-if="paso === 1" class="space-y-4">
                    <!-- Resumen Compacto -->
                    <Transition name="slide-fade">
                      <div 
                        v-if="lotesSeleccionados.length > 0" 
                        class="space-y-3"
                      >
                        <!-- Stats en línea -->
                        <div class="flex items-center gap-3 p-3 bg-hover rounded-lg border border-border">
                          <div class="flex items-center gap-6 flex-1 text-sm">
                            <div class="flex items-baseline gap-1.5">
                              <span class="text-secondary text-xs">Lotes:</span>
                              <span class="font-bold text-neutral">{{ lotesSeleccionados.length }}</span>
                            </div>
                            <div class="flex items-baseline gap-1.5">
                              <Scale class="w-3.5 h-3.5 text-secondary" />
                              <span class="font-bold text-neutral">{{ pesoTotalCalculado }} kg</span>
                            </div>
                            <div class="flex items-baseline gap-1.5">
                              <Droplet class="w-3.5 h-3.5 text-secondary" />
                              <span class="font-bold text-neutral">{{ determinarConcentradosACrear.length }}</span>
                            </div>
                            <div class="flex items-baseline gap-1.5">
                              <User class="w-3.5 h-3.5 text-secondary" />
                              <span class="font-medium text-neutral text-xs truncate">{{ socioDelPrimerLote?.nombre?.split(' ').slice(0, 2).join(' ') || '-' }}</span>
                            </div>
                          </div>
                        </div>

                        <!-- Validación Peso - Una línea -->
                        <div 
                          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border"
                          :class="validacionCupoMinimo.valido 
                            ? 'bg-success/5 border-success/20 text-success' 
                            : 'bg-warning/5 border-warning/20 text-warning'"
                        >
                          <component 
                            :is="validacionCupoMinimo.valido ? CheckCircle2 : AlertCircle"
                            class="w-4 h-4 shrink-0"
                          />
                          <span class="font-medium">{{ validacionCupoMinimo.mensaje }}</span>
                        </div>

                        <!-- Concentrados Pills -->
                        <div class="flex flex-wrap gap-2">
                          <TransitionGroup name="list">
                            <span
                              v-for="conc in determinarConcentradosACrear"
                              :key="conc.mineral"
                              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary text-white text-xs font-medium"
                            >
                              <Droplet class="w-3 h-3" />
                              {{ conc.nombre }}
                            </span>
                          </TransitionGroup>
                        </div>

                        <!-- Mensaje Compatibilidad - Muy compacto -->
                        <Transition name="slide-fade">
                          <div 
                            v-if="mensajeCompatibilidad" 
                            class="flex items-center gap-2 px-3 py-1.5 rounded-md bg-info/5 border border-info/20"
                          >
                            <Info class="w-3.5 h-3.5 text-info shrink-0" />
                            <p class="text-xs text-info">{{ mensajeCompatibilidad }}</p>
                          </div>
                        </Transition>
                      </div>
                    </Transition>

                    <!-- Lista de lotes -->
                    <div>
                      <div class="flex items-center justify-between mb-3">
                        <h3 class="text-base font-semibold text-neutral">
                          Lotes Disponibles
                          <span class="text-sm font-normal text-secondary ml-1">
                            ({{ lotesDisponiblesFiltrados.length }})
                          </span>
                        </h3>
                        <Transition name="scale">
                          <div v-if="loteAncla" class="flex items-center gap-1.5 px-2.5 py-1 bg-warning/10 rounded-md border border-warning/30">
                            <div class="w-1.5 h-1.5 rounded-full bg-warning animate-pulse"></div>
                            <span class="text-xs font-medium text-warning">Ancla: #{{ loteAncla.id }}</span>
                          </div>
                        </Transition>
                      </div>
                      
                      <div v-if="lotesDisponiblesFiltrados.length === 0" class="text-center py-12">
                        <PackageCheck class="w-16 h-16 text-secondary mx-auto mb-4 opacity-50" />
                        <p class="text-secondary text-sm">
                          {{ loteAncla 
                            ? 'No hay más lotes compatibles' 
                            : 'No hay lotes disponibles' }}
                        </p>
                      </div>

                      <TransitionGroup 
                        v-else 
                        name="list" 
                        tag="div" 
                        class="grid grid-cols-1 md:grid-cols-2 gap-3"
                      >
                        <div
                          v-for="lote in lotesDisponiblesFiltrados"
                          :key="lote.id"
                          class="border rounded-lg p-3 cursor-pointer transition-all duration-200 relative group"
                          :class="[
                            estaSeleccionado(lote) 
                              ? 'border-primary bg-primary/5 shadow-sm' 
                              : 'border-border hover:border-primary/50 hover:shadow-sm',
                            esLoteAncla(lote) ? 'ring-2 ring-warning/40' : ''
                          ]"
                          @click="toggleSeleccionLote(lote)"
                        >
                          <div class="flex items-start justify-between gap-3">
                            <div class="flex items-start gap-2.5 flex-1">
                              <div 
                                class="w-9 h-9 rounded-lg center shrink-0 transition-all duration-200"
                                :class="estaSeleccionado(lote) ? 'bg-primary scale-105' : 'bg-primary/80'"
                              >
                                <PackageCheck class="w-4.5 h-4.5 text-white" />
                              </div>
                              <div class="flex-1 min-w-0">
                                <h3 class="font-semibold text-neutral text-sm">Lote #{{ lote.id }}</h3>
                                <p class="text-xs text-secondary mt-0.5 truncate">{{ lote.minaNombre }}</p>
                                
                                <div class="flex flex-wrap gap-1 mt-1.5">
                                  <span
                                    v-for="mineral in getMineralesNombres(lote)"
                                    :key="mineral"
                                    class="px-1.5 py-0.5 rounded text-xs bg-accent/20 text-accent font-medium border border-accent/30"
                                  >
                                    {{ mineral }}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Transition name="scale">
                              <div 
                                v-if="estaSeleccionado(lote)"
                                class="w-5 h-5 rounded-full bg-primary center shrink-0"
                              >
                                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                                </svg>
                              </div>
                            </Transition>
                          </div>

                          <div class="grid grid-cols-2 gap-3 mt-2.5 pt-2.5 border-t border-border">
                            <div>
                              <p class="text-xs text-secondary">Tipo</p>
                              <p class="text-sm font-medium text-neutral">{{ lote.tipoMineral }}</p>
                            </div>
                            <div>
                              <p class="text-xs text-secondary">Peso</p>
                              <p class="text-sm font-medium text-neutral">{{ lote.pesoTotalReal }} kg</p>
                            </div>
                            <div>
                              <p class="text-xs text-secondary">Creado</p>
                              <p class="text-sm font-medium text-neutral">{{ formatDate(lote.fechaCreacion) }}</p>
                            </div>
                            <div>
                              <p class="text-xs text-secondary">Socio</p>
                              <p class="text-sm font-medium text-neutral truncate">
                                {{ lote.socioNombres }} {{ lote.socioApellidos }}
                              </p>
                            </div>
                          </div>
                        </div>
                      </TransitionGroup>
                    </div>
                  </div>
                </Transition>

                <!-- PASO 2: Confirmar -->
                <Transition name="slide-fade" mode="out-in">
                  <div v-if="paso === 2" class="space-y-4">
                    <!-- Validación Peso -->
                    <div 
                      class="rounded-lg p-3 border"
                      :class="validacionCupoMinimo.valido 
                        ? 'bg-success/5 border-success/20' 
                        : 'bg-warning/5 border-warning/20'"
                    >
                      <div class="flex items-center gap-2.5 mb-2">
                        <component 
                          :is="validacionCupoMinimo.valido ? CheckCircle2 : AlertCircle" 
                          class="w-5 h-5 shrink-0"
                          :class="validacionCupoMinimo.valido ? 'text-success' : 'text-warning'"
                        />
                        <h4 
                          class="font-semibold text-sm"
                          :class="validacionCupoMinimo.valido ? 'text-success' : 'text-warning'"
                        >
                          {{ validacionCupoMinimo.valido ? 'Peso Válido' : 'Peso Insuficiente' }}
                        </h4>
                      </div>
                      <div class="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p class="text-xs text-secondary mb-0.5">Total</p>
                          <p class="font-semibold text-neutral">{{ validacionCupoMinimo.pesoTotal }} kg</p>
                        </div>
                        <div>
                          <p class="text-xs text-secondary mb-0.5">Mínimo</p>
                          <p class="font-semibold text-neutral">{{ validacionCupoMinimo.cupoMinimo }} kg</p>
                        </div>
                        <div>
                          <p class="text-xs text-secondary mb-0.5">{{ validacionCupoMinimo.valido ? 'Extra' : 'Falta' }}</p>
                          <p 
                            class="font-semibold"
                            :class="validacionCupoMinimo.valido ? 'text-success' : 'text-warning'"
                          >
                            {{ Math.abs(validacionCupoMinimo.diferencia).toFixed(2) }} kg
                          </p>
                        </div>
                      </div>
                    </div>

                    <!-- Concentrados a crear -->
                    <div class="bg-success/5 border border-success/20 rounded-lg p-3">
                      <div class="flex items-center gap-2 mb-2.5">
                        <CheckCircle2 class="w-4.5 h-4.5 text-success" />
                        <h3 class="font-semibold text-success text-sm">
                          {{ determinarConcentradosACrear.length }} Concentrado(s) a Crear
                        </h3>
                      </div>
                      <div class="space-y-2">
                        <div
                          v-for="conc in determinarConcentradosACrear"
                          :key="conc.mineral"
                          class="flex items-center gap-2.5 p-2.5 rounded-md bg-surface border border-success/20"
                        >
                          <div class="w-8 h-8 rounded-md bg-success/10 center shrink-0">
                            <Droplet class="w-4 h-4 text-success" />
                          </div>
                          <div>
                            <p class="font-semibold text-neutral text-sm">{{ conc.nombre }}</p>
                            <p class="text-xs text-secondary">Mineral: {{ conc.mineral }}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Lotes compactos -->
                    <div>
                      <h3 class="text-sm font-semibold text-neutral mb-2">
                        Lotes Incluidos ({{ lotesSeleccionados.length }})
                      </h3>
                      <div class="space-y-1.5 max-h-40 overflow-y-auto scrollbar-custom">
                        <div
                          v-for="lote in lotesSeleccionados"
                          :key="lote.id"
                          class="flex items-center gap-2.5 p-2.5 bg-hover rounded-md text-sm"
                        >
                          <PackageCheck class="w-4 h-4 text-primary shrink-0" />
                          <div class="flex-1 min-w-0">
                            <p class="font-medium text-neutral text-xs truncate">
                              Lote #{{ lote.id }} • {{ lote.minaNombre }}
                            </p>
                            <div class="flex items-center gap-2 mt-0.5">
                              <span class="text-xs text-secondary">{{ lote.pesoTotalReal }} kg</span>
                              <div class="flex gap-1">
                                <span
                                  v-for="mineral in getMineralesNombres(lote)"
                                  :key="mineral"
                                  class="px-1 py-0.5 rounded text-xs bg-accent/20 text-accent border border-accent/30"
                                >
                                  {{ mineral }}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Formulario -->
                    <div>
                      <h3 class="text-sm font-semibold text-neutral mb-3">Detalles del Proceso</h3>
                      
                      <div class="space-y-3">
                        <div class="input-group">
                          <label class="input-label flex items-center gap-2 text-xs">
                            <Scale class="w-3.5 h-3.5" />
                            Peso Total (kg) *
                          </label>
                          <input
                            v-model="formulario.pesoInicial"
                            type="number"
                            step="0.01"
                            min="0"
                            readonly
                            class="bg-hover cursor-not-allowed text-sm py-2"
                          />
                        </div>

                        <div class="input-group">
                          <label class="input-label text-xs">Observaciones (opcional)</label>
                          <textarea
                            v-model="formulario.observacionesIniciales"
                            rows="2"
                            placeholder="Notas sobre el proceso..."
                            class="resize-none text-sm py-2"
                          ></textarea>
                        </div>

                        <div v-if="socioDelPrimerLote" class="flex items-center gap-2 p-2.5 bg-primary/5 rounded-md border border-primary/20">
                          <User class="w-4 h-4 text-primary shrink-0" />
                          <div>
                            <p class="text-xs text-secondary">Socio</p>
                            <p class="text-sm font-medium text-neutral">{{ socioDelPrimerLote.nombre }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>

            <!-- Footer -->
            <div class="border-t border-border p-4 bg-hover shrink-0">
              <div class="flex gap-2.5 justify-end">
                <button
                  v-if="paso === 1"
                  @click="cerrarModal"
                  class="btn-secondary px-4 py-2"
                >
                  Cancelar
                </button>
                <button
                  v-if="paso === 2"
                  @click="retrocederPaso"
                  class="btn-secondary px-4 py-2"
                >
                  Atrás
                </button>
                <button
                  v-if="paso === 1"
                  @click="avanzarPaso"
                  :disabled="!puedeAvanzar"
                  class="btn px-4 py-2 flex items-center gap-1.5"
                >
                  Continuar
                  <ChevronRight class="w-4 h-4" />
                </button>
                <button
                  v-if="paso === 2"
                  @click="crearConcentrado"
                  :disabled="!puedeAvanzar"
                  class="btn px-4 py-2 flex items-center gap-1.5"
                >
                  <Plus class="w-4 h-4" />
                  Crear {{ determinarConcentradosACrear.length }} Concentrado(s)
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Animaciones del Modal */
.modal-backdrop-enter-active,
.modal-backdrop-leave-active {
  transition: opacity 0.3s ease;
}

.modal-backdrop-enter-from,
.modal-backdrop-leave-to {
  opacity: 0;
}

.modal-content-enter-active {
  transition: all 0.3s ease;
}

.modal-content-leave-active {
  transition: all 0.2s ease;
}

.modal-content-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(-20px);
}

.modal-content-leave-to {
  opacity: 0;
  transform: scale(0.98) translateY(10px);
}

/* Slide Fade */
.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* List Animation */
.list-enter-active {
  transition: all 0.4s ease;
}

.list-leave-active {
  transition: all 0.3s ease;
  position: absolute;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.list-move {
  transition: transform 0.4s ease;
}

/* Scale Animation */
.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0);
}

</style>