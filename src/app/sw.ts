import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: '/~offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();

// ============================================================================
// PUSH NOTIFICATION HANDLERS
// ============================================================================

interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  try {
    const data: PushNotificationData = event.data.json();

    // Extended NotificationOptions for service worker (includes properties not in base TS types)
    const options: NotificationOptions & {
      renotify?: boolean;
      requireInteraction?: boolean;
    } = {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-192x192.png',
      tag: data.tag || 'injection-reminder',
      renotify: true,
      requireInteraction: true,
      data: {
        url: data.url || '/jabs',
        dateOfArrival: Date.now(),
      },
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch (error) {
    console.error('Error processing push notification:', error);
  }
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const url = event.notification.data?.url || '/jabs';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if a window is already open and focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          // Navigate to the target URL
          if ('navigate' in client) {
            (client as WindowClient).navigate(url);
          }
          return;
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// ============================================================================
// SUBSCRIPTION CHANGE HANDLER (Important for iOS reliability)
// ============================================================================

// VAPID public key embedded at build time
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/**
 * Convert URL-safe base64 string to Uint8Array for VAPID key
 * Returns ArrayBuffer for compatibility with PushManager.subscribe()
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

/**
 * Handle push subscription changes (expiration, renewal)
 * This is critical for iOS where subscriptions can expire unexpectedly
 */
self.addEventListener('pushsubscriptionchange', ((event: Event) => {
  const pushEvent = event as PushSubscriptionChangeEvent;
  console.log('[SW] Push subscription changed');

  if (!VAPID_PUBLIC_KEY) {
    console.error('[SW] Cannot resubscribe: VAPID key not available');
    return;
  }

  pushEvent.waitUntil(
    (async () => {
      try {
        // Re-subscribe with the same VAPID key
        const newSubscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        console.log('[SW] Re-subscribed successfully');

        // Send new subscription to server (reuses existing subscribe endpoint which handles upserts)
        const response = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSubscription.toJSON()),
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        console.log('[SW] New subscription saved to server');
      } catch (error) {
        console.error('[SW] Failed to resubscribe:', error);
      }
    })()
  );
}) as EventListener);

// Type for pushsubscriptionchange event (not in standard TS types)
interface PushSubscriptionChangeEvent extends Event {
  oldSubscription?: PushSubscription;
  newSubscription?: PushSubscription;
  waitUntil(promise: Promise<unknown>): void;
}
