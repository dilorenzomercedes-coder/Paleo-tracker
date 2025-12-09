const CACHE_NAME = 'paleo-heritage-v1';
const ASSETS = [
    '/Paleo-tracker/',
    '/Paleo-tracker/index.html',
    '/Paleo-tracker/css/style.css',
    '/Paleo-tracker/js/app.js',
    '/Paleo-tracker/js/map.js',
    '/Paleo-tracker/js/ui.js',
    '/Paleo-tracker/js/store.js',
    '/Paleo-tracker/js/export.js',
    '/Paleo-tracker/public/logo paleo heritage.png',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});
