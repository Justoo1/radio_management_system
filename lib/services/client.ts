/**
 * Client Service
 * Business logic for client management
 */

import { prisma } from '@/lib/prisma'
import { ClientInput, ClientFilterInput } from '@/lib/validations/client'

/**
 * Get all clients for an organization with pagination and filtering
 */
export async function getClients(
  organizationId: string,
  filters?: ClientFilterInput
) {
  const page = filters?.page || 1
  const pageSize = filters?.pageSize || 10
  const skip = (page - 1) * pageSize

  // Build where clause
  const where: any = {
    organizationId,
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters?.status) {
    where.status = filters.status
  }

  if (filters?.categoryId) {
    where.categoryId = filters.categoryId
  }

  // Build order by
  const orderBy: any = {}
  if (filters?.sortBy === 'name') {
    orderBy.name = filters.sortOrder || 'asc'
  } else if (filters?.sortBy === 'email') {
    orderBy.email = filters.sortOrder || 'asc'
  } else {
    orderBy.createdAt = filters?.sortOrder || 'desc'
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
      include: {
        category: true,
        contacts: true,
      },
    }),
    prisma.client.count({ where }),
  ])

  return {
    data: clients,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNext: page < Math.ceil(total / pageSize),
      hasPrev: page > 1,
    },
  }
}

/**
 * Get a single client by ID
 */
export async function getClientById(clientId: string, organizationId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      category: true,
      contacts: true,
    },
  })

  if (!client || client.organizationId !== organizationId) {
    return null
  }

  return client
}

/**
 * Create a new client
 */
export async function createClient(
  organizationId: string,
  data: ClientInput
) {
  // Check organization exists and get feature limit
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  // Check client limit
  const clientCount = await prisma.client.count({
    where: { organizationId },
  })

  if (clientCount >= (org as any).maxClients) {
    throw new Error(
      `Client limit (${(org as any).maxClients}) reached for your organization`
    )
  }

  const client = await prisma.client.create({
    data: {
      ...data,
      organizationId,
      status: data.status || 'PROSPECT',
    } as any,
    include: {
      category: true,
      contacts: true,
    },
  })

  return client
}

/**
 * Update a client
 */
export async function updateClient(
  clientId: string,
  organizationId: string,
  data: Partial<ClientInput>
) {
  const client = await getClientById(clientId, organizationId)
  if (!client) {
    throw new Error('Client not found')
  }

  const updated = await prisma.client.update({
    where: { id: clientId },
    data: {
      ...data,
    } as any,
    include: {
      category: true,
      contacts: true,
    },
  })

  return updated
}

/**
 * Delete a client
 */
export async function deleteClient(clientId: string, organizationId: string) {
  const client = await getClientById(clientId, organizationId)
  if (!client) {
    throw new Error('Client not found')
  }

  await prisma.client.delete({
    where: { id: clientId },
  })

  return { success: true }
}

/**
 * Get client statistics
 */
export async function getClientStats(organizationId: string) {
  const [total, active, prospect, churned] = await Promise.all([
    prisma.client.count({ where: { organizationId } }),
    prisma.client.count({
      where: { organizationId, status: 'ACTIVE' },
    }),
    prisma.client.count({
      where: { organizationId, status: 'PROSPECT' },
    }),
    prisma.client.count({
      where: { organizationId, status: 'CHURNED' },
    }),
  ])

  return {
    total,
    active,
    prospect,
    churned,
    inactive: total - active - prospect - churned,
  }
}

/**
 * Export clients to CSV format
 */
export async function exportClientsCSV(organizationId: string) {
  const clients = await prisma.client.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  })

  // CSV header
  const headers = [
    'ID',
    'Name',
    'Email',
    'Phone',
    'City',
    'Status',
    'Created At',
  ]

  // CSV rows
  const rows = clients.map((client) => [
    client.id,
    client.name,
    client.email || '',
    client.phone || '',
    client.city || '',
    client.status,
    new Date(client.createdAt).toISOString().split('T')[0],
  ])

  return {
    headers,
    rows,
  }
}
