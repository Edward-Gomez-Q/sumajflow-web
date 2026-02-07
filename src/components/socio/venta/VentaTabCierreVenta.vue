<!-- src/components/socio/venta/VentaTabCierreVenta.vue -->
<script setup>
import { ref, computed, watch } from 'vue'
import { useVentaConcentradoStore } from '@/stores/socio/ventaConcentradoStore'
import { useUIStore } from '@/stores/uiStore'
import {
  DollarSign, TrendingUp, CheckCircle2, Calculator, Trash2, Plus, AlertCircle
} from 'lucide-vue-next'
import { DEDUCCIONES_DEFAULT, TIPO_CAMBIO_DEFAULT } from '@/utils/ventaEstados'

const props = defineProps({
  venta: { type: Object, required: true }
})
const emit = defineEmits(['actualizado'])

const ventaStore = useVentaConcentradoStore()
const uiStore = useUIStore()

const yaCerrado = computed(() => ['cerrado', 'pagado'].includes(props.venta.estado))
const puedeCerrar = computed(() => props.venta.estado === 'esperando_cierre_venta')

const form = ref({
  cotizacionInternacionalUsd: null,
  mineralCotizado: props.venta.mineralPrincipal || '',
  fuenteCotizacion: 'LME',
  tipoCambio: TIPO_CAMBIO_DEFAULT,
  deducciones: DEDUCCIONES_DEFAULT.map(d => ({ ...d })),
  observaciones: ''
})

// Cálculos en vivo
const leyMineral = computed(() => props.venta.leyMineralPrincipalPromedio || props.venta.reporteAcordado?.leyMineralPrincipal || 0)
const pesoTms = computed(() => props.venta.pesoTms || props.venta.pesoFinalTms || 0)

const precioAjustado = computed(() => {
  if (!form.value.cotizacionInternacionalUsd || !leyMineral.value) return 0
  return (form.value.cotizacionInternacionalUsd * leyMineral.value) / 100
})

const valorBruto = computed(() => precioAjustado.value * pesoTms.value)

const totalDeducciones = computed(() => {
  return form.value.deducciones.reduce((sum, d) => {
    return sum + (valorBruto.value * (d.porcentaje || 0)) / 100
  }, 0)
})

const valorNeto = computed(() => valorBruto.value - totalDeducciones.value)
const valorNetoBob = computed(() => valorNeto.value * form.value.tipoCambio)

const agregarDeduccion = () => {
  form.value.deducciones.push({ concepto: '', porcentaje: 0, tipoDeduccion: 'regalia', descripcion: '' })
}

const eliminarDeduccion = (idx) => {
  form.value.deducciones.splice(idx, 1)
}

const cerrarVenta = async () => {
  if (!form.value.cotizacionInternacionalUsd) {
    uiStore.showError('La cotización internacional es requerida', 'Validación')
    return
  }
  if (form.value.deducciones.some(d => !d.concepto)) {
    uiStore.showError('Todas las deducciones deben tener un concepto', 'Validación')
    return
  }

  const confirmacion = await uiStore.showConfirm(
    `¿Cerrar la venta por ${formatCurrency(valorNetoBob.value)}? Esta acción no se puede deshacer.`,
    'Confirmar Cierre'
  )
  if (!confirmacion) return

  const resultado = await ventaStore.cerrarVenta(props.venta.id, form.value)
  if (resultado.success) {
    emit('actualizado')
  }
}

const formatCurrency = (v, c = 'BOB') => {
  if (!v) return '-'
  return new Intl.NumberFormat('es-BO', { style: 'currency', currency: c }).format(v)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Ya cerrado: Mostrar resumen -->
    <div v-if="yaCerrado" class="space-y-4">
      <div class="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
        <div class="flex items-start gap-3">
          <CheckCircle2 class="w-6 h-6 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <h3 class="font-semibold text-purple-900 dark:text-purple-100">
              Venta {{ venta.estado === 'pagado' ? 'Pagada' : 'Cerrada' }}
            </h3>
            <p class="text-sm text-purple-700 dark:text-purple-300 mt-1">
              {{ venta.estado === 'pagado'
                ? 'El pago ha sido confirmado por la comercializadora.'
                : 'Esperando confirmación de pago de la comercializadora.' }}
            </p>
          </div>
        </div>
      </div>

      <div class="grid md:grid-cols-3 gap-4">
        <div class="bg-surface rounded-lg p-4 border border-border text-center">
          <p class="text-xs text-secondary">Cotización</p>
          <p class="text-xl font-bold text-neutral">{{ formatCurrency(venta.cotizacionInternacionalUsd, 'USD') }}/ton</p>
        </div>
        <div class="bg-surface rounded-lg p-4 border border-border text-center">
          <p class="text-xs text-secondary">Valor Bruto</p>
          <p class="text-xl font-bold text-neutral">{{ formatCurrency(venta.valorBrutoUsd, 'USD') }}</p>
        </div>
        <div class="bg-primary/10 rounded-lg p-4 border border-primary/20 text-center">
          <p class="text-xs text-secondary">Valor Neto</p>
          <p class="text-xl font-bold text-primary">{{ formatCurrency(venta.valorNetoBob) }}</p>
        </div>
      </div>
    </div>

    <!-- Formulario de cierre -->
    <div v-if="puedeCerrar" class="space-y-6">
      <!-- Info -->
      <div class="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
        <div class="flex items-start gap-3">
          <AlertCircle class="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <h4 class="font-semibold text-indigo-900 dark:text-indigo-100">Cierra tu venta</h4>
            <p class="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
              Ingresa la cotización internacional actual y ajusta las deducciones. El cálculo se realiza en tiempo real.
            </p>
          </div>
        </div>
      </div>

      <!-- Datos del concentrado -->
      <div class="bg-surface rounded-xl p-4 border border-border">
        <h4 class="text-sm font-semibold text-neutral mb-3">Datos del Material</h4>
        <div class="grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p class="text-xs text-secondary">Mineral</p>
            <p class="font-medium text-neutral">{{ venta.mineralPrincipal || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-secondary">Ley Mineral (%)</p>
            <p class="font-bold text-neutral text-lg">{{ leyMineral }}%</p>
          </div>
          <div>
            <p class="text-xs text-secondary">Peso TMS</p>
            <p class="font-medium text-neutral">{{ pesoTms }} ton</p>
          </div>
        </div>
      </div>

      <!-- Cotización -->
      <div class="grid md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-neutral mb-1">
            Cotización USD/ton <span class="text-error">*</span>
          </label>
          <input
            v-model.number="form.cotizacionInternacionalUsd"
            type="number"
            step="0.01"
            placeholder="Ej: 2500.00"
            class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-neutral mb-1">Fuente</label>
          <select v-model="form.fuenteCotizacion" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral focus:ring-2 focus:ring-primary focus:outline-none">
            <option value="LME">LME (London Metal Exchange)</option>
            <option value="Kitco">Kitco</option>
            <option value="COMEX">COMEX</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-neutral mb-1">Tipo de Cambio (USD→BOB)</label>
          <input v-model.number="form.tipoCambio" type="number" step="0.01" class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral focus:ring-2 focus:ring-primary focus:outline-none" />
        </div>
      </div>

      <!-- Preview en vivo -->
      <div class="bg-surface rounded-xl p-4 border border-border">
        <h4 class="text-sm font-semibold text-neutral mb-3 flex items-center gap-2">
          <Calculator class="w-4 h-4" /> Cálculo en Vivo
        </h4>
        <div class="grid sm:grid-cols-4 gap-3 text-sm">
          <div class="text-center p-3 bg-hover rounded-lg">
            <p class="text-xs text-secondary">Precio Ajustado</p>
            <p class="font-bold text-neutral">{{ formatCurrency(precioAjustado, 'USD') }}/ton</p>
          </div>
          <div class="text-center p-3 bg-hover rounded-lg">
            <p class="text-xs text-secondary">Valor Bruto</p>
            <p class="font-bold text-neutral">{{ formatCurrency(valorBruto, 'USD') }}</p>
          </div>
          <div class="text-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
            <p class="text-xs text-red-600">Deducciones</p>
            <p class="font-bold text-red-600">-{{ formatCurrency(totalDeducciones, 'USD') }}</p>
          </div>
          <div class="text-center p-3 bg-primary/10 rounded-lg">
            <p class="text-xs text-primary font-medium">Neto BOB</p>
            <p class="font-bold text-primary text-lg">{{ formatCurrency(valorNetoBob) }}</p>
          </div>
        </div>
      </div>

      <!-- Deducciones editables -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-semibold text-neutral">Deducciones</h4>
          <button @click="agregarDeduccion" class="text-xs btn-outline flex items-center gap-1 px-2 py-1">
            <Plus class="w-3 h-3" /> Agregar
          </button>
        </div>
        <div class="space-y-2">
          <div
            v-for="(ded, idx) in form.deducciones"
            :key="idx"
            class="grid grid-cols-12 gap-2 items-end p-3 bg-surface rounded-lg border border-border"
          >
            <div class="col-span-4">
              <label class="block text-xs text-secondary mb-1">Concepto</label>
              <input v-model="ded.concepto" type="text" class="w-full px-2 py-1.5 rounded border border-border bg-surface text-neutral text-sm focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div class="col-span-2">
              <label class="block text-xs text-secondary mb-1">%</label>
              <input v-model.number="ded.porcentaje" type="number" step="0.1" class="w-full px-2 py-1.5 rounded border border-border bg-surface text-neutral text-sm focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div class="col-span-2">
              <label class="block text-xs text-secondary mb-1">Tipo</label>
              <select v-model="ded.tipoDeduccion" class="w-full px-2 py-1.5 rounded border border-border bg-surface text-neutral text-sm focus:ring-1 focus:ring-primary focus:outline-none">
                <option value="regalia">Regalía</option>
                <option value="aporte">Aporte</option>
                <option value="impuesto">Impuesto</option>
              </select>
            </div>
            <div class="col-span-3">
              <label class="block text-xs text-secondary mb-1">Monto USD</label>
              <p class="px-2 py-1.5 text-sm font-medium text-neutral">
                {{ formatCurrency((valorBruto * (ded.porcentaje || 0)) / 100, 'USD') }}
              </p>
            </div>
            <div class="col-span-1 flex justify-center">
              <button @click="eliminarDeduccion(idx)" class="text-red-500 hover:text-red-700 p-1">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Observaciones -->
      <div>
        <label class="block text-sm font-medium text-neutral mb-1">Observaciones</label>
        <textarea v-model="form.observaciones" rows="2" maxlength="500" placeholder="Observaciones opcionales sobre el cierre..." class="w-full px-3 py-2 rounded-lg border border-border bg-surface text-neutral placeholder-tertiary focus:ring-2 focus:ring-primary focus:outline-none resize-none">
            
        </textarea>
      </div>

      <!-- Botón cerrar -->
      <button
        @click="cerrarVenta"
        :disabled="ventaStore.loadingCerrar || !form.cotizacionInternacionalUsd"
        class="w-full py-3 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <DollarSign v-if="!ventaStore.loadingCerrar" class="w-5 h-5" />
        <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        {{ ventaStore.loadingCerrar ? 'Cerrando...' : `Cerrar Venta por ${formatCurrency(valorNetoBob)}` }}
      </button>
    </div>
  </div>
</template>