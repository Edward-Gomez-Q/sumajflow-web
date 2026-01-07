// src/router.js
import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from './stores/sessionStore'

const routes = [
  {
    path: '/',
    redirect: (to) => {
      const sessionStore = useSessionStore()
      if (sessionStore.isAuthenticated) {
        return `/${sessionStore.userRole}`
      }
      return '/login'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('./views/Login.vue'),
    meta: { 
      requiresGuest: true,
      title: 'Iniciar Sesión - SumajFlow'
    }
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: () => import('./views/Onboarding.vue'),
    meta: { 
      requiresGuest: true,
      title: 'Crear Cuenta - SumajFlow'
    }
  },
  
  // ========================================
  // RUTAS DE COOPERATIVA
  // ========================================
  {
    path: '/cooperativa',
    meta: { 
      requiresAuth: true,
      requiredRole: 'cooperativa'
    },
    children: [
      {
        path: '',
        name: 'CooperativaDashboard',
        component: () => import('./views/cooperativa/Dashboard.vue'),
        meta: { 
          title: 'Dashboard - Cooperativa'
        }
      },
      {
        path: 'socios',
        name: 'CooperativaSocios',
        redirect: { name: 'CooperativaSociosLista' }
      },
      {
        path: 'socios/lista',
        name: 'CooperativaSociosLista',
        component: () => import('./views/cooperativa/SocioLista.vue'),
        meta: { 
          title: 'Lista de Socios - Cooperativa'
        }
      },
      {
        path: 'socios/solicitudes',
        name: 'CooperativaSolicitudes',
        component: () => import('./views/cooperativa/SocioSolicitudes.vue'),
        meta: { 
          title: 'Solicitudes Pendientes - Cooperativa'
        }
      },
      {
        path: 'sectores',
        name: 'CooperativaSectores',
        component: () => import('./views/cooperativa/Sectores.vue'),
        meta: { 
          title: 'Sectores - Cooperativa'
        }
      },
      {
        path: 'transportistas',
        name: 'CooperativaTransportistas',
        redirect: { name: 'CooperativaTransportistasLista' }
      },
      {
        path: 'transportistas/lista',
        name: 'CooperativaTransportistasLista',
        component: () => import('./views/cooperativa/TransportistaLista.vue'),
        meta: { 
          title: 'Transportistas - Cooperativa'
        }
      },
      {
        path: 'transportistas/invitaciones',
        name: 'CooperativaTransportistasInvitaciones',
        component: () => import('./views/cooperativa/InvitacionesLista.vue'),
        meta: { 
          title: 'Invitaciones de Transportistas - Cooperativa'
        }
      },
      {
        path: 'lotes',
        name: 'CooperativaLotes',
        component: () => import('./views/cooperativa/Lotes.vue'),
        meta: { 
          title: 'Lotes - Cooperativa'
        }
      },
            {
        path: 'lotes/solicitudes',
        name: 'CooperativaLotesAprobacion',
        component: () => import('./views/cooperativa/LotesAprobacion.vue'),
        meta: { 
          title: 'Lotes Solicitudes - Cooperativa'
        }
      },
      {
        path: 'balanza',
        name: 'CooperativaBalanza',
        component: () => import('./views/cooperativa/BalanzaCooperativa.vue'),
        meta: { 
          title: 'Balanza - Cooperativa'
        }
      },
      {
        path: 'perfil',
        name: 'CooperativaPerfil',
        component: () => import('./views/Profile.vue'),
        meta: { 
          title: 'Mi Perfil - Cooperativa'
        }
      },
      {
        path: 'notificaciones',
        name: 'CooperativaNotificaciones',
        component: () => import('./views/Notificaciones.vue'),
        meta: { 
          title: 'Notificaciones - Cooperativa'
        }
      }
      
      /*{
        path: 'reportes',
        name: 'CooperativaReportes',
        component: () => import('./views/cooperativa/Reportes.vue'),
        meta: { 
          title: 'Reportes - Cooperativa'
        }
      },
      {
        path: 'configuracion',
        name: 'CooperativaConfiguracion',
        component: () => import('./views/cooperativa/Configuracion.vue'),
        meta: { 
          title: 'Configuración - Cooperativa'
        }
      }*/
    ]
  },

  // ========================================
  // RUTAS DE SOCIO
  // ========================================
  {
    path: '/socio',
    meta: { 
      requiresAuth: true,
      requiredRole: 'socio'
    },
    children: [
      {
        path: '',
        name: 'SocioDashboard',
        component: () => import('./views/socio/Dashboard.vue'),
        meta: { 
          title: 'Dashboard - Socio'
        }
      },
      {
        path: 'minas',
        name: 'SocioMinas',
        component: () => import('./views/socio/Minas.vue'),
        meta: { 
          title: 'Mis Minas - Socio'
        }
      },
      {
        path: 'lotes',
        name: 'SocioLotes',
        component: () => import('./views/socio/Lotes.vue'),
        meta: { 
          title: 'Mis Lotes - Socio'
        }
      },
      {
        path: 'perfil',
        name: 'SocioPerfil',
        component: () => import('./views/Profile.vue'),
        meta: { 
          title: 'Mi Perfil - Socio'
        }
      },
      {
        path: 'notificaciones',
        name: 'SocioNotificaciones',
        component: () => import('./views/Notificaciones.vue'),
        meta: { 
          title: 'Notificaciones - Socio'
        }
      }
      /*{
        path: 'liquidaciones',
        name: 'SocioLiquidaciones',
        component: () => import('./views/socio/Liquidaciones.vue'),
        meta: { 
          title: 'Liquidaciones - Socio'
        }
      },
      {
        path: 'perfil',
        name: 'SocioPerfil',
        component: () => import('./views/socio/Perfil.vue'),
        meta: { 
          title: 'Mi Perfil - Socio'
        }
      }*/
    ]
  },

  // ========================================
  // RUTAS DE INGENIO
  // ========================================
  {
    path: '/ingenio',
    meta: { 
      requiresAuth: true,
      requiredRole: 'ingenio'
    },
    children: [
      {
        path: '',
        name: 'IngenioDashboard',
        component: () => import('./views/ingenio/Dashboard.vue'),
        meta: { 
          title: 'Dashboard - Ingenio'
        }
      },
      {
        path: 'almacen',
        name: 'IngenioAlmacen',
        component: () => import('./views/ingenio/AlmacenIngenio.vue'),
        meta: { 
          title: 'Almacén - Ingenio'
        }
      },
      {
        path: 'balanza',
        name: 'IngenioBalanza',
        component: () => import('./views/ingenio/BalanzaIngenio.vue'),
        meta: { 
          title: 'Balanza - Ingenio'
        }
      },
      {
        path: 'perfil',
        name: 'IngenioPerfil',
        component: () => import('./views/Profile.vue'),
        meta: { 
          title: 'Mi Perfil - Ingenio'
        }
      },
      {
        path: 'notificaciones',
        name: 'IngenioNotificaciones',
        component: () => import('./views/Notificaciones.vue'),
        meta: { 
          title: 'Notificaciones - Ingenio'
        }
      },
      {
        path : 'lotes',
        name : 'IngenioLotes',
        component : () => import('./views/ingenio/Lotes.vue'),
        meta : {
          title : 'Lotes - Ingenio'
        }
      }
      /*{
        path: 'recepciones',
        name: 'IngenioRecepciones',
        component: () => import('./views/ingenio/Recepciones.vue'),
        meta: { 
          title: 'Recepciones - Ingenio'
        }
      },
      {
        path: 'procesamiento',
        name: 'IngenioProcesamiento',
        component: () => import('./views/ingenio/Procesamiento.vue'),
        meta: { 
          title: 'Procesamiento - Ingenio'
        }
      },
      {
        path: 'inventario',
        name: 'IngenioInventario',
        component: () => import('./views/ingenio/Inventario.vue'),
        meta: { 
          title: 'Inventario - Ingenio'
        }
      },
      {
        path: 'reportes',
        name: 'IngenioReportes',
        component: () => import('./views/ingenio/Reportes.vue'),
        meta: { 
          title: 'Reportes - Ingenio'
        }
      },
      {
        path: 'configuracion',
        name: 'IngenioConfiguracion',
        component: () => import('./views/ingenio/Configuracion.vue'),
        meta: { 
          title: 'Configuración - Ingenio'
        }
      }*/
    ]
  },

  // ========================================
  // RUTAS DE COMERCIALIZADORA
  // ========================================
  {
    path: '/comercializadora',
    meta: { 
      requiresAuth: true,
      requiredRole: 'comercializadora'
    },
    children: [
      {
        path: '',
        name: 'ComercializadoraDashboard',
        component: () => import('./views/comercializadora/Dashboard.vue'),
        meta: { 
          title: 'Dashboard - Comercializadora'
        }
      },
      {
        path: 'almacen',
        name: 'ComercializadoraAlmacen',
        component: () => import('./views/comercializadora/AlmacenComercializadora.vue'),
        meta: { 
          title: 'Almacén - Comercializadora'
        }
      },
      {
        path: 'balanza',
        name: 'ComercializadoraBalanza',
        component: () => import('./views/comercializadora/BalanzaComercializadora.vue'),
        meta: { 
          title: 'Balanza - Comercializadora'
        }
      },
      {
        path: 'perfil',
        name: 'ComercializadoraPerfil',
        component: () => import('./views/Profile.vue'),
        meta: { 
          title: 'Mi Perfil - Comercializadora'
        }
      },
      {
        path: 'notificaciones',
        name: 'ComercializadoraNotificaciones',
        component: () => import('./views/Notificaciones.vue'),
        meta: { 
          title: 'Notificaciones - Comercializadora'
        }
      },
      {
        path : 'lotes',
        name : 'ComercializadoraLotes',
        component : () => import('./views/comercializadora/Lotes.vue'),
        meta : {
          title : 'Lotes - Comercializadora'
        }
      }
      /*{
        path: 'compras',
        name: 'ComercializadoraCompras',
        component: () => import('./views/comercializadora/Compras.vue'),
        meta: { 
          title: 'Compras - Comercializadora'
        }
      },
      {
        path: 'inventario',
        name: 'ComercializadoraInventario',
        component: () => import('./views/comercializadora/Inventario.vue'),
        meta: { 
          title: 'Inventario - Comercializadora'
        }
      },
      {
        path: 'ventas',
        name: 'ComercializadoraVentas',
        component: () => import('./views/comercializadora/Ventas.vue'),
        meta: { 
          title: 'Ventas - Comercializadora'
        }
      },
      {
        path: 'reportes',
        name: 'ComercializadoraReportes',
        component: () => import('./views/comercializadora/Reportes.vue'),
        meta: { 
          title: 'Reportes - Comercializadora'
        }
      },
      {
        path: 'configuracion',
        name: 'ComercializadoraConfiguracion',
        component: () => import('./views/comercializadora/Configuracion.vue'),
        meta: { 
          title: 'Configuración - Comercializadora'
        }
      }*/
    ]
  },
  
  // ========================================
  // RUTAS DE ERROR
  // ========================================
  {
    path: '/forbidden',
    name: 'Forbidden',
    component: () => import('./views/Forbidden.vue'),
    meta: {
      title: 'Acceso Denegado - SumajFlow'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('./views/NotFound.vue'),
    meta: {
      title: 'Página no encontrada - SumajFlow'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Guard de navegación mejorado
router.beforeEach((to, from, next) => {
  const sessionStore = useSessionStore()
  
  // Actualizar título - combinar título de ruta hija con padre si existe
  const parentTitle = to.matched[0]?.meta?.title
  const childTitle = to.meta.title
  document.title = childTitle || parentTitle || 'SumajFlow'

  // Verificar autenticación
  if (to.meta.requiresAuth && !sessionStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  // Verificar rol - buscar en la cadena de rutas padres
  const requiredRole = to.matched.find(record => record.meta.requiredRole)?.meta.requiredRole
  if (requiredRole && sessionStore.userRole !== requiredRole) {
    next({ name: 'Forbidden' })
    return
  }

  // Redirigir autenticados fuera de login/register
  if (to.meta.requiresGuest && sessionStore.isAuthenticated) {
    next({ path: `/${sessionStore.userRole}` })
    return
  }

  next()
})

export default router