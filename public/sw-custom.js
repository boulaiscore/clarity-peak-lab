// NeuroLoop Pro - Custom Service Worker for Background Notifications

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
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

// Handle notification actions
self.addEventListener('notificationclick', (event) => {
  const action = event.action;
  
  if (action === 'later') {
    event.notification.close();
    return;
  }
  
  // Default action or 'start' action - open the app
  const urlToOpen = event.notification.data?.url || '/app/daily-session';
  
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
}, false);

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
