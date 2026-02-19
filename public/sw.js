const CACHE_NAME = 'inoot-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Network-first: always try to fetch fresh data; fall back to cache on failure
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
