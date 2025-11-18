/**
 * Notifications Settings Page
 * Manage email and app notification preferences
 */

'use client'

import { useState } from 'react'
import { Save, CheckCircle, Mail, Bell } from 'lucide-react'
import { FormSection } from '@/components/settings/form-section'
import { SettingsCard } from '@/components/settings/settings-card'

interface NotificationPreferences {
  emailNotifications: {
    productUpdates: boolean
    weeklyDigest: boolean
    monthlyReport: boolean
    securityAlerts: boolean
    invoices: boolean
    billingReminders: boolean
  }
  appNotifications: {
    taskReminders: boolean
    teamMessages: boolean
    mentions: boolean
    systemUpdates: boolean
    activitySummary: boolean
  }
  emailFrequency: 'instant' | 'daily' | 'weekly' | 'never'
}

export default function NotificationsSettingsPage() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: {
      productUpdates: true,
      weeklyDigest: true,
      monthlyReport: true,
      securityAlerts: true,
      invoices: true,
      billingReminders: true,
    },
    appNotifications: {
      taskReminders: true,
      teamMessages: true,
      mentions: true,
      systemUpdates: false,
      activitySummary: true,
    },
    emailFrequency: 'daily',
  })

  const handleEmailToggle = (key: keyof NotificationPreferences['emailNotifications']) => {
    setPreferences((prev) => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [key]: !prev.emailNotifications[key],
      },
    }))
  }

  const handleAppToggle = (key: keyof NotificationPreferences['appNotifications']) => {
    setPreferences((prev) => ({
      ...prev,
      appNotifications: {
        ...prev.appNotifications,
        [key]: !prev.appNotifications[key],
      },
    }))
  }

  const handleFrequencyChange = (frequency: 'instant' | 'daily' | 'weekly' | 'never') => {
    setPreferences((prev) => ({
      ...prev,
      emailFrequency: frequency,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/notifications/preferences', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(preferences),
      // })

      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Success Message */}
      {saved && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-300 text-sm flex items-center gap-2 sticky top-20 z-50">
          <CheckCircle className="w-4 h-4" />
          Notification preferences saved successfully
        </div>
      )}

      {/* Email Notifications */}
      <SettingsCard>
        <FormSection
          title="Email Notifications"
          description="Manage what emails you receive from us"
        >
          <div className="space-y-4">
            {/* Product Updates */}
            <label className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications.productUpdates}
                  onChange={() => handleEmailToggle('productUpdates')}
                  className="w-4 h-4 rounded border-white/30 text-indigo-600 bg-white/10 cursor-pointer"
                />
                <div>
                  <p className="font-medium text-white">Product Updates</p>
                  <p className="text-xs text-slate-400 mt-0.5">Get notified about new features and improvements</p>
                </div>
              </div>
            </label>

            {/* Weekly Digest */}
            <label className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications.weeklyDigest}
                  onChange={() => handleEmailToggle('weeklyDigest')}
                  className="w-4 h-4 rounded border-white/30 text-indigo-600 bg-white/10 cursor-pointer"
                />
                <div>
                  <p className="font-medium text-white">Weekly Digest</p>
                  <p className="text-xs text-slate-400 mt-0.5">Receive a summary of your activity every week</p>
                </div>
              </div>
            </label>

            {/* Monthly Report */}
            <label className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications.monthlyReport}
                  onChange={() => handleEmailToggle('monthlyReport')}
                  className="w-4 h-4 rounded border-white/30 text-indigo-600 bg-white/10 cursor-pointer"
                />
                <div>
                  <p className="font-medium text-white">Monthly Report</p>
                  <p className="text-xs text-slate-400 mt-0.5">Get your monthly performance report</p>
                </div>
              </div>
            </label>

            {/* Security Alerts */}
            <label className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications.securityAlerts}
                  onChange={() => handleEmailToggle('securityAlerts')}
                  className="w-4 h-4 rounded border-white/30 text-indigo-600 bg-white/10 cursor-pointer"
                  disabled
                />
                <div>
                  <p className="font-medium text-white">Security Alerts</p>
                  <p className="text-xs text-slate-400 mt-0.5">Critical security notifications (always enabled)</p>
                </div>
              </div>
            </label>

            {/* Invoices */}
            <label className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications.invoices}
                  onChange={() => handleEmailToggle('invoices')}
                  className="w-4 h-4 rounded border-white/30 text-indigo-600 bg-white/10 cursor-pointer"
                  disabled
                />
                <div>
                  <p className="font-medium text-white">Invoices</p>
                  <p className="text-xs text-slate-400 mt-0.5">Receive invoices and receipts (always enabled)</p>
                </div>
              </div>
            </label>

            {/* Billing Reminders */}
            <label className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications.billingReminders}
                  onChange={() => handleEmailToggle('billingReminders')}
                  className="w-4 h-4 rounded border-white/30 text-indigo-600 bg-white/10 cursor-pointer"
                />
                <div>
                  <p className="font-medium text-white">Billing Reminders</p>
                  <p className="text-xs text-slate-400 mt-0.5">Get reminders before your subscription renews</p>
                </div>
              </div>
            </label>
          </div>
        </FormSection>
      </SettingsCard>

      {/* Email Frequency */}
      <SettingsCard>
        <FormSection
          title="Email Frequency"
          description="How often would you like to receive emails"
        >
          <div className="space-y-3">
            {[
              { value: 'instant' as const, label: 'Instant', description: 'Get notified immediately' },
              { value: 'daily' as const, label: 'Daily', description: 'Receive a daily digest' },
              { value: 'weekly' as const, label: 'Weekly', description: 'Get a weekly summary' },
              { value: 'never' as const, label: 'Never', description: 'Disable all emails' },
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-center p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors border-2 border-transparent"
                style={{
                  borderColor: preferences.emailFrequency === option.value ? '#818cf8' : 'transparent',
                }}
              >
                <input
                  type="radio"
                  name="emailFrequency"
                  value={option.value}
                  checked={preferences.emailFrequency === option.value}
                  onChange={() => handleFrequencyChange(option.value)}
                  className="w-4 h-4 text-indigo-600 bg-white/10 cursor-pointer"
                />
                <div className="ml-3">
                  <p className="font-medium text-white">{option.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </FormSection>
      </SettingsCard>

      {/* App Notifications */}
      <SettingsCard>
        <FormSection
          title="In-App Notifications"
          description="Manage push notifications and in-app alerts"
        >
          <div className="space-y-4">
            {/* Task Reminders */}
            <label className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.appNotifications.taskReminders}
                  onChange={() => handleAppToggle('taskReminders')}
                  className="w-4 h-4 rounded border-white/30 text-indigo-600 bg-white/10 cursor-pointer"
                />
                <div>
                  <p className="font-medium text-white">Task Reminders</p>
                  <p className="text-xs text-slate-400 mt-0.5">Get reminded about upcoming tasks</p>
                </div>
              </div>
            </label>

            {/* Team Messages */}
            <label className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.appNotifications.teamMessages}
                  onChange={() => handleAppToggle('teamMessages')}
                  className="w-4 h-4 rounded border-white/30 text-indigo-600 bg-white/10 cursor-pointer"
                />
                <div>
                  <p className="font-medium text-white">Team Messages</p>
                  <p className="text-xs text-slate-400 mt-0.5">Notifications for new team messages</p>
                </div>
              </div>
            </label>

            {/* Mentions */}
            <label className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.appNotifications.mentions}
                  onChange={() => handleAppToggle('mentions')}
                  className="w-4 h-4 rounded border-white/30 text-indigo-600 bg-white/10 cursor-pointer"
                />
                <div>
                  <p className="font-medium text-white">Mentions</p>
                  <p className="text-xs text-slate-400 mt-0.5">Get notified when you're mentioned</p>
                </div>
              </div>
            </label>

            {/* System Updates */}
            <label className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.appNotifications.systemUpdates}
                  onChange={() => handleAppToggle('systemUpdates')}
                  className="w-4 h-4 rounded border-white/30 text-indigo-600 bg-white/10 cursor-pointer"
                />
                <div>
                  <p className="font-medium text-white">System Updates</p>
                  <p className="text-xs text-slate-400 mt-0.5">Notifications about system updates and maintenance</p>
                </div>
              </div>
            </label>

            {/* Activity Summary */}
            <label className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.appNotifications.activitySummary}
                  onChange={() => handleAppToggle('activitySummary')}
                  className="w-4 h-4 rounded border-white/30 text-indigo-600 bg-white/10 cursor-pointer"
                />
                <div>
                  <p className="font-medium text-white">Activity Summary</p>
                  <p className="text-xs text-slate-400 mt-0.5">Daily summary of your platform activity</p>
                </div>
              </div>
            </label>
          </div>
        </FormSection>
      </SettingsCard>

      {/* Save Button */}
      <div className="sticky bottom-0 z-40 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pt-4 flex gap-4">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </form>
  )
}
