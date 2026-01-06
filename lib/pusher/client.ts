/**
 * Pusher Client
 * Used for real-time subscriptions in the browser
 */

import PusherClient from 'pusher-js';

// Singleton pattern
let pusherInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!pusherInstance) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) {
      console.warn('Pusher client credentials not configured. Real-time features will use polling.');
      return null;
    }

    pusherInstance = new PusherClient(key, {
      cluster,
      // For private channels, we need to set up auth
      authEndpoint: '/api/pusher/auth',
      // Optional: Enable stats for debugging
      // enableStats: true,
    });

    // Connection state logging (development only)
    if (process.env.NODE_ENV === 'development') {
      pusherInstance.connection.bind('state_change', (states: { current: string; previous: string }) => {
        console.log(`[Pusher] Connection state: ${states.previous} -> ${states.current}`);
      });
    }
  }

  return pusherInstance;
}

// Disconnect and cleanup
export function disconnectPusher(): void {
  if (pusherInstance) {
    pusherInstance.disconnect();
    pusherInstance = null;
  }
}

// Channel naming (must match server)
export const PUSHER_CHANNELS = {
  organization: (orgId: string) => `private-org-${orgId}`,
  listeners: (orgId: string) => `private-org-${orgId}-listeners`,
  requests: (orgId: string) => `private-org-${orgId}-requests`,
  onair: (orgId: string) => `private-org-${orgId}-onair`,
  // Public chat channel (presence channel for user tracking)
  chat: (orgSlug: string) => `presence-chat-${orgSlug}`,
};

// Event types (must match server)
export const PUSHER_EVENTS = {
  // Listener events
  SESSION_STARTED: 'session:started',
  SESSION_ENDED: 'session:ended',
  STATS_UPDATED: 'stats:updated',

  // Request events
  REQUEST_NEW: 'request:new',
  REQUEST_APPROVED: 'request:approved',
  REQUEST_REJECTED: 'request:rejected',

  // On-air events
  NOW_PLAYING_UPDATED: 'now-playing:updated',
  NOW_PLAYING_ENDED: 'now-playing:ended',
  QUEUE_UPDATED: 'queue:updated',
  QUEUE_ITEM_ADDED: 'queue:item:added',
  QUEUE_ITEM_REMOVED: 'queue:item:removed',
  QUEUE_REORDERED: 'queue:reordered',
  PROGRAM_STARTED: 'program:started',
  PROGRAM_ENDED: 'program:ended',

  // Chat events
  CHAT_MESSAGE: 'chat:message',
  CHAT_MESSAGE_DELETED: 'chat:message:deleted',
  CHAT_MESSAGE_PINNED: 'chat:message:pinned',
  CHAT_STAFF_MESSAGE: 'chat:staff:message',

  // Push notification events
  NOTIFICATION: 'notification',
};
