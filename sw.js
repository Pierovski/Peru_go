const CACHE_NAME = 'perugo-cache-v2.1';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './app.js',
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
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Archivos guardados para modo offline');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si el archivo está en caché, lo devuelve al instante. Si no, lo busca en internet.
                return response || fetch(event.request);
            })
    );
});
