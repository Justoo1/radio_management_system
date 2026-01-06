'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Link2, Copy, Check, ExternalLink, QrCode, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareableLinkProps {
  className?: string;
}

export function ShareableLink({ className = '' }: ShareableLinkProps) {
  const { data: session } = useSession();
  const [copied, setCopied] = useState(false);

  // Get organization slug from session
  const organizationSlug = (session?.user as any)?.organizationSlug || '';

  // Build the public link
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const publicLink = `${baseUrl}/listen/${organizationSlug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Send us a request!',
          text: 'Connect with our station - send song requests, dedications, and more!',
          url: publicLink,
        });
      } catch (error) {
        // User cancelled or error
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      handleCopy();
    }
  };

  if (!organizationSlug) {
    return null;
  }

  return (
    <div className={`group relative ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-orange-600/20 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity" />
      <div className="relative bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/30 hover:border-purple-300/50 transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Icon & Title */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Link2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Public Request Link</h3>
              <p className="text-sm text-slate-400">Share with your listeners</p>
            </div>
          </div>

          {/* Link Display */}
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <span className="text-purple-400 flex-shrink-0">
                <Link2 className="w-4 h-4" />
              </span>
              <span className="text-slate-300 text-sm truncate font-mono">
                {publicLink}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  copied
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium text-sm transition-all shadow-lg"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>

              <a
                href={publicLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20 rounded-xl font-medium text-sm transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Preview</span>
              </a>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-slate-500">
            <strong className="text-slate-400">Tip:</strong> Share this link on social media, WhatsApp groups, or during your broadcast to let listeners send requests, dedications, and shoutouts directly to your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
