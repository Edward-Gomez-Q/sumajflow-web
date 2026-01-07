// src/stores/sidebarStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  LayoutDashboard, 
  Users, 
  Mountain, 
  Package, 
  TrendingUp,
  FileText,
  Settings,
  Building2,
  Truck,
  Factory,
  Scale,
  ClipboardList,
  BarChart3,
  UserCog
} from 'lucide-vue-next'

export const useSidebarStore = defineStore('sidebar', () => {
  // State
  const isCollapsed = ref(false)
  const isMobileOpen = ref(false)

  // Configuración de navegación por rol
  const navigationConfig = {
    cooperativa: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        route: '/cooperativa',
        badge: null
      },
      {
        id: 'socios',
        label: 'Gestión de Socios',
        icon: Users,
        route: '/cooperativa/socios',
        badge: null,
        children: [
          {
            id: 'lista-socios',
            label: 'Lista de Socios',
            route: '/cooperativa/socios/lista'
          },
          {
            id: 'solicitudes',
            label: 'Solicitudes Pendientes',
            route: '/cooperativa/socios/solicitudes'
          }
        ]
      },
      {
        id: 'Transportistas',
        label: 'Transportistas',
        icon: Truck,
        route: '/cooperativa/transportistas',
        badge: null,
        children:[
          {
            id: 'lista-transportistas',
            label: 'Lista de Transportistas',
            route: '/cooperativa/transportistas/lista'
          },
          {
            id: 'invitaciones-transportistas',
            label: 'Invitaciones a Transportistas',
            route: '/cooperativa/transportistas/invitaciones'
          }
        ]
      },
      {
        id: 'sectores',
        label: 'Sectores',
        icon: Mountain,
        route: '/cooperativa/sectores',
        badge: null
      },
      {
        id: 'lotes',
        label: 'Lotes',
        icon: Package,
        route: '/cooperativa/lotes',
        badge: null,
        children: [
          {
            id: 'lista-lotes',
            label: 'Lista de Lotes',
            route: '/cooperativa/lotes'
          },
          {
            id: 'solicitudes-lotes',
            label: 'Solicitudes de Lotes',
            route: '/cooperativa/lotes/solicitudes',
          },
        ]
      },
      {
        id: 'balanza',
        label: 'Balanza',
        icon: Scale,
        route: '/cooperativa/balanza',
        badge: null
      },
      {
        id: 'reportes',
        label: 'Reportes',
        icon: BarChart3,
        route: '/cooperativa/reportes',
        badge: null
      },
      {
        id: 'configuracion',
        label: 'Configuración',
        icon: Settings,
        route: '/cooperativa/configuracion',
        badge: null
      }
    ],
    socio: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        route: '/socio',
        badge: null
      },
      {
        id: 'minas',
        label: 'Mis Minas',
        icon: Mountain,
        route: '/socio/minas',
        badge: null
      },
      {
        id: 'lotes',
        label: 'Mis Lotes',
        icon: Package,
        route: '/socio/lotes',
        badge: null
      },
      {
        id: 'liquidaciones',
        label: 'Liquidaciones',
        icon: FileText,
        route: '/socio/liquidaciones',
        badge: null
      },
      {
        id: 'perfil',
        label: 'Mi Perfil',
        icon: UserCog,
        route: '/socio/perfil',
        badge: null
      }
    ],
    ingenio: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        route: '/ingenio',
        badge: null
      },
      {
        id: 'almacen',
        label: 'Almacén',
        icon: Building2,
        route: '/ingenio/almacen',
        badge: null
      },
      {
        id: 'balanza',
        label: 'Balanza',
        icon: Scale,
        route: '/ingenio/balanza',
        badge: null
      },
      {
        id: 'lotes',
        label: 'Lotes',
        icon: Package,
        route: '/ingenio/lotes',
        badge: null
      },
      {
        id: 'recepciones',
        label: 'Recepciones',
        icon: ClipboardList,
        route: '/ingenio/recepciones',
        badge: null
      },
      {
        id: 'procesamiento',
        label: 'Procesamiento',
        icon: Factory,
        route: '/ingenio/procesamiento',
        badge: null
      },
      {
        id: 'inventario',
        label: 'Inventario',
        icon: Package,
        route: '/ingenio/inventario',
        badge: null
      },
      {
        id: 'reportes',
        label: 'Reportes',
        icon: BarChart3,
        route: '/ingenio/reportes',
        badge: null
      },
      {
        id: 'configuracion',
        label: 'Configuración',
        icon: Settings,
        route: '/ingenio/configuracion',
        badge: null
      }
    ],
    comercializadora: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        route: '/comercializadora',
        badge: null
      },
      {
        id: 'almacen',
        label: 'Almacén',
        icon: Building2,
        route: '/comercializadora/almacen',
        badge: null
      },
      {
        id: 'balanza',
        label: 'Balanza',
        icon: Scale,
        route: '/comercializadora/balanza',
        badge: null
      },
      {
        id: 'lotes',
        label: 'Lotes',
        icon: Package,
        route: '/comercializadora/lotes',
        badge: null
      },
      {
        id: 'compras',
        label: 'Compras',
        icon: TrendingUp,
        route: '/comercializadora/compras',
        badge: null
      },
      {
        id: 'inventario',
        label: 'Inventario',
        icon: Package,
        route: '/comercializadora/inventario',
        badge: null
      },
      {
        id: 'ventas',
        label: 'Ventas',
        icon: FileText,
        route: '/comercializadora/ventas',
        badge: null
      },
      {
        id: 'reportes',
        label: 'Reportes',
        icon: BarChart3,
        route: '/comercializadora/reportes',
        badge: null
      },
      {
        id: 'configuracion',
        label: 'Configuración',
        icon: Settings,
        route: '/comercializadora/configuracion',
        badge: null
      }
    ]
  }

  // Getters
  const getNavigationByRole = computed(() => {
    return (role) => navigationConfig[role] || []
  })

  // Actions
  const toggleSidebar = () => {
    isCollapsed.value = !isCollapsed.value
  }

  const toggleMobileSidebar = () => {
    isMobileOpen.value = !isMobileOpen.value
  }

  const closeMobileSidebar = () => {
    isMobileOpen.value = false
  }

  const setCollapsed = (value) => {
    isCollapsed.value = value
  }

  return {
    // State
    isCollapsed,
    isMobileOpen,
    navigationConfig,
    
    // Getters
    getNavigationByRole,
    
    // Actions
    toggleSidebar,
    toggleMobileSidebar,
    closeMobileSidebar,
    setCollapsed
  }
})