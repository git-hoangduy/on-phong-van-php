---
key: mysql
title: MySQL & Database
icon: 🐬
group: Backend
order: 4
desc: SQL cơ bản, JOIN, index, transaction, isolation level, lock, EXPLAIN, tối ưu, thiết kế DB, Redis/NoSQL.
---

## [J] Các loại JOIN trong SQL?

- `INNER JOIN`: chỉ các dòng khớp ở cả hai bảng.
- `LEFT JOIN`: tất cả dòng bảng trái + dòng khớp bảng phải (không khớp → NULL).
- `RIGHT JOIN`: ngược lại.
- `FULL OUTER JOIN`: MySQL không hỗ trợ → `LEFT JOIN ... UNION ... RIGHT JOIN`.
- `CROSS JOIN`: tích Descartes.
- `SELF JOIN`: bảng join với chính nó (nhân viên – quản lý).

```sql
-- Khách hàng chưa từng đặt hàng
SELECT c.* FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;
```

## [J] `WHERE` và `HAVING` khác nhau thế nào?

- `WHERE` lọc **dòng trước** khi `GROUP BY`, không dùng được hàm tổng hợp.
- `HAVING` lọc **nhóm sau** khi `GROUP BY`, dùng được `COUNT`, `SUM`…

Thứ tự thực thi logic: `FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT`.

```sql
SELECT customer_id, SUM(total) AS revenue
FROM orders
WHERE status = 'completed'
GROUP BY customer_id
HAVING revenue > 10000000
ORDER BY revenue DESC;
```

## [J] `DELETE`, `TRUNCATE`, `DROP` khác nhau thế nào?

| | DELETE | TRUNCATE | DROP |
|---|---|---|---|
| Xoá | Dòng (có WHERE) | Toàn bộ dòng | Cả bảng (cấu trúc + dữ liệu) |
| Rollback | Được (trong transaction) | Không (DDL, implicit commit) | Không |
| Trigger | Có | Không | Không |
| AUTO_INCREMENT | Giữ nguyên | Reset | — |
| Tốc độ | Chậm với bảng lớn | Nhanh | Nhanh |

## [J] Primary key, Foreign key, Unique key khác nhau?

- **Primary key**: định danh duy nhất, NOT NULL, mỗi bảng 1 PK. InnoDB lưu dữ liệu sắp xếp theo PK (clustered index).
- **Unique key**: giá trị không trùng, **cho phép NULL** (nhiều NULL), có thể nhiều unique key.
- **Foreign key**: tham chiếu PK bảng khác, đảm bảo toàn vẹn (`ON DELETE CASCADE / SET NULL / RESTRICT`).

## [J] `CHAR` vs `VARCHAR`, `DATETIME` vs `TIMESTAMP`, `FLOAT` vs `DECIMAL`?

- `CHAR(n)`: độ dài cố định (mã quốc gia, hash cố định). `VARCHAR(n)`: độ dài thay đổi.
- `DATETIME`: 1000–9999, không phụ thuộc timezone. `TIMESTAMP`: lưu UTC, tự đổi theo timezone session, giới hạn đến **2038**.
- **Tiền tệ phải dùng `DECIMAL(15,2)`** (hoặc lưu số nguyên đơn vị nhỏ nhất). `FLOAT/DOUBLE` sai số: `0.1 + 0.2 != 0.3`.
- Tiếng Việt / emoji: dùng charset **`utf8mb4`** (collation `utf8mb4_unicode_ci` / `utf8mb4_0900_ai_ci`), không dùng `utf8` (chỉ 3 byte).

## [J] `UNION` và `UNION ALL`?

- `UNION` gộp kết quả và **loại bỏ trùng** (tốn thêm sort/dedupe).
- `UNION ALL` giữ nguyên các dòng trùng → **nhanh hơn**. Dùng khi chắc chắn không trùng hoặc muốn giữ trùng.
- Các SELECT phải cùng số cột và kiểu tương thích.

## [J] Chuẩn hoá dữ liệu (1NF, 2NF, 3NF) là gì?

- **1NF**: mỗi ô một giá trị nguyên tử, không có nhóm lặp (không lưu `"tag1,tag2"` trong một cột).
- **2NF**: đạt 1NF + mọi cột không khoá phụ thuộc **toàn bộ** khoá chính (không phụ thuộc một phần khoá ghép).
- **3NF**: đạt 2NF + không có phụ thuộc bắc cầu (cột không khoá không phụ thuộc cột không khoá khác).
- **Denormalize** có chủ đích để tăng tốc đọc: lưu `orders.total`, `posts.comments_count`, snapshot giá/tên sản phẩm vào `order_items` (bắt buộc về nghiệp vụ: giá lúc mua).

## [M] Index là gì? Cách hoạt động? Khi nào nên/không nên đánh index?

- Index là cấu trúc dữ liệu (InnoDB: **B+Tree**) giúp tìm kiếm nhanh, giống mục lục sách: O(log n) thay vì quét toàn bảng.
- **Clustered index** (PK): lá chứa cả dòng dữ liệu. **Secondary index**: lá chứa giá trị cột + PK → phải tra lại PK (bookmark lookup) trừ khi là covering index.

Nên đánh index: cột trong `WHERE`, `JOIN`, `ORDER BY`, `GROUP BY`, foreign key, cột có độ chọn lọc cao (email, phone).
Không nên: bảng rất nhỏ, cột ít giá trị khác nhau (gender, boolean — trừ khi kết hợp composite), bảng ghi nhiều đọc ít (mỗi index làm chậm INSERT/UPDATE và tốn dung lượng).

## [M] Composite index và quy tắc leftmost prefix?

Index `(a, b, c)` dùng được cho: `a`, `a,b`, `a,b,c`, và `a = ? ORDER BY b`. **Không** dùng được cho `b` hoặc `c` đứng một mình.

- Cột so sánh **bằng** đặt trước, cột **range** (`>`, `BETWEEN`, `LIKE 'x%'`) đặt sau — sau cột range các cột tiếp theo không dùng để lọc được.
- Ví dụ query `WHERE user_id = ? AND status = ? ORDER BY created_at DESC` → index `(user_id, status, created_at)`.
- MySQL 8 có **skip scan** trong một số trường hợp, nhưng đừng dựa vào nó.

## [M] Những trường hợp index bị vô hiệu (không dùng được)?

- Dùng hàm/biểu thức trên cột: `WHERE YEAR(created_at) = 2025` → viết lại `created_at >= '2025-01-01' AND created_at < '2026-01-01'` (hoặc functional index MySQL 8).
- `LIKE '%abc'` (wildcard ở đầu) → dùng FULLTEXT / Elasticsearch.
- **Ép kiểu ngầm**: cột `phone VARCHAR` mà so sánh `WHERE phone = 0912345678` (số).
- Không theo leftmost prefix của composite index.
- `OR` giữa cột có index và không có index.
- Charset/collation khác nhau khi JOIN.
- Optimizer ước lượng quét bảng rẻ hơn (lấy quá nhiều % dòng).

## [M] Covering index là gì?

Index chứa **tất cả cột** query cần → MySQL đọc trực tiếp từ index, không phải tra về bảng. `EXPLAIN` hiển thị `Extra: Using index`.

```sql
-- index (user_id, status, total)
SELECT status, SUM(total) FROM orders WHERE user_id = 10 GROUP BY status;
```

Đây là một lý do không nên `SELECT *`.

## [M] Dùng `EXPLAIN` để phân tích query như thế nào?

Các cột quan trọng:
- `type`: tốt → xấu: `system`, `const`, `eq_ref`, `ref`, `range`, `index`, **`ALL`** (full table scan — cần xem lại).
- `possible_keys` / `key`: index có thể dùng / thực sự dùng.
- `rows`: số dòng ước tính phải quét.
- `filtered`: % dòng còn lại sau lọc.
- `Extra`: `Using index` (tốt), `Using where`, **`Using filesort`**, **`Using temporary`** (cần tối ưu).

MySQL 8: `EXPLAIN ANALYZE` chạy thật và cho thời gian thực tế. Kết hợp **slow query log** (`long_query_time = 1`) để tìm query chậm.

## [M] Transaction và ACID là gì?

Transaction là nhóm thao tác thực hiện **tất cả hoặc không gì cả**.

- **A**tomicity: toàn vẹn — lỗi thì rollback hết.
- **C**onsistency: dữ liệu luôn thoả các ràng buộc.
- **I**solation: các transaction đồng thời không ảnh hưởng nhau (theo mức isolation).
- **D**urability: đã commit thì không mất kể cả khi sập (redo log).

Ví dụ chuyển tiền: trừ tài khoản A và cộng tài khoản B phải nằm trong một transaction. Chỉ InnoDB hỗ trợ transaction (MyISAM không).

## [M] Các mức Isolation Level và hiện tượng Dirty read, Non-repeatable read, Phantom read?

| Isolation | Dirty read | Non-repeatable read | Phantom read |
|---|---|---|---|
| READ UNCOMMITTED | ✔ có | ✔ | ✔ |
| READ COMMITTED | ✘ | ✔ | ✔ |
| **REPEATABLE READ** (mặc định MySQL) | ✘ | ✘ | Hạn chế nhờ MVCC + gap lock |
| SERIALIZABLE | ✘ | ✘ | ✘ |

- **Dirty read**: đọc dữ liệu transaction khác chưa commit.
- **Non-repeatable read**: đọc 2 lần cùng một dòng ra giá trị khác (bị update xen giữa).
- **Phantom read**: đọc 2 lần cùng điều kiện ra số dòng khác (bị insert xen giữa).
- InnoDB dùng **MVCC** (multi-version) cho consistent read không khoá.

## [M] Lock trong MySQL: shared/exclusive lock, row/table lock, deadlock?

- **Shared lock** (`SELECT ... FOR SHARE`): nhiều transaction cùng đọc, cấm ghi.
- **Exclusive lock** (`SELECT ... FOR UPDATE`): chỉ một transaction giữ, cấm đọc-khoá và ghi.
- InnoDB khoá **theo dòng** (thực chất khoá trên index) — query không dùng index có thể khoá rất nhiều dòng. Có thêm gap lock, next-key lock.
- **Deadlock**: T1 giữ A chờ B, T2 giữ B chờ A. InnoDB tự phát hiện và rollback một bên (`Error 1213`).
- Giảm deadlock: transaction ngắn, khoá theo **thứ tự nhất quán**, có index phù hợp, retry khi gặp deadlock (`DB::transaction(..., 3)`). Xem `SHOW ENGINE INNODB STATUS`.

## [M] Optimistic locking và Pessimistic locking?

- **Pessimistic**: khoá trước khi sửa (`SELECT ... FOR UPDATE`). Phù hợp tranh chấp cao (trừ tồn kho flash sale, số dư ví).
- **Optimistic**: không khoá; khi update kiểm tra `version` chưa đổi: `UPDATE ... SET qty=?, version=version+1 WHERE id=? AND version=?`. Ảnh hưởng 0 dòng → có người sửa trước → báo lỗi/thử lại. Phù hợp tranh chấp thấp (sửa hồ sơ, CMS).

## [M] Phân trang dữ liệu lớn: OFFSET chậm thì xử lý thế nào?

`LIMIT 20 OFFSET 1000000` vẫn phải quét 1.000.020 dòng rồi bỏ đi.

- **Keyset/cursor pagination**: `WHERE id < :last_id ORDER BY id DESC LIMIT 20` → luôn nhanh. Laravel: `cursorPaginate()`.
- **Deferred join**: lấy id trước bằng covering index rồi join lại.
- Giới hạn số trang tối đa, dùng `simplePaginate()` (không `COUNT(*)`).
- `COUNT(*)` trên bảng lớn cũng chậm → cache tổng hoặc hiển thị ước lượng.

## [M] Tối ưu một query chậm, bạn làm những bước nào?

1. Xác định query qua slow query log / APM / Telescope.
2. `EXPLAIN` (`EXPLAIN ANALYZE`) xem có full scan, filesort, temporary.
3. Thêm/sửa **index** phù hợp (composite, covering), loại bỏ hàm trên cột.
4. Chỉ `SELECT` cột cần; tránh `SELECT *`.
5. Viết lại: subquery tương quan → JOIN, `OR` → `UNION ALL`, `IN` lớn → JOIN bảng tạm, phân trang keyset.
6. Giảm dữ liệu: archive dữ liệu cũ, **partition** theo thời gian.
7. Cache kết quả (Redis), bảng tổng hợp (summary table) cập nhật định kỳ cho báo cáo.
8. Đo lại.

## [M] Stored procedure, trigger, view: ưu nhược và có nên dùng?

- **View**: query lưu sẵn, đơn giản hoá truy vấn/phân quyền; không tăng tốc (MySQL không có materialized view).
- **Stored procedure**: logic chạy trong DB, giảm round-trip; khó version, khó test, khó debug, khó scale, lock-in DB.
- **Trigger**: tự chạy khi INSERT/UPDATE/DELETE; logic ẩn, khó lần lỗi.
- Ứng dụng Laravel hiện đại thường giữ logic ở tầng app; dùng DB cho ràng buộc toàn vẹn (FK, unique, check).

## [M] Window function (MySQL 8) là gì? Cho ví dụ.

Tính toán trên một "cửa sổ" dòng mà **không gộp** dòng như GROUP BY.

```sql
-- Top 3 sản phẩm bán chạy nhất mỗi danh mục
SELECT * FROM (
  SELECT p.category_id, p.name, SUM(oi.qty) AS sold,
         ROW_NUMBER() OVER (PARTITION BY p.category_id ORDER BY SUM(oi.qty) DESC) AS rn
  FROM order_items oi JOIN products p ON p.id = oi.product_id
  GROUP BY p.category_id, p.id, p.name
) t WHERE rn <= 3;
```

Hàm: `ROW_NUMBER`, `RANK`, `DENSE_RANK`, `LAG`, `LEAD`, `SUM() OVER` (luỹ kế). Ngoài ra MySQL 8 có **CTE** `WITH` (kể cả recursive — dùng cho cây danh mục).

## [M] InnoDB và MyISAM khác nhau thế nào?

| | InnoDB (mặc định) | MyISAM |
|---|---|---|
| Transaction | Có | Không |
| Lock | Row-level | Table-level |
| Foreign key | Có | Không |
| Crash recovery | Có (redo log) | Kém |
| Dùng khi | Hầu hết mọi trường hợp | Gần như không dùng nữa |

## [M] Thiết kế DB cho tính năng X (ví dụ: comment lồng nhau, tag, like) — bạn làm thế nào?

- **Tag n-n**: `tags`, `post_tag(post_id, tag_id)` PK ghép + index ngược `(tag_id, post_id)`.
- **Like**: bảng `likes(user_id, likeable_id, likeable_type)` unique 3 cột + cột đếm `likes_count` denormalize.
- **Comment/danh mục dạng cây**: `parent_id` (adjacency list, dùng recursive CTE), hoặc **nested set** (`_lft`, `_rgt` – package `kalnoy/nestedset`) đọc nhanh ghi chậm, hoặc **materialized path** (`1/5/12/`).
- Luôn hỏi lại: tỷ lệ đọc/ghi, khối lượng dữ liệu, query nào chạy nhiều nhất → quyết định index/denormalize.

## [S] Replication, Read/Write splitting và Sharding?

- **Replication** (Primary – Replica): replica nhận binlog từ primary. Dùng để scale **đọc**, backup, failover.
- **Replication lag**: vừa ghi xong đọc ở replica có thể chưa thấy. Laravel cấu hình `read`/`write` + `'sticky' => true` (request đã ghi thì đọc tiếp từ primary).
- **Partitioning**: chia một bảng thành nhiều phần vật lý trên cùng server (theo RANGE ngày tháng) → xoá dữ liệu cũ nhanh, query lọc theo partition.
- **Sharding**: chia dữ liệu sang **nhiều server** theo shard key (user_id). Scale ghi tốt, nhưng JOIN/transaction xuyên shard rất khó. Chỉ làm khi thật sự cần (Vitess, PlanetScale).

## [S] Thay đổi schema bảng hàng chục triệu dòng trên production mà không downtime?

- MySQL 8 nhiều thao tác `ALTER` là **INSTANT/INPLACE** (thêm cột cuối bảng là INSTANT) → kiểm tra `ALGORITHM=INSTANT`.
- Công cụ online schema change: **gh-ost**, **pt-online-schema-change** (tạo bảng mới, copy dần, đồng bộ, đổi tên).
- Chiến lược **expand/contract**: thêm cột mới (nullable) → code ghi cả 2 → backfill theo batch → chuyển đọc sang cột mới → xoá cột cũ ở release sau.
- Tạo index trên bảng lớn vào giờ thấp điểm, theo dõi replication lag.

## [S] Redis dùng để làm gì? Các kiểu dữ liệu?

- Dùng cho: cache, **session**, **queue**, rate limit, distributed lock, leaderboard, đếm view, pub/sub, lưu OTP có TTL.
- Kiểu dữ liệu: String, Hash, List, Set, **Sorted Set** (bảng xếp hạng), Stream, Bitmap, HyperLogLog (đếm unique gần đúng), Geo.
- Persistence: RDB (snapshot), AOF (log ghi). Eviction policy (`allkeys-lru`) khi đầy RAM.
- Redis đơn luồng xử lý lệnh → các lệnh là **atomic** (`INCR`, `SETNX`), tránh lệnh O(n) như `KEYS *` trên production (dùng `SCAN`).

## [S] SQL vs NoSQL: khi nào chọn cái nào?

- **SQL (MySQL, PostgreSQL)**: dữ liệu có quan hệ, cần transaction/ACID, truy vấn linh hoạt, báo cáo. Ví dụ: đơn hàng, thanh toán, kế toán.
- **NoSQL**: schema linh hoạt, scale ngang dễ, throughput lớn.
  - Document (MongoDB): nội dung linh hoạt, catalog nhiều thuộc tính.
  - Key-value (Redis): cache, session.
  - Search (Elasticsearch/OpenSearch, Meilisearch): full-text search, lọc facet.
  - Time-series, wide-column (Cassandra): log, IoT.
- Thực tế thường kết hợp: MySQL làm nguồn chính + Redis cache + Elasticsearch tìm kiếm (đồng bộ qua queue/CDC). MySQL 8 cũng có kiểu `JSON` cho dữ liệu bán cấu trúc.
