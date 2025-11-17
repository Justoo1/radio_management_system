'use server'

/**
 * Financial Server Actions
 * Handles invoice, contract, and payment operations
 */

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  listInvoicesSchema,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
  type ListInvoicesInput,
} from '@/lib/validations/invoice'
import {
  createContractSchema,
  updateContractSchema,
  listContractsSchema,
  type CreateContractInput,
  type UpdateContractInput,
  type ListContractsInput,
} from '@/lib/validations/contract'
import {
  recordPaymentSchema,
  listPaymentsSchema,
  type RecordPaymentInput,
  type ListPaymentsInput,
} from '@/lib/validations/payment'
import { ZodError } from 'zod'

// Types for responses
export interface InvoiceResponse {
  id: string
  invoiceNumber: string
  clientId: string
  contractId: string | null
  issueDate: Date
  dueDate: Date
  subtotal: number
  taxAmount: number
  discount: number
  totalAmount: number
  status: string
  notes: string | null
  createdAt: Date
  updatedAt: Date
  client?: {
    id: string
    name: string
    email: string
  }
  items?: Array<{
    id: string
    description: string
    quantity: number
    unitPrice: number
    amount: number
  }>
  payments?: Array<{
    id: string
    amount: number
    paymentDate: Date
    paymentMethod: string
  }>
  contract?: {
    id: string
    contractNumber: string
    title: string
    value: number
  } | null
  totalPaid?: number
  balanceRemaining?: number
}

export interface InvoicesListResponse {
  data: InvoiceResponse[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasMore: boolean
  }
  summary: {
    totalInvoices: number
    totalAmount: number
    totalPaid: number
    totalOutstanding: number
    overdueCount: number
  }
}

// Helper function to convert Decimal objects to numbers
function convertDecimalToNumber(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj.toNumber === 'function') {
    return obj.toNumber()
  }

  if (Array.isArray(obj)) {
    return obj.map(convertDecimalToNumber)
  }

  if (typeof obj === 'object' && obj.constructor.name !== 'Date') {
    const converted: any = {}
    for (const key in obj) {
      converted[key] = convertDecimalToNumber(obj[key])
    }
    return converted
  }

  return obj
}

// Helper function to get user's organization
async function getUserOrganization() {
  const session = await auth()

  if (!session || !session.user?.email) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { organization: true },
  })

  if (!user || !user.organizationId) {
    throw new Error('User or organization not found')
  }

  return { user, organizationId: user.organizationId }
}

/**
 * Fetch invoices with filtering and pagination
 */
export async function fetchInvoices(
  params: ListInvoicesInput
): Promise<InvoicesListResponse> {
  try {
    const { user, organizationId } = await getUserOrganization()

    // Validate parameters
    const validatedParams = listInvoicesSchema.parse(params)

    const { page, pageSize, status, clientId, search, startDate, endDate, minAmount, maxAmount } =
      validatedParams

    // Build where clause
    const where: any = {
      organizationId,
    }

    if (status) {
      where.status = status
    }

    if (clientId) {
      where.clientId = clientId
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (startDate || endDate) {
      where.issueDate = {}
      if (startDate) where.issueDate.gte = new Date(startDate)
      if (endDate) where.issueDate.lte = new Date(endDate)
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.totalAmount = {}
      if (minAmount !== undefined) where.totalAmount.gte = minAmount
      if (maxAmount !== undefined) where.totalAmount.lte = maxAmount
    }

    // Get total count
    const total = await prisma.invoice.count({ where })

    // Fetch invoices
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        items: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    // Calculate balance for each invoice
    const invoicesWithBalance = invoices.map((invoice) => {
      const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
      const balanceRemaining = Number(invoice.totalAmount) - totalPaid

      return convertDecimalToNumber({
        ...invoice,
        totalPaid,
        balanceRemaining,
      })
    }) as InvoiceResponse[]

    // Calculate summary
    const allInvoices = await prisma.invoice.findMany({
      where,
      include: {
        payments: true,
      },
    })

    const today = new Date()
    const overdueInvoices = allInvoices.filter(
      (inv) =>
        inv.status !== 'PAID' &&
        inv.status !== 'CANCELLED' &&
        new Date(inv.dueDate) < today
    )

    const summary = {
      totalInvoices: total,
      totalAmount: allInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0),
      totalPaid: allInvoices.reduce(
        (sum, inv) => sum + inv.payments.reduce((s, p) => s + Number(p.amount), 0),
        0
      ),
      totalOutstanding: allInvoices.reduce((sum, inv) => {
        const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0)
        return sum + (Number(inv.totalAmount) - paid)
      }, 0),
      overdueCount: overdueInvoices.length,
    }

    const totalPages = Math.ceil(total / pageSize)

    return {
      data: invoicesWithBalance,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
      summary,
    }
  } catch (error) {
    console.error('Error fetching invoices:', error)
    if (error instanceof ZodError) {
      throw new Error(`Validation error: ${error.issues[0].message}`)
    }
    throw error
  }
}

/**
 * Fetch a single invoice with all details
 */
export async function fetchInvoiceDetails(invoiceId: string): Promise<InvoiceResponse> {
  try {
    const { organizationId } = await getUserOrganization()

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        organizationId,
      },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        contract: true,
        items: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const balanceRemaining = Number(invoice.totalAmount) - totalPaid

    return convertDecimalToNumber({
      ...invoice,
      totalPaid,
      balanceRemaining,
    }) as InvoiceResponse
  } catch (error) {
    console.error('Error fetching invoice details:', error)
    throw error
  }
}

/**
 * Create a new invoice
 */
export async function createInvoice(
  data: CreateInvoiceInput
): Promise<InvoiceResponse> {
  try {
    const { user, organizationId } = await getUserOrganization()

    // Validate input
    const validatedData = createInvoiceSchema.parse(data)

    const {
      clientId,
      contractId,
      issueDate,
      dueDate,
      subtotal,
      taxAmount,
      discount,
      notes,
      items,
    } = validatedData

    // Verify client exists and belongs to organization
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId,
      },
    })

    if (!client) {
      throw new Error('Client not found or does not belong to your organization')
    }

    // Verify contract if provided
    if (contractId) {
      const contract = await prisma.contract.findFirst({
        where: {
          id: contractId,
          organizationId,
        },
      })

      if (!contract) {
        throw new Error('Contract not found or does not belong to your organization')
      }
    }

    // Generate invoice number
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const invoiceCount = await prisma.invoice.count({
      where: {
        organizationId,
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        },
      },
    })
    const invoiceNumber = `INV-${dateStr}-${String(invoiceCount + 1).padStart(4, '0')}`

    // Calculate totals
    const itemsTotal = items.reduce((sum, item) => {
      return sum + item.quantity * Number(item.unitPrice)
    }, 0)
    const finalSubtotal = itemsTotal
    const finalTaxAmount = Number(taxAmount)
    const finalDiscount = Number(discount)
    const totalAmount = finalSubtotal + finalTaxAmount - finalDiscount

    // Create invoice with items in a transaction
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        organizationId,
        clientId,
        contractId: contractId || null,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        subtotal: finalSubtotal,
        taxAmount: finalTaxAmount,
        discount: finalDiscount,
        totalAmount,
        status: 'DRAFT',
        notes: notes || null,
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            amount: item.quantity * Number(item.unitPrice),
          })),
        },
      },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        items: true,
        payments: true,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: user.id,
        action: 'CREATE',
        resource: 'Invoice',
        resourceId: invoice.id,
        description: `Created invoice ${invoice.invoiceNumber}`,
      },
    })

    return convertDecimalToNumber({
      ...invoice,
      totalPaid: 0,
      balanceRemaining: totalAmount,
    }) as InvoiceResponse
  } catch (error) {
    console.error('Error creating invoice:', error)
    if (error instanceof ZodError) {
      throw new Error(`Validation error: ${error.issues[0].message}`)
    }
    throw error
  }
}

/**
 * Update an existing invoice
 */
export async function updateInvoice(
  invoiceId: string,
  data: UpdateInvoiceInput
): Promise<InvoiceResponse> {
  try {
    const { user, organizationId } = await getUserOrganization()

    // Validate input
    const validatedData = updateInvoiceSchema.parse(data)

    // Verify invoice exists and belongs to organization
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        organizationId,
      },
    })

    if (!existingInvoice) {
      throw new Error('Invoice not found')
    }

    // Only allow editing draft invoices
    if (existingInvoice.status !== 'DRAFT') {
      throw new Error(
        `Only draft invoices can be edited. Current status: ${existingInvoice.status}`
      )
    }

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
          organizationId,
        },
      })

      if (!client) {
        throw new Error('Client not found or does not belong to your organization')
      }
    }

    // Verify contract exists if updating
    if (contractId) {
      const contract = await prisma.contract.findFirst({
        where: {
          id: contractId,
          organizationId,
        },
      })

      if (!contract) {
        throw new Error('Contract not found or does not belong to your organization')
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
        where: { invoiceId: invoiceId },
      })
    }

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
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
        client: {
          select: { id: true, name: true, email: true },
        },
        items: true,
        payments: true,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: user.id,
        action: 'UPDATE',
        resource: 'Invoice',
        resourceId: invoiceId,
        description: `Updated invoice ${updatedInvoice.invoiceNumber}`,
      },
    })

    const totalPaid = updatedInvoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const balanceRemaining = Number(updatedInvoice.totalAmount) - totalPaid

    return convertDecimalToNumber({
      ...updatedInvoice,
      totalPaid,
      balanceRemaining,
    }) as InvoiceResponse
  } catch (error) {
    console.error('Error updating invoice:', error)
    if (error instanceof ZodError) {
      throw new Error(`Validation error: ${error.issues[0].message}`)
    }
    throw error
  }
}

/**
 * Delete an invoice
 */
export async function deleteInvoice(invoiceId: string): Promise<{ message: string }> {
  try {
    const { user, organizationId } = await getUserOrganization()

    // Verify invoice exists and belongs to organization
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        organizationId,
      },
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    // Only allow deleting draft invoices
    if (invoice.status !== 'DRAFT') {
      throw new Error(
        `Only draft invoices can be deleted. Current status: ${invoice.status}`
      )
    }

    // Delete invoice (cascade will delete items and payments)
    await prisma.invoice.delete({
      where: { id: invoiceId },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: user.id,
        action: 'DELETE',
        resource: 'Invoice',
        resourceId: invoiceId,
        description: `Deleted invoice ${invoice.invoiceNumber}`,
      },
    })

    return { message: 'Invoice deleted successfully' }
  } catch (error) {
    console.error('Error deleting invoice:', error)
    throw error
  }
}

/**
 * Record a payment against an invoice
 */
export async function recordPayment(
  invoiceId: string,
  data: Omit<RecordPaymentInput, 'invoiceId'>
): Promise<{
  payment: any
  invoice: InvoiceResponse
  message: string
}> {
  try {
    const { user, organizationId } = await getUserOrganization()

    // Validate input
    const validatedData = recordPaymentSchema.parse({
      invoiceId,
      ...data,
    })

    // Verify invoice exists and belongs to organization
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        organizationId,
      },
      include: {
        payments: true,
      },
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    const { amount, paymentDate, paymentMethod, referenceNumber, notes } = validatedData

    // Calculate current balance
    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const balanceRemaining = Number(invoice.totalAmount) - totalPaid

    // Verify payment amount doesn't exceed remaining balance
    if (amount > balanceRemaining) {
      throw new Error(
        `Payment amount exceeds remaining balance. Remaining balance: ${balanceRemaining}`
      )
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId,
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
      where: { id: invoiceId },
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
        organizationId,
        userId: user.id,
        action: 'CREATE',
        resource: 'Payment',
        resourceId: payment.id,
        description: `Recorded payment of ${amount} for invoice ${invoice.invoiceNumber}`,
      },
    })

    const convertedInvoice = convertDecimalToNumber({
      ...updatedInvoice,
      totalPaid: newTotalPaid,
      balanceRemaining: newBalanceRemaining,
    })

    return {
      payment,
      invoice: {
        ...convertedInvoice,
        subtotal: Number(convertedInvoice.subtotal),
        taxAmount: Number(convertedInvoice.taxAmount),
        discount: Number(convertedInvoice.discount),
        totalAmount: Number(convertedInvoice.totalAmount),
      } as InvoiceResponse,
      message: 'Payment recorded successfully',
    }
  } catch (error) {
    console.error('Error recording payment:', error)
    if (error instanceof ZodError) {
      throw new Error(`Validation error: ${error.issues[0].message}`)
    }
    throw error
  }
}

/**
 * Fetch payments for an invoice
 */
export async function fetchInvoicePayments(
  invoiceId: string,
  params: ListPaymentsInput
): Promise<{
  invoiceId: string
  invoiceNumber: string
  invoiceTotal: number
  payments: any[]
  summary: {
    totalPaid: number
    balanceRemaining: number
    paymentCount: number
  }
}> {
  try {
    const { organizationId } = await getUserOrganization()

    // Validate parameters
    const validatedParams = listPaymentsSchema.parse(params)

    // Verify invoice exists and belongs to organization
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        organizationId,
      },
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    const { page, pageSize } = validatedParams

    // Fetch payments for the invoice
    const payments = await prisma.payment.findMany({
      where: {
        invoiceId,
      },
      orderBy: {
        paymentDate: 'desc',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    // Get all payments for totals
    const allPayments = await prisma.payment.findMany({
      where: {
        invoiceId,
      },
    })

    // Calculate totals
    const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    const balanceRemaining = Number(invoice.totalAmount) - totalPaid

    return {
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      invoiceTotal: Number(invoice.totalAmount),
      payments,
      summary: {
        totalPaid,
        balanceRemaining,
        paymentCount: allPayments.length,
      },
    }
  } catch (error) {
    console.error('Error fetching invoice payments:', error)
    if (error instanceof ZodError) {
      throw new Error(`Validation error: ${error.issues[0].message}`)
    }
    throw error
  }
}
