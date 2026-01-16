/**
 * Register API Endpoint
 * POST /api/auth/register
 * Creates a new organization and user account
 */

import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validations/auth'
import type { Prisma } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate input
    const validatedData = registerSchema.parse(body)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already in use' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 10)

    // Create transaction to create organization, default role, user, and starter plan subscription
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Get the Starter plan for trial period
      let starterPlan = await tx.subscriptionPlan.findUnique({
        where: { name: 'Starter' },
      })

      if (!starterPlan) {
        // If Starter plan doesn't exist, create it
        starterPlan = await tx.subscriptionPlan.create({
          data: {
            name: 'Starter',
            description: 'Perfect for small radio stations getting started',
            price: '500',
            currency: 'GHS',
            billingInterval: 'MONTHLY',
            maxUsers: 5,
            maxClients: 100,
            maxSMSPerMonth: 500,
            maxStorageGB: 5,
            maxPrograms: 50,
            features: JSON.stringify([
              'Client Management',
              'Program Scheduling',
              'Live On-Air Dashboard',
              'Invoices & Contracts',
              'Expense Tracking',
              'Basic Reports',
            ]),
            isPopular: false,
            isActive: true,
            sortOrder: 1,
          },
        })
      }

      // Create organization with 7-day full access trial
      const tempOrganization = await tx.organization.create({
        data: {
          name: validatedData.organizationName,
          slug: validatedData.organizationName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, ''),
          email: validatedData.email,
          phone: validatedData.phone,
          country: validatedData.country || 'Ghana',
          status: 'TRIAL',
          trialStartDate: new Date(),
          trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          isTrialUsed: false,
          // Grant unlimited access during trial
          maxUsers: 999,
          maxClients: 9999,
          maxSMSPerMonth: 99999,
          maxStorageGB: 500,
          maxPrograms: 9999,
          // Enable ALL features during trial
          enabledFeatures: JSON.stringify([
            'SMS_CAMPAIGNS',
            'ADVERTISEMENTS',
            'MEDIA_LIBRARY',
            'WHATSAPP',
            'EXPENSES',
            'ADVANCED_ANALYTICS',
            'REVENUE_REPORTS',
            'CONTRACT_ANALYSIS',
            'INVOICE_AGING',
            'CLIENT_ANALYTICS',
            'PROGRAM_ANALYTICS',
            'SMS_ANALYTICS',
          ]),
        },
      })

      // Create Starter plan subscription with 7-day trial
      const subscription = await tx.subscription.create({
        data: {
          planId: starterPlan.id,
          status: 'TRIALING',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days trial
        },
      })

      // Update organization with subscription reference
      await tx.organization.update({
        where: { id: tempOrganization.id },
        data: {
          subscriptionId: subscription.id,
        },
      })

      // Create default OWNER role for this organization
      const ownerRole = await tx.role.create({
        data: {
          name: 'OWNER',
          displayName: 'Owner',
          description: 'Full access to all features and organization management',
          organizationId: tempOrganization.id,
          isSystemRole: true,
          permissions: {
            connect: [
              // Connect all permissions
            ],
          },
        },
      })

      // Create user with organization and role references
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          name: validatedData.name || validatedData.email.split('@')[0],
          password: hashedPassword,
          organizationId: tempOrganization.id,
          roleId: ownerRole.id,
          status: 'ACTIVE',
        },
      })

      // Update organization with owner reference
      const organization = await tx.organization.update({
        where: { id: tempOrganization.id },
        data: {
          ownerId: user.id,
        },
      })

      return { organization, user, subscription }
    })

    return NextResponse.json(
      {
        message: 'Account created successfully',
        organization: {
          id: result.organization.id,
          name: result.organization.name,
          slug: result.organization.slug,
        },
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)

    if (error instanceof Error) {
      // Zod validation error
      if (error.message.includes('validation')) {
        return NextResponse.json(
          { message: 'Validation failed', error: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { message: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}
