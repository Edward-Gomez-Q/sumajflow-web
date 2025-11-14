<script setup>
import { computed } from 'vue'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Users, FileText, Calendar } from 'lucide-vue-next'
import FileUpload from '@/components/common/FileUpload.vue'

const onboardingStore = useOnboardingStore()
const socioData = computed(() => onboardingStore.socioData)

const updateField = (field, value) => {
  onboardingStore.socioData = {
    ...socioData.value,
    [field]: value
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-lg bg-primary/10 center">
          <Users class="w-5 h-5 text-primary" />
        </div>
        <h2 class="text-2xl font-semibold text-neutral">Asociación a Cooperativa</h2>
      </div>
      
      <p class="text-sm text-secondary leading-relaxed">
        Completa los datos de tu afiliación a la cooperativa minera. Esta información será verificada por los administradores de la cooperativa antes de aprobar tu acceso.
      </p>
    </div>

    <!-- Form -->
    <div class="space-y-6">
      <!-- Cooperativa -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1">Cooperativa minera</h3>
          <p class="text-sm text-secondary leading-relaxed">
            Selecciona la cooperativa a la que perteneces o deseas afiliarte.
          </p>
        </div>

        <div class="input-group">
          <label for="cooperativa_id" class="input-label">
            Cooperativa <span class="text-error">*</span>
          </label>
          <select 
            id="cooperativa_id"
            v-model="socioData.cooperativa_id" 
            class="w-full" 
            required
          >
            <option value="">Seleccionar cooperativa</option>
            <option value="1">Cooperativa Minera Ejemplo</option>
          </select>
          <p class="input-helper">
            Si tu cooperativa no aparece en la lista, contacta con soporte
          </p>
        </div>
      </div>

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Datos de Afiliación -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1">Datos de afiliación</h3>
          <p class="text-sm text-secondary leading-relaxed">
            Proporciona los datos que aparecen en tu carnet de afiliación a la cooperativa.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="input-group">
            <label for="numero_socio" class="input-label">
              Número de Socio/Matrícula
            </label>
            <input 
              id="numero_socio"
              type="text" 
              :value="socioData.numero_socio" 
              @input="updateField('numero_socio', $event.target.value)" 
              class="w-full" 
              placeholder="Ej: SOC-2024-001"
            />
            <p class="input-helper">
              Número que aparece en tu carnet de socio
            </p>
          </div>

          <div class="input-group">
            <label for="fecha_afiliacion" class="input-label">
              Fecha de Afiliación <span class="text-error">*</span>
            </label>
            <input 
              id="fecha_afiliacion"
              type="date" 
              :value="socioData.fecha_afiliacion" 
              @input="updateField('fecha_afiliacion', $event.target.value)" 
              class="w-full" 
              required 
            />
            <p class="input-helper">
              Fecha en que te afiliaste a la cooperativa
            </p>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Documentación -->
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-neutral mb-1">Documentación requerida</h3>
          <p class="text-sm text-secondary leading-relaxed">
            Sube copias digitales de tu carnet de afiliación y tu carnet de identidad. Estos documentos serán revisados por la cooperativa para verificar tu identidad.
          </p>
        </div>

        <div class="space-y-4">
          <FileUpload 
            :model-value="socioData.carnet_afiliacion_url"
            @update:model-value="updateField('carnet_afiliacion_url', $event)"
            label="Carnet de Afiliación" 
            :required="true"
            helper-text="Documento que acredita tu afiliación a la cooperativa"
            folder="documentos-socios"
          />
          
          <FileUpload 
            :model-value="socioData.carnet_identidad_url"
            @update:model-value="updateField('carnet_identidad_url', $event)"
            label="Carnet de Identidad" 
            :required="true"
            helper-text="Documento de identidad vigente (anverso y reverso)"
            folder="documentos-socios"
          />
        </div>
      </div>

      <!-- Divider -->
      <div class="divider"></div>

      <!-- Info Notice -->
      <!-- Información contextual -->
      <div class="bg-info/10 border border-info/30 rounded-lg p-4">
        <div class="flex gap-3">
          <div class="text-info text-xl flex-shrink-0">
            <FileText class="w-5 h-5" />
          </div>
          <div class="text-sm">
            <p class="font-medium text-neutral mb-1">Proceso de verificación</p>
            <p class="text-secondary leading-relaxed">
              Tu solicitud será revisada por los administradores de la cooperativa. 
              Recibirás una notificación por correo electrónico cuando tu cuenta sea aprobada. 
              Este proceso puede tomar de 24 a 48 horas.
            </p>
          </div>
        </div>
      </div>


    </div>
  </div>
</template>

<style scoped>
.center {
  @apply flex justify-center items-center;
}
</style>