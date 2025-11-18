/**
 * Account Settings Page
 * Manage user profile, password, and email settings
 */

'use client'

import { useState, useEffect } from 'react'
import { Save, CheckCircle, AlertCircle, Mail, Lock } from 'lucide-react'
import { FormInput } from '@/components/settings/form-input'
import { FormSection } from '@/components/settings/form-section'
import { SettingsCard } from '@/components/settings/settings-card'
import {
  updateProfile,
  changePassword,
  requestEmailChange,
  getAccountInfo,
} from '@/app/actions/account'

interface FormErrors {
  [key: string]: string
}

export default function AccountSettingsPage() {

  // Profile State
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileErrors, setProfileErrors] = useState<FormErrors>({})
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<FormErrors>({})
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Email State
  const [emailData, setEmailData] = useState({
    newEmail: '',
    confirmEmail: '',
  })
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailErrors, setEmailErrors] = useState<FormErrors>({})
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load account info on mount
  useEffect(() => {
    loadAccountInfo()
  }, [])

  const loadAccountInfo = async () => {
    try {
      setProfileLoading(true)
      const response = await getAccountInfo()

      if (response.success && response.data) {
        const [firstName, lastName] = response.data.name.split(' ')
        setProfileData({
          firstName: firstName || '',
          lastName: lastName || '',
          email: response.data.email,
          phone: response.data.phone || '',
        })
        setEmailData({
          newEmail: response.data.email,
          confirmEmail: response.data.email,
        })
      }
    } catch (error) {
      console.error('Failed to load account info:', error)
      setProfileMessage({
        type: 'error',
        text: 'Failed to load account information',
      })
    } finally {
      setProfileLoading(false)
    }
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (profileErrors[name]) {
      setProfileErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEmailData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (emailErrors[name]) {
      setEmailErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSaving(true)
    setProfileErrors({})
    setProfileMessage(null)

    try {
      const result = await updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
      })

      if (result.success) {
        setProfileMessage({
          type: 'success',
          text: 'Profile updated successfully',
        })
        setTimeout(() => setProfileMessage(null), 3000)
      } else {
        setProfileMessage({
          type: 'error',
          text: result.error || result.message,
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setProfileMessage({
        type: 'error',
        text: errorMessage,
      })
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordSaving(true)
    setPasswordErrors({})
    setPasswordMessage(null)

    try {
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      })

      if (result.success) {
        setPasswordMessage({
          type: 'success',
          text: 'Password changed successfully',
        })
        // Reset form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        setTimeout(() => setPasswordMessage(null), 3000)
      } else {
        setPasswordMessage({
          type: 'error',
          text: result.error || result.message,
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setPasswordMessage({
        type: 'error',
        text: errorMessage,
      })
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailSaving(true)
    setEmailErrors({})
    setEmailMessage(null)

    try {
      const result = await requestEmailChange({
        newEmail: emailData.newEmail,
        confirmEmail: emailData.confirmEmail,
      })

      if (result.success) {
        setEmailMessage({
          type: 'success',
          text: result.message,
        })
        setTimeout(() => setEmailMessage(null), 5000)
      } else {
        setEmailMessage({
          type: 'error',
          text: result.error || result.message,
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setEmailMessage({
        type: 'error',
        text: errorMessage,
      })
    } finally {
      setEmailSaving(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading account information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <SettingsCard>
        <FormSection
          title="Profile Information"
          description="Update your personal information"
        >
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {profileMessage && (
              <div
                className={`p-4 border rounded-xl text-sm flex items-center gap-2 ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-red-500/20 border-red-500/50 text-red-300'
                }`}
              >
                {profileMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {profileMessage.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                id="firstName"
                name="firstName"
                type="text"
                label="First Name"
                value={profileData.firstName}
                onChange={handleProfileChange}
                error={profileErrors.firstName}
              />
              <FormInput
                id="lastName"
                name="lastName"
                type="text"
                label="Last Name"
                value={profileData.lastName}
                onChange={handleProfileChange}
                error={profileErrors.lastName}
              />
            </div>

            <FormInput
              id="email"
              name="email"
              type="email"
              label="Email Address"
              value={profileData.email}
              onChange={handleProfileChange}
              disabled
              error={profileErrors.email}
            />

            <FormInput
              id="phone"
              name="phone"
              type="tel"
              label="Phone Number"
              value={profileData.phone}
              onChange={handleProfileChange}
              error={profileErrors.phone}
              placeholder="+1 (555) 123-4567"
            />

            <button
              type="submit"
              disabled={profileSaving}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </FormSection>
      </SettingsCard>

      {/* Password Section */}
      <SettingsCard>
        <FormSection
          title="Change Password"
          description="Update your account password for better security"
        >
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            {passwordMessage && (
              <div
                className={`p-4 border rounded-xl text-sm flex items-center gap-2 ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-red-500/20 border-red-500/50 text-red-300'
                }`}
              >
                {passwordMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {passwordMessage.text}
              </div>
            )}

            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-300">Security Tip:</p>
                  <p className="text-blue-400 mt-1">
                    Use a strong password with uppercase, lowercase, numbers, and special characters.
                  </p>
                </div>
              </div>
            </div>

            <FormInput
              id="currentPassword"
              name="currentPassword"
              type="password"
              label="Current Password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              error={passwordErrors.currentPassword}
            />

            <FormInput
              id="newPassword"
              name="newPassword"
              type="password"
              label="New Password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              error={passwordErrors.newPassword}
            />

            <FormInput
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="Confirm Password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              error={passwordErrors.confirmPassword}
            />

            <button
              type="submit"
              disabled={passwordSaving}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </FormSection>
      </SettingsCard>

      {/* Email Section */}
      <SettingsCard>
        <FormSection
          title="Change Email Address"
          description="Update your account email address"
        >
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            {emailMessage && (
              <div
                className={`p-4 border rounded-xl text-sm flex items-center gap-2 ${
                  emailMessage.type === 'success'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-red-500/20 border-red-500/50 text-red-300'
                }`}
              >
                {emailMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {emailMessage.text}
              </div>
            )}

            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-300">Note:</p>
                  <p className="text-blue-400 mt-1">
                    You will receive a verification link at your new email address to confirm the change.
                  </p>
                </div>
              </div>
            </div>

            <FormInput
              id="newEmail"
              name="newEmail"
              type="email"
              label="New Email Address"
              value={emailData.newEmail}
              onChange={handleEmailChange}
              error={emailErrors.newEmail}
            />

            <FormInput
              id="confirmEmail"
              name="confirmEmail"
              type="email"
              label="Confirm Email Address"
              value={emailData.confirmEmail}
              onChange={handleEmailChange}
              error={emailErrors.confirmEmail}
            />

            <button
              type="submit"
              disabled={emailSaving}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail className="w-4 h-4" />
              {emailSaving ? 'Updating...' : 'Update Email'}
            </button>
          </form>
        </FormSection>
      </SettingsCard>

      {/* Two-Factor Authentication Info */}
      <SettingsCard>
        <FormSection
          title="Two-Factor Authentication"
          description="Add an extra layer of security to your account"
        >
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
            <div>
              <p className="font-medium text-white">Status: Not Enabled</p>
              <p className="text-sm text-slate-400 mt-1">Protect your account with an authenticator app or SMS</p>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-indigo-600/40 to-purple-600/40 hover:from-indigo-600/60 hover:to-purple-600/60 border border-indigo-500/30 text-indigo-200 rounded-lg font-semibold transition-all duration-300">
              Enable 2FA
            </button>
          </div>
        </FormSection>
      </SettingsCard>
    </div>
  )
}
