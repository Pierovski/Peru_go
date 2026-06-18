const CACHE_NAME = 'perugo-cache-v6.1';
const urlsToCache = [
    './', './index.html', './style.css', './app.js', './manifest.json',
    './data/peru_departamental_simple.geojson', './data/peru_provincial_simple.geojson',
    './assets/img/fondo.jpg', './assets/img/mascota-hola.webp', './assets/img/mascota-explora.webp',
    './assets/img/mascota-feliz.webp', './assets/img/mascota-triste.webp',
    './assets/audio/musica-uno.mp3', './assets/audio/musica-dos.mp3', './assets/audio/musica-tres.mp3'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(cacheNames => {
        return Promise.all(cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
        }));
    }));
});

// Corrección: Estrategia Stale-While-Revalidate (Muestra caché pero actualiza en segundo plano)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
                return networkResponse;
            }).catch(err => console.error("Error de red en SW:", err));
            return cachedResponse || fetchPromise;
        })
    );
});
