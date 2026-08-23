// frontend/public/sw.js
const CACHE_NAME = 'it-management-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// نصب Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Service Worker: Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

// فعال‌سازی Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// مدیریت درخواست‌ها
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // اگر در کش موجود است، برگردان
        if (response) {
          return response;
        }
        // در غیر این صورت به شبکه درخواست بده
        return fetch(event.request);
      })
  );
});

// مدیریت اعلان‌های پوش (Push)
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});