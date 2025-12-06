<!-- src/views/socio/Minas.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useMinasStore } from '@/stores/socio/minasStore'
import { useSectoresSocioStore } from '@/stores/socio/sectoresSocioStore'
import AppLayout from '@/components/layout/AppLayout.vue'
import { Mountain, Plus, Edit2, Trash2, MapPin, Layers, AlertTriangle, Eye } from 'lucide-vue-next'
import MinasMapViewer from '@/components/socio/MinasMapViewer.vue'
import MinaFormModal from '@/components/socio/MinaFormModal.vue'
import rutaApi from '@/assets/rutaApi'

const minasStore = useMinasStore()
const sectoresStore = useSectoresSocioStore()

const showModal = ref(false)
const editingMinaId = ref(null)
const selectedMina = ref(null)
const showDeleteConfirm = ref(false)
const minaToDelete = ref(null)
const mapViewerRef = ref(null)

onMounted(async () => {
  await Promise.all([
    sectoresStore.fetchSectores(),
    sectoresStore.fetchEstadisticas(),
    minasStore.fetchMinas(),
    minasStore.fetchEstadisticas()
  ])
})

const openCreateModal = () => {
  editingMinaId.value = null
  showModal.value = true
}

const openEditModal = (mina) => {
  editingMinaId.value = mina.id
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingMinaId.value = null
}

const handleMinaClick = (mina) => {
  selectedMina.value = selectedMina.value?.id === mina.id ? null : mina
  if (selectedMina.value && mapViewerRef.value) {
    mapViewerRef.value.centerOnMina(mina)
  }
}

const confirmDelete = (mina) => {
  minaToDelete.value = mina
  showDeleteConfirm.value = true
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  minaToDelete.value = null
}

const deleteMina = async () => {
  if (!minaToDelete.value) return

  const result = await minasStore.deleteMina(minaToDelete.value.id)
  
  if (result.success) {
    if (selectedMina.value?.id === minaToDelete.value.id) {
      selectedMina.value = null
    }
    await minasStore.fetchMinas()
  }

  cancelDelete()
}

const viewMinaImage = (fotoUrl) => {
  if (fotoUrl) {
    window.open(`${rutaApi}/files/${fotoUrl}`, '_blank')
  }
}

const sectoresParaMapa = computed(() => sectoresStore.sectoresActivos)
const minasParaMapa = computed(() => minasStore.minasActivas)
</script>

<template>
  <AppLayout>
    <div class="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      <!-- Header -->
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-neutral">Gestión de Minas</h1>
            <p class="text-secondary mt-1 text-sm sm:text-base">
              Administra las ubicaciones de tus minas en los sectores
            </p>
          </div>
          <button @click="openCreateModal" class="btn flex items-center gap-2 justify-center sm:w-auto">
            <Plus class="w-5 h-5" />
            <span class="hidden sm:inline">Nueva Mina</span>
            <span class="sm:hidden">Nueva</span>
          </button>
        </div>

        <!-- Estadísticas -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div class="card">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 center">
                <Mountain class="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Mis Minas</h3>
                <p class="text-xl sm:text-2xl font-bold text-neutral">
                  {{ minasStore.estadisticas.totalMinasActivas }}
                </p>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-100 dark:bg-green-900/30 center">
                <Layers class="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Sectores</h3>
                <p class="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  {{ sectoresStore.estadisticas.totalSectoresActivos }}
                </p>
              </div>
            </div>
          </div>

          <div v-if="minasStore.estadisticas.estadisticasGeograficas" class="card col-span-2">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 center">
                <MapPin class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 class="text-xs sm:text-sm font-medium text-secondary">Distancia Promedio</h3>
                <p class="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {{ minasStore.estadisticas.estadisticasGeograficas.distanciaPromedioEntreMinasKm }} km
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mapa + Panel Lateral -->
      <div class="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        <!-- Mapa -->
        <div class="flex-1 bg-surface border border-border rounded-xl overflow-hidden shadow-lg relative min-h-[300px] lg:min-h-0">
          <MinasMapViewer
            v-if="sectoresParaMapa.length > 0"
            ref="mapViewerRef"
            :sectores="sectoresParaMapa"
            :minas="minasParaMapa"
            @mina-selected="handleMinaClick"
          />

          <!-- Estado vacío -->
          <div v-else class="absolute inset-0 flex items-center justify-center p-4">
            <div class="text-center max-w-md">
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 center mx-auto mb-4">
                <MapPin class="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
              <h3 class="text-lg sm:text-xl font-semibold text-neutral mb-2">No hay sectores disponibles</h3>
              <p class="text-sm sm:text-base text-secondary mb-4">
                Espera a que tu cooperativa defina los sectores de operación
              </p>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="minasStore.loading || sectoresStore.loading" class="absolute inset-0 bg-surface/80 backdrop-blur-sm flex items-center justify-center">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        </div>

        <!-- Panel Lateral -->
        <div class="lg:w-96 bg-surface border border-border rounded-xl overflow-hidden shadow-lg flex flex-col max-h-[400px] lg:max-h-none">
          <!-- Header -->
          <div class="p-3 sm:p-4 border-b border-border bg-hover">
            <div class="flex items-center gap-2">
              <Mountain class="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h3 class="font-semibold text-neutral text-sm sm:text-base">Mis Minas</h3>
            </div>
          </div>

          <!-- Lista -->
          <div class="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 scrollbar-custom">
            <div
              v-for="mina in minasStore.minasActivas"
              :key="mina.id"
              @click="handleMinaClick(mina)"
              class="bg-hover border border-border rounded-lg p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer"
              :class="{ 'ring-2 ring-primary': selectedMina?.id === mina.id }"
            >
              <div class="flex items-start gap-2 sm:gap-3">
                <!-- Imagen/Icono -->
                <div class="shrink-0">
                  <div 
                    v-if="mina.fotoUrl"
                    class="w-10 h-10 rounded-lg overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm relative group cursor-pointer"
                    @click.stop="viewMinaImage(mina.fotoUrl)"
                  >
                    <img 
                      :src="`${rutaApi}/files/${mina.fotoUrl}`" 
                      :alt="mina.nombre"
                      class="w-full h-full object-cover"
                    />
                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity center">
                      <Eye class="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div 
                    v-else
                    class="w-10 h-10 rounded-lg shadow-sm border-2 border-white dark:border-slate-800 center"
                    :style="{ backgroundColor: mina.sectorColor }"
                  >
                    <Mountain class="w-5 h-5 text-white" />
                  </div>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <h4 class="font-semibold text-neutral truncate text-sm sm:text-base">{{ mina.nombre }}</h4>
                    <span 
                      class="px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                      :class="{
                        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400': mina.estado === 'activo',
                        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400': mina.estado === 'inactivo'
                      }"
                    >
                      {{ mina.estado }}
                    </span>
                  </div>

                  <div class="flex items-center gap-2 mt-2 text-xs text-secondary">
                    <div 
                      class="w-3 h-3 rounded-full" 
                      :style="{ backgroundColor: mina.sectorColor }"
                    ></div>
                    <span>{{ mina.sectorNombre }}</span>
                  </div>

                  <div class="flex items-center gap-1 mt-1 text-xs text-tertiary">
                    <MapPin class="w-3 h-3" />
                    <span>{{ mina.latitud.toFixed(6) }}, {{ mina.longitud.toFixed(6) }}</span>
                  </div>

                  <!-- Acciones -->
                  <div class="flex gap-2 mt-3">
                    <button
                      @click.stop="openEditModal(mina)"
                      class="flex-1 px-2 sm:px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit2 class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span class="hidden sm:inline">Editar</span>
                    </button>
                    <button
                      @click.stop="confirmDelete(mina)"
                      class="flex-1 px-2 sm:px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-error text-xs font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span class="hidden sm:inline">Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Detalles expandidos -->
              <div v-if="selectedMina?.id === mina.id" class="mt-3 pt-3 border-t border-border">
                <div class="space-y-2 text-xs">
                  <div class="flex justify-between">
                    <span class="text-secondary">Sector:</span>
                    <span class="font-medium text-neutral">{{ mina.sectorNombre }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-secondary">Coordenadas:</span>
                    <span class="font-mono text-neutral">{{ mina.latitud.toFixed(6) }}, {{ mina.longitud.toFixed(6) }}</span>
                  </div>
                  <div v-if="mina.fotoUrl" class="flex justify-between">
                    <span class="text-secondary">Foto:</span>
                    <button @click.stop="viewMinaImage(mina.fotoUrl)" class="text-primary hover:underline flex items-center gap-1">
                      <Eye class="w-3 h-3" />
                      Ver imagen
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Estado vacío -->
            <div v-if="minasStore.minasActivas.length === 0 && !minasStore.loading" class="text-center py-12">
              <div class="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 center mx-auto mb-3">
                <Mountain class="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <p class="text-xs sm:text-sm text-secondary mb-3">No tienes minas registradas</p>
              <button @click="openCreateModal" class="btn-outline text-xs sm:text-sm px-4 py-2">
                <Plus class="w-4 h-4 inline mr-1" />
                Registrar primera mina
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Formulario -->
    <MinaFormModal
      v-if="showModal"
      :mina-id="editingMinaId"
      @close="closeModal"
      @saved="() => { closeModal(); minasStore.fetchMinas(); minasStore.fetchEstadisticas() }"
    />

    <!-- Modal Confirmación Eliminar -->
    <Teleport to="body">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        @click.self="cancelDelete"
      >
        <div class="bg-surface rounded-xl shadow-2xl w-full max-w-md border border-border">
          <div class="p-4 sm:p-6">
            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 dark:bg-red-900/30 center mx-auto mb-4">
              <AlertTriangle class="w-5 h-5 sm:w-6 sm:h-6 text-error" />
            </div>
            
            <h3 class="text-lg sm:text-xl font-semibold text-neutral text-center mb-2">
              ¿Eliminar mina?
            </h3>
            
            <p class="text-sm sm:text-base text-secondary text-center mb-6">
              Estás a punto de eliminar la mina <strong class="text-neutral">{{ minaToDelete?.nombre }}</strong>.
              Solo podrás eliminarla si no tiene lotes activos.
            </p>

            <div class="flex gap-3">
              <button @click="cancelDelete" class="flex-1 btn-secondary text-sm sm:text-base">
                Cancelar
              </button>
              <button @click="deleteMina" class="flex-1 bg-error hover:bg-error/90 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>