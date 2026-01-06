/**
 * Pusher Server Client
 * Used to trigger events from API routes and server actions
 *
 * Free tier: 200K messages/day, 100 concurrent connections
 * Get credentials at: https://dashboard.pusher.com
 */

import Pusher from 'pusher';

// Singleton pattern to avoid creating multiple instances
let pusherInstance: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (!pusherInstance) {
    if (
      !process.env.PUSHER_APP_ID ||
      !process.env.PUSHER_KEY ||
      !process.env.PUSHER_SECRET ||
      !process.env.PUSHER_CLUSTER
    ) {
      console.warn('Pusher credentials not configured. Real-time features will be disabled.');
      // Return a mock pusher that does nothing
      return {
        trigger: async () => ({}),
        triggerBatch: async () => ({}),
      } as any;
    }

    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }

  return pusherInstance;
}

// Channel naming convention for multi-tenancy
export const PUSHER_CHANNELS = {
  // Organization-scoped channels
  organization: (orgId: string) => `private-org-${orgId}`,
  listeners: (orgId: string) => `private-org-${orgId}-listeners`,
  requests: (orgId: string) => `private-org-${orgId}-requests`,
  onair: (orgId: string) => `private-org-${orgId}-onair`,
  // Public chat channel (presence channel for user tracking)
  chat: (orgSlug: string) => `presence-chat-${orgSlug}`,
};

// Event types
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

// Helper function to trigger events safely
export async function triggerPusherEvent(
  channel: string,
  event: string,
  data: any
): Promise<void> {
  try {
    const pusher = getPusherServer();
    await pusher.trigger(channel, event, data);
  } catch (error) {
    console.error('Failed to trigger Pusher event:', error);
    // Don't throw - we don't want to break the main flow if real-time fails
  }
}

// Helper for triggering listener-related events
export async function triggerListenerEvent(
  organizationId: string,
  event: string,
  data: any
): Promise<void> {
  await triggerPusherEvent(
    PUSHER_CHANNELS.listeners(organizationId),
    event,
    data
  );
}

// Helper for triggering request-related events
export async function triggerRequestEvent(
  organizationId: string,
  event: string,
  data: any
): Promise<void> {
  await triggerPusherEvent(
    PUSHER_CHANNELS.requests(organizationId),
    event,
    data
  );
}

// Helper for triggering chat events (uses org slug for public access)
export async function triggerChatEvent(
  organizationSlug: string,
  event: string,
  data: any
): Promise<void> {
  await triggerPusherEvent(
    PUSHER_CHANNELS.chat(organizationSlug),
    event,
    data
  );
}

// Helper for triggering on-air events
export async function triggerOnAirEvent(
  organizationId: string,
  event: string,
  data: any
): Promise<void> {
  await triggerPusherEvent(
    PUSHER_CHANNELS.onair(organizationId),
    event,
    data
  );
}

// Helper for triggering organization-wide notifications
export async function triggerNotification(
  organizationId: string,
  notification: {
    type: 'request' | 'chat' | 'payment' | 'system';
    title: string;
    message: string;
    data?: any;
  }
): Promise<void> {
  await triggerPusherEvent(
    PUSHER_CHANNELS.organization(organizationId),
    PUSHER_EVENTS.NOTIFICATION,
    {
      ...notification,
      timestamp: new Date().toISOString(),
    }
  );
}
