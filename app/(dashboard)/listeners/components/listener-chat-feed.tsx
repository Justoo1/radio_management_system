'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageSquare,
  Music,
  Heart,
  HelpCircle,
  Trophy,
  Phone,
  Mail,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export interface ListenerRequest {
  id: string;
  listenerName?: string;
  listenerPhone?: string;
  listenerEmail?: string;
  requestType: string;
  songTitle?: string;
  songArtist?: string;
  message?: string;
  status: string;
  source: string;
  createdAt: string;
}

interface ListenerChatFeedProps {
  requests: ListenerRequest[];
  onRefresh?: () => void;
}

const requestTypeConfig: Record<string, { icon: typeof MessageSquare; label: string; color: string }> = {
  SONG_REQUEST: { icon: Music, label: 'Song Request', color: 'from-blue-500/30 to-blue-600/30 border-blue-400/30 text-blue-300' },
  DEDICATION: { icon: Heart, label: 'Dedication', color: 'from-pink-500/30 to-pink-600/30 border-pink-400/30 text-pink-300' },
  SHOUTOUT: { icon: MessageSquare, label: 'Shoutout', color: 'from-purple-500/30 to-purple-600/30 border-purple-400/30 text-purple-300' },
  QUESTION: { icon: HelpCircle, label: 'Question', color: 'from-cyan-500/30 to-cyan-600/30 border-cyan-400/30 text-cyan-300' },
  COMMENT: { icon: MessageSquare, label: 'Comment', color: 'from-slate-500/30 to-slate-600/30 border-slate-400/30 text-slate-300' },
  CONTEST_ENTRY: { icon: Trophy, label: 'Contest Entry', color: 'from-yellow-500/30 to-orange-600/30 border-yellow-400/30 text-yellow-300' },
};

const sourceConfig: Record<string, { icon: typeof MessageSquare; label: string }> = {
  SMS: { icon: MessageSquare, label: 'SMS' },
  WHATSAPP: { icon: Phone, label: 'WhatsApp' },
  PHONE: { icon: Phone, label: 'Phone' },
  WEBSITE: { icon: Mail, label: 'Website' },
};

const statusConfig: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-yellow-500/20 border-yellow-500/30', text: 'text-yellow-400' },
  APPROVED: { bg: 'bg-green-500/20 border-green-500/30', text: 'text-green-400' },
  PLAYED: { bg: 'bg-blue-500/20 border-blue-500/30', text: 'text-blue-400' },
  READ_ON_AIR: { bg: 'bg-purple-500/20 border-purple-500/30', text: 'text-purple-400' },
  REJECTED: { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-400' },
  SPAM: { bg: 'bg-slate-500/20 border-slate-500/30', text: 'text-slate-400' },
};

export function ListenerChatFeed({ requests, onRefresh }: ListenerChatFeedProps) {
  const [filter, setFilter] = useState<string>('ALL');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const filteredRequests = requests.filter((req) => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return req.status === 'PENDING';
    if (filter === 'APPROVED') return ['APPROVED', 'PLAYED', 'READ_ON_AIR'].includes(req.status);
    return req.requestType === filter;
  });

  const handleApprove = async (requestId: string) => {
    setLoadingAction(requestId);
    try {
      const response = await fetch(`/api/onair/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });

      if (response.ok) {
        toast.success('Request approved');
        onRefresh?.();
      } else {
        toast.error('Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setLoadingAction(requestId);
    try {
      const response = await fetch(`/api/onair/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      });

      if (response.ok) {
        toast.success('Request rejected');
        onRefresh?.();
      } else {
        toast.error('Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setLoadingAction(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = requests.filter((r) => ['APPROVED', 'PLAYED', 'READ_ON_AIR'].includes(r.status)).length;

  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-600/10 to-pink-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-white/30 transition-all duration-300 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-500/30 to-pink-600/30 rounded-xl border border-purple-400/30">
                <MessageSquare className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Listener Requests</h3>
                <p className="text-sm text-slate-400">
                  {filteredRequests.length} {filter === 'ALL' ? 'total' : filter.toLowerCase()} requests
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'ALL', label: 'All' },
                { key: 'PENDING', label: 'Pending', count: pendingCount },
                { key: 'APPROVED', label: 'Approved', count: approvedCount },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filter === tab.key
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`px-1.5 py-0.5 rounded text-xs ${filter === tab.key ? 'bg-white/20' : 'bg-white/10'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length > 0 ? (
          <div className="max-h-[500px] overflow-y-auto divide-y divide-white/5">
            {filteredRequests.map((request) => {
              const typeConfig = requestTypeConfig[request.requestType] || requestTypeConfig.COMMENT;
              const srcConfig = sourceConfig[request.source] || sourceConfig.WEBSITE;
              const statConfig = statusConfig[request.status] || statusConfig.PENDING;
              const TypeIcon = typeConfig.icon;
              const SourceIcon = srcConfig.icon;

              return (
                <div
                  key={request.id}
                  className="p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Type Icon */}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${typeConfig.color} flex items-center justify-center flex-shrink-0`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h4 className="font-semibold text-white">
                            {request.listenerName || 'Anonymous'}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            {request.listenerPhone && (
                              <span className="text-sm text-slate-400">{request.listenerPhone}</span>
                            )}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${statConfig.bg} ${statConfig.text} border`}>
                              <SourceIcon className="w-3 h-3" />
                              {srcConfig.label}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${statConfig.bg} ${statConfig.text}`}>
                          {request.status}
                        </span>
                      </div>

                      {/* Type Badge */}
                      <div className={`inline-block px-2 py-1 rounded bg-gradient-to-br ${typeConfig.color} text-xs font-medium mb-2`}>
                        {typeConfig.label}
                      </div>

                      {/* Song Info */}
                      {request.songTitle && (
                        <div className="mb-2 p-2 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-sm font-medium text-white">{request.songTitle}</p>
                          {request.songArtist && (
                            <p className="text-xs text-slate-400">{request.songArtist}</p>
                          )}
                        </div>
                      )}

                      {/* Message */}
                      {request.message && (
                        <p className="text-sm text-slate-300 mb-3 leading-relaxed">
                          "{request.message}"
                        </p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                        </span>

                        {request.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(request.id)}
                              disabled={loadingAction === request.id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-sm font-medium transition-colors border border-green-500/30 disabled:opacity-50"
                            >
                              {loadingAction === request.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              disabled={loadingAction === request.id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/30 disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-lg text-slate-400 font-medium">No requests found</p>
            <p className="text-sm text-slate-500 mt-2">
              Listener requests will appear here in real-time
            </p>
          </div>
        )}

        {/* Quick Stats Footer */}
        <div className="p-4 border-t border-white/10 grid grid-cols-3 gap-4">
          <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20 text-center">
            <p className="text-xs text-yellow-400 mb-1">Pending</p>
            <p className="text-xl font-bold text-yellow-400">{pendingCount}</p>
          </div>
          <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20 text-center">
            <p className="text-xs text-green-400 mb-1">Approved</p>
            <p className="text-xl font-bold text-green-400">{approvedCount}</p>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-center">
            <p className="text-xs text-blue-400 mb-1">Total</p>
            <p className="text-xl font-bold text-blue-400">{requests.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
