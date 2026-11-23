---
key: lo-trinh
type: guide
title: Lộ trình ôn & chiến thuật
icon: 🗺️
order: 0
desc: Đọc trang này đầu tiên. Quy trình phỏng vấn ở Việt Nam, lộ trình ôn 7/14 ngày, checklist trước buổi phỏng vấn.
---

### 1. Quy trình phỏng vấn phổ biến ở Việt Nam

| Vòng | Ai phỏng vấn | Nội dung | Mẹo |
|---|---|---|---|
| Lọc CV / gọi điện | HR / Recruiter | Xác nhận kinh nghiệm, lý do nghỉ, **mức lương mong muốn**, thời gian onboard | Chuẩn bị sẵn 1 khoảng lương, đừng nói con số lẻ |
| Bài test (tuỳ công ty) | Online / làm tại nhà | Trắc nghiệm PHP/SQL/JS, hoặc 1 mini project Laravel (CRUD + API + auth) trong 2–5 ngày | Viết README, có test, commit rõ ràng. Code sạch quan trọng hơn nhiều tính năng |
| Technical | Team Lead / Senior | Kiến thức nền + hỏi sâu vào dự án trong CV + live coding/SQL | Câu nào trong CV cũng có thể bị đào sâu |
| Manager / CTO / Culture fit | Manager, đôi khi bằng tiếng Anh | Tình huống, cách làm việc nhóm, định hướng | Kể chuyện theo STAR |
| Offer | HR | Lương, thử việc (thường 85–100% lương, tối đa 2 tháng), bảo hiểm, thưởng tháng 13, review lương | Hỏi rõ gross/net, lương đóng BHXH |

> 💡 Công ty outsource (FPT, NashTech, Rikkei, CMC…) thường hỏi rộng + tiếng Anh + quy trình (Scrum, estimate). Công ty product/startup hỏi sâu thiết kế, hiệu năng, cách bạn tự giải quyết vấn đề. Công ty Nhật hỏi kỹ về tính cẩn thận, báo cáo (hou-ren-sou), test case.

### 2. Lộ trình ôn 7 ngày (đã có nền tảng)

1. **Ngày 1 – PHP Core + OOP/SOLID**: học hết câu Junior + Middle, làm trắc nghiệm PHP.
2. **Ngày 2 – Laravel**: lifecycle, service container, Eloquent, N+1, queue, middleware, auth. Mở 1 project Laravel ra xem lại code thật.
3. **Ngày 3 – MySQL**: index, JOIN, transaction, isolation, EXPLAIN. **Tự tay viết 10 câu SQL** ở mục Live coding.
4. **Ngày 4 – HTML/CSS/JS + API/Web**: event loop, closure, promise, flex/grid, REST, CORS, cookie/session/JWT.
5. **Ngày 5 – Bảo mật + DevOps + Thiết kế hệ thống**: OWASP, Git, Docker, Nginx, Redis, deploy, cache.
6. **Ngày 6 – Nghiệp vụ + HR**: chuẩn bị 3 câu chuyện STAR, phần giới thiệu bản thân 2 phút, câu hỏi hỏi ngược.
7. **Ngày 7 – Phỏng vấn thử**: 2 lượt mock 15 câu, sau đó Flashcard chế độ "Cần ôn lại" cho đến khi hết ❌.

**Lộ trình 14 ngày**: nhân đôi mỗi bước, thêm 1 mini project Laravel (blog/todo có API + test + Docker) để có cái kể khi phỏng vấn và push lên GitHub.

### 3. Cách học bằng app này

- Đọc câu hỏi → **nói to câu trả lời** trong 1–2 phút → mới mở đáp án → chấm điểm thật lòng.
- Mỗi tối: chạy Flashcard ở chế độ *Câu cần ôn lại*.
- Trước ngày phỏng vấn 1–2 ngày: làm 2 lượt *Phỏng vấn thử* ≥ 80% là ổn.
- Câu trả lời mẫu chỉ là **khung**: hãy gắn với ví dụ thật trong dự án của bạn ("Ở dự án X mình đã…"). Interviewer chấm điểm kinh nghiệm thực tế cao hơn định nghĩa sách vở.

### 4. Công thức trả lời câu kỹ thuật (ghi điểm)

1. **Định nghĩa ngắn** (1–2 câu, đúng trọng tâm).
2. **Ví dụ/code** hoặc trường hợp thực tế đã gặp.
3. **So sánh / ưu nhược / khi nào không nên dùng**.
4. Nếu không biết: *"Phần này em chưa làm thực tế, theo em hiểu thì… em sẽ tìm hiểu thêm về…"* — trung thực luôn tốt hơn bịa.

### 5. Công thức STAR cho câu hỏi hành vi

- **S**ituation – bối cảnh (dự án gì, team mấy người).
- **T**ask – nhiệm vụ / vấn đề của bạn.
- **A**ction – bạn đã làm gì (dùng "em/tôi", không phải "team").
- **R**esult – kết quả đo được (giảm 60% thời gian load, 0 bug production…).

Chuẩn bị trước 3–4 câu chuyện dùng lại được cho nhiều câu hỏi: *1 bug khó đã fix*, *1 lần tối ưu hiệu năng*, *1 xung đột trong team*, *1 lần trễ deadline / mắc lỗi và cách xử lý*.

### 6. Mức lương tham khảo (PHP/Laravel, 2025–2026, gross/tháng)

| Level | Kinh nghiệm | Khoảng phổ biến |
|---|---|---|
| Fresher | < 1 năm | 6 – 12 triệu |
| Junior | 1 – 2 năm | 12 – 20 triệu |
| Middle | 2 – 4 năm | 20 – 35 triệu |
| Senior | 4+ năm | 35 – 60 triệu |
| Lead / Senior có tiếng Anh/Nhật tốt, công ty nước ngoài | | 50 – 90+ triệu |

Số trung bình công bố: Indeed ~17,7 triệu, JobsGO ~18,7 triệu/tháng cho "PHP developer" nói chung (đa số là junior–middle). Fullstack có React/Vue + DevOps cơ bản thường cao hơn 10–20%. **Hãy tự kiểm tra lại** trên ITviec, TopDev, VietnamWorks theo đúng vị trí và thành phố của bạn.

### 7. Checklist trước buổi phỏng vấn

- [ ] Đọc kỹ JD, gạch chân các công nghệ → ôn đúng chủ đề đó trước.
- [ ] Tìm hiểu công ty: sản phẩm, outsource hay product, quy mô, review trên ITviec/Facebook.
- [ ] Học thuộc phần **giới thiệu bản thân 1–2 phút** (có bản tiếng Anh).
- [ ] Nắm chắc **mọi thứ ghi trong CV** — đặc biệt các dự án: kiến trúc, DB, phần bạn làm, khó khăn.
- [ ] Chuẩn bị khoảng lương mong muốn (min chấp nhận được – mức mong muốn).
- [ ] Chuẩn bị 3 câu hỏi hỏi ngược lại.
- [ ] Phỏng vấn online: test camera/mic, mạng, nền gọn gàng, mở sẵn IDE nếu có live coding.
- [ ] Đến sớm 10 phút (offline), mang CV in, ăn mặc gọn gàng (smart casual là đủ).

### 8. Sau buổi phỏng vấn

- Gửi email/tin nhắn cảm ơn ngắn cho HR trong 24h.
- Ghi lại các câu bị hỏi mà chưa trả lời tốt → thêm vào file `data/*.md` của app này để ôn.
- Nếu trượt: xin feedback lịch sự, đa số HR sẽ chia sẻ nếu bạn hỏi khéo.
