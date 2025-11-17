/**
 * Program Service
 * Business logic for program management
 */

import { prisma } from '@/lib/prisma'
import {
  ProgramInput,
  ProgramScheduleInput,
  ProgramEpisodeInput,
  ProgramFilterInput,
} from '@/lib/validations/program'

/**
 * Get all programs for an organization with filtering
 */
export async function getPrograms(
  organizationId: string,
  filters?: ProgramFilterInput
) {
  // Build where clause
  const where: any = {
    organizationId,
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters?.genre) {
    where.genre = filters.genre
  }

  // Build order by
  const orderBy: any = {}
  if (filters?.sortBy === 'name') {
    orderBy.name = filters.sortOrder || 'asc'
  } else {
    orderBy.createdAt = filters?.sortOrder || 'desc'
  }

  const programs = await prisma.program.findMany({
    where,
    orderBy,
    include: {
      schedules: true,
      episodes: true,
    },
  })

  return programs
}

/**
 * Get a single program by ID
 */
export async function getProgramById(programId: string, organizationId: string) {
  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: {
      schedules: true,
      episodes: true,
    },
  })

  if (!program || program.organizationId !== organizationId) {
    return null
  }

  return program
}

/**
 * Create a new program
 */
export async function createProgram(
  organizationId: string,
  data: ProgramInput
) {
  // Check organization exists and get feature limit
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  // Check program limit
  const programCount = await prisma.program.count({
    where: { organizationId },
  })

  if (programCount >= (org as any).maxPrograms) {
    throw new Error(
      `Program limit (${(org as any).maxPrograms}) reached for your organization`
    )
  }

  const program = await prisma.program.create({
    data: {
      ...data,
      organizationId,
      isActive: data.isActive ?? true,
      coHosts: data.coHosts ? JSON.stringify(data.coHosts) : null,
    } as any,
    include: {
      schedules: true,
      episodes: true,
    },
  })

  return program
}

/**
 * Update a program
 */
export async function updateProgram(
  programId: string,
  organizationId: string,
  data: Partial<ProgramInput>
) {
  const program = await getProgramById(programId, organizationId)
  if (!program) {
    throw new Error('Program not found')
  }

  const updated = await prisma.program.update({
    where: { id: programId },
    data: {
      ...data,
      coHosts: data.coHosts ? JSON.stringify(data.coHosts) : undefined,
    } as any,
    include: {
      schedules: true,
      episodes: true,
    },
  })

  return updated
}

/**
 * Delete a program
 */
export async function deleteProgram(programId: string, organizationId: string) {
  const program = await getProgramById(programId, organizationId)
  if (!program) {
    throw new Error('Program not found')
  }

  await prisma.program.delete({
    where: { id: programId },
  })

  return { success: true }
}

/**
 * Add a schedule to a program
 */
export async function addProgramSchedule(
  programId: string,
  organizationId: string,
  data: ProgramScheduleInput
) {
  const program = await getProgramById(programId, organizationId)
  if (!program) {
    throw new Error('Program not found')
  }

  const schedule = await prisma.programSchedule.create({
    data: {
      ...data,
      programId,
      dayOfWeek: data.dayOfWeek,
      isRecurring: data.isRecurring ?? true,
      isActive: data.isActive ?? true,
    },
  })

  return schedule
}

/**
 * Update a program schedule
 */
export async function updateProgramSchedule(
  scheduleId: string,
  programId: string,
  organizationId: string,
  data: Partial<ProgramScheduleInput>
) {
  const program = await getProgramById(programId, organizationId)
  if (!program) {
    throw new Error('Program not found')
  }

  const schedule = await prisma.programSchedule.update({
    where: { id: scheduleId },
    data: {
      ...data,
    },
  })

  return schedule
}

/**
 * Delete a program schedule
 */
export async function deleteProgramSchedule(
  scheduleId: string,
  programId: string,
  organizationId: string
) {
  const program = await getProgramById(programId, organizationId)
  if (!program) {
    throw new Error('Program not found')
  }

  await prisma.programSchedule.delete({
    where: { id: scheduleId },
  })

  return { success: true }
}

/**
 * Add an episode to a program
 */
export async function addProgramEpisode(
  programId: string,
  organizationId: string,
  data: ProgramEpisodeInput
) {
  const program = await getProgramById(programId, organizationId)
  if (!program) {
    throw new Error('Program not found')
  }

  const episode = await prisma.programEpisode.create({
    data: {
      ...data,
      programId,
      guestNames: data.guestNames ? JSON.stringify(data.guestNames) : null,
      topics: data.topics ? JSON.stringify(data.topics) : null,
      status: data.status || 'SCHEDULED',
    } as any,
  })

  return episode
}

/**
 * Update a program episode
 */
export async function updateProgramEpisode(
  episodeId: string,
  programId: string,
  organizationId: string,
  data: Partial<ProgramEpisodeInput>
) {
  const program = await getProgramById(programId, organizationId)
  if (!program) {
    throw new Error('Program not found')
  }

  const episode = await prisma.programEpisode.update({
    where: { id: episodeId },
    data: {
      ...data,
      guestNames: data.guestNames ? JSON.stringify(data.guestNames) : undefined,
      topics: data.topics ? JSON.stringify(data.topics) : undefined,
    } as any,
  })

  return episode
}

/**
 * Delete a program episode
 */
export async function deleteProgramEpisode(
  episodeId: string,
  programId: string,
  organizationId: string
) {
  const program = await getProgramById(programId, organizationId)
  if (!program) {
    throw new Error('Program not found')
  }

  await prisma.programEpisode.delete({
    where: { id: episodeId },
  })

  return { success: true }
}

/**
 * Get program statistics
 */
export async function getProgramStats(organizationId: string) {
  const [total, active, scheduled, aired] = await Promise.all([
    prisma.program.count({ where: { organizationId } }),
    prisma.program.count({
      where: { organizationId, isActive: true },
    }),
    prisma.programEpisode.count({
      where: {
        program: { organizationId },
        status: 'SCHEDULED',
      },
    }),
    prisma.programEpisode.count({
      where: {
        program: { organizationId },
        status: 'AIRED',
      },
    }),
  ])

  return {
    total,
    active,
    scheduled,
    aired,
  }
}

/**
 * Get upcoming programs for the organization
 */
export async function getUpcomingPrograms(
  organizationId: string,
  days: number = 7
) {
  const now = new Date()
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

  const episodes = await prisma.programEpisode.findMany({
    where: {
      program: { organizationId },
      airDate: {
        gte: now,
        lte: future,
      },
      status: 'SCHEDULED',
    },
    include: {
      program: true,
    },
    orderBy: {
      airDate: 'asc',
    },
  })

  return episodes
}
