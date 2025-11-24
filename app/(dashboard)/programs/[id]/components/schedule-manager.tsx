/**
 * Schedule Manager Component
 * Manage program schedules (days, times, recurring patterns)
 */

'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit2, CheckCircle, AlertCircle, X } from 'lucide-react'

interface Schedule {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isRecurring: boolean
  startDate?: string
  endDate?: string
  notes?: string
  isActive: boolean
}

interface ScheduleManagerProps {
  programId: string
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function ScheduleManager({ programId }: ScheduleManagerProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    dayOfWeek: 0,
    startTime: '06:00',
    endTime: '09:00',
    isRecurring: true,
    notes: '',
    isActive: true,
  })

  // Load schedules on mount
  useEffect(() => {
    if (!programId) return
    fetchSchedules()
  }, [programId])

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/programs/${programId}/schedules`)
      if (response.ok) {
        const data = await response.json()
        setSchedules(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
      setMessage({ type: 'error', text: 'Failed to load schedules' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation
    const [startHour, startMin] = formData.startTime.split(':').map(Number)
    const [endHour, endMin] = formData.endTime.split(':').map(Number)
    const startTotalMins = startHour * 60 + startMin
    const endTotalMins = endHour * 60 + endMin

    if (endTotalMins <= startTotalMins) {
      setMessage({ type: 'error', text: 'End time must be after start time' })
      return
    }

    try {
      const method = editingId ? 'PATCH' : 'POST'
      const url = editingId
        ? `/api/programs/${programId}/schedules/${editingId}`
        : `/api/programs/${programId}/schedules`

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save schedule')
      }

      await fetchSchedules()
      setShowForm(false)
      setEditingId(null)
      setFormData({
        dayOfWeek: 0,
        startTime: '06:00',
        endTime: '09:00',
        isRecurring: true,
        notes: '',
        isActive: true,
      })
      setMessage({ type: 'success', text: editingId ? 'Schedule updated' : 'Schedule added' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Failed to save schedule:', error)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save schedule' })
    }
  }

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Delete this schedule?')) return

    try {
      const response = await fetch(`/api/programs/${programId}/schedules/${scheduleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete schedule')
      }

      await fetchSchedules()
      setMessage({ type: 'success', text: 'Schedule deleted' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Failed to delete schedule:', error)
      setMessage({ type: 'error', text: 'Failed to delete schedule' })
    }
  }

  const handleEdit = (schedule: Schedule) => {
    setEditingId(schedule.id)
    setFormData({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      isRecurring: schedule.isRecurring,
      notes: schedule.notes || '',
      isActive: schedule.isActive,
    })
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      dayOfWeek: 0,
      startTime: '06:00',
      endTime: '09:00',
      isRecurring: true,
      notes: '',
      isActive: true,
    })
  }

  if (loading) {
    return (
      <div className="bg-white/10 rounded-xl border border-white/20 p-6">
        <h3 className="font-semibold text-white mb-4">Program Schedule</h3>
        <div className="text-center py-4 text-slate-400">Loading schedules...</div>
      </div>
    )
  }

  return (
    <div className="bg-white/10 rounded-xl border border-white/20 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-white">Program Schedule</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition"
          >
            <Plus size={16} />
            Add Schedule
          </button>
        )}
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`p-3 rounded-lg mb-4 flex items-center gap-2 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
              : 'bg-red-500/20 border border-red-500/50 text-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {message.text}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-800/50 rounded-lg p-4 mb-4 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Day of Week */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Day of Week *
              </label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
              >
                {DAYS.map((day, idx) => (
                  <option key={idx} value={idx} className="bg-slate-900">
                    {day}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Start Time (HH:MM) *
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                required
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                End Time (HH:MM) *
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Notes
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g., Studio A, Special episode"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-slate-500"
              />
            </div>

            {/* Recurring */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="w-4 h-4 rounded bg-white/10 border border-white/20 text-purple-600 cursor-pointer"
                />
                <span className="text-sm text-slate-300">Recurring Weekly</span>
              </label>
            </div>

            {/* Active */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded bg-white/10 border border-white/20 text-purple-600 cursor-pointer"
                />
                <span className="text-sm text-slate-300">Active</span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition"
            >
              {editingId ? 'Update' : 'Add'} Schedule
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          {showForm ? 'Add a schedule above' : 'No schedules added yet. Click "Add Schedule" to get started.'}
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between border border-slate-700 hover:border-slate-600 transition"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-white">
                    {DAYS[schedule.dayOfWeek]}
                  </span>
                  <span className="text-slate-400">
                    {schedule.startTime} - {schedule.endTime}
                  </span>
                  {schedule.isRecurring && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                      Weekly
                    </span>
                  )}
                  {!schedule.isActive && (
                    <span className="px-2 py-0.5 bg-slate-600/50 text-slate-400 text-xs rounded-full">
                      Inactive
                    </span>
                  )}
                  {schedule.notes && (
                    <span className="text-xs text-slate-500 italic">• {schedule.notes}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(schedule)}
                  className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(schedule.id)}
                  className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {schedules.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-slate-400">
          <p>{schedules.length} schedule{schedules.length !== 1 ? 's' : ''} configured</p>
        </div>
      )}
    </div>
  )
}
