/**
 * Program Calendar View Page
 * Calendar view of radio programs with elegant dark theme
 */

'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'

interface Program {
  id: string
  name: string
  duration: number
  genre?: string
  hostId?: string
  host?: { id: string; name: string }
}

interface Schedule {
  id: string
  programId: string
  program?: Program
  startTime: string // HH:MM
  endTime: string // HH:MM
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  isActive: boolean
}

interface ProgramSchedule {
  id: string
  name: string
  host: string
  startTime: string // HH:MM
  endTime: string // HH:MM
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  genre: string
}

export default function ProgramCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [schedules, setSchedules] = useState<ProgramSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all programs and their schedules
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch all programs
        const programsRes = await fetch('/api/programs?pageSize=100')
        if (!programsRes.ok) throw new Error('Failed to fetch programs')
        const programsData = await programsRes.json()
        const programs: Program[] = programsData.data || []

        // Fetch schedules for each program
        const allSchedules: ProgramSchedule[] = []
        for (const program of programs) {
          const schedulesRes = await fetch(`/api/programs/${program.id}/schedules`)
          if (schedulesRes.ok) {
            const schedulesData = await schedulesRes.json()
            const programSchedules = (schedulesData.data || []).map((schedule: Schedule) => ({
              id: schedule.id,
              name: program.name,
              host: program.host?.name || 'Unknown Host',
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              dayOfWeek: schedule.dayOfWeek,
              genre: program.genre || 'General',
            }))
            allSchedules.push(...programSchedules)
          }
        }

        setSchedules(allSchedules)
      } catch (err) {
        console.error('Failed to fetch schedules:', err)
        setError(err instanceof Error ? err.message : 'Failed to load schedules')
      } finally {
        setLoading(false)
      }
    }

    fetchSchedules()
  }, [])

  // Keep fallback data if needed
  const fallbackSchedules: ProgramSchedule[] = [
    {
      id: '1',
      name: 'Morning Drive Time',
      host: 'John Mensah',
      startTime: '06:00',
      endTime: '09:00',
      dayOfWeek: 1, // Monday
      genre: 'Talk/News',
    },
    {
      id: '2',
      name: 'Morning Drive Time',
      host: 'John Mensah',
      startTime: '06:00',
      endTime: '09:00',
      dayOfWeek: 2, // Tuesday
      genre: 'Talk/News',
    },
    {
      id: '3',
      name: 'Morning Drive Time',
      host: 'John Mensah',
      startTime: '06:00',
      endTime: '09:00',
      dayOfWeek: 3, // Wednesday
      genre: 'Talk/News',
    },
    {
      id: '4',
      name: 'Afternoon Vibes',
      host: 'Sarah Osei',
      startTime: '14:00',
      endTime: '17:00',
      dayOfWeek: 1, // Monday
      genre: 'Music',
    },
    {
      id: '5',
      name: 'Afternoon Vibes',
      host: 'Sarah Osei',
      startTime: '14:00',
      endTime: '17:00',
      dayOfWeek: 2, // Tuesday
      genre: 'Music',
    },
    {
      id: '6',
      name: 'Afternoon Vibes',
      host: 'Sarah Osei',
      startTime: '14:00',
      endTime: '17:00',
      dayOfWeek: 3, // Wednesday
      genre: 'Music',
    },
    {
      id: '7',
      name: 'Evening News Hour',
      host: 'Robert Boafo',
      startTime: '18:00',
      endTime: '19:00',
      dayOfWeek: 0, // Sunday
      genre: 'News',
    },
    {
      id: '8',
      name: 'Evening News Hour',
      host: 'Robert Boafo',
      startTime: '18:00',
      endTime: '19:00',
      dayOfWeek: 1, // Monday
      genre: 'News',
    },
    {
      id: '9',
      name: 'Evening News Hour',
      host: 'Robert Boafo',
      startTime: '18:00',
      endTime: '19:00',
      dayOfWeek: 2, // Tuesday
      genre: 'News',
    },
    {
      id: '10',
      name: 'Late Night Sessions',
      host: 'DJ Alex',
      startTime: '21:00',
      endTime: '23:00',
      dayOfWeek: 5, // Friday
      genre: 'Music',
    },
    {
      id: '11',
      name: 'Late Night Sessions',
      host: 'DJ Alex',
      startTime: '21:00',
      endTime: '23:00',
      dayOfWeek: 6, // Saturday
      genre: 'Music',
    },
  ]

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayTimes = ['06:00', '09:00', '12:00', '14:00', '17:00', '18:00', '21:00', '23:59']

  // Use fetched data, fallback to empty if no data
  const displaySchedules = schedules.length > 0 ? schedules : fallbackSchedules

  const daySchedules = useMemo(() => {
    if (selectedDay === null) return []
    return displaySchedules.filter((s) => s.dayOfWeek === selectedDay)
  }, [selectedDay])

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    setSelectedDay(null)
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    setSelectedDay(null)
  }

  const genreColors: Record<string, string> = {
    'Talk/News': 'bg-blue-500/30 text-blue-300 border-blue-500/50',
    'Music': 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50',
    'News': 'bg-purple-500/30 text-purple-300 border-purple-500/50',
    'Entertainment': 'bg-pink-500/30 text-pink-300 border-pink-500/50',
    'Sports': 'bg-orange-500/30 text-orange-300 border-orange-500/50',
    'Religious': 'bg-indigo-500/30 text-indigo-300 border-indigo-500/50',
    'Educational': 'bg-cyan-500/30 text-cyan-300 border-cyan-500/50',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/programs" className="flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Programs
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Program Schedule
          </h1>
          <p className="text-slate-400 text-lg">View your weekly program calendar and schedule</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white/10 border border-white/20 rounded-xl p-8 text-center">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading schedule data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-8 text-red-300 text-sm">
            Failed to load schedules: {error}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Weekly Grid */}
          <div className="lg:col-span-2">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 p-6 overflow-x-auto">
                {/* Weekly Schedule Table */}
                <div className="min-w-full">
                  <div className="grid grid-cols-8 gap-0 mb-4">
                    {/* Time Column Header */}
                    <div className="col-span-1 text-xs font-semibold text-slate-400 pb-4 border-b border-white/10"></div>

                    {/* Day Headers */}
                    {dayNames.map((day, idx) => (
                      <div
                        key={day}
                        onClick={() => setSelectedDay(idx)}
                        className={`col-span-1 text-xs font-semibold text-center pb-4 border-b cursor-pointer transition-colors ${
                          selectedDay === idx
                            ? 'border-purple-500 text-purple-400'
                            : 'border-white/10 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        {day.substring(0, 3)}
                      </div>
                    ))}
                  </div>

                  {/* Time slots and programs */}
                  {dayTimes.slice(0, -1).map((time) => (
                    <div key={time} className="grid grid-cols-8 gap-0 border-b border-white/10">
                      {/* Time Label */}
                      <div className="col-span-1 text-xs text-slate-500 py-4 font-medium">{time}</div>

                      {/* Day Cells */}
                      {dayNames.map((_, dayIdx) => {
                        const daySchedule = schedules.filter(
                          (s) =>
                            s.dayOfWeek === dayIdx &&
                            s.startTime === time
                        )

                        return (
                          <div
                            key={`${dayIdx}-${time}`}
                            className={`col-span-1 py-4 px-1 cursor-pointer transition-colors ${
                              selectedDay === dayIdx ? 'bg-purple-500/10 border-l-2 border-purple-500' : ''
                            }`}
                          >
                            {daySchedule.map((program) => {
                              const colorClass = genreColors[program.genre] || genreColors['Music']
                              return (
                                <Link
                                  key={program.id}
                                  href={`/programs/${program.id}`}
                                  className={`inline-block w-full px-1 py-1 rounded text-xs font-semibold border backdrop-blur mb-1 hover:opacity-80 transition-opacity truncate ${colorClass}`}
                                  title={`${program.name} - ${program.startTime} to ${program.endTime}`}
                                >
                                  <span className="block truncate">{program.name.split(' ')[0]}</span>
                                </Link>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Day Details */}
          <div className="space-y-6">
            {/* Legend */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-4">Genre Legend</h3>
                <div className="space-y-2">
                  {Object.entries(genreColors).map(([genre, colors]) => (
                    <div key={genre} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${colors.split(' ')[0]}`} />
                      <span className="text-sm text-slate-400">{genre}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Day Details */}
            {selectedDay !== null && (
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">{dayNames[selectedDay]}</h3>
                    <button
                      onClick={() => setSelectedDay(null)}
                      className="text-xs text-slate-400 hover:text-slate-300"
                    >
                      Clear
                    </button>
                  </div>

                  {daySchedules.length === 0 ? (
                    <p className="text-sm text-slate-400">No programs scheduled</p>
                  ) : (
                    <div className="space-y-3">
                      {daySchedules.map((program) => {
                        const colorClass = genreColors[program.genre] || genreColors['Music']
                        return (
                          <Link
                            key={program.id}
                            href={`/programs/${program.id}`}
                            className={`block p-3 rounded-lg border backdrop-blur transition-all hover:shadow-lg ${colorClass}`}
                          >
                            <p className="font-semibold text-sm">{program.name}</p>
                            <p className="text-xs opacity-80 mt-1">
                              {program.startTime} - {program.endTime}
                            </p>
                            <p className="text-xs opacity-80">Host: {program.host}</p>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-4">Week Statistics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-sm text-slate-400">Total Programs</span>
                    <span className="text-sm font-semibold text-white">{schedules.length}</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-sm text-slate-400">Weekday Programs</span>
                    <span className="text-sm font-semibold text-blue-400">{schedules.filter(s => s.dayOfWeek >= 1 && s.dayOfWeek <= 5).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Weekend Programs</span>
                    <span className="text-sm font-semibold text-emerald-400">{schedules.filter(s => s.dayOfWeek === 0 || s.dayOfWeek === 6).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
