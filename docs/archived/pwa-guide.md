# Next.js PWA Push Notifications Implementation Specification

## OBJECTIVE
Implement web push notifications for a Next.js PWA supporting iOS 16.4+, Android, and desktop browsers.

---

## CRITICAL REQUIREMENTS

### iOS-Specific Requirements (MOST IMPORTANT)
1. **PWA MUST be added to home screen first** - iOS only allows push permission requests from installed PWAs, NOT from Safari browser
2. **iOS 16.4+ required** - older versions don't support web push
3. **manifest.json MUST have `display: "standalone"`** - without this, iOS disables push
4. **Permission MUST be triggered by user interaction** - cannot auto-prompt
5. **Service worker MUST be registered at root scope** - `/sw.js` at site root

### Manifest Requirements (iOS Critical)
```json
{
  "name": "App Name",
  "short_name": "AppName",
  "display": "standalone",  // REQUIRED for iOS push
  "start_url": "/",
  "scope": "/",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## FILE STRUCTURE

```
├── app/
│   ├── manifest.ts (or manifest.json)
│   ├── layout.tsx
│   ├── page.tsx
│   └── actions.ts (Server Actions)
├── public/
│   ├── sw.js (Service Worker)
│   ├── icon-192x192.png
│   └── icon-512x512.png
├── lib/
│   └── push-notifications.ts (optional client utils)
├── .env.local
└── next.config.js
```

---

## IMPLEMENTATION FILES

### 1. Environment Variables (.env.local)

```bash
# Generate with: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
```

**Generate VAPID keys:**
```bash
npm install -g web-push
web-push generate-vapid-keys
```

---

### 2. app/manifest.ts (Next.js App Router)

```typescript
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Your App Name',
    short_name: 'AppName',
    description: 'Your app description',
    start_url: '/',
    display: 'standalone', // CRITICAL for iOS
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
```

---

### 3. app/layout.tsx (Metadata)

```typescript
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Your App',
  description: 'Your app description',
  manifest: '/manifest.webmanifest', // or manifest will auto-generate from manifest.ts
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Your App',
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

---

### 4. public/sw.js (Service Worker)

```javascript
// Service Worker for Push Notifications

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.')
  event.waitUntil(clients.claim())
})

// Handle push events
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push event but no data')
    return
  }

  const data = event.data.json()
  
  const options = {
    body: data.body || 'New notification',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || '1',
      url: data.url || '/',
    },
    actions: data.actions || [],
    tag: data.tag || 'default',
    renotify: data.renotify || false,
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
  )
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received.')
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Handle subscription change (important for iOS reliability)
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed')
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: self.VAPID_PUBLIC_KEY
    }).then((subscription) => {
      // Send new subscription to server
      return fetch('/api/push/resubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      })
    })
  )
})
```

---

### 5. app/actions.ts (Server Actions)

```typescript
'use server'

import webpush from 'web-push'

// Configure VAPID
webpush.setVapidDetails(
  'mailto:your-email@example.com', // CHANGE THIS
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// Type for subscription
interface PushSubscriptionJSON {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

// In production: store in database
let subscriptions: Map<string, PushSubscriptionJSON> = new Map()

export async function subscribeUser(sub: PushSubscriptionJSON): Promise<{ success: boolean }> {
  try {
    // Use endpoint as unique ID (or use user ID in production)
    subscriptions.set(sub.endpoint, sub)
    
    // TODO: In production, store in database:
    // await db.pushSubscriptions.create({ data: { ...sub, userId: currentUser.id } })
    
    console.log('User subscribed:', sub.endpoint.slice(-20))
    return { success: true }
  } catch (error) {
    console.error('Subscribe error:', error)
    return { success: false }
  }
}

export async function unsubscribeUser(endpoint?: string): Promise<{ success: boolean }> {
  try {
    if (endpoint) {
      subscriptions.delete(endpoint)
    }
    // TODO: In production, remove from database
    return { success: true }
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return { success: false }
  }
}

export async function sendNotification(
  message: string,
  options?: {
    title?: string
    icon?: string
    url?: string
    tag?: string
  }
): Promise<{ success: boolean; error?: string }> {
  const payload = JSON.stringify({
    title: options?.title || 'Notification',
    body: message,
    icon: options?.icon || '/icon-192x192.png',
    url: options?.url || '/',
    tag: options?.tag || 'default',
  })

  const results = []
  
  for (const [endpoint, sub] of subscriptions) {
    try {
      await webpush.sendNotification(sub as any, payload, {
        TTL: 86400, // 24 hours
        urgency: 'normal',
      })
      results.push({ endpoint, success: true })
    } catch (error: any) {
      console.error('Push failed for:', endpoint.slice(-20), error.message)
      
      // Remove invalid subscriptions (410 Gone or 404)
      if (error.statusCode === 410 || error.statusCode === 404) {
        subscriptions.delete(endpoint)
      }
      results.push({ endpoint, success: false, error: error.message })
    }
  }

  const successful = results.filter(r => r.success).length
  return { 
    success: successful > 0, 
    error: successful === 0 ? 'No notifications sent' : undefined 
  }
}

// For sending to specific user (production)
export async function sendNotificationToUser(
  userId: string,
  message: string,
  options?: { title?: string; icon?: string; url?: string }
): Promise<{ success: boolean }> {
  // TODO: Fetch user's subscription from database
  // const sub = await db.pushSubscriptions.findFirst({ where: { userId } })
  // if (!sub) return { success: false }
  // return sendNotification(message, options)
  return { success: false }
}
```

---

### 6. Client Component (app/components/PushNotifications.tsx)

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { subscribeUser, unsubscribeUser, sendNotification } from '@/app/actions'

// Convert VAPID key for subscription
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default')
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testMessage, setTestMessage] = useState('')

  // Check support and register SW
  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    // Check if running as PWA (standalone)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true
    setIsStandalone(standalone)

    // Check browser support
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      registerServiceWorker()
    } else {
      setError('Push notifications not supported in this browser')
    }

    // Check current permission
    if ('Notification' in window) {
      setPermissionState(Notification.permission)
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })
      setRegistration(reg)
      console.log('SW registered:', reg.scope)

      // Check existing subscription
      const existingSub = await reg.pushManager.getSubscription()
      if (existingSub) {
        setSubscription(existingSub)
        setIsSubscribed(true)
      }
    } catch (err) {
      console.error('SW registration failed:', err)
      setError('Failed to register service worker')
    }
  }

  const subscribe = useCallback(async () => {
    if (!registration) {
      setError('Service worker not ready')
      return
    }

    try {
      setError(null)

      // Request permission first (must be from user gesture)
      const permission = await Notification.requestPermission()
      setPermissionState(permission)

      if (permission !== 'granted') {
        setError('Notification permission denied')
        return
      }

      // Subscribe to push
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      setSubscription(sub)
      setIsSubscribed(true)

      // Send to server
      const serialized = JSON.parse(JSON.stringify(sub))
      await subscribeUser(serialized)

      console.log('Subscribed successfully')
    } catch (err: any) {
      console.error('Subscribe error:', err)
      setError(err.message || 'Failed to subscribe')
    }
  }, [registration])

  const unsubscribe = useCallback(async () => {
    if (!subscription) return

    try {
      await subscription.unsubscribe()
      await unsubscribeUser(subscription.endpoint)
      setSubscription(null)
      setIsSubscribed(false)
      console.log('Unsubscribed')
    } catch (err: any) {
      console.error('Unsubscribe error:', err)
      setError(err.message || 'Failed to unsubscribe')
    }
  }, [subscription])

  const sendTest = async () => {
    if (!testMessage.trim()) return
    
    try {
      const result = await sendNotification(testMessage, {
        title: 'Test Notification',
        url: '/',
      })
      if (!result.success) {
        setError(result.error || 'Failed to send')
      }
      setTestMessage('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  // iOS-specific instructions
  if (isIOS && !isStandalone) {
    return (
      <div className="p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-bold mb-2">📱 Install Required for Push Notifications</h3>
        <p className="text-sm mb-2">
          To receive push notifications on iOS, you need to add this app to your home screen:
        </p>
        <ol className="text-sm list-decimal list-inside space-y-1">
          <li>Tap the <strong>Share</strong> button (⎋) in Safari</li>
          <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
          <li>Tap <strong>"Add"</strong> in the top right</li>
          <li>Open the app from your home screen</li>
        </ol>
      </div>
    )
  }

  if (!isSupported) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p>Push notifications are not supported in this browser.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-bold">Push Notifications</h3>
      
      {error && (
        <div className="p-2 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <div className="text-sm text-gray-600">
        <p>Permission: {permissionState}</p>
        <p>Subscribed: {isSubscribed ? 'Yes' : 'No'}</p>
        {isIOS && <p>Running as PWA: {isStandalone ? 'Yes' : 'No'}</p>}
      </div>

      {isSubscribed ? (
        <div className="space-y-2">
          <p className="text-green-600">✓ Subscribed to push notifications</p>
          <button
            onClick={unsubscribe}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Unsubscribe
          </button>
          
          <div className="flex gap-2 mt-4">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Test message..."
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={sendTest}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Send Test
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={subscribe}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Enable Push Notifications
        </button>
      )}
    </div>
  )
}

// Install Prompt Component
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    )

    // Android/Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  if (isStandalone) return null

  return (
    <div className="p-4 bg-blue-50 rounded-lg">
      <h3 className="font-bold mb-2">Install App</h3>
      
      {deferredPrompt && (
        <button
          onClick={handleInstall}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Install App
        </button>
      )}

      {isIOS && (
        <p className="text-sm">
          Tap <strong>Share</strong> (⎋) then <strong>"Add to Home Screen"</strong>
        </p>
      )}
    </div>
  )
}
```

---

### 7. next.config.js (Security Headers)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

---

### 8. API Route Alternative (app/api/push/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// POST /api/push - subscribe
export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json()
    
    // TODO: Store subscription in database with user ID
    // await db.subscriptions.create({ data: subscription })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

// DELETE /api/push - unsubscribe
export async function DELETE(request: NextRequest) {
  try {
    const { endpoint } = await request.json()
    
    // TODO: Remove from database
    // await db.subscriptions.delete({ where: { endpoint } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
```

---

## DEPENDENCIES

```bash
npm install web-push
npm install -D @types/web-push  # if using TypeScript
```

---

## TESTING CHECKLIST

### Local Testing
1. Run with HTTPS: `next dev --experimental-https`
2. Enable browser notifications in system settings
3. Accept permission when prompted

### iOS Testing
1. Deploy to HTTPS domain (or use ngrok)
2. Open in Safari on iOS 16.4+
3. Add to Home Screen via Share menu
4. Open from Home Screen (NOT Safari)
5. Tap subscribe button
6. Accept permission prompt

### Android Testing
1. Open in Chrome
2. May show install prompt automatically
3. Or install via 3-dot menu → "Install app"
4. Works both in browser and installed

### Common Issues
- **iOS: Permission prompt not showing** → App not installed to home screen
- **iOS: Notifications stop working** → Subscription expired, implement re-subscription
- **Desktop: Blocked** → Check browser notification settings
- **All: 403 errors** → Check VAPID keys match between client and server

---

## VERIFICATION COMMANDS

```bash
# Check manifest is accessible
curl https://yourdomain.com/manifest.webmanifest

# Check service worker is served correctly
curl -I https://yourdomain.com/sw.js

# Verify VAPID keys format (should be base64url, ~87 chars public, ~43 chars private)
echo $NEXT_PUBLIC_VAPID_PUBLIC_KEY | wc -c  # ~88
echo $VAPID_PRIVATE_KEY | wc -c  # ~44
```

---

## PRODUCTION CONSIDERATIONS

1. **Database Storage**: Store subscriptions with user ID in database (Prisma/Drizzle example):
```prisma
model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}
```

2. **Batch Sending**: Use `Promise.allSettled` for sending to multiple users

3. **Error Handling**: Remove subscriptions that return 410 (Gone) or 404

4. **Rate Limiting**: Implement rate limiting on subscription endpoints

5. **Analytics**: Track delivery rates, open rates, subscription churn