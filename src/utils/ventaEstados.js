// src/utils/ventaEstados.js

/**
 * Estados de Liquidación de Venta con etiquetas y colores
 * Para uso en badges, filtros y visualización
 */
export const ESTADOS_VENTA = {
  // Fase 1: Aprobación
  'pendiente_aprobacion': {
    label: 'Pendiente Aprobación',
    color: 'bg-yellow-500',
    textColor: 'text-white',
    badgeClass: 'bg-yellow-500 border border-yellow-500/20',
    fase: 'aprobacion'
  },
  'aprobado': {
    label: 'Aprobado',
    color: 'bg-blue-500',
    textColor: 'text-white',
    badgeClass: 'bg-blue-500 border border-blue-500/20',
    fase: 'aprobacion'
  },
  'rechazado': {
    label: 'Rechazado',
    color: 'bg-red-500',
    textColor: 'text-white',
    badgeClass: 'bg-red-500 border border-red-500/20',
    fase: 'aprobacion'
  },

  // Fase 2: Reportes
  'esperando_reportes': {
    label: 'Esperando Reportes',
    color: 'bg-orange-500',
    textColor: 'text-white',
    badgeClass: 'bg-orange-500  border border-orange-500/20',
    fase: 'reportes'
  },
  'reportes_registrados': {
    label: 'Reportes Registrados',
    color: 'bg-cyan-500',
    textColor: 'text-white',
    badgeClass: 'bg-cyan-500  border border-cyan-500/20',
    fase: 'reportes'
  },

  // Fase 3: Cierre
  'esperando_cierre_venta': {
    label: 'Esperando Cierre',
    color: 'bg-indigo-500',
    textColor: 'text-white',
    badgeClass: 'bg-indigo-500  border border-indigo-500/20',
    fase: 'cierre'
  },
  'cerrado': {
    label: 'Cerrado',
    color: 'bg-purple-500',
    textColor: 'text-white',
    badgeClass: 'bg-purple-500  border border-purple-500/20',
    fase: 'cierre'
  },

  // Fase 4: Completado
  'pagado': {
    label: 'Pagado',
    color: 'bg-green-500',
    textColor: 'text-white',
    badgeClass: 'bg-green-500  border border-green-500/20',
    fase: 'completado'
  },
  'pago_parcial': {
    label: 'Pago Parcial',
    color: 'bg-teal-500',
    textColor: 'text-white',
    badgeClass: 'bg-teal-500  border border-teal-500/20',
    fase: 'completado'
  }
}

/**
 * Obtener configuración de estado
 */
export const getVentaEstadoConfig = (estado) => {
  return ESTADOS_VENTA[estado] || {
    label: estado || 'Desconocido',
    color: 'bg-gray-500',
    textColor: 'text-white',
    badgeClass: 'bg-gray-500 border border-gray-500/20',
    fase: 'desconocido'
  }
}

/**
 * Obtener clase de color sólido para el estado
 */
export const getVentaEstadoColorSolido = (estado) => {
  const config = getVentaEstadoConfig(estado)
  return config.color
}

/**
 * Obtener label del estado
 */
export const getVentaEstadoLabel = (estado) => {
  const config = getVentaEstadoConfig(estado)
  return config.label
}

/**
 * Estados agrupados por fase
 */
export const ESTADOS_VENTA_POR_FASE = {
  aprobacion: [
    'pendiente_aprobacion',
    'aprobado',
    'rechazado'
  ],
  reportes: [
    'esperando_reportes',
    'reportes_registrados'
  ],
  cierre: [
    'esperando_cierre_venta',
    'cerrado'
  ],
  completado: [
    'pagado',
    'pago_parcial'
  ]
}

/**
 * Tipos de liquidación
 */
export const TIPOS_LIQUIDACION = {
  'venta_concentrado': 'Venta de Concentrado',
  'venta_lote_complejo': 'Venta de Lote Complejo',
  'toll': 'Servicio de Procesamiento'
}

/**
 * Métodos de pago
 */
export const METODOS_PAGO_VENTA = [
  { value: 'transferencia_bancaria', label: 'Transferencia Bancaria' },
  { value: 'deposito', label: 'Depósito Bancario' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'cheque', label: 'Cheque' }
]

/**
 * Deducciones por defecto para Bolivia
 * Se muestran en el formulario de cierre y son editables
 */
export const DEDUCCIONES_DEFAULT = [
  {
    concepto: 'Regalía Minera',
    porcentaje: 5.0,
    tipoDeduccion: 'regalia',
    descripcion: 'Regalía Minera - Ley 535'
  },
  {
    concepto: 'Aporte Departamental',
    porcentaje: 1.0,
    tipoDeduccion: 'aporte',
    descripcion: 'Aporte al departamento'
  },
  {
    concepto: 'Impuesto a las Utilidades',
    porcentaje: 3.0,
    tipoDeduccion: 'impuesto',
    descripcion: 'IUE Minería'
  },
  {
    concepto: 'Costo de Tratamiento',
    porcentaje: 2.5,
    tipoDeduccion: 'regalia',
    descripcion: 'TC - Costo de tratamiento en fundición'
  },
  {
    concepto: 'Costo de Refinación',
    porcentaje: 1.5,
    tipoDeduccion: 'regalia',
    descripcion: 'RC - Costo de refinación'
  }
]

/**
 * Tipo de cambio por defecto (fijo en Bolivia)
 */
export const TIPO_CAMBIO_DEFAULT = 6.96

/**
 * Estados disponibles para filtros (socio)
 */
export const ESTADOS_FILTRO_SOCIO = [
  { value: 'pendiente_aprobacion', label: 'Pendiente Aprobación' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'esperando_reportes', label: 'Esperando Reportes' },
  { value: 'reportes_registrados', label: 'Reportes Registrados' },
  { value: 'esperando_cierre_venta', label: 'Esperando Cierre' },
  { value: 'cerrado', label: 'Cerrado (Pago Pendiente)' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'pago_parcial', label: 'Pago Parcial' },
  { value: 'rechazado', label: 'Rechazado' }
]

/**
 * Estados disponibles para filtros (comercializadora)
 */
export const ESTADOS_FILTRO_COMERCIALIZADORA = [
  { value: 'pendiente_aprobacion', label: 'Pendiente Aprobación' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'esperando_reportes', label: 'Esperando Reportes' },
  { value: 'reportes_registrados', label: 'Reportes Registrados' },
  { value: 'esperando_cierre_venta', label: 'En Espera de Cierre' },
  { value: 'cerrado', label: 'Cerrado (Pendiente Pago)' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'pago_parcial', label: 'Pago Parcial' },
  { value: 'rechazado', label: 'Rechazado' }
]