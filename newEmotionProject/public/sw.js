// 서비스 워커 - PWA 오프라인 지원
const CACHE_NAME = 'ai-diary-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/login.html',
  '/signup.html',
  '/dashboard.html',
  '/write-diary.html',
  '/my-diary.html',
  '/chat.html',
  '/community.html',
  '/stats.html',
  '/my-page.html',
  '/style.css',
  '/js/supabase.js',
  '/js/auth.js',
  '/js/chat.js',
  '/js/write-diary.js',
  '/js/my-diary.js',
  '/js/components/nav.js',
  '/manifest.json'
];

// 설치 이벤트 - 정적 리소스 캐싱
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] 정적 파일 캐싱 중...');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// 활성화 이벤트 - 이전 캐시 정리
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] 이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 페치 이벤트 - 네트워크 우선, 캐시 폴백 전략
self.addEventListener('fetch', event => {
  const { request } = event;

  // API 요청은 항상 네트워크를 시도
  if (request.url.includes('/.netlify/functions/') ||
      request.url.includes('supabase.co')) {
    event.respondWith(
      fetch(request).catch(() => {
        // API 실패 시 오프라인 메시지 반환
        return new Response(
          JSON.stringify({
            error: '네트워크 연결을 확인해주세요. 오프라인 상태입니다.'
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 503
          }
        );
      })
    );
    return;
  }

  // 정적 파일은 캐시 우선
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then(response => {
            // GET 요청이고 성공적인 응답만 캐시 (POST, PUT, DELETE 등은 캐시하지 않음)
            if (request.method === 'GET' && response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(request, responseClone);
                });
            }
            return response;
          })
          .catch(() => {
            // 오프라인 상태에서 HTML 요청 시 기본 페이지 반환
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// 백그라운드 동기화 (향후 구현)
self.addEventListener('sync', event => {
  if (event.tag === 'diary-sync') {
    event.waitUntil(syncDiaries());
  }
});

// 푸시 알림 (향후 구현)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'open',
          title: '열기'
        },
        {
          action: 'close',
          title: '닫기'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// 알림 클릭 처리
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 오프라인 일기 동기화 함수
async function syncDiaries() {
  // IndexedDB에서 오프라인 저장된 일기들을 가져와서 동기화
  // 향후 구현 예정
  console.log('[SW] 일기 동기화 실행');
}