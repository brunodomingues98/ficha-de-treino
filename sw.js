// ============================================================
//  sw.js — Service Worker mínimo
//  Necessário para o Chrome/Android considerar o site "instalável".
//  Aqui fazemos apenas um cache leve dos arquivos estáticos —
//  sem cache agressivo de páginas dinâmicas (login/dados mudam).
// ============================================================

const CACHE_NAME = 'ficha-treino-v1';

const ASSETS_ESTATICOS = [
  '/assets/css/style.css',
  '/assets/images/icons/icon-192.png',
  '/assets/images/icons/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_ESTATICOS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estratégia: network-first para tudo (garante dados sempre atualizados),
// cai pro cache só se a rede falhar (ex: sem internet momentânea).
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
