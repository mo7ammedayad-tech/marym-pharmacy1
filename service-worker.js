const CACHE_NAME = "pharmacy-cache-v1";

const isLocalhost =
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1";

const STATIC_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js"
];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_FILES);
    })
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {

  if (isLocalhost) {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(networkResponse => {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, networkResponse.clone());
        });
        return networkResponse;
      });

      return cached || fetchPromise;
    })
  );
});