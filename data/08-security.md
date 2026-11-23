---
key: security
title: Bảo mật Web
icon: 🔐
group: Backend
order: 8
desc: SQL injection, XSS, CSRF, mật khẩu, IDOR, upload, OWASP Top 10, bảo mật API.
---

## [J] SQL Injection là gì? Cách phòng chống?

Kẻ tấn công chèn câu SQL qua input do code **nối chuỗi** trực tiếp.

```php
// ❌ Lỗ hổng: ?id=1 OR 1=1   hoặc  ?email=' OR '1'='1
$db->query("SELECT * FROM users WHERE email = '$email'");

// ✅ Prepared statement
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);

// Laravel: Eloquent/Query Builder tự binding
User::where('email', $email)->first();
DB::select('select * from users where id = ?', [$id]);
```

Lưu ý: `whereRaw`, `orderByRaw`, `DB::raw` vẫn có thể bị nếu nối chuỗi; **tên cột/hướng sort không bind được** → phải whitelist. Thêm: tài khoản DB quyền tối thiểu.

## [J] XSS (Cross-Site Scripting) là gì? Các loại và cách phòng chống?

Chèn mã JS độc vào trang để chạy trên trình duyệt nạn nhân (đánh cắp cookie/token, giả mạo thao tác).

- **Stored**: lưu trong DB (comment chứa `<script>`).
- **Reflected**: qua URL/param phản hồi lại trang.
- **DOM-based**: JS phía client chèn dữ liệu vào DOM (`innerHTML`).

Phòng chống:
- **Escape output** theo ngữ cảnh: Blade `{{ }}` tự escape; tránh `{!! !!}` với dữ liệu người dùng.
- Nội dung rich text (editor): **sanitize** bằng HTML Purifier, whitelist thẻ.
- JS: dùng `textContent` thay `innerHTML`; Vue `{{ }}` an toàn, cẩn thận `v-html`.
- Cookie `HttpOnly`, header **Content-Security-Policy**.

## [J] CSRF là gì? Cách phòng chống?

Cross-Site Request Forgery: trang độc hại khiến trình duyệt của nạn nhân (đang đăng nhập) gửi request tới site của bạn — trình duyệt tự đính kèm cookie.

Phòng chống:
- **CSRF token** trong form (Laravel `@csrf`).
- Cookie `SameSite=Lax/Strict`.
- Không dùng GET cho thao tác thay đổi dữ liệu.
- Kiểm tra header `Origin`/`Referer` cho thao tác quan trọng; xác nhận lại mật khẩu/OTP cho thao tác nhạy cảm.

## [J] Lưu mật khẩu người dùng như thế nào cho đúng?

- **Không bao giờ** lưu plain text, không dùng MD5/SHA1/SHA256 thuần (quá nhanh → brute-force bằng GPU, rainbow table).
- Dùng hàm băm chậm, có **salt** tự động: **bcrypt** hoặc **Argon2id**.

```php
$hash = password_hash($password, PASSWORD_DEFAULT); // hoặc PASSWORD_ARGON2ID
password_verify($input, $hash);
password_needs_rehash($hash, PASSWORD_DEFAULT);
// Laravel
Hash::make($password); Hash::check($input, $hash);
```

- Kèm theo: rate limit đăng nhập, khoá tạm sau nhiều lần sai, 2FA, chính sách mật khẩu, không báo "email không tồn tại" (tránh dò tài khoản).

## [J] Mã hoá (encryption) và băm (hashing) khác nhau thế nào?

- **Hash**: một chiều, không giải ngược được — dùng cho mật khẩu, kiểm tra toàn vẹn (checksum), HMAC chữ ký.
- **Encryption**: hai chiều, giải mã được với khoá — dùng cho dữ liệu cần đọc lại (số CCCD, token bên thứ ba). Laravel: `Crypt::encryptString()`, cast `encrypted` (AES-256 với `APP_KEY`).
- **Encoding** (base64): chỉ đổi định dạng, **không bảo mật**.

## [M] IDOR / Broken Access Control là gì?

Người dùng truy cập tài nguyên của người khác chỉ bằng cách đổi ID: `GET /api/orders/1002` thay vì `1001`. Đây là lỗi **số 1 trong OWASP Top 10** (Broken Access Control).

Phòng chống:
- **Luôn kiểm tra quyền sở hữu**: Policy (`$this->authorize('view', $order)`), hoặc query qua quan hệ: `$request->user()->orders()->findOrFail($id)`.
- Không chỉ ẩn nút trên giao diện — phải chặn ở backend.
- Có thể dùng UUID/ULID để khó đoán hơn, nhưng **không thay thế** kiểm tra quyền.

## [M] OWASP Top 10 gồm những gì?

Danh sách (bản 2021, bản 2025 có điều chỉnh nhỏ thứ tự và gộp mục):
1. Broken Access Control (IDOR, leo quyền)
2. Cryptographic Failures (lộ dữ liệu, mã hoá yếu)
3. Injection (SQL, command, XSS)
4. Insecure Design
5. Security Misconfiguration (`APP_DEBUG=true` trên production, để lộ `.env`, `.git`)
6. Vulnerable & Outdated Components (package cũ — dùng `composer audit`, `npm audit`)
7. Identification & Authentication Failures
8. Software & Data Integrity Failures (supply chain, deserialization)
9. Security Logging & Monitoring Failures
10. SSRF (Server-Side Request Forgery)

## [M] Bảo mật upload file: những rủi ro nào?

- Upload **webshell** `.php` (hoặc `shell.php.jpg`, `.phtml`) rồi truy cập để chạy lệnh trên server.
- File quá lớn → DoS; ảnh chứa mã độc; SVG chứa JS (XSS); path traversal qua tên file `../../`.

Phòng chống: validate MIME thật + extension whitelist, giới hạn dung lượng, đổi tên ngẫu nhiên, lưu ngoài webroot hoặc S3, cấu hình Nginx **không thực thi PHP** trong thư mục upload, trả file với `Content-Disposition: attachment` cho loại không phải ảnh, quét virus nếu cần.

## [M] Security header nào nên cấu hình?

- `Strict-Transport-Security` (HSTS): bắt buộc HTTPS.
- `Content-Security-Policy`: giới hạn nguồn script/style → giảm thiệt hại XSS.
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY` hoặc CSP `frame-ancestors` → chống **clickjacking**.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy`.
- Ẩn version: `server_tokens off` (Nginx), `expose_php = Off`.

## [M] Bảo mật API: những điểm cần chú ý?

- HTTPS bắt buộc; xác thực token; token có hạn và thu hồi được.
- Phân quyền **từng endpoint, từng object** (chống IDOR).
- Validate mọi input, giới hạn kích thước body, whitelist field (mass assignment).
- Rate limit, chống brute-force, chống spam OTP/SMS (tốn tiền).
- Không trả thừa dữ liệu (dùng Resource), không trả stack trace.
- Log + cảnh báo hành vi bất thường; không log mật khẩu/token/số thẻ.
- CORS chặt chẽ, secret không nằm trong code/repo.

## [M] Session hijacking và session fixation là gì?

- **Hijacking**: kẻ tấn công lấy được session ID (qua XSS, mạng không mã hoá) rồi đăng nhập thay nạn nhân → dùng HTTPS, cookie `HttpOnly`, `Secure`.
- **Fixation**: kẻ tấn công ép nạn nhân dùng một session ID biết trước, chờ nạn nhân đăng nhập → **regenerate session ID sau khi đăng nhập** (Laravel làm sẵn: `$request->session()->regenerate()`).
- Đăng xuất phải `invalidate()` session và `regenerateToken()`.

## [S] SSRF là gì? Ví dụ trong ứng dụng PHP?

Server-Side Request Forgery: server bị lừa gửi request tới địa chỉ kẻ tấn công chọn, thường là **mạng nội bộ** hoặc metadata cloud (`http://169.254.169.254/` lấy credential AWS).

Ví dụ: tính năng "nhập URL ảnh để tải về", "xem trước link", webhook URL do người dùng nhập.
Phòng chống: whitelist domain/scheme, phân giải DNS và chặn IP private/loopback/link-local, tắt redirect tự động, timeout, chạy trong network hạn chế, dùng IMDSv2 trên AWS.

## [S] Insecure deserialization trong PHP là gì?

`unserialize()` dữ liệu không tin cậy có thể khởi tạo object tuỳ ý → kích hoạt magic method (`__wakeup`, `__destruct`) trong các class sẵn có (**POP chain**) → thực thi mã từ xa.
Phòng chống: không `unserialize()` input người dùng — dùng `json_decode`; nếu bắt buộc thì `unserialize($data, ['allowed_classes' => false])`; giữ `APP_KEY` bí mật (Laravel cookie/payload mã hoá dựa vào nó).

## [S] Bạn sẽ làm gì nếu phát hiện hệ thống đang bị tấn công/rò rỉ dữ liệu?

1. **Khoanh vùng**: chặn IP/tài khoản, tắt tính năng bị khai thác, bật maintenance nếu cần.
2. Báo ngay cho lead/manager — không tự xử lý âm thầm.
3. **Giữ bằng chứng**: log, snapshot server.
4. Xoay vòng secret: `APP_KEY`, mật khẩu DB, API key, token người dùng.
5. Tìm nguyên nhân gốc, vá lỗ hổng, kiểm tra backdoor.
6. Đánh giá dữ liệu bị lộ, thông báo người dùng/cơ quan theo quy định (Nghị định 13/2023 về bảo vệ dữ liệu cá nhân, nay là Luật Bảo vệ dữ liệu cá nhân).
7. Viết **post-mortem**, bổ sung giám sát để không lặp lại.
