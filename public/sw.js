// public/sw.js - Service Worker for Uzima Portal PWA
const CACHE_NAME = 'uzima-v2.4.1';
const STATIC_CACHE = 'uzima-static-v1';
const DYNAMIC_CACHE = 'uzima-dynamic-v1';

// Assets to cache immediately on install (only files that definitely exist)
const STATIC_ASSETS = [
  '/uzima-portal/',
  '/uzima-portal/index.html',
  '/uzima-portal/manifest.json'
  // Note: We skip icons and CSS here to avoid install failures
  // They'll be cached dynamically on first visit
];

// ─── INSTALL ───
self.addEventListener('install', (event) => {
  console.log('🔧 [SW] Install');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 [SW] Caching core assets');
        // Cache each asset individually to avoid failing on one missing file
        return Promise.all(
          STATIC_ASSETS.map(url => 
            fetch(url)
              .then(response => response.ok ? cache.put(url, response) : Promise.resolve())
              .catch(() => Promise.resolve()) // Ignore errors, continue caching others
          )
        );
      })
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Install warning (non-critical):', err))
  );
});

// ─── ACTIVATE ───
self.addEventListener('activate', (event) => {
  console.log('🔄 [SW] Activate');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// ─── FETCH ───
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  const url = new URL(request.url);
  
  // 🛡️ SKIP chrome-extension:// requests (fixes the main error)
  if (url.protocol === 'chrome-extension:') return;
  
  // Skip browser internal requests
  if (url.protocol === 'chrome:' || url.protocol === 'about:') return;
  
  // Skip PocketBase API calls (always go to network)
  if (url.hostname === '127.0.0.1' && url.port === '8090') return;
  
  // Skip CDN requests that might 404 (PocketBase)
  if (url.href.includes('pocketbase.min.js') && request.referrer?.includes('localhost')) {
    return; // Let browser handle CDN fallback
  }

  // HTML pages: Network-first, fallback to cache
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Other assets: Cache-first, fallback to network
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;
        return fetch(request)
          .then(response => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone)).catch(() => {});
            }
            return response;
          })
          .catch(() => {
            // Return nothing for missing assets (don't break the page)
            return null;
          });
      })
  );
});