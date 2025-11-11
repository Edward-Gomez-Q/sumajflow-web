<script setup>
import { computed } from 'vue'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Users, Building2, Factory, Briefcase, CheckCircle2 } from 'lucide-vue-next'

const onboardingStore = useOnboardingStore()
const selectedRole = computed(() => onboardingStore.selectedRole)

const roles = [
  {
    id: 'socio',
    title: 'Socio Productor',
    subtitle: 'de Cooperativa',
    icon: 'Users',
    description: 'Soy un minero asociado a una cooperativa y quiero registrar mi producción',
    image: '/assets/images/roles/Socio.png',
    features: ['Registro de producción', 'Control de ventas', 'Historial detallado']
  },
  {
    id: 'cooperativa',
    title: 'Cooperativa',
    subtitle: 'Minera',
    icon: 'Building2',
    description: 'Represento una cooperativa minera y gestiono a los socios productores',
    image: '/assets/images/roles/Cooperativa.png',
    features: ['Gestión de socios', 'Control de operaciones', 'Reportes generales']
  },
  {
    id: 'ingenio',
    title: 'Ingenio',
    subtitle: 'Minero',
    icon: 'Factory',
    description: 'Opero una planta de procesamiento de minerales',
    image: '/assets/images/roles/Ingenio.png',
    features: ['Procesamiento', 'Control de calidad', 'Gestión de inventario']
  },
  {
    id: 'comercializadora',
    title: 'Comercializadora',
    subtitle: 'Minera',
    icon: 'Briefcase',
    description: 'Comercializo concentrados de minerales en el mercado',
    image: '/assets/images/roles/Comercializadora.png',
    features: ['Gestión de ventas', 'Seguimiento de envíos', 'Control de contratos']
  }
]

const getIcon = (iconName) => {
  const icons = { Users, Building2, Factory, Briefcase }
  return icons[iconName]
}

const selectRole = (roleId) => {
  onboardingStore.setRole(roleId)
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="text-center">
      <h2 class="text-2xl font-semibold text-neutral mb-2">
        Selecciona tu rol en la cadena minera
      </h2>
      <p class="text-sm text-secondary leading-relaxed max-w-2xl mx-auto">
        Elige el tipo de actor que representas. Esto personalizará tu experiencia en SumajFlow
        y te dará acceso a las herramientas específicas para tu actividad.
      </p>
    </div>

    <!-- Roles Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
      <button
        v-for="role in roles"
        :key="role.id"
        type="button"
        @click="selectRole(role.id)"
        class="role-card"
        :class="{
          'role-card-selected': selectedRole === role.id
        }"
      >
        <div class="card h-full transition-all duration-300">
          <!-- Badge seleccionado -->
          <div
            v-if="selectedRole === role.id"
            class="role-badge"
          >
            <CheckCircle2 class="w-6 h-6" />
          </div>

          <!-- Imagen o Icono -->
          <div class="mb-5">
            <div class="role-icon-container">
              <!-- Aquí puedes usar la imagen -->
              <img
                v-if="role.image"
                :src="role.image"
                :alt="role.title"
                class="w-full h-full object-cover"
                @error="$event.target.style.display = 'none'"
              />
              <!-- Fallback al icono si no hay imagen -->
              <component
                :is="getIcon(role.icon)"
                class="role-icon"
                :class="{
                  'role-icon-selected': selectedRole === role.id
                }"
              />
            </div>
          </div>

          <!-- Contenido -->
          <div class="space-y-3">
            <div class="text-center">
              <h3 class="text-lg font-semibold text-neutral mb-0.5">
                {{ role.title }}
              </h3>
              <p class="text-sm font-medium" style="color: var(--color-primary)">
                {{ role.subtitle }}
              </p>
            </div>

            <p class="text-sm text-secondary text-center leading-relaxed">
              {{ role.description }}
            </p>

          </div>
        </div>
      </button>
    </div>

    <!-- Divider -->
    <div class="divider"></div>

    <!-- Info adicional (sin box azul) -->
    <div class="max-w-2xl mx-auto text-center">
      <p class="text-sm text-secondary leading-relaxed">
        <span class="font-medium text-neutral">¿No estás seguro de tu rol?</span>
        No te preocupes, podrás contactar con soporte después del registro si necesitas
        cambiar tu rol o si tienes dudas sobre cuál seleccionar.
      </p>
    </div>
  </div>
</template>

<style scoped>
.roles-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  max-width: 80rem;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .roles-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.role-card {
  position: relative;
  text-align: left;
  transition: all 0.3s;
}

.role-card-selected {
  transform: scale(1.02);
}

.role-card-selected .card {
  box-shadow: 0 0 0 2px var(--color-primary);
  background-color: color-mix(in srgb, var(--color-primary) 5%, var(--color-surface));
}

.role-card:hover .card {
  box-shadow: var(--shadow-elevated);
}

.role-badge {
  position: absolute;
  top: -0.75rem;
  right: -0.75rem;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  background-color: var(--color-primary);
  color: white;
  box-shadow: var(--shadow-elevated);
}

.role-icon-container {
  width: 5rem;
  height: 5rem;
  margin: 0 auto;
  border-radius: 0.75rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
}

.role-card-selected .role-icon-container {
  background-color: color-mix(in srgb, var(--color-primary) 15%, var(--color-surface));
}

.role-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: color-mix(in srgb, var(--color-primary) 70%, var(--color-neutral-tertiary));
}

.role-icon-selected {
  color: var(--color-primary);
}
</style>