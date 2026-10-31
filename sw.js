/* Alchemydoku service worker.
 * The version and precache list below are filled in at build time by the
 * `alchemydoku-sw` plugin in vite.config.ts. In `npm run dev` they stay
 * as placeholders and the worker is never registered. */
const VERSION = '23dfc50b4d';
const PRECACHE = '["./","assets/index-CYOZ0iM3.css","assets/index-D3vLMntF.js","icons/icon-192.png","icons/icon-512-maskable.png","icons/icon-512.png","images/alch_1.svg","images/alch_2.svg","images/alch_3.svg","images/alch_4.svg","images/alch_5.svg","images/alch_6.svg","images/alch_7.svg","images/alch_8.svg","images/correct.svg","images/elem_B_L.svg","images/elem_B_S.svg","images/elem_G_L.svg","images/elem_G_S.svg","images/elem_R_L.svg","images/elem_R_S.svg","images/golem_chest.png","images/golem_chest_icon.png","images/golem_ears.png","images/golem_ears_icon.png","images/i0.png","images/i1.png","images/i2.png","images/i3.png","images/i4.png","images/i5.png","images/i6.png","images/i7.png","images/incorrect.svg","images/little/alch_1.svg","images/little/alch_2.svg","images/little/alch_3.svg","images/little/alch_4.svg","images/little/alch_5.svg","images/little/alch_6.svg","images/little/alch_7.svg","images/little/alch_8.svg","images/little/elem_B_L.svg","images/little/elem_B_S.svg","images/little/elem_G_L.svg","images/little/elem_G_S.svg","images/little/elem_R_L.svg","images/little/elem_R_S.svg","images/little/i0.png","images/little/i1.png","images/little/i2.png","images/little/i3.png","images/little/i4.png","images/little/i5.png","images/little/i6.png","images/little/i7.png","images/little/potion_blue_minus.svg","images/little/potion_blue_plus.svg","images/little/potion_green_minus.svg","images/little/potion_green_plus.svg","images/little/potion_null.svg","images/little/potion_red_minus.svg","images/little/potion_red_plus.svg","images/little/sign_B_minus.svg","images/little/sign_B_plus.svg","images/little/sign_G_minus.svg","images/little/sign_G_plus.svg","images/little/sign_R_minus.svg","images/little/sign_R_plus.svg","images/minus.svg","images/plus.svg","images/potion_blue_minus.svg","images/potion_blue_plus.svg","images/potion_correct.svg","images/potion_green_minus.svg","images/potion_green_plus.svg","images/potion_null.svg","images/potion_red_minus.svg","images/potion_red_plus.svg","images/potion_sign_ok.svg","images/potion_sign_wrong.svg","images/sign_B_minus.svg","images/sign_B_plus.svg","images/sign_G_minus.svg","images/sign_G_plus.svg","images/sign_R_minus.svg","images/sign_R_plus.svg","images/uiresources/debunk.png","images/uiresources/sell.png","images/uiresources/taster.png","images/unknown.svg","index.html","manifest.json"]';
const CACHE = `alchemydoku-${VERSION}`;
const SCOPE = self.registration.scope; // e.g. https://host/alchemydoku/
const SCOPE_PATH = new URL(SCOPE).pathname;

const urlsToCache = () => {
  try { return JSON.parse(PRECACHE).map((p) => new URL(p, SCOPE).href); }
  catch { return [SCOPE]; }
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(urlsToCache())).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith('alchemydoku-') && k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;          // analytics, Google APIs, etc.
  if (url.pathname.startsWith(SCOPE_PATH + 'preview/')) return; // /preview/ has its own worker

  // Page loads: network first (fresh deploys), fall back to the cached shell offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(SCOPE, copy));
          return res;
        })
        .catch(() => caches.match(SCOPE).then((r) => r || caches.match(SCOPE + 'index.html')))
    );
    return;
  }

  // Everything else: cache first, then network (and remember it).
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});
