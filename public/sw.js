const CACHE_NAME = 'dormdesk-cache-v3';

const PRECACHE_URLS = [
  '/_offline',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(err => {
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
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never cache API, admin, or student authenticated routes
  // Caching these risks cross-user data leakage on shared devices
  if (
    url.pathname.startsWith('/api/') || 
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/student') ||
    url.pathname.startsWith('/warden') ||
    url.pathname.startsWith('/faculty')
  ) {
    const isHtml = event.request.headers.get('accept')?.includes('text/html');
    if (isHtml) {
      event.respondWith(
        fetch(event.request).catch(() => {
           return caches.match('/_offline');
        })
      );
    }
    return;
  }

  // Network-first strategy for static assets
  const isStaticAsset = event.request.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf)$/) || url.pathname.startsWith('/_next/static/');

  if (isStaticAsset) {
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
        }).catch(() => {
            return new Response();
        });
      })
    );
  }
});
