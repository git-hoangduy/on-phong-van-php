---
key: htmlcss
title: HTML & CSS
icon: 🎨
group: Frontend
order: 5
desc: Semantic HTML, SEO, accessibility, box model, position, Flexbox, Grid, responsive, specificity, Tailwind.
---

## [J] Semantic HTML là gì? Tại sao quan trọng?

Dùng thẻ mang ý nghĩa: `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`, `<figure>`, `<time>`, `<button>` thay vì toàn `<div>`.

Lợi ích: **SEO** (máy tìm kiếm hiểu cấu trúc), **accessibility** (screen reader), code dễ đọc, hành vi mặc định đúng (button focus được, Enter/Space hoạt động).

## [J] `<!DOCTYPE html>` dùng để làm gì?

Báo cho trình duyệt render ở **standards mode**. Thiếu doctype → **quirks mode**, box model và layout có thể sai khác.

## [J] Block, inline và inline-block khác nhau thế nào?

- **block** (`div`, `p`, `h1`, `section`): chiếm hết chiều ngang, xuống dòng mới, set được width/height/margin đầy đủ.
- **inline** (`span`, `a`, `strong`): nằm cùng dòng, **không set được width/height**, margin/padding dọc không đẩy layout.
- **inline-block**: nằm cùng dòng nhưng set được width/height.

## [J] Box model là gì? `box-sizing: border-box` khác `content-box`?

Mỗi phần tử gồm: **content → padding → border → margin**.

- `content-box` (mặc định): `width` chỉ tính content → tổng = width + padding + border.
- `border-box`: `width` đã bao gồm padding + border → dễ tính layout. Thường đặt `*, *::before, *::after { box-sizing: border-box; }`.
- **Margin collapse**: margin dọc của 2 block liền kề gộp lại bằng giá trị lớn hơn (không áp dụng trong flex/grid).

## [J] Các giá trị của `position`?

- `static`: mặc định, theo luồng bình thường.
- `relative`: theo luồng, dịch chuyển tương đối với vị trí gốc; làm mốc cho con `absolute`.
- `absolute`: rời luồng, định vị theo **tổ tiên gần nhất có position khác static**.
- `fixed`: theo **viewport**, không cuộn theo trang (lưu ý: cha có `transform` sẽ làm fixed định vị theo cha).
- `sticky`: như relative cho đến khi cuộn tới ngưỡng thì dính như fixed (trong phạm vi cha).

## [J] CSS specificity (độ ưu tiên) tính như thế nào?

Thứ tự (cao → thấp): `!important` > inline style > **ID** > **class, attribute, pseudo-class** > **element, pseudo-element**.

Tính theo bộ (ID, class, element): `#nav .item a` = (1,1,1) > `.menu .item a` = (0,2,1). Bằng nhau → rule **viết sau** thắng.
`:where()` có specificity 0; `:is()`/`:not()` lấy theo đối số mạnh nhất. Hạn chế `!important`; dùng `@layer` để quản lý thứ tự cascade.

## [J] Flexbox: các thuộc tính chính?

Container: `display:flex`, `flex-direction`, `justify-content` (trục chính), `align-items` (trục phụ), `flex-wrap`, `gap`.
Item: `flex-grow`, `flex-shrink`, `flex-basis` (viết tắt `flex: 1 1 0`), `align-self`, `order`.

```css
/* Căn giữa tuyệt đối */
.center { display: flex; justify-content: center; align-items: center; }
```

## [J] Có những cách nào để căn giữa một phần tử?

- Flex: `display:flex; justify-content:center; align-items:center;`
- Grid: `display:grid; place-items:center;`
- Absolute: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);`
- Ngang cho block có width: `margin: 0 auto;`
- Text/inline: `text-align:center`.

## [J] `display:none`, `visibility:hidden`, `opacity:0` khác nhau?

| | Chiếm chỗ | Click được | Screen reader | Transition |
|---|---|---|---|---|
| `display:none` | Không | Không | Ẩn | Không (trừ `transition-behavior: allow-discrete`) |
| `visibility:hidden` | Có | Không | Ẩn | Có |
| `opacity:0` | Có | **Có** | Đọc được | Có |

## [J] Các đơn vị CSS: `px`, `em`, `rem`, `%`, `vw/vh`?

- `px`: cố định.
- `em`: theo font-size của **phần tử cha** (lồng nhau sẽ nhân dồn).
- `rem`: theo font-size của **root `html`** — khuyên dùng cho font, spacing.
- `%`: theo phần tử cha.
- `vw/vh`: % viewport. Trên mobile dùng `dvh`/`svh` để tránh lỗi thanh địa chỉ.
- `clamp(1rem, 2.5vw, 2rem)`: giá trị co giãn có min/max.

## [M] Flexbox và Grid khác nhau thế nào? Khi nào dùng?

- **Flexbox**: layout **1 chiều** (hàng *hoặc* cột), nội dung quyết định kích thước. Dùng cho navbar, nhóm nút, căn chỉnh component.
- **Grid**: layout **2 chiều** (hàng *và* cột), bố cục quyết định. Dùng cho layout trang, gallery, dashboard.

```css
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
```

## [M] Responsive design làm như thế nào? Mobile-first là gì?

- Thẻ `<meta name="viewport" content="width=device-width, initial-scale=1">`.
- **Mobile-first**: viết CSS cho màn nhỏ trước, rồi `@media (min-width: 768px)` mở rộng cho màn lớn.
- Layout co giãn (flex/grid, `%`, `fr`), ảnh `max-width:100%`, `srcset`/`<picture>`.
- **Container queries** (`@container`): responsive theo kích thước component thay vì viewport.
- Breakpoint phổ biến (Tailwind): 640, 768, 1024, 1280, 1536px.

## [M] Pseudo-class và pseudo-element khác nhau thế nào?

- **Pseudo-class** (`:`) chọn phần tử theo **trạng thái**: `:hover`, `:focus-visible`, `:nth-child(2n)`, `:first-child`, `:not()`, `:has()` (chọn cha theo con).
- **Pseudo-element** (`::`) tạo/chọn **một phần** của phần tử: `::before`, `::after` (cần `content`), `::placeholder`, `::selection`, `::first-line`.

## [M] Stacking context và `z-index` không có tác dụng — vì sao?

- `z-index` chỉ có tác dụng với phần tử có `position` khác static (hoặc là con của flex/grid).
- Một **stacking context** mới được tạo bởi: `position` + `z-index`, `opacity < 1`, `transform`, `filter`, `isolation: isolate`… Con trong context đó **không thể** vượt lên trên phần tử bên ngoài context dù z-index lớn đến đâu.
- Cách xử lý: tìm phần tử cha tạo stacking context, hoặc đưa modal ra cuối `body` (portal), dùng `<dialog>`.

## [M] Tối ưu tốc độ tải trang (Core Web Vitals)?

- Chỉ số: **LCP** (tải nội dung chính < 2.5s), **INP** (phản hồi tương tác < 200ms), **CLS** (dịch chuyển layout < 0.1).
- Ảnh: WebP/AVIF, đúng kích thước, `loading="lazy"`, khai báo `width/height` (tránh CLS), `fetchpriority="high"` cho ảnh LCP.
- CSS/JS: minify, bundle/split (Vite), `defer`/`async` cho script, critical CSS.
- Font: `font-display: swap`, preload.
- Server: gzip/brotli, HTTP/2–3, CDN, cache header, giảm TTFB (cache phía server).
- Đo bằng Lighthouse, PageSpeed Insights.

## [M] SEO cơ bản cho một website?

- Thẻ `<title>`, `<meta name="description">`, một `<h1>` mỗi trang, heading đúng thứ tự.
- URL thân thiện (slug), `rel="canonical"`, `sitemap.xml`, `robots.txt`.
- Open Graph (`og:title`, `og:image`) khi chia sẻ Facebook/Zalo.
- Structured data (JSON-LD: Product, Article, Breadcrumb).
- Tốc độ tải, mobile-friendly, HTTPS, `alt` cho ảnh.
- SPA cần **SSR/SSG** (Nuxt, Next, Inertia SSR) để bot đọc được nội dung.

## [M] Accessibility (a11y) cơ bản?

- Dùng semantic HTML, `<button>` cho hành động, `<a>` cho điều hướng.
- `alt` cho ảnh, `<label for>` cho input.
- Điều hướng được bằng bàn phím, có `:focus-visible` rõ ràng.
- Độ tương phản màu đủ (WCAG AA 4.5:1).
- ARIA chỉ khi HTML không đủ (`aria-label`, `aria-expanded`, `role="dialog"`).

## [M] BEM là gì? So sánh với Tailwind CSS?

- **BEM**: quy ước đặt tên `block__element--modifier` (`.card__title--large`) tránh xung đột CSS.
- **Tailwind**: utility-first, viết class trực tiếp trong HTML (`flex items-center gap-2`). Ưu: nhanh, nhất quán design token, không lo đặt tên, CSS build ra nhỏ (chỉ class dùng). Nhược: HTML dài, cần quy ước tách component.
- Laravel mặc định dùng Tailwind + Vite.

## [M] CSS preprocessor (SASS/SCSS) cho lợi ích gì? CSS hiện đại có thay thế được không?

SASS có: biến, nesting, mixin, function, partial/import, vòng lặp.
CSS hiện đại đã có: **custom properties** (`--primary`), **nesting** native, `@layer`, `color-mix()`, `:has()`, container queries → nhiều dự án mới không cần SASS nữa.

## [S] Critical rendering path: trình duyệt render một trang như thế nào?

1. Tải HTML → parse thành **DOM**.
2. Tải CSS → **CSSOM** (CSS là render-blocking).
3. Script không `defer/async` chặn parse HTML.
4. DOM + CSSOM → **Render tree**.
5. **Layout** (reflow): tính kích thước, vị trí.
6. **Paint** → **Composite** các layer.

Tối ưu: giảm CSS chặn render, `defer` script, tránh **layout thrashing** (đọc `offsetHeight` rồi ghi style xen kẽ trong vòng lặp), animate bằng `transform`/`opacity` (chỉ composite, không reflow).
