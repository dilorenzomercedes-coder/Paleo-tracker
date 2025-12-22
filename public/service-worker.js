// SELF-DESTRUCTING SERVICE WORKER
// This script replaces the old public/service-worker.js to force-clear the cache on users stuck with the old index.html

const CACHE_NAME = 'paleo-heritage-killer-v1';

self.addEventListener('install', (event) => {
    console.log('Killer SW installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Killer SW activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            // Delete ALL caches
            return Promise.all(
                cacheNames.map((cacheName) => {
                    console.log('Deleting cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            // Unregister self
            return self.registration.unregister();
        }).then(() => {
            // Force reload all clients
            return self.clients.matchAll({ type: 'window' }).then(clients => {
                clients.forEach(client => {
                    console.log('Reloading client:', client.url);
                    client.navigate(client.url);
                });
            });
        })
    );
});
