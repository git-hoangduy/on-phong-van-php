---
key: system
title: Thiết kế hệ thống & Hiệu năng
icon: 🏗️
group: DevOps & Kiến trúc
order: 10
desc: Scale, cache, queue, microservice vs monolith, CAP, rate limit, thiết kế URL shortener, flash sale, thông báo.
---

## [M] Scale theo chiều dọc và chiều ngang khác nhau thế nào?

- **Vertical (scale up)**: tăng CPU/RAM cho 1 server. Đơn giản, có giới hạn phần cứng, có single point of failure.
- **Horizontal (scale out)**: thêm nhiều server sau load balancer. Gần như không giới hạn, chịu lỗi tốt, nhưng app phải **stateless** (session/cache/file dùng chung).
- Thứ tự thường gặp: tối ưu code & query → cache → queue → scale DB đọc (replica) → scale ngang app → tách service/sharding.

## [M] Các chiến lược cache? Cache-aside là gì?

- **Cache-aside (lazy loading)**: đọc cache → miss thì đọc DB rồi ghi cache (`Cache::remember`). Phổ biến nhất.
- **Write-through**: ghi DB đồng thời cập nhật cache.
- **Write-behind**: ghi cache trước, đồng bộ DB sau (nhanh, rủi ro mất dữ liệu).
- Các tầng cache: trình duyệt → CDN → reverse proxy (Nginx/Varnish) → app (Redis) → DB buffer pool.
- Vấn đề: **invalidation** (xoá khi dữ liệu đổi), **stampede** (nhiều request cùng miss → lock/early refresh), **penetration** (truy vấn key không tồn tại liên tục → cache cả giá trị rỗng), TTL hợp lý + jitter.

> "There are only two hard things in Computer Science: cache invalidation and naming things."

## [M] Monolith và Microservices: ưu nhược điểm? Khi nào nên tách?

| | Monolith | Microservices |
|---|---|---|
| Phát triển ban đầu | Nhanh, đơn giản | Chậm, nhiều hạ tầng |
| Deploy | Cả khối | Từng service độc lập |
| Scale | Cả khối | Theo từng service |
| Giao tiếp | Gọi hàm | Qua mạng (HTTP/gRPC/queue) → độ trễ, lỗi mạng |
| Transaction | Dễ (DB chung) | Khó (saga, eventual consistency) |
| Vận hành | Đơn giản | Cần monitoring, tracing, CI/CD mạnh |

Khuyến nghị: bắt đầu bằng **modular monolith**; chỉ tách khi team lớn cần deploy độc lập hoặc một phần có nhu cầu scale/công nghệ rất khác (ví dụ service xử lý video).

## [M] Message queue (RabbitMQ, Kafka, SQS, Redis) dùng để làm gì?

- **Bất đồng bộ**: trả response nhanh, xử lý nặng phía sau.
- **Tách rời (decoupling)** các service.
- **San phẳng tải đột biến** (buffer), retry khi lỗi.
- Khác nhau: RabbitMQ (routing linh hoạt, ack), **Kafka** (log phân tán, throughput rất cao, đọc lại được, event streaming), SQS (quản lý sẵn), Redis (đơn giản, dùng với Laravel Horizon).
- Đảm bảo giao nhận: at-most-once, **at-least-once** (phổ biến → consumer phải idempotent), exactly-once (khó). Dead letter queue cho message lỗi nhiều lần.

## [M] CAP theorem là gì?

Trong hệ phân tán khi có **phân mảnh mạng (Partition)**, chỉ đảm bảo được một trong hai: **Consistency** (mọi node đọc cùng dữ liệu mới nhất) hoặc **Availability** (luôn phản hồi).
- CP: ngân hàng, tồn kho — thà báo lỗi còn hơn sai.
- AP: mạng xã hội, lượt like — chấp nhận **eventual consistency**.

## [M] Rate limiting: các thuật toán?

- **Fixed window**: đếm theo khung cố định (60 request/phút) — đơn giản, bị dồn ở mép khung.
- **Sliding window log/counter**: mượt hơn.
- **Token bucket**: token nạp đều, mỗi request tiêu 1 token, cho phép burst ngắn.
- **Leaky bucket**: xử lý với tốc độ cố định.
- Triển khai bằng Redis (`INCR` + `EXPIRE` atomic). Laravel `RateLimiter`. Áp dụng ở nhiều tầng: Cloudflare/Nginx (`limit_req`) → app.

## [M] CDN là gì? Khi nào dùng?

Mạng máy chủ phân tán theo địa lý, cache nội dung gần người dùng: ảnh, CSS/JS, video, thậm chí HTML/API.
Lợi ích: giảm độ trễ, giảm tải server gốc, chống DDoS. Dùng **cache busting** (file có hash: `app.3f9a.js` – Vite làm sẵn) để cập nhật. Phổ biến: Cloudflare, CloudFront, BunnyCDN.

## [S] Thiết kế hệ thống rút gọn link (URL shortener).

- **API**: `POST /links {url}` → `{code}`; `GET /{code}` → `301/302` redirect.
- **Sinh mã**: ID tự tăng → **Base62** (7 ký tự ≈ 3.5 nghìn tỷ mã); hoặc random + kiểm tra trùng; tránh mã đoán được nếu cần riêng tư.
- **DB**: `links(id, code UNIQUE, url, user_id, expires_at, created_at)`.
- **Đọc nhiều hơn ghi rất nhiều** → cache `code → url` trong Redis, CDN cache redirect.
- **Thống kê click**: không ghi DB đồng bộ mỗi lần redirect — đẩy event vào queue/Redis, gom batch ghi vào bảng thống kê.
- Chống lạm dụng: rate limit, kiểm tra URL độc hại (Safe Browsing).
- 301 (trình duyệt cache, mất thống kê) vs 302 (đếm được mọi click).

## [S] Thiết kế tính năng Flash Sale (10.000 người tranh 100 sản phẩm).

- **Chặn tải trước khi tới DB**: CDN cho trang tĩnh, waiting room/queue, rate limit theo user, captcha.
- **Tồn kho trong Redis**: `DECR` atomic (hoặc Lua script kiểm tra-và-trừ); ≤ 0 thì từ chối ngay.
- Đặt chỗ thành công → đẩy **queue** tạo đơn trong DB, giữ hàng X phút chờ thanh toán; quá hạn → hoàn kho.
- DB là chốt cuối: `UPDATE ... SET stock = stock - 1 WHERE id = ? AND stock > 0`, unique `(user_id, campaign_id)` chống mua trùng.
- Idempotency-Key chống double submit; đối soát Redis ↔ DB sau chiến dịch.
- Load test trước (k6, JMeter), chuẩn bị scale và giám sát.

## [S] Thiết kế hệ thống gửi thông báo (email, SMS, push) cho hàng triệu người dùng.

- API nhận yêu cầu → lưu `notifications` → đẩy vào **queue** theo kênh và độ ưu tiên (OTP ưu tiên cao, marketing thấp).
- Worker theo kênh gọi provider (SES, ESMS/Twilio, FCM/APNs), có **retry + backoff**, dead-letter queue.
- Rate limit theo provider; chia batch; fallback provider khi lỗi.
- Template, đa ngôn ngữ, tuỳ chọn nhận thông báo của user (opt-out), giờ yên tĩnh.
- Theo dõi trạng thái gửi/đã nhận/đã mở qua webhook của provider.
- Idempotency để không gửi trùng.

## [S] Thiết kế hệ thống chat realtime.

- Kết nối **WebSocket** (Laravel Reverb / Soketi / Socket.IO) — server WS stateless, scale ngang với **Redis pub/sub** để phát tin giữa các node.
- Lưu tin nhắn: MySQL bảng `messages(conversation_id, sender_id, body, created_at)` index `(conversation_id, id)`; khối lượng rất lớn thì Cassandra/ScyllaDB.
- Phân trang tin nhắn bằng cursor (id); trạng thái đã đọc `last_read_message_id` theo user.
- Online/offline (presence) bằng Redis có TTL; push notification khi offline.
- Upload file qua S3 presigned URL.

## [S] Làm sao đảm bảo nhất quán dữ liệu giữa các service (distributed transaction)?

- Tránh 2PC (chậm, phức tạp). Dùng **Saga**: chuỗi transaction cục bộ, mỗi bước có **hành động bù trừ** (huỷ đơn → hoàn tiền → hoàn kho).
  - Choreography: các service phản ứng theo event.
  - Orchestration: một orchestrator điều phối.
- **Transactional Outbox**: ghi dữ liệu + event vào bảng `outbox` trong cùng transaction, job riêng đọc outbox để publish → không mất event.
- Consumer idempotent, chấp nhận eventual consistency, job đối soát định kỳ.

## [S] Hệ thống đột nhiên chậm/sập lúc cao điểm, bạn xử lý thế nào?

1. **Giảm thiệt hại trước**: scale tạm, bật cache mạnh hơn, tắt tính năng không thiết yếu, rollback nếu do bản deploy mới.
2. **Xác định nút cổ chai**: APM, CPU/RAM/connection, slow query log, `SHOW PROCESSLIST`, queue backlog, log lỗi.
3. Nguyên nhân thường gặp: query thiếu index sau khi dữ liệu lớn lên, N+1, cache hết hạn đồng loạt, hết PHP-FPM worker hoặc DB connection, API bên thứ ba chậm không có timeout, cron nặng chạy giờ cao điểm.
4. Sửa gốc, viết post-mortem, thêm alert + load test.

> 💡 Câu này đánh giá tư duy và sự bình tĩnh — kể theo thứ tự ưu tiên và nhắc đến việc báo cáo/giao tiếp với team.
