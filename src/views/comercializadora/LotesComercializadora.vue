<!-- src/views/comercializadora/LotesComercializadora.vue -->
<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useLotesDestinoStore } from '@/stores/destino/lotesDestinoStore'
import AppLayout from '@/components/layout/AppLayout.vue'
import LotesDestinoList from '@/components/destino/LotesDestinoList.vue'

const lotesStore = useLotesDestinoStore()

onMounted(async () => {
  lotesStore.setTipoDestino('comercializadora')
  await lotesStore.fetchLotesPendientes()
})

onUnmounted(() => {
  lotesStore.reset()
})
</script>

<template>
  <AppLayout>
    <LotesDestinoList 
      tipo-destino="comercializadora"
      titulo="Aprobación de Lotes - Comercializadora"
      descripcion="Revisa y aprueba los lotes de mineral que recibirás"
    />
  </AppLayout>
</template>