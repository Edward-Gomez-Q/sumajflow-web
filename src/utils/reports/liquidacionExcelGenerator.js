// src/utils/reports/liquidacionExcelGenerator.js
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
  gold: 'FFEAB308',
  silver: 'FF9CA3AF',
  copper: 'FFD97706',
  white: 'FFFFFFFF',
  black: 'FF000000',
  darkGray: 'FF1F2937',
  borderGray: 'FFE5E7EB'
}

class LiquidacionExcelGenerator {
  constructor(liquidacion) {
    this.liq = liquidacion
    this.workbook = new ExcelJS.Workbook()
  }

  generate() {
    this.createResumenSheet()
    this.createDetalleSheet()
    this.createLiquidacionSheet()
    
    if (this.liq.estado === 'pagado' && this.liq.pago) {
      this.createPagoSheet()
    }
    
    return this.workbook
  }

  esLoteComplejo() {
    return this.liq.tipoLiquidacion === 'venta_lote_complejo'
  }

  // ========== HOJA 1: RESUMEN ==========
  createResumenSheet() {
    const ws = this.workbook.addWorksheet('Resumen')
    let rowNum = 1

    // TÍTULO PRINCIPAL
    ws.mergeCells(`A${rowNum}:B${rowNum}`)
    const titleCell = ws.getCell(`A${rowNum}`)
    titleCell.value = 'REPORTE CONSOLIDADO DE LIQUIDACIÓN'
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerPrimary } }
    titleCell.font = { bold: true, size: 16, color: { argb: COLORS.white } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(rowNum).height = 30
    rowNum++

    // SUBTÍTULO
    ws.mergeCells(`A${rowNum}:B${rowNum}`)
    const subtitleCell = ws.getCell(`A${rowNum}`)
    subtitleCell.value = `Liquidación #${this.liq.id}`
    subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerSecondary } }
    subtitleCell.font = { bold: true, size: 14, color: { argb: COLORS.white } }
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(rowNum).height = 25
    rowNum++
    rowNum++ // Espacio

    // Información General
    this.addSectionHeader(ws, rowNum, 'INFORMACIÓN GENERAL')
    rowNum++
    rowNum = this.addLabelValue(ws, rowNum, 'Tipo:', this.liq.tipoLiquidacion === 'venta_lote_complejo' ? 'Venta de Lote Complejo' : 'Venta de Concentrado')
    rowNum = this.addLabelValue(ws, rowNum, 'Estado:', this.capitalizeFirst(this.liq.estado.replace(/_/g, ' ')))
    rowNum = this.addLabelValue(ws, rowNum, 'Fecha Creación:', this.formatDate(this.liq.createdAt))
    rowNum++

    // Socio
    this.addSectionHeader(ws, rowNum, 'SOCIO')
    rowNum++
    rowNum = this.addLabelValue(ws, rowNum, 'Nombres:', `${this.liq.socio.nombres} ${this.liq.socio.apellidos}`)
    rowNum = this.addLabelValue(ws, rowNum, 'CI:', this.liq.socio.ci)
    rowNum++

    // Comercializadora
    this.addSectionHeader(ws, rowNum, 'COMERCIALIZADORA')
    rowNum++
    rowNum = this.addLabelValue(ws, rowNum, 'Razón Social:', this.liq.comercializadora.razonSocial)
    rowNum = this.addLabelValue(ws, rowNum, 'NIT:', this.liq.comercializadora.nit)
    rowNum = this.addLabelValue(ws, rowNum, 'Ubicación:', `${this.liq.comercializadora.municipio}, ${this.liq.comercializadora.departamento}`)
    rowNum++

    // Resultado Final
    if (this.liq.resultadoFinal) {
      this.addSectionHeader(ws, rowNum, 'RESULTADO FINAL')
      rowNum++
      rowNum = this.addLabelValue(ws, rowNum, 'Valor Bruto (USD):', this.formatCurrency(this.liq.resultadoFinal.valorBrutoUsd, 'USD'))
      rowNum = this.addLabelValue(ws, rowNum, 'Deducciones (USD):', this.formatCurrency(this.liq.resultadoFinal.totalDeduccionesUsd, 'USD'))
      rowNum = this.addLabelValue(ws, rowNum, 'Valor Neto (USD):', this.formatCurrency(this.liq.resultadoFinal.valorNetoUsd, 'USD'))
      rowNum = this.addLabelValue(ws, rowNum, 'Tipo de Cambio:', this.liq.resultadoFinal.tipoCambio)
      rowNum = this.addLabelValue(ws, rowNum, 'Valor Neto (BOB):', this.formatCurrency(this.liq.resultadoFinal.valorNetoBob, 'BOB'))
    }

    ws.getColumn(1).width = 30
    ws.getColumn(2).width = 50
  }

  // ========== HOJA 2: DETALLE ==========
  createDetalleSheet() {
    const ws = this.workbook.addWorksheet('Detalle')
    let rowNum = 1

    ws.mergeCells(`A${rowNum}:E${rowNum}`)
    const titleCell = ws.getCell(`A${rowNum}`)
    titleCell.value = 'DETALLE DE LIQUIDACIÓN'
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerPrimary } }
    titleCell.font = { bold: true, size: 14, color: { argb: COLORS.white } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(rowNum).height = 25
    rowNum++
    rowNum++

    // Pesos
    if (this.liq.pesos) {
      this.addSectionHeader(ws, rowNum, 'INFORMACIÓN DE PESOS', 5)
      rowNum++
      
      if (this.liq.pesos.pesoTotalEntrada) {
        rowNum = this.addLabelValueWide(ws, rowNum, 'Peso Total Entrada (kg):', this.formatNumber(this.liq.pesos.pesoTotalEntrada))
      }
      if (this.liq.pesos.pesoTmh) {
        rowNum = this.addLabelValueWide(ws, rowNum, 'Peso TMH (Ton):', this.formatNumber(this.liq.pesos.pesoTmh, 4))
      }
      if (this.liq.pesos.pesoTms) {
        rowNum = this.addLabelValueWide(ws, rowNum, 'Peso TMS (Ton):', this.formatNumber(this.liq.pesos.pesoTms, 4))
      }
      if (this.liq.pesos.pesoFinalTms) {
        rowNum = this.addLabelValueWide(ws, rowNum, 'Peso Final TMS (Ton):', this.formatNumber(this.liq.pesos.pesoFinalTms, 4))
      }
      if (this.liq.pesos.porcentajeHumedad) {
        rowNum = this.addLabelValueWide(ws, rowNum, 'Humedad (%):', this.formatNumber(this.liq.pesos.porcentajeHumedad, 2))
      }
      rowNum++
    }

    // Lotes o Concentrados
    if (this.esLoteComplejo() && this.liq.lotes && this.liq.lotes.length > 0) {
      this.addSectionHeader(ws, rowNum, 'LOTES', 5)
      rowNum++
      rowNum++

      const headers = ['ID', 'Mina', 'Mineral', 'Peso (kg)', 'Estado']
      headers.forEach((header, col) => {
        const cell = ws.getCell(rowNum, col + 1)
        cell.value = header
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkGray } }
        cell.font = { bold: true, size: 10, color: { argb: COLORS.white } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = this.allBorders()
      })
      rowNum++

      this.liq.lotes.forEach((lote, idx) => {
        const rowData = [
          lote.id,
          lote.minaNombre,
          this.capitalizeFirst(lote.tipoMineral),
          lote.pesoTotalReal,
          this.capitalizeFirst(lote.estado.replace(/_/g, ' '))
        ]

        rowData.forEach((value, col) => {
          const cell = ws.getCell(rowNum, col + 1)
          cell.value = value
          cell.fill = { 
            type: 'pattern', 
            pattern: 'solid', 
            fgColor: { argb: idx % 2 === 0 ? COLORS.white : COLORS.lightGray } 
          }
          cell.font = { size: 9 }
          cell.alignment = { horizontal: col < 3 ? 'left' : 'right', vertical: 'middle' }
          cell.border = this.allBorders()
        })
        rowNum++
      })
      rowNum++
    } else if (!this.esLoteComplejo() && this.liq.concentrados && this.liq.concentrados.length > 0) {
      this.addSectionHeader(ws, rowNum, 'CONCENTRADOS', 5)
      rowNum++
      rowNum++

      const headers = ['Código', 'Mineral', 'Sacos', 'Peso TMS (kg)', 'Ingenio']
      headers.forEach((header, col) => {
        const cell = ws.getCell(rowNum, col + 1)
        cell.value = header
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkGray } }
        cell.font = { bold: true, size: 10, color: { argb: COLORS.white } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = this.allBorders()
      })
      rowNum++

      this.liq.concentrados.forEach((conc, idx) => {
        const rowData = [
          conc.codigoConcentrado,
          conc.mineralPrincipal,
          conc.numeroSacos || '-',
          conc.pesoTms || conc.pesoFinal,
          conc.ingenioNombre || '-'
        ]

        rowData.forEach((value, col) => {
          const cell = ws.getCell(rowNum, col + 1)
          cell.value = value
          cell.fill = { 
            type: 'pattern', 
            pattern: 'solid', 
            fgColor: { argb: idx % 2 === 0 ? COLORS.white : COLORS.lightGray } 
          }
          cell.font = { size: 9 }
          cell.alignment = { horizontal: col < 2 ? 'left' : 'right', vertical: 'middle' }
          cell.border = this.allBorders()
        })
        rowNum++
      })
      rowNum++
    }

    // Leyes Acordadas
    if (this.liq.reportesQuimicos?.reporteAcordado) {
      this.addSectionHeader(ws, rowNum, 'LEYES ACORDADAS', 5)
      rowNum++

      const acordado = this.liq.reportesQuimicos.reporteAcordado
      
      if (this.esLoteComplejo()) {
        if (acordado.leyPb) rowNum = this.addLabelValueWide(ws, rowNum, 'Plomo (Pb) %:', this.formatNumber(acordado.leyPb, 2))
        if (acordado.leyZn) rowNum = this.addLabelValueWide(ws, rowNum, 'Zinc (Zn) %:', this.formatNumber(acordado.leyZn, 2))
        if (acordado.leyAgDm) rowNum = this.addLabelValueWide(ws, rowNum, 'Plata (Ag) DM:', this.formatNumber(acordado.leyAgDm, 2))
      } else {
        if (acordado.leyMineralPrincipal) rowNum = this.addLabelValueWide(ws, rowNum, 'Mineral Principal %:', this.formatNumber(acordado.leyMineralPrincipal, 2))
        if (acordado.leyAgGmt) rowNum = this.addLabelValueWide(ws, rowNum, 'Plata (Ag) g/MT:', this.formatNumber(acordado.leyAgGmt, 2))
        if (acordado.porcentajeH2o) rowNum = this.addLabelValueWide(ws, rowNum, 'Humedad (H₂O) %:', this.formatNumber(acordado.porcentajeH2o, 2))
      }
      rowNum++
    }

    ws.getColumn(1).width = 30
    ws.getColumn(2).width = 20
    ws.getColumn(3).width = 20
    ws.getColumn(4).width = 20
    ws.getColumn(5).width = 25
  }

  // ========== HOJA 3: LIQUIDACIÓN ==========
  createLiquidacionSheet() {
    const ws = this.workbook.addWorksheet('Liquidación')
    let rowNum = 1

    ws.mergeCells(`A${rowNum}:D${rowNum}`)
    const titleCell = ws.getCell(`A${rowNum}`)
    titleCell.value = 'CÁLCULO DE LIQUIDACIÓN'
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.success } }
    titleCell.font = { bold: true, size: 14, color: { argb: COLORS.white } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(rowNum).height = 25
    rowNum++
    rowNum++

    // Cotizaciones
    if (this.liq.cotizaciones && this.liq.cotizaciones.length > 0) {
      this.addSectionHeader(ws, rowNum, 'COTIZACIONES', 4)
      rowNum++
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

      this.liq.cotizaciones.forEach((cot, idx) => {
        const rowData = [
          cot.mineral,
          this.formatNumber(cot.cotizacion, 6),
          cot.unidad,
          cot.fuente
        ]

        rowData.forEach((value, col) => {
          const cell = ws.getCell(rowNum, col + 1)
          cell.value = value
          cell.fill = { 
            type: 'pattern', 
            pattern: 'solid', 
            fgColor: { argb: idx % 2 === 0 ? COLORS.white : COLORS.lightGray } 
          }
          cell.font = { size: 9 }
          cell.alignment = { horizontal: col === 1 ? 'right' : 'left', vertical: 'middle' }
          cell.border = this.allBorders()
        })
        rowNum++
      })
      rowNum++
    }

    // Valoración
    if (this.liq.valoracion) {
      this.addSectionHeader(ws, rowNum, 'VALORACIÓN', 4)
      rowNum++
      
      const val = this.liq.valoracion
      if (val.mineralPrincipal) rowNum = this.addLabelValueWide(ws, rowNum, 'Mineral Principal:', val.mineralPrincipal)
      if (val.valorTotalUsdPorTon) rowNum = this.addLabelValueWide(ws, rowNum, 'Valor por Tonelada:', this.formatCurrency(val.valorTotalUsdPorTon, 'USD'))
      if (val.valorBrutoTotalUsd) rowNum = this.addLabelValueWide(ws, rowNum, 'Valor Bruto Total:', this.formatCurrency(val.valorBrutoTotalUsd, 'USD'))
      rowNum++
    }

    // Deducciones
    if (this.liq.deducciones?.deducciones && this.liq.deducciones.deducciones.length > 0) {
      this.addSectionHeader(ws, rowNum, 'DEDUCCIONES', 4)
      rowNum++
      rowNum++

      const headers = ['Concepto', '%', 'Monto USD', 'Monto BOB']
      headers.forEach((header, col) => {
        const cell = ws.getCell(rowNum, col + 1)
        cell.value = header
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.error } }
        cell.font = { bold: true, size: 10, color: { argb: COLORS.white } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = this.allBorders()
      })
      rowNum++

      this.liq.deducciones.deducciones.forEach((ded, idx) => {
        const rowData = [
          ded.concepto,
          this.formatNumber(ded.porcentaje, 2),
          this.formatCurrency(ded.montoDeducidoUsd, 'USD'),
          this.formatCurrency(ded.montoDeducidoBob, 'BOB')
        ]

        rowData.forEach((value, col) => {
          const cell = ws.getCell(rowNum, col + 1)
          cell.value = value
          cell.fill = { 
            type: 'pattern', 
            pattern: 'solid', 
            fgColor: { argb: idx % 2 === 0 ? COLORS.white : COLORS.lightGray } 
          }
          cell.font = { size: 9 }
          cell.alignment = { horizontal: col > 0 ? 'right' : 'left', vertical: 'middle' }
          cell.border = this.allBorders()
        })
        rowNum++
      })

      // Total
      const totalData = [
        'TOTAL DEDUCCIONES',
        '',
        this.formatCurrency(this.liq.deducciones.totalDeduccionesUsd, 'USD'),
        this.formatCurrency(this.liq.deducciones.totalDeduccionesBob, 'BOB')
      ]
      totalData.forEach((value, col) => {
        const cell = ws.getCell(rowNum, col + 1)
        cell.value = value
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } }
        cell.font = { bold: true, size: 10 }
        cell.alignment = { horizontal: col > 0 ? 'right' : 'left', vertical: 'middle' }
        cell.border = this.allBorders()
      })
      rowNum++
      rowNum++
    }

    // Resultado Final
    if (this.liq.resultadoFinal) {
      const res = this.liq.resultadoFinal
      
      const finalData = [
        ['Concepto', 'USD', 'BOB'],
        ['Valor Bruto', this.formatCurrency(res.valorBrutoUsd, 'USD'), '-'],
        ['Deducciones', this.formatCurrency(res.totalDeduccionesUsd, 'USD'), '-'],
        ['Valor Neto', this.formatCurrency(res.valorNetoUsd, 'USD'), this.formatCurrency(res.valorNetoBob, 'BOB')]
      ]

      finalData.forEach((row, rIdx) => {
        row.forEach((value, cIdx) => {
          const cell = ws.getCell(rowNum, cIdx + 1)
          cell.value = value
          
          if (rIdx === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.darkGray } }
            cell.font = { bold: true, size: 10, color: { argb: COLORS.white } }
          } else if (rIdx === 3) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.success } }
            cell.font = { bold: true, size: 12, color: { argb: COLORS.white } }
          } else {
            cell.font = { size: 9 }
          }
          
          cell.alignment = { horizontal: cIdx > 0 ? 'right' : 'left', vertical: 'middle' }
          cell.border = this.allBorders()
        })
        rowNum++
      })
    }

    ws.getColumn(1).width = 35
    ws.getColumn(2).width = 25
    ws.getColumn(3).width = 25
    ws.getColumn(4).width = 25
  }

  // ========== HOJA 4: PAGO ==========
  createPagoSheet() {
    const ws = this.workbook.addWorksheet('Información de Pago')
    let rowNum = 1

    ws.mergeCells(`A${rowNum}:B${rowNum}`)
    const titleCell = ws.getCell(`A${rowNum}`)
    titleCell.value = 'INFORMACIÓN DE PAGO'
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.success } }
    titleCell.font = { bold: true, size: 14, color: { argb: COLORS.white } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(rowNum).height = 25
    rowNum++
    rowNum++

    const pago = this.liq.pago
    
    rowNum = this.addLabelValue(ws, rowNum, 'Método de Pago:', this.capitalizeFirst(pago.metodoPago?.replace(/_/g, ' ') || '-'))
    rowNum = this.addLabelValue(ws, rowNum, 'Número de Comprobante:', pago.numeroComprobante || '-')
    rowNum = this.addLabelValue(ws, rowNum, 'Fecha de Aprobación:', this.formatDate(pago.fechaAprobacion))
    rowNum = this.addLabelValue(ws, rowNum, 'Fecha de Pago:', this.formatDate(pago.fechaPago))

    ws.getColumn(1).width = 30
    ws.getColumn(2).width = 50
  }

  // ========== UTILIDADES ==========
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

  addLabelValueWide(ws, rowNum, label, value) {
    const labelCell = ws.getCell(`A${rowNum}`)
    labelCell.value = label
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.lightGray } }
    labelCell.font = { bold: true, size: 10 }
    labelCell.alignment = { horizontal: 'right', vertical: 'middle' }
    labelCell.border = this.allBorders()

    ws.mergeCells(`B${rowNum}:E${rowNum}`)
    const valueCell = ws.getCell(`B${rowNum}`)
    valueCell.value = value
    valueCell.font = { size: 10 }
    valueCell.alignment = { horizontal: 'left', vertical: 'middle' }
    valueCell.border = this.allBorders()

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
    return new Date(dateString).toLocaleDateString('es-BO', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
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

export function generarReporteLiquidacion(liquidacion) {
  const generator = new LiquidacionExcelGenerator(liquidacion)
  return generator.generate()
}

export async function exportarLiquidacionExcel(liquidacion, nombreArchivo = null) {
  const generator = new LiquidacionExcelGenerator(liquidacion)
  const workbook = generator.generate()
  
  const fileName = nombreArchivo || `Liquidacion_${liquidacion.id}_${new Date().toISOString().split('T')[0]}.xlsx`
  
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
  generarReporteLiquidacion,
  exportarLiquidacionExcel
}