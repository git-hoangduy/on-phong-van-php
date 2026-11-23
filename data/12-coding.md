---
key: coding
title: Live coding & SQL
icon: ⌨️
group: Nghiệp vụ & Kỹ năng
order: 12
desc: Bài tập code/SQL hay gặp khi phỏng vấn trực tiếp hoặc bài test. Tự code trước rồi mới xem lời giải!
---

## [J] Đảo ngược chuỗi không dùng `strrev()`. Kiểm tra chuỗi palindrome.

```php
function reverse(string $s): string {
    $out = '';
    for ($i = strlen($s) - 1; $i >= 0; $i--) $out .= $s[$i];
    return $out;
}

function isPalindrome(string $s): bool {
    $s = preg_replace('/[^a-z0-9]/', '', strtolower($s));
    $l = 0; $r = strlen($s) - 1;
    while ($l < $r) {
        if ($s[$l++] !== $s[$r--]) return false;
    }
    return true;
}
isPalindrome('A man, a plan, a canal: Panama'); // true
```

> Tiếng Việt có dấu (đa byte) → dùng `mb_str_split()` rồi `array_reverse` + `implode`. Nhắc tới điều này sẽ ăn điểm.

## [J] FizzBuzz: in 1–100, chia hết 3 in "Fizz", chia hết 5 in "Buzz", chia hết cả hai in "FizzBuzz".

```php
for ($i = 1; $i <= 100; $i++) {
    echo match (true) {
        $i % 15 === 0 => 'FizzBuzz',
        $i % 3 === 0  => 'Fizz',
        $i % 5 === 0  => 'Buzz',
        default       => $i,
    }, PHP_EOL;
}
```

## [J] Tìm phần tử trùng lặp / đếm tần suất trong mảng.

```php
$arr = [3, 1, 3, 2, 1, 3];
$freq = array_count_values($arr);              // [3=>3, 1=>2, 2=>1]
$dups = array_keys(array_filter($freq, fn ($c) => $c > 1)); // [3, 1]

// Không dùng hàm có sẵn — O(n)
$seen = []; $dups = [];
foreach ($arr as $x) {
    if (isset($seen[$x])) $dups[$x] = true;
    $seen[$x] = true;
}
```

Dùng `isset` trên key (O(1)) thay vì `in_array` (O(n)) trong vòng lặp.

## [J] Two Sum: tìm 2 số trong mảng có tổng bằng target.

```php
function twoSum(array $nums, int $target): ?array {
    $map = []; // value => index
    foreach ($nums as $i => $n) {
        $need = $target - $n;
        if (isset($map[$need])) return [$map[$need], $i];
        $map[$n] = $i;
    }
    return null;
}
twoSum([2, 7, 11, 15], 9); // [0, 1]   — O(n) thay vì O(n²)
```

## [J] SQL: Lấy lương cao thứ 2 (thứ N) trong bảng employees.

```sql
-- Cách 1
SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);

-- Cách 2: thứ N (N=2), xử lý trùng lương
SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1;

-- Cách 3: window function (MySQL 8)
SELECT salary FROM (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk FROM employees
) t WHERE rnk = 2 LIMIT 1;
```

## [J] SQL: Tìm email bị trùng trong bảng users và xoá bản trùng (giữ id nhỏ nhất).

```sql
SELECT email, COUNT(*) AS cnt FROM users GROUP BY email HAVING cnt > 1;

DELETE u1 FROM users u1
JOIN users u2 ON u1.email = u2.email AND u1.id > u2.id;
-- sau đó thêm UNIQUE index cho email để không tái diễn
```

## [M] SQL: Top 5 khách hàng có tổng chi tiêu cao nhất năm 2025 (chỉ đơn đã hoàn thành).

```sql
SELECT c.id, c.name, SUM(o.total) AS spent, COUNT(o.id) AS orders
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.status = 'completed'
  AND o.created_at >= '2025-01-01' AND o.created_at < '2026-01-01'  -- không dùng YEAR() để giữ index
GROUP BY c.id, c.name
ORDER BY spent DESC
LIMIT 5;
```

Eloquent:

```php
Customer::withSum(['orders as spent' => fn ($q) => $q->where('status', 'completed')
        ->whereBetween('created_at', ['2025-01-01', '2025-12-31 23:59:59'])], 'total')
    ->orderByDesc('spent')->limit(5)->get();
```

## [M] SQL: Doanh thu theo từng tháng, kể cả tháng không có đơn.

```sql
WITH RECURSIVE months AS (
  SELECT DATE('2025-01-01') AS m
  UNION ALL
  SELECT m + INTERVAL 1 MONTH FROM months WHERE m < '2025-12-01'
)
SELECT DATE_FORMAT(months.m, '%Y-%m') AS month, COALESCE(SUM(o.total), 0) AS revenue
FROM months
LEFT JOIN orders o
  ON o.created_at >= months.m AND o.created_at < months.m + INTERVAL 1 MONTH
  AND o.status = 'completed'
GROUP BY months.m
ORDER BY months.m;
```

Điểm chú ý: `LEFT JOIN` + `COALESCE`, điều kiện trạng thái đặt trong `ON` (nếu đặt ở `WHERE` sẽ biến thành inner join).

## [M] SQL: Sản phẩm chưa từng được bán — viết 3 cách.

```sql
-- LEFT JOIN
SELECT p.* FROM products p LEFT JOIN order_items oi ON oi.product_id = p.id WHERE oi.id IS NULL;
-- NOT EXISTS (thường hiệu quả, an toàn với NULL)
SELECT * FROM products p WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = p.id);
-- NOT IN (cẩn thận: nếu subquery có NULL → không trả dòng nào)
SELECT * FROM products WHERE id NOT IN (SELECT product_id FROM order_items WHERE product_id IS NOT NULL);
```

Eloquent: `Product::doesntHave('orderItems')->get();`

## [M] Kiểm tra chuỗi ngoặc hợp lệ: `"({[]})"` → true, `"([)]"` → false.

```php
function isValid(string $s): bool {
    $pairs = [')' => '(', ']' => '[', '}' => '{'];
    $stack = [];
    foreach (str_split($s) as $ch) {
        if (in_array($ch, $pairs, true)) {
            $stack[] = $ch;
        } elseif (isset($pairs[$ch])) {
            if (array_pop($stack) !== $pairs[$ch]) return false;
        }
    }
    return $stack === [];
}
```

Dùng **stack**, độ phức tạp O(n).

## [M] Chuyển mảng phẳng (id, parent_id) thành cây danh mục lồng nhau.

```php
function buildTree(array $items): array {
    $byId = [];
    foreach ($items as $it) $byId[$it['id']] = $it + ['children' => []];

    $tree = [];
    foreach ($byId as $id => &$node) {
        if ($node['parent_id'] && isset($byId[$node['parent_id']])) {
            $byId[$node['parent_id']]['children'][] = &$node;
        } else {
            $tree[] = &$node;
        }
    }
    unset($node);
    return $tree;
}
```

O(n) nhờ tham chiếu, thay vì đệ quy query DB nhiều lần (N+1). Hiển thị menu đa cấp: render đệ quy trong Blade.

## [M] Viết hàm `flatten` mảng nhiều chiều và hàm `groupBy`.

```php
function flatten(array $arr): array {
    $out = [];
    array_walk_recursive($arr, function ($v) use (&$out) { $out[] = $v; });
    return $out;
}
flatten([1, [2, [3, [4]]], 5]); // [1,2,3,4,5]

function groupBy(array $rows, string $key): array {
    $out = [];
    foreach ($rows as $r) $out[$r[$key]][] = $r;
    return $out;
}
```

Laravel: `collect($arr)->flatten()`, `->groupBy('status')`.

## [M] JavaScript: viết hàm debounce và hàm deep clone.

```js
function debounce(fn, wait = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

function deepClone(obj, seen = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (seen.has(obj)) return seen.get(obj);          // xử lý vòng tham chiếu
  const copy = Array.isArray(obj) ? [] : {};
  seen.set(obj, copy);
  for (const k of Object.keys(obj)) copy[k] = deepClone(obj[k], seen);
  return copy;
}
// Thực tế: structuredClone(obj)
```

## [M] JavaScript: đoán output.

```js
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C')).then(() => console.log('D'));
(async () => { console.log('E'); await null; console.log('F'); })();
console.log('G');
```

**Đáp án**: `A E G C F D B`
- Đồng bộ: A, E (phần trước `await` chạy ngay), G.
- Microtask theo thứ tự đăng ký: C, F; sau đó D (then thứ 2 được đăng ký khi C xong).
- Macrotask: B.

## [M] Bài test về nhà: xây dựng REST API CRUD (ví dụ Todo/Blog) bằng Laravel — interviewer chấm gì?

Checklist để đạt điểm cao:
- Migration + model + factory + seeder; quan hệ đúng, index, FK.
- Route `apiResource`, versioning `/api/v1`.
- **FormRequest** validate, **Policy** phân quyền, **API Resource** cho output, status code đúng (201/204/404/422).
- Auth bằng **Sanctum**.
- Phân trang, lọc, tìm kiếm; eager loading (không N+1).
- Service/Action class nếu logic phức tạp; controller mỏng.
- **Feature test** cho các luồng chính (Pest/PHPUnit).
- Xử lý lỗi thống nhất, không lộ stack trace.
- Docker/Sail hoặc hướng dẫn chạy rõ ràng; **README** (cách cài, tài khoản test, quyết định thiết kế, phần chưa làm kịp).
- Commit nhỏ, message rõ ràng; Pint/Larastan sạch.

## [S] Thiết kế class giỏ hàng có áp dụng mã giảm giá (nhiều loại: %, số tiền cố định, freeship).

```php
interface Discount {
    public function apply(Cart $cart): Money;   // trả về số tiền được giảm
}

final class PercentDiscount implements Discount {
    public function __construct(private int $percent, private ?Money $maxDiscount = null) {}
    public function apply(Cart $cart): Money {
        $d = $cart->subtotal()->multiply($this->percent / 100);
        return $this->maxDiscount ? $d->min($this->maxDiscount) : $d;
    }
}

final class FixedDiscount implements Discount { /* ... */ }
final class FreeShipping implements Discount {
    public function apply(Cart $cart): Money { return $cart->shippingFee(); }
}

final class Cart {
    /** @var Discount[] */ private array $discounts = [];
    public function addDiscount(Discount $d): void { $this->discounts[] = $d; }
    public function total(): Money {
        $discount = array_reduce($this->discounts, fn (Money $c, Discount $d) => $c->add($d->apply($this)), Money::zero());
        return $this->subtotal()->add($this->shippingFee())->subtract($discount)->max(Money::zero());
    }
}
```

Điểm thảo luận: **Strategy pattern** + Open/Closed (thêm loại mới không sửa Cart), điều kiện áp dụng (đơn tối thiểu, hạn dùng, số lượt, mỗi user 1 lần) tách thành `Rule`, tiền dùng số nguyên (Money VO), không để tổng âm, unit test từng loại.
