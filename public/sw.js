/*
 * Service worker d'Aux Petits Oignons : consultation hors ligne.
 *
 *  - Fichiers statiques (_next/static, images, polices) : cache d'abord, ils sont versionnés.
 *  - Pages de l'application : réseau d'abord ; la dernière version reçue est gardée et servie
 *    si le réseau manque (liste de courses au supermarché, recette en cuisine).
 *  - Rien n'est mis en cache pour les requêtes autres que GET (actions, envois de formulaires),
 *    ni pour l'API, l'authentification ou une redirection (session expirée).
 *  - Les pages gardées sont propres à l'appareil ; elles sont effacées à la déconnexion.
 */
const VERSION = "v3";
const STATIC_CACHE = `apo-static-${VERSION}`;
const PAGES_CACHE = "apo-pages";
const OFFLINE_URL = "/hors-ligne";

/** Pages consultables hors ligne. */
const PAGE_PREFIXES = ["/dashboard", "/shopping", "/planner", "/recipes", "/pantry"];
/** Une même page n'est pas re-téléchargée en arrière-plan plus d'une fois par période. */
const WARM_INTERVAL_MS = 10 * 60 * 1000;
const lastWarm = new Map();

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("apo-static-") && k !== STATIC_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isPage(url) {
  return PAGE_PREFIXES.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`));
}

function isStatic(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:woff2?|webp|png|svg|ico)$/.test(url.pathname)
  );
}

/** Clé de cache d'une page : l'URL sans paramètre technique de Next. */
function pageKey(url) {
  const u = new URL(url);
  u.searchParams.delete("_rsc");
  u.hash = "";
  return u.toString();
}

function storable(response) {
  return (
    response.ok &&
    !response.redirected &&
    response.type === "basic" &&
    (response.headers.get("content-type") || "").includes("text/html")
  );
}

/** Télécharge et garde la version HTML d'une page (en arrière-plan, au plus une fois par période). */
async function warm(href) {
  const key = pageKey(href);
  const now = Date.now();
  if (now - (lastWarm.get(key) || 0) < WARM_INTERVAL_MS) return;
  lastWarm.set(key, now);
  try {
    const res = await fetch(key, { credentials: "same-origin", headers: { Accept: "text/html" } });
    if (storable(res)) await (await caches.open(PAGES_CACHE)).put(key, res);
  } catch {
    // Hors ligne : on réessaiera plus tard.
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  if (isStatic(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok && res.type === "basic") cache.put(request, res.clone());
        return res;
      }),
    );
    return;
  }

  if (!isPage(url)) return;

  // Navigation complète : réseau d'abord, sinon la dernière version gardée.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          if (storable(res)) {
            const copy = res.clone();
            event.waitUntil(
              caches.open(PAGES_CACHE).then((c) => c.put(pageKey(request.url), copy)),
            );
          }
          return res;
        } catch {
          const cached = await caches.match(pageKey(request.url), { cacheName: PAGES_CACHE });
          return cached || (await caches.match(OFFLINE_URL)) || Response.error();
        }
      })(),
    );
    return;
  }

  // Navigation dans l'application (données RSC) : on laisse passer, et on garde en arrière-plan
  // la version HTML de la page visitée pour pouvoir la rouvrir hors ligne.
  if (request.headers.get("RSC") === "1" && !request.headers.get("Next-Router-Prefetch")) {
    event.waitUntil(warm(request.url));
  }
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "warm" && Array.isArray(data.urls)) {
    event.waitUntil(Promise.all(data.urls.map((u) => warm(new URL(u, self.location.origin).href))));
  }
  if (data.type === "clear-pages") {
    lastWarm.clear();
    event.waitUntil(caches.delete(PAGES_CACHE));
  }
});
