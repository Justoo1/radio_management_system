'use client';

import { useState, useEffect, useCallback } from 'react';

interface NotificationPreferences {
  notifyRequests: boolean;
  notifyChat: boolean;
  notifyPayments: boolean;
  notifySystem: boolean;
}

interface PushSubscriptionInfo {
  id: string;
  endpoint: string;
  deviceName?: string;
  notifyRequests: boolean;
  notifyChat: boolean;
  notifyPayments: boolean;
  notifySystem: boolean;
  createdAt: string;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<PushSubscriptionInfo[]>([]);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const supported =
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;

      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);

        // Check if already subscribed
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (err) {
          console.error('[Push] Error checking subscription:', err);
        }
      }
    };

    checkSupport();
  }, []);

  // Fetch existing subscriptions
  const fetchSubscriptions = useCallback(async () => {
    try {
      const response = await fetch('/api/push/subscribe');
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      }
    } catch (err) {
      console.error('[Push] Error fetching subscriptions:', err);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (deviceName?: string): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        setError('Notification permission denied');
        setIsLoading(false);
        return false;
      }

      // Register service worker if not already registered
      let registration = await navigator.serviceWorker.getRegistration('/sw-push.js');
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw-push.js');
        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
      }

      // Get VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        setError('Push notifications not configured');
        setIsLoading(false);
        return false;
      }

      // Convert VAPID key to ArrayBuffer for PushManager
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          deviceName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }

      setIsSubscribed(true);
      await fetchSubscriptions();
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('[Push] Error subscribing:', err);
      setError(err.message || 'Failed to subscribe');
      setIsLoading(false);
      return false;
    }
  }, [isSupported, fetchSubscriptions]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe();

        // Remove from server
        await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
          method: 'DELETE',
        });
      }

      setIsSubscribed(false);
      await fetchSubscriptions();
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('[Push] Error unsubscribing:', err);
      setError(err.message || 'Failed to unsubscribe');
      setIsLoading(false);
      return false;
    }
  }, [fetchSubscriptions]);

  // Update notification preferences
  const updatePreferences = useCallback(
    async (subscriptionId: string, preferences: Partial<NotificationPreferences>): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/push/subscribe', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscriptionId,
            preferences,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update preferences');
        }

        await fetchSubscriptions();
        setIsLoading(false);
        return true;
      } catch (err: any) {
        console.error('[Push] Error updating preferences:', err);
        setError(err.message || 'Failed to update preferences');
        setIsLoading(false);
        return false;
      }
    },
    [fetchSubscriptions]
  );

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    error,
    subscriptions,
    subscribe,
    unsubscribe,
    updatePreferences,
    refreshSubscriptions: fetchSubscriptions,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
