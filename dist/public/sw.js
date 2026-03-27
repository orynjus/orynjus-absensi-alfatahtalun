// ============================================================
// Service Worker — Sistem Absensi Digital
// Versi cache diupdate otomatis saat file ini berubah
// ============================================================

const APP_VERSION = "absensi-v4";
const STATIC_CACHE  = `${APP_VERSION}-static`;
const DYNAMIC_CACHE = `${APP_VERSION}-dynamic`;
const FONT_CACHE    = `${APP_VERSION}-fonts`;
const ALL_CACHES    = [STATIC_CACHE, DYNAMIC_CACHE, FONT_CACHE];

// File yang di-precache saat install (app shell)
const PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ─── Install: precache app shell ───────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate: hapus cache lama ────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !ALL_CACHES.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Message: trigger skip waiting dari UI ─────────────────
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ─── Fetch: strategi caching per jenis request ─────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Abaikan request non-GET
  if (request.method !== "GET") return;

  // Abaikan request API — selalu network
  if (url.pathname.startsWith("/api/")) return;

  // Abaikan WebSocket
  if (url.protocol === "ws:" || url.protocol === "wss:") return;

  // Abaikan extensions browser
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // 1. Google Fonts → Cache First
  if (url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com")) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  // 2. File statis (JS, CSS, gambar, ikon) → Cache First
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|eot)$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 3. Uploads (foto izin, logo) → Network First
  if (url.pathname.startsWith("/uploads/")) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // 4. Semua halaman HTML (navigasi) → Network First dengan fallback ke cache
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // 5. Lainnya → Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ─── Strategi: Cache First ──────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Konten tidak tersedia offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

// ─── Strategi: Network First ────────────────────────────────
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response("Tidak ada koneksi internet.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

// ─── Strategi: Network First + Fallback ke / ───────────────
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Fallback ke halaman utama yang di-cache
    const root = await caches.match("/");
    return root || new Response(
      `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline - Absensi Digital</title>
      <style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#eff6ff}
      .box{text-align:center;padding:2rem;background:white;border-radius:1rem;box-shadow:0 4px 24px rgba(0,0,0,.1);max-width:320px}
      .icon{font-size:4rem;margin-bottom:1rem}.title{font-size:1.25rem;font-weight:700;color:#1e3a5f;margin:0 0 .5rem}
      .sub{color:#64748b;font-size:.875rem;margin:0 0 1.5rem}.btn{background:#1d4ed8;color:white;border:none;padding:.75rem 1.5rem;border-radius:.5rem;font-size:.875rem;cursor:pointer;font-weight:600}
      .btn:hover{background:#1e40af}</style></head>
      <body><div class="box"><div class="icon">📶</div>
      <p class="title">Tidak Ada Koneksi</p>
      <p class="sub">Periksa koneksi internet Anda lalu coba lagi.</p>
      <button class="btn" onclick="location.reload()">Coba Lagi</button></div></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

// ─── Strategi: Stale While Revalidate ──────────────────────
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || await fetchPromise || new Response("", { status: 504 });
}
