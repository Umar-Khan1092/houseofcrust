/**
 * House of Crust — Premium Service Worker v4
 * Strategy:
 *  - App shell (HTML/JS/CSS): Cache-First (instant loads)
 *  - Cloudinary images:       Cache-First with 30-day expiry
 *  - API / JSON data:         Network-First (always fresh data)
 *  - Font assets:             Cache-First with 1-year expiry
 */

const CACHE_VERSION = 'hoc-v4';
const SHELL_CACHE   = `${CACHE_VERSION}-shell`;
const IMAGE_CACHE   = `${CACHE_VERSION}-images`;
const DATA_CACHE    = `${CACHE_VERSION}-data`;
const FONT_CACHE    = `${CACHE_VERSION}-fonts`;

const MAX_IMAGE_ENTRIES = 80;
const MAX_DATA_ENTRIES  = 20;
const IMAGE_TTL_MS      = 30 * 24 * 60 * 60 * 1000; // 30 days
const FONT_TTL_MS       = 365 * 24 * 60 * 60 * 1000; // 1 year

/** Shell assets to pre-cache during install (minimal — only guaranteed small files) */
const SHELL_ASSETS = [
  '/',
  '/manifest.json',
];

// ─── Install: pre-cache shell only ─────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      cache.addAll(SHELL_ASSETS)
    ).then(() => self.skipWaiting())
  );
});

// ─── Activate: delete all old caches ────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const keepCaches = [SHELL_CACHE, IMAGE_CACHE, DATA_CACHE, FONT_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !keepCaches.includes(key))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch: route-based strategy ────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // 1. Fonts — Cache-First, long TTL
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(cacheFirst(request, FONT_CACHE, FONT_TTL_MS, 50));
    return;
  }

  // 2. Cloudinary images/videos — Cache-First, 30-day TTL
  if (url.hostname === 'res.cloudinary.com') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, IMAGE_TTL_MS, MAX_IMAGE_ENTRIES));
    return;
  }

  // 3. Navigation requests (HTML) — Network-First, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, SHELL_CACHE));
    return;
  }

  // 4. App shell assets (JS/CSS from same origin) — Cache-First
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, SHELL_CACHE, null, 200));
    return;
  }

  // 5. Everything else — Network only (no caching)
  // e.g. WhatsApp API, geolocation
});

// ─── Handle SKIP_WAITING message from client ────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ─── Strategy Helpers ────────────────────────────────────────────────────────

/**
 * Cache-First: serve from cache, fallback to network and update cache.
 * Optionally evicts old entries when max is reached.
 */
async function cacheFirst(request, cacheName, ttlMs, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    // TTL check: if cached response has expired, refresh in background
    if (ttlMs) {
      const dateHeader = cached.headers.get('date');
      if (dateHeader) {
        const age = Date.now() - new Date(dateHeader).getTime();
        if (age > ttlMs) {
          // Stale — refresh silently in background
          fetchAndCache(request, cache, maxEntries);
        }
      }
    }
    return cached;
  }

  // Not in cache — fetch and store
  return fetchAndCache(request, cache, maxEntries);
}

/**
 * Network-First: try network, fallback to cache.
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

/**
 * Fetch from network, store in cache, evict if over max.
 */
async function fetchAndCache(request, cache, maxEntries) {
  try {
    const response = await fetch(request);
    if (!response || !response.ok || response.type === 'opaque') {
      // Don't cache bad responses
      return response || new Response('Network error', { status: 500 });
    }

    // Evict oldest entry if we're at capacity
    if (maxEntries) {
      const keys = await cache.keys();
      if (keys.length >= maxEntries) {
        await cache.delete(keys[0]);
      }
    }

    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response('Network error', { status: 503 });
  }
}