<!-- src/components/cooperativa/SectorFormModal.vue -->
<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useSectoresStore } from "@/stores/cooperativa/sectoresStore";
import {
  X,
  Save,
  Plus,
  Mountain,
  AlertTriangle,
  MapPin,
  Trash2,
} from "lucide-vue-next";
import PolygonMapPicker from "@/components/onboarding/shared/PolygonMapPicker.vue";
import {     CheckCircle2 } from 'lucide-vue-next'

const props = defineProps({
  sectorId: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits(["close", "saved"]);

const sectoresStore = useSectoresStore();

const isEditing = computed(() => props.sectorId !== null);
const loading = ref(false);

// Formulario
const sectorForm = ref({
  nombre: "",
  color: "#1E3A8A",
  coordenadas: [],
});

// Errores
const validationErrors = ref({
  nombre: "",
  color: "",
  coordenadas: "",
});

// Colores disponibles desde el store
const availableColors = computed(() => {
  if (isEditing.value) {
    return sectoresStore.getColoresDisponiblesParaEdicion(props.sectorId);
  }
  return sectoresStore.coloresDisponibles;
});

onMounted(async () => {
  if (isEditing.value) {
    await loadSector();
  } else {
    // Al crear, seleccionar el primer color disponible
    if (availableColors.value.length > 0) {
      sectorForm.value.color = availableColors.value[0].value;
    }
  }
});

const loadSector = async () => {
  loading.value = true;

  const result = await sectoresStore.getSectorById(props.sectorId);

  if (result.success) {
    sectorForm.value = {
      nombre: result.data.nombre,
      color: result.data.color,
      coordenadas: result.data.coordenadas.map((c) => ({
        orden: c.orden,
        latitud: c.latitud,
        longitud: c.longitud,
      })),
    };
  }

  loading.value = false;
};

const validateName = () => {
  if (!sectorForm.value.nombre.trim()) {
    validationErrors.value.nombre = "El nombre es requerido";
    return false;
  }
  validationErrors.value.nombre = "";
  return true;
};

const validateColor = () => {
  const isDisponible = sectoresStore.isColorDisponible(
    sectorForm.value.color,
    isEditing.value ? props.sectorId : null
  );

  if (!isDisponible) {
    validationErrors.value.color = "Este color ya está en uso";
    return false;
  }
  validationErrors.value.color = "";
  return true;
};

const validateCoordinates = () => {
  if (sectorForm.value.coordenadas.length < 3) {
    validationErrors.value.coordenadas = "Se requieren al menos 3 puntos";
    return false;
  }
  validationErrors.value.coordenadas = "";
  return true;
};

const handleCoordinatesUpdate = (coordinates) => {
  sectorForm.value.coordenadas = coordinates;
  validateCoordinates();
};

const isFormValid = computed(() => {
  return (
    sectorForm.value.nombre.trim() !== "" &&
    sectorForm.value.coordenadas.length >= 3 &&
    !validationErrors.value.nombre &&
    !validationErrors.value.color &&
    !validationErrors.value.coordenadas
  );
});

const saveSector = async () => {
  // Validar todo
  const nameValid = validateName();
  const colorValid = validateColor();
  const coordsValid = validateCoordinates();

  if (!nameValid || !colorValid || !coordsValid) {
    return;
  }

  loading.value = true;

  try {
    const result = isEditing.value
      ? await sectoresStore.updateSector(props.sectorId, sectorForm.value)
      : await sectoresStore.createSector(sectorForm.value);

    if (result.success) {
      emit("saved");
    } else {
      // Mostrar error
      if (result.error.includes("nombre")) {
        validationErrors.value.nombre = result.error;
      } else if (result.error.includes("color")) {
        validationErrors.value.color = result.error;
      }
    }
  } catch (error) {
    console.error("Error al guardar sector:", error);
  } finally {
    loading.value = false;
  }
};

// Sector activo para el mapa
const activeSectorForMap = computed(() => ({
  nombre: sectorForm.value.nombre || "Nuevo Sector",
  color: sectorForm.value.color,
  coordenadas: sectorForm.value.coordenadas,
}));

// Otros sectores para mostrar en el mapa
const otherSectors = computed(() => {
  return sectoresStore.sectores
    .filter((s) => !isEditing.value || s.id !== props.sectorId)
    .map((s) => ({
      nombre: s.nombre,
      color: s.color,
      coordenadas: s.coordenadas,
    }));
});

const polygonArea = computed(() => {
  if (sectorForm.value.coordenadas.length < 3) return 0;

  let area = 0;
  const coords = sectorForm.value.coordenadas;

  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    area += coords[i].longitud * coords[j].latitud;
    area -= coords[j].longitud * coords[i].latitud;
  }

  area = Math.abs(area / 2);
  const kmSquared = area * 111 * 106;
  const hectares = kmSquared * 100;

  return hectares.toFixed(2);
});

// Verificar si un color está disponible para mostrarlo
const isColorAvailable = (colorValue) => {
  return availableColors.value.some((c) => c.value === colorValue);
};
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      @click.self="emit('close')"
    >
      <div
        class="bg-surface w-full h-full sm:h-auto sm:rounded-xl shadow-2xl sm:max-w-6xl sm:max-h-[95vh] flex flex-col border-0 sm:border border-border overflow-hidden"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between p-4 sm:p-6 border-b border-border shrink-0 bg-surface"
        >
          <div class="flex items-center gap-2 sm:gap-3 min-w-0">
            <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 center shrink-0">
              <Mountain class="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div class="min-w-0">
              <h3 class="text-lg sm:text-xl font-semibold text-neutral truncate">
                {{ isEditing ? "Editar Sector" : "Nuevo Sector" }}
              </h3>
              <p class="text-xs sm:text-sm text-secondary mt-0.5 sm:mt-1">
                Define el nombre, color y coordenadas del sector
              </p>
            </div>
          </div>
          <button
            @click="emit('close')"
            class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg hover:bg-hover center transition-colors shrink-0"
          >
            <X class="w-5 h-5 text-tertiary" />
          </button>
        </div>

        <!-- Contenido: Layout responsivo -->
        <div class="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          
          <!-- Panel izquierdo: Formulario -->
          <div class="w-full lg:w-96 flex flex-col border-b lg:border-b-0 lg:border-r border-border bg-surface shrink-0">
            <div class="flex-1 overflow-y-auto scrollbar-custom">
              <div class="p-4 sm:p-6 space-y-4 sm:space-y-5">
                
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
                    class="w-full text-sm sm:text-base"
                    :class="{ 'border-error': validationErrors.nombre }"
                  />
                  <p
                    v-if="validationErrors.nombre"
                    class="text-error text-xs mt-1 flex items-center gap-1"
                  >
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
                  <div class="grid grid-cols-4 gap-2.5">
                    <button
                      v-for="color in sectoresStore.availableColors"
                      :key="color.value"
                      @click="
                        sectorForm.color = color.value;
                        validateColor();
                      "
                      type="button"
                      :disabled="!isColorAvailable(color.value)"
                      class="aspect-square w-full rounded-lg transition-all border-2 relative"
                      :class="{
                        'ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900 border-primary':
                          sectorForm.color === color.value,
                        'border-slate-200 dark:border-slate-700':
                          sectorForm.color !== color.value,
                        'opacity-30 cursor-not-allowed': !isColorAvailable(
                          color.value
                        ),
                        'hover:scale-105 active:scale-95': isColorAvailable(
                          color.value
                        ),
                      }"
                      :style="{ backgroundColor: color.value }"
                      :title="
                        isColorAvailable(color.value)
                          ? color.name
                          : `${color.name} (en uso)`
                      "
                    >
                      <span
                        v-if="!isColorAvailable(color.value)"
                        class="absolute inset-0 flex items-center justify-center text-white font-bold text-lg bg-black/30 rounded-lg"
                      >
                        ×
                      </span>
                    </button>
                  </div>
                  <p
                    v-if="validationErrors.color"
                    class="text-error text-xs mt-1 flex items-center gap-1"
                  >
                    <AlertTriangle class="w-3 h-3" />
                    {{ validationErrors.color }}
                  </p>
                  <p
                    v-else-if="availableColors.length === 0"
                    class="text-warning text-xs mt-1 flex items-center gap-1"
                  >
                    <AlertTriangle class="w-3 h-3" />
                    No hay colores disponibles
                  </p>
                  <p v-else class="input-helper">
                    {{ availableColors.length }} color{{
                      availableColors.length !== 1 ? "es" : ""
                    }} disponible{{ availableColors.length !== 1 ? "s" : "" }}
                  </p>
                </div>

                <!-- Instrucciones de uso -->
                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div class="flex gap-2">
                    <MapPin class="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 class="text-sm font-semibold text-neutral mb-1">
                        Delimita el área en el mapa
                      </h4>
                      <p class="text-xs text-secondary">
                        Haz clic en el mapa para agregar puntos. Se necesitan mínimo 3 puntos para crear el polígono.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Lista de puntos -->
                <div v-if="sectorForm.coordenadas.length > 0" class="space-y-3">
                  <div class="flex items-center justify-between">
                    <h4 class="text-sm font-semibold text-neutral">
                      Puntos del Polígono
                    </h4>
                    <span class="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                      {{ sectorForm.coordenadas.length }} punto{{ sectorForm.coordenadas.length !== 1 ? "s" : "" }}
                    </span>
                  </div>

                  <div class="space-y-2 max-h-48 overflow-y-auto scrollbar-custom">
                    <div
                      v-for="(coord, index) in sectorForm.coordenadas"
                      :key="index"
                      class="bg-hover border border-border rounded-lg p-2.5 hover:shadow-sm transition-shadow group"
                    >
                      <div class="flex items-start gap-2.5">
                        <div
                          class="w-7 h-7 rounded-full center font-bold text-white text-xs shrink-0"
                          :style="{ backgroundColor: sectorForm.color }"
                        >
                          {{ coord.orden }}
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="font-mono text-[10px] space-y-0.5">
                            <div class="flex items-center gap-1.5">
                              <span class="text-tertiary w-7">Lat:</span>
                              <span class="text-neutral truncate">{{
                                coord.latitud.toFixed(6)
                              }}</span>
                            </div>
                            <div class="flex items-center gap-1.5">
                              <span class="text-tertiary w-7">Lng:</span>
                              <span class="text-neutral truncate">{{
                                coord.longitud.toFixed(6)
                              }}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          @click="
                            () => {
                              sectorForm.coordenadas.splice(index, 1);
                              sectorForm.coordenadas.forEach((c, i) => {
                                c.orden = i + 1;
                              });
                              handleCoordinatesUpdate(sectorForm.coordenadas);
                            }
                          "
                          class="w-7 h-7 rounded hover:bg-red-50 dark:hover:bg-red-900/30 center text-error transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                          title="Eliminar punto"
                        >
                          <Trash2 class="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Área calculada -->
                  <div
                    v-if="sectorForm.coordenadas.length >= 3"
                    class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 center shrink-0">
                          <MapPin class="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p class="text-xs text-secondary">Área estimada</p>
                          <p class="text-sm font-semibold text-neutral">
                            {{ polygonArea }} ha
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Error de coordenadas -->
                <div
                  v-if="validationErrors.coordenadas"
                  class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
                >
                  <p class="text-error text-xs flex items-center gap-1.5">
                    <AlertTriangle class="w-3.5 h-3.5" />
                    {{ validationErrors.coordenadas }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Panel derecho: Mapa -->
          <div class="flex-1 min-h-[300px] lg:min-h-0 relative bg-slate-100 dark:bg-slate-900">
            <div
              v-if="loading"
              class="absolute inset-0 bg-surface/80 backdrop-blur-sm flex items-center justify-center z-10"
            >
              <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-2"></div>
                <p class="text-sm text-secondary">Cargando mapa...</p>
              </div>
            </div>

            <PolygonMapPicker
              :sectors="otherSectors"
              :edit-mode="true"
              :active-sector="activeSectorForMap"
              :show-search="true"
              @update:coordinates="handleCoordinatesUpdate"
            />
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex flex-col-reverse sm:flex-row sm:items-center justify-between p-3 sm:p-4 border-t border-border bg-hover shrink-0 gap-3 sm:gap-4"
        >
          <div class="text-xs sm:text-sm text-center sm:text-left">
            <div v-if="sectorForm.coordenadas.length >= 3" class="flex items-center justify-center sm:justify-start gap-1.5 text-success">
              <CheckCircle2 class="w-4 h-4" />
              <span>{{ sectorForm.coordenadas.length }} puntos definidos</span>
            </div>
            <div v-else-if="sectorForm.coordenadas.length > 0" class="flex items-center justify-center sm:justify-start gap-1.5 text-warning">
              <AlertTriangle class="w-4 h-4" />
              <span>Faltan {{ 3 - sectorForm.coordenadas.length }} punto{{ 3 - sectorForm.coordenadas.length !== 1 ? "s" : "" }}</span>
            </div>
            <div v-else class="flex items-center justify-center sm:justify-start gap-1.5 text-tertiary">
              <MapPin class="w-4 h-4" />
              <span>Sin puntos agregados</span>
            </div>
          </div>
          
          <div class="flex gap-2.5 sm:gap-3">
            <button
              @click="emit('close')"
              type="button"
              class="flex-1 sm:flex-none btn-secondary px-5 sm:px-6 text-sm sm:text-base"
              :disabled="loading"
            >
              Cancelar
            </button>
            <button
              @click="saveSector"
              :disabled="!isFormValid || loading"
              type="button"
              class="flex-1 sm:flex-none btn px-5 sm:px-6 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Save v-if="isEditing" class="w-4 h-4" />
              <Plus v-else class="w-4 h-4" />
              <span>{{ isEditing ? "Guardar" : "Crear" }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
