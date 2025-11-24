'use client';

import { useState } from 'react';
import { MessageSquare, Check, X, Heart, Music, Phone, Mail } from 'lucide-react';
import { ListenerRequestData } from '../hooks/use-onair-socket';
import { formatDistanceToNow } from 'date-fns';

interface LiveRequestsFeedProps {
  requests: ListenerRequestData[];
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

export function LiveRequestsFeed({
  requests,
  onApprove,
  onReject,
}: LiveRequestsFeedProps) {
  const [filter, setFilter] = useState<string>('PENDING');

  const filteredRequests = requests.filter((req) => {
    if (filter === 'ALL') return true;
    return req.status === filter;
  });

  const getRequestIcon = (type: string) => {
    switch (type) {
      case 'SONG_REQUEST':
        return <Music className="w-4 h-4" />;
      case 'DEDICATION':
        return <Heart className="w-4 h-4" />;
      case 'SHOUTOUT':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'SMS':
        return <MessageSquare className="w-3 h-3" />;
      case 'WHATSAPP':
        return <Phone className="w-3 h-3" />;
      case 'PHONE':
        return <Phone className="w-3 h-3" />;
      default:
        return <Mail className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'APPROVED':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'PLAYED':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 border border-slate-700 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl text-center font-bold text-white mb-1">Live Requests</h3>
          <p className="text-sm text-slate-400">
            {filteredRequests.length} {filter.toLowerCase()} request
            {filteredRequests.length === 1 ? '' : 's'}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {['PENDING', 'APPROVED', 'ALL'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg">No {filter.toLowerCase()} requests</p>
          <p className="text-sm mt-1">Listener requests will appear here in real-time</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-lg p-4 transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Request Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-400">
                  {getRequestIcon(request.requestType)}
                </div>

                {/* Request Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white">
                        {request.listenerName || 'Anonymous Listener'}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-slate-400">
                          {request.listenerPhone}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {getSourceIcon(request.source)}
                          {request.source}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>
                  </div>

                  {/* Request Type Badge */}
                  <div className="inline-block px-2 py-1 rounded bg-blue-600/20 text-blue-400 text-xs font-medium mb-2">
                    {request.requestType.replace('_', ' ')}
                  </div>

                  {/* Song Details (if song request) */}
                  {request.songTitle && (
                    <div className="mb-2 p-2 bg-slate-900/50 rounded">
                      <p className="text-sm font-medium text-white">
                        {request.songTitle}
                      </p>
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

                  {/* Time and Actions */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(request.createdAt), {
                        addSuffix: true,
                      })}
                    </span>

                    {request.status === 'PENDING' && (
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onApprove(request.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => onReject(request.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
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
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-yellow-600/10 rounded-lg p-3 border border-yellow-600/20">
          <p className="text-xs text-yellow-400 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">
            {requests.filter((r) => r.status === 'PENDING').length}
          </p>
        </div>
        <div className="bg-green-600/10 rounded-lg p-3 border border-green-600/20">
          <p className="text-xs text-green-400 mb-1">Approved</p>
          <p className="text-2xl font-bold text-green-400">
            {requests.filter((r) => r.status === 'APPROVED').length}
          </p>
        </div>
        <div className="bg-blue-600/10 rounded-lg p-3 border border-blue-600/20">
          <p className="text-xs text-blue-400 mb-1">Total</p>
          <p className="text-2xl font-bold text-blue-400">{requests.length}</p>
        </div>
      </div>
    </div>
  );
}
