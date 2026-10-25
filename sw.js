const CACHE_NAME = 'perugo-cache-v9.0';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './firebase.js',
    './manifest.json',
    './data/peru_departamental_simple.geojson',
    './data/peru_provincial_simple.geojson',
    './assets/img/fondo.jpg',
    './assets/img/mascota-hola.webp',
    './assets/img/mascota-explora.webp',
    './assets/img/mascota-feliz.webp',
    './assets/img/mascota-triste.webp',
    './assets/audio/musica-uno.mp3',
    './assets/audio/musica-dos.mp3',
    './assets/audio/musica-tres.mp3'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Excluir APIs dinámicas (Firestore maneja su propio IndexedDB local)
    const dominiosExcluidos = [
        'firestore.googleapis.com',
        'identitytoolkit.googleapis.com',
        'api.imgbb.com',
        'api.open-meteo.com',
        'server.arcgisonline.com'
    ];
    if (dominiosExcluidos.some(d => url.hostname.includes(d))) return;

    const esMismoOrigen = url.origin === self.location.origin;

    event.respondWith(
        caches.match(event.request, { ignoreSearch: esMismoOrigen }).then(cachedResponse => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                }
                return networkResponse;
            }).catch(() => cachedResponse);

            return cachedResponse || fetchPromise;
        })
    );
});
