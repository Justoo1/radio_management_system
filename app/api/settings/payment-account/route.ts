/**
 * Payment Account API
 * Manages Paystack subaccount setup for organizations
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
import { getPaystackService } from '@/lib/integrations/paystack'
import { paymentAccountSetupSchema } from '@/lib/validations/payment-account.validation'
import { ZodError } from 'zod'

// GET /api/settings/payment-account - Get current payment account setup
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: {
        paystackSubaccountId: true,
        paystackSubaccountCode: true,
        settlementType: true,
        bankName: true,
        accountNumber: true,
        accountName: true,
        bankCode: true,
        momoProvider: true,
        momoNumber: true,
        momoName: true,
        hasPaymentAccount: true,
      },
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({ data: organization })
  } catch (error) {
    console.error('Error fetching payment account:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment account' },
      { status: 500 }
    )
  }
}

// POST /api/settings/payment-account - Setup payment account
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = session.user.organizationId

    // Check permission
    if (!hasPermission(session.user, 'settings', 'update')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = paymentAccountSetupSchema.parse(body)

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        paystackSubaccountCode: true,
      },
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const paystack = getPaystackService()

    let subaccountData: any

    if (validatedData.settlementType === 'bank') {
      // Resolve account number to verify and get account name
      const resolveResponse = await paystack.resolveAccountNumber(
        validatedData.accountNumber,
        validatedData.bankCode
      )

      if (!resolveResponse.status) {
        return NextResponse.json(
          { error: 'Failed to verify account number. Please check and try again.' },
          { status: 400 }
        )
      }

      const accountName = resolveResponse.data.account_name

      // Create or update subaccount
      if (organization.paystackSubaccountCode) {
        // Update existing subaccount
        subaccountData = await paystack.updateSubaccount(
          organization.paystackSubaccountCode,
          {
            business_name: organization.name,
            settlement_bank: validatedData.bankCode,
            account_number: validatedData.accountNumber,
            percentage_charge: 0, // 100% goes to organization
            primary_contact_email: organization.email,
            primary_contact_phone: organization.phone || undefined,
            settlement_schedule: 'auto', // Immediate settlement
          }
        )
      } else {
        // Create new subaccount
        subaccountData = await paystack.createSubaccount({
          business_name: organization.name,
          settlement_bank: validatedData.bankCode,
          account_number: validatedData.accountNumber,
          percentage_charge: 0, // 100% goes to organization
          description: `Airtime bookings for ${organization.name}`,
          primary_contact_email: organization.email,
          primary_contact_phone: organization.phone || undefined,
          settlement_schedule: 'auto', // Immediate settlement
        })
      }

      // Get bank name
      const banks = await paystack.listBanks()
      const bank = banks.data.find((b) => b.code === validatedData.bankCode)

      // Update organization with bank details
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          paystackSubaccountId: subaccountData.data.id.toString(),
          paystackSubaccountCode: subaccountData.data.subaccount_code,
          settlementType: 'bank',
          bankName: bank?.name || validatedData.bankCode,
          accountNumber: validatedData.accountNumber,
          accountName,
          bankCode: validatedData.bankCode,
          // Clear mobile money fields
          momoProvider: null,
          momoNumber: null,
          momoName: null,
          hasPaymentAccount: true,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Bank account setup successful',
        data: {
          accountName,
          accountNumber: validatedData.accountNumber,
          bankName: bank?.name || validatedData.bankCode,
        },
      })
    } else {
      // Mobile Money setup
      // Note: Paystack doesn't have direct mobile money subaccount API
      // We'll store the details and handle settlement manually or use transfer API

      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          settlementType: 'mobile_money',
          momoProvider: validatedData.momoProvider,
          momoNumber: validatedData.momoNumber,
          momoName: validatedData.momoName,
          // Clear bank fields
          bankName: null,
          accountNumber: null,
          accountName: null,
          bankCode: null,
          hasPaymentAccount: true,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Mobile money account setup successful',
        data: {
          momoName: validatedData.momoName,
          momoNumber: validatedData.momoNumber,
          momoProvider: validatedData.momoProvider.toUpperCase(),
        },
      })
    }
  } catch (error) {
    console.error('Error setting up payment account:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.name === 'PaystackError') {
      return NextResponse.json(
        { error: `Paystack error: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to setup payment account' },
      { status: 500 }
    )
  }
}

// DELETE /api/settings/payment-account - Remove payment account
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = session.user.organizationId

    // Check permission
    if (!hasPermission(session.user, 'settings', 'delete')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Clear payment account details
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        paystackSubaccountId: null,
        paystackSubaccountCode: null,
        settlementType: null,
        bankName: null,
        accountNumber: null,
        accountName: null,
        bankCode: null,
        momoProvider: null,
        momoNumber: null,
        momoName: null,
        hasPaymentAccount: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Payment account removed successfully',
    })
  } catch (error) {
    console.error('Error removing payment account:', error)
    return NextResponse.json(
      { error: 'Failed to remove payment account' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
