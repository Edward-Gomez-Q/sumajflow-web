// src/stores/ingenio/concentradosIngenioStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUIStore } from '../uiStore'
import { useSessionStore } from '../sessionStore'
import rutaApi from '../../assets/rutaApi.js'

export const useConcentradosIngenioStore = defineStore('concentradosIngenio', () => {
  const uiStore = useUIStore()
  const sessionStore = useSessionStore()
  
  // Concentrados
  const concentrados = ref([])
  const concentradoDetalle = ref(null)
  const estadisticas = ref(null)
  const loadingDetalle = ref(false)
  
  // Kanban
  const kanban = ref(null)
  const loadingKanban = ref(false)
  
  // Planta
  const infoPlanta = ref(null)
  const loadingInfoPlanta = ref(false)
  
  // Paginación y filtros
  const paginacion = ref({
    totalElementos: 0,
    totalPaginas: 0,
    paginaActual: 0,
    elementosPorPagina: 10,
    tieneSiguiente: false,
    tieneAnterior: false
  })
  const filtros = ref({
    estado: null,
    mineralPrincipal: null,
    fechaDesde: null,
    fechaHasta: null,
    page: 0,
    size: 10
  })
  
  const error = ref(null)

  // ==================== COMPUTED ====================
  
  const concentradosEnProceso = computed(() => 
    concentrados.value.filter(c => c.estado === 'en_proceso')
  )

  const concentradosEsperandoReporte = computed(() => 
    concentrados.value.filter(c => c.estado === 'esperando_reporte_quimico')
  )

  const concentradosListoLiquidacion = computed(() => 
    concentrados.value.filter(c => c.estado === 'listo_para_liquidacion')
  )

  // ==================== ACTIONS - CONCENTRADOS ====================

  /**
   * Fetch concentrados con paginación y filtros
   * GET /ingenio/concentrados
   */
  const fetchConcentrados = async (nuevosFiltros = {}) => {
    uiStore.showLoading('Cargando concentrados...')
    error.value = null

    if (Object.keys(nuevosFiltros).length > 0) {
      filtros.value = { ...filtros.value, ...nuevosFiltros }
    }

    try {
      const params = new URLSearchParams()
      
      Object.keys(filtros.value).forEach(key => {
        if (filtros.value[key] !== null && filtros.value[key] !== undefined && filtros.value[key] !== '') {
          params.append(key, filtros.value[key])
        }
      })

      const response = await fetch(`${rutaApi}/ingenio/concentrados?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar concentrados')
      }

      concentrados.value = data.data
      paginacion.value = {
        totalElementos: data.totalElements,
        totalPaginas: data.totalPages,
        paginaActual: data.currentPage,
        elementosPorPagina: data.pageSize,
        tieneSiguiente: data.currentPage < data.totalPages - 1,
        tieneAnterior: data.currentPage > 0
      }

      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Cargar')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Obtener detalle completo del concentrado
   * GET /ingenio/concentrados/{id}
   */
  const fetchConcentradoDetalle = async (id) => {
    loadingDetalle.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/ingenio/concentrados/${id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar detalle del concentrado')
      }

      concentradoDetalle.value = data.data
      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Cargar Detalle')
      return { success: false, error: err.message }

    } finally {
      loadingDetalle.value = false
    }
  }

  /**
   * Obtener dashboard de estadísticas
   * GET /ingenio/concentrados/dashboard
   */
  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${rutaApi}/ingenio/concentrados/dashboard`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar dashboard')
      }

      estadisticas.value = data.data
      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    }
  }

  /**
   * Crear concentrado(s) - Soporta creación múltiple (Zn+Pb)
   * POST /ingenio/concentrados
   */
  const crearConcentrado = async (datosConcentrado) => {
    const confirmed = await uiStore.showConfirm(
      '¿Está seguro que desea crear este/estos concentrado(s) con los lotes seleccionados?',
      'Confirmar Creación'
    )

    if (!confirmed) {
      return { success: false, cancelled: true }
    }

    uiStore.showLoading('Creando concentrado(s)...')
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/ingenio/concentrados`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosConcentrado)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear concentrado')
      }

      await fetchConcentrados()

      const cantidad = data.cantidad || (Array.isArray(data.data) ? data.data.length : 1)
      
      uiStore.showSuccess(
        data.message || `${cantidad} concentrado(s) creado(s) exitosamente`,
        'Creado Exitosamente'
      )

      return { 
        success: true, 
        data: data.data,
        cantidad: cantidad,
        message: data.message 
      }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Crear')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Obtener información de la planta del ingenio
   * GET /ingenio/concentrados/info-planta
   */
  const fetchInfoPlanta = async () => {
    loadingInfoPlanta.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/ingenio/concentrados/info-planta`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar información de la planta')
      }

      infoPlanta.value = data.data
      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Cargar Info de Planta')
      return { success: false, error: err.message }

    } finally {
      loadingInfoPlanta.value = false
    }
  }

  // ==================== ACTIONS - KANBAN ====================

  /**
   * Obtener procesos del Kanban
   * GET /ingenio/kanban/concentrados/{concentradoId}/procesos
   */
  const fetchProcesos = async (concentradoId) => {
    loadingKanban.value = true
    error.value = null

    try {
      const response = await fetch(
        `${rutaApi}/ingenio/kanban/concentrados/${concentradoId}/procesos`,
        {
          headers: {
            'Authorization': `Bearer ${sessionStore.token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar procesos')
      }

      kanban.value = data.data
      return { success: true, data: data.data }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Cargar Procesos')
      return { success: false, error: err.message }

    } finally {
      loadingKanban.value = false
    }
  }

  /**
   * Iniciar procesamiento (primer proceso)
   * POST /ingenio/kanban/concentrados/{concentradoId}/iniciar
   */
  const iniciarProcesamiento = async (concentradoId, observacionesInicioProceso) => {
    uiStore.showLoading('Iniciando procesamiento...')
    error.value = null

    try {
      const response = await fetch(
        `${rutaApi}/ingenio/kanban/concentrados/${concentradoId}/iniciar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionStore.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ observacionesInicioProceso })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar procesamiento')
      }
      
      await fetchProcesos(concentradoId)
      kanban.value = data.data

      uiStore.showSuccess(
        data.message || 'Procesamiento iniciado exitosamente',
        'Procesamiento Iniciado'
      )

      return { success: true, data: data.data, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Iniciar')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Mover concentrado entre procesos intermedios
   * POST /ingenio/kanban/concentrados/{concentradoId}/mover-a-proceso
   */
  const moverAProceso = async (concentradoId, procesoDestinoId, observaciones) => {
    uiStore.showLoading('Moviendo concentrado...')
    error.value = null

    try {
      const response = await fetch(
        `${rutaApi}/ingenio/kanban/concentrados/${concentradoId}/mover-a-proceso`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionStore.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            procesoDestinoId: procesoDestinoId,
            observacionesFinProceso: observaciones.observacionesFinProceso,
            observacionesInicioProceso: observaciones.observacionesInicioProceso
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al mover concentrado')
      }
      
      await fetchProcesos(concentradoId)
      kanban.value = data.data

      uiStore.showSuccess(
        data.message || 'Concentrado movido exitosamente',
        'Movimiento Exitoso'
      )

      return { success: true, data: data.data, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Mover')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Finalizar procesamiento completo
   * POST /ingenio/kanban/concentrados/{concentradoId}/finalizar
   */
  const finalizarProcesamiento = async (concentradoId, observaciones) => {
    uiStore.showLoading('Finalizando procesamiento...')
    error.value = null

    try {
      const response = await fetch(
        `${rutaApi}/ingenio/kanban/concentrados/${concentradoId}/finalizar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionStore.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            observacionesFinProceso: observaciones.observacionesFinProceso,
            observacionesGenerales: observaciones.observacionesGenerales
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al finalizar procesamiento')
      }
      
      await fetchProcesos(concentradoId)
      await fetchConcentrados()
      await fetchConcentradoDetalle(concentradoId)
      kanban.value = data.data

      uiStore.showSuccess(
        data.message || 'Procesamiento finalizado exitosamente',
        'Procesamiento Finalizado'
      )

      return { success: true, data: data.data, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Finalizar')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  // ==================== ACTIONS - REPORTES QUÍMICOS ====================

  /**
   * Registrar reporte químico
   * POST /ingenio/reportes-quimicos/concentrados/{concentradoId}
   */
  const registrarReporteQuimico = async (concentradoId, datosReporte) => {
    const confirmed = await uiStore.showConfirm(
      '¿Está seguro que desea registrar este reporte químico?',
      'Confirmar Registro'
    )

    if (!confirmed) {
      return { success: false, cancelled: true }
    }

    uiStore.showLoading('Registrando reporte químico...')
    error.value = null

    try {
      const response = await fetch(
        `${rutaApi}/ingenio/reportes-quimicos/concentrados/${concentradoId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionStore.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(datosReporte)
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar reporte químico')
      }

      await fetchConcentradoDetalle(concentradoId)

      uiStore.showSuccess(
        data.message || 'Reporte químico registrado exitosamente',
        'Reporte Registrado'
      )

      return { success: true, data: data.data, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Registrar Reporte')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Validar reporte químico
   * PATCH /ingenio/reportes-quimicos/concentrados/{concentradoId}/validar
   */
  const validarReporteQuimico = async (concentradoId) => {
    const confirmed = await uiStore.showConfirm(
      '¿Está seguro que desea validar el reporte químico? El concentrado quedará listo para liquidación.',
      'Confirmar Validación'
    )

    if (!confirmed) {
      return { success: false, cancelled: true }
    }

    uiStore.showLoading('Validando reporte químico...')
    error.value = null

    try {
      const response = await fetch(
        `${rutaApi}/ingenio/reportes-quimicos/concentrados/${concentradoId}/validar`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${sessionStore.token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al validar reporte químico')
      }

      await fetchConcentradoDetalle(concentradoId)

      uiStore.showSuccess(
        data.message || 'Reporte químico validado exitosamente',
        'Reporte Validado'
      )

      return { success: true, data: data.data, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Validar Reporte')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  // ==================== ACTIONS - LIQUIDACIONES DE SERVICIO ====================

  /**
   * Revisar solicitud de liquidación
   * PATCH /ingenio/liquidaciones-servicio/concentrados/{concentradoId}/revisar
   */
  const revisarLiquidacionServicio = async (concentradoId) => {
    const confirmed = await uiStore.showConfirm(
      '¿Marcar esta solicitud de liquidación como "en revisión"?',
      'Confirmar Revisión'
    )

    if (!confirmed) {
      return { success: false, cancelled: true }
    }

    uiStore.showLoading('Marcando liquidación en revisión...')
    error.value = null

    try {
      const response = await fetch(
        `${rutaApi}/ingenio/liquidaciones-servicio/concentrados/${concentradoId}/revisar`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${sessionStore.token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al revisar liquidación')
      }

      await fetchConcentradoDetalle(concentradoId)

      uiStore.showSuccess(
        data.message || 'Liquidación marcada en revisión',
        'En Revisión'
      )

      return { success: true, data: data.data, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Revisar')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Aprobar liquidación de servicio
   * POST /ingenio/liquidaciones-servicio/concentrados/{concentradoId}/aprobar
   */
  const aprobarLiquidacionServicio = async (concentradoId, datosLiquidacion) => {
    const confirmed = await uiStore.showConfirm(
      `¿Está seguro que desea aprobar la liquidación por ${datosLiquidacion.costoServicio} BOB?`,
      'Confirmar Aprobación de Liquidación'
    )

    if (!confirmed) {
      return { success: false, cancelled: true }
    }

    uiStore.showLoading('Aprobando liquidación...')
    error.value = null

    try {
      const response = await fetch(
        `${rutaApi}/ingenio/liquidaciones-servicio/concentrados/${concentradoId}/aprobar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionStore.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(datosLiquidacion)
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al aprobar liquidación')
      }

      await fetchConcentradoDetalle(concentradoId)

      uiStore.showSuccess(
        data.message || 'Liquidación aprobada exitosamente',
        'Liquidación Aprobada'
      )

      return { success: true, data: data.data, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Aprobar Liquidación')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  /**
   * Registrar pago de servicio
   * POST /ingenio/liquidaciones-servicio/concentrados/{concentradoId}/registrar-pago
   */
  const registrarPagoServicio = async (concentradoId, datosPago) => {
    const confirmed = await uiStore.showConfirm(
      `¿Confirmar registro de pago por ${datosPago.montoPagado} BOB?`,
      'Confirmar Registro de Pago'
    )

    if (!confirmed) {
      return { success: false, cancelled: true }
    }

    uiStore.showLoading('Registrando pago...')
    error.value = null

    try {
      const response = await fetch(
        `${rutaApi}/ingenio/liquidaciones-servicio/concentrados/${concentradoId}/registrar-pago`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionStore.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(datosPago)
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar pago')
      }

      await fetchConcentradoDetalle(concentradoId)

      uiStore.showSuccess(
        data.message || 'Pago registrado exitosamente',
        'Pago Registrado'
      )

      return { success: true, data: data.data, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Registrar Pago')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  // ==================== UTILITIES ====================

  const cambiarPagina = async (nuevaPagina) => {
    filtros.value.page = nuevaPagina
    await fetchConcentrados()
  }

  const cambiarTamanoPagina = async (nuevoTamano) => {
    filtros.value.size = nuevoTamano
    filtros.value.page = 0
    await fetchConcentrados()
  }

  const aplicarFiltros = async (nuevosFiltros) => {
    filtros.value = { ...filtros.value, ...nuevosFiltros, page: 0 }
    await fetchConcentrados()
  }

  const limpiarFiltros = async () => {
    filtros.value = {
      estado: null,
      mineralPrincipal: null,
      fechaDesde: null,
      fechaHasta: null,
      page: 0,
      size: 10
    }
    await fetchConcentrados()
  }

  const limpiarDetalle = () => {
    concentradoDetalle.value = null
  }

  const limpiarKanban = () => {
    kanban.value = null
  }

  const reset = () => {
    concentrados.value = []
    concentradoDetalle.value = null
    kanban.value = null
    estadisticas.value = null
    loadingDetalle.value = false
    loadingKanban.value = false
    infoPlanta.value = null
    loadingInfoPlanta.value = false
    paginacion.value = {
      totalElementos: 0,
      totalPaginas: 0,
      paginaActual: 0,
      elementosPorPagina: 10,
      tieneSiguiente: false,
      tieneAnterior: false
    }
    filtros.value = {
      estado: null,
      mineralPrincipal: null,
      fechaDesde: null,
      fechaHasta: null,
      page: 0,
      size: 10
    }
    error.value = null
  }

  // ==================== RETURN ====================

  return {
    // State
    concentrados,
    concentradoDetalle,
    kanban,
    estadisticas,
    loadingDetalle,
    loadingKanban,
    paginacion,
    filtros,
    error,
    infoPlanta,
    loadingInfoPlanta,
    
    // Computed
    concentradosEnProceso,
    concentradosEsperandoReporte,
    concentradosListoLiquidacion,
    
    // Actions - Concentrados
    fetchConcentrados,
    fetchConcentradoDetalle,
    fetchDashboard,
    crearConcentrado,
    fetchInfoPlanta,
    
    // Actions - Kanban
    fetchProcesos,
    iniciarProcesamiento,
    moverAProceso,
    finalizarProcesamiento,
    
    // Actions - Reportes Químicos
    registrarReporteQuimico,
    validarReporteQuimico,
    
    // Actions - Liquidaciones de Servicio
    revisarLiquidacionServicio,
    aprobarLiquidacionServicio,
    registrarPagoServicio,
    
    // Utilities
    cambiarPagina,
    cambiarTamanoPagina,
    aplicarFiltros,
    limpiarFiltros,
    limpiarDetalle,
    limpiarKanban,
    reset
  }
})