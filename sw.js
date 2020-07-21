var cacheName = "17grePWA-v0.0.1";
var cacheContents = [
    "./",
    "./index.html",
    "./lib/vue.min.js"
];

self.addEventListener("install", function(e) {
    console.log("[Service Worker] Install");
    e.waitUntil(
        caches.open(cacheName).then(function(cache) {
            console.log("[Service Worker] Caching contents");
            return cache.addAll(cacheContents);
        })
    );
});

self.addEventListener("fetch", function(e) {
    e.respondWith(
        caches.match(e.request, { ignoreSearch: true }).then(function(r) {
            console.log("[Service Worker] Fetching resouce: " + e.request.url);
            return r || fetch(e.request).then(function(response) {
                return caches.open(cacheName).then(function(cache) {
                    console.log("[Service Worker] Caching new resource: " + e.request.url);
                    cache.put(e.request, response.clone());
                    return response;
                });
            });
        })
    );
});
