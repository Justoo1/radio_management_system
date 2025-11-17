/**
 * PDF Generator Utility
 * Generate invoices as PDF documents
 */

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface InvoiceData {
  id: string
  invoiceNumber: string
  clientName: string
  clientEmail?: string
  issueDate: Date | string
  dueDate: Date | string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    amount: number
  }>
  subtotal: number
  taxAmount: number
  discount: number
  totalAmount: number
  status: string
  notes?: string | null
}

/**
 * Format date for display
 */
function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

/**
 * Generate PDF from HTML element
 */
export async function generateInvoicePDF(
  invoice: InvoiceData,
  elementId?: string
): Promise<void> {
  try {
    // If elementId provided, capture HTML element
    if (elementId) {
      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error(`Element with ID "${elementId}" not found`)
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth - 20
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)

      pdf.save(`${invoice.invoiceNumber}.pdf`)
      return
    }

    // Generate PDF programmatically
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    let yPosition = 15

    // Helper to add a new page if needed
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 10) {
        pdf.addPage()
        yPosition = 15
      }
    }

    // Header
    pdf.setFontSize(24)
    pdf.setTextColor(79, 70, 229) // Indigo color
    pdf.text('INVOICE', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    // Invoice Details
    pdf.setFontSize(11)
    pdf.setTextColor(0, 0, 0)
    pdf.text(`Invoice #: ${invoice.invoiceNumber}`, 15, yPosition)
    yPosition += 7
    pdf.text(`Status: ${invoice.status}`, 15, yPosition)
    yPosition += 10

    // Client Information
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Bill To:', 15, yPosition)
    yPosition += 7

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    pdf.text(invoice.clientName, 15, yPosition)
    yPosition += 5
    if (invoice.clientEmail) {
      pdf.text(invoice.clientEmail, 15, yPosition)
      yPosition += 5
    }
    yPosition += 5

    // Dates
    pdf.setFontSize(10)
    pdf.text(`Issue Date: ${formatDate(invoice.issueDate)}`, 15, yPosition)
    yPosition += 5
    pdf.text(`Due Date: ${formatDate(invoice.dueDate)}`, 15, yPosition)
    yPosition += 10

    // Line Items Table
    checkPageBreak(40)

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.setFillColor(79, 70, 229)
    pdf.setTextColor(255, 255, 255)

    const colWidths = [80, 25, 25, 40]
    const startX = 15

    pdf.rect(startX, yPosition - 4, pageWidth - 30, 7, 'F')
    pdf.text('Description', startX + 2, yPosition)
    pdf.text('Qty', startX + colWidths[0] + 2, yPosition)
    pdf.text('Unit Price', startX + colWidths[0] + colWidths[1] + 2, yPosition)
    pdf.text('Amount', startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, yPosition)

    yPosition += 8

    pdf.setTextColor(0, 0, 0)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)

    // Line items
    invoice.items.forEach((item) => {
      checkPageBreak(10)

      const lines = pdf.splitTextToSize(item.description, colWidths[0] - 4)
      const lineHeight = lines.length * 5

      pdf.text(lines, startX + 2, yPosition)
      pdf.text(item.quantity.toString(), startX + colWidths[0] + 2, yPosition, { align: 'right' })
      pdf.text(
        formatCurrency(item.unitPrice),
        startX + colWidths[0] + colWidths[1] + 2,
        yPosition,
        { align: 'right' }
      )
      pdf.text(
        formatCurrency(item.amount),
        startX + colWidths[0] + colWidths[1] + colWidths[2] + 2,
        yPosition,
        { align: 'right' }
      )

      yPosition += lineHeight + 2
    })

    yPosition += 5

    // Summary section
    checkPageBreak(40)

    const summaryX = startX + colWidths[0] + colWidths[1] + colWidths[2] + 10

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)

    pdf.text('Subtotal:', summaryX, yPosition)
    pdf.text(formatCurrency(invoice.subtotal), pageWidth - 15, yPosition, { align: 'right' })
    yPosition += 6

    if (invoice.taxAmount > 0) {
      pdf.text('Tax:', summaryX, yPosition)
      pdf.text(formatCurrency(invoice.taxAmount), pageWidth - 15, yPosition, { align: 'right' })
      yPosition += 6
    }

    if (invoice.discount > 0) {
      pdf.text('Discount:', summaryX, yPosition)
      pdf.text(`-${formatCurrency(invoice.discount)}`, pageWidth - 15, yPosition, { align: 'right' })
      yPosition += 6
    }

    // Total
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.setDrawColor(79, 70, 229)
    pdf.line(summaryX, yPosition - 2, pageWidth - 15, yPosition - 2)

    pdf.text('Total:', summaryX, yPosition + 5)
    pdf.text(formatCurrency(invoice.totalAmount), pageWidth - 15, yPosition + 5, { align: 'right' })

    // Notes
    if (invoice.notes) {
      yPosition += 15
      checkPageBreak(20)

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.text('Notes:', 15, yPosition)
      yPosition += 6

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      const noteLines = pdf.splitTextToSize(invoice.notes, pageWidth - 30)
      pdf.text(noteLines, 15, yPosition)
    }

    // Footer
    pdf.setFontSize(8)
    pdf.setTextColor(128, 128, 128)
    const footerY = pageHeight - 10
    pdf.text(
      `Generated on ${formatDate(new Date())} | ${invoice.invoiceNumber}`,
      pageWidth / 2,
      footerY,
      { align: 'center' }
    )

    // Save the PDF
    pdf.save(`${invoice.invoiceNumber}.pdf`)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
