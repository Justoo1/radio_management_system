/**
 * Invoice PDF Download Endpoint
 * Generates and returns invoice PDF
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import jsPDF from 'jspdf'

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user and organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true },
    })

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: 'User or organization not found' },
        { status: 404 }
      )
    }

    // Fetch invoice with all details
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        items: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Generate PDF
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
    pdf.setFont('helvetica', 'bold')
    pdf.text('INVOICE', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    // Invoice Details
    pdf.setFontSize(11)
    pdf.setTextColor(0, 0, 0)
    pdf.setFont('helvetica', 'normal')
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
    pdf.text(invoice.client?.name || 'Unknown', 15, yPosition)
    yPosition += 5
    if (invoice.client?.email) {
      pdf.text(invoice.client.email, 15, yPosition)
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
        formatCurrency(Number(item.unitPrice)),
        startX + colWidths[0] + colWidths[1] + 2,
        yPosition,
        { align: 'right' }
      )
      pdf.text(
        formatCurrency(Number(item.amount)),
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
    pdf.text(formatCurrency(Number(invoice.subtotal)), pageWidth - 15, yPosition, { align: 'right' })
    yPosition += 6

    if (Number(invoice.taxAmount) > 0) {
      pdf.text('Tax:', summaryX, yPosition)
      pdf.text(formatCurrency(Number(invoice.taxAmount)), pageWidth - 15, yPosition, { align: 'right' })
      yPosition += 6
    }

    if (Number(invoice.discount) > 0) {
      pdf.text('Discount:', summaryX, yPosition)
      pdf.text(
        `-${formatCurrency(Number(invoice.discount))}`,
        pageWidth - 15,
        yPosition,
        { align: 'right' }
      )
      yPosition += 6
    }

    // Total
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.setDrawColor(79, 70, 229)
    pdf.line(summaryX, yPosition - 2, pageWidth - 15, yPosition - 2)

    pdf.text('Total:', summaryX, yPosition + 5)
    pdf.text(formatCurrency(Number(invoice.totalAmount)), pageWidth - 15, yPosition + 5, {
      align: 'right',
    })

    // Payment Information
    yPosition += 10
    checkPageBreak(30)

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.setTextColor(0, 0, 0)
    pdf.text('Payment Information', 15, yPosition)
    yPosition += 7

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)

    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const balanceRemaining = Number(invoice.totalAmount) - totalPaid

    // Use same positioning as summary section to avoid overlapping
    pdf.text('Amount Paid:', summaryX, yPosition)
    pdf.text(formatCurrency(totalPaid), pageWidth - 15, yPosition, { align: 'right' })
    yPosition += 6

    pdf.text('Outstanding Balance:', summaryX, yPosition)
    pdf.text(formatCurrency(balanceRemaining), pageWidth - 15, yPosition, { align: 'right' })
    yPosition += 8

    // Recent payments
    if (invoice.payments.length > 0) {
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.text('Recent Payments:', 15, yPosition)
      yPosition += 5

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)

      invoice.payments.slice(0, 5).forEach((payment) => {
        checkPageBreak(8)
        pdf.text(`${formatDate(payment.paymentDate)}:`, 20, yPosition)
        pdf.text(formatCurrency(Number(payment.amount)), pageWidth - 15, yPosition, { align: 'right' })
        yPosition += 5
      })
    }

    // Notes
    if (invoice.notes) {
      yPosition += 5
      checkPageBreak(20)

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.text('Notes:', 15, yPosition)
      yPosition += 6

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      const noteLines = pdf.splitTextToSize(invoice.notes, pageWidth - 30)
      pdf.text(noteLines as string[], 15, yPosition)
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

    // Get PDF as bytes
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
