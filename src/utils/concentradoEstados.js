// src/utils/concentradoEstados.js

/**
 * Estados del Concentrado con etiquetas y colores
 * Para uso en badges, filtros y visualización
 */
export const ESTADOS_CONCENTRADO = {
  // Fase 1: Procesamiento
  'creado': {
    label: 'Creado',
    color: 'bg-blue-500',
    textColor: 'text-white',
    fase: 'procesamiento'
  },
  'en_camino_a_planta': {
    label: 'En camino a planta',
    color: 'bg-indigo-500',
    textColor: 'text-white',
    fase: 'procesamiento'
  },
  'en_proceso': {
    label: 'En proceso',
    color: 'bg-yellow-500',
    textColor: 'text-white',
    fase: 'procesamiento'
  },
  'esperando_pago': {
    label: 'Esperando pago',
    color: 'bg-orange-500',
    textColor: 'text-white',
    fase: 'procesamiento'
  },
  'reporte_quimico_registrado': {
    label: 'Reporte registrado',
    color: 'bg-cyan-500',
    textColor: 'text-white',
    fase: 'procesamiento'
  },
  'listo_para_liquidacion': {
    label: 'Listo para liquidación',
    color: 'bg-green-500',
    textColor: 'text-white',
    fase: 'liquidacion'
  },
  
  // Fase 2: Liquidación Servicio
  'liquidacion_servicio_solicitada': {
    label: 'Liquidación solicitada',
    color: 'bg-blue-600',
    textColor: 'text-white',
    fase: 'liquidacion'
  },
  'en_venta': {
    label: 'En venta',
    color: 'bg-yellow-600',
    textColor: 'text-white',
    fase: 'liquidacion'
  },
  'servicio_ingenio_liquidado': {
    label: 'Servicio liquidado',
    color: 'bg-green-600',
    textColor: 'text-white',
    fase: 'liquidacion'
  },
  'servicio_ingenio_pagado': {
    label: 'Servicio pagado',
    color: 'bg-emerald-600',
    textColor: 'text-white',
    fase: 'liquidacion'
  },
  'listo_para_venta': {
    label: 'Listo para venta',
    color: 'bg-teal-600',
    textColor: 'text-white',
    fase: 'venta'
  },
  
  // Fase 3: Venta
  'venta_solicitada': {
    label: 'Venta solicitada',
    color: 'bg-purple-500',
    textColor: 'text-white',
    fase: 'venta'
  },
  'venta_en_revision': {
    label: 'Venta en revisión',
    color: 'bg-purple-600',
    textColor: 'text-white',
    fase: 'venta'
  },
  'venta_liquidada': {
    label: 'Venta liquidada',
    color: 'bg-green-700',
    textColor: 'text-white',
    fase: 'venta'
  },
  'vendido': {
    label: 'Vendido',
    color: 'bg-green-800',
    textColor: 'text-white',
    fase: 'completado'
  }
}

/**
 * Obtener configuración de estado
 */
export const getEstadoConfig = (estado) => {
  return ESTADOS_CONCENTRADO[estado] || {
    label: estado,
    color: 'bg-gray-500',
    textColor: 'text-white',
    fase: 'desconocido'
  }
}

/**
 * Obtener clase de color sólido para el estado
 */
export const getEstadoColorSolido = (estado) => {
  const config = getEstadoConfig(estado)
  return config.color
}

/**
 * Obtener label del estado
 */
export const getEstadoLabel = (estado) => {
  const config = getEstadoConfig(estado)
  return config.label
}

/**
 * Estados agrupados por fase
 */
export const ESTADOS_POR_FASE = {
  procesamiento: [
    'creado',
    'en_camino_a_planta',
    'en_proceso',
    'esperando_reporte_quimico',
    'reporte_quimico_registrado',
    'listo_para_liquidacion'
  ],
  liquidacion: [
    'liquidacion_servicio_solicitada',
    'liquidacion_servicio_en_revision',
    'servicio_ingenio_liquidado',
    'servicio_ingenio_pagado',
    'listo_para_venta'
  ],
  venta: [
    'venta_solicitada',
    'venta_en_revision',
    'venta_liquidada'
  ],
  completado: [
    'vendido'
  ]
}

/**
 * Estados del proceso Kanban
 */
export const ESTADOS_PROCESO = {
  'pendiente': {
    label: 'Pendiente',
    color: 'bg-gray-500',
    icon: 'Clock'
  },
  'en_proceso': {
    label: 'En Proceso',
    color: 'bg-yellow-500',
    icon: 'Loader'
  },
  'completado': {
    label: 'Completado',
    color: 'bg-green-500',
    icon: 'CheckCircle2'
  }
}

/**
 * Tipos de operación
 */
export const TIPOS_OPERACION = {
  'procesamiento_planta': 'Procesamiento en Planta',
  'venta_directa': 'Venta Directa'
}

/**
 * Métodos de pago
 */
export const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia Bancaria' },

  { value: 'deposito', label: 'Depósito Bancario' }
]