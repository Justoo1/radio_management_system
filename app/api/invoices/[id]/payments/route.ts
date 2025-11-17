/**
 * Invoice Payment Recording API
 * Handles recording payments against invoices
 */

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { recordPaymentSchema } from '@/lib/validations/payment'
import { ZodError } from 'zod'

// POST /api/invoices/[id]/payments - Record a payment against an invoice
export async function POST(
  request: NextRequest,
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

    // Verify invoice exists and belongs to organization
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        payments: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = recordPaymentSchema.parse(body)

    const { amount, paymentDate, paymentMethod, referenceNumber, notes } =
      validatedData

    // Calculate current balance
    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const balanceRemaining = Number(invoice.totalAmount) - totalPaid

    // Verify payment amount doesn't exceed remaining balance
    if (amount > balanceRemaining) {
      return NextResponse.json(
        {
          error: `Payment amount exceeds remaining balance. Remaining balance: ${balanceRemaining}`,
          remainingBalance: balanceRemaining,
        },
        { status: 400 }
      )
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId: id,
        amount: Number(amount),
        paymentDate: new Date(paymentDate),
        paymentMethod,
        referenceNumber: referenceNumber || null,
        notes: notes || null,
      },
    })

    // Calculate new balance after payment
    const newTotalPaid = totalPaid + amount
    const newBalanceRemaining = Number(invoice.totalAmount) - newTotalPaid

    // Update invoice status based on payment
    let newStatus = invoice.status
    if (newBalanceRemaining === 0) {
      newStatus = 'PAID'
    } else if (invoice.status === 'DRAFT') {
      newStatus = 'SENT'
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: newStatus,
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

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: 'CREATE',
        resource: 'Payment',
        resourceId: payment.id,
        description: `Recorded payment of ${amount} for invoice ${invoice.invoiceNumber}`,
      },
    })

    return NextResponse.json(
      {
        data: {
          payment,
          invoice: {
            ...updatedInvoice,
            totalPaid: newTotalPaid,
            balanceRemaining: newBalanceRemaining,
          },
        },
        message: 'Payment recorded successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error recording payment:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    )
  }
}

// GET /api/invoices/[id]/payments - Get all payments for an invoice
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

    // Verify invoice exists and belongs to organization
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Fetch all payments for the invoice
    const payments = await prisma.payment.findMany({
      where: {
        invoiceId: id,
      },
      orderBy: {
        paymentDate: 'desc',
      },
    })

    // Calculate totals
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const balanceRemaining = Number(invoice.totalAmount) - totalPaid

    return NextResponse.json({
      data: {
        invoiceId: id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceTotal: invoice.totalAmount,
        payments,
        summary: {
          totalPaid,
          balanceRemaining,
          paymentCount: payments.length,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}
