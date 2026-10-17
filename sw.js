// Service worker do Nosso Caixa: abre o app rápido e sem internet.
// Os dados financeiros NÃO passam por aqui: o Firestore cuida da sincronização e do cache offline.
const VERSAO = 'nosso-caixa-v4';

const APP = [
  './',
  './index.html',
  './firebase-config.js',
  './manifest.webmanifest',
  './icon.svg',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];
const BIBLIOTECAS = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSAO);
    await Promise.all(APP.map(u => cache.add(u).catch(() => {})));
    await Promise.all(BIBLIOTECAS.map(u => cache.add(new Request(u, { mode: 'cors' })).catch(() => {})));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSAO) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => { if (event.data === 'SKIP_WAITING') self.skipWaiting(); });

// Página e arquivos do app: tenta a rede (para receber atualizações) e cai no cache se estiver sem internet ou lenta.
async function redePrimeiro(req) {
  const cache = await caches.open(VERSAO);
  try {
    const res = await Promise.race([
      fetch(req),
      new Promise((_, rej) => setTimeout(() => rej(new Error('lento')), 4000))
    ]);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req, { ignoreSearch: true }))
      || (req.mode === 'navigate' ? await cache.match('./index.html') : null)
      || Response.error();
  }
}

// Bibliotecas, fontes e ícones: usa o cache na hora e atualiza em segundo plano.
async function cachePrimeiro(req) {
  const cache = await caches.open(VERSAO);
  const salvo = await cache.match(req);
  const rede = fetch(req).then(res => {
    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  return salvo || (await rede) || Response.error();
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const mesmoSite = url.origin === self.location.origin;
  const biblioteca = url.hostname === 'cdn.jsdelivr.net'
    || (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/'))
    || url.hostname === 'fonts.googleapis.com'
    || url.hostname === 'fonts.gstatic.com';
  if (!mesmoSite && !biblioteca) return; // Firestore e login: sempre direto na rede
  if (mesmoSite && (req.mode === 'navigate' || /\.(html|js|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/'))) {
    event.respondWith(redePrimeiro(req));
  } else {
    event.respondWith(cachePrimeiro(req));
  }
});
