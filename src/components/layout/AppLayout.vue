<!-- src/components/layout/AppLayout.vue -->
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSidebarStore } from '@/stores/sidebarStore'
import { Menu } from 'lucide-vue-next'
import Sidebar from './Sidebar.vue'

const route = useRoute()
const sidebarStore = useSidebarStore()

// Generar breadcrumbs desde la ruta actual
const breadcrumbs = computed(() => {
  const paths = route.path.split('/').filter(Boolean)
  return paths.map((path, index) => {
    const routePath = '/' + paths.slice(0, index + 1).join('/')
    return {
      label: path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' '),
      path: routePath,
      isLast: index === paths.length - 1
    }
  })
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <Sidebar />

    <!-- Main Content -->
    <div
      class="transition-all duration-300 min-h-screen flex flex-col"
      :class="sidebarStore.isCollapsed ? 'lg:ml-20' : 'lg:ml-72'"
    >
      <!-- Top Bar -->
      <div class="sticky top-0 z-30 h-16 bg-surface border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0">
        <!-- Mobile Menu Button -->
        <button
          @click="sidebarStore.toggleMobileSidebar"
          class="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-hover transition-colors"
        >
          <Menu class="w-5 h-5 text-secondary" />
        </button>

        <!-- Breadcrumbs -->
        <nav class="flex items-center gap-2 text-sm">
          <template v-for="(crumb, index) in breadcrumbs" :key="index">
            <router-link
              v-if="!crumb.isLast"
              :to="crumb.path"
              class="text-secondary hover:text-primary transition-colors"
            >
              {{ crumb.label }}
            </router-link>
            <span v-else class="text-neutral font-medium">
              {{ crumb.label }}
            </span>
            <span v-if="!crumb.isLast" class="text-tertiary">/</span>
          </template>
        </nav>

        <div class="w-10"></div>
      </div>

      <!-- Page Content -->
      <main class="flex-1 p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
        <slot />
      </main>
    </div>
  </div>
</template>