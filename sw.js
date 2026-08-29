const CACHE_NAME = "mathquest-village-v35";

const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./game.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./Audio/TownTheme.mp3",
  "./Audio/confetti.mp3",
  "./Images/question-01.jpg",
  "./Images/question-02.jpg",
  "./Images/question-03.jpg",
  "./Images/question-04.jpg",
  "./Images/question-05.jpg",
  "./Images/question-06.jpg",
  "./Images/question-07.jpg",
  "./Images/question-08.jpg",
  "./Images/question-09.jpg",
  "./Images/question-10.jpg",
  "./Images/question-11.jpg",
  "./Images/question-12.jpg",
  "./Images/question-13.jpg",
  "./Images/question-14.jpg",
  "./Images/question-15.jpg",
  "./Images/question-16.jpg",
  "./Images/question-17.jpg",
  "./Images/question-18.jpg",
  "./Images/question-19.jpg",
  "./Images/question-20.jpg",
  "./Images/question-21.jpg",
  "./Images/question-22.jpg",
  "./Images/question-23.jpg",
  "./Images/question-24.jpg",
  "./Images/question-25.jpg",
  "./Images/question-26.jpg",
  "./Images/question-27.jpg",
  "./Images/question-28.jpg",
  "./Images/question-29.jpg",
  "./Images/question-30.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
