/* Uygulama kabuğu önbellekte tutulur (internetsiz çalışır).
   İçerik (data/*.json) önce ağdan istenir, ağ yoksa önbellekten gelir; böylece içerik güncellemesi için bu dosyayı değiştirmek gerekmez.
   index.html, app.js veya ikonlar değişince KABUK_SURUMU'nu artırın. */
var KABUK_SURUMU = 'rbr-kabuk-16';
var ICERIK = 'rbr-icerik';
var DATA = ['kaynaklar','cerrahi_bloklar','antitrombotik','komorbidite','kanit_panelleri','usg_baglantilari','dogrulama'].map(function (f) { return 'data/' + f + '.json'; });
var KABUK = ['./', 'index.html', 'app.js', 'manifest.webmanifest', 'icon.png', 'gizlilik.html'];

self.addEventListener('install', function (e) {
  e.waitUntil(Promise.all([
    caches.open(KABUK_SURUMU).then(function (c) { return c.addAll(KABUK); }),
    caches.open(ICERIK).then(function (c) { return c.addAll(DATA); })
  ]).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== KABUK_SURUMU && k !== ICERIK; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (u.pathname.indexOf('/data/') !== -1) {
    e.respondWith(fetch(e.request).then(function (r) {
      var kopya = r.clone(); caches.open(ICERIK).then(function (c) { c.put(e.request, kopya); }); return r;
    }).catch(function () { return caches.match(e.request); }));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (r) { return r || fetch(e.request); }));
});
