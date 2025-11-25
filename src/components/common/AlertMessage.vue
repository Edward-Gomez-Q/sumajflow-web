<!-- src/components/shared/AlertMessage.vue -->
<script setup>
import { computed } from 'vue'
import { 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  X 
} from 'lucide-vue-next'

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['info', 'success', 'warning', 'error'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  dismissible: {
    type: Boolean,
    default: false
  },
  icon: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['dismiss'])

const typeConfig = computed(() => {
  const configs = {
    info: {
      containerClass: 'bg-blue-100/70 dark:bg-blue-900/40 border-blue-400/60 dark:border-blue-700',
      iconBgClass: 'bg-blue-200/50 dark:bg-blue-800/50',
      iconTextClass: 'text-blue-700 dark:text-blue-300',
      icon: Info
    },
    success: {
      containerClass: 'bg-green-100/70 dark:bg-green-900/40 border-green-400/60 dark:border-green-700',
      iconBgClass: 'bg-green-200/50 dark:bg-green-800/50',
      iconTextClass: 'text-green-700 dark:text-green-300',
      icon: CheckCircle2
    },
    warning: {
      containerClass: 'bg-yellow-100/70 dark:bg-yellow-900/40 border-yellow-400/60 dark:border-yellow-700',
      iconBgClass: 'bg-yellow-200/50 dark:bg-yellow-800/50',
      iconTextClass: 'text-yellow-700 dark:text-yellow-300',
      icon: AlertTriangle
    },
    error: {
      containerClass: 'bg-red-100/70 dark:bg-red-900/40 border-red-400/60 dark:border-red-700',
      iconBgClass: 'bg-red-200/50 dark:bg-red-800/50',
      iconTextClass: 'text-red-700 dark:text-red-300',
      icon: AlertCircle
    }
  }
  return configs[props.type]
})

const iconComponent = computed(() => props.icon || typeConfig.value.icon)
</script>

<template>
  <div 
    class="border rounded-lg p-4 shadow-sm backdrop-blur-[2px] transition-all duration-200"
    :class="typeConfig.containerClass"
  >
    <div class="flex items-start gap-3">
      <div 
        class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        :class="typeConfig.iconBgClass"
      >
        <component 
          :is="iconComponent" 
          class="w-4 h-4"
          :class="typeConfig.iconTextClass"
        />
      </div>
      
      <div class="flex-1 text-sm">
        <p v-if="title" class="font-medium text-neutral mb-1">{{ title }}</p>
        <p class="text-secondary leading-relaxed">{{ message }}</p>
        <slot></slot>
      </div>

      <button
        v-if="dismissible"
        @click="emit('dismiss')"
        class="shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
        :class="typeConfig.iconTextClass"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>