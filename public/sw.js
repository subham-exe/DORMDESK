const CACHE_NAME = 'dormdesk-cache-v1';

const PRECACHE_URLS = [
  '/student',
  '/student/requests',
  '/student/notices',
  '/student/profile',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(err => {
         // Gracefully handle precache errors (e.g. if some routes are 404 or dynamically rendered during build and not available yet)
         console.warn('Precache failed for some URLs:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Don't cache API requests or admin routes for security
  if (event.request.url.includes('/api/') || event.request.url.includes('/admin/')) {
    return; // Pass through to network
  }

  // Network-first strategy for HTML pages, cache-first for static assets
  const isHtml = event.request.headers.get('accept')?.includes('text/html');
  const isStaticAsset = event.request.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/);

  if (isStaticAsset) {
    // Cache-first strategy for static assets
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
    );
  } else if (isHtml) {
    // Network-first strategy for HTML
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // Fallback to /student if navigating offline
            return caches.match('/student');
          });
        })
    );
  }
});
