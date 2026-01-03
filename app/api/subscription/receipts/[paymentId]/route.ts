/**
 * Subscription Receipt Download API
 * Generate and download receipt PDF for a subscription payment
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { generateInvoicePDF, generateInvoiceNumber } from '@/lib/invoice-generator'
import { auth } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params

    // Check authentication - either user session or developer access
    const cookieStore = await cookies()
    const session = await auth()
    const devAccessToken = cookieStore.get('dev_access_token')

    const isAdmin = devAccessToken && devAccessToken.value
    const userId = session?.user?.id

    if (!isAdmin && !userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    // Get payment with related data
    const payment = await prisma.subscriptionPayment.findUnique({
      where: { id: paymentId },
      include: {
        subscription: {
          include: {
            plan: true,
            organization: {
              select: {
                id: true,
                name: true,
                email: true,
                ownerId: true,
              },
            },
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Authorization check - ensure user owns the organization (unless admin)
    if (!isAdmin) {
      if (payment.subscription.organization?.ownerId !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized - You do not have access to this receipt' },
          { status: 403 }
        )
      }
    }

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber(payment.id, payment.createdAt)

    // Prepare invoice data
    const invoiceData = {
      invoiceNumber,
      invoiceDate: payment.createdAt,
      organizationName: payment.subscription.organization?.name || 'Unknown Organization',
      organizationEmail: payment.subscription.organization?.email || '',
      planName: payment.subscription.plan.name,
      amount: parseFloat(payment.amount.toString()),
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.providerPaymentId || undefined,
      network: payment.network || undefined,
      mobileNumber: payment.mobileNumber || undefined,
      paymentDate: payment.createdAt,
      currentPeriodStart: payment.subscription.currentPeriodStart,
      currentPeriodEnd: payment.subscription.currentPeriodEnd,
    }

    // Generate PDF
    const pdf = generateInvoicePDF(invoiceData)

    // Convert to buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error generating receipt:', error)
    return NextResponse.json(
      { error: 'Failed to generate receipt' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
