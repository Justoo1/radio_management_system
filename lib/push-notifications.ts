/**
 * Web Push Notifications Service
 * Handles sending push notifications to subscribed users
 */

import webpush from 'web-push';
import prisma from '@/lib/prisma';

// Initialize web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@radiostation.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export type NotificationType = 'request' | 'chat' | 'payment' | 'system';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    type: NotificationType;
    url?: string;
    [key: string]: any;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Send push notification to a specific subscription
 */
async function sendToSubscription(
  subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
  },
  payload: PushNotificationPayload
): Promise<boolean> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('[Push] VAPID keys not configured');
    return false;
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload),
      {
        TTL: 60 * 60 * 24, // 24 hours
        urgency: 'normal',
      }
    );
    return true;
  } catch (error: any) {
    // Handle expired/invalid subscriptions
    if (error.statusCode === 404 || error.statusCode === 410) {
      console.log('[Push] Subscription expired, removing:', subscription.endpoint.slice(0, 50));
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: subscription.endpoint },
      });
    } else {
      console.error('[Push] Failed to send notification:', error.message);
    }
    return false;
  }
}

/**
 * Send notification to all users in an organization
 */
export async function sendNotificationToOrganization(
  organizationId: string,
  payload: PushNotificationPayload,
  notificationType: NotificationType
): Promise<{ sent: number; failed: number }> {
  // Get notification preference field name
  const preferenceField = {
    request: 'notifyRequests',
    chat: 'notifyChat',
    payment: 'notifyPayments',
    system: 'notifySystem',
  }[notificationType];

  // Fetch all subscriptions for the organization with the notification type enabled
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      organizationId,
      [preferenceField]: true,
    },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  // Send to all subscriptions in parallel (with limit)
  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      sendToSubscription(
        {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
        {
          ...payload,
          data: {
            ...payload.data,
            type: notificationType,
          },
        }
      )
    )
  );

  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      sent++;
    } else {
      failed++;
    }
  });

  return { sent, failed };
}

/**
 * Send notification to a specific user
 */
export async function sendNotificationToUser(
  userId: string,
  payload: PushNotificationPayload,
  notificationType: NotificationType
): Promise<{ sent: number; failed: number }> {
  const preferenceField = {
    request: 'notifyRequests',
    chat: 'notifyChat',
    payment: 'notifyPayments',
    system: 'notifySystem',
  }[notificationType];

  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      userId,
      [preferenceField]: true,
    },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      sendToSubscription(
        {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
        {
          ...payload,
          data: {
            ...payload.data,
            type: notificationType,
          },
        }
      )
    )
  );

  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      sent++;
    } else {
      failed++;
    }
  });

  return { sent, failed };
}

/**
 * Send notification for new listener request
 */
export async function notifyNewRequest(
  organizationId: string,
  request: {
    listenerName?: string;
    requestType: string;
    songTitle?: string;
    message?: string;
  }
): Promise<void> {
  const title = 'New Listener Request';
  let body = '';

  if (request.requestType === 'SONG_REQUEST' && request.songTitle) {
    body = `${request.listenerName || 'A listener'} requested: ${request.songTitle}`;
  } else if (request.requestType === 'DEDICATION' && request.message) {
    body = `${request.listenerName || 'A listener'} sent a dedication`;
  } else {
    body = `${request.listenerName || 'A listener'} sent a ${request.requestType.toLowerCase().replace('_', ' ')}`;
  }

  await sendNotificationToOrganization(
    organizationId,
    {
      title,
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'request',
      data: {
        type: 'request',
        url: '/on-air',
      },
      actions: [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    },
    'request'
  );
}

/**
 * Send notification for new chat message
 */
export async function notifyChatMessage(
  organizationId: string,
  message: {
    senderName: string;
    message: string;
  }
): Promise<void> {
  await sendNotificationToOrganization(
    organizationId,
    {
      title: 'New Chat Message',
      body: `${message.senderName}: ${message.message.slice(0, 100)}${message.message.length > 100 ? '...' : ''}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'chat',
      data: {
        type: 'chat',
        url: '/listeners',
      },
    },
    'chat'
  );
}

/**
 * Send notification for payment due
 */
export async function notifyPaymentDue(
  organizationId: string,
  payment: {
    amount: number;
    currency: string;
    dueDate: Date;
  }
): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: payment.currency,
  }).format(payment.amount);

  await sendNotificationToOrganization(
    organizationId,
    {
      title: 'Payment Due',
      body: `Your subscription payment of ${formattedAmount} is due on ${payment.dueDate.toLocaleDateString()}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'payment',
      data: {
        type: 'payment',
        url: '/settings/billing',
      },
      actions: [
        { action: 'pay', title: 'Pay Now' },
        { action: 'later', title: 'Later' },
      ],
    },
    'payment'
  );
}

/**
 * Send system notification
 */
export async function notifySystem(
  organizationId: string,
  notification: {
    title: string;
    message: string;
    url?: string;
  }
): Promise<void> {
  await sendNotificationToOrganization(
    organizationId,
    {
      title: notification.title,
      body: notification.message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'system',
      data: {
        type: 'system',
        url: notification.url || '/',
      },
    },
    'system'
  );
}
