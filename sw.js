const CACHE_NAME = 'planificare-ture-v1';
const ASSETS = [
  './planificare_ture_mobil_claude.html',
  './manifest.json',
  './icon-192-1.png',
  './icon-512-1.png'
];

// Instalare — cache-uieste fisierele principale
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activare — sterge cache-urile vechi
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — raspunde din cache, daca nu merge ia din retea
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
        return response;
      }).catch(() => {
        // Offline fallback pentru navigatie
        if (event.request.destination === 'document') {
          return caches.match('./planificare_ture_mobil_claude.html');
        }
      });
    })
  );
});
