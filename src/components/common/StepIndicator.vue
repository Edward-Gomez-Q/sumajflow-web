<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentStep: {
    type: Number,
    required: true
  },
  totalSteps: {
    type: Number,
    required: true
  },
  steps: {
    type: Array,
    default: () => []
  }
})

const progress = computed(() => {
  return Math.round((props.currentStep / props.totalSteps) * 100)
})
</script>

<template>
  <div class="w-full space-y-4">
    <!-- Progress bar -->
    <div class="relative">
      <div class="h-2 bg-border rounded-full overflow-hidden">
        <div 
          class="h-full bg-primary transition-all duration-500 ease-out"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
      <div class="absolute -top-6 text-xs font-medium text-tertiary" :style="{ left: `${progress}%`, transform: 'translateX(-50%)' }">
        {{ progress }}%
      </div>
    </div>

    <!-- Step indicators -->
    <div v-if="steps.length > 0" class="flex justify-between items-center">
      <div 
        v-for="(step, index) in steps" 
        :key="index"
        class="flex flex-col items-center flex-1"
      >
        <div 
          class="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-semibold transition-all duration-300"
          :class="[
            index + 1 < currentStep ? 'bg-primary text-white' : '',
            index + 1 === currentStep ? 'bg-primary text-white ring-4 ring-primary/20' : '',
            index + 1 > currentStep ? 'bg-hover text-tertiary' : ''
          ]"
        >
          <span v-if="index + 1 < currentStep">✓</span>
          <span v-else>{{ index + 1 }}</span>
        </div>
        <span 
          class="text-xs mt-2 text-center hidden sm:block"
          :class="[
            index + 1 <= currentStep ? 'text-neutral font-medium' : 'text-tertiary'
          ]"
        >
          {{ step }}
        </span>
      </div>
    </div>

    <!-- Simple counter for mobile -->
    <div v-else class="text-center">
      <span class="text-sm text-secondary">
        Paso <span class="font-semibold text-neutral">{{ currentStep }}</span> de {{ totalSteps }}
      </span>
    </div>
  </div>
</template>