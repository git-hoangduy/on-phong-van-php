---
key: php
title: PHP Core
icon: 🐘
group: Backend
order: 1
desc: Kiểu dữ liệu, biến, hàm, PHP 8.x, session/cookie, xử lý lỗi, Composer, hiệu năng.
---

## [J] PHP là gì? PHP chạy như thế nào khi có một request?

PHP là ngôn ngữ kịch bản phía server, thông dịch (có OPcache biên dịch sẵn opcode).

Luồng một request phổ biến (Nginx + PHP-FPM):

1. Trình duyệt gửi HTTP request → **Nginx** nhận.
2. Nginx thấy file `.php` → chuyển qua **FastCGI** đến **PHP-FPM**.
3. PHP-FPM lấy 1 worker process, Zend Engine biên dịch code thành **opcode** (lấy từ OPcache nếu đã có) và thực thi.
4. Kết quả (HTML/JSON) trả về Nginx → trình duyệt.
5. Hết request, mọi biến/đối tượng bị huỷ (**shared-nothing** – mỗi request độc lập).

> 💡 Ghi điểm: nhắc tới mô hình shared-nothing và việc Laravel Octane (Swoole/RoadRunner/FrankenPHP) giữ app trong bộ nhớ giữa các request để tăng tốc.

## [J] Sự khác nhau giữa `==` và `===`?

- `==` so sánh **giá trị** sau khi ép kiểu (loose comparison).
- `===` so sánh **giá trị và kiểu** (strict).

```php
0 == "a";     // false từ PHP 8 (PHP 7 là true!)
"1" == "01";  // true
"10" == "1e1";// true
100 == "1e2"; // true
null == false;// true
1 === "1";    // false
```

> 💡 Luôn ưu tiên `===`, bật `declare(strict_types=1);`. Hàm `in_array`, `array_search` nên truyền tham số `strict = true`.

## [J] Các kiểu dữ liệu trong PHP?

- **Scalar**: `int`, `float`, `string`, `bool`
- **Compound**: `array`, `object`, `callable`, `iterable`
- **Đặc biệt**: `null`, `resource`
- Kiểu khai báo (type declaration) thêm: `mixed`, `void`, `never`, `static`, `self`, union `int|string`, intersection `A&B`, nullable `?int`, DNF `(A&B)|null` (8.2), `true`/`false`/`null` đứng riêng (8.2).

## [J] `isset()`, `empty()`, `is_null()` khác nhau thế nào?

| Giá trị | isset | empty | is_null |
|---|---|---|---|
| biến chưa khai báo | false | true | warning + true |
| `null` | false | true | true |
| `""`, `"0"`, `0`, `[]`, `false` | true | **true** | false |
| `"abc"` | true | false | false |

- `isset` kiểm tra tồn tại và khác null (không phát warning).
- `empty` = `!isset($x) || $x == false`.
- Bẫy kinh điển: `empty("0")` là **true**.
- Nên dùng toán tử `??`: `$name = $_GET['name'] ?? 'guest';`

## [J] Sự khác nhau giữa `include`, `require`, `include_once`, `require_once`?

- `include`: lỗi khi không tìm thấy file → **warning**, script chạy tiếp.
- `require`: lỗi → **fatal error**, dừng script.
- `_once`: kiểm tra nếu file đã được nạp rồi thì không nạp lại (tránh khai báo trùng function/class).
- Thực tế hiện nay hầu như dùng **Composer autoload (PSR-4)** thay vì require thủ công.

## [J] Khác nhau giữa GET và POST?

| | GET | POST |
|---|---|---|
| Dữ liệu | Trên URL (query string) | Trong body |
| Kích thước | Giới hạn bởi URL (~2–8KB tuỳ server) | Lớn (giới hạn bởi `post_max_size`) |
| Cache / bookmark | Được | Không |
| Idempotent | Có (không nên thay đổi dữ liệu) | Không |
| Dùng cho | Đọc dữ liệu, tìm kiếm, lọc | Tạo mới, gửi form, upload |

> POST **không bảo mật hơn** GET về bản chất — chỉ HTTPS mới mã hoá. Nhưng GET dễ lộ dữ liệu qua log, history, Referer.

## [J] Session và Cookie khác nhau thế nào?

- **Cookie**: lưu ở **trình duyệt**, gửi kèm mỗi request, tối đa ~4KB, người dùng xem/sửa được.
- **Session**: dữ liệu lưu ở **server** (file, Redis, DB), trình duyệt chỉ giữ **session ID** trong cookie (`PHPSESSID`).
- Bảo mật cookie: `HttpOnly` (JS không đọc được → chống XSS đánh cắp), `Secure` (chỉ HTTPS), `SameSite=Lax/Strict` (chống CSRF).
- Gọi `session_regenerate_id(true)` sau khi đăng nhập để chống **session fixation**.
- Khi scale nhiều server: lưu session ở **Redis** thay vì file để các server dùng chung.

## [J] `echo`, `print`, `print_r`, `var_dump` khác nhau thế nào?

- `echo`: language construct, nhanh, nhận nhiều tham số, không trả về giá trị.
- `print`: construct, 1 tham số, luôn trả về `1`.
- `print_r`: in mảng/đối tượng dễ đọc; `print_r($x, true)` trả về chuỗi.
- `var_dump`: in cả **kiểu và độ dài** — dùng để debug.
- `var_export`: in ra code PHP hợp lệ. Trong Laravel thường dùng `dd()`, `dump()`, Laravel Telescope hoặc Xdebug.

## [J] Truyền tham trị và tham chiếu trong PHP?

- Mặc định truyền **tham trị** (copy-on-write: chỉ copy khi bị sửa).
- Thêm `&` để truyền **tham chiếu**: `function add(array &$arr) { $arr[] = 1; }`
- **Object** được truyền bằng *object handle* — sửa thuộc tính bên trong hàm sẽ ảnh hưởng object gốc, nhưng gán lại biến thì không.
- Bẫy với `foreach` tham chiếu:

```php
$a = [1, 2, 3];
foreach ($a as &$v) {}
foreach ($a as $v) {}
print_r($a); // [1, 2, 2]  -> luôn unset($v) sau vòng lặp tham chiếu
```

## [J] Superglobals trong PHP là gì?

Biến toàn cục có sẵn ở mọi scope: `$_GET`, `$_POST`, `$_REQUEST`, `$_SERVER`, `$_SESSION`, `$_COOKIE`, `$_FILES`, `$_ENV`, `$GLOBALS`.
Không bao giờ tin dữ liệu từ `$_GET/$_POST/$_COOKIE/$_SERVER['HTTP_*']` — luôn validate và escape.

## [J] Các hàm xử lý mảng hay dùng?

- Duyệt/biến đổi: `array_map`, `array_filter`, `array_reduce`, `array_walk`
- Tìm: `in_array`, `array_search`, `array_key_exists`, `array_find` (8.4)
- Gộp/cắt: `array_merge`, `+` (giữ key bên trái), `array_slice`, `array_splice`, `array_chunk`, `array_combine`
- Key/value: `array_keys`, `array_values`, `array_column`, `array_flip`, `array_unique`
- Sắp xếp: `sort`, `rsort`, `asort` (giữ key, theo value), `ksort` (theo key), `usort` (custom)
- Tập hợp: `array_diff`, `array_intersect`

> `array_merge` đánh lại key số; toán tử `+` giữ phần tử của mảng trái nếu trùng key.

## [M] Những tính năng nổi bật của PHP 8.x?

- **8.0**: JIT, named arguments, union types, `match`, nullsafe `?->`, constructor property promotion, attributes `#[...]`, `str_contains`, `0 == "a"` là false.
- **8.1**: **Enum**, `readonly` property, Fibers, `never` type, first-class callable `strlen(...)`, `new` trong initializer, intersection types.
- **8.2**: `readonly` class, DNF types, `true`/`false`/`null` types, deprecate dynamic properties.
- **8.3**: typed class constants, `#[\Override]`, `json_validate()`, dynamic class constant fetch.
- **8.4**: **property hooks**, asymmetric visibility `public private(set)`, `new Foo()->bar()` không cần ngoặc, `array_find`/`array_any`/`array_all`, `#[\Deprecated]`.
- **8.5** (11/2025): pipe operator `|>`, `array_first()`/`array_last()`, extension URI, `#[\NoDiscard]`, clone with.

```php
enum Status: string {
    case Active = 'active';
    case Banned = 'banned';
    public function label(): string {
        return match($this) { self::Active => 'Hoạt động', self::Banned => 'Bị khoá' };
    }
}

final class User {
    public function __construct(
        public readonly int $id,
        public private(set) string $name, // 8.4
    ) {}
}
```

> 💡 Nói được phiên bản PHP/Laravel mà dự án bạn đang dùng và đã dùng tính năng mới nào trong thực tế.

## [M] `match` khác `switch` thế nào?

- `match` là **biểu thức** (trả về giá trị), so sánh **strict** (`===`), không cần `break`, không fall-through.
- Không khớp nhánh nào → ném `UnhandledMatchError`.
- Nhiều điều kiện một nhánh: `1, 2 => 'low'`.

```php
$label = match(true) {
    $score >= 8 => 'Giỏi',
    $score >= 5 => 'Đạt',
    default     => 'Trượt',
};
```

## [M] Closure, arrow function, `callable` trong PHP?

- **Closure** (anonymous function): dùng `use` để bắt biến ngoài — mặc định bắt **theo giá trị**, `use (&$x)` để bắt tham chiếu.
- **Arrow function** `fn($x) => $x * $k`: tự động bắt biến ngoài theo giá trị, chỉ 1 biểu thức.
- `Closure::fromCallable()` hoặc `strlen(...)` (8.1) tạo closure từ hàm có sẵn.
- `$closure->bindTo($obj)` / `Closure::bind` để đổi `$this`.

```php
$tax = 0.1;
$withTax = array_map(fn($p) => $p * (1 + $tax), $prices);
```

## [M] Generator và `yield` là gì? Khi nào dùng?

Generator là hàm trả về từng phần tử một khi được duyệt (lazy), **không tải hết dữ liệu vào bộ nhớ**.

```php
function readLines(string $file): Generator {
    $h = fopen($file, 'r');
    while (($line = fgets($h)) !== false) {
        yield $line;
    }
    fclose($h);
}
foreach (readLines('big.csv') as $line) { /* xử lý file 5GB với RAM vài MB */ }
```

Dùng khi: đọc file lớn, export dữ liệu lớn, xử lý hàng triệu bản ghi. Laravel dùng nó trong `LazyCollection`, `cursor()`, `lazy()`.

## [M] Composer là gì? `composer.json` vs `composer.lock`? `install` vs `update`?

- Composer: trình quản lý thư viện + **autoload** (PSR-4) cho PHP.
- `composer.json`: khai báo dependency và **ràng buộc phiên bản** (`^10.0`).
- `composer.lock`: ghi **chính xác phiên bản** đã cài → mọi người/server cài giống nhau. **Phải commit file lock** với project.
- `composer install`: cài theo `composer.lock` (dùng trên CI/production, kèm `--no-dev --optimize-autoloader`).
- `composer update`: tìm phiên bản mới theo ràng buộc trong json, cập nhật lại lock.
- Semver: `^1.2.3` = `>=1.2.3 <2.0.0`; `~1.2.3` = `>=1.2.3 <1.3.0`.

## [M] PSR là gì? Kể các PSR quan trọng.

PSR (PHP Standards Recommendations) do PHP-FIG đưa ra để các thư viện tương thích nhau.

- **PSR-1/PSR-12** (nay là **PER Coding Style**): chuẩn code style.
- **PSR-4**: autoload — namespace ánh xạ thư mục.
- **PSR-3**: Logger interface.
- **PSR-7**: HTTP message (Request/Response).
- **PSR-11**: Container interface.
- **PSR-15**: HTTP middleware.
- **PSR-6/16**: Cache.

Công cụ: PHP-CS-Fixer, **Laravel Pint**, PHP_CodeSniffer.

## [M] Xử lý lỗi và exception trong PHP? `Error` vs `Exception`?

- Từ PHP 7, phần lớn lỗi fatal ném ra `Error` (TypeError, DivisionByZeroError…). `Exception` là lỗi nghiệp vụ/ứng dụng.
- Cả hai implement `Throwable` → `catch (Throwable $e)` bắt tất cả.
- `try / catch / finally`; nhiều kiểu: `catch (A | B $e)`.
- Tạo exception riêng cho domain: `class InsufficientBalanceException extends DomainException {}`.
- `set_exception_handler`, `set_error_handler` để xử lý toàn cục (Laravel đã làm sẵn trong `bootstrap/app.php` → `withExceptions`).

> 💡 Không nuốt lỗi (`catch {}` rỗng), log đủ context, không hiện stack trace cho người dùng trên production (`APP_DEBUG=false`).

## [M] Static trong PHP: `self::` vs `static::` (late static binding)?

- `self::` trỏ tới class **nơi code được viết**.
- `static::` trỏ tới class **được gọi lúc runtime** (late static binding).

```php
class Model {
    public static function create(): static { return new static(); }
    public static function who() { return self::class; }
}
class User extends Model {}
User::create(); // User
User::who();    // Model
```

Eloquent dùng `static::` rất nhiều (`User::query()`, `User::create()`).

## [M] Magic methods hay dùng?

`__construct`, `__destruct`, `__get`, `__set`, `__isset`, `__unset`, `__call`, `__callStatic`, `__toString`, `__invoke`, `__clone`, `__serialize/__unserialize`, `__debugInfo`.

- Eloquent dùng `__get/__set` để truy cập attribute (`$user->name`), `__call/__callStatic` để forward sang Query Builder (`User::where(...)`).
- **Facade** của Laravel dùng `__callStatic`.

## [M] Shallow copy và deep copy, `clone` hoạt động thế nào?

- `$b = $a` với object → 2 biến cùng trỏ một object.
- `clone $a` → tạo bản sao **nông**: các thuộc tính là object bên trong vẫn dùng chung.
- Muốn deep copy: định nghĩa `__clone()` để clone tiếp các object con.

```php
public function __clone() { $this->address = clone $this->address; }
```

## [M] Upload file an toàn trong PHP?

1. Kiểm tra `$_FILES['f']['error'] === UPLOAD_ERR_OK`.
2. Giới hạn kích thước (`upload_max_filesize`, `post_max_size` và validate ở app).
3. Kiểm tra **MIME thật** bằng `finfo_file` (không tin `type` client gửi, không chỉ dựa vào đuôi file).
4. Đặt **tên mới ngẫu nhiên**, whitelist extension.
5. Lưu **ngoài webroot** hoặc lên S3; thư mục upload không cho thực thi PHP.
6. Dùng `move_uploaded_file()`.

Laravel: `$request->validate(['avatar' => 'required|image|mimes:jpg,png|max:2048'])` rồi `$file->store('avatars', 's3')`.

## [M] OPcache và JIT là gì?

- **OPcache**: cache opcode đã biên dịch vào shared memory → không phải parse lại file mỗi request. Bắt buộc bật trên production (tăng tốc 2–3 lần). Production có thể đặt `opcache.validate_timestamps=0` và reset khi deploy.
- **Preloading** (7.4+): nạp sẵn class vào memory khi FPM khởi động.
- **JIT** (8.0+): biên dịch opcode sang mã máy. Lợi lớn cho tác vụ tính toán CPU; với web app thông thường (I/O bound, chờ DB) lợi ích nhỏ.

## [M] PHP-FPM là gì? Cấu hình `pm` thế nào?

PHP-FPM (FastCGI Process Manager) quản lý pool worker xử lý PHP.

- `pm = static`: số worker cố định (`pm.max_children`) — hiệu năng ổn định, tốn RAM.
- `pm = dynamic`: dao động giữa `min_spare_servers` và `max_spare_servers`.
- `pm = ondemand`: chỉ tạo khi có request — tiết kiệm RAM, server ít traffic.
- Ước lượng: `max_children ≈ RAM dành cho PHP / RAM trung bình mỗi worker` (ví dụ 4GB / 60MB ≈ 60).
- Lỗi `502 Bad Gateway` thường do FPM chết/hết worker; `504` do timeout.

## [M] Làm sao xử lý một file CSV/Excel 1 triệu dòng bằng PHP?

- Đọc **stream** theo từng dòng (`fgetcsv`, `SplFileObject`, Generator) — không `file()` cả file.
- **Insert theo batch** (500–1000 dòng/lần) trong transaction, hoặc `LOAD DATA INFILE`.
- Đẩy vào **queue** chạy nền, chia chunk, báo tiến độ cho người dùng.
- Tắt query log, dùng `unset` / tránh giữ tham chiếu để giải phóng bộ nhớ.
- Excel: dùng thư viện hỗ trợ đọc theo chunk (Laravel Excel `WithChunkReading`, OpenSpout).

## [M] Namespace và autoload hoạt động thế nào?

- Namespace tránh trùng tên class, nhóm code theo module.
- Autoload: khi dùng class chưa nạp, PHP gọi các hàm đăng ký qua `spl_autoload_register`.
- Composer PSR-4: `"App\\": "app/"` → `App\Http\Controllers\UserController` ánh xạ `app/Http/Controllers/UserController.php`.
- Sau khi thêm mapping mới: `composer dump-autoload`. Production: `composer dump-autoload -o` (classmap).

## [S] Garbage collection và quản lý bộ nhớ trong PHP?

- PHP dùng **reference counting**: biến có refcount = 0 thì giải phóng ngay.
- Vòng tham chiếu (A → B → A) không về 0 được → **cycle collector** chạy định kỳ khi root buffer đầy (10.000 phần tử) hoặc gọi `gc_collect_cycles()`.
- Với request ngắn (FPM) ít khi phải lo. Với **worker dài hạn** (queue worker, Octane, daemon) cần cẩn thận: static property, singleton giữ dữ liệu, event listener tích lũy → **memory leak**.
- Giải pháp: `queue:work --max-jobs=1000 --max-time=3600`, restart định kỳ, dùng `memory_get_usage()` để theo dõi.

## [S] Fibers (PHP 8.1) là gì?

Fiber cho phép tạm dừng và tiếp tục một hàm (coroutine nhẹ) mà không cần biến toàn bộ stack thành generator. Đây là nền tảng để các thư viện async như **ReactPHP, AmPHP, Revolt** viết code bất đồng bộ trông như đồng bộ. Ứng dụng web thông thường hiếm khi dùng trực tiếp.

## [S] Tối ưu hiệu năng một ứng dụng PHP chậm, bạn làm gì?

1. **Đo trước**: APM (New Relic, Datadog, Sentry Performance), Blackfire/Xdebug profiler, Laravel Telescope/Debugbar, slow query log.
2. **Database** (thường là nút cổ chai): N+1, thiếu index, query thừa cột, phân trang offset lớn.
3. **Cache**: Redis cho query/nặng, config/route/view cache, HTTP cache, CDN cho static.
4. **Đẩy việc chậm vào queue**: email, xuất báo cáo, gọi API bên thứ ba.
5. **Runtime**: PHP mới nhất, OPcache, cấu hình FPM hợp lý, Octane nếu cần.
6. **Frontend**: nén ảnh, lazy load, minify, HTTP/2.
7. Đo lại sau mỗi thay đổi.

> 💡 Kể một case thật: "API danh sách đơn hàng 3s → 200ms nhờ eager loading + index composite + cache 5 phút".

## [S] So sánh PHP-FPM truyền thống với Swoole/RoadRunner/FrankenPHP (Octane)?

| | PHP-FPM | Octane (Swoole/RoadRunner/FrankenPHP) |
|---|---|---|
| Vòng đời | Boot framework **mỗi request** | Boot **1 lần**, giữ app trong RAM |
| Tốc độ | Chậm hơn | Nhanh hơn 2–10 lần cho request nhẹ |
| Rủi ro | Ít, rất ổn định | Rò rỉ state giữa request (singleton, static), memory leak |
| Phù hợp | Đa số dự án | API traffic cao, cần latency thấp |

Khi dùng Octane: tránh lưu state request vào singleton/static, inject `Request` qua tham số method thay vì constructor của singleton.
