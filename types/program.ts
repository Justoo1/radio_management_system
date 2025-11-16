/**
 * Program Types
 */

export interface ProgramDTO {
  name: string
  description?: string
  genre?: string
  language?: string
  targetAudience?: string
  duration: number
  hostId?: string
  coHosts?: string[]
  thumbnailUrl?: string
  promoAudioUrl?: string
  isActive?: boolean
}

export interface ProgramScheduleDTO {
  programId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isRecurring?: boolean
  startDate?: Date
  endDate?: Date
  isActive?: boolean
  notes?: string
}

export interface ProgramEpisodeDTO {
  programId: string
  episodeNumber?: number
  title: string
  description?: string
  airDate: Date
  duration?: number
  audioFileUrl?: string
  transcript?: string
  guestNames?: string[]
  topics?: string[]
  status?: 'SCHEDULED' | 'RECORDED' | 'AIRED' | 'CANCELLED'
  notes?: string
}

export interface ProgramResponse {
  id: string
  organizationId: string
  name: string
  description?: string
  genre?: string
  language?: string
  targetAudience?: string
  duration: number
  hostId?: string
  coHosts?: string[]
  thumbnailUrl?: string
  promoAudioUrl?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProgramSchedule {
  id: string
  programId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isRecurring: boolean
  startDate?: Date
  endDate?: Date
  isActive: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface ProgramEpisode {
  id: string
  programId: string
  episodeNumber?: number
  title: string
  description?: string
  airDate: Date
  duration?: number
  audioFileUrl?: string
  transcript?: string
  guestNames?: string[]
  topics?: string[]
  status: 'SCHEDULED' | 'RECORDED' | 'AIRED' | 'CANCELLED'
  notes?: string
  createdAt: Date
  updatedAt: Date
}
