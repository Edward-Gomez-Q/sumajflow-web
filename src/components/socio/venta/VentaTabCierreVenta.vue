<script setup>
import { ref, computed, onMounted } from 'vue'
import { useVentaConcentradoStore } from '@/stores/socio/ventaConcentradoStore'
import { useUIStore } from '@/stores/uiStore'
import rutaApi from '@/assets/rutaApi.js'
import {
  DollarSign, CheckCircle2, Calculator, AlertCircle, TrendingDown, 
  Coins, RefreshCw, Info, Package, Scale
} from 'lucide-vue-next'

const props = defineProps({
  venta: { type: Object, required: true }
})
const emit = defineEmits(['actualizado', 'cerrado'])

const ventaStore = useVentaConcentradoStore()
const uiStore = useUIStore()

const yaCerrado = computed(() => ['cerrado', 'pagado'].includes(props.venta.estado))
const puedeCerrar = computed(() => props.venta.estado === 'esperando_cierre_venta')
const loadingCotizaciones = ref(false)
const cotizacionesData = ref(null)
const deduccionesConfig = ref([])
const tipoCambioRef = ref(6.96)

const MODO_DESARROLLO = false

const COTIZACIONES_MOCK = {
  data: {
    Pb: {
      nomenclatura: "Pb",
      nombre: "Plomo",
      cotizacionUsdTon: 2094.00,
      unidad: "USD/ton",
      dolarOficial: 6.96,
      fecha: "2026-02-07",
      fuente: "Metals-API (LME-LEAD)"
    },
    Zn: {
      nomenclatura: "Zn",
      nombre: "Zinc",
      cotizacionUsdTon: 3290.00,
      unidad: "USD/ton",
      dolarOficial: 6.96,
      fecha: "2026-02-07",
      fuente: "Metals-API (LME-ZNC)"
    },
    Ag: {
      nomenclatura: "Ag",
      nombre: "Plata",
      cotizacionUsdOz: 29.900000,
      unidad: "USD/oz",
      dolarOficial: 6.96,
      fecha: "2026-02-07",
      fuente: "Metals-API (LBXAG)"
    }
  },
  deducciones: [
    { codigo: "REGALIA_PB", concepto: "Regalía Minera - Plomo", porcentaje: 3.0, tipoDeduccion: "regalia", baseCalculo: "valor_bruto_principal", aplicaAMineral: "Pb", orden: 1 },
    { codigo: "REGALIA_ZN", concepto: "Regalía Minera - Zinc", porcentaje: 3.0, tipoDeduccion: "regalia", baseCalculo: "valor_bruto_principal", aplicaAMineral: "Zn", orden: 2 },
    { codigo: "REGALIA_AG", concepto: "Regalía Minera - Plata", porcentaje: 3.6, tipoDeduccion: "regalia", baseCalculo: "valor_bruto_ag", aplicaAMineral: "Ag", orden: 3 },
    { codigo: "APORTE_COOP", concepto: "Aporte a la Cooperativa", porcentaje: 3.0, tipoDeduccion: "aporte", baseCalculo: "valor_bruto_total", aplicaAMineral: "todos", orden: 4 },
    { codigo: "APORTE_CNS", concepto: "C.N.S", porcentaje: 1.8, tipoDeduccion: "aporte", baseCalculo: "valor_bruto_total", aplicaAMineral: "todos", orden: 5 },
    { codigo: "APORTE_COMIBOL", concepto: "COMIBOL", porcentaje: 1.0, tipoDeduccion: "aporte", baseCalculo: "valor_bruto_total", aplicaAMineral: "todos", orden: 6 },
    { codigo: "APORTE_FEDECOMIN", concepto: "FEDECOMIN", porcentaje: 1.0, tipoDeduccion: "aporte", baseCalculo: "valor_bruto_total", aplicaAMineral: "todos", orden: 7 },
    { codigo: "APORTE_FENCOMIN", concepto: "FENCOMIN", porcentaje: 0.4, tipoDeduccion: "aporte", baseCalculo: "valor_bruto_total", aplicaAMineral: "todos", orden: 8 }
  ],
  success: true,
  dolarOficial: 6.96
}

const form = ref({
  observaciones: ''
})

// Constante de conversión
const GRAMOS_POR_ONZA_TROY = 31.1034768

// ========== MONTAR Y CARGAR COTIZACIONES ==========
onMounted(async () => {
  if (puedeCerrar.value) {
    await cargarCotizaciones()
  }
})

const cargarCotizaciones = async () => {
  loadingCotizaciones.value = true
  try {
    if (MODO_DESARROLLO) {
      await new Promise(resolve => setTimeout(resolve, 800))
      cotizacionesData.value = COTIZACIONES_MOCK.data
      deduccionesConfig.value = COTIZACIONES_MOCK.deducciones
      tipoCambioRef.value = COTIZACIONES_MOCK.dolarOficial
      console.log('✅ [DESARROLLO] Cotizaciones y deducciones mock cargadas')
      return
    }

    const response = await fetch(`${rutaApi}/public/cotizaciones-minerales`)
    const data = await response.json()
    
    console.log('📥 Respuesta del servidor:', data)
    
    if (data.success) {
      cotizacionesData.value = data.data
      deduccionesConfig.value = data.deducciones || []
      tipoCambioRef.value = data.dolarOficial || 6.96
      
      console.log('✅ Cotizaciones cargadas:', cotizacionesData.value)
      console.log('✅ Deducciones cargadas:', deduccionesConfig.value)
      console.log('✅ Tipo de cambio:', tipoCambioRef.value)
    } else {
      throw new Error(data.message || 'Error al cargar cotizaciones y deducciones')
    }
  } catch (err) {
    console.error('❌ Error cargando datos:', err)
    uiStore.showError('Error al cargar cotizaciones: ' + err.message, 'Error')
  } finally {
    loadingCotizaciones.value = false
  }
}

// ========== DATOS BASE - CORREGIDO PARA ACCEDER A LA ESTRUCTURA CORRECTA ==========
const mineralPrincipal = computed(() => {
  // Obtener mineral principal desde concentrados o lotes
  if (props.venta.concentrados && props.venta.concentrados.length > 0) {
    return props.venta.concentrados[0].mineralPrincipal
  }
  if (props.venta.lotes && props.venta.lotes.length > 0) {
    return props.venta.lotes[0].tipoMineral || 'Pb'
  }
  return 'Pb'
})

const leyMineral = computed(() => 
  props.venta.reportesQuimicos?.reporteAcordado?.leyMineralPrincipal || 
  0
)

const leyAgGmt = computed(() => 
  props.venta.reportesQuimicos?.reporteAcordado?.leyAgGmt || 
  props.venta.reportesQuimicos?.reporteAcordado?.leyAgDm || 
  0
)

// ========== PESO OFICIAL - CORREGIDO PARA ACCEDER A venta.pesos ==========
const pesoFinalTms = computed(() => {
  if (props.venta.pesos?.pesoFinalTms && props.venta.pesos.pesoFinalTms > 0) {
    return props.venta.pesos.pesoFinalTms
  }
  if (props.venta.pesos?.pesoTms && props.venta.pesos.pesoTms > 0) {
    return props.venta.pesos.pesoTms
  }
  if (props.venta.pesos?.pesoTmh && props.venta.pesos.pesoTmh > 0) {
    return props.venta.pesos.pesoTmh
  }
  return 0
})

const infoPeso = computed(() => {
  if (props.venta.pesos?.pesoFinalTms && props.venta.pesos.pesoFinalTms > 0) {
    return {
      valor: props.venta.pesos.pesoFinalTms,
      tipo: 'Peso Final TMS',
      esFinal: true
    }
  }
  if (props.venta.pesos?.pesoTms && props.venta.pesos.pesoTms > 0) {
    return {
      valor: props.venta.pesos.pesoTms,
      tipo: 'Peso TMS (sin merma)',
      esFinal: false
    }
  }
  if (props.venta.pesos?.pesoTmh && props.venta.pesos.pesoTmh > 0) {
    return {
      valor: props.venta.pesos.pesoTmh,
      tipo: 'Peso TMH',
      esFinal: false
    }
  }
  return null
})

// ========== COTIZACIONES ==========
const cotizacionPrincipal = computed(() => {
  if (!cotizacionesData.value) return null
  const mineral = mineralPrincipal.value
  return cotizacionesData.value[mineral] || null
})

const cotizacionAg = computed(() => 
  cotizacionesData.value?.['Ag'] || null
)

const tipoCambio = computed(() => 
  tipoCambioRef.value || 6.96
)

// ========== CÁLCULOS DE VALOR ==========

// Contenido de Ag en oz/ton
const contenidoAgOzTon = computed(() => {
  if (!leyAgGmt.value || leyAgGmt.value <= 0) return 0
  return leyAgGmt.value / GRAMOS_POR_ONZA_TROY
})

// Valor por tonelada del mineral principal (USD/ton)
const valorPrincipalUsdTon = computed(() => {
  if (!cotizacionPrincipal.value || !leyMineral.value) return 0
  return (cotizacionPrincipal.value.cotizacionUsdTon * leyMineral.value) / 100
})

// Valor por tonelada de la plata (USD/ton)
const valorAgUsdTon = computed(() => {
  if (!cotizacionAg.value || contenidoAgOzTon.value <= 0) return 0
  return contenidoAgOzTon.value * cotizacionAg.value.cotizacionUsdOz
})

// Valor total por tonelada (USD/ton) - suma de ambos minerales
const valorTotalUsdTon = computed(() => 
  valorPrincipalUsdTon.value + valorAgUsdTon.value
)

// Valor bruto total (USD)
const valorBrutoTotal = computed(() => 
  valorTotalUsdTon.value * pesoFinalTms.value
)

// Valores brutos separados para deducciones
const valorBrutoPrincipal = computed(() => 
  valorPrincipalUsdTon.value * pesoFinalTms.value
)

const valorBrutoAg = computed(() => 
  valorAgUsdTon.value * pesoFinalTms.value
)

// ========== DEDUCCIONES DINÁMICAS ==========
const deducciones = computed(() => {
  if (!deduccionesConfig.value || deduccionesConfig.value.length === 0) {
    console.warn('⚠️ No hay deducciones configuradas')
    return []
  }

  const mineral = mineralPrincipal.value
  const deds = []

  console.log('🔍 Filtrando deducciones para mineral:', mineral)
  console.log('   Valor bruto principal:', valorBrutoPrincipal.value)
  console.log('   Valor bruto Ag:', valorBrutoAg.value)
  console.log('   Valor bruto total:', valorBrutoTotal.value)

  for (const config of deduccionesConfig.value) {
    // Filtrar por mineral aplicable
    if (config.aplicaAMineral && config.aplicaAMineral !== 'todos') {
      // Regalía de plata: solo si hay contenido
      if (config.aplicaAMineral === 'Ag' && valorBrutoAg.value <= 0) {
        console.log(`   ✗ Omitiendo ${config.concepto} (sin contenido de Ag)`)
        continue
      }
      // Regalía de mineral principal: solo si coincide
      if (config.aplicaAMineral !== 'Ag' && config.aplicaAMineral !== mineral) {
        console.log(`   ✗ Omitiendo ${config.concepto} (no aplica a ${mineral})`)
        continue
      }
    }

    // Determinar base de cálculo
    let baseValor = valorBrutoTotal.value
    if (config.baseCalculo === 'valor_bruto_principal') {
      baseValor = valorBrutoPrincipal.value
    } else if (config.baseCalculo === 'valor_bruto_ag') {
      baseValor = valorBrutoAg.value
    }

    const monto = baseValor * (config.porcentaje / 100)

    deds.push({
      concepto: config.concepto,
      porcentaje: config.porcentaje,
      monto: monto,
      tipo: config.tipoDeduccion,
      baseCalculo: config.baseCalculo,
      orden: config.orden
    })

    console.log(`   ✓ Aplicando ${config.concepto}: ${config.porcentaje}% × ${baseValor.toFixed(2)} = ${monto.toFixed(2)} USD`)
  }

  console.log(`✅ Total deducciones aplicables: ${deds.length}`)
  return deds.sort((a, b) => a.orden - b.orden)
})

const deduccionesPorTipo = computed(() => {
  const regalias = deducciones.value.filter(d => d.tipo === 'regalia')
  const aportes = deducciones.value.filter(d => d.tipo === 'aporte')
  
  return {
    regalias,
    aportes,
    totalRegalias: regalias.reduce((sum, d) => sum + d.monto, 0),
    totalAportes: aportes.reduce((sum, d) => sum + d.monto, 0)
  }
})

const totalDeducciones = computed(() =>
  deducciones.value.reduce((sum, d) => sum + d.monto, 0)
)

const valorNeto = computed(() => 
  valorBrutoTotal.value - totalDeducciones.value
)

const valorNetoBob = computed(() => 
  valorNeto.value * tipoCambio.value
)

// ========== ACCIÓN: CERRAR VENTA ==========
const cerrarVenta = async () => {
  const confirmacion = await uiStore.showConfirm(
    `¿Cerrar la venta por ${formatCurrency(valorNetoBob.value)}?\n\nEsta acción no se puede deshacer.`,
    'Confirmar Cierre de Venta'
  )
  if (!confirmacion) return

  const payload = {
    observaciones: form.value.observaciones
  }

  const resultado = await ventaStore.cerrarVenta(props.venta.id, payload)
  if (resultado.success) {
    emit('cerrado') // ✅ Esto está bien
  }
}

// ========== FORMATO ==========
const formatCurrency = (v, c = 'BOB') => {
  if (v === null || v === undefined) return '-'
  return new Intl.NumberFormat('es-BO', { 
    style: 'currency', 
    currency: c,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(v)
}

const formatNumber = (v, decimals = 2) => {
  if (v === null || v === undefined) return '0.00'
  return parseFloat(v).toFixed(decimals)
}
</script>

<template>
  <div class="space-y-6">
    <!-- ========== VENTA YA CERRADA ========== -->
    <div v-if="yaCerrado" class="space-y-4">
      <div class="bg-purple-500/10 rounded-xl p-4 border border-purple-500/30">
        <div class="flex items-start gap-3">
          <CheckCircle2 class="w-6 h-6 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div>
            <h3 class="font-semibold text-purple-600 dark:text-purple-400">
              Venta {{ venta.estado === 'pagado' ? 'Pagada' : 'Cerrada' }}
            </h3>
            <p class="text-sm text-neutral mt-1">
              {{ venta.estado === 'pagado'
                ? 'El pago ha sido confirmado por la comercializadora.'
                : 'Esperando confirmación de pago de la comercializadora.' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Resumen -->
      <div class="grid md:grid-cols-4 gap-4">
        <div class="bg-surface rounded-lg p-4 border border-border text-center">
          <p class="text-xs text-secondary mb-1">Cotización {{ mineralPrincipal }}</p>
          <p class="text-xl font-bold text-neutral">
            {{ formatCurrency(venta.cotizacionInternacionalUsd, 'USD') }}/ton
          </p>
        </div>
        <div class="bg-surface rounded-lg p-4 border border-border text-center">
          <p class="text-xs text-secondary mb-1">Valor Bruto</p>
          <p class="text-xl font-bold text-neutral">
            {{ formatCurrency(venta.valorBrutoUsd, 'USD') }}
          </p>
        </div>
        <div class="bg-red-500/10 rounded-lg p-4 border border-red-500/30 text-center">
          <p class="text-xs text-red-600 dark:text-red-400 mb-1">Deducciones</p>
          <p class="text-xl font-bold text-red-600 dark:text-red-400">
            -{{ formatCurrency(venta.totalDeduccionesUsd, 'USD') }}
          </p>
        </div>
        <div class="bg-primary/10 rounded-lg p-4 border border-primary/20 text-center">
          <p class="text-xs text-secondary mb-1">Valor Neto</p>
          <p class="text-xl font-bold text-primary">
            {{ formatCurrency(venta.valorNetoBob) }}
          </p>
          <p class="text-xs text-secondary mt-1">
            {{ formatCurrency(venta.valorNetoUsd, 'USD') }}
          </p>
        </div>
      </div>

      <!-- Deducciones -->
      <div v-if="venta.deducciones && venta.deducciones.length > 0">
        <h4 class="text-sm font-semibold text-neutral mb-3">Deducciones Aplicadas</h4>
        <div class="space-y-2">
          <div
            v-for="(ded, idx) in venta.deducciones"
            :key="idx"
            class="grid grid-cols-3 gap-2 items-center p-3 bg-surface rounded-lg border border-border text-sm"
          >
            <span class="font-medium text-neutral">{{ ded.nombre }}</span>
            <span class="text-center text-secondary">{{ formatNumber(ded.porcentaje) }}%</span>
            <span class="text-right font-medium text-red-600">
              {{ formatCurrency(ded.montoUsd, 'USD') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== FORMULARIO DE CIERRE ========== -->
    <div v-if="puedeCerrar" class="space-y-6">
      <!-- Loading -->
      <div v-if="loadingCotizaciones" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
        <p class="text-secondary">Cargando cotizaciones oficiales...</p>
      </div>

      <!-- Error -->
      <div v-else-if="!cotizacionesData" class="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <AlertCircle class="w-5 h-5 text-red-600 dark:text-red-400" />
            <span class="text-red-600 dark:text-red-400 font-medium">Error al cargar cotizaciones</span>
          </div>
          <button
            @click="cargarCotizaciones"
            class="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            <RefreshCw class="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>

      <!-- Contenido -->
      <div v-else class="space-y-6">
        <!-- Info -->
        <div class="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/30">
          <div class="flex items-start gap-3">
            <Info class="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div class="flex-1">
              <h4 class="font-semibold text-indigo-600 dark:text-indigo-400">Cierre Automático</h4>
              <p class="text-sm text-neutral mt-1">
                Cotizaciones de fuentes oficiales. Deducciones fijadas por ley.
              </p>
            </div>
          </div>
        </div>

        <!-- Datos Material -->
        <div class="bg-surface rounded-xl p-4 border border-border">
          <h4 class="text-sm font-semibold text-neutral mb-3 flex items-center gap-2">
            <Package class="w-4 h-4" />
            Datos del Material
          </h4>
          <div class="grid sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p class="text-xs text-secondary mb-1">Mineral Principal</p>
              <p class="font-medium text-neutral text-lg">{{ mineralPrincipal || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-secondary mb-1">Ley {{ mineralPrincipal }} (%)</p>
              <p class="font-bold text-neutral text-lg">{{ formatNumber(leyMineral) }}%</p>
            </div>
            <div>
              <p class="text-xs text-secondary mb-1">Ag (g/MT)</p>
              <p class="font-bold text-neutral text-lg">{{ formatNumber(leyAgGmt) }}</p>
            </div>
            <div>
              <p class="text-xs text-secondary mb-1">
                <Scale class="w-3 h-3 inline mr-1" />
                {{ infoPeso?.tipo || 'Peso' }}
              </p>
              <p class="font-bold text-neutral text-lg">{{ formatNumber(pesoFinalTms, 4) }} ton</p>
              <p v-if="infoPeso && !infoPeso.esFinal" class="text-xs text-yellow-600 mt-0.5">
                ⚠️ Usando peso sin merma final
              </p>
            </div>
          </div>
        </div>

        <!-- Cotizaciones -->
        <div class="bg-surface rounded-xl p-4 border border-border">
          <h4 class="text-sm font-semibold text-neutral mb-3 flex items-center gap-2">
            <Coins class="w-4 h-4" />
            Cotizaciones Oficiales
          </h4>
          <div class="grid md:grid-cols-3 gap-4">
            <!-- Principal -->
            <div v-if="cotizacionPrincipal" class="bg-hover rounded-lg p-4 border border-border">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-secondary">{{ mineralPrincipal }}</span>
                <span class="text-xs px-2 py-1 rounded-md bg-primary text-white font-semibold">
                  Principal
                </span>
              </div>
              <p class="text-2xl font-bold text-neutral mb-1">
                {{ formatCurrency(cotizacionPrincipal.cotizacionUsdTon, 'USD') }}
              </p>
              <p class="text-xs text-tertiary">{{ cotizacionPrincipal.fuente }}</p>
              <p class="text-xs text-tertiary">{{ cotizacionPrincipal.fecha }}</p>
            </div>

            <!-- Plata -->
            <div v-if="leyAgGmt > 0 && cotizacionAg" class="bg-hover rounded-lg p-4 border border-border">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-secondary">Plata (Ag)</span>
                <span class="text-xs px-2 py-1 rounded-md bg-yellow-500 text-white font-semibold">
                  Secundario
                </span>
              </div>
              <p class="text-2xl font-bold text-neutral mb-1">
                ${{ formatNumber(cotizacionAg.cotizacionUsdOz) }}
              </p>
              <p class="text-xs text-tertiary">{{ cotizacionAg.fuente }}</p>
              <p class="text-xs text-tertiary">{{ cotizacionAg.fecha }}</p>
            </div>

            <!-- TC -->
            <div class="bg-hover rounded-lg p-4 border border-border">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-secondary">Tipo de Cambio</span>
                <span class="text-xs px-2 py-1 rounded-md bg-green-600 text-white font-semibold">
                  Oficial
                </span>
              </div>
              <p class="text-2xl font-bold text-neutral mb-1">
                {{ formatNumber(tipoCambio) }} BOB
              </p>
              <p class="text-xs text-tertiary">por USD</p>
            </div>
          </div>
        </div>

        <!-- Cálculo -->
        <div class="bg-surface rounded-xl p-4 border border-border">
          <h4 class="text-sm font-semibold text-neutral mb-3 flex items-center gap-2">
            <Calculator class="w-4 h-4" />
            Valoración por Tonelada
          </h4>
          <div class="grid sm:grid-cols-4 gap-3 text-sm">
            <div class="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <p class="text-xs text-blue-600 dark:text-blue-400 mb-1">{{ mineralPrincipal }}</p>
              <p class="font-bold text-blue-600 dark:text-blue-400 text-lg">
                ${{ formatNumber(valorPrincipalUsdTon) }}
              </p>
              <p class="text-xs text-tertiary">USD/ton</p>
            </div>

            <div v-if="valorAgUsdTon > 0" class="text-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
              <p class="text-xs text-yellow-600 dark:text-yellow-400 mb-1">Ag ({{ formatNumber(contenidoAgOzTon, 3) }} oz/ton)</p>
              <p class="font-bold text-yellow-600 dark:text-yellow-400 text-lg">
                ${{ formatNumber(valorAgUsdTon) }}
              </p>
              <p class="text-xs text-tertiary">USD/ton</p>
            </div>

            <div class="text-center p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <p class="text-xs text-purple-600 dark:text-purple-400 mb-1">Valor Total TMS</p>
              <p class="font-bold text-purple-600 dark:text-purple-400 text-lg">
                ${{ formatNumber(valorTotalUsdTon) }}
              </p>
              <p class="text-xs text-tertiary">USD/ton</p>
            </div>

            <div class="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/30">
              <p class="text-xs text-green-600 dark:text-green-400 mb-1">Bruto Total</p>
              <p class="font-bold text-green-600 dark:text-green-400 text-lg">
                {{ formatCurrency(valorBrutoTotal, 'USD') }}
              </p>
              <p class="text-xs text-tertiary">{{ formatNumber(pesoFinalTms, 2) }} ton</p>
            </div>
          </div>
        </div>

        <!-- Deducciones -->
        <div>
          <h4 class="text-sm font-semibold text-neutral mb-3 flex items-center gap-2">
            <TrendingDown class="w-4 h-4" />
            Deducciones por Ley
          </h4>
          
          <!-- Regalías -->
          <div v-if="deduccionesPorTipo.regalias.length > 0" class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <h5 class="text-xs font-semibold text-neutral uppercase">Regalías Mineras</h5>
              <span class="text-xs font-bold text-red-600 dark:text-red-400">
                -{{ formatCurrency(deduccionesPorTipo.totalRegalias, 'USD') }}
              </span>
            </div>
            <div class="space-y-2">
              <div
                v-for="(ded, idx) in deduccionesPorTipo.regalias"
                :key="'regalia-' + idx"
                class="grid grid-cols-3 gap-2 items-center p-3 bg-red-500/10 rounded-lg border border-red-500/30 text-sm"
              >
                <span class="font-medium text-neutral">{{ ded.concepto }}</span>
                <span class="text-center text-secondary">{{ formatNumber(ded.porcentaje) }}%</span>
                <span class="text-right font-medium text-red-600 dark:text-red-400">
                  {{ formatCurrency(ded.monto, 'USD') }}
                </span>
              </div>
            </div>
          </div>

          <!-- Aportes -->
          <div v-if="deduccionesPorTipo.aportes.length > 0">
            <div class="flex items-center justify-between mb-2">
              <h5 class="text-xs font-semibold text-neutral uppercase">Aportes Obligatorios</h5>
              <span class="text-xs font-bold text-orange-600 dark:text-orange-400">
                -{{ formatCurrency(deduccionesPorTipo.totalAportes, 'USD') }}
              </span>
            </div>
            <div class="space-y-2">
              <div
                v-for="(ded, idx) in deduccionesPorTipo.aportes"
                :key="'aporte-' + idx"
                class="grid grid-cols-3 gap-2 items-center p-3 bg-orange-500/10 rounded-lg border border-orange-500/30 text-sm"
              >
                <span class="font-medium text-neutral">{{ ded.concepto }}</span>
                <span class="text-center text-secondary">{{ formatNumber(ded.porcentaje) }}%</span>
                <span class="text-right font-medium text-orange-600 dark:text-orange-400">
                  {{ formatCurrency(ded.monto, 'USD') }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Resultado Final -->
        <div class="bg-linear-to-br from-primary/10 to-primary/5 rounded-xl p-6 border-2 border-primary/20 text-center">
          <p class="text-sm text-secondary mb-2 font-medium">Valor Neto a Recibir</p>
          <p class="text-5xl font-bold text-primary mb-2">
            {{ formatCurrency(valorNetoBob) }}
          </p>
          <p class="text-lg text-secondary">
            {{ formatCurrency(valorNeto, 'USD') }}
          </p>
          <div class="mt-4 pt-4 border-t border-primary/20 grid grid-cols-3 gap-4 text-xs">
            <div>
              <p class="text-tertiary">Bruto</p>
              <p class="font-semibold text-neutral">{{ formatCurrency(valorBrutoTotal, 'USD') }}</p>
            </div>
            <div>
              <p class="text-tertiary">Deducciones</p>
              <p class="font-semibold text-red-600">-{{ formatCurrency(totalDeducciones, 'USD') }}</p>
            </div>
            <div>
              <p class="text-tertiary">TC</p>
              <p class="font-semibold text-neutral">{{ formatNumber(tipoCambio) }}</p>
            </div>
          </div>
        </div>

        <!-- Observaciones -->
        <div>
          <label class="block text-sm font-medium text-neutral mb-2">
            Observaciones (Opcional)
          </label>
          <textarea
            v-model="form.observaciones"
            rows="3"
            maxlength="500"
            placeholder="Comentarios adicionales..."
            class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral placeholder-tertiary focus:ring-2 focus:ring-primary focus:outline-none resize-none"
          ></textarea>
          <p class="text-xs text-tertiary mt-1">{{ form.observaciones.length }}/500</p>
        </div>

        <!-- Botón -->
        <button
          @click="cerrarVenta"
          :disabled="ventaStore.loadingCerrar || !pesoFinalTms || pesoFinalTms <= 0"
          class="w-full py-4 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <DollarSign v-if="!ventaStore.loadingCerrar" class="w-6 h-6" />
          <div v-else class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          {{ ventaStore.loadingCerrar 
            ? 'Cerrando venta...' 
            : `Cerrar Venta por ${formatCurrency(valorNetoBob)}` 
          }}
        </button>

        <!-- Advertencia -->
        <div class="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30">
          <p class="text-xs text-yellow-600 dark:text-yellow-400 text-center flex items-center justify-center gap-2">
            <AlertCircle class="w-4 h-4" />
            Esta acción es irreversible. Revisa los valores antes de confirmar.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>