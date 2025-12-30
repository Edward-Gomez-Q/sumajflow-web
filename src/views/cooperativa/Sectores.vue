<!-- src/views/cooperativa/Sectores.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSessionStore } from '@/stores/sessionStore'
import { useSectoresStore } from '@/stores/cooperativa/sectoresStore'
import AppLayout from '@/components/layout/AppLayout.vue'
import { Map, Plus, Edit2, Trash2, MapPin, Layers, AlertTriangle, CheckCircle2, Mountain } from 'lucide-vue-next'
import PolygonMapPicker from '@/components/onboarding/shared/PolygonMapPicker.vue'
import SectorFormModal from '@/components/cooperativa/SectorFormModal.vue'

const sectoresStore = useSectoresStore()

const showModal = ref(false)
const editingSectorId = ref(null)
const selectedSector = ref(null)
const showDeleteConfirm = ref(false)
const sectorToDelete = ref(null)

onMounted(async () => {
  await sectoresStore.fetchSectores()
  await sectoresStore.fetchEstadisticas()
})

const openCreateModal = () => {
  editingSectorId.value = null
  showModal.value = true
}

const openEditModal = (sector) => {
  editingSectorId.value = sector.id
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingSectorId.value = null
}

const handleSectorClick = (sector) => {
  selectedSector.value = selectedSector.value?.id === sector.id ? null : sector
}

const confirmDelete = (sector) => {
  sectorToDelete.value = sector
  showDeleteConfirm.value = true
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  sectorToDelete.value = null
}

const deleteSector = async () => {
  if (!sectorToDelete.value) return

  const result = await sectoresStore.deleteSector(sectorToDelete.value.id)
  
  if (result.success) {
    // Si el sector eliminado era el seleccionado, limpiarlo
    if (selectedSector.value?.id === sectorToDelete.value.id) {
      selectedSector.value = null
    }
  }

  cancelDelete()
}

const sectoresParaMapa = computed(() => {
  return sectoresStore.sectores.map(sector => ({
    ...sector,
    coordenadas: sector.coordenadas || []
  }))
})

// Función para obtener el color sólido del estado
const getEstadoColorSolido = (estado) => {
  if (estado === 'activo') {
    return 'bg-green-500'
  } else if (estado === 'inactivo') {
    return 'bg-gray-500'
  } else {
    return 'bg-blue-500'
  }
}
</script>

<template>
  <AppLayout>
    <div class="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      <!-- Header con estadísticas -->
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-neutral">Gestión de Sectores</h1>
            <p class="text-secondary mt-1 text-sm sm:text-base">
              Administra las zonas geográficas de operación
            </p>
          </div>
          <button
            @click="openCreateModal"
            class="btn flex items-center justify-center gap-2 sm:w-auto"
          >
            <Plus class="w-5 h-5" />
            <span class="hidden sm:inline">Nuevo Sector</span>
            <span class="sm:hidden">Nuevo</span>
          </button>
        </div>

        <!-- Tarjetas de estadísticas -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                <Layers class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Total Sectores</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ sectoresStore.estadisticas.totalSectores }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-base rounded-xl p-4 border border-border shadow-sm">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500 flex items-center justify-center shrink-0">
                <Map class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Área Total</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ sectoresStore.estadisticas.areaTotalHectareas.toFixed(1) }} ha
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contenedor principal: Mapa + Panel lateral -->
      <div class="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        <!-- Mapa -->
        <div class="flex-1 bg-surface border border-border rounded-xl overflow-hidden shadow-lg relative min-h-[300px] lg:min-h-0">
          <PolygonMapPicker
            v-if="sectoresParaMapa.length > 0"
            :sectors="sectoresParaMapa"
            :edit-mode="false"
            :show-search="true"
          />

          <!-- Estado vacío -->
          <div v-else class="absolute inset-0 flex items-center justify-center p-4">
            <div class="text-center max-w-md">
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Map class="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
              <h3 class="text-lg sm:text-xl font-semibold text-neutral mb-2">No hay sectores registrados</h3>
              <p class="text-sm sm:text-base text-secondary mb-4">
                Comienza creando tu primer sector de operación
              </p>
              <button
                @click="openCreateModal"
                class="btn flex items-center justify-center gap-2 mx-auto"
              >
                <Plus class="w-4 h-4" />
                Crear Primer Sector
              </button>
            </div>
          </div>

          <!-- Loading overlay -->
          <div v-if="sectoresStore.loading" class="absolute inset-0 bg-surface/80 backdrop-blur-sm flex items-center justify-center">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        </div>

        <!-- Panel lateral de sectores -->
        <div class="lg:w-96 bg-surface border border-border rounded-xl overflow-hidden shadow-lg flex flex-col max-h-[400px] lg:max-h-none">
          <!-- Header del panel -->
          <div class="p-3 sm:p-4 border-b border-border bg-hover">
            <div class="flex items-center gap-2">
              <Layers class="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h3 class="font-semibold text-neutral text-sm sm:text-base">Listado de Sectores</h3>
            </div>
          </div>

          <!-- Lista de sectores -->
          <div class="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 scrollbar-custom">
            <div
              v-for="sector in sectoresStore.sectores"
              :key="sector.id"
              @click="handleSectorClick(sector)"
              class="bg-base rounded-xl p-3 sm:p-4 border border-border shadow-sm hover:shadow-md transition-all cursor-pointer"
              :class="{ 'ring-2 ring-primary': selectedSector?.id === sector.id }"
            >
              <div class="flex items-start gap-2 sm:gap-3">
                <!-- Color badge -->
                <div 
                  class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg shrink-0 shadow-sm border-2 border-white dark:border-slate-800"
                  :style="{ backgroundColor: sector.color }"
                ></div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <h4 class="font-semibold text-neutral truncate text-sm sm:text-base">{{ sector.nombre }}</h4>
                    <span 
                      class="px-2 py-0.5 rounded-full text-xs font-medium shrink-0 text-white"
                      :class="getEstadoColorSolido(sector.estado)"
                    >
                      {{ sector.estado }}
                    </span>
                  </div>

                  <div class="flex items-center gap-3 sm:gap-4 mt-2 text-xs text-secondary">
                    <div class="flex items-center gap-1">
                      <MapPin class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>{{ sector.coordenadas?.length || 0 }} pts</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <Map class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>{{ sector.area?.toFixed(1) || 0 }} ha</span>
                    </div>
                  </div>

                  <!-- Acciones -->
                  <div class="flex gap-2 mt-3">
                    <button
                      @click.stop="openEditModal(sector)"
                      class="flex-1 px-2 sm:px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit2 class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span class="hidden sm:inline">Editar</span>
                    </button>
                    <button
                      @click.stop="confirmDelete(sector)"
                      class="flex-1 px-2 sm:px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-error text-xs font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span class="hidden sm:inline">Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Detalles expandidos -->
              <div v-if="selectedSector?.id === sector.id" class="mt-3 pt-3 border-t border-border">
                <div class="space-y-2 text-xs">
                  <div class="flex justify-between">
                    <span class="text-secondary">Coordenadas:</span>
                    <span class="font-medium text-neutral">{{ sector.coordenadas?.length || 0 }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-secondary">Área estimada:</span>
                    <span class="font-medium text-neutral">{{ sector.area?.toFixed(2) || 0 }} hectáreas</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Estado vacío -->
            <div v-if="sectoresStore.sectores.length === 0 && !sectoresStore.loading" class="text-center py-12">
              <div class="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Layers class="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <p class="text-xs sm:text-sm text-secondary">No hay sectores registrados</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de formulario -->
    <SectorFormModal
      v-if="showModal"
      :sector-id="editingSectorId"
      @close="closeModal"
      @saved="() => { closeModal(); sectoresStore.fetchSectores(); sectoresStore.fetchEstadisticas() }"
    />

    <!-- Modal de confirmación de eliminación -->
    <Teleport to="body">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        @click.self="cancelDelete"
      >
        <div class="bg-surface rounded-xl shadow-2xl w-full max-w-md border border-border">
          <div class="p-4 sm:p-6">
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle class="w-5 h-5 sm:w-6 sm:h-6 text-error" />
            </div>
            
            <h3 class="text-lg sm:text-xl font-semibold text-neutral text-center mb-2">
              ¿Eliminar sector?
            </h3>
            
            <p class="text-sm sm:text-base text-secondary text-center mb-6">
              Estás a punto de eliminar el sector <strong class="text-neutral">{{ sectorToDelete?.nombre }}</strong>.
              Esta acción no se puede deshacer.
            </p>

            <div class="flex gap-3">
              <button
                @click="cancelDelete"
                class="flex-1 btn-secondary text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                @click="deleteSector"
                class="flex-1 bg-error hover:bg-error/90 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>