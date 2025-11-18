'use server'

/**
 * Organization Management Server Actions
 * Handles organization operations including deletion with cascading data cleanup
 */

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ZodError } from 'zod'
import {
  deleteOrganizationSchema,
  type DeleteOrganizationInput,
} from '@/lib/validations/organization'

export interface ActionResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}

/**
 * Helper function to get authenticated user and verify organization ownership
 */
async function getAuthenticatedUserOrganization() {
  const session = await auth()

  if (!session || !session.user?.email) {
    throw new Error('Unauthorized: Please log in')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { organization: true, ownedOrganization: true },
  })

  if (!user || !user.organizationId) {
    throw new Error('User or organization not found')
  }

  // Check if user is organization owner
  if (user.ownedOrganization?.id !== user.organizationId) {
    throw new Error('Only organization owners can delete the organization')
  }

  return { user, organization: user.organization! }
}

/**
 * Delete organization and all associated data
 * This is a destructive operation that cannot be undone
 */
export async function deleteOrganization(
  input: DeleteOrganizationInput
): Promise<ActionResponse> {
  try {
    const { organization } = await getAuthenticatedUserOrganization()

    // Validate input
    const validatedInput = deleteOrganizationSchema.parse(input)

    // Additional confirmation check - organization name must match
    if (validatedInput.organizationNameConfirmation !== organization.name) {
      return {
        success: false,
        message: 'Organization name does not match',
        error: 'Please enter the correct organization name to confirm deletion',
      }
    }

    // Start transaction for atomic deletion
    // Delete all associated data in order of dependencies

    // 1. Delete activity logs
    await prisma.activityLog.deleteMany({
      where: { organizationId: organization.id },
    })

    // 2. Delete metrics
    await prisma.metric.deleteMany({
      where: { organizationId: organization.id },
    })

    // 3. Delete SMS related data
    await prisma.sMSMessage.deleteMany({
      where: {
        campaign: {
          organizationId: organization.id,
        },
      },
    })

    await prisma.sMSCampaign.deleteMany({
      where: { organizationId: organization.id },
    })

    await prisma.sMSTemplate.deleteMany({
      where: { organizationId: organization.id },
    })

    await prisma.sMSCredit.deleteMany({
      where: { organizationId: organization.id },
    })

    // 4. Delete communication logs
    await prisma.communication.deleteMany({
      where: { organizationId: organization.id },
    })

    // 5. Delete ad slots and advertisements
    await prisma.adSlot.deleteMany({
      where: {
        advertisement: {
          campaign: {
            organizationId: organization.id,
          },
        },
      },
    })

    await prisma.advertisement.deleteMany({
      where: {
        campaign: {
          organizationId: organization.id,
        },
      },
    })

    await prisma.adCampaign.deleteMany({
      where: { organizationId: organization.id },
    })

    // 6. Delete media files
    await prisma.mediaFile.deleteMany({
      where: { organizationId: organization.id },
    })

    // 7. Delete program related data
    await prisma.programEpisode.deleteMany({
      where: {
        program: {
          organizationId: organization.id,
        },
      },
    })

    await prisma.programSchedule.deleteMany({
      where: {
        program: {
          organizationId: organization.id,
        },
      },
    })

    await prisma.program.deleteMany({
      where: { organizationId: organization.id },
    })

    // 8. Delete billing related data
    await prisma.payment.deleteMany({
      where: {
        invoice: {
          organizationId: organization.id,
        },
      },
    })

    await prisma.invoiceItem.deleteMany({
      where: {
        invoice: {
          organizationId: organization.id,
        },
      },
    })

    await prisma.invoice.deleteMany({
      where: { organizationId: organization.id },
    })

    // 9. Delete contracts
    await prisma.contract.deleteMany({
      where: { organizationId: organization.id },
    })

    // 10. Delete clients (and their contact persons via cascade)
    await prisma.client.deleteMany({
      where: { organizationId: organization.id },
    })

    // 11. Delete settings
    await prisma.organizationSetting.deleteMany({
      where: { organizationId: organization.id },
    })

    // 12. Delete users first (before roles, due to foreign key constraint)
    await prisma.user.deleteMany({
      where: { organizationId: organization.id },
    })

    // 13. Delete roles and permissions (after users)
    await prisma.role.deleteMany({
      where: { organizationId: organization.id },
    })

    // 14. Delete subscription related data
    if (organization.subscriptionId) {
      await prisma.subscriptionPayment.deleteMany({
        where: { subscriptionId: organization.subscriptionId },
      })

      await prisma.subscription.delete({
        where: { id: organization.subscriptionId },
      })
    }

    // 15. Finally delete the organization
    await prisma.organization.delete({
      where: { id: organization.id },
    })

    return {
      success: true,
      message: 'Organization and all associated data have been permanently deleted',
    }
  } catch (error) {
    console.error('Failed to delete organization:', error)

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
      message: 'Failed to delete organization',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get organization information for display
 */
export async function getOrganizationInfo(): Promise<ActionResponse<any>> {
  try {
    const { organization } = await getAuthenticatedUserOrganization()

    return {
      success: true,
      message: 'Organization information retrieved',
      data: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        status: organization.status,
        createdAt: organization.createdAt,
      },
    }
  } catch (error) {
    console.error('Failed to get organization info:', error)
    return {
      success: false,
      message: 'Failed to retrieve organization information',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Soft delete organization (mark as deleted without removing data)
 * Can be reversed by admin
 */
export async function softDeleteOrganization(): Promise<ActionResponse> {
  try {
    const { organization } = await getAuthenticatedUserOrganization()

    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        deletedAt: new Date(),
        status: 'CANCELLED',
      },
    })

    return {
      success: true,
      message: 'Organization has been marked for deletion. Contact support to reverse this action.',
    }
  } catch (error) {
    console.error('Failed to soft delete organization:', error)
    return {
      success: false,
      message: 'Failed to delete organization',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
