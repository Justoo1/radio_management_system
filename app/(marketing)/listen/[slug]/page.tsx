'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Radio,
  Music,
  Heart,
  Megaphone,
  HelpCircle,
  MessageCircle,
  Trophy,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Phone,
  User,
  Mail,
  FileText,
  MessagesSquare,
  Sparkles,
  X,
} from 'lucide-react';
import { LiveChat } from './components/live-chat';

// Local storage key for user name
const LISTENER_NAME_KEY = 'rms_listener_name';

const requestSchema = z.object({
  listenerName: z.string().min(1, 'Name is required').max(100),
  listenerPhone: z.string().min(1, 'Phone number is required').max(20),
  listenerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  requestType: z.enum(['SONG_REQUEST', 'DEDICATION', 'SHOUTOUT', 'QUESTION', 'COMMENT', 'CONTEST_ENTRY']),
  songTitle: z.string().max(200).optional(),
  songArtist: z.string().max(200).optional(),
  message: z.string().max(500, 'Message too long (max 500 characters)').optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

interface OrganizationInfo {
  name: string;
  slug: string;
  logo?: string;
}

const requestTypes = [
  { value: 'SONG_REQUEST', label: 'Song Request', icon: Music, color: 'from-blue-500 to-cyan-500', description: 'Request a song to be played' },
  { value: 'DEDICATION', label: 'Dedication', icon: Heart, color: 'from-pink-500 to-rose-500', description: 'Dedicate a song to someone special' },
  { value: 'SHOUTOUT', label: 'Shoutout', icon: Megaphone, color: 'from-orange-500 to-amber-500', description: 'Get a shoutout on air' },
  { value: 'QUESTION', label: 'Question', icon: HelpCircle, color: 'from-purple-500 to-violet-500', description: 'Ask a question to the host' },
  { value: 'COMMENT', label: 'Comment', icon: MessageCircle, color: 'from-emerald-500 to-teal-500', description: 'Share your thoughts' },
  { value: 'CONTEST_ENTRY', label: 'Contest Entry', icon: Trophy, color: 'from-yellow-500 to-orange-500', description: 'Enter a contest' },
];

export default function PublicListenerPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [organization, setOrganization] = useState<OrganizationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'request' | 'chat'>('chat');
  const [userName, setUserName] = useState<string>('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [nameLoaded, setNameLoaded] = useState(false);

  // Load saved name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem(LISTENER_NAME_KEY);
    if (savedName) {
      setUserName(savedName);
    } else {
      setShowNameModal(true);
    }
    setNameLoaded(true);
  }, []);

  // Save name to localStorage and state
  const handleSaveName = useCallback((name: string) => {
    const trimmedName = name.trim();
    if (trimmedName) {
      localStorage.setItem(LISTENER_NAME_KEY, trimmedName);
      setUserName(trimmedName);
      setShowNameModal(false);
    }
  }, []);

  // Handle name change from chat component
  const handleUserNameChange = useCallback((newName: string) => {
    handleSaveName(newName);
  }, [handleSaveName]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      requestType: 'SONG_REQUEST',
    },
  });

  const selectedType = watch('requestType');

  // Fetch organization info
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch(`/api/public/organization/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setOrganization(data);
        } else {
          setError('Station not found');
        }
      } catch (err) {
        setError('Failed to load station information');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchOrganization();
    }
  }, [slug]);

  const onSubmit = async (data: RequestFormData) => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/public/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          organizationSlug: slug,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        reset();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit request');
      }
    } catch (err) {
      setError('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Station Not Found</h1>
          <p className="text-slate-400">
            The station you&apos;re looking for doesn&apos;t exist or is not accepting requests at this time.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Request Submitted!</h1>
          <p className="text-slate-300 mb-8">
            Thank you for your request! The station has received your message and will review it shortly.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-lg"
          >
            Send Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 mb-6">
            <Radio className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">{organization?.name}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Connect With Us
          </h1>
          <p className="text-lg text-slate-300 max-w-xl mx-auto">
            Join the live chat or send a request!
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-1.5 border border-white/20 inline-flex gap-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <MessagesSquare className="w-5 h-5" />
              Live Chat
            </button>
            <button
              onClick={() => setActiveTab('request')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === 'request'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText className="w-5 h-5" />
              Send Request
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto">
          {/* Live Chat Tab */}
          {activeTab === 'chat' && nameLoaded && (
            <LiveChat
              organizationSlug={slug}
              userName={userName || 'Listener'}
              onUserNameChange={handleUserNameChange}
            />
          )}

          {/* Request Form Tab */}
          {activeTab === 'request' && (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 sm:p-8 shadow-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Request Type Selection */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  What would you like to do?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {requestTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setValue('requestType', type.value as any)}
                        className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                          isSelected
                            ? `bg-gradient-to-br ${type.color} border-transparent shadow-lg scale-[1.02]`
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                        <p className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {type.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Your Name *
                  </label>
                  <input
                    {...register('listenerName')}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  />
                  {errors.listenerName && (
                    <p className="mt-1 text-sm text-red-400">{errors.listenerName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number *
                  </label>
                  <input
                    {...register('listenerPhone')}
                    placeholder="+233 XX XXX XXXX"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  />
                  {errors.listenerPhone && (
                    <p className="mt-1 text-sm text-red-400">{errors.listenerPhone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email <span className="text-slate-500">(optional)</span>
                </label>
                <input
                  {...register('listenerEmail')}
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                />
                {errors.listenerEmail && (
                  <p className="mt-1 text-sm text-red-400">{errors.listenerEmail.message}</p>
                )}
              </div>

              {/* Song Info (for song request/dedication) */}
              {(selectedType === 'SONG_REQUEST' || selectedType === 'DEDICATION') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      <Music className="w-4 h-4 inline mr-2" />
                      Song Title
                    </label>
                    <input
                      {...register('songTitle')}
                      placeholder="Enter song title"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Artist
                    </label>
                    <input
                      {...register('songArtist')}
                      placeholder="Artist name"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <MessageCircle className="w-4 h-4 inline mr-2" />
                  {selectedType === 'DEDICATION' ? 'Dedication Message' :
                   selectedType === 'SHOUTOUT' ? 'Shoutout Message' :
                   selectedType === 'QUESTION' ? 'Your Question' :
                   selectedType === 'CONTEST_ENTRY' ? 'Your Entry' :
                   'Your Message'}
                  <span className="text-slate-500 ml-1">(optional)</span>
                </label>
                <textarea
                  {...register('message')}
                  rows={4}
                  placeholder={
                    selectedType === 'DEDICATION' ? 'Write your dedication message here...' :
                    selectedType === 'SHOUTOUT' ? 'Who do you want to shout out?' :
                    selectedType === 'QUESTION' ? 'What would you like to ask?' :
                    selectedType === 'CONTEST_ENTRY' ? 'Enter your contest answer...' :
                    'Share your thoughts...'
                  }
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none"
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-400">{errors.message.message}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">Maximum 500 characters</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Request
                  </>
                )}
              </button>
            </form>
          </div>
          )}

          {/* Footer */}
          <p className="text-center text-slate-500 text-sm mt-6">
            Powered by Radio Management System
          </p>
        </div>
      </div>

      {/* Welcome Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-purple-900/90 to-slate-900 rounded-3xl border border-white/20 p-8 shadow-2xl">
            {/* Close button - only show if user already has a name */}
            {userName && (
              <button
                onClick={() => setShowNameModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome to the Chat!
              </h2>
              <p className="text-slate-400">
                Enter your name so other listeners and the station staff can see who you are.
              </p>
            </div>

            {/* Name Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Your Name
                </label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tempName.trim()) {
                      handleSaveName(tempName);
                    }
                  }}
                  placeholder="Enter your name"
                  maxLength={50}
                  autoFocus
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-lg"
                />
                <p className="mt-1 text-xs text-slate-500">
                  This will be saved in your browser for future visits.
                </p>
              </div>

              <button
                onClick={() => handleSaveName(tempName)}
                disabled={!tempName.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageCircle className="w-5 h-5" />
                Join the Chat
              </button>

              {/* Skip option */}
              {!userName && (
                <button
                  onClick={() => {
                    setUserName('Listener');
                    setShowNameModal(false);
                  }}
                  className="w-full text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Continue as Guest
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
