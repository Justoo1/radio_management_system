/**
 * Invoice API Routes
 * Handles GET (list) and POST (create) for invoices
 * OPTIMIZED: Reduced from 7 queries to 3 queries
 */

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { createInvoiceSchema, listInvoicesSchema } from '@/lib/validations/invoice'
import { ZodError } from 'zod'

// GET /api/invoices - List invoices with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // OPTIMIZED: Use organizationId from session directly (no extra user query)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = session.user.organizationId

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
      status: searchParams.get('status'),
      clientId: searchParams.get('clientId'),
      search: searchParams.get('search'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      minAmount: searchParams.get('minAmount'),
      maxAmount: searchParams.get('maxAmount'),
    }

    const validatedParams = listInvoicesSchema.parse(queryParams)
    const { page, pageSize, status, clientId, search, startDate, endDate, minAmount, maxAmount } =
      validatedParams

    // Build where conditions
    const whereConditions: any = {
      organizationId,
    }

    if (status) whereConditions.status = status
    if (clientId) whereConditions.clientId = clientId
    if (startDate) whereConditions.issueDate = { gte: startDate }
    if (endDate) {
      whereConditions.issueDate = {
        ...whereConditions.issueDate,
        lte: endDate,
      }
    }
    if (minAmount !== undefined || maxAmount !== undefined) {
      whereConditions.totalAmount = {}
      if (minAmount !== undefined) whereConditions.totalAmount.gte = minAmount
      if (maxAmount !== undefined) whereConditions.totalAmount.lte = maxAmount
    }

    // Add search condition for invoice number or client name
    if (search) {
      whereConditions.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // OPTIMIZED: Run all queries in parallel (3 queries instead of 7)
    const [invoices, total, summaryData] = await Promise.all([
      // Query 1: Fetch invoices with client info
      prisma.invoice.findMany({
        where: whereConditions,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),

      // Query 2: Get total count for pagination
      prisma.invoice.count({
        where: whereConditions,
      }),

      // Query 3: Get all summary data in a single aggregation
      // Using raw query to combine multiple aggregates
      prisma.$queryRaw<[{ total_amount: bigint | null; paid_amount: bigint | null; overdue_count: bigint }]>`
        SELECT
          (SELECT COALESCE(SUM("totalAmount"), 0) FROM "Invoice" WHERE "organizationId" = ${organizationId}) as total_amount,
          (SELECT COALESCE(SUM(p.amount), 0) FROM "Payment" p INNER JOIN "Invoice" i ON p."invoiceId" = i.id WHERE i."organizationId" = ${organizationId}) as paid_amount,
          (SELECT COUNT(*) FROM "Invoice" WHERE "organizationId" = ${organizationId} AND status = 'OVERDUE') as overdue_count
      `,
    ])

    const summary = summaryData[0]
    const totalInvoicesAmount = summary ? Number(summary.total_amount ?? 0) : 0
    const totalPaidAmount = summary ? Number(summary.paid_amount ?? 0) : 0
    const overdueCount = summary ? Number(summary.overdue_count ?? 0) : 0

    return NextResponse.json({
      data: invoices.map((invoice) => {
        const invoiceTotal = Number(invoice.totalAmount)
        const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0) || 0
        return {
          ...invoice,
          totalAmount: invoiceTotal,
          balanceRemaining: invoiceTotal - paid,
        }
      }),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      summary: {
        totalInvoices: totalInvoicesAmount,
        totalPaid: totalPaidAmount,
        totalOutstanding: totalInvoicesAmount - totalPaidAmount,
        overdueCount,
      },
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

// POST /api/invoices - Create new invoice
// OPTIMIZED: Removed redundant user query
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // OPTIMIZED: Use organizationId from session directly
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = session.user.organizationId
    const userId = session.user.id

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createInvoiceSchema.parse(body)

    const {
      clientId,
      contractId,
      issueDate,
      dueDate,
      taxAmount = 0,
      discount = 0,
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
      return NextResponse.json(
        { error: 'Client not found or does not belong to your organization' },
        { status: 404 }
      )
    }

    // Verify contract exists if provided
    if (contractId) {
      const contract = await prisma.contract.findFirst({
        where: {
          id: contractId,
          organizationId,
        },
      })

      if (!contract) {
        return NextResponse.json(
          { error: 'Contract not found or does not belong to your organization' },
          { status: 404 }
        )
      }
    }

    // Calculate total amount
    const itemsTotal = items.reduce((sum, item) => {
      return sum + item.quantity * Number(item.unitPrice)
    }, 0)

    // Recalculate totals with tax and discount
    const finalSubtotal = itemsTotal
    const finalTotal = finalSubtotal + Number(taxAmount) - Number(discount)

    // Generate invoice number (format: INV-YYYYMMDD-XXXX)
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const randomStr = Math.random().toString().slice(2, 6)
    const invoiceNumber = `INV-${dateStr}-${randomStr}`

    // Create invoice with items in transaction
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        organizationId,
        clientId,
        contractId: contractId || null,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        subtotal: finalSubtotal,
        taxAmount: taxAmount ? Number(taxAmount) : 0,
        discount: discount ? Number(discount) : 0,
        totalAmount: finalTotal,
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
        items: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        action: 'CREATE',
        resource: 'Invoice',
        resourceId: invoice.id,
        description: `Created invoice ${invoice.invoiceNumber} for client ${client.name}`,
      },
    })

    return NextResponse.json(
      {
        data: invoice,
        message: 'Invoice created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating invoice:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
