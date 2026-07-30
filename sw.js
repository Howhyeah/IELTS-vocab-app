const CACHE_NAME = 'ielts-vocab-v1';
const DATA_CACHE_NAME = 'ielts-vocab-data-v1';

const STATIC_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

const DATA_FILES = [
  './data/core_words.json',
  './data/spatial_words.json',
  './data/root_families.json',
  './data/collocations.json',
  './data/recognition_words.json'
];

// 安装时缓存静态文件
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
  );
});

// 激活时清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截请求
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // 数据文件使用网络优先策略
  if (DATA_FILES.some(file => url.pathname.endsWith(file.replace('./', '')))) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(DATA_CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // 静态文件使用缓存优先策略
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// 监听消息，用于更新数据
self.addEventListener('message', event => {
  if (event.data.action === 'updateData') {
    caches.delete(DATA_CACHE_NAME)
      .then(() => {
        event.ports[0].postMessage({ status: 'Data cache cleared' });
      });
  }
});
