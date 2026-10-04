// Service Worker — Jadwal Kuliah S1 Akuntansi UPNVJ
const CACHE_NAME = 'upnvj-jadwal-v2';
const ASSETS = [
  './', './jadwal-kuliah-aks1.upnvj.html', './manifest.json',
  './favicon.png', './favicon.ico', './apple-touch-icon.png',
  './pwa-192x192.png', './pwa-512x512.png', './pwa-maskable-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(ASSETS.map((u) => cache.add(u).catch(() => null)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first (selalu ambil versi terbaru), cache sebagai cadangan offline
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./jadwal-kuliah-aks1.upnvj.html')))
  );
});
