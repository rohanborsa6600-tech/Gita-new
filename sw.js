const CACHE_NAME = 'gita-new-v1';
const ASSETS_TO_CACHE = [
  '/Gita-new/',
  '/Gita-new/index.html',
  '/Gita-new/style.css', 
  '/Gita-new/script.js',
  '/Gita-new/manifest.json',
  '/Gita-new/icon-192.png',
  '/Gita-new/icon-512.png'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Fetch Resources
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cache if found, otherwise fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate and Clean Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});
