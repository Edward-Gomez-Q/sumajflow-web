// src/utils/reports/excelReportGenerator.js
// GENERADOR EXCEL PROFESIONAL COMPLETO - VERSIÓN MEJORADA

import ExcelJS from 'exceljs'

// ============================================================================
// CONFIGURACIÓN DE ESTILOS PROFESIONALES
// ============================================================================

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
  gold: 'FFEAB308',
  silver: 'FF9CA3AF',
  copper: 'FFD97706',
  white: 'FFFFFFFF',
  black: 'FF000000',
  darkGray: 'FF1F2937',
  borderGray: 'FFE5E7EB'
}

// ============================================================================
// CLASE PRINCIPAL GENERADOR EXCEL
// ============================================================================

class ExcelReportGenerator {
  constructor(lote, rol = 'socio') {
    this.lote = lote
    this.rol = rol
    this.workbook = new ExcelJS.Workbook()
  }

generate() {
  this.createInformacionGeneralSheet()
  this.createTransporteSheet()
  
  // Para socios: mostrar liquidaciones completas
  if (this.rol === 'socio') {
    if (this.lote.tipoOperacion === 'venta_directa' && this.lote.liquidacionVentaDirecta) {
      this.createLiquidacionVentaSheet()
    } else if (this.lote.tipoOperacion === 'procesamiento_planta' && this.lote.liquidacionToll) {
      this.createLiquidacionTollSheet()
    }
  }
  
  // Para cooperativa: mostrar deducciones
  if (this.rol === 'cooperativa') {
    this.createDeduccionesCooperativaSheet()
  }
  
  return this.workbook
}

  // ==========================================================================
  // HOJA 1: INFORMACIÓN GENERAL
  // ==========================================================================
  createInformacionGeneralSheet() {
    const ws = this.workbook.addWorksheet('Información General')
    let rowNum = 1

    // TÍTULO PRINCIPAL
    ws.mergeCells(`A${rowNum}:B${rowNum}`)
    const titleCell = ws.getCell(`A${rowNum}`)
    titleCell.value = 'REPORTE CONSOLIDADO DE LOTE'
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerPrimary } }
    titleCell.font = { bold: true, size: 16, color: { argb: COLORS.white } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(rowNum).height = 30
    rowNum++

    // SUBTÍTULO
    ws.mergeCells(`A${rowNum}:B${rowNum}`)
    const subtitleCell = ws.getCell(`A${rowNum}`)
    subtitleCell.value = `Lote #${this.lote.id}`
    subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerSecondary } }
    subtitleCell.font = { bold: true, size: 14, color: { argb: COLORS.white } }
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(rowNum).height = 25
    rowNum++
    rowNum++ // Espacio

    // SECCIONES
    this.addSectionHeader(ws, rowNum, 'INFORMACIÓN DEL LOTE')
    rowNum++
    rowNum = this.addLabelValue(ws, rowNum, 'Estado:', this.lote.estado)
    rowNum = this.addLabelValue(ws, rowNum, 'Tipo de Operación:', 
      this.lote.tipoOperacion === 'venta_directa' ? 'Venta Directa' : 'Procesamiento en Planta')
    rowNum = this.addLabelValue(ws, rowNum, 'Tipo de Mineral:', this.capitalizeFirst(this.lote.tipoMineral))
    rowNum = this.addLabelValue(ws, rowNum, 'Fecha de Creación:', this.formatDate(this.lote.fechaCreacion))
    rowNum++

    this.addSectionHeader(ws, rowNum, 'SOCIO PROPIETARIO')
    rowNum++
    rowNum = this.addLabelValue(ws, rowNum, 'Nombres:', this.lote.socioNombres)
    rowNum = this.addLabelValue(ws, rowNum, 'Apellidos:', this.lote.socioApellidos)
    rowNum++

    this.addSectionHeader(ws, rowNum, 'MINA DE ORIGEN')
    rowNum++
    rowNum = this.addLabelValue(ws, rowNum, 'Nombre:', this.lote.minaNombre)
    rowNum = this.addLabelValue(ws, rowNum, 'Sector:', this.lote.sectorNombre)
    rowNum = this.addLabelValue(ws, rowNum, 'Coordenadas:', `${this.lote.minaLatitud}, ${this.lote.minaLongitud}`)
    rowNum++

    this.addSectionHeader(ws, rowNum, 'DESTINO')
    rowNum++
    rowNum = this.addLabelValue(ws, rowNum, 'Nombre:', this.lote.destinoNombre)
    rowNum = this.addLabelValue(ws, rowNum, 'Tipo:', this.lote.destinoTipo === 'ingenio' ? 'Ingenio Minero' : 'Comercializadora')
    rowNum = this.addLabelValue(ws, rowNum, 'NIT:', this.lote.destinoNIT)
    rowNum = this.addLabelValue(ws, rowNum, 'Dirección:', this.lote.destinoDireccion)
    rowNum = this.addLabelValue(ws, rowNum, 'Municipio:', `${this.lote.destinoMunicipio}, ${this.lote.destinoDepartamento}`)
    rowNum = this.addLabelValue(ws, rowNum, 'Teléfono:', this.lote.destinoTelefono || '-')
    rowNum++

    this.addSectionHeader(ws, rowNum, 'INFORMACIÓN DE PESOS')
    rowNum++
    rowNum = this.addLabelValue(ws, rowNum, 'Peso Estimado (Kg):', this.formatNumber(this.lote.pesoTotalEstimado))
    rowNum = this.addLabelValue(ws, rowNum, 'Peso Real (Kg):', this.formatNumber(this.lote.pesoTotalReal))
    rowNum = this.addLabelValue(ws, rowNum, 'Peso Real (Ton):', this.formatNumber(this.lote.pesoTotalReal / 1000, 4))
    rowNum++

    this.addSectionHeader(ws, rowNum, 'CAMIONES')
    rowNum++
    rowNum = this.addLabelValue(ws, rowNum, 'Solicitados:', this.lote.camionlesSolicitados)
    rowNum = this.addLabelValue(ws, rowNum, 'Asignados:', this.lote.camioneAsignados || 0)
    rowNum++

    this.addSectionHeader(ws, rowNum, 'CRONOLOGÍA')
    rowNum++
    rowNum = this.addLabelValue(ws, rowNum, 'Creación:', this.formatDate(this.lote.fechaCreacion))
    if (this.lote.fechaAprobacionCooperativa) {
      rowNum = this.addLabelValue(ws, rowNum, 'Aprobación Cooperativa:', this.formatDate(this.lote.fechaAprobacionCooperativa))
    }
    if (this.lote.fechaAprobacionDestino) {
      rowNum = this.addLabelValue(ws, rowNum, 'Aprobación Destino:', this.formatDate(this.lote.fechaAprobacionDestino))
    }
    if (this.lote.fechaInicioTransporte) {
      rowNum = this.addLabelValue(ws, rowNum, 'Inicio Transporte:', this.formatDate(this.lote.fechaInicioTransporte))
    }
    if (this.lote.fechaFinTransporte) {
      rowNum = this.addLabelValue(ws, rowNum, 'Fin Transporte:', this.formatDate(this.lote.fechaFinTransporte))
    }

    ws.getColumn(1).width = 30
    ws.getColumn(2).width = 50
  }

  // ==========================================================================
  // HOJA 2: TRANSPORTE
  // ==========================================================================
  createTransporteSheet() {
    const ws = this.workbook.addWorksheet('Transporte')
    let rowNum = 1

    // Título
    ws.mergeCells(`A${rowNum}:H${rowNum}`)
    const titleCell = ws.getCell(`A${rowNum}`)
    titleCell.value = 'DETALLE DE TRANSPORTE Y CAMIONES'
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerPrimary } }
    titleCell.font = { bold: true, size: 14, color: { argb: COLORS.white } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(rowNum).height = 25
    rowNum++
    rowNum++

    if (!this.lote.asignaciones || this.lote.asignaciones.length === 0) {
      ws.getCell(`A${rowNum}`).value = 'No hay camiones asignados a este lote'
      ws.getCell(`A${rowNum}`).font = { italic: true, color: { argb: 'FF6B7280' } }
      return
    }

    // TABLA RESUMEN
    this.addSectionHeader(ws, rowNum, 'RESUMEN DE CAMIONES', 8)
    rowNum++
    rowNum++

    // Headers de tabla
    const headers = ['Camión #', 'Estado', 'Transportista', 'Placa', 'Teléfono', 'Peso Origen (Kg)', 'Peso Destino (Kg)', 'Diferencia (Kg)']
    headers.forEach((header, col) => {
      const cell = ws.getCell(rowNum, col + 1)
      cell.value = header
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkGray } }
      cell.font = { bold: true, size: 10, color: { argb: COLORS.white } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = this.allBorders()
    })
    ws.getRow(rowNum).height = 20
    rowNum++

    // Datos de camiones
    this.lote.asignaciones.forEach((c, index) => {
      const diff = c.pesajeDestinoNetoKg && c.pesajeOrigenNetoKg 
        ? c.pesajeDestinoNetoKg - c.pesajeOrigenNetoKg 
        : 0

      const rowData = [
        c.numeroCamion,
        c.estado,
        c.transportistaNombre,
        c.transportistaPlaca,
        c.transportistaTelefono || '-',
        c.pesajeOrigenNetoKg || '-',
        c.pesajeDestinoNetoKg || '-',
        diff
      ]

      rowData.forEach((value, col) => {
        const cell = ws.getCell(rowNum, col + 1)
        cell.value = value
        cell.fill = { 
          type: 'pattern', 
          pattern: 'solid', 
          fgColor: { argb: index % 2 === 0 ? COLORS.white : COLORS.lightGray } 
        }
        cell.font = { size: 9 }
        cell.alignment = { 
          horizontal: col < 5 ? 'left' : 'right', 
          vertical: 'middle' 
        }
        cell.border = this.allBorders()
      })
      rowNum++
    })

    // Anchos de columna
    ws.getColumn(1).width = 10
    ws.getColumn(2).width = 25
    ws.getColumn(3).width = 30
    ws.getColumn(4).width = 15
    ws.getColumn(5).width = 18
    ws.getColumn(6).width = 18
    ws.getColumn(7).width = 18
    ws.getColumn(8).width = 18
  }

  // ==========================================================================
  // HOJA 3: LIQUIDACIÓN VENTA DIRECTA (VERSIÓN COMPLETA)
  // ==========================================================================
  createLiquidacionVentaSheet() {
    const liq = this.lote.liquidacionVentaDirecta
    if (!liq) return

    const ws = this.workbook.addWorksheet('Liquidación Venta')
    let rowNum = 1

    // TÍTULO
    ws.mergeCells(`A${rowNum}:G${rowNum}`)
    const titleCell = ws.getCell(`A${rowNum}`)
    titleCell.value = 'LIQUIDACIÓN DE VENTA DIRECTA'
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.success } }
    titleCell.font = { bold: true, size: 16, color: { argb: COLORS.white } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(rowNum).height = 30
    rowNum++

    ws.mergeCells(`A${rowNum}:G${rowNum}`)
    const subtitleCell = ws.getCell(`A${rowNum}`)
    subtitleCell.value = `Liquidación #${liq.id}`
    subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerSecondary } }
    subtitleCell.font = { bold: true, size: 14, color: { argb: COLORS.white } }
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    rowNum++
    rowNum++

    // INFORMACIÓN BÁSICA
    this.addSectionHeader(ws, rowNum, 'INFORMACIÓN GENERAL', 7)
    rowNum++
    rowNum = this.addLabelValueWide(ws, rowNum, 'Tipo:', liq.tipoLiquidacion.replace(/_/g, ' ').toUpperCase())
    rowNum = this.addLabelValueWide(ws, rowNum, 'Estado:', this.capitalizeFirst(liq.estado.replace(/_/g, ' ')))
    rowNum = this.addLabelValueWide(ws, rowNum, 'Socio:', `${liq.socio.nombres} ${liq.socio.apellidos}`)
    rowNum = this.addLabelValueWide(ws, rowNum, 'CI:', liq.socio.ci)
    rowNum = this.addLabelValueWide(ws, rowNum, 'Comercializadora:', liq.comercializadora.razonSocial)
    rowNum = this.addLabelValueWide(ws, rowNum, 'NIT:', liq.comercializadora.nit)
    rowNum++

    // PESOS
    if (liq.pesos) {
      this.addSectionHeader(ws, rowNum, 'INFORMACIÓN DE PESOS', 7)
      rowNum++
      rowNum = this.addLabelValueWide(ws, rowNum, 'Peso Total Entrada (Kg):', this.formatNumber(liq.pesos.pesoTotalEntrada))
      rowNum = this.addLabelValueWide(ws, rowNum, 'Peso TMH (Ton):', this.formatNumber(liq.pesos.pesoTmh, 4))
      if (liq.pesos.pesoUsadoEnCalculo) {
        rowNum = this.addLabelValueWide(ws, rowNum, 'Peso Usado en Cálculo:', liq.pesos.pesoUsadoEnCalculo)
      }
      rowNum++
    }

    // LEYES ACORDADAS
    if (liq.reportesQuimicos?.reporteAcordado) {
      const ra = liq.reportesQuimicos.reporteAcordado
      this.addSectionHeader(ws, rowNum, 'LEYES ACORDADAS', 7)
      rowNum++
      rowNum = this.addLabelValueWide(ws, rowNum, 'Ley Ag (DM):', this.formatNumber(ra.leyAgDm, 4), COLORS.lightYellow)
      rowNum = this.addLabelValueWide(ws, rowNum, 'Ley Pb (%):', this.formatNumber(ra.leyPb, 4), COLORS.lightYellow)
      rowNum = this.addLabelValueWide(ws, rowNum, 'Ley Zn (%):', this.formatNumber(ra.leyZn, 4), COLORS.lightYellow)
      rowNum++
    }

    // COTIZACIONES
    if (liq.cotizaciones && liq.cotizaciones.length > 0) {
      this.addSectionHeader(ws, rowNum, 'COTIZACIONES DE MINERALES', 7)
      rowNum++
      
      const headers = ['Mineral', 'Cotización', 'Unidad', 'Fuente']
      headers.forEach((header, col) => {
        const cell = ws.getCell(rowNum, col + 1)
        cell.value = header
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.gold } }
        cell.font = { bold: true, size: 10, color: { argb: COLORS.white } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = this.allBorders()
      })
      rowNum++

      liq.cotizaciones.forEach((c, index) => {
        const rowData = [c.mineral, this.formatNumber(c.cotizacion, 6), c.unidad, c.fuente]
        rowData.forEach((value, col) => {
          const cell = ws.getCell(rowNum, col + 1)
          cell.value = value
          cell.fill = { 
            type: 'pattern', 
            pattern: 'solid', 
            fgColor: { argb: index % 2 === 0 ? COLORS.white : COLORS.lightYellow } 
          }
          cell.font = { size: 9, bold: col === 0 }
          cell.alignment = { 
            horizontal: col === 1 ? 'right' : col === 0 ? 'center' : 'left', 
            vertical: 'middle' 
          }
          cell.border = this.allBorders()
        })
        rowNum++
      })
      rowNum++
    }

    // VALORACIÓN
    if (liq.valoracion) {
      this.addSectionHeader(ws, rowNum, 'VALORACIÓN DEL LOTE', 7)
      rowNum++
      rowNum = this.addLabelValueWide(ws, rowNum, 'Mineral Principal:', liq.valoracion.mineralPrincipal, COLORS.lightBlue)
      rowNum = this.addLabelValueWide(ws, rowNum, 'Valor USD/Ton:', this.formatCurrency(liq.valoracion.valorTotalUsdPorTon, 'USD'), COLORS.lightBlue)
      rowNum = this.addLabelValueWide(ws, rowNum, 'Valor Bruto Total:', this.formatCurrency(liq.valoracion.valorBrutoTotalUsd, 'USD'), COLORS.lightBlue)
      rowNum++
    }

    // DEDUCCIONES COMPLETAS
    if (liq.deducciones && liq.deducciones.deducciones.length > 0) {
      this.addSectionHeader(ws, rowNum, 'DEDUCCIONES APLICADAS', 7)
      rowNum++
      
      const headers = ['Concepto', 'Porcentaje (%)', 'Monto USD', 'Monto BOB']
      headers.forEach((header, col) => {
        const cell = ws.getCell(rowNum, col + 1)
        cell.value = header
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.error } }
        cell.font = { bold: true, size: 10, color: { argb: COLORS.white } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = this.allBorders()
      })
      rowNum++

      liq.deducciones.deducciones.forEach((d, index) => {
        const rowData = [
          d.concepto, 
          this.formatNumber(d.porcentaje, 2),
          this.formatCurrency(d.montoDeducidoUsd, 'USD'),
          this.formatCurrency(d.montoDeducidoBob, 'BOB')
        ]
        
        rowData.forEach((value, col) => {
          const cell = ws.getCell(rowNum, col + 1)
          cell.value = value
          cell.fill = { 
            type: 'pattern', 
            pattern: 'solid', 
            fgColor: { argb: index % 2 === 0 ? COLORS.white : COLORS.lightRed } 
          }
          cell.font = { size: 9 }
          cell.alignment = { 
            horizontal: col > 0 ? 'right' : 'left', 
            vertical: 'middle' 
          }
          cell.border = this.allBorders()
        })
        rowNum++
      })

      // FILA TOTAL DEDUCCIONES
      const totalRowData = [
        'TOTAL DEDUCCIONES',
        this.formatNumber(liq.deducciones.porcentajeTotal, 2),
        this.formatCurrency(liq.deducciones.totalDeduccionesUsd, 'USD'),
        this.formatCurrency(liq.deducciones.totalDeduccionesBob, 'BOB')
      ]
      
      totalRowData.forEach((value, col) => {
        const cell = ws.getCell(rowNum, col + 1)
        cell.value = value
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } }
        cell.font = { size: 10, bold: true }
        cell.alignment = { 
          horizontal: col > 0 ? 'right' : 'left', 
          vertical: 'middle' 
        }
        cell.border = this.allBorders()
      })
      rowNum++
      rowNum++
    }

    // RESULTADO FINAL (DESTACADO)
    if (liq.resultadoFinal) {
      this.addSectionHeader(ws, rowNum, '💰 RESULTADO FINAL', 7)
      rowNum++
      
      const finalData = [
        ['Concepto', 'USD', 'BOB', 'TC'],
        ['Valor Bruto', this.formatCurrency(liq.resultadoFinal.valorBrutoUsd, 'USD'), '-', ''],
        ['Deducciones', '- ' + this.formatCurrency(liq.resultadoFinal.totalDeduccionesUsd, 'USD'), '-', ''],
        ['VALOR NETO', this.formatCurrency(liq.resultadoFinal.valorNetoUsd, 'USD'), this.formatCurrency(liq.resultadoFinal.valorNetoBob, 'BOB'), liq.resultadoFinal.tipoCambio]
      ]

      finalData.forEach((row, rIdx) => {
        row.forEach((value, cIdx) => {
          const cell = ws.getCell(rowNum, cIdx + 1)
          cell.value = value
          
          if (rIdx === 0) {
            // Header
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkGray } }
            cell.font = { bold: true, size: 10, color: { argb: COLORS.white } }
          } else if (rIdx === 3) {
            // Valor neto (DESTACADO)
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.success } }
            cell.font = { bold: true, size: 12, color: { argb: COLORS.white } }
          } else {
            cell.font = { size: 9 }
          }
          
          cell.alignment = { horizontal: cIdx > 0 ? 'right' : 'left', vertical: 'middle' }
          cell.border = this.allBorders()
        })
        ws.getRow(rowNum).height = rIdx === 3 ? 25 : 18
        rowNum++
      })
      rowNum++
    }

    // INFORMACIÓN DE PAGO
    if (liq.pago && liq.estado === 'pagado') {
      this.addSectionHeader(ws, rowNum, '✓ INFORMACIÓN DE PAGO', 7)
      rowNum++
      rowNum = this.addLabelValueWide(ws, rowNum, 'Método de Pago:', this.capitalizeFirst(liq.pago.metodoPago.replace(/_/g, ' ')), COLORS.lightGreen)
      rowNum = this.addLabelValueWide(ws, rowNum, 'Número Comprobante:', liq.pago.numeroComprobante, COLORS.lightGreen)
      rowNum = this.addLabelValueWide(ws, rowNum, 'Fecha de Aprobación:', this.formatDate(liq.pago.fechaAprobacion), COLORS.lightGreen)
      rowNum = this.addLabelValueWide(ws, rowNum, 'Fecha de Pago:', this.formatDate(liq.pago.fechaPago), COLORS.lightGreen)
    }

    // Ajustar anchos de columna
    ws.getColumn(1).width = 40
    ws.getColumn(2).width = 25
    ws.getColumn(3).width = 25
    ws.getColumn(4).width = 15
  }

  // ==========================================================================
  // HOJA 4: LIQUIDACIÓN TOLL (VERSIÓN COMPLETA)
  // ==========================================================================
  createLiquidacionTollSheet() {
    const liq = this.lote.liquidacionToll
    if (!liq) return

    const ws = this.workbook.addWorksheet('Liquidación Toll')
    let rowNum = 1

    // TÍTULO
    ws.mergeCells(`A${rowNum}:E${rowNum}`)
    const titleCell = ws.getCell(`A${rowNum}`)
    titleCell.value = 'LIQUIDACIÓN DE PROCESAMIENTO (TOLL)'
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.info } }
    titleCell.font = { bold: true, size: 16, color: { argb: COLORS.white } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(rowNum).height = 30
    rowNum++

    ws.mergeCells(`A${rowNum}:E${rowNum}`)
    const subtitleCell = ws.getCell(`A${rowNum}`)
    subtitleCell.value = `Liquidación #${liq.id}`
    subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerSecondary } }
    subtitleCell.font = { bold: true, size: 14, color: { argb: COLORS.white } }
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    rowNum++
    rowNum++

    // INFORMACIÓN BÁSICA
    this.addSectionHeader(ws, rowNum, 'INFORMACIÓN GENERAL', 5)
    rowNum++
    rowNum = this.addLabelValueWide(ws, rowNum, 'Estado:', this.capitalizeFirst(liq.estado.replace(/_/g, ' ')))
    rowNum = this.addLabelValueWide(ws, rowNum, 'Socio:', `${liq.socioNombres} ${liq.socioApellidos}`)
    rowNum = this.addLabelValueWide(ws, rowNum, 'CI:', liq.socioCi)
    rowNum++

    // COSTOS DE PROCESAMIENTO
    this.addSectionHeader(ws, rowNum, 'COSTOS DE PROCESAMIENTO', 5)
    rowNum++
    rowNum = this.addLabelValueWide(ws, rowNum, 'Peso Total (Kg):', this.formatNumber(liq.pesoTotalEntradaKg))
    rowNum = this.addLabelValueWide(ws, rowNum, 'Peso Total (Ton):', this.formatNumber(liq.pesoTotalToneladas, 4))
    rowNum = this.addLabelValueWide(ws, rowNum, 'Costo por Tonelada:', this.formatCurrency(liq.costoPorTonelada, 'USD'))
    rowNum = this.addLabelValueWide(ws, rowNum, 'Costo Total Procesamiento:', this.formatCurrency(liq.costoProcesamientoTotal, 'USD'))
    rowNum++

    // SERVICIOS ADICIONALES (COMPLETO)
    if (liq.serviciosAdicionales) {
      this.addSectionHeader(ws, rowNum, 'SERVICIOS ADICIONALES', 5)
      rowNum++
      
      const headers = ['Servicio', 'Cantidad', 'Costo Unitario', 'Costo Total']
      headers.forEach((header, col) => {
        const cell = ws.getCell(rowNum, col + 1)
        cell.value = header
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.copper } }
        cell.font = { bold: true, size: 10, color: { argb: COLORS.white } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = this.allBorders()
      })
      rowNum++

      const servicios = liq.serviciosAdicionales
      let index = 0
      
      if (servicios.uso_balanza) {
        const rowData = [
          'Uso de Balanza',
          `${servicios.uso_balanza.cantidad_camiones} camiones`,
          this.formatCurrency(servicios.uso_balanza.costo_unitario, servicios.uso_balanza.moneda),
          this.formatCurrency(servicios.uso_balanza.costo_total, servicios.uso_balanza.moneda)
        ]
        this.addServiceRow(ws, rowNum, rowData, index % 2 === 0)
        rowNum++
        index++
      }
      
      if (servicios.retroexcavadora_grande) {
        const rowData = [
          'Retroexcavadora Grande',
          `${servicios.retroexcavadora_grande.cantidad} ud.`,
          this.formatCurrency(servicios.retroexcavadora_grande.costo_unitario, servicios.retroexcavadora_grande.moneda),
          this.formatCurrency(servicios.retroexcavadora_grande.costo_total, servicios.retroexcavadora_grande.moneda)
        ]
        this.addServiceRow(ws, rowNum, rowData, index % 2 === 0)
        rowNum++
        index++
      }
      
      if (servicios.retroexcavadora_pequena) {
        const rowData = [
          'Retroexcavadora Pequeña',
          `${servicios.retroexcavadora_pequena.cantidad} ud.`,
          this.formatCurrency(servicios.retroexcavadora_pequena.costo_unitario, servicios.retroexcavadora_pequena.moneda),
          this.formatCurrency(servicios.retroexcavadora_pequena.costo_total, servicios.retroexcavadora_pequena.moneda)
        ]
        this.addServiceRow(ws, rowNum, rowData, index % 2 === 0)
        rowNum++
      }

      // FILA TOTAL SERVICIOS
      const totalRowData = [
        'TOTAL SERVICIOS ADICIONALES',
        '',
        '',
        this.formatCurrency(liq.totalServiciosAdicionales, 'USD')
      ]
      
      totalRowData.forEach((value, col) => {
        const cell = ws.getCell(rowNum, col + 1)
        cell.value = value
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } }
        cell.font = { size: 10, bold: true }
        cell.alignment = { 
          horizontal: col > 0 ? 'right' : 'left', 
          vertical: 'middle' 
        }
        cell.border = this.allBorders()
      })
      rowNum++
      rowNum++
    }

    // RESULTADO FINAL (DESTACADO)
    this.addSectionHeader(ws, rowNum, '💰 TOTAL A PAGAR', 5)
    rowNum++
    
    const finalData = [
      ['Concepto', 'USD', 'BOB', 'TC'],
      ['Procesamiento', this.formatCurrency(liq.costoProcesamientoTotal, 'USD'), '-', ''],
      ['Servicios Adicionales', this.formatCurrency(liq.totalServiciosAdicionales, 'USD'), '-', ''],
      ['TOTAL', this.formatCurrency(liq.valorNetoUsd, 'USD'), this.formatCurrency(liq.valorNetoBob, 'BOB'), liq.tipoCambio]
    ]

    finalData.forEach((row, rIdx) => {
      row.forEach((value, cIdx) => {
        const cell = ws.getCell(rowNum, cIdx + 1)
        cell.value = value
        
        if (rIdx === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkGray } }
          cell.font = { bold: true, size: 10, color: { argb: COLORS.white } }
        } else if (rIdx === 3) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.info } }
          cell.font = { bold: true, size: 12, color: { argb: COLORS.white } }
        } else {
          cell.font = { size: 9 }
        }
        
        cell.alignment = { horizontal: cIdx > 0 ? 'right' : 'left', vertical: 'middle' }
        cell.border = this.allBorders()
      })
      ws.getRow(rowNum).height = rIdx === 3 ? 25 : 18
      rowNum++
    })
    rowNum++

    // INFORMACIÓN DE PAGO
    if (liq.fechaPago && liq.estado === 'pagado') {
      this.addSectionHeader(ws, rowNum, '✓ INFORMACIÓN DE PAGO', 5)
      rowNum++
      rowNum = this.addLabelValueWide(ws, rowNum, 'Método de Pago:', this.capitalizeFirst(liq.metodoPago.replace(/_/g, ' ')), COLORS.lightGreen)
      rowNum = this.addLabelValueWide(ws, rowNum, 'Número Comprobante:', liq.numeroComprobante, COLORS.lightGreen)
      rowNum = this.addLabelValueWide(ws, rowNum, 'Fecha de Pago:', this.formatDate(liq.fechaPago), COLORS.lightGreen)
    }

    // Ajustar anchos
    ws.getColumn(1).width = 40
    ws.getColumn(2).width = 20
    ws.getColumn(3).width = 25
    ws.getColumn(4).width = 25
  }
  // ==========================================================================
// HOJA 5: DEDUCCIONES DE LA COOPERATIVA (SOLO PARA ROL COOPERATIVA)
// ==========================================================================
createDeduccionesCooperativaSheet() {
  // Verificar si hay deducciones disponibles
  const tieneDeducciones = this.lote.deduccionesVenta?.length > 0
  const tieneConcentradosVendidos = this.lote.concentradosVendidos?.length > 0
  
  if (!tieneDeducciones && !tieneConcentradosVendidos) {
    return // No hay nada que mostrar
  }

  const ws = this.workbook.addWorksheet('Deducciones Cooperativa', {
    views: [{ showGridLines: true }]
  })
  
  let rowNum = 1

  // TÍTULO PRINCIPAL
  ws.mergeCells(`A${rowNum}:E${rowNum}`)
  const titleCell = ws.getCell(`A${rowNum}`)
  titleCell.value = 'DEDUCCIONES Y APORTES - COOPERATIVA'
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerPrimary } }
  titleCell.font = { bold: true, size: 16, color: { argb: COLORS.white } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(rowNum).height = 30
  rowNum++

  ws.mergeCells(`A${rowNum}:E${rowNum}`)
  const subtitleCell = ws.getCell(`A${rowNum}`)
  subtitleCell.value = `Lote #${this.lote.id}`
  subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerSecondary } }
  subtitleCell.font = { bold: true, size: 14, color: { argb: COLORS.white } }
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(rowNum).height = 25
  rowNum++
  rowNum++

  // SECCIÓN 1: DEDUCCIONES POR VENTA DIRECTA
  if (tieneDeducciones) {
    this.addSectionHeader(ws, rowNum, 'DEDUCCIONES POR VENTA DIRECTA', 5)
    rowNum++

    ws.mergeCells(`A${rowNum}:E${rowNum}`)
    const infoCell = ws.getCell(`A${rowNum}`)
    infoCell.value = `Este lote fue vendido directamente. Total de deducciones: ${this.lote.deduccionesVenta.length}`
    infoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightBlue } }
    infoCell.font = { size: 10, italic: true }
    infoCell.alignment = { horizontal: 'left', vertical: 'middle' }
    infoCell.border = this.allBorders()
    ws.getRow(rowNum).height = 22
    rowNum++
    rowNum++

    // Tabla de deducciones
    const headers = ['Concepto', 'Tipo', 'Porcentaje (%)', 'Monto USD', 'Monto BOB']
    headers.forEach((header, col) => {
      const cell = ws.getCell(rowNum, col + 1)
      cell.value = header
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkGray } }
      cell.font = { bold: true, size: 10, color: { argb: COLORS.white } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = this.allBorders()
    })
    ws.getRow(rowNum).height = 20
    rowNum++

    let totalUsd = 0
    let totalBob = 0
    let totalPorcentaje = 0

    for (let i = 0; i < this.lote.deduccionesVenta.length; i++) {
      const ded = this.lote.deduccionesVenta[i]
      const rowData = [
        ded.concepto,
        this.capitalizeFirst(ded.tipoDeduccion),
        this.formatNumber(ded.porcentaje, 4),
        this.formatCurrency(ded.montoDeducidoUsd, 'USD'),
        this.formatCurrency(ded.montoDeducidoBob, 'BOB')
      ]

      totalUsd += ded.montoDeducidoUsd || 0
      totalBob += ded.montoDeducidoBob || 0
      totalPorcentaje += ded.porcentaje || 0

      rowData.forEach((value, col) => {
        const cell = ws.getCell(rowNum, col + 1)
        cell.value = value
        
        // Color según tipo
        let fillColor = COLORS.white
        if (ded.tipoDeduccion === 'regalia') fillColor = COLORS.lightYellow
        else if (ded.tipoDeduccion === 'aporte') fillColor = COLORS.lightGreen
        
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } }
        cell.font = { size: 9 }
        cell.alignment = { 
          horizontal: col === 0 || col === 1 ? 'left' : col === 2 ? 'center' : 'right',
          vertical: 'middle' 
        }
        cell.border = this.allBorders()
      })
      rowNum++
    }

    // Fila de TOTAL
    const totalRowData = [
      'TOTAL',
      '',
      this.formatNumber(totalPorcentaje, 2),
      this.formatCurrency(totalUsd, 'USD'),
      this.formatCurrency(totalBob, 'BOB')
    ]

    totalRowData.forEach((value, col) => {
      const cell = ws.getCell(rowNum, col + 1)
      cell.value = value
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } }
      cell.font = { bold: true, size: 10 }
      cell.alignment = { 
        horizontal: col === 0 || col === 1 ? 'left' : col === 2 ? 'center' : 'right',
        vertical: 'middle' 
      }
      cell.border = this.allBorders()
    })
    ws.getRow(rowNum).height = 25
    rowNum++
    rowNum += 2
  }

  // SECCIÓN 2: DEDUCCIONES POR CONCENTRADOS VENDIDOS
  if (tieneConcentradosVendidos) {
    this.addSectionHeader(ws, rowNum, 'DEDUCCIONES POR CONCENTRADOS PROCESADOS Y VENDIDOS', 5)
    rowNum++

    ws.mergeCells(`A${rowNum}:E${rowNum}`)
    const infoCell = ws.getCell(`A${rowNum}`)
    infoCell.value = `Este lote fue procesado. Se generaron ${this.lote.concentradosVendidos.length} concentrado(s) que fueron vendido(s).`
    infoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGreen } }
    infoCell.font = { size: 10, italic: true }
    infoCell.alignment = { horizontal: 'left', vertical: 'middle' }
    infoCell.border = this.allBorders()
    ws.getRow(rowNum).height = 22
    rowNum++
    rowNum++

    // Iterar sobre cada concentrado vendido
    for (let concIndex = 0; concIndex < this.lote.concentradosVendidos.length; concIndex++) {
      const conc = this.lote.concentradosVendidos[concIndex]
      
      if (concIndex > 0) {
        rowNum += 2 // Espacio entre concentrados
      }

      // Título del concentrado
      ws.mergeCells(`A${rowNum}:E${rowNum}`)
      const concTitleCell = ws.getCell(`A${rowNum}`)
      concTitleCell.value = `CONCENTRADO #${conc.concentradoId} - ${conc.codigoConcentrado} (${conc.mineralPrincipal})`
      concTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.emerald } }
      concTitleCell.font = { bold: true, size: 11, color: { argb: COLORS.white } }
      concTitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      concTitleCell.border = this.allBorders()
      ws.getRow(rowNum).height = 23
      rowNum++

      // Estado del concentrado
      ws.mergeCells(`A${rowNum}:E${rowNum}`)
      const estadoCell = ws.getCell(`A${rowNum}`)
      estadoCell.value = `Estado: ${conc.mensajeEstado || this.capitalizeFirst(conc.estado.replace(/_/g, ' '))}`
      estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightBlue } }
      estadoCell.font = { size: 9, italic: true }
      estadoCell.alignment = { horizontal: 'center', vertical: 'middle' }
      estadoCell.border = this.allBorders()
      rowNum++
      rowNum++

      if (!conc.deducciones || conc.deducciones.length === 0) {
        ws.mergeCells(`A${rowNum}:E${rowNum}`)
        const noDedCell = ws.getCell(`A${rowNum}`)
        noDedCell.value = 'Sin deducciones registradas para este concentrado'
        noDedCell.font = { italic: true, color: { argb: 'FF6B7280' } }
        noDedCell.alignment = { horizontal: 'center', vertical: 'middle' }
        rowNum++
        continue
      }

      // Tabla de deducciones del concentrado
      const headers = ['Concepto', 'Tipo', 'Porcentaje (%)', 'Monto USD', 'Monto BOB']
      headers.forEach((header, col) => {
        const cell = ws.getCell(rowNum, col + 1)
        cell.value = header
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkGray } }
        cell.font = { bold: true, size: 9, color: { argb: COLORS.white } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = this.allBorders()
      })
      rowNum++

      let subtotalUsd = 0
      let subtotalBob = 0
      let subtotalPorcentaje = 0

      for (let i = 0; i < conc.deducciones.length; i++) {
        const ded = conc.deducciones[i]
        const rowData = [
          ded.concepto,
          this.capitalizeFirst(ded.tipoDeduccion),
          this.formatNumber(ded.porcentaje, 4),
          this.formatCurrency(ded.montoDeducidoUsd, 'USD'),
          this.formatCurrency(ded.montoDeducidoBob, 'BOB')
        ]

        subtotalUsd += ded.montoDeducidoUsd || 0
        subtotalBob += ded.montoDeducidoBob || 0
        subtotalPorcentaje += ded.porcentaje || 0

        rowData.forEach((value, col) => {
          const cell = ws.getCell(rowNum, col + 1)
          cell.value = value
          
          let fillColor = COLORS.white
          if (ded.tipoDeduccion === 'regalia') fillColor = COLORS.lightYellow
          else if (ded.tipoDeduccion === 'aporte') fillColor = COLORS.lightGreen
          
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } }
          cell.font = { size: 8 }
          cell.alignment = { 
            horizontal: col === 0 || col === 1 ? 'left' : col === 2 ? 'center' : 'right',
            vertical: 'middle' 
          }
          cell.border = this.allBorders()
        })
        rowNum++
      }

      // Subtotal del concentrado
      const subtotalRowData = [
        `SUBTOTAL CONCENTRADO #${conc.concentradoId}`,
        '',
        this.formatNumber(subtotalPorcentaje, 2),
        this.formatCurrency(subtotalUsd, 'USD'),
        this.formatCurrency(subtotalBob, 'BOB')
      ]

      subtotalRowData.forEach((value, col) => {
        const cell = ws.getCell(rowNum, col + 1)
        cell.value = value
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } }
        cell.font = { bold: true, size: 9 }
        cell.alignment = { 
          horizontal: col === 0 || col === 1 ? 'left' : col === 2 ? 'center' : 'right',
          vertical: 'middle' 
        }
        cell.border = this.allBorders()
      })
      rowNum++
    }

    rowNum += 2

    // TOTAL GENERAL DE TODOS LOS CONCENTRADOS
    if (this.lote.concentradosVendidos.length > 1) {
      let totalGeneralUsd = 0
      let totalGeneralBob = 0
      let totalGeneralPorcentaje = 0

      for (let i = 0; i < this.lote.concentradosVendidos.length; i++) {
        const conc = this.lote.concentradosVendidos[i]
        if (conc.deducciones) {
          for (let j = 0; j < conc.deducciones.length; j++) {
            const ded = conc.deducciones[j]
            totalGeneralUsd += ded.montoDeducidoUsd || 0
            totalGeneralBob += ded.montoDeducidoBob || 0
            totalGeneralPorcentaje += ded.porcentaje || 0
          }
        }
      }

      ws.mergeCells(`A${rowNum}:E${rowNum}`)
      const totalHeaderCell = ws.getCell(`A${rowNum}`)
      totalHeaderCell.value = 'TOTAL GENERAL DE TODOS LOS CONCENTRADOS'
      totalHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerSecondary } }
      totalHeaderCell.font = { bold: true, size: 11, color: { argb: COLORS.white } }
      totalHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' }
      totalHeaderCell.border = this.allBorders()
      ws.getRow(rowNum).height = 23
      rowNum++

      const totalGeneralData = [
        ['Concepto', '', 'Porcentaje Total', 'Total USD', 'Total BOB'],
        ['TOTAL', '', this.formatNumber(totalGeneralPorcentaje, 2), this.formatCurrency(totalGeneralUsd, 'USD'), this.formatCurrency(totalGeneralBob, 'BOB')]
      ]

      for (let rIdx = 0; rIdx < totalGeneralData.length; rIdx++) {
        const row = totalGeneralData[rIdx]
        for (let cIdx = 0; cIdx < row.length; cIdx++) {
          const value = row[cIdx]
          const cell = ws.getCell(rowNum, cIdx + 1)
          cell.value = value

          if (rIdx === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkGray } }
            cell.font = { bold: true, size: 9, color: { argb: COLORS.white } }
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.success } }
            cell.font = { bold: true, size: 11, color: { argb: COLORS.white } }
          }

          cell.alignment = { 
            horizontal: cIdx === 0 || cIdx === 1 ? 'left' : cIdx === 2 ? 'center' : 'right',
            vertical: 'middle' 
          }
          cell.border = this.allBorders()
        }
        ws.getRow(rowNum).height = rIdx === 1 ? 25 : 20
        rowNum++
      }
    }
  }

  // Ajustar anchos de columnas
  ws.getColumn(1).width = 50
  ws.getColumn(2).width = 20
  ws.getColumn(3).width = 20
  ws.getColumn(4).width = 25
  ws.getColumn(5).width = 25
}

  
  

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================
  
  addServiceRow(ws, rowNum, rowData, isEven) {
    rowData.forEach((value, col) => {
      const cell = ws.getCell(rowNum, col + 1)
      cell.value = value
      cell.fill = { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: isEven ? COLORS.white : COLORS.lightGray } 
      }
      cell.font = { size: 9 }
      cell.alignment = { 
        horizontal: col > 0 ? 'right' : 'left', 
        vertical: 'middle' 
      }
      cell.border = this.allBorders()
    })
  }

  addSectionHeader(ws, rowNum, text, colSpan = 2) {
    ws.mergeCells(`A${rowNum}:${String.fromCharCode(64 + colSpan)}${rowNum}`)
    const cell = ws.getCell(`A${rowNum}`)
    cell.value = text
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerSecondary } }
    cell.font = { bold: true, size: 11, color: { argb: COLORS.white } }
    cell.alignment = { horizontal: 'left', vertical: 'middle' }
    cell.border = this.allBorders()
    ws.getRow(rowNum).height = 25
  }

  addLabelValue(ws, rowNum, label, value) {
    const labelCell = ws.getCell(`A${rowNum}`)
    labelCell.value = label
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } }
    labelCell.font = { bold: true, size: 10 }
    labelCell.alignment = { horizontal: 'right', vertical: 'middle' }
    labelCell.border = this.allBorders()

    const valueCell = ws.getCell(`B${rowNum}`)
    valueCell.value = value
    valueCell.font = { size: 10 }
    valueCell.alignment = { horizontal: 'left', vertical: 'middle' }
    valueCell.border = this.allBorders()

    return rowNum + 1
  }

  addLabelValueWide(ws, rowNum, label, value, bgColor = null) {
    const labelCell = ws.getCell(`A${rowNum}`)
    labelCell.value = label
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor || COLORS.lightGray } }
    labelCell.font = { bold: true, size: 10 }
    labelCell.alignment = { horizontal: 'right', vertical: 'middle' }
    labelCell.border = this.allBorders()

    ws.mergeCells(`B${rowNum}:G${rowNum}`)
    const valueCell = ws.getCell(`B${rowNum}`)
    valueCell.value = value
    valueCell.font = { size: 10 }
    valueCell.alignment = { horizontal: 'left', vertical: 'middle' }
    valueCell.border = this.allBorders()
    if (bgColor) {
      valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
    }

    return rowNum + 1
  }

  allBorders() {
    return {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    }
  }

  formatDate(dateString) {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-BO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  formatCurrency(value, currency = 'BOB') {
    if (!value && value !== 0) return '-'
    const formatted = new Intl.NumberFormat('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
    
    const symbol = currency === 'USD' ? '$' : 'Bs'
    return `${symbol} ${formatted}`
  }

  formatNumber(value, decimals = 2) {
    if (!value && value !== 0) return '-'
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

export function generarReporteConsolidadoLote(lote, rol = 'socio') {
  const generator = new ExcelReportGenerator(lote, rol)
  return generator.generate()
}

export async function exportarLoteExcel(lote, rol = 'socio', nombreArchivo = null) {
  const generator = new ExcelReportGenerator(lote, rol)
  const workbook = generator.generate()
  
  const fileName = nombreArchivo || `Lote_${lote.id}_${new Date().toISOString().split('T')[0]}.xlsx`
  
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

export default {
  generarReporteConsolidadoLote,
  exportarLoteExcel
}