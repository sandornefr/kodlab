// Egyszerű offline cache a KÓDLAB-hoz — csak akkor aktiválódik, ha a lap http(s)-en fut
// (pl. GitHub Pages). Cache-first stratégia: ami már le van töltve, onnan szolgálja ki,
// új kérésnél hálózatról tölt és eltárolja a legközelebbi alkalomra.
const CACHE_NAME = 'kodlab-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/base.css',
  './assets/css/themes.css',
  './assets/js/confetti.js',
  './assets/js/sound.js',
  './assets/js/certificate.js',
  './assets/js/house-scene.js',
  './assets/js/puzzle-engine.js',
  './assets/js/ai-lockout.js',
  './assets/js/pwa.js',
  './themes/gamer.html',
  './themes/halozat.html',
  './themes/okoshaz.html',
  './data/gamer.config.js',
  './data/halozat.config.js',
  './data/okoshaz.config.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
