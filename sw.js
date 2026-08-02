/* ============================================================================
   Service Worker für Tour-de-France Bingo (PWA)
   ----------------------------------------------------------------------------
   - Precache der App-Shell (index.html, Manifest, Icons) beim Installieren.
   - Fetch-Strategie:
       * eigene Dateien  -> cache-first (App läuft komplett offline)
       * Google-Fonts    -> stale-while-revalidate (nach 1. Laden offline da)
   - Bei Versionswechsel CACHE hochzählen, dann werden alte Caches entfernt.
   ========================================================================== */
const CACHE = 'tdf-bingo-v18';

// Relative Pfade, damit es sowohl unter / als auch unter /tdf-bingo/ funktioniert
const APP_SHELL = [
  './',
  './index.html',
  './bombe.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const istFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  const sameOrigin = url.origin === self.location.origin;

  // Fremd-Hosts (z.B. Firebase Realtime DB fürs Live-Spiel) NICHT abfangen –
  // direkt vom Browser behandeln lassen (Streaming/WebSocket/REST).
  if (!sameOrigin && !istFont) return;

  if (istFont) {
    // Google-Fonts: erst Cache zeigen, im Hintergrund aktualisieren
    e.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(req).then((hit) => {
          const netz = fetch(req).then((res) => {
            if (res && res.status === 200) cache.put(req, res.clone());
            return res;
          }).catch(() => hit);
          return hit || netz;
        })
      )
    );
    return;
  }

  // HTML / Seitenaufruf: NETWORK-FIRST
  // -> online immer der neueste Stand, offline Rückfall auf den Cache.
  // So propagieren neue Felder/Änderungen automatisch, ohne SW-Neuinstallation.
  const istHTML = req.mode === 'navigate'
    || url.pathname.endsWith('/')
    || url.pathname.endsWith('.html');

  if (istHTML) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.status === 200) {
          const kopie = res.clone();
          caches.open(CACHE).then((c) => c.put(req, kopie));
        }
        return res;
      }).catch(() =>
        caches.match(req).then((hit) => hit || caches.match('./index.html'))
      )
    );
    return;
  }

  // Übrige eigene Dateien (Icons, Manifest): cache-first, sonst Netz
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req))
  );
});
