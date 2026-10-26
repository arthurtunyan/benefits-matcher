// Offline cache for this site's own files only: the page itself network-first (so a new deploy shows at once),
// everything else stale-while-revalidate (built files have hashed names, so they never go stale).
// It never sees household answers: screening happens in memory, not over the network.
// ponytail: old hashed files pile up in this cache; bump the name when that matters (activate deletes old caches).
const CACHE = 'open-door-v3'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req)
      const fresh = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone())
          return res
        })
        .catch(() => hit)
      return req.mode === 'navigate' ? fresh : hit || fresh // offline, `fresh` falls back to the cached page
    }),
  )
})
