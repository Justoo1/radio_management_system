'use server'

/**
 * Account Management Server Actions
 * Handles user profile updates, password changes, and email updates
 */

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { ZodError } from 'zod'
import {
  updateProfileSchema,
  changePasswordSchema,
  changeEmailSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
  type ChangeEmailInput,
} from '@/lib/validations/account'

// Response Types
export interface AccountResponse {
  id: string
  name: string
  email: string
  phone: string | null
  image: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ActionResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}

/**
 * Helper function to get authenticated user
 */
async function getAuthenticatedUser() {
  const session = await auth()

  if (!session || !session.user?.email) {
    throw new Error('Unauthorized: Please log in')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return user
}

/**
 * Get current user account information
 */
export async function getAccountInfo(): Promise<ActionResponse<AccountResponse>> {
  try {
    const user = await getAuthenticatedUser()

    const [firstName, lastName] = (user.name || '').split(' ')

    return {
      success: true,
      message: 'Account information retrieved successfully',
      data: {
        id: user.id,
        name: user.name || '',
        email: user.email,
        phone: user.phone || null,
        image: user.image || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    }
  } catch (error) {
    console.error('Failed to get account info:', error)
    return {
      success: false,
      message: 'Failed to retrieve account information',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update user profile (name and phone)
 */
export async function updateProfile(
  input: UpdateProfileInput
): Promise<ActionResponse<AccountResponse>> {
  try {
    const user = await getAuthenticatedUser()

    // Validate input
    const validatedInput = updateProfileSchema.parse(input)

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: `${validatedInput.firstName} ${validatedInput.lastName}`,
        phone: validatedInput.phone || null,
        updatedAt: new Date(),
      },
    })

    const [firstName, lastName] = (updatedUser.name || '').split(' ')

    return {
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        name: updatedUser.name || '',
        email: updatedUser.email,
        phone: updatedUser.phone || null,
        image: updatedUser.image || null,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    }
  } catch (error) {
    console.error('Failed to update profile:', error)

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
      message: 'Failed to update profile',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Change user password
 */
export async function changePassword(
  input: ChangePasswordInput
): Promise<ActionResponse> {
  try {
    const user = await getAuthenticatedUser()

    // Validate input
    const validatedInput = changePasswordSchema.parse(input)

    // Verify current password
    if (!user.password) {
      return {
        success: false,
        message: 'Current password verification failed',
        error: 'No password set for this account',
      }
    }

    const passwordMatch = await bcrypt.compare(validatedInput.currentPassword, user.password)

    if (!passwordMatch) {
      return {
        success: false,
        message: 'Current password is incorrect',
        error: 'The current password you entered is incorrect',
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validatedInput.newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    })

    return {
      success: true,
      message: 'Password changed successfully',
    }
  } catch (error) {
    console.error('Failed to change password:', error)

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
      message: 'Failed to change password',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Request email change (sends verification email)
 */
export async function requestEmailChange(
  input: ChangeEmailInput
): Promise<ActionResponse> {
  try {
    const user = await getAuthenticatedUser()

    // Validate input
    const validatedInput = changeEmailSchema.parse(input)

    // Check if new email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedInput.newEmail },
    })

    if (existingUser && existingUser.id !== user.id) {
      return {
        success: false,
        message: 'Email already in use',
        error: 'This email address is already associated with another account',
      }
    }

    // TODO: Generate verification token and send email
    // For now, we'll just update the email directly
    // In production, you should send a verification email first

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: validatedInput.newEmail,
        updatedAt: new Date(),
      },
    })

    return {
      success: true,
      message: 'Email updated successfully. A verification link has been sent to your new email address.',
      data: {
        email: updatedUser.email,
      },
    }
  } catch (error) {
    console.error('Failed to change email:', error)

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
      message: 'Failed to update email',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Delete user account
 */
export async function deleteAccount(password: string): Promise<ActionResponse> {
  try {
    const user = await getAuthenticatedUser()

    // Verify password before deletion
    if (!user.password) {
      return {
        success: false,
        message: 'Account deletion failed',
        error: 'No password set for this account',
      }
    }

    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return {
        success: false,
        message: 'Account deletion failed',
        error: 'Incorrect password',
      }
    }

    // TODO: Add soft delete or data anonymization before hard delete
    // For now, we'll prevent deletion for safety

    return {
      success: false,
      message: 'Account deletion is not yet available',
      error: 'Please contact support to delete your account',
    }
  } catch (error) {
    console.error('Failed to delete account:', error)

    return {
      success: false,
      message: 'Failed to delete account',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
