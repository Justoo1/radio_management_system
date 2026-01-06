/**
 * Service Worker for Push Notifications
 * Handles incoming push notifications and click events
 */

// Listen for push events
self.addEventListener('push', function (event) {
  if (!event.data) {
    console.log('[SW Push] Push event with no data');
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    console.error('[SW Push] Failed to parse push data:', e);
    return;
  }

  const { title, body, icon, badge, tag, data, actions } = payload;

  const options = {
    body: body || 'You have a new notification',
    icon: icon || '/icons/icon-192x192.png',
    badge: badge || '/icons/badge-72x72.png',
    tag: tag || 'default',
    data: data || {},
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: actions || [],
  };

  event.waitUntil(self.registration.showNotification(title || 'Notification', options));
});

// Handle notification click
self.addEventListener('notificationclick', function (event) {
  console.log('[SW Push] Notification clicked:', event.notification.tag);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  // Handle different actions
  if (action === 'dismiss' || action === 'later') {
    return;
  }

  // Default action or 'view'/'pay' action - open the URL
  const urlToOpen = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Check if there's already a window/tab open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        // If we find a matching client, focus it and navigate
        if (client.url.includes(self.location.origin)) {
          client.focus();
          if (urlToOpen !== '/') {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      // If no existing window, open a new one
      return clients.openWindow(urlToOpen);
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', function (event) {
  console.log('[SW Push] Notification closed:', event.notification.tag);
});

// Log service worker activation
self.addEventListener('activate', function (event) {
  console.log('[SW Push] Service Worker activated');
});

// Log service worker installation
self.addEventListener('install', function (event) {
  console.log('[SW Push] Service Worker installed');
  self.skipWaiting();
});
