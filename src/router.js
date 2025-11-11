import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from './stores/sessionStore'

const routes = [
  {
    path: '/',
    redirect: '/login'
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
  // Ruta 404
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

// Guard de navegación
router.beforeEach((to, from, next) => {
  const sessionStore = useSessionStore()
  
  // Actualizar título de la página
  document.title = to.meta.title || 'SumajFlow'

  // Verificar rutas que requieren autenticación
  if (to.meta.requiresAuth && !sessionStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  // Verificar rutas que requieren ser invitado (no autenticado)
  // Por ahora, redirige a login si está autenticado (hasta que tengas dashboard)
  if (to.meta.requiresGuest && sessionStore.isAuthenticated) {
    // Evitar bucle: si ya está intentando ir a login, permitir
    if (to.name === 'Login') {
      next()
      return
    }
    // Redirigir a login (cambiar por Dashboard cuando lo tengas)
    next({ name: 'Login' })
    return
  }

  next()
})

export default router