/**
 * Program Schedules Page
 * Manage all schedules for a program
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ScheduleManager } from '../components/schedule-manager'

interface Program {
  id: string
  name: string
}

export default function ProgramSchedulesPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>('')
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadParams = async () => {
      const { id: programId } = await params
      setId(programId)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (!id) return

    const fetchProgram = async () => {
      try {
        const response = await fetch(`/api/programs/${id}`)
        if (response.ok) {
          const data = await response.json()
          setProgram(data)
        }
      } catch (error) {
        console.error('Failed to fetch program:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProgram()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-slate-400">Loading program schedules...</p>
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <div className="relative z-10 p-8">
          <Link href="/programs" className="flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Programs
          </Link>
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">Program not found</p>
            <Link href="/programs" className="text-purple-400 hover:text-purple-300">
              Return to Programs →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-pink-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/programs/${id}`} className="flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Program
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
              {program.name} - Schedules
            </h1>
            <p className="text-slate-400 text-lg">Manage when this program airs</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl">
          <ScheduleManager programId={id} />
        </div>
      </div>
    </div>
  )
}
