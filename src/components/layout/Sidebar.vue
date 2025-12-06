<!-- src/components/layout/Sidebar.vue -->
<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSessionStore } from '@/stores/sessionStore'
import { useSidebarStore } from '@/stores/sidebarStore'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'
import { useNotificacionStore } from '@/stores/notificacionStore' // ⬅️ NUEVO
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
  X,
  Check,
  AlertCircle,
  Info,
  Clock
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const sessionStore = useSessionStore()
const sidebarStore = useSidebarStore()
const themeStore = useThemeStore()
const authStore = useAuthStore()
const notificacionStore = useNotificacionStore()

const searchQuery = ref('')
const showUserMenu = ref(false)
const showNotifications = ref(false)
const expandedItems = ref({})

const notifications = computed(() => notificacionStore.ultimasTres)
const unreadNotifications = computed(() => notificacionStore.unreadCount)

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

const isActiveRoute = (item) => {
  if (item.children) {
    return item.children.some(child => route.path === child.route)
  }
  return route.path === item.route
}

const shouldBeExpanded = (item) => {
  if (!item.children) return false
  return item.children.some(child => route.path === child.route)
}

const initializeExpandedItems = () => {
  navigation.value.forEach(item => {
    if (shouldBeExpanded(item)) {
      expandedItems.value[item.id] = true
    }
  })
}

onMounted(() => {
  if (sessionStore.isAuthenticated) {
    notificacionStore.fetchNotificaciones()
  }
})

initializeExpandedItems()

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
  showUserMenu.value = false
  await authStore.logout()
  router.push('/login')
}

const toggleTheme = () => {
  themeStore.toggleTheme()
  showUserMenu.value = false
}

const goToProfile = () => {
  router.push(`/${sessionStore.userRole}/perfil`)
  showUserMenu.value = false
  sidebarStore.closeMobileSidebar()
}

const toggleNotifications = (event) => {
  event.stopPropagation()
  showUserMenu.value = false
  showNotifications.value = !showNotifications.value
}

const toggleUserMenu = (event) => {
  event.stopPropagation()
  showNotifications.value = false
  showUserMenu.value = !showUserMenu.value
}

const closeNotifications = () => {
  showNotifications.value = false
}

const closeUserMenu = () => {
  showUserMenu.value = false
}

const markNotificationAsRead = async (notificationId) => {
  await notificacionStore.marcarComoLeida(notificationId)
}

const markAllAsRead = async () => {
  await notificacionStore.marcarTodasComoLeidas()
}

const goToNotifications = () => {
  router.push(`/${sessionStore.userRole}/notificaciones`)
  showNotifications.value = false
  sidebarStore.closeMobileSidebar()
}

const getNotificationIcon = (type) => {
  switch (type) {
    case 'success': return Check
    case 'warning': return AlertCircle
    case 'info': return Info
    default: return Bell
  }
}

const getNotificationColor = (type) => {
  switch (type) {
    case 'success': return 'text-green-500'
    case 'warning': return 'text-amber-500'
    case 'info': return 'text-blue-500'
    default: return 'text-gray-500'
  }
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
    class="fixed left-0 top-0 bottom-0 h-full bg-surface border-r border-border z-50 transition-all duration-300 flex flex-col"
    :class="[
      sidebarStore.isCollapsed ? 'w-20' : 'w-72',
      sidebarStore.isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]"
  >
    <!-- Header con Logo -->
    <div class="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
      <div v-if="!sidebarStore.isCollapsed" class="flex items-center gap-3">
        <img 
          src="@/assets/logo/logo-text-dark.png" 
          alt="SumajFlow" 
          class="h-8 w-auto dark:hidden"
        />
        <img 
          src="@/assets/logo/logo-text-light.png" 
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
    <nav class="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-custom">
      <div
        v-for="item in filteredNavigation"
        :key="item.id"
      >
        <!-- Item principal -->
        <button
          @click="handleNavigation(item)"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group"
          :class="[
            isActiveRoute(item) 
              ? 'bg-primary text-white' 
              : 'text-secondary hover:bg-hover hover:text-neutral',
            sidebarStore.isCollapsed ? 'justify-center' : ''
          ]"
          :title="sidebarStore.isCollapsed ? item.label : ''"
        >
          <component 
            :is="item.icon" 
            class="w-5 h-5 shrink-0"
            :class="isActiveRoute(item) ? 'text-white' : ''"
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
            :class="isActiveRoute(item) ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'"
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
              route.path === child.route
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
        <div class="flex items-center gap-2">
          <!-- Avatar clickeable -->
          <button
            @click="goToProfile"
            class="flex items-center gap-3 flex-1 px-3 py-2.5 rounded-lg hover:bg-hover transition-all min-w-0"
            :class="sidebarStore.isCollapsed ? 'justify-center' : ''"
            :title="sidebarStore.isCollapsed ? 'Mi Cuenta' : ''"
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
          </button>

          <!-- Botón de notificaciones -->
          <div v-if="!sidebarStore.isCollapsed" class="relative">
            <button
              @click="toggleNotifications"
              class="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-hover transition-colors"
              title="Notificaciones"
            >
              <Bell class="w-5 h-5 text-secondary" />
              <span 
                v-if="unreadNotifications > 0"
                class="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"
              ></span>
            </button>

            <!-- Panel de Notificaciones -->
            <transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div
                v-if="showNotifications"
                v-click-outside="closeNotifications"
                class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 bg-surface border border-border rounded-lg shadow-elevated overflow-hidden z-100"
              >
                <!-- Contenido del panel (sin cambios) -->
                <div class="p-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-semibold text-neutral">Notificaciones</h3>
                    <p class="text-xs text-tertiary mt-0.5">
                      {{ unreadNotifications }} sin leer
                    </p>
                  </div>
                  <button
                    v-if="unreadNotifications > 0"
                    @click="markAllAsRead"
                    class="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    Marcar todas
                  </button>
                </div>

                <div class="max-h-96 overflow-y-auto scrollbar-custom">
                  <button
                    v-for="notification in notifications"
                    :key="notification.id"
                    @click="markNotificationAsRead(notification.id)"
                    class="w-full p-4 hover:bg-hover transition-colors text-left border-b border-border last:border-b-0"
                    :class="!notification.read ? 'bg-primary/5' : ''"
                  >
                    <div class="flex gap-3">
                      <div 
                        class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        :class="notification.read ? 'bg-gray-100 dark:bg-gray-800' : 'bg-primary/10'"
                      >
                        <component 
                          :is="getNotificationIcon(notification.tipo)" 
                          class="w-4 h-4"
                          :class="getNotificationColor(notification.tipo)"
                        />
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between gap-2 mb-1">
                          <p class="text-sm font-medium text-neutral">
                            {{ notification.titulo }}
                          </p>
                          <span 
                            v-if="!notification.leido"
                            class="w-2 h-2 bg-primary rounded-full shrink-0 mt-1"
                          ></span>
                        </div>
                        <p class="text-xs text-secondary mb-1">
                          {{ notification.mensaje }}
                        </p>
                        <div class="flex items-center gap-1 text-xs text-tertiary">
                          <Clock class="w-3 h-3" />
                          <span>{{ notification.time }}</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  <div 
                    v-if="notifications.length === 0"
                    class="p-8 text-center"
                  >
                    <Bell class="w-12 h-12 text-tertiary mx-auto mb-3" />
                    <p class="text-sm text-secondary">No hay notificaciones</p>
                  </div>
                </div>

                <div class="p-3 border-t border-border">
                  <button
                    @click="goToNotifications"
                    class="w-full py-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    Ver todas las notificaciones
                  </button>
                </div>
              </div>
            </transition>
          </div>

          <!-- Botón de menú -->
          <div v-if="!sidebarStore.isCollapsed" class="relative">
            <button
              @click="toggleUserMenu"
              class="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-hover transition-colors"
              title="Configuración"
            >
              <Settings class="w-5 h-5 text-secondary" />
            </button>

            <!-- User Menu Dropdown -->
            <transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div
                v-if="showUserMenu"
                v-click-outside="closeUserMenu"
                class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 bg-surface border border-border rounded-lg shadow-elevated overflow-hidden z-100"
              >
                <button
                  @click="goToProfile"
                  class="w-full flex items-center gap-3 px-4 py-3 hover:bg-hover transition-colors text-left"
                >
                  <User class="w-4 h-4 text-secondary" />
                  <span class="text-sm text-neutral">Mi Cuenta</span>
                </button>

                <button
                  @click="toggleTheme"
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
            </transition>
          </div>
        </div>

      </div>
    </div>
  </aside>
</template>