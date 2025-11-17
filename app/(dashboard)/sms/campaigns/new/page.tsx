/**
 * New SMS Campaign Form Page
 * Create and submit new SMS campaign with elegant dark theme
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Save, ArrowLeft, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react'

interface FormData {
  name: string
  description: string
  messageContent: string
  recipientCount: number
  scheduleType: 'immediate' | 'scheduled'
  scheduledDate?: string
  scheduledTime?: string
}

export default function NewSMSCampaignPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    messageContent: '',
    recipientCount: 0,
    scheduleType: 'immediate',
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [messageLength, setMessageLength] = useState(0)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target

    if (type === 'number') {
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value) || 0,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }

    if (name === 'messageContent') {
      setMessageLength(value.length)
    }

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }
    if (!formData.messageContent.trim()) {
      newErrors.messageContent = 'Message content is required'
    } else if (formData.messageContent.length < 5) {
      newErrors.messageContent = 'Message must be at least 5 characters'
    } else if (formData.messageContent.length > 160) {
      newErrors.messageContent = 'Message exceeds 160 character limit'
    }
    if (formData.recipientCount <= 0) {
      newErrors.recipientCount = 'Recipient count must be greater than 0'
    }

    if (formData.scheduleType === 'scheduled') {
      if (!formData.scheduledDate) {
        newErrors.scheduledDate = 'Schedule date is required'
      }
      if (!formData.scheduledTime) {
        newErrors.scheduledTime = 'Schedule time is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSaving(true)

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/sms/campaigns', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // })

      // Mock save
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSaved(true)

      // Reset form
      setFormData({
        name: '',
        description: '',
        messageContent: '',
        recipientCount: 0,
        scheduleType: 'immediate',
      })
      setMessageLength(0)

      // Redirect after 3 seconds
      setTimeout(() => {
        setSaved(false)
        window.location.href = '/sms/campaigns'
      }, 3000)
    } catch (error) {
      console.error('Failed to create campaign:', error)
      setErrors({ submit: 'Failed to create campaign. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const smsCharacterLimit = 160
  const charRemaining = smsCharacterLimit - messageLength
  const charWarning = charRemaining < 20

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/sms/campaigns" className="flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Campaigns
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Create SMS Campaign
          </h1>
          <p className="text-slate-400 text-lg">Launch a new SMS marketing campaign</p>
        </div>

        {/* Form Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-emerald-500/50 transition-all duration-300 p-8 space-y-6">
                {/* Success Message */}
                {saved && (
                  <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-300 text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    Campaign created successfully! Redirecting...
                  </div>
                )}

                {/* Error Message */}
                {errors.submit && (
                  <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {errors.submit}
                  </div>
                )}

                {/* Campaign Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Summer Promotion 2024"
                    className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300 hover:border-white/30 ${
                      errors.name ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-emerald-500'
                    }`}
                  />
                  {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the campaign objective and target audience..."
                    rows={3}
                    className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300 hover:border-white/30 resize-none ${
                      errors.description ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-emerald-500'
                    }`}
                  />
                  {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
                </div>

                {/* Message Content */}
                <div>
                  <label htmlFor="messageContent" className="block text-sm font-medium text-slate-300 mb-2">
                    Message Content *
                  </label>
                  <textarea
                    id="messageContent"
                    name="messageContent"
                    value={formData.messageContent}
                    onChange={handleChange}
                    placeholder="Type your SMS message here... (max 160 characters)"
                    rows={4}
                    maxLength={160}
                    className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300 hover:border-white/30 resize-none ${
                      errors.messageContent ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-emerald-500'
                    }`}
                  />
                  {errors.messageContent && <p className="text-red-400 text-sm mt-1">{errors.messageContent}</p>}
                  <div className={`mt-2 text-sm font-medium ${charWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {messageLength} / {smsCharacterLimit} characters {charWarning && '⚠️'}
                  </div>
                </div>

                {/* Recipient Count */}
                <div>
                  <label htmlFor="recipientCount" className="block text-sm font-medium text-slate-300 mb-2">
                    Number of Recipients *
                  </label>
                  <input
                    type="number"
                    id="recipientCount"
                    name="recipientCount"
                    min="1"
                    value={formData.recipientCount || ''}
                    onChange={handleChange}
                    placeholder="e.g., 500"
                    className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300 hover:border-white/30 ${
                      errors.recipientCount ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-emerald-500'
                    }`}
                  />
                  {errors.recipientCount && <p className="text-red-400 text-sm mt-1">{errors.recipientCount}</p>}
                </div>

                {/* Schedule Type */}
                <div>
                  <label htmlFor="scheduleType" className="block text-sm font-medium text-slate-300 mb-2">
                    Send Type
                  </label>
                  <select
                    id="scheduleType"
                    name="scheduleType"
                    value={formData.scheduleType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-white backdrop-blur transition-all duration-300 hover:border-white/30"
                  >
                    <option value="immediate" className="bg-slate-900 text-white">
                      Send Immediately
                    </option>
                    <option value="scheduled" className="bg-slate-900 text-white">
                      Schedule for Later
                    </option>
                  </select>
                </div>

                {/* Scheduled Date & Time */}
                {formData.scheduleType === 'scheduled' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="scheduledDate" className="block text-sm font-medium text-slate-300 mb-2">
                          Date
                        </label>
                        <input
                          type="date"
                          id="scheduledDate"
                          name="scheduledDate"
                          value={formData.scheduledDate || ''}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:border-transparent outline-none text-white backdrop-blur transition-all duration-300 hover:border-white/30 ${
                            errors.scheduledDate ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-emerald-500'
                          }`}
                        />
                        {errors.scheduledDate && <p className="text-red-400 text-sm mt-1">{errors.scheduledDate}</p>}
                      </div>
                      <div>
                        <label htmlFor="scheduledTime" className="block text-sm font-medium text-slate-300 mb-2">
                          Time
                        </label>
                        <input
                          type="time"
                          id="scheduledTime"
                          name="scheduledTime"
                          value={formData.scheduledTime || ''}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:border-transparent outline-none text-white backdrop-blur transition-all duration-300 hover:border-white/30 ${
                            errors.scheduledTime ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-emerald-500'
                          }`}
                        />
                        {errors.scheduledTime && <p className="text-red-400 text-sm mt-1">{errors.scheduledTime}</p>}
                      </div>
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Creating...' : 'Create Campaign'}
                  </button>
                  <Link
                    href="/sms/campaigns"
                    className="px-6 py-3 bg-white/10 border border-white/20 hover:border-white/40 text-slate-300 hover:text-white rounded-xl font-semibold transition-all duration-300"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            </form>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* SMS Guidelines */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-emerald-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-4">SMS Guidelines</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>Max 160 characters per SMS</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>Include clear call-to-action</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>Add opt-out instructions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>Avoid ALL CAPS text</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>Test message before sending</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Best Practices */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-emerald-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-4">Best Practices</h3>
                <ul className="space-y-2 text-xs text-slate-400 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong className="text-white">Timing:</strong> Send during business hours (9am-6pm)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong className="text-white">Frequency:</strong> Limit to 1-2 messages per week</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong className="text-white">Personalization:</strong> Use recipient names when possible</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span><strong className="text-white">Compliance:</strong> Always include unsubscribe option</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Template Tips */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-emerald-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-4">Example Templates</h3>
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="p-2 bg-white/5 rounded border border-white/10">
                    <p className="font-medium text-white mb-1">Promo</p>
                    <p>Save 20% on all programs! Reply YES to learn more. Reply STOP to opt out.</p>
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
