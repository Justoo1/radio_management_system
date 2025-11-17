/**
 * Contract Server Actions
 * Server-side functions for contract operations
 */

'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import {
  createContractSchema,
  updateContractSchema,
  listContractsSchema,
  type CreateContractInput,
  type UpdateContractInput,
  type ListContractsInput,
} from '@/lib/validations/contract'
import { ZodError } from 'zod'

// Helper to get user organization
async function getUserOrganization() {
  const session = await auth()
  if (!session?.user?.organizationId || !session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return {
    userId: session.user.id,
    organizationId: session.user.organizationId,
  }
}

// Response types
export interface ContractResponse {
  id: string
  contractNumber: string
  title: string
  description: string | null
  clientId: string
  client: {
    id: string
    name: string
    email: string | null
  } | null
  startDate: Date
  endDate: Date
  value: number | any // Prisma Decimal
  terms: string | null
  documentUrl: string | null
  status: 'DRAFT' | 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'
  signedDocumentUrl: string | null
  signedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ContractsListResponse {
  data: ContractResponse[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  summary: {
    totalContracts: number
    totalValue: number
    activeCount: number
    expiredCount: number
  }
}

/**
 * Fetch contracts with filtering and pagination
 */
export async function fetchContracts(
  params: ListContractsInput
): Promise<ContractsListResponse> {
  try {
    const { organizationId } = await getUserOrganization()
    const validatedParams = listContractsSchema.parse(params)

    const skip = (validatedParams.page - 1) * validatedParams.pageSize

    // Build where clause
    const where: any = {
      organizationId,
    }

    if (validatedParams.status) {
      where.status = validatedParams.status
    }

    if (validatedParams.clientId) {
      where.clientId = validatedParams.clientId
    }

    if (validatedParams.search) {
      where.OR = [
        { title: { contains: validatedParams.search, mode: 'insensitive' } },
        { contractNumber: { contains: validatedParams.search, mode: 'insensitive' } },
        { client: { name: { contains: validatedParams.search, mode: 'insensitive' } } },
      ]
    }

    if (validatedParams.minValue !== undefined) {
      where.value = {
        gte: validatedParams.minValue,
      }
    }

    if (validatedParams.maxValue !== undefined) {
      if (where.value) {
        where.value.lte = validatedParams.maxValue
      } else {
        where.value = {
          lte: validatedParams.maxValue,
        }
      }
    }

    if (validatedParams.startDate) {
      where.startDate = {
        gte: validatedParams.startDate,
      }
    }

    if (validatedParams.endDate) {
      if (where.startDate) {
        where.startDate.lte = validatedParams.endDate
      } else {
        where.startDate = {
          lte: validatedParams.endDate,
        }
      }
    }

    // Fetch contracts
    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip,
        take: validatedParams.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contract.count({ where }),
    ])

    // Get summary
    const summary = await prisma.contract.aggregate({
      where: {
        organizationId,
      },
      _count: true,
      _sum: {
        value: true,
      },
    })

    const activeCount = await prisma.contract.count({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
    })

    const expiredCount = await prisma.contract.count({
      where: {
        organizationId,
        status: 'EXPIRED',
      },
    })

    return {
      data: contracts as any as ContractResponse[],
      pagination: {
        page: validatedParams.page,
        pageSize: validatedParams.pageSize,
        total,
        totalPages: Math.ceil(total / validatedParams.pageSize),
        hasNext: validatedParams.page < Math.ceil(total / validatedParams.pageSize),
        hasPrev: validatedParams.page > 1,
      },
      summary: {
        totalContracts: summary._count,
        totalValue: Number(summary._sum.value) || 0,
        activeCount,
        expiredCount,
      },
    }
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.issues[0]
      throw new Error(`Validation error: ${firstError?.message || 'Invalid input'}`)
    }
    throw error
  }
}

/**
 * Fetch single contract details
 */
export async function fetchContractDetails(
  contractId: string
): Promise<ContractResponse> {
  try {
    const { organizationId } = await getUserOrganization()

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!contract || contract.organizationId !== organizationId) {
      throw new Error('Contract not found')
    }

    return contract as any as ContractResponse
  } catch (error) {
    throw error
  }
}

/**
 * Create a new contract
 */
export async function createContract(
  data: CreateContractInput
): Promise<ContractResponse> {
  try {
    const { organizationId, userId } = await getUserOrganization()
    const validatedData = createContractSchema.parse(data)

    // Verify client exists and belongs to organization
    const client = await prisma.client.findUnique({
      where: { id: validatedData.clientId },
    })

    if (!client || client.organizationId !== organizationId) {
      throw new Error('Client not found')
    }

    // Create contract
    const contract = await prisma.contract.create({
      data: {
        ...validatedData,
        organizationId,
        status: 'DRAFT',
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return contract as any as ContractResponse
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.issues[0]
      throw new Error(`Validation error: ${firstError?.message || 'Invalid input'}`)
    }
    throw error
  }
}

/**
 * Update contract
 */
export async function updateContract(
  contractId: string,
  data: UpdateContractInput
): Promise<ContractResponse> {
  try {
    const { organizationId } = await getUserOrganization()
    const validatedData = updateContractSchema.parse(data)

    // Verify contract exists and belongs to organization
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    })

    if (!contract || contract.organizationId !== organizationId) {
      throw new Error('Contract not found')
    }

    // Update contract
    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: validatedData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return updatedContract as any as ContractResponse
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.issues[0]
      throw new Error(`Validation error: ${firstError?.message || 'Invalid input'}`)
    }
    throw error
  }
}

/**
 * Delete contract (only drafts)
 */
export async function deleteContract(contractId: string): Promise<void> {
  try {
    const { organizationId } = await getUserOrganization()

    // Verify contract exists and belongs to organization
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    })

    if (!contract || contract.organizationId !== organizationId) {
      throw new Error('Contract not found')
    }

    // Only allow deletion of draft contracts
    if (contract.status !== 'DRAFT') {
      throw new Error('Only draft contracts can be deleted')
    }

    // Delete contract
    await prisma.contract.delete({
      where: { id: contractId },
    })
  } catch (error) {
    throw error
  }
}
