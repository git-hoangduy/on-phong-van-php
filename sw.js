// Service worker: cho phép học offline sau lần mở đầu tiên.
// - Trang HTML: network-first (luôn lấy nội dung mới nếu có mạng), mất mạng thì dùng bản đã lưu.
// - CSS/JS/ảnh: cache-first (file có ?v=... nên đổi nội dung là đổi URL).
const CACHE = 'pv-php-v1';

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE).then(c => c.addAll(['./'])).catch(() => {}));
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then(res => {
                    const copy = res.clone();
                    caches.open(CACHE).then(c => c.put('./', copy));
                    return res;
                })
                .catch(() => caches.match('./'))
        );
        return;
    }

    event.respondWith(
        caches.match(req).then(hit => hit || fetch(req).then(res => {
            if (res.ok) {
                const copy = res.clone();
                caches.open(CACHE).then(async c => {
                    // xoá bản cũ cùng đường dẫn (khác ?v=)
                    const path = new URL(req.url).pathname;
                    for (const k of await c.keys()) {
                        if (new URL(k.url).pathname === path && k.url !== req.url) c.delete(k);
                    }
                    c.put(req, copy);
                });
            }
            return res;
        }))
    );
});
