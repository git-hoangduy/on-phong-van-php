# 🎯 PV PHP Fullstack — App ôn phỏng vấn

Web app ôn phỏng vấn **PHP Fullstack** (PHP, Laravel, MySQL, HTML/CSS, JavaScript, Web/API, Bảo mật, DevOps, Thiết kế hệ thống, Nghiệp vụ, Live coding, HR) dành cho thị trường Việt Nam.

## Chạy app

**Cách 1 — Laravel Herd** (đang để trong thư mục Herd): mở `http://php.test`
(nếu thư mục `d:\Applications\Herd` đã được Herd "park"; nếu chưa: mở Herd → Sites → Add/Park thư mục này).

**Cách 2 — PHP built-in server:**

```bash
php -S localhost:8000
```

Mở `http://localhost:8000`. Chỉ cần PHP ≥ 8.1, không cần Composer, không cần database.

## Deploy lên GitHub Pages (học trên điện thoại)

GitHub Pages chỉ phục vụ file tĩnh nên `build.php` sẽ render toàn bộ app thành `dist/index.html`. Việc build do **GitHub Actions** tự làm ([.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)).

1. Tạo repo mới trên GitHub (ví dụ `on-phong-van-php`, để Public — Pages miễn phí cho repo public).
2. Push code:
   ```bash
   git init -b main
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/<username>/on-phong-van-php.git
   git push -u origin main
   ```
3. Trên GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Vào tab **Actions**, đợi workflow "Deploy GitHub Pages" xanh (~1 phút) → mở `https://<username>.github.io/on-phong-van-php/`.

Mỗi lần sửa/thêm câu hỏi chỉ cần `git push`, trang sẽ tự cập nhật.

Build thử ở máy: `php build.php` → mở `dist/index.html`.

## Dùng trên iPhone như một app

1. Mở link GitHub Pages bằng **Safari**.
2. Bấm nút **Chia sẻ** → **Thêm vào MH chính** (Add to Home Screen).
3. Mở từ icon "PV PHP": chạy toàn màn hình, không có thanh địa chỉ, **học được cả khi offline** (sau lần mở đầu tiên có mạng).

Giao diện mobile: thanh tab dưới (Trang chủ / Flashcard / PV thử / Trắc nghiệm / Chủ đề), nút chấm điểm dính đáy màn hình để bấm bằng ngón cái, hỗ trợ tai thỏ/Dynamic Island và thanh home, chế độ tối.

> Lưu ý: tiến độ lưu riêng trong từng trình duyệt. Bản mở từ màn hình chính và bản trong Safari có thể không dùng chung dữ liệu — hãy chọn dùng một chỗ, hoặc dùng nút **Sao lưu / Khôi phục** ở trang chủ để chuyển tiến độ.

## Tính năng

| Chế độ | Mô tả |
|---|---|
| 📚 Ôn theo chủ đề | Danh sách câu hỏi + đáp án mẫu, lọc theo level (Junior/Middle/Senior), trạng thái, tìm kiếm không dấu |
| 🃏 Flashcard | Tự trả lời → lật thẻ → chấm ✅/🤔/❌. Ưu tiên câu yếu. Phím tắt `Space`, `1` `2` `3`, `←` `→` |
| 🎤 Phỏng vấn thử | Câu hỏi ngẫu nhiên có đồng hồ, chấm điểm cuối buổi, lưu lịch sử |
| ✅ Trắc nghiệm | Câu hỏi kiểu bài test online, có giải thích |
| 🔁 Cần ôn lại | Gom các câu ❌, 🤔 và ★ |
| 🗺️ Hướng dẫn | Lộ trình ôn 7/14 ngày, quy trình phỏng vấn ở VN, đàm phán lương |

Tiến độ lưu trong `localStorage` của trình duyệt; có nút **Sao lưu / Khôi phục** (file JSON) ở trang chủ.

## Thêm / sửa câu hỏi

Câu hỏi được viết bằng **Markdown** trong `data/*.md`:

```markdown
---
key: php            # mã chủ đề (không đổi sau khi đã học, tiến độ gắn theo nó)
title: PHP Core
icon: 🐘
group: Backend      # nhóm trên sidebar
order: 1            # thứ tự
desc: Mô tả ngắn
---

## [J] Câu hỏi junior?
Câu trả lời dạng Markdown: **đậm**, `code`, bảng, list, blockquote, code block...

## [M] Câu hỏi middle?
...

## [S] Câu hỏi senior?
...
```

- `[J]` / `[M]` / `[S]` = Junior / Middle / Senior.
- File có `type: guide` được hiển thị như trang tài liệu.
- Trắc nghiệm: `data/quiz/<key>.json` — mảng `{ q, options[], answer (index từ 0), explain }`. Tên file trùng `key` chủ đề để hiện đúng icon/tên.
- Lưu ý: tiến độ gắn với **nội dung câu hỏi** (hash tiêu đề), sửa tiêu đề câu hỏi sẽ reset tiến độ câu đó.

## Cấu trúc

```
index.php              # entry: đọc data, render trang (dùng cho Herd / php -S)
build.php              # xuất bản tĩnh ra dist/ cho GitHub Pages
sw.js                  # service worker: học offline
manifest.webmanifest   # PWA: thêm vào màn hình chính
tools/make-icons.php   # tạo icon PNG (đã tạo sẵn trong assets/icons)
src/Markdown.php       # parser Markdown tối giản
src/QuestionBank.php   # đọc data/*.md + data/quiz/*.json
assets/app.js          # SPA: router, flashcard, mock, quiz, tiến độ
assets/app.css         # giao diện (sáng/tối, responsive, in được)
data/                  # nội dung câu hỏi
```

## Nguồn tham khảo đã tổng hợp

ITviec (top câu hỏi PHP/Laravel), CareerLink (PHP 8, Laravel, bảo mật; đàm phán lương), TopCV, Glints, Viblo (kinh nghiệm phỏng vấn/nhảy việc), Guru99, Hyring, Laravel & PHP docs, OWASP, số liệu lương từ Indeed VN và JobsGO (2026). Nội dung đã được biên soạn lại và bổ sung; hãy kiểm tra lại các con số lương/luật lao động tại thời điểm bạn phỏng vấn.
