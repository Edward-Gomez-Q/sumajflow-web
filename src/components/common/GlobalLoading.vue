<!-- src/components/common/GlobalLoading.vue -->
<script setup>
import { useUIStore } from '@/stores/uiStore'

const uiStore = useUIStore()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="uiStore.isLoading"
        class="fixed inset-0 z-[10002] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <div class="bg-surface rounded-xl shadow-2xl p-8 max-w-sm mx-4 border border-border">
          <div class="flex flex-col items-center gap-4">
            <!-- Spinner -->
            <div class="relative">
              <div class="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
              <div class="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>

            <!-- Mensaje -->
            <p class="text-neutral font-medium text-center">
              {{ uiStore.loadingMessage }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>