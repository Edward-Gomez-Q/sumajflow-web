// src/utils/reports/liquidacionPDFGenerator.js
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const COLORS = {
  primary: [30, 64, 175],        
  primaryLight: [59, 130, 246],
  success: [16, 185, 129],
  warning: [245, 158, 11],
  error: [239, 68, 68],
  info: [59, 130, 246],
  gold: [234, 179, 8],
  silver: [156, 163, 175],
  copper: [217, 119, 6],
  zinc: [71, 85, 105],
  white: [255, 255, 255],
  black: [0, 0, 0],
  lightGray: [243, 244, 246],
  mediumGray: [156, 163, 175],
  darkGray: [31, 41, 55],
  borderGray: [229, 231, 235]
}

class LiquidacionPDFGenerator {
  constructor(liquidacion) {
    this.liq = liquidacion
    this.doc = new jsPDF()
    this.yPos = 20
    this.pageWidth = 210
    this.pageHeight = 297
    this.margin = 20
    this.contentWidth = this.pageWidth - (this.margin * 2)
    this.currentPage = 1
  }

  generate() {
    this.addHeader()
    this.addInformacionGeneral()
    this.addPesos()
    
    if (this.esLoteComplejo()) {
      this.addLotesComplejo()
    } else {
      this.addConcentrados()
    }
    
    this.addReportesQuimicos()
    this.addCotizaciones()
    this.addValoracion()
    this.addDeducciones()
    this.addResultadoFinal()
    
    if (this.liq.estado === 'pagado' && this.liq.pago) {
      this.addInformacionPago()
    }
    
    this.addFooter()
    return this.doc
  }

  esLoteComplejo() {
    return this.liq.tipoLiquidacion === 'venta_lote_complejo'
  }

  // ========== HEADER ==========
  addHeader() {
      // Fondo azul para header
      this.doc.setFillColor(...COLORS.primary)
      this.doc.rect(0, 0, this.pageWidth, 45, 'F')
      
      // Título principal
      this.doc.setTextColor(...COLORS.white)
      this.doc.setFontSize(24)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('REPORTE CONSOLIDADO', this.pageWidth / 2, 20, { align: 'center' })
      
      // Subtítulo con ID de liquidación
      this.doc.setFontSize(18)
      this.doc.text(`Liquidación #${this.liq.id}`, this.pageWidth / 2, 30, { align: 'center' })
      
      // Estado
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(this.capitalizeFirst(this.liq.estado.replace(/_/g, ' ')), this.pageWidth / 2, 38, { align: 'center' })
      
      this.yPos = 55
  }

  // ========== INFORMACIÓN GENERAL ==========
  addInformacionGeneral() {
    this.addSectionTitle('INFORMACIÓN GENERAL', COLORS.primaryLight)
    
    const data = [
      ['Tipo de Liquidación', this.liq.tipoLiquidacion === 'venta_lote_complejo' ? 'Venta de Lote Complejo' : 'Venta de Concentrado'],
      ['Estado', this.capitalizeFirst(this.liq.estado.replace(/_/g, ' '))],
      ['Fecha de Creación', this.formatDate(this.liq.createdAt)],
      ['Socio', `${this.liq.socio.nombres} ${this.liq.socio.apellidos}`],
      ['CI del Socio', this.liq.socio.ci],
      ['Comercializadora', this.liq.comercializadora.razonSocial],
      ['NIT Comercializadora', this.liq.comercializadora.nit],
      ['Ubicación', `${this.liq.comercializadora.municipio}, ${this.liq.comercializadora.departamento}`]
    ]
    
    autoTable(this.doc, {
      startY: this.yPos,
      body: data,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold', fillColor: COLORS.lightGray, textColor: COLORS.darkGray },
        1: { cellWidth: this.contentWidth - 70, textColor: COLORS.black }
      },
      margin: { left: this.margin, right: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 10
  }

  // ========== PESOS ==========
  addPesos() {
    this.checkPageBreak(60)
    this.addSectionTitle('INFORMACIÓN DE PESOS', COLORS.primaryLight)
    
    const pesos = this.liq.pesos || {}
    const data = []
    
    if (pesos.pesoTotalEntrada) {
      data.push(['Peso Total Entrada', `${this.formatNumber(pesos.pesoTotalEntrada)} kg`])
    }
    if (pesos.pesoTmh) {
      data.push(['Peso TMH', `${this.formatNumber(pesos.pesoTmh)} Ton`])
    }
    if (pesos.pesoTms) {
      data.push(['Peso TMS', `${this.formatNumber(pesos.pesoTms)} Ton`])
    }
    if (pesos.pesoFinalTms) {
      data.push(['Peso Final TMS', `${this.formatNumber(pesos.pesoFinalTms)} Ton`])
    }
    if (pesos.porcentajeHumedad) {
      data.push(['Humedad', `${this.formatNumber(pesos.porcentajeHumedad, 2)}%`])
    }
    
    autoTable(this.doc, {
      startY: this.yPos,
      body: data,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold', fillColor: COLORS.lightGray },
        1: { cellWidth: this.contentWidth - 70, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 5
    
    if (pesos.pesoUsadoEnCalculo) {
      this.doc.setFontSize(8)
      this.doc.setTextColor(...COLORS.info)
      this.doc.text(`✓ Peso usado en cálculo: ${pesos.pesoUsadoEnCalculo}`, this.margin, this.yPos)
      this.yPos += 10
    }
  }

  // ========== LOTES (COMPLEJO) ==========
  addLotesComplejo() {
    if (!this.liq.lotes || this.liq.lotes.length === 0) return
    
    this.checkPageBreak(60)
    this.addSectionTitle('LOTES INCLUIDOS', COLORS.gold)
    
    const data = this.liq.lotes.map(l => [
      `#${l.id}`,
      l.minaNombre,
      this.capitalizeFirst(l.tipoMineral),
      `${this.formatNumber(l.pesoTotalReal)} kg`,
      this.capitalizeFirst(l.estado.replace(/_/g, ' '))
    ])
    
    autoTable(this.doc, {
      startY: this.yPos,
      head: [['ID', 'Mina', 'Mineral', 'Peso', 'Estado']],
      body: data,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.gold,
        textColor: COLORS.white,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      margin: { left: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 10
  }

  // ========== CONCENTRADOS ==========
  addConcentrados() {
    if (!this.liq.concentrados || this.liq.concentrados.length === 0) return
    
    this.checkPageBreak(60)
    this.addSectionTitle('CONCENTRADOS', COLORS.info)
    
    const data = this.liq.concentrados.map(c => [
      c.codigoConcentrado,
      c.mineralPrincipal,
      c.numeroSacos || '-',
      `${this.formatNumber(c.pesoTms || c.pesoFinal)} kg`,
      c.ingenioNombre || '-'
    ])
    
    autoTable(this.doc, {
      startY: this.yPos,
      head: [['Código', 'Mineral', 'Sacos', 'Peso TMS', 'Ingenio']],
      body: data,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.info,
        textColor: COLORS.white,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      margin: { left: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 10
  }

  // ========== REPORTES QUÍMICOS ==========
  addReportesQuimicos() {
    const reportes = this.liq.reportesQuimicos
    if (!reportes || !reportes.reporteAcordado) return
    
    this.checkPageBreak(80)
    this.addSectionTitle('LEYES ACORDADAS', COLORS.success)
    
    const acordado = reportes.reporteAcordado
    const data = []
    
    if (this.esLoteComplejo()) {
      if (acordado.leyPb) data.push(['Plomo (Pb)', `${this.formatNumber(acordado.leyPb, 2)}%`])
      if (acordado.leyZn) data.push(['Zinc (Zn)', `${this.formatNumber(acordado.leyZn, 2)}%`])
      if (acordado.leyAgDm) data.push(['Plata (Ag)', `${this.formatNumber(acordado.leyAgDm, 2)} DM`])
    } else {
      if (acordado.leyMineralPrincipal) data.push(['Mineral Principal', `${this.formatNumber(acordado.leyMineralPrincipal, 2)}%`])
      if (acordado.leyAgGmt) data.push(['Plata (Ag)', `${this.formatNumber(acordado.leyAgGmt, 2)} g/MT`])
      if (acordado.porcentajeH2o) data.push(['Humedad (H₂O)', `${this.formatNumber(acordado.porcentajeH2o, 2)}%`])
    }
    
    autoTable(this.doc, {
      startY: this.yPos,
      body: data,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 4, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 70, fillColor: [254, 243, 199], textColor: COLORS.darkGray },
        1: { cellWidth: this.contentWidth - 70, halign: 'right', fontSize: 12 }
      },
      margin: { left: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 10
  }

  // ========== COTIZACIONES ==========
  addCotizaciones() {
    const cotizaciones = this.liq.cotizaciones
    if (!cotizaciones || cotizaciones.length === 0) return
    
    this.checkPageBreak(60)
    this.addSectionTitle('COTIZACIONES APLICADAS', COLORS.gold)
    
    const data = cotizaciones.map(c => [
      c.mineral,
      this.formatCurrency(c.cotizacion, 'USD'),
      c.unidad,
      c.fuente
    ])
    
    autoTable(this.doc, {
      startY: this.yPos,
      head: [['Mineral', 'Cotización', 'Unidad', 'Fuente']],
      body: data,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.gold,
        textColor: COLORS.white,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'center' }
      },
      margin: { left: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 10
  }

  // ========== VALORACIÓN ==========
  addValoracion() {
    const val = this.liq.valoracion
    if (!val) return
    
    this.checkPageBreak(80)
    this.addSectionTitle('VALORACIÓN', COLORS.info)
    
    const data = []
    
    if (val.mineralPrincipal) {
      data.push(['Mineral Principal', val.mineralPrincipal])
    }
    
    if (val.valorTotalUsdPorTon) {
      data.push(['Valor por Tonelada', this.formatCurrency(val.valorTotalUsdPorTon, 'USD')])
    }
    
    if (val.valorBrutoTotalUsd) {
      data.push(['Valor Bruto Total', this.formatCurrency(val.valorBrutoTotalUsd, 'USD')])
    }
    
    // Valoración detallada para concentrados
    if (!this.esLoteComplejo()) {
      if (val.valoracionMineralPrincipal) {
        const vmp = val.valoracionMineralPrincipal
        data.push(['', '']) // Separador
        data.push([`Valoración ${vmp.mineral}`, ''])
        data.push(['  Ley', `${this.formatNumber(vmp.ley, 2)}%`])
        data.push(['  Cotización', `${this.formatCurrency(vmp.cotizacionInternacional, 'USD')}/ton`])
        data.push(['  Valor Bruto', this.formatCurrency(vmp.valorBrutoUsd, 'USD')])
      }
      
      if (val.valoracionPlata) {
        const vp = val.valoracionPlata
        data.push(['', '']) // Separador
        data.push(['Valoración Plata', ''])
        data.push(['  Ley Ag', `${this.formatNumber(vp.leyAg, 2)} ${vp.unidadLey}`])
        data.push(['  Contenido', `${this.formatNumber(vp.contenidoOzPorTon, 4)} oz/ton`])
        data.push(['  Cotización', `${this.formatCurrency(vp.cotizacionUsdPorOz, 'USD')}/oz`])
        data.push(['  Valor Bruto', this.formatCurrency(vp.valorBrutoUsd, 'USD')])
      }
    }
    
    autoTable(this.doc, {
      startY: this.yPos,
      body: data,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold', fillColor: [219, 234, 254] },
        1: { cellWidth: this.contentWidth - 70, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 10
  }

  // ========== DEDUCCIONES ==========
  addDeducciones() {
    const deds = this.liq.deducciones?.deducciones
    if (!deds || deds.length === 0) return
    
    this.checkPageBreak(100)
    this.addSectionTitle('DEDUCCIONES', COLORS.error)
    
    const data = deds.map(d => [
      d.concepto,
      `${this.formatNumber(d.porcentaje, 2)}%`,
      this.formatCurrency(d.montoDeducidoUsd, 'USD'),
      this.formatCurrency(d.montoDeducidoBob, 'BOB')
    ])
    
    // Total
    data.push([
      'TOTAL DEDUCCIONES',
      '',
      this.formatCurrency(this.liq.deducciones.totalDeduccionesUsd, 'USD'),
      this.formatCurrency(this.liq.deducciones.totalDeduccionesBob, 'BOB')
    ])
    
    autoTable(this.doc, {
      startY: this.yPos,
      head: [['Concepto', '%', 'Monto USD', 'Monto BOB']],
      body: data,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.error,
        textColor: COLORS.white,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      },
      didParseCell: (data) => {
        if (data.row.index === deds.length) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = COLORS.lightGray
        }
      },
      margin: { left: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 10
  }

  // ========== RESULTADO FINAL ==========
  addResultadoFinal() {
    const res = this.liq.resultadoFinal
    if (!res) return
    
    this.checkPageBreak(80)
    
    // Box verde
    const boxHeight = 60
    this.doc.setFillColor(...COLORS.success)
    this.doc.roundedRect(this.margin, this.yPos - 3, this.contentWidth, boxHeight, 3, 3, 'F')
    
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('RESULTADO FINAL', this.margin + 5, this.yPos + 7)
    
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    
    let lineY = this.yPos + 18
    this.doc.text(`Valor Bruto: ${this.formatCurrency(res.valorBrutoUsd, 'USD')}`, this.margin + 5, lineY)
    lineY += 8
    this.doc.text(`Deducciones: ${this.formatCurrency(res.totalDeduccionesUsd, 'USD')}`, this.margin + 5, lineY)
    lineY += 8
    this.doc.text(`Valor Neto: ${this.formatCurrency(res.valorNetoUsd, 'USD')}`, this.margin + 5, lineY)
    
    // Valor en BOB destacado
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(
      this.formatCurrency(res.valorNetoBob, 'BOB'),
      this.pageWidth - this.margin - 5,
      this.yPos + 35,
      { align: 'right' }
    )
    
    this.doc.setFontSize(8)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(
      `TC: ${res.tipoCambio}`,
      this.pageWidth - this.margin - 5,
      this.yPos + 45,
      { align: 'right' }
    )
    
    this.yPos += boxHeight + 10
  }

  // ========== INFORMACIÓN DE PAGO ==========
  addInformacionPago() {
    const pago = this.liq.pago
    if (!pago) return
    
    this.checkPageBreak(50)
    this.addSectionTitle('INFORMACIÓN DE PAGO', COLORS.success)
    
    const data = [
      ['Método de Pago', this.capitalizeFirst(pago.metodoPago?.replace(/_/g, ' ') || '-')],
      ['Número de Comprobante', pago.numeroComprobante || '-'],
      ['Fecha de Aprobación', this.formatDate(pago.fechaAprobacion)],
      ['Fecha de Pago', this.formatDate(pago.fechaPago)]
    ]
    
    autoTable(this.doc, {
      startY: this.yPos,
      body: data,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70, fillColor: [220, 252, 231] },
        1: { cellWidth: this.contentWidth - 70 }
      },
      margin: { left: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 8
  }

  // ========== UTILIDADES ==========
  addSectionTitle(text, color) {
    this.checkPageBreak(15)
    
    this.doc.setFillColor(...color)
    this.doc.rect(this.margin, this.yPos - 3, this.contentWidth, 10, 'F')
    
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(text, this.margin + 3, this.yPos + 4)
    
    this.doc.setTextColor(...COLORS.black)
    this.yPos += 15
  }

  checkPageBreak(spaceNeeded) {
    if (this.yPos + spaceNeeded > this.pageHeight - 30) {
      this.doc.addPage()
      this.yPos = 20
      this.currentPage++
    }
  }

  addFooter() {
    const totalPages = this.doc.internal.getNumberOfPages()
    
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i)
      
      this.doc.setDrawColor(...COLORS.borderGray)
      this.doc.line(this.margin, 280, this.pageWidth - this.margin, 280)
      
      this.doc.setFontSize(8)
      this.doc.setTextColor(156, 163, 175)
      this.doc.setFont('helvetica', 'normal')
      
      this.doc.text(
        `Generado: ${new Date().toLocaleDateString('es-BO', {
          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })}`,
        this.margin,
        287
      )
      
      this.doc.text(`Página ${i} de ${totalPages}`, this.pageWidth - this.margin, 287, { align: 'right' })
    }
  }

  formatDate(dateString) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-BO', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  formatCurrency(value, currency = 'BOB') {
    if (!value && value !== 0) return '-'
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency }).format(value)
  }

  formatNumber(value, decimals = 4) {
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

export function generarPDFLiquidacion(liquidacion) {
  const generator = new LiquidacionPDFGenerator(liquidacion)
  return generator.generate()
}

export function exportarLiquidacionPDF(liquidacion, nombreArchivo = null) {
  const doc = generarPDFLiquidacion(liquidacion)
  const fileName = nombreArchivo || `Liquidacion_${liquidacion.id}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}