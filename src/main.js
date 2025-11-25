// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './assets/css/main.css'
import App from './App.vue'
import { useSessionStore } from './stores/sessionStore'
import { useThemeStore } from './stores/themeStore'
import { usePublicDataStore } from './stores/publicDataStore'
import { clickOutside } from './directives/clickOutside'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.directive('click-outside', clickOutside)

const sessionStore = useSessionStore()
const themeStore = useThemeStore()
const publicDataStore = usePublicDataStore()

sessionStore.loadFromLocalStorage()
themeStore.loadFromLocalStorage()

publicDataStore.fetchCooperativas()
publicDataStore.fetchProcesos()
publicDataStore.fetchMinerales()

app.mount('#app')