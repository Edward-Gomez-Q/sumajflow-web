<!-- src/components/socio/venta/VentaTabCierreLote.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useVentaConcentradoStore } from '@/stores/socio/ventaConcentradoStore'
import { useUIStore } from '@/stores/uiStore'
import rutaApi from '@/assets/rutaApi.js'
import { useSessionStore } from '@/stores/sessionStore'
import {
  DollarSign, CheckCircle2, Calculator, AlertCircle, TrendingDown,
  Coins, RefreshCw, Info, Scale, Layers, Table2
} from 'lucide-vue-next'

const props = defineProps({
  venta: { type: Object, required: true }
})
const emit = defineEmits(['actualizado'])

const ventaStore = useVentaConcentradoStore()
const uiStore = useUIStore()
const sessionStore = useSessionStore()

const yaCerrado = computed(() => ['cerrado', 'pagado'].includes(props.venta.estado))
const puedeCerrar = computed(() => props.venta.estado === 'esperando_cierre_venta')

const loadingPrecios = ref(false)
const preciosData = ref(null)
const deduccionesConfig = ref([])
const tipoCambioRef = ref(6.96)
const errorPrecios = ref(null)

const form = ref({ observaciones: '' })

// ========== MONTAR Y CARGAR PRECIOS ==========
onMounted(async () => {
  if (puedeCerrar.value) {
    await cargarPrecios()
  }
})

const cargarPrecios = async () => {
  loadingPrecios.value = true
  errorPrecios.value = null
  try {
    const comercializadoraId = props.venta.comercializadoraId

    // Cargar tabla de precios de la comercializadora
    const response = await fetch(
      `${rutaApi}/public/tabla-precios-mineral?comercializadoraId=${comercializadoraId}`,
      { headers: { 'Authorization': `Bearer ${sessionStore.token}` } }
    )
    const data = await response.json()

    if (!data.success) throw new Error(data.message || 'Error al cargar tabla de precios')

    preciosData.value = data.data // { precios: [...], deducciones: [...], dolarOficial: 6.96 }
    deduccionesConfig.value = data.deducciones || []
    tipoCambioRef.value = data.dolarOficial || 6.96

  } catch (err) {
    console.error('❌ Error cargando precios:', err)
    errorPrecios.value = err.message
  } finally {
    loadingPrecios.value = false
  }
}

// ========== DATOS DEL REPORTE ACORDADO ==========
const leyPb = computed(() => props.venta.reporteAcordado?.leyPb || 0)
const leyZn = computed(() => props.venta.reporteAcordado?.leyZn || 0)
const leyAgDm = computed(() => props.venta.reporteAcordado?.leyAgDm || 0)

// ========== PESO ==========
const pesoToneladas = computed(() => {
  if (props.venta.pesoTmh && props.venta.pesoTmh > 0) return props.venta.pesoTmh
  if (props.venta.pesoTms && props.venta.pesoTms > 0) return props.venta.pesoTms
  // Fallback: peso en kg → ton
  const pesoKg = props.venta.pesoTotalEntrada || 0
  return pesoKg > 0 ? pesoKg / 1000 : 0
})

// ========== BUSCAR PRECIO EN TABLA ==========
const buscarPrecioEnTabla = (mineral, valor) => {
  if (!preciosData.value || !valor || valor <= 0) return 0
  const precios = Array.isArray(preciosData.value) ? preciosData.value : preciosData.value.precios || []

  const encontrado = precios.find(p =>
    p.mineral === mineral &&
    p.activo &&
    valor >= p.rangoMinimo &&
    valor <= p.rangoMaximo
  )

  if (encontrado) return encontrado.precioUsd

  // Si no encontró, buscar el tope (rango más alto)
  const rangos = precios
    .filter(p => p.mineral === mineral && p.activo)
    .sort((a, b) => b.rangoMaximo - a.rangoMaximo)

  if (rangos.length > 0 && valor > rangos[0].rangoMinimo) {
    return rangos[0].precioUsd
  }

  return 0
}

// ========== PRECIOS UNITARIOS ==========
const precioUnitarioPb = computed(() => buscarPrecioEnTabla('Pb', leyPb.value))
const precioUnitarioZn = computed(() => buscarPrecioEnTabla('Zn', leyZn.value))
const precioUnitarioAg = computed(() => buscarPrecioEnTabla('Ag', leyAgDm.value))

// ========== PRECIO POR TONELADA ==========
const precioPorTonPb = computed(() => precioUnitarioPb.value * leyPb.value)
const precioPorTonZn = computed(() => precioUnitarioZn.value * leyZn.value)
const precioPorTonAg = computed(() => precioUnitarioAg.value * leyAgDm.value)

// ========== VALOR BRUTO ==========
const valorBrutoPb = computed(() => precioPorTonPb.value * pesoToneladas.value)
const valorBrutoZn = computed(() => precioPorTonZn.value * pesoToneladas.value)
const valorBrutoAg = computed(() => precioPorTonAg.value * pesoToneladas.value)
const valorBrutoTotal = computed(() => valorBrutoPb.value + valorBrutoZn.value + valorBrutoAg.value)
const valorBrutoPrincipal = computed(() => valorBrutoPb.value + valorBrutoZn.value)

// ========== DEDUCCIONES ==========
const deducciones = computed(() => {
  if (!deduccionesConfig.value || deduccionesConfig.value.length === 0) return []

  const mineralPrincipal = valorBrutoPb.value >= valorBrutoZn.value ? 'Pb' : 'Zn'
  const deds = []

  for (const config of deduccionesConfig.value) {
    if (config.aplicaAMineral && config.aplicaAMineral !== 'todos') {
      if (config.aplicaAMineral === 'Ag' && valorBrutoAg.value <= 0) continue
      if (config.aplicaAMineral !== 'Ag' && config.aplicaAMineral !== mineralPrincipal) continue
    }

    let baseValor = valorBrutoTotal.value
    if (config.baseCalculo === 'valor_bruto_principal') baseValor = valorBrutoPrincipal.value
    else if (config.baseCalculo === 'valor_bruto_ag') baseValor = valorBrutoAg.value

    deds.push({
      concepto: config.concepto,
      porcentaje: config.porcentaje,
      monto: baseValor * (config.porcentaje / 100),
      tipo: config.tipoDeduccion,
      baseCalculo: config.baseCalculo,
      orden: config.orden
    })
  }

  return deds.sort((a, b) => a.orden - b.orden)
})

const deduccionesPorTipo = computed(() => {
  const regalias = deducciones.value.filter(d => d.tipo === 'regalia')
  const aportes = deducciones.value.filter(d => d.tipo === 'aporte')
  return {
    regalias, aportes,
    totalRegalias: regalias.reduce((s, d) => s + d.monto, 0),
    totalAportes: aportes.reduce((s, d) => s + d.monto, 0)
  }
})

const totalDeducciones = computed(() => deducciones.value.reduce((s, d) => s + d.monto, 0))
const valorNeto = computed(() => valorBrutoTotal.value - totalDeducciones.value)
const valorNetoBob = computed(() => valorNeto.value * tipoCambioRef.value)

// ========== CERRAR ==========
const cerrarVenta = async () => {
  const ok = await uiStore.showConfirm(
    `¿Cerrar la venta por ${formatCurrency(valorNetoBob.value)}?\n\nEsta acción no se puede deshacer.`,
    'Confirmar Cierre de Venta'
  )
  if (!ok) return

  const resultado = await ventaStore.cerrarVenta(props.venta.id, {
    observaciones: form.value.observaciones
  })
  if (resultado.success) emit('actualizado')
}

// ========== FORMATO ==========
const formatCurrency = (v, c = 'BOB') => {
  if (v === null || v === undefined) return '-'
  return new Intl.NumberFormat('es-BO', { style: 'currency', currency: c, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
}
const formatNumber = (v, d = 4) => (v === null || v === undefined) ? '0.00' : parseFloat(v).toFixed(d)
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
      <div class="grid md:grid-cols-3 gap-4">
        <div class="bg-surface rounded-lg p-4 border border-border text-center">
          <p class="text-xs text-secondary mb-1">Valor Bruto</p>
          <p class="text-xl font-bold text-neutral">{{ formatCurrency(venta.valorBrutoUsd, 'USD') }}</p>
        </div>
        <div class="bg-red-500/10 rounded-lg p-4 border border-red-500/30 text-center">
          <p class="text-xs text-red-600 dark:text-red-400 mb-1">Deducciones</p>
          <p class="text-xl font-bold text-red-600 dark:text-red-400">-{{ formatCurrency(venta.totalDeduccionesUsd, 'USD') }}</p>
        </div>
        <div class="bg-primary/10 rounded-lg p-4 border border-primary/20 text-center">
          <p class="text-xs text-secondary mb-1">Valor Neto</p>
          <p class="text-xl font-bold text-primary">{{ formatCurrency(venta.valorNetoBob) }}</p>
          <p class="text-xs text-secondary mt-1">{{ formatCurrency(venta.valorNetoUsd, 'USD') }}</p>
        </div>
      </div>

      <!-- Deducciones guardadas -->
      <div v-if="venta.deducciones && venta.deducciones.length > 0">
        <h4 class="text-sm font-semibold text-neutral mb-3">Deducciones Aplicadas</h4>
        <div class="space-y-2">
          <div v-for="(ded, idx) in venta.deducciones" :key="idx" class="grid grid-cols-3 gap-2 items-center p-3 bg-surface rounded-lg border border-border text-sm">
            <span class="font-medium text-neutral">{{ ded.nombre }}</span>
            <span class="text-center text-secondary">{{ formatNumber(ded.porcentaje) }}%</span>
            <span class="text-right font-medium text-red-600">{{ formatCurrency(ded.montoUsd, 'USD') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== FORMULARIO DE CIERRE ========== -->
    <div v-if="puedeCerrar" class="space-y-6">
      <!-- Loading -->
      <div v-if="loadingPrecios" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-t-transparent mx-auto mb-4"></div>
        <p class="text-secondary">Cargando tabla de precios de la comercializadora...</p>
      </div>

      <!-- Error -->
      <div v-else-if="errorPrecios" class="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <AlertCircle class="w-5 h-5 text-red-600 dark:text-red-400" />
            <span class="text-red-600 dark:text-red-400 font-medium">{{ errorPrecios }}</span>
          </div>
          <button @click="cargarPrecios" class="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
            <RefreshCw class="w-4 h-4" /> Reintentar
          </button>
        </div>
      </div>

      <!-- Contenido -->
      <div v-else-if="preciosData" class="space-y-6">
        <!-- Info -->
        <div class="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30">
          <div class="flex items-start gap-3">
            <Table2 class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 class="font-semibold text-amber-600 dark:text-amber-400">Precios de la Comercializadora</h4>
              <p class="text-sm text-neutral mt-1">
                Los precios se obtienen de la tabla de precios configurada por la comercializadora, no de cotizaciones internacionales.
              </p>
            </div>
          </div>
        </div>

        <!-- Datos del Mineral -->
        <div class="bg-surface rounded-xl p-4 border border-border">
          <h4 class="text-sm font-semibold text-neutral mb-3 flex items-center gap-2">
            <Layers class="w-4 h-4" /> Datos del Lote
          </h4>
          <div class="grid sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p class="text-xs text-secondary mb-1">Pb (%)</p>
              <p class="font-bold text-neutral text-lg">{{ formatNumber(leyPb) }}%</p>
            </div>
            <div>
              <p class="text-xs text-secondary mb-1">Zn (%)</p>
              <p class="font-bold text-neutral text-lg">{{ formatNumber(leyZn) }}%</p>
            </div>
            <div>
              <p class="text-xs text-secondary mb-1">Ag (DM)</p>
              <p class="font-bold text-neutral text-lg">{{ formatNumber(leyAgDm) }}</p>
            </div>
            <div>
              <p class="text-xs text-secondary mb-1">
                <Scale class="w-3 h-3 inline mr-1" /> Peso
              </p>
              <p class="font-bold text-neutral text-lg">{{ formatNumber(pesoToneladas, 4) }} Ton</p>
            </div>
          </div>
        </div>

        <!-- Precios Unitarios de Tabla -->
        <div class="bg-surface rounded-xl p-4 border border-border">
          <h4 class="text-sm font-semibold text-neutral mb-3 flex items-center gap-2">
            <Coins class="w-4 h-4" /> Precios de Tabla (USD por unidad)
          </h4>
          <div class="grid md:grid-cols-3 gap-4">
            <div class="bg-hover rounded-lg p-4 border border-border">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-secondary">Plomo (Pb)</span>
                <span class="text-xs px-2 py-1 rounded-md bg-blue-500 text-white font-semibold">{{ formatNumber(leyPb) }}%</span>
              </div>
              <p class="text-2xl font-bold text-neutral mb-1">${{ formatNumber(precioUnitarioPb) }}</p>
              <p class="text-xs text-tertiary">USD por % de Pb</p>
              <p v-if="precioUnitarioPb === 0" class="text-xs text-red-500 mt-1">⚠️ Sin precio para este rango</p>
            </div>

            <div class="bg-hover rounded-lg p-4 border border-border">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-secondary">Zinc (Zn)</span>
                <span class="text-xs px-2 py-1 rounded-md bg-indigo-500 text-white font-semibold">{{ formatNumber(leyZn) }}%</span>
              </div>
              <p class="text-2xl font-bold text-neutral mb-1">${{ formatNumber(precioUnitarioZn) }}</p>
              <p class="text-xs text-tertiary">USD por % de Zn</p>
              <p v-if="precioUnitarioZn === 0" class="text-xs text-red-500 mt-1">⚠️ Sin precio para este rango</p>
            </div>

            <div class="bg-hover rounded-lg p-4 border border-border">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-secondary">Plata (Ag)</span>
                <span class="text-xs px-2 py-1 rounded-md bg-yellow-500 text-white font-semibold">{{ formatNumber(leyAgDm) }} DM</span>
              </div>
              <p class="text-2xl font-bold text-neutral mb-1">${{ formatNumber(precioUnitarioAg) }}</p>
              <p class="text-xs text-tertiary">USD por DM de Ag</p>
              <p v-if="precioUnitarioAg === 0 && leyAgDm > 0" class="text-xs text-red-500 mt-1">⚠️ Sin precio para este rango</p>
            </div>
          </div>
        </div>

        <!-- Cálculo Detallado -->
        <div class="bg-surface rounded-xl p-4 border border-border">
          <h4 class="text-sm font-semibold text-neutral mb-3 flex items-center gap-2">
            <Calculator class="w-4 h-4" /> Cálculo por Mineral
          </h4>
          <div class="space-y-3">
            <!-- Pb -->
            <div class="grid grid-cols-5 gap-2 items-center p-3 bg-blue-500/5 rounded-lg border border-blue-500/20 text-sm">
              <span class="font-semibold text-blue-600">Pb</span>
              <span class="text-center text-secondary">${{ formatNumber(precioUnitarioPb) }} × {{ formatNumber(leyPb) }}%</span>
              <span class="text-center font-medium text-neutral">${{ formatNumber(precioPorTonPb) }}/Ton</span>
              <span class="text-center text-secondary">× {{ formatNumber(pesoToneladas, 4) }} Ton</span>
              <span class="text-right font-bold text-blue-600">{{ formatCurrency(valorBrutoPb, 'USD') }}</span>
            </div>
            <!-- Zn -->
            <div class="grid grid-cols-5 gap-2 items-center p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/20 text-sm">
              <span class="font-semibold text-indigo-600">Zn</span>
              <span class="text-center text-secondary">${{ formatNumber(precioUnitarioZn) }} × {{ formatNumber(leyZn) }}%</span>
              <span class="text-center font-medium text-neutral">${{ formatNumber(precioPorTonZn) }}/Ton</span>
              <span class="text-center text-secondary">× {{ formatNumber(pesoToneladas, 4) }} Ton</span>
              <span class="text-right font-bold text-indigo-600">{{ formatCurrency(valorBrutoZn, 'USD') }}</span>
            </div>
            <!-- Ag -->
            <div v-if="leyAgDm > 0" class="grid grid-cols-5 gap-2 items-center p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/20 text-sm">
              <span class="font-semibold text-yellow-600">Ag</span>
              <span class="text-center text-secondary">${{ formatNumber(precioUnitarioAg) }} × {{ formatNumber(leyAgDm) }} DM</span>
              <span class="text-center font-medium text-neutral">${{ formatNumber(precioPorTonAg) }}/Ton</span>
              <span class="text-center text-secondary">× {{ formatNumber(pesoToneladas, 4) }} Ton</span>
              <span class="text-right font-bold text-yellow-600">{{ formatCurrency(valorBrutoAg, 'USD') }}</span>
            </div>
            <!-- Total -->
            <div class="grid grid-cols-5 gap-2 items-center p-3 bg-green-500/10 rounded-lg border border-green-500/30 text-sm font-bold">
              <span class="text-green-600 col-span-4">VALOR BRUTO TOTAL</span>
              <span class="text-right text-green-600">{{ formatCurrency(valorBrutoTotal, 'USD') }}</span>
            </div>
          </div>
        </div>

        <!-- Deducciones -->
        <div>
          <h4 class="text-sm font-semibold text-neutral mb-3 flex items-center gap-2">
            <TrendingDown class="w-4 h-4" /> Deducciones por Ley
          </h4>

          <div v-if="deduccionesPorTipo.regalias.length > 0" class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <h5 class="text-xs font-semibold text-neutral uppercase">Regalías Mineras</h5>
              <span class="text-xs font-bold text-red-600 dark:text-red-400">-{{ formatCurrency(deduccionesPorTipo.totalRegalias, 'USD') }}</span>
            </div>
            <div class="space-y-2">
              <div v-for="(ded, idx) in deduccionesPorTipo.regalias" :key="'r-'+idx" class="grid grid-cols-3 gap-2 items-center p-3 bg-red-500/10 rounded-lg border border-red-500/30 text-sm">
                <span class="font-medium text-neutral">{{ ded.concepto }}</span>
                <span class="text-center text-secondary">{{ formatNumber(ded.porcentaje) }}%</span>
                <span class="text-right font-medium text-red-600 dark:text-red-400">{{ formatCurrency(ded.monto, 'USD') }}</span>
              </div>
            </div>
          </div>

          <div v-if="deduccionesPorTipo.aportes.length > 0">
            <div class="flex items-center justify-between mb-2">
              <h5 class="text-xs font-semibold text-neutral uppercase">Aportes Obligatorios</h5>
              <span class="text-xs font-bold text-orange-600 dark:text-orange-400">-{{ formatCurrency(deduccionesPorTipo.totalAportes, 'USD') }}</span>
            </div>
            <div class="space-y-2">
              <div v-for="(ded, idx) in deduccionesPorTipo.aportes" :key="'a-'+idx" class="grid grid-cols-3 gap-2 items-center p-3 bg-orange-500/10 rounded-lg border border-orange-500/30 text-sm">
                <span class="font-medium text-neutral">{{ ded.concepto }}</span>
                <span class="text-center text-secondary">{{ formatNumber(ded.porcentaje) }}%</span>
                <span class="text-right font-medium text-orange-600 dark:text-orange-400">{{ formatCurrency(ded.monto, 'USD') }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Resultado Final -->
        <div class="bg-linear-to-br from-amber-600/10 to-amber-500/5 rounded-xl p-6 border-2 border-amber-600/20 text-center">
          <p class="text-sm text-secondary mb-2 font-medium">Valor Neto a Recibir</p>
          <p class="text-5xl font-bold text-amber-600 mb-2">{{ formatCurrency(valorNetoBob) }}</p>
          <p class="text-lg text-secondary">{{ formatCurrency(valorNeto, 'USD') }}</p>
          <div class="mt-4 pt-4 border-t border-amber-600/20 grid grid-cols-3 gap-4 text-xs">
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
              <p class="font-semibold text-neutral">{{ formatNumber(tipoCambioRef) }}</p>
            </div>
          </div>
        </div>

        <!-- Observaciones -->
        <div>
          <label class="block text-sm font-medium text-neutral mb-2">Observaciones (Opcional)</label>
          <textarea v-model="form.observaciones" rows="3" maxlength="500" placeholder="Comentarios adicionales..." class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral placeholder-tertiary focus:ring-2 focus:ring-primary focus:outline-none resize-none"></textarea>
          <p class="text-xs text-tertiary mt-1">{{ form.observaciones.length }}/500</p>
        </div>

        <!-- Botón -->
        <button
          @click="cerrarVenta"
          :disabled="ventaStore.loadingCerrar || pesoToneladas <= 0"
          class="w-full py-4 px-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <DollarSign v-if="!ventaStore.loadingCerrar" class="w-6 h-6" />
          <div v-else class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          {{ ventaStore.loadingCerrar ? 'Cerrando venta...' : `Cerrar Venta por ${formatCurrency(valorNetoBob)}` }}
        </button>

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