import ExcelJS from 'exceljs'

const COLORS = {
  headerPrimary: 'FF1E40AF',
  headerSecondary: 'FF3B82F6',
  success: 'FF10B981',
  warning: 'FFF59E0B',
  error: 'FFEF4444',
  info: 'FF3B82F6',
  lightGray: 'FFF3F4F6',
  lightBlue: 'FFDBEAFE',
  lightGreen: 'FFD1FAE5',
  lightYellow: 'FFFEF3C7',
  lightRed: 'FFFEE2E2',
  white: 'FFFFFFFF',
  black: 'FF000000',
  darkGray: 'FF1F2937',
  borderGray: 'FFE5E7EB',
  sky: 'FF0EA5E9',
  emerald: 'FF10B981',
  amber: 'FFF59E0B',
  violet: 'FF8B5CF6'
}

class ConcentradoExcelReportGenerator {
  constructor(concentrado, kanban = null) {
    this.concentrado = concentrado
    this.kanban = kanban
    this.workbook = new ExcelJS.Workbook()
    
    // Configurar propiedades del documento
    this.workbook.creator = 'Sistema de Gestión Minera'
    this.workbook.created = new Date()
    this.workbook.modified = new Date()
    this.workbook.lastPrinted = new Date()
  }

  generate() {
    // 1. Información General
    this.createInformacionGeneralSheet()
    
    // 2. Procesos (si hay kanban)
    if (this.kanban?.todosProcesos?.length > 0) {
      this.createProcesosSheet()
    }
    
    // 3. Historial Detallado
    if (this.concentrado.observaciones?.length > 0) {
      this.createHistorialSheet()
    }
    
    // 4. Liquidación Toll (si existe)
    if (this.concentrado.liquidacionToll) {
      this.createLiquidacionTollSheet()
    }
    
    // 5. Liquidaciones de Venta (NUEVO)
    if (this.concentrado.liquidacionesVenta?.length > 0) {
      this.createLiquidacionesVentaSheet()
    }
    
    return this.workbook
  }

  // ========================================================================
  // HOJA 1: INFORMACIÓN GENERAL COMPLETA
  // ========================================================================
  createInformacionGeneralSheet() {
    const ws = this.workbook.addWorksheet('Información General', {
      views: [{ showGridLines: true }]
    })
    
    let row = 1

    // ENCABEZADO PRINCIPAL
    ws.mergeCells(`A${row}:B${row}`)
    this.setHeaderCell(ws, `A${row}`, 'REPORTE CONSOLIDADO DE CONCENTRADO', COLORS.headerPrimary, 18)
    ws.getRow(row).height = 35
    row++

    ws.mergeCells(`A${row}:B${row}`)
    this.setHeaderCell(ws, `A${row}`, `Concentrado #${this.concentrado.id}`, COLORS.headerSecondary, 14)
    ws.getRow(row).height = 28
    row++

    ws.mergeCells(`A${row}:B${row}`)
    const estadoCell = ws.getCell(`A${row}`)
    estadoCell.value = `Estado: ${this.capitalizeFirst(this.concentrado.estado.replace(/_/g, ' '))}`
    estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightBlue } }
    estadoCell.font = { bold: true, size: 12, color: { argb: COLORS.headerPrimary } }
    estadoCell.alignment = { horizontal: 'center', vertical: 'middle' }
    estadoCell.border = this.allBorders()
    ws.getRow(row).height = 25
    row += 2

    // SECCIÓN: INFORMACIÓN DEL CONCENTRADO
    this.addSectionHeader(ws, row, 'INFORMACIÓN DEL CONCENTRADO')
    row++
    
    row = this.addDataRow(ws, row, 'ID Concentrado:', this.concentrado.id)
    row = this.addDataRow(ws, row, 'Estado:', this.capitalizeFirst(this.concentrado.estado.replace(/_/g, ' ')))
    row = this.addDataRow(ws, row, 'Mineral Principal:', this.concentrado.mineralPrincipal || '-')
    row = this.addDataRow(ws, row, 'Minerales Secundarios:', this.concentrado.mineralesSecundarios || '-')
    row = this.addDataRow(ws, row, 'Tipo de Origen:', this.concentrado.loteOrigenMultiple ? 'Lote Múltiple' : 'Lote Único')
    row++

    // SECCIÓN: PESOS Y MEDIDAS
    this.addSectionHeader(ws, row, 'PESOS Y MEDIDAS')
    row++
    
    row = this.addDataRow(ws, row, 'Peso Inicial:', `${this.formatNumber(this.concentrado.pesoInicial)} Ton`)
    row = this.addDataRow(ws, row, 'Peso Final:', this.concentrado.pesoFinal ? `${this.formatNumber(this.concentrado.pesoFinal)} Kg` : 'Pendiente')
    row = this.addDataRow(ws, row, 'Merma:', this.concentrado.merma ? `${this.formatNumber(this.concentrado.merma)} Kg` : '-')
    
    // Calcular porcentaje de merma si hay datos
    if (this.concentrado.merma && this.concentrado.pesoInicial) {
      const porcentajeMerma = (this.concentrado.merma / (this.concentrado.pesoInicial * 1000)) * 100
      row = this.addDataRow(ws, row, 'Porcentaje de Merma:', `${this.formatNumber(porcentajeMerma, 2)}%`)
    }
    
    row = this.addDataRow(ws, row, 'Número de Sacos:', this.concentrado.numeroSacos || 0)
    row++

    // SECCIÓN: SOCIO PROPIETARIO
    this.addSectionHeader(ws, row, 'SOCIO PROPIETARIO')
    row++
    
    row = this.addDataRow(ws, row, 'Nombres:', this.concentrado.socioNombres)
    row = this.addDataRow(ws, row, 'Apellidos:', this.concentrado.socioApellidos)
    row = this.addDataRow(ws, row, 'CI:', this.concentrado.socioCi)
    row = this.addDataRow(ws, row, 'ID Socio:', this.concentrado.socioId)
    row++

    // SECCIÓN: INGENIO PROCESADOR
    this.addSectionHeader(ws, row, 'INGENIO PROCESADOR')
    row++
    
    row = this.addDataRow(ws, row, 'Nombre:', this.concentrado.ingenioNombre)
    row = this.addDataRow(ws, row, 'ID Ingenio:', this.concentrado.ingenioId)
    row++

    // SECCIÓN: LOTES PROCESADOS
    if (this.concentrado.lotes?.length > 0) {
      this.addSectionHeader(ws, row, `LOTES PROCESADOS (${this.concentrado.lotes.length})`)
      row++

      // Headers de tabla de lotes
      const loteHeaders = ['ID', 'Mina', 'Tipo', 'Peso (Kg)', 'Estado']
      loteHeaders.forEach((header, idx) => {
        const cell = ws.getCell(row, idx + 1)
        cell.value = header
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkGray } }
        cell.font = { bold: true, size: 10, color: { argb: COLORS.white } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = this.allBorders()
      })
      ws.getRow(row).height = 20
      row++

      // Datos de lotes
      this.concentrado.lotes.forEach(lote => {
        const loteData = [
          lote.id,
          lote.minaNombre,
          this.capitalizeFirst(lote.tipoMineral),
          this.formatNumber(lote.pesoTotalReal),
          lote.estado || '-'
        ]

        loteData.forEach((value, idx) => {
          const cell = ws.getCell(row, idx + 1)
          cell.value = value
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } }
          cell.font = { size: 9 }
          cell.alignment = { 
            horizontal: idx === 0 || idx === 2 || idx === 4 ? 'center' : idx === 1 ? 'left' : 'right',
            vertical: 'middle'
          }
          cell.border = this.allBorders()
        })
        row++
      })
      row++
    }

    // SECCIÓN: MINERALES DISPONIBLES
    if (this.concentrado.minerales?.length > 0) {
      this.addSectionHeader(ws, row, 'MINERALES IDENTIFICADOS')
      row++

      this.concentrado.minerales.forEach(mineral => {
        row = this.addDataRow(ws, row, `${mineral.nomenclatura}:`, mineral.nombre)
      })
      row++
    }

    // SECCIÓN: CRONOLOGÍA
    this.addSectionHeader(ws, row, 'CRONOLOGÍA')
    row++
    
    row = this.addDataRow(ws, row, 'Fecha de Inicio:', this.formatDateComplete(this.concentrado.fechaInicio))
    row = this.addDataRow(ws, row, 'Fecha de Finalización:', this.concentrado.fechaFin ? this.formatDateComplete(this.concentrado.fechaFin) : 'En proceso')
    
    // Calcular duración total si hay ambas fechas
    if (this.concentrado.fechaInicio && this.concentrado.fechaFin) {
      const duracion = this.calcularDuracionCompleta(this.concentrado.fechaInicio, this.concentrado.fechaFin)
      row = this.addDataRow(ws, row, 'Duración Total:', duracion)
    }
    
    row = this.addDataRow(ws, row, 'Creado el:', this.formatDateComplete(this.concentrado.createdAt))
    row = this.addDataRow(ws, row, 'Última Actualización:', this.formatDateComplete(this.concentrado.updatedAt))

    // Ajustar anchos de columna
    ws.getColumn(1).width = 35
    ws.getColumn(2).width = 60
  }

  // ========================================================================
  // HOJA 2: PROCESOS DETALLADOS
  // ========================================================================
  createProcesosSheet() {
    const ws = this.workbook.addWorksheet('Procesos', {
      views: [{ showGridLines: true }]
    })
    
    let row = 1

    // ENCABEZADO
    ws.mergeCells(`A${row}:H${row}`)
    this.setHeaderCell(ws, `A${row}`, 'DETALLE DE PROCESOS DE CONCENTRADO', COLORS.headerPrimary, 16)
    ws.getRow(row).height = 30
    row += 2

    // RESUMEN EJECUTIVO
    this.addSectionHeader(ws, row, 'RESUMEN EJECUTIVO', 8)
    row++

    const totalProcesos = this.kanban.totalProcesos || 0
    const completados = this.kanban.procesosCompletados || 0
    const pendientes = this.kanban.procesosPendientes || 0
    const progreso = totalProcesos > 0 ? Math.round((completados / totalProcesos) * 100) : 0

    // Crear tabla de resumen
    const resumenData = [
      ['Total de Procesos', totalProcesos],
      ['Completados', completados],
      ['Pendientes', pendientes],
      ['Progreso', `${progreso}%`]
    ]

    resumenData.forEach(([label, value]) => {
      const labelCell = ws.getCell(`A${row}`)
      labelCell.value = label
      labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightBlue } }
      labelCell.font = { bold: true, size: 11 }
      labelCell.alignment = { horizontal: 'right', vertical: 'middle' }
      labelCell.border = this.allBorders()

      ws.mergeCells(`B${row}:H${row}`)
      const valueCell = ws.getCell(`B${row}`)
      valueCell.value = value
      valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.white } }
      valueCell.font = { bold: true, size: 11, color: { argb: COLORS.headerPrimary } }
      valueCell.alignment = { horizontal: 'left', vertical: 'middle' }
      valueCell.border = this.allBorders()
      
      ws.getRow(row).height = 22
      row++
    })
    row += 2

    // ESTADÍSTICAS DE TIEMPO
    const estadisticas = this.calcularEstadisticasProcesos()
    if (estadisticas) {
      this.addSectionHeader(ws, row, 'ESTADÍSTICAS DE TIEMPO', 8)
      row++

      const statsData = [
        ['Duración Total', estadisticas.duracionTotal],
        ['Proceso Más Rápido', `${estadisticas.masRapido.nombre} (${estadisticas.masRapido.duracion})`],
        ['Proceso Más Lento', `${estadisticas.masLento.nombre} (${estadisticas.masLento.duracion})`],
        ['Duración Promedio', estadisticas.promedio]
      ]

      statsData.forEach(([label, value]) => {
        const labelCell = ws.getCell(`A${row}`)
        labelCell.value = label
        labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGreen } }
        labelCell.font = { bold: true, size: 10 }
        labelCell.alignment = { horizontal: 'right', vertical: 'middle' }
        labelCell.border = this.allBorders()

        ws.mergeCells(`B${row}:H${row}`)
        const valueCell = ws.getCell(`B${row}`)
        valueCell.value = value
        valueCell.font = { size: 10 }
        valueCell.alignment = { horizontal: 'left', vertical: 'middle' }
        valueCell.border = this.allBorders()
        
        row++
      })
      row += 2
    }

    // TABLA DETALLADA DE PROCESOS
    this.addSectionHeader(ws, row, 'DETALLE DE CADA PROCESO', 8)
    row++

    // Headers
    const headers = ['#', 'Proceso', 'ID', 'Estado', 'Inicio', 'Fin', 'Duración', 'Observaciones']
    headers.forEach((header, idx) => {
      const cell = ws.getCell(row, idx + 1)
      cell.value = header
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkGray } }
      cell.font = { bold: true, size: 10, color: { argb: COLORS.white } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = this.allBorders()
    })
    ws.getRow(row).height = 22
    row++

    // Datos de procesos
    this.kanban.todosProcesos.forEach(proceso => {
      const duracion = proceso.fechaFin && proceso.fechaInicio 
        ? this.calcularDuracion(proceso.fechaInicio, proceso.fechaFin)
        : '-'

      const observaciones = this.obtenerObservacionesProceso(proceso)

      const rowData = [
        proceso.orden,
        proceso.nombreProceso,
        proceso.id,
        this.capitalizeFirst(proceso.estado),
        this.formatDateComplete(proceso.fechaInicio),
        proceso.fechaFin ? this.formatDateComplete(proceso.fechaFin) : '-',
        duracion,
        observaciones
      ]

      rowData.forEach((value, idx) => {
        const cell = ws.getCell(row, idx + 1)
        cell.value = value
        
        // Color según estado
        let fillColor = COLORS.white
        if (proceso.estado === 'completado') fillColor = COLORS.lightGreen
        else if (proceso.estado === 'en_proceso') fillColor = COLORS.lightBlue
        else if (proceso.estado === 'pendiente') fillColor = COLORS.lightGray

        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } }
        cell.font = { size: 9 }
        cell.alignment = { 
          horizontal: idx <= 3 ? 'center' : idx === 1 || idx === 7 ? 'left' : 'center',
          vertical: 'middle',
          wrapText: idx === 7
        }
        cell.border = this.allBorders()
      })
      
      ws.getRow(row).height = observaciones.length > 50 ? 35 : 25
      row++
    })

    // Ajustar anchos
    ws.getColumn(1).width = 6
    ws.getColumn(2).width = 25
    ws.getColumn(3).width = 10
    ws.getColumn(4).width = 15
    ws.getColumn(5).width = 20
    ws.getColumn(6).width = 20
    ws.getColumn(7).width = 15
    ws.getColumn(8).width = 40
  }

  // ========================================================================
  // HOJA 3: HISTORIAL COMPLETO DE TRAZABILIDAD
  // ========================================================================
  createHistorialSheet() {
    const ws = this.workbook.addWorksheet('Historial de Trazabilidad', {
      views: [{ showGridLines: true }]
    })
    
    let row = 1

    // ENCABEZADO
    ws.mergeCells(`A${row}:F${row}`)
    this.setHeaderCell(ws, `A${row}`, 'HISTORIAL COMPLETO DE TRAZABILIDAD', COLORS.headerPrimary, 16)
    ws.getRow(row).height = 30
    row += 2

    // Filtrar y procesar observaciones
    const historial = this.procesarHistorial()

    // Info del total
    ws.mergeCells(`A${row}:F${row}`)
    const infoCell = ws.getCell(`A${row}`)
    infoCell.value = `Total de Registros: ${historial.length}`
    infoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightBlue } }
    infoCell.font = { bold: true, size: 11 }
    infoCell.alignment = { horizontal: 'center', vertical: 'middle' }
    infoCell.border = this.allBorders()
    ws.getRow(row).height = 25
    row += 2

    // Headers de tabla
    const headers = ['#', 'Fecha/Hora', 'Acción/Estado', 'Detalles']
    headers.forEach((header, idx) => {
      const cell = ws.getCell(row, idx + 1)
      cell.value = header
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkGray } }
      cell.font = { bold: true, size: 10, color: { argb: COLORS.white } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = this.allBorders()
    })
    ws.getRow(row).height = 22
    row++

    // Datos del historial
    historial.forEach((registro, index) => {
      const accion = registro.accion || registro.estado || '-'
      const detalles = this.formatearDetallesRegistro(registro)

      const rowData = [
        index + 1,
        this.formatDateComplete(registro.timestamp),
        accion.replace(/_/g, ' ').toUpperCase(),
        detalles
      ]

      rowData.forEach((value, idx) => {
        const cell = ws.getCell(row, idx + 1)
        cell.value = value
        
        // Color según tipo de acción
        let fillColor = COLORS.white
        if (registro.accion === 'CREAR_CONCENTRADO') fillColor = COLORS.lightBlue
        else if (registro.accion === 'INICIAR_PROCESAMIENTO') fillColor = COLORS.lightGreen
        else if (registro.accion === 'MOVER_PROCESO') fillColor = COLORS.lightYellow
        else if (registro.accion === 'FINALIZAR_PROCESAMIENTO') fillColor = 'FFE9D5FF'

        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } }
        cell.font = { size: 9 }
        cell.alignment = { 
          horizontal: idx === 0 || idx === 3 ? 'center' : 'left',
          vertical: 'top',
          wrapText: true
        }
        cell.border = this.allBorders()
      })
      
      const alturaCalculada = Math.max(25, Math.ceil(detalles.length / 50) * 15)
      ws.getRow(row).height = alturaCalculada
      row++
    })

    ws.getColumn(1).width = 6   // #
    ws.getColumn(2).width = 25  // Fecha/Hora
    ws.getColumn(3).width = 25  // Acción/Estado
    ws.getColumn(4).width = 60  // Detalles
  }

  // ========================================================================
  // HOJA 4: LIQUIDACIÓN TOLL
  // ========================================================================
  createLiquidacionTollSheet() {
    const liq = this.concentrado.liquidacionToll
    const ws = this.workbook.addWorksheet('Liquidación Toll', {
      views: [{ showGridLines: true }]
    })
    
    let row = 1

    // ENCABEZADO
    ws.mergeCells(`A${row}:E${row}`)
    this.setHeaderCell(ws, `A${row}`, 'LIQUIDACIÓN DE PROCESAMIENTO (TOLL)', COLORS.info, 16)
    ws.getRow(row).height = 30
    row++

    ws.mergeCells(`A${row}:E${row}`)
    this.setHeaderCell(ws, `A${row}`, `Liquidación #${liq.id}`, COLORS.headerSecondary, 14)
    ws.getRow(row).height = 25
    row += 2

    // INFORMACIÓN GENERAL
    this.addSectionHeaderWide(ws, row, 'INFORMACIÓN GENERAL', 5)
    row++
    
    row = this.addDataRowWide(ws, row, 'ID Liquidación:', liq.id, 5)
    row = this.addDataRowWide(ws, row, 'Tipo:', this.capitalizeFirst(liq.tipoLiquidacion), 5)
    row = this.addDataRowWide(ws, row, 'Estado:', this.capitalizeFirst(liq.estado.replace(/_/g, ' ')), 5)
    row = this.addDataRowWide(ws, row, 'Moneda:', liq.moneda, 5)
    row++

    // SOCIO
    this.addSectionHeaderWide(ws, row, 'INFORMACIÓN DEL SOCIO', 5)
    row++
    
    row = this.addDataRowWide(ws, row, 'Nombre Completo:', `${liq.socioNombres} ${liq.socioApellidos}`, 5)
    row = this.addDataRowWide(ws, row, 'CI:', liq.socioCi, 5)
    row = this.addDataRowWide(ws, row, 'ID Socio:', liq.socioId, 5)
    row++

    // COSTOS DE PROCESAMIENTO
    this.addSectionHeaderWide(ws, row, 'COSTOS DE PROCESAMIENTO', 5)
    row++
    
    row = this.addDataRowWide(ws, row, 'Peso Total Entrada (Kg):', this.formatNumber(liq.pesoTotalEntradaKg), 5)
    row = this.addDataRowWide(ws, row, 'Peso Total (Ton):', this.formatNumber(liq.pesoTotalToneladas, 4), 5)
    row = this.addDataRowWide(ws, row, 'Costo por Tonelada:', this.formatCurrency(liq.costoPorTonelada, 'USD'), 5)
    row = this.addDataRowWide(ws, row, 'Costo Total Procesamiento:', this.formatCurrency(liq.costoProcesamientoTotal, 'USD'), 5)
    row++

    // SERVICIOS ADICIONALES
    if (liq.serviciosAdicionales) {
      this.addSectionHeaderWide(ws, row, 'SERVICIOS ADICIONALES', 5)
      row++

      if (liq.serviciosAdicionales.uso_balanza) {
        const servicio = liq.serviciosAdicionales.uso_balanza
        row = this.addDataRowWide(ws, row, 'Uso de Balanza:', 
          `${servicio.cantidad_camiones} camiones × ${this.formatCurrency(servicio.costo_unitario, servicio.moneda)} = ${this.formatCurrency(servicio.costo_total, servicio.moneda)}`, 5)
      }

      if (liq.serviciosAdicionales.retroexcavadora_grande) {
        const servicio = liq.serviciosAdicionales.retroexcavadora_grande
        row = this.addDataRowWide(ws, row, 'Retroexcavadora Grande:', 
          `${servicio.cantidad} ud. × ${this.formatCurrency(servicio.costo_unitario, servicio.moneda)} = ${this.formatCurrency(servicio.costo_total, servicio.moneda)}`, 5)
      }

      if (liq.serviciosAdicionales.retroexcavadora_pequena) {
        const servicio = liq.serviciosAdicionales.retroexcavadora_pequena
        row = this.addDataRowWide(ws, row, 'Retroexcavadora Pequeña:', 
          `${servicio.cantidad} ud. × ${this.formatCurrency(servicio.costo_unitario, servicio.moneda)} = ${this.formatCurrency(servicio.costo_total, servicio.moneda)}`, 5)
      }

      row = this.addDataRowWide(ws, row, 'Total Servicios (BOB):', this.formatCurrency(liq.serviciosAdicionales.total_bob, 'BOB'), 5)
      row = this.addDataRowWide(ws, row, 'Total Servicios (USD):', this.formatCurrency(liq.totalServiciosAdicionales, 'USD'), 5)
      row++
    }

    // RESULTADO FINAL
    this.addSectionHeaderWide(ws, row, 'TOTAL A PAGAR', 5)
    row++

    // Tabla de totales
    const totalesHeaders = ['Concepto', 'USD', 'BOB', 'TC', 'Observaciones']
    totalesHeaders.forEach((header, idx) => {
      const cell = ws.getCell(row, idx + 1)
      cell.value = header
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkGray } }
      cell.font = { bold: true, size: 10, color: { argb: COLORS.white } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = this.allBorders()
    })
    row++

    const totalesData = [
      ['Procesamiento', this.formatCurrency(liq.costoProcesamientoTotal, 'USD'), '-', '-', 'Costo base por tonelada'],
      ['Servicios', this.formatCurrency(liq.totalServiciosAdicionales, 'USD'), this.formatCurrency(liq.serviciosAdicionales?.total_bob || 0, 'BOB'), liq.tipoCambio, 'Servicios adicionales'],
      ['TOTAL', this.formatCurrency(liq.valorNetoUsd, 'USD'), this.formatCurrency(liq.valorNetoBob, 'BOB'), liq.tipoCambio, 'Total a pagar']
    ]

    totalesData.forEach((rowData, rIdx) => {
      rowData.forEach((value, cIdx) => {
        const cell = ws.getCell(row, cIdx + 1)
        cell.value = value
        
        if (rIdx === 2) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.info } }
          cell.font = { bold: true, size: 11, color: { argb: COLORS.white } }
        } else {
          cell.font = { size: 9 }
        }
        
        cell.alignment = { horizontal: cIdx === 0 || cIdx === 4 ? 'left' : 'right', vertical: 'middle' }
        cell.border = this.allBorders()
      })
      row++
    })
    row++

    // INFORMACIÓN DE PAGO
    if (liq.fechaPago && liq.estado === 'pagado') {
      this.addSectionHeaderWide(ws, row, 'INFORMACIÓN DE PAGO', 5)
      row++
      
      row = this.addDataRowWide(ws, row, 'Método de Pago:', this.capitalizeFirst(liq.metodoPago?.replace(/_/g, ' ') || '-'), 5)
      row = this.addDataRowWide(ws, row, 'Número de Comprobante:', liq.numeroComprobante || '-', 5)
      row = this.addDataRowWide(ws, row, 'Fecha de Pago:', this.formatDateComplete(liq.fechaPago), 5)
      row++
    }

    // LOTES INCLUIDOS
    if (liq.lotes?.length > 0) {
      this.addSectionHeaderWide(ws, row, `LOTES INCLUIDOS (${liq.totalLotes})`, 5)
      row++

      const loteHeaders = ['ID', 'Mina', 'Tipo', 'Peso (Kg)', 'Estado']
      loteHeaders.forEach((header, idx) => {
        const cell = ws.getCell(row, idx + 1)
        cell.value = header
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkGray } }
        cell.font = { bold: true, size: 10, color: { argb: COLORS.white } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = this.allBorders()
      })
      row++

      liq.lotes.forEach(lote => {
        const loteData = [
          lote.id,
          lote.minaNombre,
          this.capitalizeFirst(lote.tipoMineral),
          this.formatNumber(lote.pesoTotalReal),
          lote.estado || '-'
        ]

        loteData.forEach((value, idx) => {
          const cell = ws.getCell(row, idx + 1)
          cell.value = value
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } }
          cell.font = { size: 9 }
          cell.alignment = { 
            horizontal: idx === 0 || idx === 2 || idx === 4 ? 'center' : idx === 1 ? 'left' : 'right',
            vertical: 'middle'
          }
          cell.border = this.allBorders()
        })
        row++
      })
      row++
    }

    // FECHAS
    this.addSectionHeaderWide(ws, row, 'FECHAS', 5)
    row++
    
    row = this.addDataRowWide(ws, row, 'Creada:', this.formatDateComplete(liq.createdAt), 5)
    row = this.addDataRowWide(ws, row, 'Actualizada:', this.formatDateComplete(liq.updatedAt), 5)

    // Ajustar anchos
    ws.getColumn(1).width = 30
    ws.getColumn(2).width = 25
    ws.getColumn(3).width = 25
    ws.getColumn(4).width = 15
    ws.getColumn(5).width = 35
  }

  // ========================================================================
  // HOJA 5: LIQUIDACIONES DE VENTA
  // ========================================================================
  createLiquidacionesVentaSheet() {
    if (!this.concentrado.liquidacionesVenta || this.concentrado.liquidacionesVenta.length === 0) {
      return
    }

    const ws = this.workbook.addWorksheet('Liquidaciones de Venta', {
      views: [{ showGridLines: true }]
    })
    
    let row = 1

    // ENCABEZADO PRINCIPAL
    ws.mergeCells(`A${row}:F${row}`)
    this.setHeaderCell(ws, `A${row}`, 'LIQUIDACIONES DE VENTA A COMERCIALIZADORA', COLORS.success, 16)
    ws.getRow(row).height = 30
    row++

    ws.mergeCells(`A${row}:F${row}`)
    const infoCell = ws.getCell(`A${row}`)
    infoCell.value = `Total de Liquidaciones: ${this.concentrado.liquidacionesVenta.length}`
    infoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGreen } }
    infoCell.font = { bold: true, size: 11 }
    infoCell.alignment = { horizontal: 'center', vertical: 'middle' }
    infoCell.border = this.allBorders()
    ws.getRow(row).height = 25
    row += 2

    // Iterar sobre cada liquidación de venta
    this.concentrado.liquidacionesVenta.forEach((liq, index) => {
      if (index > 0) {
        row += 2 // Espaciado entre liquidaciones
      }

      // TÍTULO DE LA LIQUIDACIÓN
      ws.mergeCells(`A${row}:F${row}`)
      this.setHeaderCell(ws, `A${row}`, `LIQUIDACIÓN #${liq.id}`, COLORS.emerald, 14)
      ws.getRow(row).height = 28
      row++

      // INFORMACIÓN GENERAL
      this.addSectionHeaderWide(ws, row, 'INFORMACIÓN GENERAL', 6)
      row++
      
      row = this.addDataRowWide(ws, row, 'ID Liquidación:', liq.id, 6)
      row = this.addDataRowWide(ws, row, 'Tipo:', this.capitalizeFirst(liq.tipoLiquidacion.replace(/_/g, ' ')), 6)
      row = this.addDataRowWide(ws, row, 'Estado:', this.capitalizeFirst(liq.estado.replace(/_/g, ' ')), 6)
      row = this.addDataRowWide(ws, row, 'Moneda:', liq.moneda, 6)
      row++

      // COMERCIALIZADORA
      this.addSectionHeaderWide(ws, row, 'COMERCIALIZADORA', 6)
      row++
      
      row = this.addDataRowWide(ws, row, 'Nombre:', liq.comercializadoraNombre, 6)
      row = this.addDataRowWide(ws, row, 'NIT:', liq.comercializadoraNit, 6)
      row = this.addDataRowWide(ws, row, 'ID:', liq.comercializadoraId, 6)
      row++

      // CONCENTRADOS INCLUIDOS
      if (liq.concentrados?.length > 0) {
        this.addSectionHeaderWide(ws, row, `CONCENTRADOS INCLUIDOS (${liq.concentrados.length})`, 6)
        row++

        const concHeaders = ['ID', 'Código', 'Mineral', 'Peso Final (Kg)', 'Sacos', 'Estado']
        concHeaders.forEach((header, idx) => {
          const cell = ws.getCell(row, idx + 1)
          cell.value = header
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkGray } }
          cell.font = { bold: true, size: 10, color: { argb: COLORS.white } }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
          cell.border = this.allBorders()
        })
        row++

        liq.concentrados.forEach(conc => {
          const concData = [
            conc.id,
            conc.codigoConcentrado,
            conc.mineralPrincipal,
            this.formatNumber(conc.pesoFinal),
            conc.numeroSacos,
            this.capitalizeFirst(conc.estado.replace(/_/g, ' '))
          ]

          concData.forEach((value, idx) => {
            const cell = ws.getCell(row, idx + 1)
            cell.value = value
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } }
            cell.font = { size: 9 }
            cell.alignment = { 
              horizontal: idx === 0 || idx === 2 || idx === 4 || idx === 5 ? 'center' : idx === 1 ? 'left' : 'right',
              vertical: 'middle'
            }
            cell.border = this.allBorders()
          })
          row++
        })
        row++
      }

      // PESOS Y MEDIDAS
      this.addSectionHeaderWide(ws, row, 'PESOS Y MEDIDAS', 6)
      row++
      
      row = this.addDataRowWide(ws, row, 'Peso TMH:', this.formatNumber(liq.pesoTmh, 4), 6)
      row = this.addDataRowWide(ws, row, 'Peso TMS:', this.formatNumber(liq.pesoTms, 4), 6)
      row = this.addDataRowWide(ws, row, 'Peso Final TMS:', this.formatNumber(liq.pesoFinalTms, 4), 6)
      row++

      // ANÁLISIS QUÍMICO
      this.addSectionHeaderWide(ws, row, 'ANÁLISIS QUÍMICO', 6)
      row++

      // Tabla de reportes
      const reportHeaders = ['Origen', 'Ley Principal (%)', 'Ley Ag (g/MT)', 'H2O (%)', 'Laboratorio', 'Estado']
      reportHeaders.forEach((header, idx) => {
        const cell = ws.getCell(row, idx + 1)
        cell.value = header
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkGray } }
        cell.font = { bold: true, size: 9, color: { argb: COLORS.white } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = this.allBorders()
      })
      row++

      // Reporte del Socio
      if (liq.reporteSocio) {
        const reportData = [
          'Socio',
          this.formatNumber(liq.reporteSocio.leyMineralPrincipal, 4),
          this.formatNumber(liq.reporteSocio.leyAgGmt, 4),
          this.formatNumber(liq.reporteSocio.porcentajeH2o, 2),
          liq.reporteSocio.laboratorio?.toUpperCase() || '-',
          this.capitalizeFirst(liq.reporteSocio.estado)
        ]

        reportData.forEach((value, idx) => {
          const cell = ws.getCell(row, idx + 1)
          cell.value = value
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightBlue } }
          cell.font = { size: 9 }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
          cell.border = this.allBorders()
        })
        row++
      }

      // Reporte de Comercializadora
      if (liq.reporteComercializadora) {
        const reportData = [
          'Comercializadora',
          this.formatNumber(liq.reporteComercializadora.leyMineralPrincipal, 4),
          this.formatNumber(liq.reporteComercializadora.leyAgGmt, 4),
          this.formatNumber(liq.reporteComercializadora.porcentajeH2o, 2),
          liq.reporteComercializadora.laboratorio?.toUpperCase() || '-',
          this.capitalizeFirst(liq.reporteComercializadora.estado)
        ]

        reportData.forEach((value, idx) => {
          const cell = ws.getCell(row, idx + 1)
          cell.value = value
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightYellow } }
          cell.font = { size: 9 }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
          cell.border = this.allBorders()
        })
        row++
      }

      // Reporte Acordado
      if (liq.reporteAcordado) {
        const reportData = [
          'ACORDADO',
          this.formatNumber(liq.reporteAcordado.leyMineralPrincipal, 4),
          this.formatNumber(liq.reporteAcordado.leyAgGmt, 4),
          this.formatNumber(liq.reporteAcordado.porcentajeH2o, 2),
          '-',
          this.capitalizeFirst(liq.reporteAcordado.estado)
        ]

        reportData.forEach((value, idx) => {
          const cell = ws.getCell(row, idx + 1)
          cell.value = value
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGreen } }
          cell.font = { size: 9, bold: true }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
          cell.border = this.allBorders()
        })
        row++
      }
      row++

      // VALORIZACIÓN
      this.addSectionHeaderWide(ws, row, 'VALORIZACIÓN', 6)
      row++
      
      row = this.addDataRowWide(ws, row, 'Mineral Principal:', `${liq.mineralPrincipal} - Ley Promedio: ${this.formatNumber(liq.leyMineralPrincipalPromedio, 2)}%`, 6)
      row = this.addDataRowWide(ws, row, 'Cotización Internacional:', this.formatCurrency(liq.cotizacionInternacionalUsd, 'USD'), 6)
      row = this.addDataRowWide(ws, row, 'Valor Bruto:', this.formatCurrency(liq.valorBrutoUsd, 'USD'), 6)
      row = this.addDataRowWide(ws, row, 'Total Deducciones:', this.formatCurrency(liq.totalDeduccionesUsd, 'USD'), 6)
      row++

      // DEDUCCIONES DETALLADAS
      if (liq.deducciones?.length > 0) {
        this.addSectionHeaderWide(ws, row, 'DEDUCCIONES', 6)
        row++

        const dedHeaders = ['Concepto', 'Porcentaje', 'Monto USD', 'Monto BOB']
        dedHeaders.forEach((header, idx) => {
          const cell = ws.getCell(row, idx + 1)
          cell.value = header
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkGray } }
          cell.font = { bold: true, size: 9, color: { argb: COLORS.white } }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
          cell.border = this.allBorders()
        })
        row++

        liq.deducciones.forEach(ded => {
          const dedData = [
            ded.nombre,
            `${this.formatNumber(ded.porcentaje, 4)}%`,
            this.formatCurrency(ded.montoUsd, 'USD'),
            this.formatCurrency(ded.montoBob, 'BOB')
          ]

          dedData.forEach((value, idx) => {
            const cell = ws.getCell(row, idx + 1)
            cell.value = value
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } }
            cell.font = { size: 9 }
            cell.alignment = { 
              horizontal: idx === 0 ? 'left' : idx === 1 ? 'center' : 'right',
              vertical: 'middle'
            }
            cell.border = this.allBorders()
          })
          row++
        })
        row++
      }

      // TOTAL A RECIBIR
      this.addSectionHeaderWide(ws, row, 'TOTAL A RECIBIR POR EL SOCIO', 6)
      row++

      const totalesHeaders = ['Concepto', 'USD', 'BOB', 'TC']
      totalesHeaders.forEach((header, idx) => {
        const cell = ws.getCell(row, idx + 1)
        cell.value = header
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkGray } }
        cell.font = { bold: true, size: 10, color: { argb: COLORS.white } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = this.allBorders()
      })
      row++

      const totalData = [
        'NETO A RECIBIR',
        this.formatCurrency(liq.valorNetoUsd, 'USD'),
        this.formatCurrency(liq.valorNetoBob, 'BOB'),
        liq.tipoCambio
      ]

      totalData.forEach((value, idx) => {
        const cell = ws.getCell(row, idx + 1)
        cell.value = value
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.success } }
        cell.font = { bold: true, size: 11, color: { argb: COLORS.white } }
        cell.alignment = { horizontal: idx === 0 ? 'left' : 'right', vertical: 'middle' }
        cell.border = this.allBorders()
      })
      ws.getRow(row).height = 25
      row++
      row++

      // INFORMACIÓN DE PAGO
      if (liq.fechaPago && liq.estado === 'pagado') {
        this.addSectionHeaderWide(ws, row, 'INFORMACIÓN DE PAGO', 6)
        row++
        
        row = this.addDataRowWide(ws, row, 'Método de Pago:', this.capitalizeFirst(liq.metodoPago?.replace(/_/g, ' ') || '-'), 6)
        row = this.addDataRowWide(ws, row, 'Número de Comprobante:', liq.numeroComprobante || '-', 6)
        row = this.addDataRowWide(ws, row, 'Fecha de Pago:', this.formatDateComplete(liq.fechaPago), 6)
        row = this.addDataRowWide(ws, row, 'Fecha de Aprobación:', this.formatDateComplete(liq.fechaAprobacion), 6)
        row++
      }

      // FECHAS
      this.addSectionHeaderWide(ws, row, 'FECHAS', 6)
      row++
      
      row = this.addDataRowWide(ws, row, 'Creada:', this.formatDateComplete(liq.createdAt), 6)
      row = this.addDataRowWide(ws, row, 'Actualizada:', this.formatDateComplete(liq.updatedAt), 6)
    })

    // Ajustar anchos de columnas
    ws.getColumn(1).width = 30
    ws.getColumn(2).width = 25
    ws.getColumn(3).width = 25
    ws.getColumn(4).width = 20
    ws.getColumn(5).width = 20
    ws.getColumn(6).width = 30
  }

  // ========================================================================
  // UTILIDADES DE FORMATO
  // ========================================================================
  
  setHeaderCell(ws, cellRef, text, color, fontSize = 14) {
    const cell = ws.getCell(cellRef)
    cell.value = text
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } }
    cell.font = { bold: true, size: fontSize, color: { argb: COLORS.white } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = this.allBorders()
  }

  addSectionHeader(ws, row, text, colSpan = 2) {
    ws.mergeCells(`A${row}:${String.fromCharCode(64 + colSpan)}${row}`)
    const cell = ws.getCell(`A${row}`)
    cell.value = text
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerSecondary } }
    cell.font = { bold: true, size: 12, color: { argb: COLORS.white } }
    cell.alignment = { horizontal: 'left', vertical: 'middle' }
    cell.border = this.allBorders()
    ws.getRow(row).height = 25
  }

  addSectionHeaderWide(ws, row, text, colSpan = 5) {
    ws.mergeCells(`A${row}:${String.fromCharCode(64 + colSpan)}${row}`)
    const cell = ws.getCell(`A${row}`)
    cell.value = text
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerSecondary } }
    cell.font = { bold: true, size: 11, color: { argb: COLORS.white } }
    cell.alignment = { horizontal: 'left', vertical: 'middle' }
    cell.border = this.allBorders()
    ws.getRow(row).height = 23
  }

  addDataRow(ws, row, label, value) {
    const labelCell = ws.getCell(`A${row}`)
    labelCell.value = label
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } }
    labelCell.font = { bold: true, size: 10 }
    labelCell.alignment = { horizontal: 'right', vertical: 'middle' }
    labelCell.border = this.allBorders()

    const valueCell = ws.getCell(`B${row}`)
    valueCell.value = value
    valueCell.font = { size: 10 }
    valueCell.alignment = { horizontal: 'left', vertical: 'middle' }
    valueCell.border = this.allBorders()
    
    ws.getRow(row).height = 20
    return row + 1
  }

  addDataRowWide(ws, row, label, value, colSpan = 5) {
    const labelCell = ws.getCell(`A${row}`)
    labelCell.value = label
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } }
    labelCell.font = { bold: true, size: 10 }
    labelCell.alignment = { horizontal: 'right', vertical: 'middle' }
    labelCell.border = this.allBorders()

    ws.mergeCells(`B${row}:${String.fromCharCode(64 + colSpan)}${row}`)
    const valueCell = ws.getCell(`B${row}`)
    valueCell.value = value
    valueCell.font = { size: 10 }
    valueCell.alignment = { horizontal: 'left', vertical: 'middle' }
    valueCell.border = this.allBorders()
    
    ws.getRow(row).height = 20
    return row + 1
  }

  allBorders() {
    return {
      top: { style: 'thin', color: { argb: COLORS.borderGray } },
      left: { style: 'thin', color: { argb: COLORS.borderGray } },
      bottom: { style: 'thin', color: { argb: COLORS.borderGray } },
      right: { style: 'thin', color: { argb: COLORS.borderGray } }
    }
  }

  // ========================================================================
  // UTILIDADES DE PROCESAMIENTO DE DATOS
  // ========================================================================

  procesarHistorial() {
    if (!Array.isArray(this.concentrado.observaciones)) return []
    
    // Filtrar registros duplicados o irrelevantes
    return this.concentrado.observaciones.filter(obs => {
      // Excluir registros básicos que ya están en acciones
      if (obs.estado === 'creado' && !obs.accion) return false
      if (obs.estado === 'en_camino_a_planta' && !obs.accion) return false
      if (obs.estado === 'en_proceso' && obs.descripcion?.includes('Procesamiento iniciado')) return false
      
      return true
    }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  }

  obtenerObservacionesProceso(proceso) {
    if (!Array.isArray(this.concentrado.observaciones)) return '-'
    
    const observaciones = []
    
    // Buscar observaciones de inicio
    const inicio = this.concentrado.observaciones.find(obs => 
      obs.accion === 'INICIAR_PROCESAMIENTO' && 
      obs.detalles?.proceso_id === proceso.id
    )
    if (inicio?.detalles?.observaciones_inicio) {
      observaciones.push(`Inicio: ${inicio.detalles.observaciones_inicio}`)
    }
    
    // Buscar observaciones de movimiento
    const movimientos = this.concentrado.observaciones.filter(obs => 
      obs.accion === 'MOVER_PROCESO' && 
      (obs.detalles?.proceso_origen?.id === proceso.id || obs.detalles?.proceso_destino?.id === proceso.id)
    )
    
    movimientos.forEach(mov => {
      if (mov.detalles?.proceso_origen?.id === proceso.id && mov.detalles?.observaciones_fin_proceso) {
        observaciones.push(`Fin: ${mov.detalles.observaciones_fin_proceso}`)
      }
      if (mov.detalles?.proceso_destino?.id === proceso.id && mov.detalles?.observaciones_inicio_proceso) {
        observaciones.push(`Inicio: ${mov.detalles.observaciones_inicio_proceso}`)
      }
    })
    
    return observaciones.length > 0 ? observaciones.join(' | ') : '-'
  }

  formatearDetallesRegistro(registro) {
    const detalles = []
    
    if (registro.observaciones) {
      detalles.push(`Obs: ${registro.observaciones}`)
    }
    

    
    
    if (registro.detalles) {
      const det = registro.detalles
      
      if (det.concentrados_hermanos) {
        detalles.push(`Hermanos: ${det.concentrados_hermanos.join(', ')}`)
      }
      
      if (det.proceso_nombre) {
        detalles.push(`Proceso: ${det.proceso_nombre}`)
      }
      
      if (det.proceso_origen && det.proceso_destino) {
        detalles.push(`${det.proceso_origen.nombre} → ${det.proceso_destino.nombre}`)
      }
      
      if (det.pesos_finales) {
        detalles.push(`Peso final: ${det.pesos_finales.peso_final} kg, Merma: ${det.pesos_finales.porcentaje_merma}%`)
      }

    }
    
    return detalles.length > 0 ? detalles.join(' | ') : '-'
  }

  calcularEstadisticasProcesos() {
    if (!this.kanban?.todosProcesos?.length) return null
    
    const procesosConTiempo = this.kanban.todosProcesos.filter(p => p.fechaInicio && p.fechaFin)
    if (procesosConTiempo.length === 0) return null
    
    const duraciones = procesosConTiempo.map(p => ({
      nombre: p.nombreProceso,
      milisegundos: new Date(p.fechaFin) - new Date(p.fechaInicio)
    }))
    
    const totalMs = duraciones.reduce((sum, d) => sum + d.milisegundos, 0)
    const promedioMs = totalMs / duraciones.length
    
    const masRapido = duraciones.reduce((min, d) => d.milisegundos < min.milisegundos ? d : min)
    const masLento = duraciones.reduce((max, d) => d.milisegundos > max.milisegundos ? d : max)
    
    return {
      duracionTotal: this.formatearDuracion(totalMs),
      promedio: this.formatearDuracion(promedioMs),
      masRapido: {
        nombre: masRapido.nombre,
        duracion: this.formatearDuracion(masRapido.milisegundos)
      },
      masLento: {
        nombre: masLento.nombre,
        duracion: this.formatearDuracion(masLento.milisegundos)
      }
    }
  }

  // ========================================================================
  // UTILIDADES DE FORMATO
  // ========================================================================

  formatearDuracion(milisegundos) {
    const segundos = Math.floor(milisegundos / 1000)
    const minutos = Math.floor(segundos / 60)
    const horas = Math.floor(minutos / 60)
    
    if (horas > 0) {
      return `${horas}h ${minutos % 60}m ${segundos % 60}s`
    } else if (minutos > 0) {
      return `${minutos}m ${segundos % 60}s`
    } else {
      return `${segundos}s`
    }
  }

  calcularDuracion(inicio, fin) {
    if (!inicio || !fin) return '-'
    const diff = new Date(fin) - new Date(inicio)
    return this.formatearDuracion(diff)
  }

  calcularDuracionCompleta(inicio, fin) {
    if (!inicio || !fin) return '-'
    const diff = new Date(fin) - new Date(inicio)
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    const partes = []
    if (dias > 0) partes.push(`${dias} día${dias > 1 ? 's' : ''}`)
    if (horas > 0) partes.push(`${horas} hora${horas > 1 ? 's' : ''}`)
    if (minutos > 0) partes.push(`${minutos} minuto${minutos > 1 ? 's' : ''}`)
    
    return partes.join(', ')
  }

  formatDateComplete(dateString) {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('es-BO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  formatCurrency(value, currency = 'BOB') {
    if (value === null || value === undefined) return '-'
    const formatted = new Intl.NumberFormat('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
    
    const symbol = currency === 'USD' ? '$' : currency === 'BOB' ? 'Bs' : currency
    return `${symbol} ${formatted}`
  }

  formatNumber(value, decimals = 2) {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('es-BO', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value)
  }

  capitalizeFirst(str) {
    if (!str) return ''
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }
}

// ============================================================================
// FUNCIONES PÚBLICAS
// ============================================================================

export async function exportarConcentradoExcelCompleto(concentrado, kanban = null, nombreArchivo = null) {
  const generator = new ConcentradoExcelReportGenerator(concentrado, kanban)
  const workbook = generator.generate()
  
  const fileName =  `Concentrado_${concentrado.id}_Completo_${new Date().toISOString().split('T')[0]}.xlsx`
  
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  })
  
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  window.URL.revokeObjectURL(url)
}

export function generarReporteConsolidadoConcentrado(concentrado, kanban = null) {
  const generator = new ConcentradoExcelReportGenerator(concentrado, kanban)
  return generator.generate()
}

export default {
  exportarConcentradoExcelCompleto,
  generarReporteConsolidadoConcentrado
}