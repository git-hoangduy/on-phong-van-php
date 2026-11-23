---
key: javascript
title: JavaScript & Frontend
icon: 🟨
group: Frontend
order: 6
desc: var/let/const, hoisting, closure, this, event loop, Promise/async, DOM, ES6+, Vue/React cơ bản.
---

## [J] `var`, `let`, `const` khác nhau thế nào?

| | var | let | const |
|---|---|---|---|
| Scope | Function | Block `{}` | Block |
| Hoisting | Có, giá trị `undefined` | Có nhưng ở **TDZ** (truy cập trước khai báo → ReferenceError) | Như let |
| Khai báo lại | Được | Không | Không |
| Gán lại | Được | Được | **Không** (nhưng object/array bên trong vẫn sửa được) |

```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 3 3 3
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 0 1 2
```

## [J] Các kiểu dữ liệu trong JavaScript?

- **Primitive** (7): `string`, `number`, `bigint`, `boolean`, `undefined`, `null`, `symbol` — truyền theo giá trị, bất biến.
- **Object**: object, array, function, Date, Map, Set… — truyền theo tham chiếu.
- `typeof null === 'object'` (bug lịch sử). Kiểm tra mảng: `Array.isArray()`.

## [J] `==` và `===` trong JavaScript?

`==` ép kiểu trước khi so sánh, `===` không ép kiểu. Luôn dùng `===`.

```js
0 == '';         // true
null == undefined; // true
null === undefined; // false
NaN === NaN;     // false → dùng Number.isNaN()
[] == false;     // true
```

## [J] `null` và `undefined` khác nhau thế nào?

- `undefined`: biến đã khai báo nhưng **chưa gán**, thuộc tính không tồn tại, hàm không return.
- `null`: giá trị **cố ý gán** là "rỗng".
- Toán tử hữu ích: optional chaining `user?.address?.city`, nullish coalescing `value ?? 'default'` (chỉ thay khi null/undefined, khác `||` thay cả `0`, `''`).

## [J] Arrow function khác function thường thế nào?

- Không có `this` riêng — lấy `this` từ scope bao ngoài (lexical this).
- Không có `arguments`, không dùng làm constructor (`new`), không có `prototype`.
- Cú pháp gọn, return ngầm khi một biểu thức.
- Không nên dùng arrow cho method của object nếu cần `this` là object đó.

## [J] Các method mảng hay dùng? `map`, `filter`, `reduce`, `forEach`?

- `map`: trả mảng mới cùng độ dài.
- `filter`: trả mảng mới các phần tử thoả điều kiện.
- `reduce`: gộp thành 1 giá trị.
- `forEach`: chỉ duyệt, trả `undefined`, không `break` được.
- Khác: `find`, `findIndex`, `some`, `every`, `includes`, `flat`, `flatMap`, `sort` (sửa mảng gốc; mảng số phải truyền `(a, b) => a - b`), `toSorted` (không sửa gốc).

```js
const total = cart.filter(i => i.checked).reduce((sum, i) => sum + i.price * i.qty, 0);
```

## [J] Spread, rest, destructuring?

```js
const { name, address: { city } = {}, ...rest } = user; // destructuring + rest
const merged = { ...defaults, ...options };              // spread object (shallow copy)
const arr2 = [...arr1, 4];
function sum(...nums) { return nums.reduce((a, b) => a + b, 0); } // rest params
```

Spread chỉ copy **nông**. Deep copy: `structuredClone(obj)`.

## [J] Event bubbling, capturing và event delegation?

- Sự kiện đi 3 pha: **capturing** (từ `window` xuống) → **target** → **bubbling** (nổi lên cha).
- `e.stopPropagation()` dừng lan truyền; `e.preventDefault()` chặn hành vi mặc định (submit form, mở link).
- **Event delegation**: gắn 1 listener lên phần tử cha, dùng `e.target.closest('.item')` để xử lý cho các con — hiệu quả với danh sách dài và phần tử thêm động.

```js
list.addEventListener('click', e => {
  const btn = e.target.closest('[data-delete]');
  if (btn) removeItem(btn.dataset.id);
});
```

## [J] `localStorage`, `sessionStorage`, cookie khác nhau thế nào?

| | localStorage | sessionStorage | Cookie |
|---|---|---|---|
| Dung lượng | ~5–10MB | ~5MB | ~4KB |
| Hết hạn | Không tự hết | Đóng tab | Theo `Expires/Max-Age` |
| Gửi lên server | Không | Không | **Tự gửi theo mỗi request** |
| JS đọc được | Có | Có | Có, trừ `HttpOnly` |

Không lưu token nhạy cảm trong localStorage nếu có nguy cơ XSS; ưu tiên cookie `HttpOnly; Secure; SameSite`.

## [M] Closure là gì? Cho ví dụ ứng dụng.

Closure là hàm **nhớ được biến của scope bên ngoài** nơi nó được tạo, kể cả khi scope đó đã kết thúc.

```js
function createCounter() {
  let count = 0;            // biến private
  return { inc: () => ++count, get: () => count };
}
const c = createCounter(); c.inc(); c.get(); // 1

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
input.addEventListener('input', debounce(search, 300));
```

Ứng dụng: biến private, factory, debounce/throttle, memoize, callback giữ trạng thái. Lưu ý rò rỉ bộ nhớ nếu closure giữ object lớn.

## [M] Hoisting là gì?

Khi biên dịch, phần **khai báo** được "đưa lên đầu" scope:
- `function` declaration: hoisted cả thân hàm → gọi trước khai báo được.
- `var`: hoisted khai báo, giá trị `undefined`.
- `let/const/class`: hoisted nhưng nằm trong **Temporal Dead Zone** → truy cập trước khai báo báo lỗi.
- Function expression (`const f = function(){}`) theo quy tắc của biến.

## [M] `this` trong JavaScript xác định như thế nào? `call`, `apply`, `bind`?

`this` phụ thuộc **cách gọi hàm**:
1. `new Foo()` → object mới.
2. `call/apply/bind` → object được chỉ định.
3. `obj.method()` → `obj`.
4. Gọi trơn `fn()` → `undefined` (strict) / `window`.
5. Arrow function → `this` của scope bao ngoài.

- `fn.call(obj, a, b)`, `fn.apply(obj, [a, b])`: gọi ngay.
- `fn.bind(obj)`: trả về hàm mới gắn cố định `this`.

## [M] Event loop hoạt động như thế nào? Microtask vs macrotask?

JS chạy **đơn luồng** với call stack. Tác vụ bất đồng bộ được Web API/Node xử lý rồi đẩy callback vào hàng đợi.

- **Microtask**: Promise `.then`, `queueMicrotask`, `await` (phần sau await), MutationObserver.
- **Macrotask**: `setTimeout`, `setInterval`, I/O, sự kiện UI.
- Vòng lặp: chạy hết call stack → **chạy hết toàn bộ microtask** → render (nếu cần) → lấy **1 macrotask** → lặp lại.

```js
console.log(1);
setTimeout(() => console.log(2));
Promise.resolve().then(() => console.log(3));
console.log(4);
// 1 4 3 2
```

## [M] Promise là gì? `async/await`? `Promise.all` vs `allSettled` vs `race` vs `any`?

Promise đại diện cho kết quả tương lai: `pending → fulfilled | rejected`.

```js
async function loadDashboard() {
  try {
    const [user, orders] = await Promise.all([api('/me'), api('/orders')]); // chạy song song
    return { user, orders };
  } catch (e) {
    showError(e.message);
  }
}
```

- `Promise.all`: chờ **tất cả** thành công; 1 cái lỗi → reject ngay.
- `Promise.allSettled`: chờ tất cả xong, trả trạng thái từng cái.
- `Promise.race`: lấy cái **xong đầu tiên** (kể cả lỗi) — dùng làm timeout.
- `Promise.any`: lấy cái **thành công đầu tiên**.
- Lỗi phổ biến: `await` tuần tự trong vòng lặp khi có thể chạy song song; quên `try/catch`.

## [M] Debounce và Throttle khác nhau thế nào?

- **Debounce**: chỉ chạy sau khi sự kiện **ngừng** xảy ra X ms. Dùng cho ô tìm kiếm gợi ý, resize xong mới tính lại.
- **Throttle**: chạy **tối đa 1 lần mỗi X ms** trong khi sự kiện vẫn tiếp diễn. Dùng cho scroll, mousemove, infinite scroll.

## [M] Prototype và kế thừa trong JavaScript?

- Mỗi object có liên kết ẩn `[[Prototype]]` (`__proto__`) tới object khác; khi không tìm thấy thuộc tính thì tìm lên **prototype chain**.
- `class` trong ES6 chỉ là cú pháp đẹp (syntactic sugar) trên prototype.
- `Object.create(proto)`, `instanceof` kiểm tra chain.

## [M] Fetch API và AJAX? Gọi API kèm CSRF token trong Laravel thế nào?

```js
const res = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-CSRF-TOKEN': document.querySelector('meta[name=csrf-token]').content,
  },
  body: JSON.stringify({ product_id: 1, qty: 2 }),
});
if (!res.ok) throw new Error(`HTTP ${res.status}`); // fetch KHÔNG reject với 4xx/5xx
const data = await res.json();
```

- `fetch` chỉ reject khi lỗi mạng; phải tự kiểm tra `res.ok`.
- Hủy request: `AbortController`. Axios tự gửi `X-XSRF-TOKEN` từ cookie, có interceptor.

## [M] ES Modules và CommonJS khác nhau thế nào?

- **ESM**: `import/export`, phân tích tĩnh → tree-shaking, chuẩn trình duyệt, hỗ trợ top-level await.
- **CommonJS**: `require/module.exports`, đồng bộ, truyền thống của Node.
- Vite/Laravel Vite dùng ESM; `<script type="module">` tự động `defer`.

## [M] Shallow copy vs deep copy trong JS?

- Shallow: `{...obj}`, `Object.assign`, `arr.slice()` — object lồng bên trong vẫn chung tham chiếu.
- Deep: `structuredClone(obj)` (hiện đại, hỗ trợ Date/Map/Set), `JSON.parse(JSON.stringify())` (mất Date, function, undefined), lodash `cloneDeep`.

## [M] Virtual DOM là gì? Vue/React render như thế nào?

- Virtual DOM là bản mô tả DOM bằng object JS. Khi state đổi, framework tạo cây mới, **diff** với cây cũ và chỉ cập nhật phần DOM thật thay đổi.
- `key` trong danh sách giúp diff đúng phần tử — không dùng index làm key khi danh sách có thể thêm/xoá/sắp xếp.
- Vue dùng **reactivity** (Proxy) theo dõi dependency nên biết chính xác component nào cần render lại; React render lại component khi state/props đổi (tối ưu bằng `memo`, `useMemo`, `useCallback`, React Compiler).

## [M] Vue: Options API vs Composition API? `computed` vs `watch`? `v-if` vs `v-show`?

- **Composition API** (`<script setup>`, `ref`, `reactive`, composable) tái sử dụng logic tốt hơn, hỗ trợ TypeScript tốt; Options API (`data`, `methods`) dễ học.
- `computed`: giá trị suy ra, **có cache** theo dependency. `watch`: chạy side effect khi dữ liệu đổi (gọi API, lưu localStorage).
- `v-if`: thêm/xoá khỏi DOM (chi phí bật/tắt cao). `v-show`: chỉ đổi `display` (chi phí render ban đầu cao). Bật/tắt thường xuyên → `v-show`.
- Giao tiếp component: props xuống, emit lên, provide/inject, store **Pinia**.

## [M] React: các hook cơ bản? `useEffect` dependency array?

- `useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`, `useContext`, `useReducer`.
- `useEffect(fn)` chạy sau mỗi render; `[]` chỉ chạy khi mount; `[a, b]` chạy khi a/b đổi. Hàm return là **cleanup** (huỷ subscription, clear timer, abort fetch).
- Quy tắc hook: chỉ gọi ở top-level component/custom hook, không gọi trong if/loop.
- State bất biến: `setItems([...items, newItem])`, không `items.push()`.

## [M] Inertia.js, Livewire và SPA tách rời (API + Vue/React) khác nhau thế nào?

| | Livewire | Inertia | SPA + API |
|---|---|---|---|
| Frontend | Blade + PHP component | Vue/React/Svelte | Vue/React riêng |
| Routing | Laravel | Laravel | Frontend router |
| API | Không cần | Không cần (props từ controller) | REST/GraphQL, auth token/Sanctum |
| Phù hợp | Team PHP, admin, form nhiều | Fullstack muốn trải nghiệm SPA mà đơn giản | Nhiều client (web + mobile), team FE riêng |

## [S] Memory leak ở frontend thường do đâu?

- Event listener / `setInterval` không gỡ khi component unmount.
- Closure giữ tham chiếu DOM đã xoá.
- Biến global, cache tăng mãi không giới hạn.
- Subscription (WebSocket, observer) không unsubscribe.

Phát hiện bằng Chrome DevTools → Memory (heap snapshot), Performance monitor.

## [S] TypeScript mang lại lợi ích gì? `interface` vs `type`?

- Kiểm tra kiểu lúc biên dịch → bắt lỗi sớm, autocomplete, refactor an toàn, tài liệu sống.
- `interface`: mở rộng bằng `extends`, có thể **merge** khai báo — hợp cho shape object/public API.
- `type`: linh hoạt hơn (union, intersection, mapped/conditional type).
- Các khái niệm hay hỏi: generics, `unknown` vs `any`, utility types (`Partial`, `Pick`, `Omit`, `Record`), type narrowing.
