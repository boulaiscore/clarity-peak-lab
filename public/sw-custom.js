// NeuroLoop Pro - Custom Service Worker for Background Notifications

// Store scheduled timers
const scheduledTimers = new Map();

// Handle messages from the main app
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  if (type === 'SCHEDULE_DETOX_END') {
    const { sessionId, endTime, durationMinutes } = data;
    const now = Date.now();
    const endTimeMs = new Date(endTime).getTime();
    const delay = endTimeMs - now;
    
    console.log('[SW] Scheduling detox end notification in', Math.round(delay / 1000 / 60), 'minutes');
    
    // Clear any existing timer for this session
    if (scheduledTimers.has(sessionId)) {
      clearTimeout(scheduledTimers.get(sessionId));
    }
    
    if (delay > 0) {
      const timerId = setTimeout(() => {
        self.registration.showNotification('🎉 Detox Completato!', {
          body: `Hai completato ${durationMinutes} minuti di detox. Torna nell\'app per registrare i tuoi XP!`,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: `detox-complete-${sessionId}`,
          requireInteraction: true,
          data: { url: '/neuro-lab', type: 'detox-complete', sessionId },
          actions: [
            { action: 'open', title: 'Apri App' },
            { action: 'dismiss', title: 'Chiudi' }
          ],
          vibrate: [200, 100, 200, 100, 200]
        });
        scheduledTimers.delete(sessionId);
      }, delay);
      
      scheduledTimers.set(sessionId, timerId);
    }
  }
  
  if (type === 'CANCEL_DETOX_NOTIFICATION') {
    const { sessionId } = data;
    if (scheduledTimers.has(sessionId)) {
      clearTimeout(scheduledTimers.get(sessionId));
      scheduledTimers.delete(sessionId);
      console.log('[SW] Cancelled detox notification for session:', sessionId);
    }
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  const action = event.action;
  
  if (action === 'dismiss' || action === 'later') {
    event.notification.close();
    return;
  }
  
  event.notification.close();
  
  // Get the URL from notification data or default to daily session
  const urlToOpen = event.notification.data?.url || '/app/daily-session';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Navigate existing window to the notification URL
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
});

// Handle push events (for future push notification support)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let data = {
    title: '🧠 Time for cognitive training',
    body: 'Your daily session is ready',
    url: '/app/daily-session'
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      console.warn('[SW] Could not parse push data:', e);
    }
  }
  
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'neuroloop-training',
    requireInteraction: true,
    data: { url: data.url },
    actions: [
      { action: 'start', title: 'Start Training' },
      { action: 'later', title: 'Later' }
    ],
    vibrate: [100, 50, 100]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Periodic background sync for scheduled reminders
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'training-reminder') {
    console.log('[SW] Periodic sync: training-reminder');
    
    event.waitUntil(
      self.registration.showNotification('🧠 Your daily cognitive training is ready', {
        body: 'A few minutes to sharpen your thinking',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'neuroloop-daily-reminder',
        requireInteraction: true,
        data: { url: '/app/daily-session' },
        actions: [
          { action: 'start', title: 'Start Training' },
          { action: 'later', title: 'Later' }
        ]
      })
    );
  }
});

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Custom service worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Custom service worker activated');
  event.waitUntil(clients.claim());
});

console.log('[SW] NeuroLoop Pro custom service worker loaded');
