// Guarda la app en el móvil para que abra sin conexión.
// Primero intenta la red (para recibir siempre la última versión) y, si no hay, usa la copia guardada.
const CACHE = "recetas-v2";
const BASE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-180.png"];

self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  const propio = u.origin === location.origin;
  const fuentes = /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname) || u.hostname === "www.gstatic.com";
  if (!propio && !fuentes) return; // Firestore, proxies e imágenes externas van directos
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: propio }).then(r => r || caches.match("index.html"))));
});
