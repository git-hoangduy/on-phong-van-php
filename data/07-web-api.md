---
key: webapi
title: Web, HTTP & API
icon: 🌐
group: Backend
order: 7
desc: HTTP, status code, REST, idempotent, CORS, JWT vs session, OAuth2, webhook, GraphQL, WebSocket.
---

## [J] Điều gì xảy ra khi bạn gõ một URL vào trình duyệt và nhấn Enter?

1. Trình duyệt kiểm tra cache, phân giải **DNS** (cache trình duyệt → OS → resolver → root → TLD → authoritative) ra IP.
2. Thiết lập kết nối **TCP** (3-way handshake) và **TLS handshake** (HTTPS) — HTTP/3 dùng QUIC trên UDP.
3. Gửi **HTTP request** (method, header, cookie).
4. Server: load balancer → Nginx → PHP-FPM → Laravel → DB/cache → trả **HTTP response**.
5. Trình duyệt parse HTML, tải CSS/JS/ảnh, dựng DOM/CSSOM, layout, paint.

> 💡 Câu kinh điển. Nói theo các tầng và nhấn mạnh phần backend bạn hiểu rõ (Nginx, FPM, Laravel lifecycle).

## [J] Các HTTP status code thường gặp?

- **2xx**: `200 OK`, `201 Created`, `204 No Content`.
- **3xx**: `301` chuyển vĩnh viễn (SEO), `302` tạm thời, `304 Not Modified` (cache).
- **4xx** (lỗi client): `400` request sai, `401` chưa xác thực, `403` không có quyền, `404`, `405` sai method, `409` xung đột, `419` (Laravel: CSRF token hết hạn), `422` validate lỗi, `429` quá nhiều request.
- **5xx** (lỗi server): `500` lỗi code, `502 Bad Gateway` (upstream như PHP-FPM chết), `503` bảo trì/quá tải, `504 Gateway Timeout` (upstream chậm).

## [J] 401 và 403 khác nhau thế nào?

- `401 Unauthorized`: **chưa đăng nhập** / token sai, hết hạn → cần xác thực.
- `403 Forbidden`: **đã biết bạn là ai nhưng không có quyền**.
- Đôi khi trả `404` thay vì `403` để không tiết lộ tài nguyên có tồn tại.

## [J] Các HTTP method và ý nghĩa? Idempotent là gì?

| Method | Mục đích | Safe | Idempotent |
|---|---|---|---|
| GET | Đọc | ✔ | ✔ |
| POST | Tạo mới / hành động | ✘ | ✘ |
| PUT | Thay thế toàn bộ | ✘ | ✔ |
| PATCH | Cập nhật một phần | ✘ | không đảm bảo |
| DELETE | Xoá | ✘ | ✔ |

**Idempotent**: gọi 1 lần hay N lần cho cùng kết quả trên server. Quan trọng khi client **retry** (mạng chập chờn). Với POST quan trọng (thanh toán) dùng **Idempotency-Key** header để tránh tạo trùng.

## [J] REST API là gì? Nguyên tắc thiết kế RESTful?

- Tài nguyên là **danh từ số nhiều**: `GET /api/v1/orders`, `GET /orders/{id}`, `POST /orders`, `PATCH /orders/{id}`, `DELETE /orders/{id}`; quan hệ: `/orders/{id}/items`.
- Dùng đúng method + status code.
- Stateless: mỗi request tự chứa thông tin xác thực.
- Lọc/sắp xếp/phân trang qua query: `?status=paid&sort=-created_at&page=2&per_page=20`.
- Định dạng lỗi thống nhất: `{ "message": "...", "errors": { "email": ["..."] } }`.
- Versioning (`/v1`), rate limit, tài liệu (OpenAPI/Swagger, Scribe).
- Hành động không thuần CRUD: `POST /orders/{id}/cancel`.

## [J] HTTP và HTTPS khác nhau? HTTPS hoạt động thế nào?

HTTPS = HTTP + **TLS**: mã hoá, toàn vẹn dữ liệu, xác thực server qua chứng chỉ.
TLS handshake: client gửi hello → server gửi **certificate** (chứa public key, ký bởi CA) → client xác minh → hai bên thoả thuận **session key** (trao đổi khoá bất đối xứng, ECDHE) → dữ liệu mã hoá bằng **mã hoá đối xứng** (nhanh).
Thực tế: Let's Encrypt / Certbot, HSTS header, chuyển hướng 301 từ http sang https.

## [M] CORS là gì? Tại sao gặp lỗi CORS? Cách xử lý?

- **Same-Origin Policy**: trình duyệt chặn JS đọc response từ origin khác (khác scheme/domain/port).
- **CORS** cho phép server khai báo origin nào được phép qua header `Access-Control-Allow-Origin`, `-Methods`, `-Headers`, `-Credentials`.
- Request không "simple" (PUT/DELETE, JSON, header tuỳ chỉnh) → trình duyệt gửi **preflight `OPTIONS`** trước.
- Xử lý ở **server**, không phải frontend: Laravel cấu hình `config/cors.php` (`allowed_origins`, `supports_credentials`). Không để `*` cùng với credentials.
- CORS chỉ là cơ chế trình duyệt — Postman/curl không bị ảnh hưởng, và CORS **không phải** cơ chế bảo vệ API.

## [M] Session-based auth và Token-based (JWT) auth khác nhau thế nào?

| | Session | JWT |
|---|---|---|
| Lưu trạng thái | Server (Redis/DB) | Token tự chứa (stateless) |
| Thu hồi | Dễ (xoá session) | Khó (phải blacklist hoặc đợi hết hạn) |
| Scale | Cần store chung | Dễ, server chỉ verify chữ ký |
| Phù hợp | Web cùng domain | Mobile, microservice, bên thứ 3 |

**JWT** = `header.payload.signature` (base64url). Payload **không mã hoá**, chỉ ký → đừng để dữ liệu nhạy cảm. Thực hành tốt: access token ngắn hạn (5–15 phút) + **refresh token** dài hạn (rotate, lưu cookie HttpOnly), dùng thuật toán cố định (chặn `alg: none`).

## [M] OAuth2 là gì? Các luồng (grant type) chính?

OAuth2 là chuẩn **uỷ quyền**: cho phép app bên thứ ba truy cập tài nguyên thay người dùng mà không cần mật khẩu ("Đăng nhập bằng Google").

- **Authorization Code + PKCE**: cho web/SPA/mobile — phổ biến và an toàn nhất.
- **Client Credentials**: server-to-server, không có user.
- (Implicit, Password grant: đã lỗi thời, không khuyến nghị.)
- **OpenID Connect** = OAuth2 + lớp **xác thực** (ID token).
Laravel: Socialite (làm client), Passport (làm server).

## [M] Webhook là gì? Xử lý webhook (ví dụ từ cổng thanh toán) thế nào cho an toàn?

Webhook là việc hệ thống khác **chủ động gọi HTTP** tới bạn khi có sự kiện (thanh toán thành công, đơn GHN đổi trạng thái).

1. **Xác thực chữ ký** (HMAC với secret) và/hoặc whitelist IP.
2. Trả `200` **nhanh**, đẩy xử lý vào **queue**.
3. **Idempotent**: lưu `event_id`/mã giao dịch, bỏ qua nếu đã xử lý (provider sẽ gửi lại nhiều lần).
4. Không tin số tiền trong webhook mà đối chiếu với đơn hàng / gọi API truy vấn lại trạng thái.
5. Bỏ CSRF cho route webhook, log đầy đủ request.

## [M] Thiết kế phân trang, lọc, sắp xếp cho API danh sách?

- Offset: `?page=3&per_page=20` → trả `meta: { current_page, last_page, total }`.
- Cursor: `?cursor=eyJpZCI6MTAwfQ` → cho dữ liệu lớn/infinite scroll, không bị trùng/sót khi có bản ghi mới.
- Lọc: `?filter[status]=paid&filter[created_from]=2025-01-01`; sắp xếp `?sort=-created_at,total`. Package: `spatie/laravel-query-builder`.
- Whitelist cột được sort/filter (tránh SQL injection qua tên cột và sort cột không có index).
- Giới hạn `per_page` tối đa (ví dụ 100).

## [M] Versioning API như thế nào? Xử lý breaking change?

- URL (`/api/v1`) — phổ biến, rõ ràng; header (`Accept: application/vnd.app.v2+json`); query param.
- Không breaking: chỉ **thêm** field/endpoint. Breaking: đổi tên/xoá field, đổi kiểu, đổi ý nghĩa.
- Quy trình: ra v2 song song, thông báo deprecation (header `Deprecation`, `Sunset`), theo dõi client còn dùng v1, sau đó mới tắt.

## [M] GraphQL khác REST thế nào?

- GraphQL: **một endpoint**, client chọn đúng field cần → tránh over-fetching/under-fetching; schema có kiểu; phù hợp app nhiều màn hình, nhiều client.
- Nhược: cache HTTP khó hơn, dễ bị N+1 (cần DataLoader), query phức tạp có thể tốn tài nguyên (cần giới hạn depth/complexity).
- Laravel: **Lighthouse**.

## [M] WebSocket, Server-Sent Events, Long polling khác nhau?

- **Polling**: client hỏi định kỳ — đơn giản, lãng phí.
- **Long polling**: server giữ request đến khi có dữ liệu.
- **SSE**: server đẩy một chiều qua HTTP (thông báo, tiến độ, stream AI).
- **WebSocket**: kết nối hai chiều lâu dài (chat, game, collaborative). Laravel: Reverb + Echo.

## [S] Thiết kế API cho mobile app có hàng trăm nghìn người dùng, bạn quan tâm những gì?

- Xác thực token (Sanctum/OAuth2), refresh token, đăng xuất thiết bị.
- Versioning để app cũ vẫn chạy; trường "force update".
- Response gọn (Resource), nén gzip, phân trang cursor.
- Rate limit theo user/device, chống spam OTP.
- Idempotency-Key cho thao tác thanh toán, tạo đơn.
- Cache (Redis, ETag/`304`), CDN cho ảnh.
- Push notification qua queue (FCM/APNs).
- Giám sát lỗi/latency theo endpoint, log có request id.
- Tài liệu OpenAPI cho team mobile.
