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

    // Create transaction to create organization, default role, and user
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create a temporary placeholder organization (will be updated later)
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
          trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      })

      // Create default ADMIN role for this organization
      const adminRole = await tx.role.create({
        data: {
          name: 'ADMIN',
          displayName: 'Administrator',
          description: 'Full access to all features',
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
          roleId: adminRole.id,
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

      return { organization, user }
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
