'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  Phone,
  MessageSquare,
  Radio,
  Globe,
  Smartphone,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

const sessionSchema = z.object({
  name: z.string().max(200).optional(),
  listenerName: z.string().optional(),
  listenerPhone: z.string().optional(),
  source: z.enum(['PHONE_CALL', 'SMS', 'WHATSAPP', 'WEBSITE', 'SOCIAL_MEDIA', 'MOBILE_APP', 'MIXED']),
  programId: z.string().optional(),
  notes: z.string().optional(),
});

type SessionFormData = z.infer<typeof sessionSchema>;

interface Program {
  id: string;
  name: string;
}

interface StartSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionCreated?: () => void;
}

const sourceOptions = [
  { value: 'PHONE_CALL', label: 'Phone Call', icon: Phone, color: 'from-blue-500/30 to-blue-600/30 border-blue-400/30 text-blue-300' },
  { value: 'SMS', label: 'SMS', icon: MessageSquare, color: 'from-purple-500/30 to-purple-600/30 border-purple-400/30 text-purple-300' },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare, color: 'from-green-500/30 to-green-600/30 border-green-400/30 text-green-300' },
  { value: 'WEBSITE', label: 'Website', icon: Globe, color: 'from-cyan-500/30 to-cyan-600/30 border-cyan-400/30 text-cyan-300' },
  { value: 'SOCIAL_MEDIA', label: 'Social Media', icon: Radio, color: 'from-pink-500/30 to-pink-600/30 border-pink-400/30 text-pink-300' },
  { value: 'MOBILE_APP', label: 'Mobile App', icon: Smartphone, color: 'from-orange-500/30 to-orange-600/30 border-orange-400/30 text-orange-300' },
  { value: 'MIXED', label: 'All Sources', icon: TrendingUp, color: 'from-indigo-500/30 to-indigo-600/30 border-indigo-400/30 text-indigo-300' },
];

export function StartSessionModal({ open, onOpenChange, onSessionCreated }: StartSessionModalProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
  } = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      source: 'MIXED',
    },
  });

  const selectedSource = watch('source');

  useEffect(() => {
    const fetchPrograms = async () => {
      setLoadingPrograms(true);
      try {
        const response = await fetch('/api/programs');
        if (response.ok) {
          const data = await response.json();
          setPrograms(data.data || data || []);
        }
      } catch (error) {
        console.error('Error fetching programs:', error);
      } finally {
        setLoadingPrograms(false);
      }
    };

    if (open) {
      fetchPrograms();
    }
  }, [open]);

  const onSubmit = async (data: SessionFormData) => {
    setLoading(true);
    try {
      // Use the new engagement session API
      const response = await fetch('/api/listener/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name || undefined,
          source: data.source,
          programId: data.programId || undefined,
          listenerName: data.listenerName || undefined,
          listenerPhone: data.listenerPhone || undefined,
          notes: data.notes || undefined,
        }),
      });

      if (response.ok) {
        toast.success('Engagement session started! You can now track listener interactions.');
        reset();
        onOpenChange(false);
        onSessionCreated?.();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to start session');
      }
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-slate-900/95 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
              <Users className="w-5 h-5 text-white" />
            </div>
            Start Engagement Session
          </DialogTitle>
          <DialogDescription>
            Track listener engagement from phone calls, SMS, WhatsApp, and more. You can increment counters in real-time as interactions happen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Session Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Session Name <span className="text-slate-500">(optional)</span>
            </label>
            <input
              {...register('name')}
              placeholder="e.g., Morning Show - Jan 6"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>

          {/* Source Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Primary Engagement Source
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {sourceOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedSource === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValue('source', option.value as any)}
                    className={`p-2 sm:p-3 rounded-xl border transition-all duration-200 flex flex-col items-center gap-1 sm:gap-2 ${
                      isSelected
                        ? `bg-gradient-to-br ${option.color} shadow-lg`
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-400'
                    }`}
                  >
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isSelected ? '' : 'text-slate-400'}`} />
                    <span className="text-[10px] sm:text-xs font-medium text-center leading-tight">{option.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Select "All Sources" to track all engagement types in one session.
            </p>
          </div>

          {/* Program Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Program <span className="text-slate-500">(optional)</span>
            </label>
            <select
              {...register('programId')}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all appearance-none"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
            >
              <option value="" className="bg-slate-900">No specific program</option>
              {loadingPrograms ? (
                <option disabled className="bg-slate-900">Loading programs...</option>
              ) : (
                programs.map((program) => (
                  <option key={program.id} value={program.id} className="bg-slate-900">
                    {program.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Listener Info (collapsed by default) */}
          <details className="group">
            <summary className="text-sm text-slate-400 cursor-pointer hover:text-white transition-colors">
              + Add notable listener info (optional)
            </summary>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Listener Name
                </label>
                <input
                  {...register('listenerName')}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Phone Number
                </label>
                <input
                  {...register('listenerPhone')}
                  placeholder="+233 XX XXX XXXX"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                />
              </div>
            </div>
          </details>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Notes <span className="text-slate-500">(optional)</span>
            </label>
            <textarea
              {...register('notes')}
              placeholder="Add any additional notes about this session..."
              rows={2}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none"
            />
          </div>

          <DialogFooter className="gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  Start Session
                </>
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
