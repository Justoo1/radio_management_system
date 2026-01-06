'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getPusherClient, PUSHER_CHANNELS, PUSHER_EVENTS } from '@/lib/pusher/client';
import {
  Send,
  MessageCircle,
  Users,
  Pin,
  Loader2,
  Radio,
  ChevronDown,
} from 'lucide-react';
import type { Channel, PresenceChannel } from 'pusher-js';

interface ChatMessage {
  id: string;
  senderName: string;
  message: string;
  isFromStaff: boolean;
  isPinned: boolean;
  createdAt: string;
}

interface LiveChatProps {
  organizationSlug: string;
  userName: string;
  onUserNameChange?: (name: string) => void;
}

export function LiveChat({ organizationSlug, userName, onUserNameChange }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<PresenceChannel | null>(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Handle scroll to show/hide scroll button
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  }, []);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/public/chat?slug=${organizationSlug}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
          setPinnedMessages(data.pinned || []);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [organizationSlug]);

  // Subscribe to Pusher channel
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) {
      setConnected(true); // Consider connected via polling fallback
      return;
    }

    const channelName = PUSHER_CHANNELS.chat(organizationSlug);
    const channel = pusher.subscribe(channelName) as PresenceChannel;
    channelRef.current = channel;

    // Connection events
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
      setMessages((prev) => [...prev, data]);
      setTimeout(scrollToBottom, 100);
    });

    channel.bind(PUSHER_EVENTS.CHAT_STAFF_MESSAGE, (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
      setTimeout(scrollToBottom, 100);
    });

    channel.bind(PUSHER_EVENTS.CHAT_MESSAGE_DELETED, (data: { id: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.id));
    });

    channel.bind(PUSHER_EVENTS.CHAT_MESSAGE_PINNED, (data: ChatMessage) => {
      setPinnedMessages((prev) => {
        const exists = prev.find((m) => m.id === data.id);
        if (exists) return prev;
        return [data, ...prev].slice(0, 3);
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [organizationSlug, scrollToBottom]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (!showScrollButton) {
      scrollToBottom();
    }
  }, [messages, showScrollButton, scrollToBottom]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/public/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationSlug,
          senderName: userName,
          message: newMessage.trim(),
        }),
      });

      if (response.ok) {
        setNewMessage('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Handle name change
  const handleNameSave = () => {
    if (tempName.trim() && tempName !== userName) {
      onUserNameChange?.(tempName.trim());
    }
    setEditingName(false);
  };

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[500px] bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Live Chat</h3>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {connected ? (
                <>
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>{onlineCount} online</span>
                </>
              ) : (
                <span>Connecting...</span>
              )}
            </div>
          </div>
        </div>

        {/* User name display/edit */}
        <div className="flex items-center gap-2">
          {editingName ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm text-white w-24"
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => {
                setTempName(userName);
                setEditingName(true);
              }}
              className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg text-xs text-slate-300 hover:bg-white/20 transition-colors"
            >
              <Users className="w-3 h-3" />
              {userName}
            </button>
          )}
        </div>
      </div>

      {/* Pinned Messages */}
      {pinnedMessages.length > 0 && (
        <div className="px-3 py-2 bg-amber-500/10 border-b border-amber-500/20">
          {pinnedMessages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-2 text-xs">
              <Pin className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-amber-400">{msg.senderName}:</span>
                <span className="text-slate-300 ml-1">{msg.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Radio className="w-12 h-12 mb-3 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Be the first to say hello!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isFromStaff ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                  msg.isFromStaff
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/10 text-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-medium ${
                      msg.isFromStaff ? 'text-white/80' : 'text-purple-400'
                    }`}
                  >
                    {msg.senderName}
                    {msg.isFromStaff && (
                      <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">
                        STAFF
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-500">{formatTime(msg.createdAt)}</span>
                </div>
                <p className="text-sm break-words">{msg.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-4 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-all"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* Input */}
      <div className="p-3 bg-white/5 border-t border-white/10">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            maxLength={300}
            className="flex-1 px-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm"
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
        <p className="mt-1 text-xs text-slate-500 text-right">{newMessage.length}/300</p>
      </div>
    </div>
  );
}
