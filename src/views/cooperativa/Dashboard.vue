<template>
  <div class="min-h-screen bg-background p-8">
    <h1 class="text-3xl font-bold text-neutral">Dashboard - Cooperativa</h1>
    <p class="mt-4">Bienvenido, {{ sessionStore.user?.nombres }}</p>
    <button @click="handleLogout" class="mt-4 btn">Cerrar Sesión</button>
  </div>
</template>

<script setup>
import { useSessionStore } from '@/stores/sessionStore'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'

const sessionStore = useSessionStore()
const authStore = useAuthStore()
const router = useRouter()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>