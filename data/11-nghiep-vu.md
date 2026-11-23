---
key: nghiepvu
title: Nghiệp vụ & Tình huống
icon: 💼
group: Nghiệp vụ & Kỹ năng
order: 11
desc: Câu hỏi nghiệp vụ hay gặp: thương mại điện tử, thanh toán, tồn kho, phân quyền, báo cáo, quy trình Agile, estimate, xử lý sự cố.
---

## [J] Mô tả dự án gần nhất bạn làm: kiến trúc, công nghệ, vai trò của bạn?

Khung trả lời (2–3 phút):
1. **Sản phẩm**: làm gì, cho ai, quy mô (số user, số đơn/ngày).
2. **Team & quy trình**: mấy người, Scrum sprint 2 tuần, Jira/Backlog.
3. **Công nghệ**: Laravel 11, MySQL 8, Redis, Vue 3/Inertia, Docker, deploy AWS/Forge…
4. **Vai trò của bạn**: các module bạn phụ trách cụ thể (thanh toán, phân quyền, báo cáo…).
5. **Một khó khăn + cách giải quyết + kết quả có số liệu**.

> ⚠️ Interviewer sẽ đào sâu bất cứ điều gì bạn nói. Chỉ kể những gì bạn thực sự làm và hiểu. Chuẩn bị sẵn sơ đồ DB các bảng chính.

## [J] Quy trình Agile/Scrum bạn đã tham gia như thế nào?

- **Sprint** 1–2 tuần. Các sự kiện: **Sprint Planning**, **Daily Standup** (hôm qua làm gì, hôm nay làm gì, vướng gì), **Sprint Review/Demo**, **Retrospective**.
- Vai trò: Product Owner (ưu tiên backlog), Scrum Master, Dev team.
- Artifact: Product Backlog, Sprint Backlog, user story + acceptance criteria, story point.
- Ở VN cũng phổ biến **Waterfall** (dự án outsource Nhật: tài liệu đặc tả chi tiết, phase rõ ràng) và Kanban (team vận hành).

## [J] Bạn nhận một task mới, bạn làm những bước nào từ đầu đến khi xong?

1. Đọc kỹ yêu cầu, **hỏi lại điểm chưa rõ** với BA/PO (edge case, quyền, dữ liệu cũ).
2. Phân tích ảnh hưởng: DB, API, màn hình nào, module nào liên quan.
3. Estimate và báo lại nếu lớn hơn dự kiến.
4. Tạo branch, code + viết test.
5. Tự test (cả case lỗi), self-review diff.
6. Tạo PR có mô tả, ảnh chụp/video, cách test → review → sửa.
7. Merge, theo dõi trên staging/production, cập nhật ticket, bàn giao tài liệu nếu cần.

## [M] Thiết kế database cho một website bán hàng (e-commerce) cơ bản.

Các bảng chính:
- `users`, `addresses`
- `categories` (cây, `parent_id`), `brands`
- `products` (thông tin chung) → `product_variants` (SKU, giá, tồn kho theo size/màu), `product_images`, `attributes`/`attribute_values` (hoặc JSON)
- `carts`, `cart_items`
- `orders` (mã đơn, user_id, trạng thái, tổng tiền, phí ship, giảm giá, **snapshot địa chỉ giao hàng**), `order_items` (**snapshot tên, giá tại thời điểm mua**, số lượng)
- `payments` (phương thức, mã giao dịch cổng, trạng thái, số tiền, raw response)
- `coupons`, `coupon_usages`
- `shipments` (đơn vị vận chuyển GHN/GHTK, mã vận đơn, trạng thái)
- `inventory_movements` (lịch sử nhập/xuất kho), `order_status_histories`

Điểm ghi điểm: lưu **snapshot** giá/tên/địa chỉ trong đơn; tiền dùng `DECIMAL`/số nguyên; index `(user_id, created_at)` cho đơn hàng; trạng thái đơn bằng enum + state machine.

## [M] Luồng đặt hàng và trạng thái đơn hàng nên thiết kế thế nào?

Trạng thái ví dụ: `pending` (chờ thanh toán) → `paid`/`confirmed` → `processing` (đóng gói) → `shipping` → `delivered` → `completed`; nhánh: `cancelled`, `payment_failed`, `returned`/`refunded`.

- Dùng **state machine**: chỉ cho phép chuyển trạng thái hợp lệ (không thể từ `delivered` về `pending`). Package: `spatie/laravel-model-states` hoặc enum với method `canTransitionTo()`.
- Lưu lịch sử chuyển trạng thái (ai, lúc nào, lý do).
- Mỗi lần đổi trạng thái phát **event** (gửi mail, trừ/hoàn kho, cộng điểm).
- Đơn `pending` quá X phút → job tự huỷ và hoàn kho.

## [M] Tích hợp cổng thanh toán (VNPay, MoMo, ZaloPay, Stripe) như thế nào? Những lưu ý?

Luồng chung:
1. Tạo đơn trạng thái `pending` → tạo URL thanh toán có **chữ ký** (HMAC SHA512 với secret) → redirect người dùng.
2. Người dùng thanh toán → cổng gọi **IPN/webhook** (server-to-server) **và** redirect về **return URL**.
3. **Chỉ cập nhật trạng thái đơn dựa vào IPN** (đã verify chữ ký, đối chiếu mã đơn + **số tiền**), return URL chỉ để hiển thị.
4. Xử lý **idempotent**: IPN có thể gửi nhiều lần.
5. Có job **đối soát** (query trạng thái giao dịch) cho đơn treo, và đối soát cuối ngày.
6. Ghi log toàn bộ request/response; không lưu thông tin thẻ (PCI DSS).
7. Xử lý timeout, người dùng đóng trình duyệt giữa chừng, thanh toán thành công nhưng đơn đã bị huỷ (→ hoàn tiền).

## [M] Làm sao để không bán vượt tồn kho (overselling)?

- Trừ kho **atomic**: `UPDATE product_variants SET stock = stock - :qty WHERE id = :id AND stock >= :qty` → kiểm tra affected rows.
- Hoặc `SELECT ... FOR UPDATE` trong transaction.
- Chọn thời điểm trừ kho: khi đặt hàng (giữ chỗ có thời hạn) hay khi thanh toán xong — tuỳ nghiệp vụ; giữ chỗ thì cần job hoàn kho khi hết hạn.
- Traffic lớn: tồn kho trong Redis (`DECRBY` atomic) + đồng bộ DB qua queue.
- Lưu `inventory_movements` để truy vết và đối soát.

## [M] Thiết kế hệ thống phân quyền (RBAC) cho trang quản trị.

- Bảng: `roles`, `permissions`, `role_has_permissions`, `model_has_roles`, (tuỳ chọn) `model_has_permissions` cho quyền riêng từng user.
- Permission đặt theo `resource.action`: `orders.view`, `orders.refund`, `products.update`.
- Kiểm tra ở **backend** (middleware `permission:orders.refund`, Policy, Gate), frontend chỉ ẩn/hiện nút.
- Cache quyền (Redis), xoá cache khi đổi quyền.
- Nâng cao: phân quyền theo dữ liệu (chỉ xem đơn chi nhánh mình) → kết hợp Policy/global scope; **audit log** thao tác nhạy cảm.
- Laravel: `spatie/laravel-permission`.

## [M] Xây dựng chức năng xuất báo cáo Excel hàng trăm nghìn dòng mà không treo server?

- Không xuất đồng bộ trong request (timeout, hết RAM).
- Người dùng bấm xuất → tạo bản ghi `exports` → **dispatch job** → job đọc dữ liệu theo `chunkById`/`lazy()` và ghi **stream** (Laravel Excel `FromQuery` + `ShouldQueue`, hoặc OpenSpout; CSV nhanh nhất).
- Lưu file lên S3, gửi thông báo/email kèm link tải có hạn (signed URL).
- Tối ưu query: chỉ cột cần, eager load, index; báo cáo nặng thì đọc từ **replica** hoặc bảng tổng hợp.
- Giới hạn khoảng thời gian, chặn bấm xuất nhiều lần (unique job).

## [M] Hệ thống cần gửi email nhắc nhở cho 100.000 khách hàng mỗi sáng. Bạn làm thế nào?

- Scheduler chạy command lúc 7:00 → command **không gửi trực tiếp** mà chia khách theo `chunkById(1000)` và dispatch job (hoặc `Bus::batch`).
- Job gửi qua queue `emails`, nhiều worker, **rate limit** theo giới hạn provider (SES/Mailgun).
- Đánh dấu đã gửi để không gửi trùng nếu job retry/command chạy lại (`reminder_sent_at`).
- Theo dõi bounce/complaint, cho phép hủy đăng ký.
- `withoutOverlapping()` + `onOneServer()` cho command.

## [M] Bạn estimate task như thế nào? Nếu thấy không kịp deadline thì làm gì?

- Chia nhỏ task (≤ 1 ngày mỗi phần): DB, API, UI, test, review, buffer cho rủi ro (20–30%).
- So sánh với task tương tự đã làm; dùng story point nếu team dùng.
- Nêu rõ giả định và rủi ro khi đưa estimate.
- Không kịp: **báo sớm** cho lead/PM (không đợi đến ngày cuối), nói rõ lý do + phương án: cắt bớt phạm vi (MVP), xin thêm thời gian, nhờ hỗ trợ, ưu tiên phần quan trọng.

## [M] Production có bug nghiêm trọng vào tối thứ 6, bạn xử lý thế nào?

1. Xác nhận và đánh giá mức độ ảnh hưởng (bao nhiêu user, có mất tiền/dữ liệu không).
2. **Báo ngay** cho lead/người phụ trách, cập nhật trên kênh chung.
3. Giảm thiệt hại: rollback bản deploy, tắt feature flag, hotfix nhỏ nhất có thể.
4. Hotfix có review (dù nhanh) và test trên staging nếu có thể.
5. Kiểm tra/sửa dữ liệu bị ảnh hưởng.
6. Sau đó: tìm **nguyên nhân gốc**, viết post-mortem, thêm test/monitoring để không lặp lại.

## [M] Khách hàng/PM yêu cầu thay đổi khi sprint đang chạy, bạn làm gì?

- Lắng nghe và làm rõ yêu cầu, mức độ khẩn cấp.
- Đánh giá ảnh hưởng (thời gian, rủi ro, task đang làm) và báo lại cho PO/PM.
- Để PO quyết định ưu tiên: đưa vào sprint sau, hoặc đổi với task có độ lớn tương đương nếu thật sự gấp.
- Ghi nhận thay đổi bằng văn bản (ticket), tránh "nói miệng".

## [M] Code review: bạn chú ý điều gì khi review code người khác? Phản ứng thế nào khi bị review gắt?

Khi review:
- Đúng yêu cầu nghiệp vụ, edge case, xử lý lỗi.
- Bảo mật (phân quyền, validate, SQL injection), hiệu năng (N+1, query trong vòng lặp, thiếu index).
- Dễ đọc, đặt tên, trùng lặp, có test.
- Góp ý **vào code, không vào người**, giải thích lý do, phân biệt "bắt buộc sửa" và "gợi ý".

Khi bị review: coi là cơ hội học, hỏi lại nếu chưa hiểu, trao đổi bằng lý lẽ nếu không đồng ý, không cá nhân hoá.

## [M] Làm sao đảm bảo chất lượng code trong team?

- Coding convention + tự động hoá: Pint, Larastan, ESLint/Prettier, pre-commit hook.
- Code review bắt buộc, PR nhỏ.
- Test tự động (unit + feature) chạy trong CI; coverage cho phần nghiệp vụ quan trọng (thanh toán, tính tiền).
- Môi trường staging giống production, QA test trước khi release.
- Tài liệu: README, ADR (quyết định kiến trúc), API docs.
- Giám sát lỗi sau release (Sentry).

## [S] Hệ thống cũ (legacy PHP thuần/Laravel 5) cần nâng cấp. Bạn tiếp cận thế nào?

1. Tìm hiểu hệ thống, viết tài liệu, xác định phần quan trọng nhất về nghiệp vụ.
2. Viết **test bao phủ hành vi hiện tại** (characterization test) trước khi sửa.
3. Nâng cấp từng bước (PHP 7.4 → 8.x, Laravel từng major) — **Laravel Shift**, **Rector** hỗ trợ tự động.
4. **Strangler fig pattern**: chức năng mới viết trên hệ thống mới, dần dần thay thế các phần cũ, proxy định tuyến.
5. Feature flag, release nhỏ, có kế hoạch rollback.
6. Tránh "viết lại toàn bộ từ đầu" trừ khi có lý do rất mạnh.

## [S] Bạn sẽ thuyết phục team/manager áp dụng một công nghệ/thay đổi mới như thế nào?

- Bắt đầu từ **vấn đề** đang gặp (số liệu: thời gian deploy, số bug, chi phí), không phải từ công nghệ.
- Làm **PoC** nhỏ, đo trước/sau.
- Trình bày chi phí: học, chuyển đổi, rủi ro, phương án rollback.
- Thử nghiệm trên phạm vi nhỏ (một module) rồi mở rộng.
- Lắng nghe phản biện, sẵn sàng chấp nhận nếu team quyết định khác.
