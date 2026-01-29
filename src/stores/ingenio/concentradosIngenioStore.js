// src/stores/ingenio/concentradosIngenioStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUIStore } from '../uiStore'
import { useSessionStore } from '../sessionStore'
import rutaApi from '../../assets/rutaApi.js'

export const useConcentradosIngenioStore = defineStore('concentradosIngenio', () => {
  const uiStore = useUIStore()
  const sessionStore = useSessionStore()
  
  // State
  const concentrados = ref([])
  const concentradoDetalle = ref(null)
  const kanban = ref(null)
  const estadisticas = ref(null)
  const loadingDetalle = ref(false)
  const loadingKanban = ref(false)
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
  const infoPlanta = ref(null)
  const loadingInfoPlanta = ref(false)

  // Computed
  const concentradosEnProceso = computed(() => 
    concentrados.value.filter(c => c.estado === 'en_proceso')
  )

  const concentradosEsperandoReporte = computed(() => 
    concentrados.value.filter(c => c.estado === 'esperando_reporte_quimico')
  )

  const concentradosListoLiquidacion = computed(() => 
    concentrados.value.filter(c => c.estado === 'listo_para_liquidacion')
  )

  /**
   * Fetch concentrados con paginación y filtros
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
   * Crear concentrado(s) - ACTUALIZADO para soportar múltiples concentrados
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

      // data.data ahora es un array de concentrados
      const cantidad = data.cantidad || (Array.isArray(data.data) ? data.data.length : 1)
      
      uiStore.showSuccess(
        data.message || `${cantidad} concentrado(s) creado(s) exitosamente`,
        'Creado Exitosamente'
      )

      return { 
        success: true, 
        data: data.data, // Array de concentrados creados
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

  /**
   * Obtener procesos del Kanban
   */
  const fetchProcesos = async (concentradoId) => {
    loadingKanban.value = true
    error.value = null

    try {
      const response = await fetch(`${rutaApi}/ingenio/concentrados/${concentradoId}/procesos`, {
        headers: {
          'Authorization': `Bearer ${sessionStore.token}`,
          'Content-Type': 'application/json'
        }
      })

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
   * Avanzar proceso del Kanban
   */
  const avanzarProceso = async (concentradoId, procesoId, observaciones) => {
    const confirmed = await uiStore.showConfirm(
      '¿Está seguro que desea avanzar este proceso?',
      'Confirmar Avance de Proceso'
    )

    if (!confirmed) {
      return { success: false, cancelled: true }
    }

    uiStore.showLoading('Avanzando proceso...')
    error.value = null

    try {
      const response = await fetch(
        `${rutaApi}/ingenio/concentrados/${concentradoId}/procesos/${procesoId}/avanzar`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${sessionStore.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ observaciones })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al avanzar proceso')
      }

      kanban.value = data.data

      uiStore.showSuccess(
        data.message || 'Proceso avanzado exitosamente',
        'Proceso Avanzado'
      )

      return { success: true, data: data.data, message: data.message }

    } catch (err) {
      error.value = err.message
      uiStore.showError(err.message, 'Error al Avanzar Proceso')
      return { success: false, error: err.message }

    } finally {
      uiStore.hideLoading()
    }
  }

  const moverAProceso = async (concentradoId, procesoDestinoId, observaciones) => {
    uiStore.showLoading('Moviendo concentrado...')
    error.value = null

    try {
      const response = await fetch(
        `${rutaApi}/ingenio/concentrados/${concentradoId}/mover-a-proceso`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionStore.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            procesoDestinoId: procesoDestinoId,
            observaciones: observaciones,
            completarIntermedios: true
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al mover concentrado')
      }

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
   * Registrar reporte químico
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
        `${rutaApi}/ingenio/concentrados/${concentradoId}/reporte-quimico`,
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
        `${rutaApi}/ingenio/concentrados/${concentradoId}/validar-reporte`,
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

  /**
   * Revisar solicitud de liquidación
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
        `${rutaApi}/ingenio/concentrados/${concentradoId}/revisar-liquidacion-servicio`,
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
        `${rutaApi}/ingenio/concentrados/${concentradoId}/aprobar-liquidacion-servicio`,
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
        `${rutaApi}/ingenio/concentrados/${concentradoId}/registrar-pago-servicio`,
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

  /**
   * Cambiar página
   */
  const cambiarPagina = async (nuevaPagina) => {
    filtros.value.page = nuevaPagina
    await fetchConcentrados()
  }

  /**
   * Cambiar tamaño de página
   */
  const cambiarTamanoPagina = async (nuevoTamano) => {
    filtros.value.size = nuevoTamano
    filtros.value.page = 0
    await fetchConcentrados()
  }

  /**
   * Aplicar filtros
   */
  const aplicarFiltros = async (nuevosFiltros) => {
    filtros.value = { ...filtros.value, ...nuevosFiltros, page: 0 }
    await fetchConcentrados()
  }

  /**
   * Limpiar filtros
   */
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

  /**
   * Limpiar detalle
   */
  const limpiarDetalle = () => {
    concentradoDetalle.value = null
  }

  /**
   * Limpiar kanban
   */
  const limpiarKanban = () => {
    kanban.value = null
  }

  /**
   * Reset completo
   */
  const reset = () => {
    concentrados.value = []
    concentradoDetalle.value = null
    kanban.value = null
    estadisticas.value = null
    loadingDetalle.value = false
    loadingKanban.value = false
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
    
    // Actions
    fetchConcentrados,
    fetchConcentradoDetalle,
    fetchDashboard,
    moverAProceso,
    crearConcentrado,
    fetchProcesos,
    avanzarProceso,
    fetchInfoPlanta,
    registrarReporteQuimico,
    validarReporteQuimico,
    revisarLiquidacionServicio,
    aprobarLiquidacionServicio,
    registrarPagoServicio,
    cambiarPagina,
    cambiarTamanoPagina,
    aplicarFiltros,
    limpiarFiltros,
    limpiarDetalle,
    limpiarKanban,
    reset
  }
})