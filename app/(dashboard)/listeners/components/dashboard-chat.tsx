'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getPusherClient, PUSHER_CHANNELS, PUSHER_EVENTS } from '@/lib/pusher/client';
import {
  MessageCircle,
  Send,
  Loader2,
  Pin,
  PinOff,
  Trash2,
  EyeOff,
  Eye,
  Flag,
  Users,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import type { PresenceChannel } from 'pusher-js';

interface ChatMessage {
  id: string;
  senderName: string;
  senderPhone?: string;
  message: string;
  isFromStaff: boolean;
  isPinned: boolean;
  status: string;
  createdAt: string;
  moderatedBy?: {
    id: string;
    name: string;
  };
}

interface ChatStats {
  total: number;
  visible: number;
  hidden: number;
  flagged: number;
  last24h: number;
}

export function DashboardChat() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden' | 'flagged'>('visible');
  const [onlineCount, setOnlineCount] = useState(0);
  const [connected, setConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const organizationSlug = (session?.user as any)?.organizationSlug || '';

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/listener/chat?status=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to Pusher
  useEffect(() => {
    if (!organizationSlug) return;

    const pusher = getPusherClient();
    if (!pusher) {
      setConnected(true);
      return;
    }

    const channelName = PUSHER_CHANNELS.chat(organizationSlug);
    const channel = pusher.subscribe(channelName) as PresenceChannel;

    channel.bind('pusher:subscription_succeeded', (members: any) => {
      setConnected(true);
      setOnlineCount(members.count);
    });

    channel.bind('pusher:member_added', () => {
      setOnlineCount((prev) => prev + 1);
    });

    channel.bind('pusher:member_removed', () => {
      setOnlineCount((prev) => Math.max(0, prev - 1));
    });

    // Chat events
    channel.bind(PUSHER_EVENTS.CHAT_MESSAGE, (data: ChatMessage) => {
      setMessages((prev) => [...prev, { ...data, status: 'VISIBLE' }]);
      setTimeout(scrollToBottom, 100);
    });

    channel.bind(PUSHER_EVENTS.CHAT_STAFF_MESSAGE, (data: ChatMessage) => {
      setMessages((prev) => [...prev, { ...data, status: 'VISIBLE' }]);
      setTimeout(scrollToBottom, 100);
    });

    channel.bind(PUSHER_EVENTS.CHAT_MESSAGE_DELETED, (data: { id: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.id));
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [organizationSlug, scrollToBottom]);

  // Send staff message
  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/listener/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.trim() }),
      });

      if (response.ok) {
        setNewMessage('');
        toast.success('Message sent');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send');
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Moderate message
  const handleModerate = async (id: string, action: string) => {
    try {
      const response = await fetch(`/api/listener/chat/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        toast.success(`Message ${action}ed`);
        fetchMessages();
      } else {
        toast.error('Action failed');
      }
    } catch (error) {
      toast.error('Action failed');
    }
  };

  // Delete message
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message permanently?')) return;

    try {
      const response = await fetch(`/api/listener/chat/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Message deleted');
        setMessages((prev) => prev.filter((m) => m.id !== id));
      } else {
        toast.error('Delete failed');
      }
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-600/10 to-pink-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-white/30 transition-all overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-500/30 to-pink-600/30 rounded-xl border border-purple-400/30">
              <MessageCircle className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="font-bold text-white">Live Chat</h3>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                {connected && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {onlineCount} online
                  </span>
                )}
                {stats && (
                  <span>{stats.last24h} messages today</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-white/10 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
            >
              <option value="all" className="bg-slate-900">All ({stats?.total || 0})</option>
              <option value="visible" className="bg-slate-900">Visible ({stats?.visible || 0})</option>
              <option value="hidden" className="bg-slate-900">Hidden ({stats?.hidden || 0})</option>
              <option value="flagged" className="bg-slate-900">Flagged ({stats?.flagged || 0})</option>
            </select>

            <button
              onClick={fetchMessages}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
              <p>No messages</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`group/msg p-3 rounded-xl transition-colors ${
                  msg.status === 'HIDDEN' ? 'bg-slate-500/10 opacity-60' :
                  msg.status === 'FLAGGED' ? 'bg-amber-500/10 border border-amber-500/30' :
                  msg.isFromStaff ? 'bg-purple-500/10' : 'bg-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium text-sm ${msg.isFromStaff ? 'text-purple-400' : 'text-white'}`}>
                        {msg.senderName}
                      </span>
                      {msg.isFromStaff && (
                        <span className="px-1.5 py-0.5 bg-purple-500/30 rounded text-[10px] text-purple-300">
                          STAFF
                        </span>
                      )}
                      {msg.isPinned && (
                        <Pin className="w-3 h-3 text-amber-400" />
                      )}
                      <span className="text-[10px] text-slate-500">{formatTime(msg.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-300 break-words">{msg.message}</p>
                    {msg.senderPhone && (
                      <p className="text-xs text-slate-500 mt-1">{msg.senderPhone}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                    {msg.isPinned ? (
                      <button
                        onClick={() => handleModerate(msg.id, 'unpin')}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Unpin"
                      >
                        <PinOff className="w-4 h-4 text-slate-400" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleModerate(msg.id, 'pin')}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Pin"
                      >
                        <Pin className="w-4 h-4 text-slate-400" />
                      </button>
                    )}

                    {msg.status === 'VISIBLE' ? (
                      <button
                        onClick={() => handleModerate(msg.id, 'hide')}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Hide"
                      >
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleModerate(msg.id, 'show')}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Show"
                      >
                        <Eye className="w-4 h-4 text-slate-400" />
                      </button>
                    )}

                    <button
                      onClick={() => handleModerate(msg.id, 'flag')}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                      title="Flag"
                    >
                      <Flag className="w-4 h-4 text-amber-400" />
                    </button>

                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Send a message as station..."
              maxLength={500}
              className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="p-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
