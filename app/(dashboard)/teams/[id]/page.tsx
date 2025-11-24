/**
 * Team Detail & Management Page
 * View and manage team details, members, and programs
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Trash2, Users, AlertCircle, CheckCircle, X } from 'lucide-react'
import { useParams } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  image?: string
}

interface TeamMember {
  id: string
  userId: string
  role: string
  title?: string
  bio?: string
  user: User
  isActive: boolean
  joinedAt: string
}

interface Team {
  id: string
  name: string
  description: string
  teamType: string
  teamLeadId?: string
  teamLead?: User
  status: string
  isActive: boolean
  members: TeamMember[]
  programs: any[]
  createdAt: string
}

export default function TeamDetailPage() {
  const { id } = useParams()
  const [team, setTeam] = useState<Team | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addingMember, setAddingMember] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teamType: '',
    teamLeadId: '',
    status: '',
  })

  const [memberForm, setMemberForm] = useState({
    userId: '',
    role: 'MEMBER',
    title: '',
  })

  // Load team and users
  useEffect(() => {
    if (id) {
      fetchTeam()
      fetchUsers()
    }
  }, [id])

  const fetchTeam = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/teams/${id}`)
      if (response.ok) {
        const data = await response.json()
        setTeam(data)
        setFormData({
          name: data.name,
          description: data.description || '',
          teamType: data.teamType,
          teamLeadId: data.teamLeadId || '',
          status: data.status,
        })
      }
    } catch (error) {
      console.error('Failed to fetch team:', error)
      setErrors({ fetch: 'Failed to load team' })
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?pageSize=100')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleMemberInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setMemberForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!team) return

    setSaving(true)
    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update team')
      }

      const updatedTeam = await response.json()
      setTeam(updatedTeam)
      setEditing(false)
      setMessage({ type: 'success', text: 'Team updated successfully' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update team',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!team || !memberForm.userId) return

    setAddingMember(true)
    try {
      const response = await fetch(`/api/teams/${team.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberForm),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add member')
      }

      // Refresh team
      await fetchTeam()
      setMemberForm({ userId: '', role: 'MEMBER', title: '' })
      setMessage({ type: 'success', text: 'Member added successfully' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to add member',
      })
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!team || !confirm('Remove this member from the team?')) return

    try {
      const response = await fetch(`/api/teams/${team.id}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove member')
      }

      await fetchTeam()
      setMessage({ type: 'success', text: 'Member removed successfully' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to remove member',
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <div className="relative z-10 p-8">
          <Link href="/teams" className="flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Teams
          </Link>
          <div className="text-center">
            <p className="text-slate-400">Team not found</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/teams" className="flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Teams
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">{team.name}</h1>
          <p className="text-slate-400">Manage team details and members</p>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm flex items-center justify-between border ${
              message.type === 'success'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-red-500/20 border-red-500/50 text-red-300'
            }`}
          >
            <span className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {message.text}
            </span>
            <button onClick={() => setMessage(null)} className="text-lg font-semibold">
              ×
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Team Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Team Info Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8">
                {!editing ? (
                  <>
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <p className="text-sm text-slate-400 mb-2">Team Type</p>
                        <p className="text-2xl font-bold text-white mb-4">{team.teamType}</p>
                        {team.teamLead && (
                          <div>
                            <p className="text-sm text-slate-400 mb-1">Team Lead</p>
                            <p className="text-white">{team.teamLead.name}</p>
                          </div>
                        )}
                      </div>
                      <span
                        className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                          team.status === 'ACTIVE'
                            ? 'bg-emerald-500/30 text-emerald-300'
                            : 'bg-slate-500/30 text-slate-300'
                        }`}
                      >
                        {team.status}
                      </span>
                    </div>
                    <p className="text-slate-300 mb-6">{team.description}</p>
                    <button
                      onClick={() => setEditing(true)}
                      className="px-4 py-2 bg-purple-600/40 hover:bg-purple-600/60 text-purple-200 rounded-lg border border-purple-500/30 transition-all"
                    >
                      Edit Team
                    </button>
                  </>
                ) : (
                  <form onSubmit={handleSaveTeam} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Team Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Team Type</label>
                        <select
                          name="teamType"
                          value={formData.teamType}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
                        >
                          <option value="PROGRAM_TEAM">Program Team</option>
                          <option value="ENGINEERING">Engineering</option>
                          <option value="SALES">Sales</option>
                          <option value="OPERATIONS">Operations</option>
                          <option value="MARKETING">Marketing</option>
                          <option value="CONTENT">Content</option>
                          <option value="MANAGEMENT">Management</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                          <option value="ARCHIVED">Archived</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="px-4 py-2 bg-slate-600/40 hover:bg-slate-600/60 text-slate-300 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Add Member Section */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8">
                <h3 className="text-xl font-bold text-white mb-6">Add Team Member</h3>
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Member</label>
                      <select
                        name="userId"
                        value={memberForm.userId}
                        onChange={handleMemberInputChange}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
                      >
                        <option value="">Select a user</option>
                        {users
                          .filter(
                            (u) => !team.members.some((m) => m.userId === u.id)
                          )
                          .map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                      <select
                        name="role"
                        value={memberForm.role}
                        onChange={handleMemberInputChange}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="LEAD">Lead</option>
                        <option value="MANAGER">Manager</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                      <input
                        type="text"
                        name="title"
                        value={memberForm.title}
                        onChange={handleMemberInputChange}
                        placeholder="e.g., Producer"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={addingMember || !memberForm.userId}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold disabled:opacity-50"
                  >
                    {addingMember ? 'Adding...' : 'Add Member'}
                  </button>
                </form>
              </div>
            </div>

            {/* Team Members */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8">
                <h3 className="text-xl font-bold text-white mb-6">Team Members ({team.members.length})</h3>
                {team.members.length === 0 ? (
                  <p className="text-slate-400">No members yet</p>
                ) : (
                  <div className="space-y-3">
                    {team.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div>
                          <p className="font-medium text-white">{member.user.name}</p>
                          <p className="text-xs text-slate-400">{member.user.email}</p>
                          {member.title && <p className="text-sm text-purple-300 mt-1">{member.title}</p>}
                          <p className="text-xs text-slate-500 mt-1">
                            Role: <span className="font-semibold">{member.role}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
                <h4 className="font-semibold text-white mb-4">Quick Stats</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-slate-400 text-sm">Team Members</p>
                    <p className="text-2xl font-bold text-white">{team.members.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Programs</p>
                    <p className="text-2xl font-bold text-white">{team.programs?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Created</p>
                    <p className="text-white">{new Date(team.createdAt).toLocaleDateString()}</p>
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
