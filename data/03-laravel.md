---
key: laravel
title: Laravel
icon: 🔺
group: Backend
order: 3
desc: Request lifecycle, Service Container, Provider, Facade, Eloquent, N+1, Queue, Middleware, Auth, Cache, Testing, Octane.
---

## [J] Tại sao chọn Laravel? Ưu nhược điểm?

**Ưu**: cú pháp rõ ràng, hệ sinh thái lớn (Sanctum, Horizon, Telescope, Livewire, Inertia, Filament, Forge, Vapor, Cloud), Eloquent ORM mạnh, có sẵn queue/cache/mail/event/scheduler, testing tốt, cộng đồng Việt Nam đông, tài liệu tốt.
**Nhược**: nặng hơn micro-framework, nhiều "magic" (facade, `__call`) khó lần với người mới, hiệu năng thô kém Go/Node (khắc phục bằng cache, queue, Octane), Eloquent dễ sinh N+1 nếu không cẩn thận.

Phiên bản: Laravel phát hành major hằng năm (11 – 3/2024, 12 – 2/2025, 13 – 3/2026, yêu cầu PHP ≥ 8.3). Bug fix 18 tháng, security fix 2 năm.

## [J] Cấu trúc thư mục Laravel?

- `app/` – code chính: `Http/Controllers`, `Models`, `Providers`, `Jobs`, `Events`, `Listeners`, `Policies`…
- `bootstrap/` – `app.php` (cấu hình routing, middleware, exception từ Laravel 11), `cache/`.
- `config/` – cấu hình.
- `database/` – `migrations`, `factories`, `seeders`.
- `public/` – document root, `index.php` là entry point.
- `resources/` – views (Blade), css, js.
- `routes/` – `web.php`, `api.php` (cài bằng `php artisan install:api`), `console.php`.
- `storage/` – log, cache, file upload (`storage:link` để public).
- `tests/` – Feature, Unit.

## [J] Request lifecycle trong Laravel diễn ra như thế nào?

1. Mọi request vào `public/index.php`.
2. Nạp Composer autoload, tạo **Application** (service container) từ `bootstrap/app.php`.
3. HTTP **Kernel** chạy các bootstrapper: load `.env`, config, đăng ký exception handler, facade, **đăng ký và boot các Service Provider**.
4. Request đi qua **global middleware** (trim string, maintenance mode, CORS…).
5. **Router** tìm route phù hợp → chạy **route middleware** (auth, throttle…) → gọi **controller** (container tự inject dependency, Form Request validate, route model binding).
6. Controller trả về response → đi ngược qua middleware → gửi về client.
7. Chạy `terminate()` của middleware terminable.

> 💡 Nói được "Service Provider là nơi bootstrap mọi thứ" và phân biệt `register()` vs `boot()` sẽ ăn điểm.

## [J] Route trong Laravel: các loại, route model binding, named route?

```php
Route::get('/posts/{post:slug}', [PostController::class, 'show'])->name('posts.show');
Route::resource('photos', PhotoController::class);       // 7 route CRUD
Route::apiResource('orders', OrderController::class);   // 5 route, không có create/edit
Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () { ... });
```

- **Route model binding**: type-hint `Post $post` → tự query theo id (hoặc `slug`), không thấy trả 404.
- **Named route**: `route('posts.show', $post)` — đổi URL không phải sửa nhiều chỗ.
- `php artisan route:list`, `route:cache` khi deploy.

## [J] Migration, Seeder, Factory là gì?

- **Migration**: version control cho schema DB (`up`/`down`). `migrate`, `migrate:rollback`, `migrate:fresh --seed`.
- **Seeder**: đổ dữ liệu mẫu/khởi tạo (role, tỉnh thành…).
- **Factory**: sinh dữ liệu giả cho test/seed (`User::factory()->count(10)->create()`).

> ⚠️ Không bao giờ sửa migration đã chạy trên production — tạo migration mới để thay đổi. Cẩn thận migration trên bảng lớn (thêm cột/index có thể khoá bảng).

## [J] Blade template có những tính năng gì?

- `{{ $var }}` escape HTML (chống XSS); `{!! $html !!}` không escape — chỉ dùng với nội dung tin cậy.
- `@if`, `@foreach`, `@forelse`, `@auth`, `@can`, `@csrf`, `@method('PUT')`, `@error`.
- Layout: `@extends`, `@section`, `@yield` hoặc **component** `<x-alert type="error" />`, slot.
- `@include`, `@stack/@push`, `@vite`.
- Blade được biên dịch thành PHP thuần và cache trong `storage/framework/views`.

## [J] Validation trong Laravel làm thế nào?

```php
// FormRequest
class StorePostRequest extends FormRequest {
    public function authorize(): bool { return $this->user()->can('create', Post::class); }
    public function rules(): array {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug'  => ['required', Rule::unique('posts')->ignore($this->post)],
            'tags'  => ['array'], 'tags.*' => ['integer', 'exists:tags,id'],
        ];
    }
}
```

- Cách khác: `$request->validate([...])`, `Validator::make()`.
- Custom rule: `php artisan make:rule`, hoặc closure.
- Lỗi validate: web → redirect back kèm `$errors`; API (`Accept: application/json`) → **422** JSON.
- Dùng `$request->validated()` thay vì `$request->all()` để tránh mass assignment.

## [J] Mass assignment là gì? `$fillable` và `$guarded`?

Mass assignment là gán nhiều thuộc tính một lần (`User::create($request->all())`). Nguy hiểm: kẻ xấu gửi thêm `is_admin=1`.

- `$fillable = ['name', 'email']` – whitelist (khuyên dùng).
- `$guarded = ['id', 'is_admin']` – blacklist. `$guarded = []` = cho phép tất cả (rủi ro).
- Kết hợp `$request->validated()` để chỉ lấy field đã validate.

## [J] Các quan hệ (relationship) trong Eloquent?

- `hasOne` / `belongsTo` (1-1, ví dụ User – Profile)
- `hasMany` / `belongsTo` (1-n, Post – Comment)
- `belongsToMany` (n-n qua bảng trung gian `role_user`, `withPivot`, `withTimestamps`)
- `hasOneThrough`, `hasManyThrough` (Country → User → Post)
- **Polymorphic**: `morphOne`, `morphMany`, `morphToMany` (Comment cho cả Post và Video: `commentable_id`, `commentable_type`)

```php
public function posts(): HasMany { return $this->hasMany(Post::class); }
$user->posts()->where('published', true)->get(); // gọi method => query builder
$user->posts; // gọi property => Collection (lazy load, có cache trên model)
```

## [J] Soft delete là gì?

Không xoá thật mà set cột `deleted_at`. Dùng trait `SoftDeletes` + cột `$table->softDeletes()`.
- Query mặc định tự loại bản ghi đã xoá. `withTrashed()`, `onlyTrashed()`, `restore()`, `forceDelete()`.
- Lưu ý: **unique index** (ví dụ email) vẫn tính cả bản ghi đã soft delete → cần xử lý (unique theo `email + deleted_at` hoặc validate `whereNull('deleted_at')`).

## [J] Artisan là gì? Kể các lệnh hay dùng.

CLI của Laravel: `make:model -mfc`, `make:controller --resource`, `migrate`, `db:seed`, `tinker`, `route:list`, `queue:work`, `schedule:run`, `optimize` / `optimize:clear`, `config:cache`, `storage:link`, `test`, `make:command` (tự tạo lệnh riêng).

## [M] Service Container là gì? `bind`, `singleton`, `scoped`, `instance` khác nhau thế nào?

Service Container là công cụ quản lý **dependency injection**: biết cách tạo object và tự inject phụ thuộc (auto-wiring qua reflection type-hint).

- `bind`: mỗi lần resolve tạo **instance mới**.
- `singleton`: tạo **một lần**, dùng lại suốt vòng đời app.
- `scoped`: một instance cho **mỗi request/job** (an toàn với Octane, queue).
- `instance`: đăng ký object có sẵn.
- **Contextual binding**: `$this->app->when(PhotoController::class)->needs(Filesystem::class)->give(fn () => Storage::disk('s3'));`

```php
$this->app->singleton(SmsClient::class, fn ($app) => new SmsClient(config('services.sms.key')));
```

## [M] Service Provider là gì? `register()` khác `boot()` thế nào?

Service Provider là nơi **khởi tạo (bootstrap)** ứng dụng: đăng ký binding, event, route, macro…

- `register()`: **chỉ** bind vào container. Không dùng service khác vì có thể chưa được đăng ký.
- `boot()`: chạy **sau khi tất cả provider đã register** → dùng được mọi service (đăng ký observer, gate, macro, view composer…).
- **Deferred provider** (implements `DeferrableProvider`): chỉ nạp khi thực sự cần → tăng tốc.
- Từ Laravel 11 đăng ký provider ở `bootstrap/providers.php`.

## [M] Facade hoạt động thế nào? Khác gì static method?

Facade là "proxy tĩnh" tới object trong container.

- `Cache::get('x')` → class `Cache` extends `Facade`, `getFacadeAccessor()` trả `'cache'` → `__callStatic` lấy instance `app('cache')` và gọi `->get('x')`.
- Khác static thật: vẫn là object thật trong container → **mock được** (`Cache::shouldReceive('get')->andReturn(...)`), đổi implementation được.
- Nhược: ẩn dependency (không thấy trong constructor). Có thể dùng DI hoặc **Real-time facade** (`use Facades\App\Services\Foo;`).

## [M] Middleware là gì? Viết một middleware ví dụ.

Middleware là lớp lọc request/response theo mô hình **pipeline** (onion).

```php
class EnsureUserIsActive {
    public function handle(Request $request, Closure $next): Response {
        if ($request->user()?->is_banned) {
            abort(403, 'Tài khoản đã bị khoá');
        }
        $response = $next($request);           // trước dòng này: before middleware
        $response->headers->set('X-App', 'v1'); // sau: after middleware
        return $response;
    }
}
```

- Đăng ký trong `bootstrap/app.php` (Laravel 11+): `->withMiddleware(fn (Middleware $m) => $m->alias(['active' => EnsureUserIsActive::class]))`.
- Loại: global, group (`web`, `api`), route middleware, có tham số (`role:admin`), terminable (`terminate()` chạy sau khi gửi response).

## [M] Vấn đề N+1 query là gì? Cách phát hiện và khắc phục?

Lấy N bản ghi (1 query) rồi trong vòng lặp truy cập quan hệ → thêm N query.

```php
$posts = Post::all();                 // 1 query
foreach ($posts as $p) echo $p->user->name; // +N query

$posts = Post::with('user:id,name')->get();  // 2 query  (eager loading)
$posts = Post::with(['comments' => fn ($q) => $q->latest()->limit(5)])->get();
$posts->load('tags');                 // lazy eager loading khi đã có collection
Post::withCount('comments')->get();   // đếm không cần load
```

- Phát hiện: Laravel Debugbar, Telescope, hoặc bật `Model::preventLazyLoading(! app()->isProduction());` trong `AppServiceProvider` → ném exception khi lazy load.
- Laravel 12+ có `Model::automaticallyEagerLoadRelationships()` nhưng vẫn nên chủ động eager load.

## [M] Khác nhau giữa Eloquent và Query Builder? Khi nào dùng cái nào?

- **Eloquent**: ORM Active Record, có model, relationship, event, cast, accessor. Dễ đọc, tốn bộ nhớ hơn (mỗi dòng là một object).
- **Query Builder** (`DB::table()`): trả về `stdClass`, nhanh và nhẹ hơn, không có event/relationship.
- **Raw SQL** (`DB::select`, `selectRaw`): cho query phức tạp/report. Luôn dùng binding `?` để tránh SQL injection.
- Thực tế: CRUD thường dùng Eloquent; báo cáo, xử lý hàng triệu dòng, bulk update dùng Query Builder/raw.

## [M] Xử lý dữ liệu lớn trong Eloquent: `chunk`, `chunkById`, `cursor`, `lazy`?

| Method | Cách hoạt động | Lưu ý |
|---|---|---|
| `chunk(1000)` | Query nhiều lần với LIMIT/OFFSET | Bị **bỏ sót** bản ghi nếu vừa duyệt vừa update cột dùng để lọc |
| `chunkById(1000)` | Dùng `where id > last_id` | An toàn khi update, nhanh hơn offset |
| `cursor()` | 1 query, PDO trả từng dòng (generator) | Ít RAM, không eager load được |
| `lazy()` / `lazyById()` | Như chunk nhưng trả LazyCollection | Kết hợp tiện lợi |

Cập nhật hàng loạt không cần model event: `Post::where(...)->update([...])` (1 query).

## [M] Accessor, Mutator, Casts trong Eloquent?

```php
protected function casts(): array {
    return [
        'is_admin' => 'boolean',
        'options'  => 'array',
        'status'   => OrderStatus::class,  // enum
        'paid_at'  => 'datetime',
        'secret'   => 'encrypted',
    ];
}

protected function fullName(): Attribute {
    return Attribute::make(
        get: fn () => "{$this->first_name} {$this->last_name}",
        set: fn (string $v) => ['first_name' => Str::before($v, ' ')],
    );
}
```

Có thể tạo custom cast class (`CastsAttributes`) cho Money, Address…

## [M] Local scope và Global scope?

- **Local scope**: query tái sử dụng — `scopeActive($q)` gọi `User::active()`. Laravel 12 có attribute `#[Scope]`.
- **Global scope**: tự áp dụng cho mọi query của model (multi-tenant: `where tenant_id = ?`, SoftDeletes chính là global scope). Bỏ qua bằng `withoutGlobalScope()`.

## [M] Queue trong Laravel hoạt động thế nào? Khi nào dùng?

Dùng cho tác vụ **chậm hoặc không cần trả kết quả ngay**: gửi email/SMS, xử lý ảnh/video, xuất báo cáo, gọi API bên thứ 3, webhook.

- Driver: `database`, **redis**, SQS, beanstalkd (`sync` để dev).
- Tạo job: `php artisan make:job SendInvoice` → `SendInvoice::dispatch($order)->onQueue('emails')->delay(now()->addMinutes(5));`
- Worker: `php artisan queue:work --queue=high,default --tries=3 --backoff=10`. Production chạy bằng **Supervisor** hoặc **Horizon** (Redis).
- Job lỗi → bảng `failed_jobs`, `queue:retry`, method `failed()`.
- Nâng cao: `Bus::chain` (tuần tự), `Bus::batch` (song song + theo dõi tiến độ), rate limit, `ShouldBeUnique`, `WithoutOverlapping`.
- **Deploy xong phải `queue:restart`** vì worker giữ code cũ trong bộ nhớ.

> ⚠️ Job phải **idempotent** (chạy lại không gây sai), vì có thể bị retry. Dùng `afterCommit` để job không chạy trước khi transaction DB commit.

## [M] Event & Listener, Observer là gì?

- **Event/Listener**: tách rời hành động và phản ứng. `OrderPlaced` → listener `SendOrderEmail`, `UpdateInventory`, `NotifyAdmin`. Listener implement `ShouldQueue` để chạy nền.
- **Observer**: gom các model event (`creating`, `created`, `updating`, `saved`, `deleted`…) của một model vào một class.
- Lưu ý: query builder `update()`/`delete()` hàng loạt **không** kích hoạt model event.
- Nhược điểm: lạm dụng làm luồng xử lý khó theo dõi ("magic").

## [M] Authentication trong Laravel: Session, Sanctum, Passport khác nhau thế nào?

- **Session guard** (`web`): đăng nhập cookie cho web truyền thống. Starter kit: Breeze, Jetstream, hoặc các starter kit React/Vue/Livewire mới.
- **Sanctum**: nhẹ. Hai chế độ: (1) **API token** cá nhân (mobile app, lưu hash trong `personal_access_tokens`); (2) **SPA cookie** cho SPA cùng domain (cần CSRF cookie).
- **Passport**: OAuth2 server đầy đủ (authorization code, client credentials…) khi cần cho bên thứ 3 đăng nhập/ủy quyền.
- JWT (`tymon/jwt-auth`): token tự chứa, stateless; khó thu hồi.
- **Socialite**: đăng nhập Google/Facebook.

## [M] Authorization: Gate và Policy?

- **Gate**: closure cho quyền đơn lẻ, không gắn model: `Gate::define('view-dashboard', fn (User $u) => $u->is_admin);`
- **Policy**: nhóm quyền theo model: `PostPolicy@update(User $user, Post $post)` → `return $user->id === $post->user_id;`
- Sử dụng: `$this->authorize('update', $post)`, `Gate::authorize()`, `$user->can()`, `@can` trong Blade, middleware `can:update,post`.
- `Gate::before` cho super admin. Phân quyền theo role phức tạp: `spatie/laravel-permission`.

## [M] Cache trong Laravel dùng thế nào? Cache invalidation?

```php
$products = Cache::remember("category:{$id}:products", now()->addMinutes(10), fn () =>
    Product::where('category_id', $id)->with('images')->get()
);
Cache::forget("category:{$id}:products"); // khi sản phẩm thay đổi (observer/event)
Cache::lock('import')->get(fn () => ...); // atomic lock
Cache::flexible('stats', [60, 300], fn () => ...); // stale-while-revalidate (Laravel 11+)
```

- Driver: redis, memcached, database, file, array.
- Cache **tag** (redis/memcached) để xoá theo nhóm.
- Cache stampede: nhiều request cùng miss → dùng lock hoặc `flexible`.
- Ngoài ra: `config:cache`, `route:cache`, `view:cache`, `event:cache` (`php artisan optimize`) khi deploy.

## [M] Task Scheduling trong Laravel?

Chỉ cần 1 cron trên server:

```
* * * * * cd /var/www/app && php artisan schedule:run >> /dev/null 2>&1
```

Khai báo trong `routes/console.php`:

```php
Schedule::command('report:daily')->dailyAt('01:00')->withoutOverlapping()->onOneServer();
Schedule::job(new CleanupTempFiles)->hourly();
```

`onOneServer()` (cần cache driver dùng chung) để chỉ một server chạy khi có nhiều server.

## [M] API Resource là gì? Thiết kế API response chuẩn trong Laravel?

API Resource biến model thành JSON, kiểm soát field trả ra (không lộ `password`, field nội bộ).

```php
class OrderResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'total' => $this->total,
            'status' => $this->status->value,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
return OrderResource::collection(Order::with('items')->paginate(20));
```

Kết hợp: status code đúng (201, 204, 404, 422), phân trang, versioning `/api/v1`, rate limit `throttle:api`.

## [M] Transaction trong Laravel dùng thế nào?

```php
DB::transaction(function () use ($order, $items) {
    $order->save();
    foreach ($items as $item) {
        $product = Product::lockForUpdate()->find($item['id']); // SELECT ... FOR UPDATE
        if ($product->stock < $item['qty']) throw new OutOfStockException();
        $product->decrement('stock', $item['qty']);
    }
}, attempts: 3); // tự retry khi deadlock
```

- Exception trong closure → tự rollback.
- Thủ công: `DB::beginTransaction()`, `commit()`, `rollBack()`.
- Dispatch job/gửi mail trong transaction: dùng `->afterCommit()` hoặc `DB::afterCommit()`.

## [M] CSRF protection trong Laravel hoạt động thế nào?

- Mỗi session có 1 token. Form phải có `@csrf` (input `_token`) hoặc header `X-CSRF-TOKEN` / `X-XSRF-TOKEN`.
- Middleware `VerifyCsrfToken` (Laravel 11: `ValidateCsrfToken`) kiểm tra với request POST/PUT/PATCH/DELETE của group `web`.
- Route API dùng token (stateless) không cần CSRF.
- Loại trừ webhook: `$middleware->validateCsrfTokens(except: ['webhook/*'])`.

## [M] Viết test trong Laravel như thế nào? Unit test vs Feature test?

- **Unit**: test 1 class/hàm độc lập, không boot framework/DB.
- **Feature**: test luồng HTTP đầy đủ (route → controller → DB).
- Công cụ: PHPUnit hoặc **Pest**; `RefreshDatabase`, factory, `actingAs`, `Http::fake()`, `Queue::fake()`, `Mail::fake()`, `Event::fake()`, `Storage::fake()`.

```php
it('creates an order', function () {
    $user = User::factory()->create();
    Queue::fake();
    $this->actingAs($user)
        ->postJson('/api/orders', ['product_id' => 1, 'qty' => 2])
        ->assertCreated()
        ->assertJsonPath('data.qty', 2);
    $this->assertDatabaseHas('orders', ['user_id' => $user->id]);
    Queue::assertPushed(SendOrderEmail::class);
});
```

## [M] Upload và lưu file trong Laravel (Storage)?

- Filesystem abstraction (Flysystem): disk `local`, `public`, `s3`… cấu hình `config/filesystems.php`.
- `$path = $request->file('avatar')->store('avatars', 'public');` → `Storage::url($path)`.
- File riêng tư: lưu disk private, trả qua controller có kiểm tra quyền, hoặc `Storage::temporaryUrl()` (S3 signed URL).
- File lớn: upload trực tiếp từ browser lên S3 bằng **presigned URL** để không qua server.

## [M] Notification và Mail trong Laravel?

- **Mailable**: một email cụ thể (`OrderShipped`), `Mail::to($u)->queue(new OrderShipped($order))`.
- **Notification**: một thông báo gửi qua nhiều kênh (`mail`, `database`, `broadcast`, `slack`, SMS qua package) với `via()`.
- Luôn **queue** email; dùng Mailpit/Mailtrap khi dev.

## [M] Broadcasting / Realtime trong Laravel?

- Gửi event từ server tới client qua WebSocket: **Laravel Reverb** (server WebSocket chính chủ), Pusher, Ably.
- Event implement `ShouldBroadcast`, kênh `public`, `private` (cần auth), `presence` (biết ai đang online).
- Client dùng **Laravel Echo**.
- Ứng dụng: chat, thông báo realtime, trạng thái đơn hàng, dashboard.

## [M] `.env` và config: tại sao không gọi `env()` ngoài file config?

- Khi chạy `php artisan config:cache`, file `.env` **không được đọc nữa** → `env()` trong code trả về `null`.
- Quy tắc: chỉ gọi `env()` trong `config/*.php`, code dùng `config('services.vnpay.key')`.
- Không commit `.env`; commit `.env.example`. Secret trên production đặt bằng biến môi trường/secret manager.

## [M] Rate limiting trong Laravel?

```php
RateLimiter::for('api', fn (Request $r) =>
    Limit::perMinute(60)->by($r->user()?->id ?: $r->ip())
);
RateLimiter::for('login', fn (Request $r) => Limit::perMinute(5)->by($r->input('email').$r->ip()));
Route::middleware('throttle:login')->post('/login', ...);
```

Trả về `429 Too Many Requests` kèm header `Retry-After`. Nên dùng Redis làm cache store khi nhiều server.

## [M] Collection trong Laravel: các method hay dùng? `map` vs `each`?

`map`, `filter`, `reject`, `reduce`, `pluck`, `keyBy`, `groupBy`, `sortBy`, `sum`, `avg`, `unique`, `chunk`, `flatMap`, `first`, `contains`, `partition`, `when`, `pipe`.

- `map` trả về **collection mới**; `each` chỉ duyệt (side effect), không trả kết quả mới.
- Lưu ý hiệu năng: lọc bằng **SQL** (`where`) thay vì `->get()->filter()` trên hàng chục nghìn dòng.
- `LazyCollection` cho dữ liệu lớn.

## [S] Laravel Octane là gì? Những lưu ý khi dùng?

Octane chạy Laravel trên Swoole / RoadRunner / FrankenPHP: boot app **một lần** và giữ trong bộ nhớ, phục vụ nhiều request → nhanh hơn nhiều.

Lưu ý:
- Không inject `Request`, `config` repository… vào constructor của **singleton** (bị giữ request cũ).
- Static property / mảng tích luỹ → memory leak và rò rỉ dữ liệu giữa user.
- Dùng `scoped()` thay `singleton()` cho service theo request.
- Reload worker khi deploy (`octane:reload`), giới hạn `--max-requests`.
- Tính năng thêm: concurrent tasks, Octane cache, tick.

## [S] Horizon, Telescope, Pulse dùng để làm gì?

- **Horizon**: dashboard + cấu hình queue worker Redis bằng code (số process, balance tự động, theo dõi throughput, job lỗi).
- **Telescope**: debug chi tiết từng request, query, job, exception, mail… (chủ yếu dùng khi dev/staging).
- **Pulse**: giám sát production nhẹ: request chậm, query chậm, job, cache hit, user dùng nhiều tài nguyên.
- Kết hợp **Sentry/Flare/Nightwatch** để theo dõi lỗi và hiệu năng production.

## [S] Thiết kế một ứng dụng Laravel lớn (modular) như thế nào?

- Tổ chức theo **domain/module** thay vì theo loại file: `app/Modules/Order/{Http, Models, Actions, Events, Policies}` hoặc package nội bộ (`nwidart/laravel-modules`).
- Giao tiếp giữa module qua **interface / event**, không truy cập trực tiếp model của module khác.
- Action class cho từng use case, DTO cho dữ liệu vào/ra, API Resource cho đầu ra.
- Quy ước code: Pint, Larastan (PHPStan) level cao, Rector, CI chạy test.
- Khi nào tách microservice: team lớn độc lập, phần hệ thống cần scale riêng; trước đó ưu tiên **modular monolith**.

## [S] Multi-tenancy trong Laravel triển khai thế nào?

3 cách phổ biến:
1. **Một DB, cột `tenant_id`** + global scope: đơn giản, rẻ; rủi ro lộ dữ liệu nếu quên scope.
2. **Một DB, nhiều schema / prefix**.
3. **Mỗi tenant một database**: cách ly tốt, backup/restore riêng; migrate phức tạp hơn.

Xác định tenant qua subdomain/domain/header. Package: `stancl/tenancy`, `spatie/laravel-multitenancy`. Nhớ scope cả **cache key, queue job, file storage** theo tenant.

## [S] Laravel xử lý race condition (ví dụ 2 người mua sản phẩm cuối cùng) thế nào?

- **Pessimistic lock**: `lockForUpdate()` trong transaction.
- **Atomic update**: `UPDATE products SET stock = stock - 1 WHERE id = ? AND stock >= 1` rồi kiểm tra số dòng bị ảnh hưởng.
- **Optimistic lock**: cột `version`, update `WHERE version = ?`; nếu 0 dòng → retry/báo lỗi.
- **Cache lock** (Redis): `Cache::lock("product:{$id}", 10)->block(5, fn () => ...)`.
- Unique constraint ở DB là chốt chặn cuối cùng (ví dụ không cho 1 voucher dùng 2 lần).
- Queue job không chạy trùng: `ShouldBeUnique`, middleware `WithoutOverlapping`.
