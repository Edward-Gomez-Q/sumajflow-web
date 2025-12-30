<!-- src/views/ingenio/LotesIngenio.vue -->
<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useLotesDestinoStore } from '@/stores/destino/lotesDestinoStore'
import AppLayout from '@/components/layout/AppLayout.vue'
import LotesDestinoList from '@/components/destino/LotesDestinoList.vue'

const lotesStore = useLotesDestinoStore()

onMounted(async () => {
  lotesStore.setTipoDestino('ingenio')
  await lotesStore.fetchLotesPendientes()
})

onUnmounted(() => {
  lotesStore.reset()
})
</script>

<template>
  <AppLayout>
    <LotesDestinoList 
      tipo-destino="ingenio"
      titulo="Aprobación de Lotes - Ingenio Minero"
      descripcion="Revisa y aprueba los lotes que serán procesados en tu planta"
    />
  </AppLayout>
</template>