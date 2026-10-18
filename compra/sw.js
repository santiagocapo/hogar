// Guarda la app en el móvil para que abra aunque no haya cobertura.
// Los archivos de la app se piden siempre a la red (sin usar la copia temporal del navegador),
// así que al subir un index.html nuevo llega solo. Solo hay que subir la versión de CACHE
// cuando se añada un archivo nuevo a la lista SHELL.
const CACHE = "compra-v3";
const SHELL = ["./", "./index.html", "./config.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const put = res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; };

  if (url.origin === location.origin) {
    // Primero la red, saltándose la copia temporal del navegador (para recibir mejoras);
    // si no hay cobertura, lo guardado.
    e.respondWith(fetch(e.request, { cache: "no-cache" }).then(put).catch(() =>
      caches.match(e.request).then(r => r || caches.match("./index.html"))));
  } else if ((url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/")) ||
             url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    // Librerías y tipografía: lo guardado primero.
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(put)));
  }
});
