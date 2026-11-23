---
key: oop
title: OOP, SOLID & Design Pattern
icon: 🧩
group: Backend
order: 2
desc: 4 tính chất OOP, abstract vs interface, trait, SOLID, các design pattern trong Laravel, clean code.
---

## [J] 4 tính chất của OOP là gì? Cho ví dụ.

1. **Đóng gói (Encapsulation)**: ẩn dữ liệu bên trong, chỉ cho truy cập qua method (`private` + getter/setter). Ví dụ `BankAccount` không cho sửa `$balance` trực tiếp, chỉ qua `deposit()`/`withdraw()` có kiểm tra.
2. **Kế thừa (Inheritance)**: class con dùng lại code class cha (`class Admin extends User`).
3. **Đa hình (Polymorphism)**: cùng một interface, nhiều cách thực hiện. `PaymentGateway::charge()` có `MomoGateway`, `VnpayGateway`… code gọi không cần biết cụ thể.
4. **Trừu tượng (Abstraction)**: chỉ lộ ra *cái gì* (interface/abstract), giấu *như thế nào*.

> 💡 Luôn lấy ví dụ từ thực tế (thanh toán, gửi thông báo) thay vì "Animal/Dog/Cat".

## [J] Access modifier `public`, `protected`, `private` khác nhau thế nào?

- `public`: truy cập ở mọi nơi.
- `protected`: trong class và **class con**.
- `private`: chỉ trong **chính class đó**.
- PHP 8.4 có asymmetric visibility: `public private(set) string $name` — đọc public, ghi private.

## [J] Abstract class và Interface khác nhau thế nào? Khi nào dùng cái nào?

| | Abstract class | Interface |
|---|---|---|
| Method có thân | Có | Không (chỉ khai báo) |
| Thuộc tính | Có | Chỉ hằng số (8.4: có property khai báo hook) |
| Kế thừa | Chỉ **1** class | Implement **nhiều** interface |
| Constructor | Có | Không |
| Ý nghĩa | "**là một**" (is-a), chia sẻ code chung | "**có khả năng**" (can-do), hợp đồng |

- Dùng **interface** để định nghĩa hợp đồng, giúp đổi implementation và mock khi test (`PaymentGatewayInterface`).
- Dùng **abstract** khi nhiều class có chung logic (template method), ví dụ `BaseReportExporter`.

## [J] Trait là gì? Khác gì kế thừa?

Trait là cơ chế **tái sử dụng code ngang** (horizontal reuse), vì PHP chỉ đơn kế thừa.

```php
trait HasSlug {
    public function generateSlug(string $text): string { return Str::slug($text); }
}
class Post extends Model { use HasSlug, SoftDeletes; }
```

- Trùng tên method giữa 2 trait → giải quyết bằng `insteadof` / `as`.
- Laravel dùng nhiều: `SoftDeletes`, `HasFactory`, `Notifiable`, `HasApiTokens`.
- Nhược điểm: lạm dụng làm code khó lần, phụ thuộc ngầm vào thuộc tính class.

## [J] Overloading và Overriding?

- **Overriding**: class con định nghĩa lại method của cha (cùng tên, chữ ký tương thích). Dùng `parent::method()` để gọi bản gốc; PHP 8.3 có `#[\Override]` để kiểm tra.
- **Overloading** (kiểu Java – nhiều method cùng tên khác tham số): PHP **không hỗ trợ**. Thay vào đó dùng tham số mặc định, union type, variadic `...$args`, hoặc magic `__call`.

## [J] `final` keyword dùng để làm gì?

- `final class`: không cho kế thừa.
- `final public function`: không cho override.
- `final const` (8.1).
- Dùng để khoá thiết kế, khuyến khích composition thay vì inheritance. Nhiều code base hiện đại để mặc định class là `final`.

## [M] SOLID là gì? Giải thích từng nguyên tắc với ví dụ.

- **S – Single Responsibility**: mỗi class một lý do để thay đổi. Controller không nên vừa validate, tính tiền, gửi mail → tách `FormRequest`, `OrderService`, `Notification`.
- **O – Open/Closed**: mở để mở rộng, đóng để sửa. Thêm cổng thanh toán mới = thêm class implement `PaymentGateway`, không sửa `if/else` cũ.
- **L – Liskov Substitution**: class con thay được class cha mà không làm sai hành vi. (Ví dụ kinh điển: `Square extends Rectangle` vi phạm vì set width làm đổi height.)
- **I – Interface Segregation**: nhiều interface nhỏ tốt hơn một interface lớn bắt implement method không dùng.
- **D – Dependency Inversion**: phụ thuộc vào abstraction, không vào class cụ thể. Laravel: bind `PaymentGateway::class` → `VnpayGateway::class` trong ServiceProvider, inject qua constructor.

```php
interface PaymentGateway { public function charge(Order $order): PaymentResult; }

class CheckoutService {
    public function __construct(private PaymentGateway $gateway) {}
    public function checkout(Order $order) { return $this->gateway->charge($order); }
}
// AppServiceProvider
$this->app->bind(PaymentGateway::class, VnpayGateway::class);
```

## [M] Composition over inheritance nghĩa là gì?

Ưu tiên **ghép các object** (has-a) thay vì kế thừa sâu (is-a). Kế thừa nhiều tầng gây phụ thuộc chặt, sửa cha ảnh hưởng mọi con ("fragile base class").
Ví dụ: thay vì `ExcelReport extends Report extends BaseExport`, cho `ReportService` nhận `ExporterInterface` (Excel/CSV/PDF) qua constructor.

## [M] Dependency Injection là gì? Lợi ích?

DI là truyền các phụ thuộc **từ bên ngoài vào** (qua constructor/method) thay vì class tự `new`.

- Lợi ích: giảm coupling, **dễ test** (truyền mock), dễ đổi implementation.
- Laravel **Service Container** tự động resolve (auto-wiring) dựa vào type-hint.
- Phân biệt: DI là *kỹ thuật*, IoC là *nguyên lý*, Container là *công cụ*.

## [M] Kể các Design Pattern bạn biết và Laravel áp dụng ở đâu?

| Pattern | Ý tưởng | Trong Laravel |
|---|---|---|
| Singleton | 1 instance duy nhất | `$this->app->singleton()` |
| Factory | Tạo object qua 1 nơi | Model Factory, `Validator::make`, `Cache::store()` |
| Facade | Giao diện đơn giản cho hệ thống phức tạp | `Cache::`, `DB::`, `Route::` |
| Strategy | Đổi thuật toán lúc runtime | Driver cache/queue/mail/filesystem |
| Observer | Đăng ký lắng nghe sự kiện | Events/Listeners, Model Observer |
| Repository | Tách truy cập dữ liệu | Tự áp dụng trong dự án |
| Builder | Xây object nhiều bước | Query Builder, `Mail` message |
| Chain of Responsibility / Pipeline | Truyền qua chuỗi xử lý | **Middleware**, `Pipeline` |
| Adapter | Chuyển interface | Filesystem (local/S3) qua Flysystem |
| Decorator | Bọc thêm hành vi | Cache decorator cho repository |
| Proxy | Đại diện cho object thật | Facade, lazy loading relationship |

> 💡 Chọn 2–3 pattern bạn **đã tự viết** trong dự án và kể chi tiết (ví dụ Strategy cho nhiều cổng thanh toán).

## [M] Repository Pattern là gì? Có cần thiết với Eloquent không?

- Repository tách lớp truy cập dữ liệu khỏi business logic: `UserRepositoryInterface` ↔ `EloquentUserRepository`.
- **Ưu**: dễ mock khi test, gom query phức tạp một chỗ, đổi nguồn dữ liệu.
- **Nhược**: với Eloquent (đã là Active Record) thường thành lớp bọc mỏng, nhân đôi code; ít khi thực sự đổi DB.
- Quan điểm cân bằng: dự án nhỏ/vừa dùng **Service + Eloquent scope/Query class** là đủ; dự án lớn, nhiều nguồn dữ liệu, team đông thì repository có ích.

> 💡 Interviewer thích ứng viên có **quan điểm và lý do**, không phải "pattern nào cũng tốt".

## [M] Service layer là gì? Controller nên mỏng thế nào?

- Controller chỉ: nhận request → gọi service/action → trả response.
- Validate ở **FormRequest**, phân quyền ở **Policy**, logic nghiệp vụ ở **Service/Action**, truy vấn ở **Model scope/Repository**, format output ở **API Resource**.

```php
public function store(StoreOrderRequest $request, PlaceOrder $placeOrder) {
    $order = $placeOrder->handle($request->user(), $request->validated());
    return new OrderResource($order);
}
```

## [M] Active Record và Data Mapper khác nhau thế nào?

- **Active Record** (Eloquent): object model vừa chứa dữ liệu vừa biết tự lưu (`$user->save()`). Nhanh, dễ dùng, nhưng domain dính chặt DB.
- **Data Mapper** (Doctrine): entity là object thuần, việc lưu do `EntityManager` đảm nhiệm. Tách bạch hơn, phù hợp domain phức tạp, nhưng dài dòng hơn.

## [M] Value Object và DTO là gì?

- **DTO (Data Transfer Object)**: object chỉ chứa dữ liệu để truyền giữa các tầng, thay cho mảng `$data` không rõ cấu trúc. PHP 8 với `readonly` + constructor promotion rất gọn. Thư viện: `spatie/laravel-data`.
- **Value Object**: đại diện một giá trị có ý nghĩa nghiệp vụ, **bất biến**, so sánh theo giá trị (Money, Email, Address). Ví dụ `Money` không cho cộng khác loại tiền tệ.

```php
final readonly class Money {
    public function __construct(public int $amount, public string $currency = 'VND') {
        if ($amount < 0) throw new InvalidArgumentException('Số tiền âm');
    }
    public function add(Money $o): self { return new self($this->amount + $o->amount, $this->currency); }
}
```

## [M] Nguyên tắc DRY, KISS, YAGNI?

- **DRY** (Don't Repeat Yourself): không lặp lại *kiến thức/logic*. Nhưng đừng gộp hai đoạn code chỉ giống nhau ngẫu nhiên (trùng lặp sai còn tệ hơn lặp lại).
- **KISS** (Keep It Simple, Stupid): chọn giải pháp đơn giản nhất chạy được.
- **YAGNI** (You Aren't Gonna Need It): không làm trước tính năng/abstraction "để sau này có thể cần".

## [S] Domain-Driven Design (DDD) bạn hiểu thế nào? Áp dụng trong Laravel ra sao?

- DDD tập trung mô hình hoá **nghiệp vụ** dùng ngôn ngữ chung (ubiquitous language) giữa dev và business.
- Khái niệm: **Bounded Context**, Entity, Value Object, Aggregate (+ Aggregate Root), Domain Event, Repository, Domain Service.
- Trong Laravel: tổ chức theo module/domain (`app/Domain/Ordering`, `app/Domain/Billing`) thay vì theo loại file; dùng Action class, DTO, Domain Event.
- Không nên áp dụng DDD đầy đủ cho CRUD đơn giản — chi phí cao.

## [S] Hexagonal / Clean Architecture là gì?

- Lõi **domain + use case** không phụ thuộc framework, DB, UI.
- Bên ngoài giao tiếp qua **port** (interface) và **adapter** (implementation: Eloquent, HTTP controller, CLI, queue).
- Quy tắc phụ thuộc: chỉ hướng **vào trong**.
- Lợi ích: test logic không cần DB, dễ thay hạ tầng. Chi phí: nhiều lớp, nhiều mapping.

## [S] CQRS và Event Sourcing là gì?

- **CQRS**: tách mô hình **ghi** (command) và **đọc** (query). Có thể dùng DB/bảng đọc riêng được tối ưu (denormalized, Elasticsearch).
- **Event Sourcing**: không lưu trạng thái hiện tại mà lưu **chuỗi sự kiện** (OrderPlaced, OrderPaid…), trạng thái được dựng lại từ sự kiện. Có audit đầy đủ, nhưng phức tạp (versioning event, projection).
- Laravel có `spatie/laravel-event-sourcing`. Chỉ dùng khi nghiệp vụ thật sự cần (tài chính, kế toán, audit).
