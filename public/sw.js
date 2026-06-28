const CACHE_NAME = 'smart-math-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/Smart Math Motion Logo46.svg',
  '/Smart Math Motion Logo192.png',
  '/Smart Math Motion Logo512.png',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(err => {
      console.warn('[Service Worker] Pre-cache warning (some files may not be available yet):', err);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip caching for Supabase DB requests, hot module reloading (Vite client), etc.
  const url = new URL(event.request.url);
  if (
    url.pathname.includes('/supabase/') || 
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('@vite') ||
    url.pathname.includes('node_modules') ||
    event.request.url.includes('chrome-extension:')
  ) {
    return;
  }

  // Network-First with Cache-Fallback Strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If valid response, clone and cache it for static assets
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed (offline), try local cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If HTML page request fails, fallback to cached index.html
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
  );
});
