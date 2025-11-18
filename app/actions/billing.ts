'use server'

/**
 * Billing Management Server Actions
 * Handles subscription, payment methods, and invoice operations
 */

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ZodError } from 'zod'
import {
  addPaymentMethodSchema,
  updateBillingAddressSchema,
  changePlanSchema,
  cancelSubscriptionSchema,
  invoiceFilterSchema,
  type AddPaymentMethodInput,
  type UpdateBillingAddressInput,
  type ChangePlanInput,
  type CancelSubscriptionInput,
  type InvoiceFilterInput,
} from '@/lib/validations/billing'

// Response Types
export interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
  createdAt: Date
}

export interface Invoice {
  id: string
  invoiceNumber: string
  issueDate: Date
  dueDate: Date
  totalAmount: number
  status: string
  client?: {
    name: string
  }
}

export interface SubscriptionInfo {
  id: string
  plan: {
    name: string
    price: number
    currency: string
    billingInterval: string
  }
  status: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelledAt?: Date
}

export interface BillingAddress {
  fullName: string
  email: string
  address: string
  city: string
  country: string
  zipCode?: string
  phone?: string
}

export interface ActionResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}

/**
 * Helper function to get authenticated user and organization
 */
async function getAuthenticatedUserOrganization() {
  const session = await auth()

  if (!session || !session.user?.email) {
    throw new Error('Unauthorized: Please log in')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { organization: { include: { subscription: true } } },
  })

  if (!user || !user.organizationId) {
    throw new Error('User or organization not found')
  }

  return { user, organization: user.organization }
}

/**
 * Get subscription information for the organization
 */
export async function getSubscriptionInfo(): Promise<ActionResponse<SubscriptionInfo>> {
  try {
    const { organization } = await getAuthenticatedUserOrganization()

    if (!organization?.subscription) {
      return {
        success: false,
        message: 'No active subscription found',
        error: 'Your organization does not have an active subscription',
      }
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: organization.subscription.id },
      include: {
        plan: true,
      },
    })

    if (!subscription) {
      return {
        success: false,
        message: 'Subscription not found',
      }
    }

    return {
      success: true,
      message: 'Subscription information retrieved successfully',
      data: {
        id: subscription.id,
        plan: {
          name: subscription.plan.name,
          price: Number(subscription.plan.price),
          currency: subscription.plan.currency,
          billingInterval: subscription.plan.billingInterval,
        },
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelledAt: subscription.cancelledAt || undefined,
      },
    }
  } catch (error) {
    console.error('Failed to get subscription info:', error)
    return {
      success: false,
      message: 'Failed to retrieve subscription information',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get all invoices for the organization
 */
export async function getInvoices(
  filters: InvoiceFilterInput
): Promise<ActionResponse<{ invoices: Invoice[]; total: number }>> {
  try {
    const { organization } = await getAuthenticatedUserOrganization()

    // Validate filters
    const validatedFilters = invoiceFilterSchema.parse(filters)

    const where = {
      organizationId: organization.id,
      ...(validatedFilters.status && { status: validatedFilters.status }),
      ...(validatedFilters.startDate &&
        validatedFilters.endDate && {
          issueDate: {
            gte: validatedFilters.startDate,
            lte: validatedFilters.endDate,
          },
        }),
    }

    // Get total count
    const total = await prisma.invoice.count({ where })

    // Fetch invoices
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: {
          select: { name: true },
        },
      },
      orderBy: { issueDate: 'desc' },
      skip: (validatedFilters.page - 1) * validatedFilters.pageSize,
      take: validatedFilters.pageSize,
    })

    return {
      success: true,
      message: 'Invoices retrieved successfully',
      data: {
        invoices: invoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          issueDate: inv.issueDate,
          dueDate: inv.dueDate,
          totalAmount: Number(inv.totalAmount),
          status: inv.status,
          client: inv.client ? { name: inv.client.name } : undefined,
        })),
        total,
      },
    }
  } catch (error) {
    console.error('Failed to get invoices:', error)

    if (error instanceof ZodError) {
      const errorMessage = error.issues?.[0]?.message || 'Validation failed'
      return {
        success: false,
        message: 'Validation failed',
        error: errorMessage,
      }
    }

    return {
      success: false,
      message: 'Failed to retrieve invoices',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get a specific invoice by ID
 */
export async function getInvoiceById(invoiceId: string): Promise<ActionResponse<Invoice>> {
  try {
    const { organization } = await getAuthenticatedUserOrganization()

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: {
          select: { name: true },
        },
      },
    })

    if (!invoice || invoice.organizationId !== organization.id) {
      return {
        success: false,
        message: 'Invoice not found',
        error: 'The requested invoice does not exist or you do not have access to it',
      }
    }

    return {
      success: true,
      message: 'Invoice retrieved successfully',
      data: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        totalAmount: Number(invoice.totalAmount),
        status: invoice.status,
        client: invoice.client ? { name: invoice.client.name } : undefined,
      },
    }
  } catch (error) {
    console.error('Failed to get invoice:', error)
    return {
      success: false,
      message: 'Failed to retrieve invoice',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Change subscription plan
 */
export async function changePlan(
  input: ChangePlanInput
): Promise<ActionResponse<SubscriptionInfo>> {
  try {
    const { organization } = await getAuthenticatedUserOrganization()

    // Validate input
    const validatedInput = changePlanSchema.parse(input)

    if (!organization.subscription) {
      return {
        success: false,
        message: 'No active subscription found',
        error: 'Your organization does not have an active subscription',
      }
    }

    // Verify plan exists
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: validatedInput.planId },
    })

    if (!plan || !plan.isActive) {
      return {
        success: false,
        message: 'Plan not found or unavailable',
        error: 'The selected plan does not exist or is no longer available',
      }
    }

    // Update subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id: organization.subscription.id },
      data: {
        planId: validatedInput.planId,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      include: { plan: true },
    })

    return {
      success: true,
      message: 'Subscription plan updated successfully',
      data: {
        id: updatedSubscription.id,
        plan: {
          name: updatedSubscription.plan.name,
          price: Number(updatedSubscription.plan.price),
          currency: updatedSubscription.plan.currency,
          billingInterval: updatedSubscription.plan.billingInterval,
        },
        status: updatedSubscription.status,
        currentPeriodStart: updatedSubscription.currentPeriodStart,
        currentPeriodEnd: updatedSubscription.currentPeriodEnd,
      },
    }
  } catch (error) {
    console.error('Failed to change plan:', error)

    if (error instanceof ZodError) {
      const errorMessage = error.issues?.[0]?.message || 'Validation failed'
      return {
        success: false,
        message: 'Validation failed',
        error: errorMessage,
      }
    }

    return {
      success: false,
      message: 'Failed to change subscription plan',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  input: CancelSubscriptionInput
): Promise<ActionResponse> {
  try {
    const { organization } = await getAuthenticatedUserOrganization()

    // Validate input
    const validatedInput = cancelSubscriptionSchema.parse(input)

    if (!organization.subscription) {
      return {
        success: false,
        message: 'No active subscription found',
      }
    }

    // Update subscription
    await prisma.subscription.update({
      where: { id: organization.subscription.id },
      data: {
        status: validatedInput.cancelImmediately ? 'CANCELLED' : 'TRIALING',
        cancelledAt: new Date(),
        cancelAtPeriodEnd: !validatedInput.cancelImmediately,
      },
    })

    return {
      success: true,
      message: validatedInput.cancelImmediately
        ? 'Subscription cancelled immediately'
        : 'Subscription will be cancelled at the end of the billing period',
    }
  } catch (error) {
    console.error('Failed to cancel subscription:', error)

    if (error instanceof ZodError) {
      const errorMessage = error.issues?.[0]?.message || 'Validation failed'
      return {
        success: false,
        message: 'Validation failed',
        error: errorMessage,
      }
    }

    return {
      success: false,
      message: 'Failed to cancel subscription',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Add payment method
 */
export async function addPaymentMethod(
  input: AddPaymentMethodInput
): Promise<ActionResponse<PaymentMethod>> {
  try {
    const { organization } = await getAuthenticatedUserOrganization()

    // Validate input
    const validatedInput = addPaymentMethodSchema.parse(input)

    // Parse expiry date
    const [month, year] = validatedInput.expiryDate.split('/')
    const expiryMonth = parseInt(month)
    const expiryYear = 2000 + parseInt(year)

    // Validate card expiry
    const now = new Date()
    if (expiryYear < now.getFullYear() || (expiryYear === now.getFullYear() && expiryMonth < now.getMonth() + 1)) {
      return {
        success: false,
        message: 'Invalid expiry date',
        error: 'Card has already expired',
      }
    }

    // TODO: In production, use a payment processor like Stripe
    // For now, we'll create a mock payment method record

    // Create payment method (mock implementation)
    const mockId = `pm_${Date.now()}`

    // In a real implementation, you would:
    // 1. Validate card with payment processor
    // 2. Tokenize the card
    // 3. Store the token in your database

    return {
      success: true,
      message: 'Payment method added successfully',
      data: {
        id: mockId,
        brand: detectCardBrand(validatedInput.cardNumber),
        last4: validatedInput.cardNumber.slice(-4),
        expiryMonth,
        expiryYear,
        isDefault: true,
        createdAt: new Date(),
      },
    }
  } catch (error) {
    console.error('Failed to add payment method:', error)

    if (error instanceof ZodError) {
      const errorMessage = error.issues?.[0]?.message || 'Validation failed'
      return {
        success: false,
        message: 'Validation failed',
        error: errorMessage,
      }
    }

    return {
      success: false,
      message: 'Failed to add payment method',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete payment method
 */
export async function deletePaymentMethod(methodId: string): Promise<ActionResponse> {
  try {
    const { organization } = await getAuthenticatedUserOrganization()

    if (!methodId) {
      return {
        success: false,
        message: 'Invalid payment method',
      }
    }

    // TODO: Delete from payment processor and database

    return {
      success: true,
      message: 'Payment method deleted successfully',
    }
  } catch (error) {
    console.error('Failed to delete payment method:', error)
    return {
      success: false,
      message: 'Failed to delete payment method',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Set default payment method
 */
export async function setDefaultPaymentMethod(methodId: string): Promise<ActionResponse> {
  try {
    const { organization } = await getAuthenticatedUserOrganization()

    if (!methodId) {
      return {
        success: false,
        message: 'Invalid payment method',
      }
    }

    // TODO: Update payment processor and database

    return {
      success: true,
      message: 'Default payment method updated successfully',
    }
  } catch (error) {
    console.error('Failed to set default payment method:', error)
    return {
      success: false,
      message: 'Failed to set default payment method',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update billing address
 */
export async function updateBillingAddress(
  input: UpdateBillingAddressInput
): Promise<ActionResponse> {
  try {
    const { organization } = await getAuthenticatedUserOrganization()

    // Validate input
    const validatedInput = updateBillingAddressSchema.parse(input)

    // TODO: Store billing address in database
    // For now, this is a mock implementation

    return {
      success: true,
      message: 'Billing address updated successfully',
      data: {
        ...validatedInput,
      },
    }
  } catch (error) {
    console.error('Failed to update billing address:', error)

    if (error instanceof ZodError) {
      const errorMessage = error.issues?.[0]?.message || 'Validation failed'
      return {
        success: false,
        message: 'Validation failed',
        error: errorMessage,
      }
    }

    return {
      success: false,
      message: 'Failed to update billing address',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Helper function to detect card brand
 */
function detectCardBrand(cardNumber: string): string {
  const patterns = {
    visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
    mastercard: /^5[1-5][0-9]{14}$/,
    amex: /^3[47][0-9]{13}$/,
    discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
  }

  for (const [brand, pattern] of Object.entries(patterns)) {
    if (pattern.test(cardNumber.replace(/\s/g, ''))) {
      return brand.charAt(0).toUpperCase() + brand.slice(1)
    }
  }

  return 'Card'
}

/**
 * Download invoice as PDF
 */
export async function downloadInvoicePDF(invoiceId: string): Promise<ActionResponse> {
  try {
    const { organization } = await getAuthenticatedUserOrganization()

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice || invoice.organizationId !== organization.id) {
      return {
        success: false,
        message: 'Invoice not found',
      }
    }

    // TODO: Generate PDF using a library like PDFKit or html2pdf
    // Return downloadable URL

    return {
      success: true,
      message: 'Invoice PDF generated successfully',
      data: {
        downloadUrl: `/api/invoices/${invoiceId}/download`,
      },
    }
  } catch (error) {
    console.error('Failed to download invoice:', error)
    return {
      success: false,
      message: 'Failed to download invoice',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
