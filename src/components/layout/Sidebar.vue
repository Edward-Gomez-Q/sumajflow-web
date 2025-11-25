<!-- src/components/layout/Sidebar.vue -->
<script setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSessionStore } from '@/stores/sessionStore'
import { useSidebarStore } from '@/stores/sidebarStore'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'
import { 
  ChevronLeft, 
  ChevronRight, 
  Search,
  Bell,
  User,
  Settings,
  Moon,
  Sun,
  LogOut,
  X
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const sessionStore = useSessionStore()
const sidebarStore = useSidebarStore()
const themeStore = useThemeStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const showUserMenu = ref(false)
const expandedItems = ref({})

const navigation = computed(() => 
  sidebarStore.getNavigationByRole(sessionStore.userRole)
)

const filteredNavigation = computed(() => {
  if (!searchQuery.value) return navigation.value
  
  const query = searchQuery.value.toLowerCase()
  return navigation.value.filter(item => 
    item.label.toLowerCase().includes(query)
  )
})

const userInitials = computed(() => {
  const nombres = sessionStore.user?.nombres || ''
  const apellido = sessionStore.user?.primerApellido || ''
  return `${nombres.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
})

const isActiveRoute = (itemRoute) => {
  return route.path === itemRoute || route.path.startsWith(itemRoute + '/')
}

const toggleItem = (itemId) => {
  expandedItems.value[itemId] = !expandedItems.value[itemId]
}

const handleNavigation = (item) => {
  if (item.children) {
    toggleItem(item.id)
  } else {
    router.push(item.route)
    sidebarStore.closeMobileSidebar()
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const toggleTheme = () => {
  themeStore.toggleTheme()
}
</script>

<template>
  <!-- Mobile Overlay -->
  <div 
    v-if="sidebarStore.isMobileOpen"
    class="fixed inset-0 bg-black/50 z-40 lg:hidden"
    @click="sidebarStore.closeMobileSidebar"
  ></div>

  <!-- Sidebar -->
  <aside
    class="fixed left-0 top-0 h-screen bg-surface border-r border-border z-50 transition-all duration-300 flex flex-col"
    :class="[
      sidebarStore.isCollapsed ? 'w-20' : 'w-72',
      sidebarStore.isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]"
  >
    <!-- Header con Logo -->
    <div class="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
      <div v-if="!sidebarStore.isCollapsed" class="flex items-center gap-3">
        <img 
          src="@/assets/logo/logo-light.png" 
          alt="SumajFlow" 
          class="h-8 w-auto dark:hidden"
        />
        <img 
          src="@/assets/logo/logo-dark.png" 
          alt="SumajFlow" 
          class="h-8 w-auto hidden dark:block"
        />
      </div>
      
      <!-- Toggle Button Desktop -->
      <button
        @click="sidebarStore.toggleSidebar"
        class="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-hover transition-colors"
      >
        <ChevronLeft v-if="!sidebarStore.isCollapsed" class="w-5 h-5 text-secondary" />
        <ChevronRight v-else class="w-5 h-5 text-secondary" />
      </button>

      <!-- Close Button Mobile -->
      <button
        @click="sidebarStore.closeMobileSidebar"
        class="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-hover transition-colors"
      >
        <X class="w-5 h-5 text-secondary" />
      </button>
    </div>

    <!-- Search -->
    <div v-if="!sidebarStore.isCollapsed" class="p-4 border-b border-border shrink-0">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar..."
          class="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto p-3 space-y-1">
      <div
        v-for="item in filteredNavigation"
        :key="item.id"
      >
        <!-- Item principal -->
        <button
          @click="handleNavigation(item)"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group"
          :class="[
            isActiveRoute(item.route) 
              ? 'bg-primary text-white' 
              : 'text-secondary hover:bg-hover hover:text-neutral',
            sidebarStore.isCollapsed ? 'justify-center' : ''
          ]"
          :title="sidebarStore.isCollapsed ? item.label : ''"
        >
          <component 
            :is="item.icon" 
            class="w-5 h-5 shrink-0"
            :class="isActiveRoute(item.route) ? 'text-white' : ''"
          />
          
          <span 
            v-if="!sidebarStore.isCollapsed" 
            class="flex-1 text-left text-sm font-medium"
          >
            {{ item.label }}
          </span>

          <span 
            v-if="item.badge && !sidebarStore.isCollapsed"
            class="px-2 py-0.5 text-xs font-semibold rounded-full"
            :class="isActiveRoute(item.route) ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'"
          >
            {{ item.badge }}
          </span>

          <ChevronRight 
            v-if="item.children && !sidebarStore.isCollapsed"
            class="w-4 h-4 transition-transform"
            :class="expandedItems[item.id] ? 'rotate-90' : ''"
          />
        </button>

        <!-- Subitems -->
        <div 
          v-if="item.children && expandedItems[item.id] && !sidebarStore.isCollapsed"
          class="ml-8 mt-1 space-y-1"
        >
          <button
            v-for="child in item.children"
            :key="child.id"
            @click="router.push(child.route); sidebarStore.closeMobileSidebar()"
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all"
            :class="[
              isActiveRoute(child.route)
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-secondary hover:bg-hover hover:text-neutral'
            ]"
          >
            <span>{{ child.label }}</span>
            <span 
              v-if="child.badge"
              class="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary"
            >
              {{ child.badge }}
            </span>
          </button>
        </div>
      </div>
    </nav>

    <!-- User Section -->
    <div class="border-t border-border p-3 shrink-0">
      <div class="relative">
        <button
          @click="showUserMenu = !showUserMenu"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-hover transition-all"
          :class="sidebarStore.isCollapsed ? 'justify-center' : ''"
        >
          <!-- Avatar con iniciales -->
          <div class="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold shrink-0">
            {{ userInitials }}
          </div>

          <div v-if="!sidebarStore.isCollapsed" class="flex-1 text-left min-w-0">
            <p class="text-sm font-medium text-neutral truncate">
              {{ sessionStore.user?.nombres }} {{ sessionStore.user?.primerApellido }}
            </p>
            <p class="text-xs text-tertiary truncate capitalize">
              {{ sessionStore.userRole }}
            </p>
          </div>

          <Bell 
            v-if="!sidebarStore.isCollapsed"
            class="w-5 h-5 text-secondary shrink-0" 
          />
        </button>

        <!-- User Menu Dropdown -->
        <div
          v-if="showUserMenu && !sidebarStore.isCollapsed"
          v-click-outside="() => showUserMenu = false"
          class="absolute bottom-full left-0 right-0 mb-2 bg-surface border border-border rounded-lg shadow-elevated overflow-hidden"
        >
          <button
            @click="router.push(`/${sessionStore.userRole}/perfil`); showUserMenu = false"
            class="w-full flex items-center gap-3 px-4 py-3 hover:bg-hover transition-colors text-left"
          >
            <User class="w-4 h-4 text-secondary" />
            <span class="text-sm text-neutral">Mi Cuenta</span>
          </button>

          <button
            @click="toggleTheme(); showUserMenu = false"
            class="w-full flex items-center gap-3 px-4 py-3 hover:bg-hover transition-colors text-left"
          >
            <Sun v-if="themeStore.isDark" class="w-4 h-4 text-secondary" />
            <Moon v-else class="w-4 h-4 text-secondary" />
            <span class="text-sm text-neutral">
              {{ themeStore.isDark ? 'Modo Claro' : 'Modo Oscuro' }}
            </span>
          </button>

          <div class="border-t border-border"></div>

          <button
            @click="handleLogout"
            class="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
          >
            <LogOut class="w-4 h-4 text-error" />
            <span class="text-sm text-error">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>