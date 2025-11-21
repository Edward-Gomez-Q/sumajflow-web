import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from './stores/sessionStore'

const routes = [
  {
    path: '/',
    redirect: (to) => {
      const sessionStore = useSessionStore()
      if (sessionStore.isAuthenticated) {
        // Redirigir según rol
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
  
  // === RUTAS PROTEGIDAS POR ROL ===
  {
    path: '/cooperativa',
    name: 'CooperativaDashboard',
    component: () => import('./views/cooperativa/Dashboard.vue'),
    meta: { 
      requiresAuth: true,
      requiredRole: 'cooperativa',
      title: 'Dashboard - Cooperativa'
    }
  },
  {
    path: '/socio',
    name: 'SocioDashboard',
    component: () => import('./views/socio/Dashboard.vue'),
    meta: { 
      requiresAuth: true,
      requiredRole: 'socio',
      title: 'Dashboard - Socio'
    }
  },
  {
    path: '/ingenio',
    name: 'IngenioDashboard',
    component: () => import('./views/ingenio/Dashboard.vue'),
    meta: { 
      requiresAuth: true,
      requiredRole: 'ingenio',
      title: 'Dashboard - Ingenio'
    }
  },
  {
    path: '/comercializadora',
    name: 'ComercializadoraDashboard',
    component: () => import('./views/comercializadora/Dashboard.vue'),
    meta: { 
      requiresAuth: true,
      requiredRole: 'comercializadora',
      title: 'Dashboard - Comercializadora'
    }
  },
  
  // === RUTA 403 - ACCESO DENEGADO ===
  {
    path: '/forbidden',
    name: 'Forbidden',
    component: () => import('./views/Forbidden.vue'),
    meta: {
      title: 'Acceso Denegado - SumajFlow'
    }
  },
  
  // === RUTA 404 ===
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
  
  // Actualizar título
  document.title = to.meta.title || 'SumajFlow'

  // Verificar autenticación
  if (to.meta.requiresAuth && !sessionStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  // Verificar rol
  if (to.meta.requiredRole && sessionStore.userRole !== to.meta.requiredRole) {
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