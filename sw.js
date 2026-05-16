const CACHE_NAME = 'perugo-cache-v4.3.1';
const urlsToCache = [
    './',
    './index.html',
    './style.css?v=2',
    './app.js?v=2',
    './manifest.json?v=2',
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
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Archivos guardados para modo offline');
                return cache.addAll(urlsToCache);
            })
    );
});

// NUEVO: Autolimpieza defensiva de caché
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Destruyendo caché obsoleto:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});
