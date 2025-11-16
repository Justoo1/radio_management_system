/**
 * Programs Store (Zustand)
 * Manages programs list and filters
 */

import { create } from 'zustand'

export interface Program {
  id: string
  organizationId: string
  name: string
  description?: string
  genre?: string
  host?: string
  image?: string
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  createdAt: Date
  updatedAt: Date
}

export interface Schedule {
  id: string
  programId: string
  dayOfWeek: number // 0-6
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  isActive: boolean
}

export interface Episode {
  id: string
  programId: string
  title: string
  description?: string
  airDate: Date
  duration: number // in minutes
  status: 'SCHEDULED' | 'AIRED' | 'CANCELLED'
  recordingUrl?: string
}

export interface ProgramFilter {
  search?: string
  genre?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  sortBy?: 'name' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface ProgramsState {
  programs: Program[]
  schedules: Schedule[]
  episodes: Episode[]
  selectedProgram: Program | null
  filters: ProgramFilter
  isLoading: boolean
  error: string | null
  totalCount: number

  // Actions
  setPrograms: (programs: Program[]) => void
  addProgram: (program: Program) => void
  updateProgram: (id: string, data: Partial<Program>) => void
  deleteProgram: (id: string) => void
  setSelectedProgram: (program: Program | null) => void

  setSchedules: (schedules: Schedule[]) => void
  addSchedule: (schedule: Schedule) => void
  updateSchedule: (id: string, data: Partial<Schedule>) => void
  deleteSchedule: (id: string) => void

  setEpisodes: (episodes: Episode[]) => void
  addEpisode: (episode: Episode) => void
  updateEpisode: (id: string, data: Partial<Episode>) => void
  deleteEpisode: (id: string) => void

  setFilters: (filters: Partial<ProgramFilter>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setTotalCount: (count: number) => void
  clearError: () => void
}

export const useProgramsStore = create<ProgramsState>((set) => ({
  programs: [],
  schedules: [],
  episodes: [],
  selectedProgram: null,
  filters: {},
  isLoading: false,
  error: null,
  totalCount: 0,

  setPrograms: (programs) =>
    set({
      programs,
      error: null,
    }),

  addProgram: (program) =>
    set((state) => ({
      programs: [program, ...state.programs],
      totalCount: state.totalCount + 1,
    })),

  updateProgram: (id, data) =>
    set((state) => ({
      programs: state.programs.map((p) =>
        p.id === id ? { ...p, ...data } : p
      ),
      selectedProgram:
        state.selectedProgram?.id === id
          ? { ...state.selectedProgram, ...data }
          : state.selectedProgram,
    })),

  deleteProgram: (id) =>
    set((state) => ({
      programs: state.programs.filter((p) => p.id !== id),
      selectedProgram:
        state.selectedProgram?.id === id ? null : state.selectedProgram,
      totalCount: state.totalCount - 1,
    })),

  setSelectedProgram: (program) =>
    set({
      selectedProgram: program,
    }),

  setSchedules: (schedules) =>
    set({
      schedules,
    }),

  addSchedule: (schedule) =>
    set((state) => ({
      schedules: [schedule, ...state.schedules],
    })),

  updateSchedule: (id, data) =>
    set((state) => ({
      schedules: state.schedules.map((s) =>
        s.id === id ? { ...s, ...data } : s
      ),
    })),

  deleteSchedule: (id) =>
    set((state) => ({
      schedules: state.schedules.filter((s) => s.id !== id),
    })),

  setEpisodes: (episodes) =>
    set({
      episodes,
    }),

  addEpisode: (episode) =>
    set((state) => ({
      episodes: [episode, ...state.episodes],
    })),

  updateEpisode: (id, data) =>
    set((state) => ({
      episodes: state.episodes.map((e) =>
        e.id === id ? { ...e, ...data } : e
      ),
    })),

  deleteEpisode: (id) =>
    set((state) => ({
      episodes: state.episodes.filter((e) => e.id !== id),
    })),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  setLoading: (isLoading) =>
    set({
      isLoading,
    }),

  setError: (error) =>
    set({
      error,
    }),

  setTotalCount: (count) =>
    set({
      totalCount: count,
    }),

  clearError: () =>
    set({
      error: null,
    }),
}))
