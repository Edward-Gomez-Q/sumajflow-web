// src/utils/reports/concentradoPDFGeneratorComplete.js
// GENERADOR PDF COMPLETO PARA CONCENTRADOS CON TODO EL DETALLE

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const COLORS = {
  primary: [30, 64, 175],
  primaryLight: [59, 130, 246],
  success: [16, 185, 129],
  warning: [245, 158, 11],
  error: [239, 68, 68],
  info: [59, 130, 246],
  white: [255, 255, 255],
  black: [0, 0, 0],
  lightGray: [243, 244, 246],
  mediumGray: [156, 163, 175],
  darkGray: [31, 41, 55],
  borderGray: [229, 231, 235],
  sky: [14, 165, 233],
  emerald: [16, 185, 129],
  amber: [245, 158, 11],
  violet: [139, 92, 246]
}

class ConcentradoPDFGenerator {
  constructor(concentrado, kanban = null) {
    this.concentrado = concentrado
    this.kanban = kanban
    this.doc = new jsPDF()
    this.yPos = 20
    this.pageWidth = 210
    this.pageHeight = 297
    this.margin = 20
    this.contentWidth = this.pageWidth - (this.margin * 2)
    this.currentPage = 1
  }

generate() {
  // Portada
  this.addPortada()
  
  // Información General
  this.addInformacionGeneral()
  
  // Procesos
  if (this.kanban?.todosProcesos?.length > 0) {
    this.addProcesos()
  }
  
  // Historial
  if (this.concentrado.observaciones?.length > 0) {
    this.addHistorial()
  }
  
  // Liquidación Toll
  if (this.concentrado.liquidacionToll) {
    this.addLiquidacionToll()
  }
  
  // Liquidaciones de Venta (NUEVO)
  if (this.concentrado.liquidacionesVenta?.length > 0) {
    this.addLiquidacionesVenta()
  }
  
  // Footer en todas las páginas
  this.addFooterAllPages()
  
  return this.doc
}

  // ==========================================================================
  // PORTADA
  // ==========================================================================
  addPortada() {
    // Fondo azul superior
    this.doc.setFillColor(...COLORS.primary)
    this.doc.rect(0, 0, this.pageWidth, 100, 'F')
    
    // Título principal
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(28)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('REPORTE CONSOLIDADO', this.pageWidth / 2, 35, { align: 'center' })
    
    // Subtítulo
    this.doc.setFontSize(20)
    this.doc.text('DE CONCENTRADO', this.pageWidth / 2, 50, { align: 'center' })
    
    // ID del concentrado
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`#${this.concentrado.id}`, this.pageWidth / 2, 70, { align: 'center' })
    
    
    // Información central
    this.doc.setTextColor(...COLORS.black)
    this.yPos = 120
    
    // Box con información clave
    this.doc.setFillColor(...COLORS.lightGray)
    this.doc.roundedRect(this.margin, this.yPos, this.contentWidth, 60, 3, 3, 'F')
    
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(...COLORS.darkGray)
    
    let infoY = this.yPos + 15
    this.doc.text('Estado:', this.margin + 10, infoY)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(this.capitalizeFirst(this.concentrado.estado.replace(/_/g, ' ')), this.margin + 50, infoY)
    
    infoY += 10
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Mineral Principal:', this.margin + 10, infoY)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(this.concentrado.mineralPrincipal || '-', this.margin + 50, infoY)
    
    infoY += 10
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Ingenio:', this.margin + 10, infoY)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(this.concentrado.ingenioNombre, this.margin + 50, infoY)
    
    infoY += 10
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Socio:', this.margin + 10, infoY)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`${this.concentrado.socioNombres} ${this.concentrado.socioApellidos}`, this.margin + 50, infoY)
    
    // Fecha de generación
    this.yPos = 240
    this.doc.setFontSize(9)
    this.doc.setTextColor(...COLORS.mediumGray)
    this.doc.text(
      `Reporte generado: ${new Date().toLocaleString('es-BO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`,
      this.pageWidth / 2,
      this.yPos,
      { align: 'center' }
    )
    
    // Nueva página para contenido
    this.doc.addPage()
    this.yPos = 20
    this.currentPage++
  }

  // ==========================================================================
  // INFORMACIÓN GENERAL
  // ==========================================================================
  addInformacionGeneral() {
    this.addSectionTitle('INFORMACIÓN GENERAL DEL CONCENTRADO', COLORS.primaryLight)
    
    // Datos básicos
    const datosBasicos = [
      ['ID Concentrado', this.concentrado.id || '-'],
      ['Estado', this.capitalizeFirst(this.concentrado.estado.replace(/_/g, ' '))],
      ['Mineral Principal', this.concentrado.mineralPrincipal || '-'],
      ['Minerales Secundarios', this.concentrado.mineralesSecundarios || '-'],
      ['Tipo de Origen', this.concentrado.loteOrigenMultiple ? 'Lote Múltiple' : 'Lote Único']
    ]
    
    autoTable(this.doc, {
      startY: this.yPos,
      body: datosBasicos,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60, fillColor: COLORS.lightGray },
        1: { cellWidth: this.contentWidth - 60 }
      },
      margin: { left: this.margin, right: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 10
    
    // Pesos y medidas
    this.checkPageBreak(60)
    this.addSubSectionTitle('Pesos y Medidas')
    
    const porcentajeMerma = (this.concentrado.merma && this.concentrado.pesoInicial) 
      ? ((this.concentrado.merma / (this.concentrado.pesoInicial * 1000)) * 100).toFixed(2) + '%'
      : '-'
    
    const datosPesos = [
      ['Peso Inicial', `${this.formatNumber(this.concentrado.pesoInicial)} Ton`],
      ['Peso Final', this.concentrado.pesoFinal ? `${this.formatNumber(this.concentrado.pesoFinal)} Ton` : 'Pendiente'],
      ['Merma', this.concentrado.merma ? `${this.formatNumber(this.concentrado.merma)} Ton` : '-'],
      ['Número de Sacos', (this.concentrado.numeroSacos || 0).toString()]
    ]
    
    autoTable(this.doc, {
      startY: this.yPos,
      body: datosPesos,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60, fillColor: COLORS.lightGray },
        1: { cellWidth: this.contentWidth - 60 }
      },
      margin: { left: this.margin, right: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 10
    
    // Socio Propietario
    this.checkPageBreak(50)
    this.addSubSectionTitle('Socio Propietario')
    
    const datosSocio = [
      ['Nombre Completo', `${this.concentrado.socioNombres} ${this.concentrado.socioApellidos}`],
      ['CI', this.concentrado.socioCi],
      ['ID Socio', this.concentrado.socioId.toString()]
    ]
    
    autoTable(this.doc, {
      startY: this.yPos,
      body: datosSocio,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60, fillColor: COLORS.lightGray },
        1: { cellWidth: this.contentWidth - 60 }
      },
      margin: { left: this.margin, right: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 10
    
    // Ingenio
    this.checkPageBreak(40)
    this.addSubSectionTitle('Ingenio Procesador')
    
    const datosIngenio = [
      ['Nombre', this.concentrado.ingenioNombre],
      ['ID Ingenio', this.concentrado.ingenioId.toString()]
    ]
    
    autoTable(this.doc, {
      startY: this.yPos,
      body: datosIngenio,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60, fillColor: COLORS.lightGray },
        1: { cellWidth: this.contentWidth - 60 }
      },
      margin: { left: this.margin, right: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 10
    
    // Lotes
    if (this.concentrado.lotes?.length > 0) {
      this.checkPageBreak(60)
      this.addSubSectionTitle(`Lotes Procesados (${this.concentrado.lotes.length})`)
      
      const lotesData = this.concentrado.lotes.map(lote => [
        `#${lote.id}`,
        lote.minaNombre,
        this.capitalizeFirst(lote.tipoMineral),
        `${this.formatNumber(lote.pesoTotalReal)} Kg`,
        lote.estado || '-'
      ])
      
      autoTable(this.doc, {
        startY: this.yPos,
        head: [['ID', 'Mina', 'Tipo', 'Peso', 'Estado']],
        body: lotesData,
        theme: 'grid',
        headStyles: {
          fillColor: COLORS.primary,
          textColor: COLORS.white,
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 20 },
          1: { halign: 'left', cellWidth: 50 },
          2: { halign: 'center', cellWidth: 30 },
          3: { halign: 'right', cellWidth: 30 },
          4: { halign: 'center', cellWidth: 40 }
        },
        margin: { left: this.margin, right: this.margin }
      })
      
      this.yPos = this.doc.lastAutoTable.finalY + 10
    }
    
    // Fechas
    this.checkPageBreak(50)
    this.addSubSectionTitle('Cronología')
    
    const duracionTotal = (this.concentrado.fechaInicio && this.concentrado.fechaFin)
      ? this.calcularDuracionCompleta(this.concentrado.fechaInicio, this.concentrado.fechaFin)
      : '-'
    
    const datosFechas = [
      ['Fecha de Inicio', this.formatDateComplete(this.concentrado.fechaInicio)],
      ['Fecha de Finalización', this.concentrado.fechaFin ? this.formatDateComplete(this.concentrado.fechaFin) : 'En proceso'],
      ['Duración Total', duracionTotal],
      ['Creado', this.formatDateComplete(this.concentrado.createdAt)],
      ['Última Actualización', this.formatDateComplete(this.concentrado.updatedAt)]
    ]
    
    autoTable(this.doc, {
      startY: this.yPos,
      body: datosFechas,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60, fillColor: COLORS.lightGray },
        1: { cellWidth: this.contentWidth - 60 }
      },
      margin: { left: this.margin, right: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 10
  }

  // ==========================================================================
  // PROCESOS
  // ==========================================================================
  addProcesos() {
    this.checkPageBreak(100)
    this.addSectionTitle('DETALLE DE PROCESOS', COLORS.primaryLight)
    
    // Resumen
    const progreso = this.kanban.totalProcesos > 0 
      ? Math.round((this.kanban.procesosCompletados / this.kanban.totalProcesos) * 100)
      : 0
    
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(...COLORS.darkGray)
    this.doc.text(
      `Progreso: ${this.kanban.procesosCompletados} de ${this.kanban.totalProcesos} completados (${progreso}%)`,
      this.margin,
      this.yPos
    )
    this.yPos += 10
    
    // Estadísticas
    const estadisticas = this.calcularEstadisticasProcesos()
    if (estadisticas) {
      this.doc.setFontSize(9)
      this.doc.text(`Duración Total: ${estadisticas.duracionTotal}`, this.margin, this.yPos)
      this.yPos += 6
      this.doc.text(`Más Rápido: ${estadisticas.masRapido.nombre} (${estadisticas.masRapido.duracion})`, this.margin, this.yPos)
      this.yPos += 6
      this.doc.text(`Más Lento: ${estadisticas.masLento.nombre} (${estadisticas.masLento.duracion})`, this.margin, this.yPos)
      this.yPos += 10
    }
    
    // Tabla de procesos
    const procesosData = this.kanban.todosProcesos.map(proceso => [
      proceso.orden,
      proceso.nombreProceso,
      this.capitalizeFirst(proceso.estado),
      this.formatDate(proceso.fechaInicio),
      proceso.fechaFin ? this.formatDate(proceso.fechaFin) : '-',
      (proceso.fechaFin && proceso.fechaInicio) 
        ? this.calcularDuracion(proceso.fechaInicio, proceso.fechaFin)
        : '-'
    ])
    
    autoTable(this.doc, {
      startY: this.yPos,
      head: [['#', 'Proceso', 'Estado', 'Inicio', 'Fin', 'Duración']],
      body: procesosData,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 40 },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'center', cellWidth: 30 },
        4: { halign: 'center', cellWidth: 30 },
        5: { halign: 'center', cellWidth: 25 }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          const estado = this.kanban.todosProcesos[data.row.index].estado
          if (estado === 'completado') {
            data.cell.styles.fillColor = [209, 250, 229]
            data.cell.styles.textColor = [22, 101, 52]
          } else if (estado === 'en_proceso') {
            data.cell.styles.fillColor = [219, 234, 254]
            data.cell.styles.textColor = [29, 78, 216]
          }
        }
      },
      margin: { left: this.margin, right: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 10
  }

  // ==========================================================================
  // HISTORIAL
  // ==========================================================================
  addHistorial() {
    this.checkPageBreak(80)
    this.addSectionTitle('HISTORIAL KANBAN', COLORS.primaryLight)
    
    const historial = this.procesarHistorial()
    
    if (historial.length === 0) {
      this.doc.setFontSize(10)
      this.doc.setTextColor(...COLORS.mediumGray)
      this.doc.text('No hay registros de historial disponibles', this.margin, this.yPos)
      this.yPos += 20
      return
    }
    
    this.doc.setFontSize(9)
    this.doc.setTextColor(...COLORS.darkGray)
    this.doc.text(`Total de Registros: ${historial.length}`, this.margin, this.yPos)
    this.yPos += 10
    
    // Tabla de historial con columna de detalles
    const historialData = historial.map((reg, idx) => {
      const accion = (reg.accion || reg.estado || '-').replace(/_/g, ' ')
      const detalles = this.formatearDetallesRegistro(reg)
      
      return [
        idx + 1,
        this.formatDate(reg.timestamp),
        accion.substring(0, 30),
        detalles
      ]
    })
    
    autoTable(this.doc, {
      startY: this.yPos,
      head: [['#', 'Fecha/Hora', 'Acción/Estado', 'Detalles']],
      body: historialData,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'left', cellWidth: 35 },
        3: { halign: 'left', cellWidth: 95 } // Columna más ancha para detalles
      },
      margin: { left: this.margin, right: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 15
  }

  // Agregar este método si no existe, o reemplazarlo
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
        detalles.push(`${det.proceso_origen.nombre} - ${det.proceso_destino.nombre}`)
      }
      
      if (det.pesos_finales) {
        detalles.push(`Peso final: ${det.pesos_finales.peso_final} Ton, Merma: ${det.pesos_finales.porcentaje_merma}%`)
      }
      
      if (det.estado_anterior) {
        detalles.push(`Estado anterior: ${det.estado_anterior}`)
      }
    }
    
    return detalles.length > 0 ? detalles.join(' | ') : '-'
  }

  // ==========================================================================
  // LIQUIDACIÓN TOLL
  // ==========================================================================
  addLiquidacionToll() {
    const liq = this.concentrado.liquidacionToll
    if (!liq) return
    
    this.checkPageBreak(120)
    this.addSectionTitle('LIQUIDACIÓN DE PROCESAMIENTO (TOLL)', COLORS.info)
    
    // Info básica
    const infoBasica = [
      ['ID Liquidación', `#${liq.id}`],
      ['Estado', this.capitalizeFirst(liq.estado.replace(/_/g, ' '))],
      ['Moneda', liq.moneda]
    ]
    
    autoTable(this.doc, {
      startY: this.yPos,
      body: infoBasica,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: this.contentWidth - 50 }
      },
      margin: { left: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 10
    
    // Costos
    this.checkPageBreak(60)
    this.addSubSectionTitle('Costos de Procesamiento')
    
    const costos = [
      ['Peso Total', `${this.formatNumber(liq.pesoTotalEntradaKg)} Kg (${this.formatNumber(liq.pesoTotalToneladas, 4)} Ton)`],
      ['Costo por Tonelada', this.formatCurrency(liq.costoPorTonelada, 'USD')],
      ['Costo Total', this.formatCurrency(liq.costoProcesamientoTotal, 'USD')]
    ]
    
    autoTable(this.doc, {
      startY: this.yPos,
      body: costos,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60, fillColor: COLORS.lightGray },
        1: { cellWidth: this.contentWidth - 60, halign: 'right' }
      },
      margin: { left: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 8
    
    // Servicios adicionales
    if (liq.serviciosAdicionales) {
      this.checkPageBreak(50)
      this.addSubSectionTitle('Servicios Adicionales')
      
      const servicios = []
      
      if (liq.serviciosAdicionales.uso_balanza) {
        const s = liq.serviciosAdicionales.uso_balanza
        servicios.push(['Balanza', `${s.cantidad_camiones} cam.`, this.formatCurrency(s.costo_total, s.moneda)])
      }
      
      if (liq.serviciosAdicionales.retroexcavadora_grande) {
        const s = liq.serviciosAdicionales.retroexcavadora_grande
        servicios.push(['Retroexc. Grande', `${s.cantidad} ud.`, this.formatCurrency(s.costo_total, s.moneda)])
      }
      
      if (liq.serviciosAdicionales.retroexcavadora_pequena) {
        const s = liq.serviciosAdicionales.retroexcavadora_pequena
        servicios.push(['Retroexc. Pequeña', `${s.cantidad} ud.`, this.formatCurrency(s.costo_total, s.moneda)])
      }
      
      servicios.push(['TOTAL', '', this.formatCurrency(liq.totalServiciosAdicionales, 'USD')])
      
      autoTable(this.doc, {
        startY: this.yPos,
        head: [['Servicio', 'Cantidad', 'Costo']],
        body: servicios,
        theme: 'grid',
        headStyles: {
          fillColor: COLORS.info,
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { halign: 'left', cellWidth: 70 },
          1: { halign: 'center', cellWidth: 30 },
          2: { halign: 'right', cellWidth: 70 }
        },
        didParseCell: (data) => {
          if (data.row.index === servicios.length - 1) {
            data.cell.styles.fontStyle = 'bold'
            data.cell.styles.fillColor = COLORS.lightGray
          }
        },
        margin: { left: this.margin }
      })
      
      this.yPos = this.doc.lastAutoTable.finalY + 8
    }
    
    // Total destacado
    this.checkPageBreak(50)
    
    const boxHeight = 45
    this.doc.setFillColor(...COLORS.info)
    this.doc.roundedRect(this.margin, this.yPos, this.contentWidth, boxHeight, 3, 3, 'F')
    
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('TOTAL A PAGAR', this.margin + 5, this.yPos + 12)
    
    this.doc.setFontSize(18)
    this.doc.text(
      this.formatCurrency(liq.valorNetoBob, 'BOB'),
      this.pageWidth - this.margin - 5,
      this.yPos + 25,
      { align: 'right' }
    )
    
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(
      `${this.formatCurrency(liq.valorNetoUsd, 'USD')} | TC: ${liq.tipoCambio}`,
      this.pageWidth - this.margin - 5,
      this.yPos + 37,
      { align: 'right' }
    )
    
    this.yPos += boxHeight + 10
    
    // Info de pago
    if (liq.fechaPago && liq.estado === 'pagado') {
      this.checkPageBreak(40)
      this.addSubSectionTitle('Información de Pago')
      
      const pago = [
        ['Método', this.capitalizeFirst(liq.metodoPago?.replace(/_/g, ' ') || '-')],
        ['Comprobante', liq.numeroComprobante || '-'],
        ['Fecha', this.formatDateComplete(liq.fechaPago)]
      ]
      
      autoTable(this.doc, {
        startY: this.yPos,
        body: pago,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40, fillColor: [220, 252, 231] },
          1: { cellWidth: this.contentWidth - 40 }
        },
        margin: { left: this.margin }
      })
      
      this.yPos = this.doc.lastAutoTable.finalY + 10
    }
  }
  // ==========================================================================
// LIQUIDACIONES DE VENTA
// ==========================================================================
addLiquidacionesVenta() {
  if (!this.concentrado.liquidacionesVenta || this.concentrado.liquidacionesVenta.length === 0) {
    return
  }

  this.concentrado.liquidacionesVenta.forEach((liq, index) => {
    if (index > 0 || this.yPos > 100) {
      this.doc.addPage()
      this.yPos = 20
      this.currentPage++
    }

    this.addSectionTitle(`LIQUIDACIÓN DE VENTA #${liq.id}`, COLORS.success)
    
    // Info básica
    const infoBasica = [
      ['Estado', this.capitalizeFirst(liq.estado.replace(/_/g, ' '))],
      ['Tipo', this.capitalizeFirst(liq.tipoLiquidacion.replace(/_/g, ' '))],
      ['Moneda', liq.moneda]
    ]
    
    autoTable(this.doc, {
      startY: this.yPos,
      body: infoBasica,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: this.contentWidth - 50 }
      },
      margin: { left: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 10
    
    // Comercializadora
    this.checkPageBreak(40)
    this.addSubSectionTitle('Comercializadora')
    
    const comercializadora = [
      ['Nombre', liq.comercializadoraNombre],
      ['NIT', liq.comercializadoraNit]
    ]
    
    autoTable(this.doc, {
      startY: this.yPos,
      body: comercializadora,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50, fillColor: COLORS.lightGray },
        1: { cellWidth: this.contentWidth - 50 }
      },
      margin: { left: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 8
    
    // Concentrados incluidos
    if (liq.concentrados?.length > 0) {
      this.checkPageBreak(60)
      this.addSubSectionTitle(`Concentrados Incluidos (${liq.concentrados.length})`)
      
      const concData = liq.concentrados.map(c => [
        `#${c.id}`,
        c.mineralPrincipal,
        `${this.formatNumber(c.pesoFinal)} Kg`,
        c.numeroSacos,
        this.capitalizeFirst(c.estado.replace(/_/g, ' '))
      ])
      
      autoTable(this.doc, {
        startY: this.yPos,
        head: [['ID', 'Mineral', 'Peso Final', 'Sacos', 'Estado']],
        body: concData,
        theme: 'grid',
        headStyles: {
          fillColor: COLORS.success,
          textColor: COLORS.white,
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 20 },
          1: { halign: 'center', cellWidth: 30 },
          2: { halign: 'right', cellWidth: 35 },
          3: { halign: 'center', cellWidth: 25 },
          4: { halign: 'center', cellWidth: 60 }
        },
        margin: { left: this.margin }
      })
      
      this.yPos = this.doc.lastAutoTable.finalY + 8
    }
    
    // Pesos
    this.checkPageBreak(50)
    this.addSubSectionTitle('Pesos y Medidas')
    
    const pesos = [
      ['Peso TMH', `${this.formatNumber(liq.pesoTmh, 4)} Ton`],
      ['Peso TMS', `${this.formatNumber(liq.pesoTms, 4)} Ton`],
      ['Peso Final TMS', `${this.formatNumber(liq.pesoFinalTms, 4)} Ton`]
    ]
    
    autoTable(this.doc, {
      startY: this.yPos,
      body: pesos,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50, fillColor: COLORS.lightGray },
        1: { cellWidth: this.contentWidth - 50, halign: 'right' }
      },
      margin: { left: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 8
    
    // Análisis Químico
    this.checkPageBreak(70)
    this.addSubSectionTitle('Análisis Químico')
    
    const reportes = []
    
    if (liq.reporteSocio) {
      reportes.push([
        'Socio',
        `${this.formatNumber(liq.reporteSocio.leyMineralPrincipal, 2)}%`,
        `${this.formatNumber(liq.reporteSocio.leyAgGmt, 2)} g/MT`,
        `${this.formatNumber(liq.reporteSocio.porcentajeH2o, 2)}%`,
        liq.reporteSocio.laboratorio?.toUpperCase() || '-'
      ])
    }
    
    if (liq.reporteComercializadora) {
      reportes.push([
        'Comercializadora',
        `${this.formatNumber(liq.reporteComercializadora.leyMineralPrincipal, 2)}%`,
        `${this.formatNumber(liq.reporteComercializadora.leyAgGmt, 2)} g/MT`,
        `${this.formatNumber(liq.reporteComercializadora.porcentajeH2o, 2)}%`,
        liq.reporteComercializadora.laboratorio?.toUpperCase() || '-'
      ])
    }
    
    if (liq.reporteAcordado) {
      reportes.push([
        'ACORDADO',
        `${this.formatNumber(liq.reporteAcordado.leyMineralPrincipal, 2)}%`,
        `${this.formatNumber(liq.reporteAcordado.leyAgGmt, 2)} g/MT`,
        `${this.formatNumber(liq.reporteAcordado.porcentajeH2o, 2)}%`,
        '-'
      ])
    }
    
    autoTable(this.doc, {
      startY: this.yPos,
      head: [['Origen', 'Ley Principal', 'Ley Ag', 'H2O', 'Lab']],
      body: reportes,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.success,
        textColor: COLORS.white,
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { halign: 'left', cellWidth: 40 },
        1: { halign: 'right', cellWidth: 30 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 25 },
        4: { halign: 'center', cellWidth: 25 }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.cell.raw === 'ACORDADO') {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = COLORS.lightGreen
        }
      },
      margin: { left: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 8
    
    // Valorización
    this.checkPageBreak(60)
    this.addSubSectionTitle('Valorización')
    
    const valoriz = [
      ['Mineral Principal', `${liq.mineralPrincipal} - Ley: ${this.formatNumber(liq.leyMineralPrincipalPromedio, 2)}%`],
      ['Cotización Internacional', this.formatCurrency(liq.cotizacionInternacionalUsd, 'USD')],
      ['Valor Bruto', this.formatCurrency(liq.valorBrutoUsd, 'USD')],
      ['Total Deducciones', this.formatCurrency(liq.totalDeduccionesUsd, 'USD')]
    ]
    
    autoTable(this.doc, {
      startY: this.yPos,
      body: valoriz,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60, fillColor: COLORS.lightGray },
        1: { cellWidth: this.contentWidth - 60, halign: 'right' }
      },
      margin: { left: this.margin }
    })
    
    this.yPos = this.doc.lastAutoTable.finalY + 8
    
    // Deducciones
    if (liq.deducciones?.length > 0) {
      this.checkPageBreak(80)
      this.addSubSectionTitle('Deducciones')
      
      const dedData = liq.deducciones.map(d => [
        d.nombre,
        `${this.formatNumber(d.porcentaje, 2)}%`,
        this.formatCurrency(d.montoUsd, 'USD'),
        this.formatCurrency(d.montoBob, 'BOB')
      ])
      
      autoTable(this.doc, {
        startY: this.yPos,
        head: [['Concepto', '%', 'USD', 'BOB']],
        body: dedData,
        theme: 'grid',
        headStyles: {
          fillColor: COLORS.warning,
          textColor: COLORS.white,
          fontSize: 8,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { halign: 'left', cellWidth: 60 },
          1: { halign: 'center', cellWidth: 20 },
          2: { halign: 'right', cellWidth: 35 },
          3: { halign: 'right', cellWidth: 35 }
        },
        margin: { left: this.margin }
      })
      
      this.yPos = this.doc.lastAutoTable.finalY + 8
    }
    
    // Total destacado
    this.checkPageBreak(50)
    
    const boxHeight = 45
    this.doc.setFillColor(...COLORS.success)
    this.doc.roundedRect(this.margin, this.yPos, this.contentWidth, boxHeight, 3, 3, 'F')
    
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('TOTAL A RECIBIR', this.margin + 5, this.yPos + 12)
    
    this.doc.setFontSize(18)
    this.doc.text(
      this.formatCurrency(liq.valorNetoBob, 'BOB'),
      this.pageWidth - this.margin - 5,
      this.yPos + 25,
      { align: 'right' }
    )
    
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(
      `${this.formatCurrency(liq.valorNetoUsd, 'USD')} | TC: ${liq.tipoCambio}`,
      this.pageWidth - this.margin - 5,
      this.yPos + 37,
      { align: 'right' }
    )
    
    this.yPos += boxHeight + 10
    
    // Info de pago
    if (liq.fechaPago && liq.estado === 'pagado') {
      this.checkPageBreak(50)
      this.addSubSectionTitle('Información de Pago')
      
      const pago = [
        ['Método', this.capitalizeFirst(liq.metodoPago?.replace(/_/g, ' ') || '-')],
        ['Comprobante', liq.numeroComprobante || '-'],
        ['Fecha Pago', this.formatDateComplete(liq.fechaPago)],
        ['Fecha Aprobación', this.formatDateComplete(liq.fechaAprobacion)]
      ]
      
      autoTable(this.doc, {
        startY: this.yPos,
        body: pago,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 50, fillColor: [220, 252, 231] },
          1: { cellWidth: this.contentWidth - 50 }
        },
        margin: { left: this.margin }
      })
      
      this.yPos = this.doc.lastAutoTable.finalY + 10
    }
  })
}

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  addSectionTitle(text, color) {
    this.checkPageBreak(20)
    
    this.doc.setFillColor(...color)
    this.doc.rect(this.margin, this.yPos - 3, this.contentWidth, 12, 'F')
    
    this.doc.setTextColor(...COLORS.white)
    this.doc.setFontSize(13)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(text, this.margin + 3, this.yPos + 5)
    
    this.doc.setTextColor(...COLORS.black)
    this.yPos += 18
  }

  addSubSectionTitle(text) {
    this.doc.setFontSize(11)
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

  addFooterAllPages() {
    const totalPages = this.doc.internal.getNumberOfPages()
    
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i)
      
      this.doc.setDrawColor(...COLORS.borderGray)
      this.doc.line(this.margin, 280, this.pageWidth - this.margin, 280)
      
      this.doc.setFontSize(8)
      this.doc.setTextColor(...COLORS.mediumGray)
      this.doc.setFont('helvetica', 'normal')
      
      this.doc.text(
        `Concentrado #${this.concentrado.id}`,
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

  // Procesamiento de datos
  
  procesarHistorial() {
    if (!Array.isArray(this.concentrado.observaciones)) return []
    
    return this.concentrado.observaciones.filter(obs => {
      if (obs.estado === 'creado' && !obs.accion) return false
      if (obs.estado === 'en_camino_a_planta' && !obs.accion) return false
      if (obs.estado === 'en_proceso' && obs.descripcion?.includes('Procesamiento iniciado')) return false
      return true
    }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
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
    const masRapido = duraciones.reduce((min, d) => d.milisegundos < min.milisegundos ? d : min)
    const masLento = duraciones.reduce((max, d) => d.milisegundos > max.milisegundos ? d : max)
    
    return {
      duracionTotal: this.formatearDuracion(totalMs),
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

  // Formatos
  
  formatearDuracion(ms) {
    const seg = Math.floor(ms / 1000)
    const min = Math.floor(seg / 60)
    const hrs = Math.floor(min / 60)
    
    if (hrs > 0) return `${hrs}h ${min % 60}m`
    if (min > 0) return `${min}m ${seg % 60}s`
    return `${seg}s`
  }

  calcularDuracion(inicio, fin) {
    if (!inicio || !fin) return '-'
    return this.formatearDuracion(new Date(fin) - new Date(inicio))
  }

  calcularDuracionCompleta(inicio, fin) {
    if (!inicio || !fin) return '-'
    const diff = new Date(fin) - new Date(inicio)
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    const partes = []
    if (dias > 0) partes.push(`${dias}d`)
    if (horas > 0) partes.push(`${horas}h`)
    if (minutos > 0) partes.push(`${minutos}m`)
    
    return partes.join(' ')
  }

  formatDateComplete(dateString) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('es-BO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  formatDate(dateString) {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('es-BO', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  formatCurrency(value, currency = 'BOB') {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: currency
    }).format(value)
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
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }
}

// ============================================================================
// FUNCIONES PÚBLICAS
// ============================================================================

export function exportarConcentradoPDFCompleto(concentrado, kanban = null, nombreArchivo = null) {
  const generator = new ConcentradoPDFGenerator(concentrado, kanban)
  const doc = generator.generate()
  
  const fileName =  `Concentrado_${concentrado.id}_Completo_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}

export function generarPDFConcentrado(concentrado, kanban = null) {
  const generator = new ConcentradoPDFGenerator(concentrado, kanban)
  return generator.generate()
}

export default {
  exportarConcentradoPDFCompleto,
  generarPDFConcentrado
}