/**
 * PDF Export Utility
 * Generates PDF reports using jsPDF
 */

import jsPDF from 'jspdf'
import { formatCurrency } from './currency'

interface PLReportData {
  period: { startDate: string; endDate: string }
  currency?: string
  organizationName?: string
  revenue: { invoices: number; total: number }
  expenses: { total: number; [key: string]: number }
  profit: { gross: number; net: number }
  margins: { gross: number; operating: number; net: number }
  breakdown: Array<{ date: string; revenue: number; expenses: number; profit: number }>
}

export function generatePLPDF(report: PLReportData, organizationName?: string) {
  const orgName = report.organizationName || organizationName || 'Radio Station'
  const currency = report.currency || 'GHS'
  const doc = new jsPDF()

  // Set font
  doc.setFont('helvetica')

  // Header
  doc.setFontSize(20)
  doc.setTextColor(59, 130, 246) // Blue color
  doc.text(orgName, 20, 20)

  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('Profit & Loss Statement', 20, 30)

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  const startDate = new Date(report.period.startDate).toLocaleDateString()
  const endDate = new Date(report.period.endDate).toLocaleDateString()
  doc.text(`Period: ${startDate} - ${endDate}`, 20, 38)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 44)

  // Summary Section
  let yPos = 55
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text('Financial Summary', 20, yPos)

  yPos += 10
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  // Summary boxes
  const boxWidth = 55
  const boxHeight = 30
  const gap = 10

  // Total Revenue Box
  doc.setFillColor(219, 234, 254) // Light blue
  doc.rect(20, yPos, boxWidth, boxHeight, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Total Revenue', 25, yPos + 8)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(formatCurrency(report.revenue.total, currency, { forPDF: true }), 25, yPos + 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text('From invoices', 25, yPos + 25)

  // Total Expenses Box
  doc.setTextColor(0, 0, 0)
  doc.setFillColor(254, 226, 226) // Light red
  doc.rect(20 + boxWidth + gap, yPos, boxWidth, boxHeight, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Total Expenses', 25 + boxWidth + gap, yPos + 8)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(formatCurrency(report.expenses.total, currency, { forPDF: true }), 25 + boxWidth + gap, yPos + 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text('Operating costs', 25 + boxWidth + gap, yPos + 25)

  // Net Profit Box
  doc.setTextColor(0, 0, 0)
  const profitColor = report.profit.net >= 0 ? [209, 250, 229] : [254, 226, 226] // Green or Red
  doc.setFillColor(profitColor[0], profitColor[1], profitColor[2])
  doc.rect(20 + (boxWidth + gap) * 2, yPos, boxWidth, boxHeight, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Net Profit', 25 + (boxWidth + gap) * 2, yPos + 8)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(report.profit.net >= 0 ? 34 : 220, report.profit.net >= 0 ? 197 : 38, report.profit.net >= 0 ? 94 : 38)
  doc.text(formatCurrency(report.profit.net, currency, { forPDF: true }), 25 + (boxWidth + gap) * 2, yPos + 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`${report.margins.net.toFixed(1)}% margin`, 25 + (boxWidth + gap) * 2, yPos + 25)

  yPos += boxHeight + 15

  // P&L Statement Table
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Profit & Loss Statement', 20, yPos)

  yPos += 10

  // Table header
  doc.setFillColor(229, 231, 235) // Gray
  doc.rect(20, yPos, 170, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Description', 22, yPos + 6)
  doc.text('Amount', 160, yPos + 6, { align: 'right' })

  yPos += 12

  // Revenue Section
  doc.setFillColor(219, 234, 254) // Light blue
  doc.rect(20, yPos, 170, 6, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('REVENUE', 22, yPos + 4)
  yPos += 8

  doc.setFont('helvetica', 'normal')
  doc.text('Invoice Revenue', 22, yPos + 4)
  doc.text(formatCurrency(report.revenue.invoices, currency, { forPDF: true }), 188, yPos + 4, { align: 'right' })
  yPos += 6

  doc.setFont('helvetica', 'bold')
  doc.setFillColor(229, 231, 235)
  doc.rect(20, yPos, 170, 6, 'F')
  doc.text('Total Revenue', 22, yPos + 4)
  doc.text(formatCurrency(report.revenue.total, currency, { forPDF: true }), 188, yPos + 4, { align: 'right' })
  yPos += 10

  // Expenses Section
  doc.setFillColor(254, 226, 226) // Light red
  doc.rect(20, yPos, 170, 6, 'F')
  doc.setFont('helvetica', 'bold')
  doc.text('EXPENSES', 22, yPos + 4)
  yPos += 8

  doc.setFont('helvetica', 'normal')
  doc.text('Total Expenses', 22, yPos + 4)
  doc.text(formatCurrency(report.expenses.total, currency, { forPDF: true }), 188, yPos + 4, { align: 'right' })
  yPos += 6

  doc.setFont('helvetica', 'bold')
  doc.setFillColor(229, 231, 235)
  doc.rect(20, yPos, 170, 6, 'F')
  doc.text('Gross Profit', 22, yPos + 4)
  doc.text(formatCurrency(report.profit.gross, currency, { forPDF: true }), 188, yPos + 4, { align: 'right' })
  yPos += 10

  // Net Income
  const netColor = report.profit.net >= 0 ? [209, 250, 229] : [254, 226, 226]
  doc.setFillColor(netColor[0], netColor[1], netColor[2])
  doc.rect(20, yPos, 170, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(report.profit.net >= 0 ? 34 : 220, report.profit.net >= 0 ? 197 : 38, report.profit.net >= 0 ? 94 : 38)
  doc.text('Net Income', 22, yPos + 6)
  doc.text(formatCurrency(report.profit.net, currency, { forPDF: true }), 188, yPos + 6, { align: 'right' })

  yPos += 15

  // Check if we need a new page
  if (yPos > 250) {
    doc.addPage()
    yPos = 20
  }

  // Margins Section
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Margin Analysis', 20, yPos)
  yPos += 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Gross Profit Margin: ${report.margins.gross.toFixed(1)}%`, 22, yPos)
  yPos += 6
  doc.text(`Operating Profit Margin: ${report.margins.operating.toFixed(1)}%`, 22, yPos)
  yPos += 6
  doc.text(`Net Profit Margin: ${report.margins.net.toFixed(1)}%`, 22, yPos)

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('Generated by Radio Management System', 105, 285, { align: 'center' })
  doc.text(`Page 1 of ${doc.getNumberOfPages()}`, 105, 290, { align: 'center' })

  // Download the PDF
  const fileName = `PL_Report_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}

// Generic function for other reports
export function generateReportPDF(
  title: string,
  data: any,
  organizationName: string = 'Radio Station'
) {
  const doc = new jsPDF()

  doc.setFont('helvetica')
  doc.setFontSize(20)
  doc.setTextColor(59, 130, 246)
  doc.text(organizationName, 20, 20)

  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text(title, 20, 30)

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 38)

  // Add data as JSON (basic implementation)
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.text(JSON.stringify(data, null, 2), 20, 50, { maxWidth: 170 })

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('Generated by Radio Management System', 105, 285, { align: 'center' })

  const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}
