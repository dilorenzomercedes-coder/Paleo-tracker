const APP_CACHE = 'paleo-heritage-app-v3';
const RUNTIME_CACHE = 'paleo-heritage-runtime-v1';
const OFFLINE_URL = '/Paleo-Heritage/index.html';

const ASSETS = [
  '/Paleo-Heritage/',
  '/Paleo-Heritage/index.html',
  '/Paleo-Heritage/css/style.css',
  '/Paleo-Heritage/js/app.js',
  '/Paleo-Heritage/js/map.js',
  '/Paleo-Heritage/js/ui.js',
  '/Paleo-Heritage/js/store.js',
  '/Paleo-Heritage/js/export.js',
  '/Paleo-Heritage/public/logo paleo heritage.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/dexie@4.2.1/dist/dexie.min.js',
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (![APP_CACHE, RUNTIME_CACHE].includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Cache-first for navigations, stale-while-revalidate for same-origin GET assets
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // App shell fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(APP_CACHE).then((cache) => cache.put(OFFLINE_URL, copy));
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Same-origin static/runtime assets
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            const copy = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
            return networkResponse;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Third-party assets cache-first (fonts/maps/js)
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, networkResponse.clone()));
          return networkResponse;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
