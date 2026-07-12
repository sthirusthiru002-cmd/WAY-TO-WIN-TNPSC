const CACHE_NAME = "tnpsc-notes-v1";
const APP_SHELL = [
  "./index.html",
  "./category.html",
  "./css/style.css",
  "./js/config.js",
  "./js/app.js",
  "./js/category.js",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});

// Network-first for API calls, cache-first for the app shell
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.url.includes("/api/")) return; // always go to network for live data

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
