/**
 * Individual Invoice API Routes
 * Handles GET, PUT, DELETE for specific invoices
 */

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { updateInvoiceSchema } from '@/lib/validations/invoice'
import { ZodError } from 'zod'

// GET /api/invoices/[id] - Get single invoice with details
export async function GET(
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

    // Fetch invoice with all related data
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        client: true,
        contract: true,
        items: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Calculate balance remaining
    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const balanceRemaining = Number(invoice.totalAmount) - totalPaid

    return NextResponse.json({
      data: {
        ...invoice,
        totalPaid,
        balanceRemaining,
      },
    })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

// PUT /api/invoices/[id] - Update invoice (draft only)
export async function PUT(
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
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Only allow editing draft invoices
    if (existingInvoice.status !== 'DRAFT') {
      return NextResponse.json(
        {
          error: 'Only draft invoices can be edited. Current status: ' +
            existingInvoice.status,
        },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateInvoiceSchema.parse(body)

    const {
      clientId,
      contractId,
      issueDate,
      dueDate,
      subtotal,
      taxAmount,
      discount,
      notes,
      status,
      items,
    } = validatedData

    // Verify client exists if updating
    if (clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          organizationId: user.organizationId,
        },
      })

      if (!client) {
        return NextResponse.json(
          { error: 'Client not found or does not belong to your organization' },
          { status: 404 }
        )
      }
    }

    // Verify contract exists if updating
    if (contractId) {
      const contract = await prisma.contract.findFirst({
        where: {
          id: contractId,
          organizationId: user.organizationId,
        },
      })

      if (!contract) {
        return NextResponse.json(
          { error: 'Contract not found or does not belong to your organization' },
          { status: 404 }
        )
      }
    }

    // Calculate new total if items provided
    let newTotal = Number(existingInvoice.totalAmount)
    if (items && items.length > 0) {
      const itemsTotal = items.reduce((sum, item) => {
        return sum + item.quantity * Number(item.unitPrice)
      }, 0)
      const finalSubtotal = itemsTotal
      const finalTaxAmount = taxAmount !== undefined ? Number(taxAmount) : Number(existingInvoice.taxAmount)
      const finalDiscount = discount !== undefined ? Number(discount) : Number(existingInvoice.discount)
      newTotal = finalSubtotal + finalTaxAmount - finalDiscount

      // Delete existing items and create new ones
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      })
    }

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...(clientId && { clientId }),
        ...(contractId !== undefined && { contractId: contractId || null }),
        ...(issueDate && { issueDate: new Date(issueDate) }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(subtotal !== undefined && { subtotal: Number(subtotal) }),
        ...(taxAmount !== undefined && { taxAmount: Number(taxAmount) }),
        ...(discount !== undefined && { discount: Number(discount) }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(status && { status }),
        ...(newTotal && { totalAmount: newTotal }),
        ...(items && items.length > 0 && {
          items: {
            create: items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              amount: item.quantity * Number(item.unitPrice),
            })),
          },
        }),
      },
      include: {
        items: true,
        client: {
          select: { id: true, name: true, email: true },
        },
        payments: true,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: 'UPDATE',
        resource: 'Invoice',
        resourceId: id,
        description: `Updated invoice ${updatedInvoice.invoiceNumber}`,
      },
    })

    return NextResponse.json({
      data: updatedInvoice,
      message: 'Invoice updated successfully',
    })
  } catch (error) {
    console.error('Error updating invoice:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

// DELETE /api/invoices/[id] - Delete invoice (draft only)
export async function DELETE(
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

    // Only allow deleting draft invoices
    if (invoice.status !== 'DRAFT') {
      return NextResponse.json(
        {
          error: 'Only draft invoices can be deleted. Current status: ' +
            invoice.status,
        },
        { status: 400 }
      )
    }

    // Delete invoice (cascade will delete items and payments)
    await prisma.invoice.delete({
      where: { id },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: 'DELETE',
        resource: 'Invoice',
        resourceId: id,
        description: `Deleted invoice ${invoice.invoiceNumber}`,
      },
    })

    return NextResponse.json({
      message: 'Invoice deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}
