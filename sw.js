const CACHE_NAME = 'planificare-ture-v3';
const STATIC_ASSETS = [
  './manifest.json',
  './icon-192-1.png',
  './icon-512-1.png'
];

// Instalare — cache doar assets statice, NU html-ul
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activare — sterge cache-urile vechi imediat
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network-first pentru HTML, cache-first pentru restul
self.addEventListener('fetch', event => {
  const isHTML = event.request.destination === 'document'
    || event.request.url.endsWith('.html')
    || event.request.url.endsWith('/');

  if (isHTML) {
    // Network-first: ia mereu ultima versiune, cache doar ca fallback offline
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache-first pentru icoane, manifest etc.
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return response;
        });
      })
    );
  }
});

// Mesaj de la pagina pentru skipWaiting fortat
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
