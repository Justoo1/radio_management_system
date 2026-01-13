'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Radio,
  Clock,
  DollarSign,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  ChevronRight,
  Check,
  AlertCircle,
  Loader,
  ArrowLeft,
} from 'lucide-react'

interface Package {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  price: number
  currency: string
}

interface BookingFormProps {
  organizationName: string
  organizationSlug: string
  packages: Package[]
}

const GUEST_TYPES = [
  { value: 'PREACHER', label: 'Preacher / Religious Leader' },
  { value: 'ADVERTISER', label: 'Advertiser / Business' },
  { value: 'TALK_SHOW_HOST', label: 'Talk Show Host' },
  { value: 'MUSICIAN', label: 'Musician / Artist' },
  { value: 'PODCAST_HOST', label: 'Podcast Host' },
  { value: 'OTHER', label: 'Other' },
]

export default function BookingForm({
  organizationName,
  organizationSlug,
  packages,
}: BookingFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form data
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestType: 'OTHER',
    programTitle: '',
    programDescription: '',
    requestedDate: '',
    requestedStartTime: '',
  })

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`
  }

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPackage(pkg)
    setStep(2)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPackage) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/public/airtime/${organizationSlug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          ...formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking')
      }

      // Redirect to payment page
      router.push(`/book/${organizationSlug}/pay/${data.data.bookingRef}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-cyan-500/30 to-blue-600/30 p-3 rounded-xl border border-cyan-400/30 backdrop-blur">
              <Radio className="w-8 h-8 text-cyan-300" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Book Airtime
          </h1>
          <p className="text-slate-400 text-lg">{organizationName}</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  s === step
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : s < step
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-slate-500'
                }`}
              >
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              <span className={`text-sm hidden sm:block ${s === step ? 'text-white' : 'text-slate-500'}`}>
                {s === 1 ? 'Select Package' : s === 2 ? 'Your Details' : 'Payment'}
              </span>
              {s < 3 && <ChevronRight className="w-4 h-4 text-slate-600" />}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Step 1: Package Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-6 text-center">Choose Your Package</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => handlePackageSelect(pkg)}
                  className="group relative text-left"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-cyan-500/50 transition-all duration-300">
                    <h3 className="text-lg font-bold text-white mb-2">{pkg.name}</h3>
                    {pkg.description && (
                      <p className="text-slate-400 text-sm mb-4">{pkg.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <span>{formatDuration(pkg.durationMinutes)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xl font-bold text-white">
                        <span className="text-sm text-slate-400">{pkg.currency}</span>
                        {pkg.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Booking Form */}
        {step === 2 && selectedPackage && (
          <div>
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Packages
            </button>

            {/* Selected Package Summary */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Selected Package</p>
                  <p className="font-bold text-white">{selectedPackage.name}</p>
                  <p className="text-sm text-slate-400">{formatDuration(selectedPackage.durationMinutes)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Amount</p>
                  <p className="text-xl font-bold text-emerald-300">
                    {selectedPackage.currency} {selectedPackage.price.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-400" />
                  Contact Information
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="guestName"
                      value={formData.guestName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Guest Type *
                    </label>
                    <select
                      name="guestType"
                      value={formData.guestType}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    >
                      {GUEST_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="guestEmail"
                      value={formData.guestEmail}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="guestPhone"
                      value={formData.guestPhone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="+233 XX XXX XXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Program Details */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  Program Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Program Title *
                    </label>
                    <input
                      type="text"
                      name="programTitle"
                      value={formData.programTitle}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="What will you be broadcasting?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      name="programDescription"
                      value={formData.programDescription}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                      placeholder="Brief description of your program..."
                    />
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  Preferred Schedule
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  Please select your preferred date and time. The station will confirm or suggest an alternative.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Preferred Date *
                    </label>
                    <input
                      type="date"
                      name="requestedDate"
                      value={formData.requestedDate}
                      onChange={handleInputChange}
                      required
                      min={getMinDate()}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Preferred Start Time *
                    </label>
                    <input
                      type="time"
                      name="requestedStartTime"
                      value={formData.requestedStartTime}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-200">
                <p className="font-medium mb-2">Important Notice:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-300/80">
                  <li>Payment is required before your booking is reviewed</li>
                  <li>The station will confirm your schedule within 24 hours</li>
                  <li>Refunds are processed if your booking is rejected</li>
                  <li>No refunds for no-shows - please be punctual</li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 py-4 rounded-xl font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue to Payment
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
