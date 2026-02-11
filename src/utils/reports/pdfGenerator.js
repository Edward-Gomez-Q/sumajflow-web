// src/utils/reports/pdfGenerator.js
// GENERADOR DE PDF COMPLETO - VERSIÓN PROFESIONAL

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// ============================================================================
// CONFIGURACIÓN DE COLORES PROFESIONALES
// ============================================================================
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
  borderGray: [229, 231, 235],
  emerald: [16, 185, 129],
}

// ============================================================================
// CLASE PRINCIPAL DEL GENERADOR PDF
// ============================================================================
class LotePDFGenerator {
  constructor(lote, rol = 'socio') {
    this.lote = lote
    this.rol = rol
    this.doc = new jsPDF()
    this.yPos = 20
    this.pageWidth = 210
    this.pageHeight = 297
    this.margin = 20
    this.contentWidth = this.pageWidth - (this.margin * 2)
    this.currentPage = 1
  }

  // ==========================================================================
  // MÉTODO PRINCIPAL - GENERAR PDF COMPLETO
  // ==========================================================================
generate() {
  this.addHeader()
  this.addInformacionGeneral()
  this.addTransporte()
  
  // Para socios: mostrar liquidaciones completas
  if (this.rol === 'socio') {
    if (this.lote.tipoOperacion === 'venta_directa' && this.lote.liquidacionVentaDirecta) {
      this.addLiquidacionVenta()
    } else if (this.lote.tipoOperacion === 'procesamiento_planta' && this.lote.liquidacionToll) {
      this.addLiquidacionToll()
    }
  }
  
  // Para cooperativa: mostrar deducciones
  if (this.rol === 'cooperativa') {
    this.addDeduccionesCooperativa()
  }
  
  this.addFooter()
  return this.doc
}

  // ==========================================================================
  // HEADER DEL DOCUMENTO
  // ==========================================================================
  addHeader() {
    // Fondo azul para header
    this.doc.setFillColor(...COLORS.primary)
    this.doc.rect(0, 0, this.pageWidth, 45, 'F')
    
    // Título principal
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('REPORTE CONSOLIDADO', this.pageWidth / 2, 20, { align: 'center' })
    
    // Subtítulo con ID del lote
    this.doc.setFontSize(18)
    this.doc.text(`Lote #${this.lote.id}`, this.pageWidth / 2, 30, { align: 'center' })
    
    // Estado del lote
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(this.lote.estado, this.pageWidth / 2, 38, { align: 'center' })
    
    this.yPos = 55
  }

  // ==========================================================================
  // INFORMACIÓN GENERAL DEL LOTE
  // ==========================================================================
  addInformacionGeneral() {
    this.addSectionTitle('INFORMACIÓN GENERAL DEL LOTE', COLORS.primaryLight)
    
    const data = [
      ['Tipo de Operación', this.lote.tipoOperacion === 'venta_directa' ? 'Venta Directa' : 'Procesamiento en Planta'],
      ['Tipo de Mineral', this.capitalizeFirst(this.lote.tipoMineral)],
      ['Fecha de Creación', this.formatDate(this.lote.fechaCreacion)],
      ['Socio Propietario', `${this.lote.socioNombres} ${this.lote.socioApellidos}`],
      ['Mina de Origen', `${this.lote.minaNombre} - ${this.lote.sectorNombre}`],
      ['Destino', `${this.lote.destinoNombre} (${this.capitalizeFirst(this.lote.destinoTipo)})`],
      ['Municipio', `${this.lote.destinoMunicipio}, ${this.lote.destinoDepartamento}`],
      ['Peso Estimado', `${this.formatNumber(this.lote.pesoTotalEstimado)} kg`],
      ['Peso Real', `${this.formatNumber(this.lote.pesoTotalReal)} kg (${this.formatNumber(this.lote.pesoTotalReal / 1000, 4)} Ton)`],
      ['Camiones Solicitados', this.lote.camionlesSolicitados],
      ['Camiones Asignados', this.lote.camioneAsignados || 0]
    ]
    
    autoTable(this.doc, {
      startY: this.yPos,
      head: [],
      body: data,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { 
          cellWidth: 60, 
          fontStyle: 'bold',
          fillColor: COLORS.lightGray,
          textColor: COLORS.darkGray
        },
        1: { 
          cellWidth: this.contentWidth - 60,
          textColor: COLORS.black
        }
      },
      margin: { left: this.margin, right: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 10
  }

  // ==========================================================================
  // TRANSPORTE Y CAMIONES
  // ==========================================================================
  addTransporte() {
    this.checkPageBreak(80)
    this.addSectionTitle('DETALLE DE TRANSPORTE', COLORS.primaryLight)
    
    if (!this.lote.asignaciones || this.lote.asignaciones.length === 0) {
      this.doc.setFontSize(10)
      this.doc.setTextColor(...COLORS.mediumGray)
      this.doc.text('No hay camiones asignados a este lote', this.margin, this.yPos)
      this.yPos += 15
      return
    }
    
    // Tabla resumen de camiones
    const camionesData = this.lote.asignaciones.map(c => [
      `#${c.numeroCamion}`,
      c.estado,
      c.transportistaNombre,
      c.transportistaPlaca,
      c.pesajeOrigenNetoKg ? `${this.formatNumber(c.pesajeOrigenNetoKg)} kg` : '-',
      c.pesajeDestinoNetoKg ? `${this.formatNumber(c.pesajeDestinoNetoKg)} kg` : '-'
    ])
    
    autoTable(this.doc, {
      startY: this.yPos,
      head: [['Camión', 'Estado', 'Transportista', 'Placa', 'Peso Origen', 'Peso Destino']],
      body: camionesData,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: COLORS.darkGray
      },
      alternateRowStyles: {
        fillColor: COLORS.lightGray
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },
        1: { halign: 'center', cellWidth: 35 },
        2: { halign: 'left', cellWidth: 45 },
        3: { halign: 'center', cellWidth: 25 },
        4: { halign: 'right', cellWidth: 30 },
        5: { halign: 'right', cellWidth: 30 }
      },
      margin: { left: this.margin, right: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 10
  }

  // ==========================================================================
  // LIQUIDACIÓN DE VENTA DIRECTA
  // ==========================================================================
  addLiquidacionVenta() {
    const liq = this.lote.liquidacionVentaDirecta
    if (!liq) return
    
    this.checkPageBreak(100)
    this.addSectionTitle('LIQUIDACIÓN DE VENTA DIRECTA', COLORS.success)
    
    // ===== INFORMACIÓN BÁSICA =====
    const basicInfo = [
      ['Liquidación ID', `#${liq.id}`],
      ['Tipo', liq.tipoLiquidacion.replace(/_/g, ' ').toUpperCase()],
      ['Estado', this.capitalizeFirst(liq.estado.replace(/_/g, ' '))],
      ['Comercializadora', liq.comercializadora.razonSocial],
      ['NIT Comercializadora', liq.comercializadora.nit]
    ]
    
    autoTable(this.doc, {
      startY: this.yPos,
      body: basicInfo,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50, textColor: COLORS.darkGray },
        1: { cellWidth: this.contentWidth - 50 }
      },
      margin: { left: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 10
    
    // ===== PESOS =====
    if (liq.pesos) {
      this.checkPageBreak(40)
      this.addSubSectionTitle('Información de Pesos')
      
      const pesosData = [
        ['Peso Total Entrada', `${this.formatNumber(liq.pesos.pesoTotalEntrada)} kg`],
        ['Peso TMH', `${this.formatNumber(liq.pesos.pesoTmh)} Ton`],
        ['Peso Usado en Cálculo', liq.pesos.pesoUsadoEnCalculo || '-']
      ]
      
      autoTable(this.doc, {
        startY: this.yPos,
        body: pesosData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60, fillColor: COLORS.lightGray },
          1: { cellWidth: this.contentWidth - 60 }
        },
        margin: { left: this.margin }
      })
      
      this.yPos = this.doc.lastAutoTable.finalY + 8
    }
    
    // ===== REPORTES QUÍMICOS =====
    if (liq.reportesQuimicos && liq.reportesQuimicos.reporteAcordado) {
      this.checkPageBreak(60)
      this.addSubSectionTitle('Leyes Acordadas')
      
      const rep = liq.reportesQuimicos.reporteAcordado
      const leyesData = [
        ['Plata (Ag)', `${this.formatNumber(rep.leyAgDm, 4)} DM`],
        ['Plomo (Pb)', `${this.formatNumber(rep.leyPb, 4)} %`],
        ['Zinc (Zn)', `${this.formatNumber(rep.leyZn, 4)} %`]
      ]
      
      autoTable(this.doc, {
        startY: this.yPos,
        body: leyesData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 60, fillColor: [254, 243, 199], textColor: COLORS.darkGray },
          1: { cellWidth: this.contentWidth - 60, halign: 'right' }
        },
        margin: { left: this.margin }
      })
      
      this.yPos = this.doc.lastAutoTable.finalY + 8
    }
    
    // ===== COTIZACIONES =====
    if (liq.cotizaciones && liq.cotizaciones.length > 0) {
      this.checkPageBreak(50)
      this.addSubSectionTitle('Cotizaciones de Minerales')
      
      const cotizData = liq.cotizaciones.map(c => [
        c.mineral,
        `${this.formatNumber(c.cotizacion, 6)} ${c.unidad}`,
        c.fuente
      ])
      
      autoTable(this.doc, {
        startY: this.yPos,
        head: [['Mineral', 'Cotización', 'Fuente']],
        body: cotizData,
        theme: 'grid',
        headStyles: {
          fillColor: COLORS.gold,
          textColor: COLORS.white,
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 25, fontStyle: 'bold' },
          1: { halign: 'right', cellWidth: 50 },
          2: { halign: 'left', cellWidth: this.contentWidth - 75 }
        },
        margin: { left: this.margin }
      })
      
      this.yPos = this.doc.lastAutoTable.finalY + 8
    }
    
    // ===== VALORACIÓN =====
    if (liq.valoracion) {
      this.checkPageBreak(40)
      this.addSubSectionTitle('Valoración del Lote')
      
      const valData = [
        ['Mineral Principal', liq.valoracion.mineralPrincipal],
        ['Valor USD/Ton', `${this.formatCurrency(liq.valoracion.valorTotalUsdPorTon, 'USD')}`],
        ['Valor Bruto Total', `${this.formatCurrency(liq.valoracion.valorBrutoTotalUsd, 'USD')}`]
      ]
      
      autoTable(this.doc, {
        startY: this.yPos,
        body: valData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 60, fillColor: [219, 234, 254], textColor: COLORS.darkGray },
          1: { cellWidth: this.contentWidth - 60, halign: 'right' }
        },
        margin: { left: this.margin }
      })
      
      this.yPos = this.doc.lastAutoTable.finalY + 8
    }
    
    // ===== DEDUCCIONES =====
    if (liq.deducciones && liq.deducciones.deducciones.length > 0) {
      this.checkPageBreak(80)
      this.addSubSectionTitle('Deducciones Aplicadas')
      
      const dedData = liq.deducciones.deducciones.map(d => [
        d.concepto,
        `${this.formatNumber(d.porcentaje, 2)}%`,
        this.formatCurrency(d.montoDeducidoUsd, 'USD'),
        this.formatCurrency(d.montoDeducidoBob, 'BOB')
      ])
      
      // Agregar fila de total
      dedData.push([
        'TOTAL DEDUCCIONES',
        `${this.formatNumber(liq.deducciones.porcentajeTotal, 2)}%`,
        this.formatCurrency(liq.deducciones.totalDeduccionesUsd, 'USD'),
        this.formatCurrency(liq.deducciones.totalDeduccionesBob, 'BOB')
      ])
      
      autoTable(this.doc, {
        startY: this.yPos,
        head: [['Concepto', '%', 'Monto USD', 'Monto BOB']],
        body: dedData,
        theme: 'grid',
        headStyles: {
          fillColor: COLORS.error,
          textColor: COLORS.white,
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { halign: 'left', cellWidth: 75 },
          1: { halign: 'center', cellWidth: 20 },
          2: { halign: 'right', cellWidth: 40 },
          3: { halign: 'right', cellWidth: 40 }
        },
        didParseCell: (data) => {
          // Estilo especial para fila de total
          if (data.row.index === dedData.length - 1) {
            data.cell.styles.fontStyle = 'bold'
            data.cell.styles.fillColor = COLORS.lightGray
          }
        },
        margin: { left: this.margin }
      })
      
      this.yPos = this.doc.lastAutoTable.finalY + 8
    }
    
    // ===== RESULTADO FINAL (DESTACADO) =====
    if (liq.resultadoFinal) {
      this.checkPageBreak(60)
      
      // Box verde para resultado final
      const boxHeight = 50
      this.doc.setFillColor(...COLORS.success)
      this.doc.roundedRect(this.margin, this.yPos, this.contentWidth, boxHeight, 3, 3, 'F')
      
      // Contenido del box
      this.doc.setTextColor(...COLORS.white)
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('RESULTADO FINAL', this.margin + 5, this.yPos + 10)
      
      this.doc.setFontSize(9)
      this.doc.setFont('helvetica', 'normal')
      
      const result = liq.resultadoFinal
      let lineY = this.yPos + 20
      
      this.doc.text(`Valor Bruto: ${this.formatCurrency(result.valorBrutoUsd, 'USD')}`, this.margin + 5, lineY)
      lineY += 7
      this.doc.text(`Deducciones: ${this.formatCurrency(result.totalDeduccionesUsd, 'USD')}`, this.margin + 5, lineY)
      lineY += 7
      this.doc.text(`Valor Neto: ${this.formatCurrency(result.valorNetoUsd, 'USD')}`, this.margin + 5, lineY)
      
      // Valor neto en BOB (grande y destacado)
      this.doc.setFontSize(14)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(
        `${this.formatCurrency(result.valorNetoBob, 'BOB')}`,
        this.pageWidth - this.margin - 5,
        this.yPos + 30,
        { align: 'right' }
      )
      
      this.doc.setFontSize(8)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(
        `TC: ${result.tipoCambio}`,
        this.pageWidth - this.margin - 5,
        this.yPos + 40,
        { align: 'right' }
      )
      
      this.yPos += boxHeight + 10
    }
    
    // ===== INFORMACIÓN DE PAGO =====
    if (liq.pago && liq.estado === 'pagado') {
      this.checkPageBreak(40)
      this.addSubSectionTitle('Información de Pago')
      
      const pagoData = [
        ['Método de Pago', this.capitalizeFirst(liq.pago.metodoPago.replace(/_/g, ' '))],
        ['Número Comprobante', liq.pago.numeroComprobante],
        ['Fecha de Aprobación', this.formatDate(liq.pago.fechaAprobacion)],
        ['Fecha de Pago', this.formatDate(liq.pago.fechaPago)]
      ]
      
      autoTable(this.doc, {
        startY: this.yPos,
        body: pagoData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60, fillColor: [220, 252, 231] },
          1: { cellWidth: this.contentWidth - 60 }
        },
        margin: { left: this.margin }
      })
      
      this.yPos = this.doc.lastAutoTable.finalY + 8
    }
  }

  // ==========================================================================
  // LIQUIDACIÓN TOLL (PROCESAMIENTO)
  // ==========================================================================
  addLiquidacionToll() {
    const liq = this.lote.liquidacionToll
    if (!liq) return
    
    this.checkPageBreak(100)
    this.addSectionTitle('LIQUIDACIÓN DE PROCESAMIENTO (TOLL)', COLORS.info)
    
    // ===== INFORMACIÓN BÁSICA =====
    const basicInfo = [
      ['Liquidación ID', `#${liq.id}`],
      ['Estado', this.capitalizeFirst(liq.estado.replace(/_/g, ' '))],
      ['Socio', `${liq.socioNombres} ${liq.socioApellidos}`],
      ['CI', liq.socioCi]
    ]
    
    autoTable(this.doc, {
      startY: this.yPos,
      body: basicInfo,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50, textColor: COLORS.darkGray },
        1: { cellWidth: this.contentWidth - 50 }
      },
      margin: { left: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 10
    
    // ===== PESOS Y COSTOS DE PROCESAMIENTO =====
    this.checkPageBreak(50)
    this.addSubSectionTitle('Costos de Procesamiento')
    
    const costosData = [
      ['Peso Total Entrada', `${this.formatNumber(liq.pesoTotalEntradaKg)} kg`],
      ['Peso Total', `${this.formatNumber(liq.pesoTotalToneladas)} Ton`],
      ['Costo por Tonelada', this.formatCurrency(liq.costoPorTonelada, 'USD')],
      ['Costo Procesamiento Total', this.formatCurrency(liq.costoProcesamientoTotal, 'USD')]
    ]
    
    autoTable(this.doc, {
      startY: this.yPos,
      body: costosData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70, fillColor: COLORS.lightGray },
        1: { cellWidth: this.contentWidth - 70, halign: 'right' }
      },
      margin: { left: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 8
    
    // ===== SERVICIOS ADICIONALES =====
    if (liq.serviciosAdicionales) {
      this.checkPageBreak(60)
      this.addSubSectionTitle('Servicios Adicionales')
      
      const servicios = liq.serviciosAdicionales
      const serviciosData = []
      
      if (servicios.uso_balanza) {
        serviciosData.push([
          'Uso de Balanza',
          `${servicios.uso_balanza.cantidad_camiones} camiones`,
          this.formatCurrency(servicios.uso_balanza.costo_total, servicios.uso_balanza.moneda)
        ])
      }
      
      if (servicios.retroexcavadora_grande) {
        serviciosData.push([
          'Retroexcavadora Grande',
          `${servicios.retroexcavadora_grande.cantidad} ud.`,
          this.formatCurrency(servicios.retroexcavadora_grande.costo_total, servicios.retroexcavadora_grande.moneda)
        ])
      }
      
      if (servicios.retroexcavadora_pequena) {
        serviciosData.push([
          'Retroexcavadora Pequeña',
          `${servicios.retroexcavadora_pequena.cantidad} ud.`,
          this.formatCurrency(servicios.retroexcavadora_pequena.costo_total, servicios.retroexcavadora_pequena.moneda)
        ])
      }
      
      serviciosData.push([
        'TOTAL SERVICIOS',
        '',
        this.formatCurrency(liq.totalServiciosAdicionales, 'USD')
      ])
      
      autoTable(this.doc, {
        startY: this.yPos,
        head: [['Servicio', 'Cantidad', 'Costo']],
        body: serviciosData,
        theme: 'grid',
        headStyles: {
          fillColor: COLORS.copper,
          textColor: COLORS.white,
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { halign: 'left', cellWidth: 70 },
          1: { halign: 'center', cellWidth: 35 },
          2: { halign: 'right', cellWidth: 65 }
        },
        didParseCell: (data) => {
          if (data.row.index === serviciosData.length - 1) {
            data.cell.styles.fontStyle = 'bold'
            data.cell.styles.fillColor = COLORS.lightGray
          }
        },
        margin: { left: this.margin }
      })
      
      this.yPos = this.doc.lastAutoTable.finalY + 8
    }
    
    // ===== RESULTADO FINAL (DESTACADO) =====
    this.checkPageBreak(60)
    
    const boxHeight = 50
    this.doc.setFillColor(...COLORS.info)
    this.doc.roundedRect(this.margin, this.yPos, this.contentWidth, boxHeight, 3, 3, 'F')
    
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('TOTAL A PAGAR', this.margin + 5, this.yPos + 10)
    
    this.doc.setFontSize(9)
    this.doc.setFont('helvetica', 'normal')
    
    let lineY = this.yPos + 20
    this.doc.text(`Procesamiento: ${this.formatCurrency(liq.costoProcesamientoTotal, 'USD')}`, this.margin + 5, lineY)
    lineY += 7
    this.doc.text(`Servicios: ${this.formatCurrency(liq.totalServiciosAdicionales, 'USD')}`, this.margin + 5, lineY)
    lineY += 7
    this.doc.text(`Total: ${this.formatCurrency(liq.valorNetoUsd, 'USD')}`, this.margin + 5, lineY)
    
    // Total en BOB (grande)
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(
      `${this.formatCurrency(liq.valorNetoBob, 'BOB')}`,
      this.pageWidth - this.margin - 5,
      this.yPos + 30,
      { align: 'right' }
    )
    
    this.doc.setFontSize(8)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(
      `TC: ${liq.tipoCambio}`,
      this.pageWidth - this.margin - 5,
      this.yPos + 40,
      { align: 'right' }
    )
    
    this.yPos += boxHeight + 10
    
    // ===== INFORMACIÓN DE PAGO =====
    if (liq.fechaPago && liq.estado === 'pagado') {
      this.checkPageBreak(40)
      this.addSubSectionTitle('Información de Pago')
      
      const pagoData = [
        ['Método de Pago', this.capitalizeFirst(liq.metodoPago.replace(/_/g, ' '))],
        ['Número Comprobante', liq.numeroComprobante],
        ['Fecha de Pago', this.formatDate(liq.fechaPago)]
      ]
      
      autoTable(this.doc, {
        startY: this.yPos,
        body: pagoData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60, fillColor: [220, 252, 231] },
          1: { cellWidth: this.contentWidth - 60 }
        },
        margin: { left: this.margin }
      })
      
      this.yPos = this.doc.lastAutoTable.finalY + 8
    }
  }

  // ==========================================================================
  // UTILIDADES - TÍTULOS Y FORMATO
  // ==========================================================================
  addSectionTitle(text, color) {
    this.checkPageBreak(15)
    
    this.doc.setFillColor(...color)
    this.doc.rect(this.margin, this.yPos - 3, this.contentWidth, 10, 'F')
    
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(text, this.margin + 3, this.yPos + 4)
    
    this.doc.setTextColor(...COLORS.black)
    this.yPos += 15
  }

  addSubSectionTitle(text) {
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(...COLORS.darkGray)
    this.doc.text(text, this.margin, this.yPos)
    this.yPos += 8
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
      
      // Línea separadora
      this.doc.setDrawColor(...COLORS.borderGray)
      this.doc.line(this.margin, 280, this.pageWidth - this.margin, 280)
      
      // Texto del footer
      this.doc.setFontSize(8)
      this.doc.setTextColor(...COLORS.mediumGray)
      this.doc.setFont('helvetica', 'normal')
      
      this.doc.text(
        `Reporte generado: ${new Date().toLocaleDateString('es-BO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`,
        this.margin,
        287
      )
      
      this.doc.text(
        `Página ${i} de ${totalPages}`,
        this.pageWidth - this.margin,
        287,
        { align: 'right' }
      )
    }
  }

  // ==========================================================================
// DEDUCCIONES COOPERATIVA
// ==========================================================================
addDeduccionesCooperativa() {
  const tieneDeducciones = this.lote.deduccionesVenta?.length > 0
  const tieneConcentrados = this.lote.concentradosVendidos?.length > 0
  
  if (!tieneDeducciones && !tieneConcentrados) {
    return
  }

  this.checkPageBreak(80)
  this.addSectionTitle('DEDUCCIONES Y APORTES - COOPERATIVA', COLORS.primary)
  
  // SECCIÓN 1: Deducciones por Venta Directa
  if (tieneDeducciones) {
    this.checkPageBreak(80)
    this.addSubSectionTitle('Deducciones por Venta Directa')
    
    this.doc.setFontSize(9)
    this.doc.setTextColor(...COLORS.darkGray)
    this.doc.text(
      `Este lote fue vendido directamente. Total de deducciones: ${this.lote.deduccionesVenta.length}`,
      this.margin,
      this.yPos
    )
    this.yPos += 10
    
    const dedData = []
    for (let i = 0; i < this.lote.deduccionesVenta.length; i++) {
      const d = this.lote.deduccionesVenta[i]
      dedData.push([
        d.concepto,
        this.capitalizeFirst(d.tipoDeduccion),
        `${this.formatNumber(d.porcentaje, 2)}%`,
        this.formatCurrency(d.montoDeducidoUsd, 'USD'),
        this.formatCurrency(d.montoDeducidoBob, 'BOB')
      ])
    }
    
    // Calcular totales
    let totalUsd = 0
    let totalBob = 0
    let totalPorcentaje = 0
    for (let i = 0; i < this.lote.deduccionesVenta.length; i++) {
      const d = this.lote.deduccionesVenta[i]
      totalUsd += d.montoDeducidoUsd || 0
      totalBob += d.montoDeducidoBob || 0
      totalPorcentaje += d.porcentaje || 0
    }
    
    dedData.push([
      'TOTAL',
      '',
      `${this.formatNumber(totalPorcentaje, 2)}%`,
      this.formatCurrency(totalUsd, 'USD'),
      this.formatCurrency(totalBob, 'BOB')
    ])
    
    autoTable(this.doc, {
      startY: this.yPos,
      head: [['Concepto', 'Tipo', '%', 'Monto USD', 'Monto BOB']],
      body: dedData,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { halign: 'left', cellWidth: 70 },
        1: { halign: 'center', cellWidth: 25 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 35 },
        4: { halign: 'right', cellWidth: 35 }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index < this.lote.deduccionesVenta.length) {
          const tipoDeduccion = this.lote.deduccionesVenta[data.row.index]?.tipoDeduccion
          if (tipoDeduccion === 'regalia') {
            data.cell.styles.fillColor = [254, 243, 199]
          } else if (tipoDeduccion === 'aporte') {
            data.cell.styles.fillColor = [209, 250, 229]
          }
        }
        
        if (data.section === 'body' && data.row.index === dedData.length - 1) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = COLORS.lightGray
        }
      },
      margin: { left: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 10
  }
  
  // SECCIÓN 2: Deducciones por Concentrados
  if (tieneConcentrados) {
    this.checkPageBreak(80)
    this.addSubSectionTitle('Deducciones por Concentrados Procesados y Vendidos')
    
    this.doc.setFontSize(9)
    this.doc.setTextColor(...COLORS.darkGray)
    this.doc.text(
      `Este lote fue procesado. Se generaron ${this.lote.concentradosVendidos.length} concentrado(s) vendido(s).`,
      this.margin,
      this.yPos
    )
    this.yPos += 12
    
    let totalGeneralUsd = 0
    let totalGeneralBob = 0
    
    for (let index = 0; index < this.lote.concentradosVendidos.length; index++) {
      const conc = this.lote.concentradosVendidos[index]
      
      if (index > 0) {
        this.checkPageBreak(60)
        this.yPos += 5
      }
      
      // Título del concentrado
      this.doc.setFillColor(...COLORS.emerald)
      this.doc.rect(this.margin, this.yPos - 3, this.contentWidth, 10, 'F')
      
      this.doc.setTextColor(...COLORS.white)
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(
        `CONCENTRADO #${conc.concentradoId} - ${conc.codigoConcentrado} (${conc.mineralPrincipal})`,
        this.margin + 3,
        this.yPos + 4
      )
      
      this.doc.setTextColor(...COLORS.black)
      this.yPos += 12
      
      // Estado
      this.doc.setFontSize(8)
      this.doc.setFont('helvetica', 'italic')
      this.doc.setTextColor(...COLORS.mediumGray)
      this.doc.text(
        `Estado: ${conc.mensajeEstado || this.capitalizeFirst(conc.estado.replace(/_/g, ' '))}`,
        this.margin,
        this.yPos
      )
      this.yPos += 8
      
      if (!conc.deducciones || conc.deducciones.length === 0) {
        this.doc.setFont('helvetica', 'italic')
        this.doc.text('Sin deducciones registradas', this.margin, this.yPos)
        this.yPos += 15
        continue
      }
      
      const concDedData = []
      for (let i = 0; i < conc.deducciones.length; i++) {
        const d = conc.deducciones[i]
        concDedData.push([
          d.concepto,
          this.capitalizeFirst(d.tipoDeduccion),
          `${this.formatNumber(d.porcentaje, 2)}%`,
          this.formatCurrency(d.montoDeducidoUsd, 'USD'),
          this.formatCurrency(d.montoDeducidoBob, 'BOB')
        ])
      }
      
      let subtotalUsd = 0
      let subtotalBob = 0
      for (let i = 0; i < conc.deducciones.length; i++) {
        const d = conc.deducciones[i]
        subtotalUsd += d.montoDeducidoUsd || 0
        subtotalBob += d.montoDeducidoBob || 0
        totalGeneralUsd += d.montoDeducidoUsd || 0
        totalGeneralBob += d.montoDeducidoBob || 0
      }
      
      concDedData.push([
        `SUBTOTAL CONC. #${conc.concentradoId}`,
        '',
        '',
        this.formatCurrency(subtotalUsd, 'USD'),
        this.formatCurrency(subtotalBob, 'BOB')
      ])
      
      autoTable(this.doc, {
        startY: this.yPos,
        head: [['Concepto', 'Tipo', '%', 'USD', 'BOB']],
        body: concDedData,
        theme: 'grid',
        headStyles: {
          fillColor: COLORS.darkGray,
          textColor: COLORS.white,
          fontSize: 8,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 7 },
        columnStyles: {
          0: { halign: 'left', cellWidth: 65 },
          1: { halign: 'center', cellWidth: 22 },
          2: { halign: 'center', cellWidth: 18 },
          3: { halign: 'right', cellWidth: 35 },
          4: { halign: 'right', cellWidth: 35 }
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.row.index < conc.deducciones.length) {
            const ded = conc.deducciones[data.row.index]
            if (ded?.tipoDeduccion === 'regalia') {
              data.cell.styles.fillColor = [254, 243, 199]
            } else if (ded?.tipoDeduccion === 'aporte') {
              data.cell.styles.fillColor = [209, 250, 229]
            }
          }
          
          if (data.section === 'body' && data.row.index === concDedData.length - 1) {
            data.cell.styles.fontStyle = 'bold'
            data.cell.styles.fillColor = COLORS.lightGray
          }
        },
        margin: { left: this.margin }
      })
      
      this.yPos = this.doc.lastAutoTable.finalY + 5
    }
    
    // Total general si hay múltiples concentrados
    if (this.lote.concentradosVendidos.length > 1) {
      this.checkPageBreak(40)
      this.yPos += 5
      
      const boxHeight = 35
      this.doc.setFillColor(...COLORS.success)
      this.doc.roundedRect(this.margin, this.yPos, this.contentWidth, boxHeight, 3, 3, 'F')
      
      this.doc.setTextColor(...COLORS.white)
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('TOTAL GENERAL - TODOS LOS CONCENTRADOS', this.margin + 5, this.yPos + 10)
      
      this.doc.setFontSize(14)
      this.doc.text(
        this.formatCurrency(totalGeneralBob, 'BOB'),
        this.pageWidth - this.margin - 5,
        this.yPos + 22,
        { align: 'right' }
      )
      
      this.doc.setFontSize(9)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(
        this.formatCurrency(totalGeneralUsd, 'USD'),
        this.pageWidth - this.margin - 5,
        this.yPos + 30,
        { align: 'right' }
      )
      
      this.yPos += boxHeight + 10
    }
  }
}

  

  // ==========================================================================
  // HELPERS DE FORMATO
  // ==========================================================================
  formatDate(dateString) {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  formatCurrency(value, currency = 'BOB') {
    if (!value && value !== 0) return '-'
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: currency
    }).format(value)
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
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }
}

// ============================================================================
// FUNCIONES PÚBLICAS
// ============================================================================

export function generarPDFLote(lote, rol = 'socio') {
  const generator = new LotePDFGenerator(lote, rol)
  return generator.generate()
}

export function exportarLotePDF(lote, rol = 'socio', nombreArchivo = null) {
  const doc = generarPDFLote(lote, rol)
  const fileName = nombreArchivo || `Lote_${lote.id}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}

export default {
  generarPDFLote,
  exportarLotePDF
}