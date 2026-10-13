// Service Worker v2 - Jadwal Kuliah S1 Akuntansi UPNVJ
// Full Offline PWA Support with Pre-caching and Dynamic Runtime Caching
const CACHE_NAME = 'upnvj-jadwal-v2';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/jadwal-kuliah-aks1.upnvj.html',
  '/manifest.json',
  '/favicon.png',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/upnvj-logo.png',
  '/ak-logo.png',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];

// Install: Pre-cache core shell & assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Use allSettled to ensure that individual network issues do not prevent SW install
      const cachePromises = PRECACHE_URLS.map(async (url) => {
        try {
          const response = await fetch(url, { mode: url.startsWith('http') ? 'cors' : 'same-origin' });
          if (response && (response.ok || response.type === 'opaque')) {
            await cache.put(url, response);
          }
        } catch (err) {
          console.warn('[SW] Precache optional skip:', url, err.message);
        }
      });
      await Promise.allSettled(cachePromises);
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches & take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache version:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Smart Cache-First & Stale-While-Revalidate with full offline fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1. Navigation / HTML Document requests (Single-Page App shell)
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline: match current request, then standalone HTML, then index.html
          const cached = await caches.match(req);
          if (cached) return cached;
          const fallbackStandalone = await caches.match('/jadwal-kuliah-aks1.upnvj.html');
          if (fallbackStandalone) return fallbackStandalone;
          const fallbackIndex = await caches.match('/index.html');
          if (fallbackIndex) return fallbackIndex;
          const fallbackRoot = await caches.match('/');
          return fallbackRoot || new Response('Offline - Silakan buka aplikasi saat terhubung kembali.', {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        })
    );
    return;
  }

  // 2. Static Assets (JS, CSS, Images, Fonts, CDN) - Cache-First, fallback to Network + dynamic Cache
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached immediately; optionally refresh cache in background
        fetch(req)
          .then((networkResponse) => {
            if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
              caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // Not in cache: fetch from network and save to cache
      return fetch(req)
        .then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          // If offline and requesting an image, fallback to favicon or logo
          if (req.destination === 'image') {
            return (await caches.match('/favicon.png')) || (await caches.match('/upnvj-logo.png'));
          }
          return new Response('Aset tidak tersedia secara offline.', {
            status: 503,
            statusText: 'Service Unavailable Offline'
          });
        });
    })
  );
});

// Message listener for manual cache refresh or skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CACHE_ALL_ASSETS') {
    caches.open(CACHE_NAME).then(async (cache) => {
      const promises = PRECACHE_URLS.map(async (url) => {
        try {
          const res = await fetch(url);
          if (res && (res.ok || res.type === 'opaque')) {
            await cache.put(url, res);
          }
        } catch (e) {}
      });
      await Promise.allSettled(promises);
      event.ports[0]?.postMessage({ status: 'done' });
    });
  }
});
