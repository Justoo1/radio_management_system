/**
 * Invoice/Receipt Generator
 * Generates PDF invoices for subscription payments
 */

import { jsPDF } from 'jspdf'

interface InvoiceData {
  invoiceNumber: string
  invoiceDate: Date
  organizationName: string
  organizationEmail: string
  organizationAddress?: string
  planName: string
  amount: number
  currency: string
  paymentMethod: string
  referenceNumber?: string
  network?: string
  mobileNumber?: string
  paymentDate: Date
  currentPeriodStart: Date
  currentPeriodEnd: Date
}

/**
 * Generate invoice number from payment ID and date
 */
export function generateInvoiceNumber(paymentId: string, date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const shortId = paymentId.substring(0, 8).toUpperCase()
  return `INV-${year}${month}-${shortId}`
}

/**
 * Generate PDF invoice
 */
export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF()

  // Colors
  const primaryColor = '#4F46E5' // Indigo
  const darkColor = '#1E293B'
  const lightColor = '#64748B'

  // Header - Company Info
  doc.setFillColor(79, 70, 229) // Indigo
  doc.rect(0, 0, 210, 40, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('RADIO MANAGEMENT SYSTEM', 20, 20)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Subscription Payment Receipt', 20, 28)

  // Invoice Details - Right Side
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`Invoice: ${data.invoiceNumber}`, 140, 20)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date: ${formatDate(data.invoiceDate)}`, 140, 28)

  // Bill To Section
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('BILL TO:', 20, 55)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(data.organizationName, 20, 63)

  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text(data.organizationEmail, 20, 70)

  if (data.organizationAddress) {
    doc.text(data.organizationAddress, 20, 77)
  }

  // Payment Details Section
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYMENT DETAILS:', 20, 95)

  // Table Header
  doc.setFillColor(241, 245, 249) // Light gray
  doc.rect(20, 100, 170, 10, 'F')

  doc.setTextColor(30, 41, 59)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Description', 25, 106)
  doc.text('Period', 110, 106)
  doc.text('Amount', 160, 106)

  // Table Content
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(30, 41, 59)

  const planDescription = `${data.planName} Plan - Monthly Subscription`
  doc.text(planDescription, 25, 116)

  const periodText = `${formatDate(data.currentPeriodStart)} - ${formatDate(data.currentPeriodEnd)}`
  doc.text(periodText, 110, 116)

  doc.text(`${data.currency} ${data.amount.toFixed(2)}`, 160, 116)

  // Divider Line
  doc.setDrawColor(226, 232, 240)
  doc.line(20, 122, 190, 122)

  // Subtotal and Total
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text('Subtotal:', 130, 132)
  doc.text(`${data.currency} ${data.amount.toFixed(2)}`, 160, 132)

  doc.text('Tax (0%):', 130, 140)
  doc.text(`${data.currency} 0.00`, 160, 140)

  // Total - Highlighted
  doc.setFillColor(241, 245, 249)
  doc.rect(125, 145, 65, 12, 'F')

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('TOTAL:', 130, 153)
  doc.text(`${data.currency} ${data.amount.toFixed(2)}`, 160, 153)

  // Payment Information
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('PAYMENT INFORMATION:', 20, 175)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)

  let yPos = 183
  doc.text(`Payment Date: ${formatDate(data.paymentDate)}`, 20, yPos)

  yPos += 7
  doc.text(`Payment Method: ${formatPaymentMethod(data.paymentMethod)}`, 20, yPos)

  if (data.network) {
    yPos += 7
    doc.text(`Network: ${data.network}`, 20, yPos)
  }

  if (data.mobileNumber) {
    yPos += 7
    doc.text(`Mobile Number: ${data.mobileNumber}`, 20, yPos)
  }

  if (data.referenceNumber) {
    yPos += 7
    doc.text(`Reference Number: ${data.referenceNumber}`, 20, yPos)
  }

  yPos += 7
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(34, 197, 94) // Green
  doc.text('Status: PAID', 20, yPos)

  // Footer
  doc.setDrawColor(226, 232, 240)
  doc.line(20, 260, 190, 260)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('Thank you for your business!', 105, 270, { align: 'center' })

  doc.setFontSize(8)
  doc.text('This is a computer-generated receipt and does not require a signature.', 105, 277, { align: 'center' })

  doc.setTextColor(79, 70, 229)
  doc.text('support@radiomanagement.com | www.radiomanagement.com', 105, 284, { align: 'center' })

  return doc
}

/**
 * Format date to readable string
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Format payment method for display
 */
function formatPaymentMethod(method: string): string {
  const methodMap: Record<string, string> = {
    MOBILE_MONEY: 'Mobile Money',
    BANK_TRANSFER: 'Bank Transfer',
    CARD: 'Card Payment',
    CASH: 'Cash',
  }
  return methodMap[method] || method
}
