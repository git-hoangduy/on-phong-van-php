---
key: devops
title: DevOps & Công cụ
icon: 🚀
group: DevOps & Kiến trúc
order: 9
desc: Git, Linux, Nginx, Docker, CI/CD, deploy Laravel, zero-downtime, monitoring, cloud cơ bản.
---

## [J] `git merge` và `git rebase` khác nhau thế nào?

- **merge**: tạo **merge commit**, giữ nguyên lịch sử thật, an toàn với nhánh dùng chung.
- **rebase**: "dời" các commit của bạn lên đầu nhánh đích → lịch sử **thẳng**, đẹp; nhưng **viết lại hash commit**.
- Quy tắc vàng: **không rebase nhánh đã push mà người khác đang dùng**. Rebase nhánh feature cá nhân trước khi tạo PR; `git pull --rebase` để tránh merge commit thừa.
- Squash merge: gộp mọi commit của PR thành 1.

## [J] Các lệnh Git hay dùng và xử lý conflict?

- `git status`, `add`, `commit`, `push`, `pull`, `fetch`, `checkout -b` / `switch -c`, `branch`, `log --oneline --graph`, `diff`, `stash`, `cherry-pick`.
- Conflict: `git pull`/`merge` → mở file, xử lý phần giữa `<<<<<<<`, `=======`, `>>>>>>>` → test lại → `git add` → `git commit` (hoặc `git rebase --continue`). Khi không chắc: trao đổi với người viết đoạn code kia.

## [J] `git reset`, `git revert`, `git restore` khác nhau?

- `git revert <commit>`: tạo **commit mới đảo ngược** commit cũ → an toàn cho nhánh đã push (main).
- `git reset --soft/--mixed/--hard <commit>`: di chuyển HEAD về commit cũ (soft giữ thay đổi đã stage, mixed giữ trong working dir, **hard xoá luôn**). Chỉ dùng trên nhánh local.
- `git restore <file>`: bỏ thay đổi chưa commit của file.
- Lỡ tay: `git reflog` để tìm lại commit.

## [J] Git flow / quy trình làm việc nhóm bạn đã dùng?

- **Git Flow**: `main`, `develop`, `feature/*`, `release/*`, `hotfix/*` — phù hợp release theo đợt.
- **GitHub Flow / Trunk-based**: nhánh ngắn từ `main`, PR + code review + CI xanh → merge → deploy liên tục.
- Quy ước commit: **Conventional Commits** (`feat:`, `fix:`, `refactor:`), PR nhỏ, có mô tả + link ticket Jira/Backlog.

## [J] Các lệnh Linux cơ bản hay dùng khi làm việc với server?

- File: `ls -la`, `cd`, `cp`, `mv`, `rm -rf`, `mkdir -p`, `find . -name "*.log"`, `du -sh *`, `df -h`.
- Xem: `cat`, `less`, **`tail -f storage/logs/laravel.log`**, `grep -rn "error"`, `head`.
- Quyền: `chmod 755`, `chown -R www-data:www-data storage bootstrap/cache`.
- Process: `ps aux | grep php`, `top`/`htop`, `kill -9`, `systemctl status|restart nginx php8.4-fpm`, `journalctl -u nginx`.
- Mạng: `curl -I`, `ss -tlnp` / `netstat`, `ping`, `ssh`, `scp`, `rsync`.
- Khác: `crontab -e`, `free -m`, `uptime`.

## [J] Quyền file trên Linux: `755`, `644` nghĩa là gì?

3 nhóm: **owner – group – others**; `r=4, w=2, x=1`.
- `755` = owner rwx, group r-x, others r-x → thư mục, script.
- `644` = owner rw-, others r-- → file thông thường.
- Laravel: `storage/` và `bootstrap/cache/` cần ghi được bởi user chạy PHP-FPM (`www-data`). **Không bao giờ `chmod 777`**.

## [M] Nginx đóng vai trò gì? Cấu hình cơ bản cho Laravel?

Nginx: web server, **reverse proxy**, phục vụ file tĩnh rất nhanh, load balancer, SSL termination, gzip, cache.

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/app/current/public;   # trỏ vào public/, không phải gốc project
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* { deny all; }   # chặn .env, .git
}
```

So với Apache: Nginx event-driven, ít RAM, xử lý nhiều kết nối đồng thời tốt hơn; Apache có `.htaccess` linh hoạt (Laravel có sẵn `public/.htaccess`).

## [M] Docker là gì? Image, container, volume, network?

- **Image**: bản mẫu chỉ đọc (OS + runtime + code), build từ `Dockerfile`, gồm nhiều layer.
- **Container**: instance đang chạy của image, cô lập process.
- **Volume**: lưu dữ liệu bền vững ngoài vòng đời container (MySQL data).
- **Network**: các container gọi nhau bằng tên service (`DB_HOST=mysql`).
- **Docker Compose**: định nghĩa nhiều service (app, nginx, mysql, redis, queue) trong `compose.yaml`. Laravel có **Sail**.

Lợi ích: môi trường đồng nhất dev/staging/prod ("chạy trên máy em được mà"), onboard nhanh, dễ scale.
So với VM: container dùng chung kernel host → nhẹ, khởi động nhanh.

## [M] Viết Dockerfile cho ứng dụng Laravel cần chú ý gì?

```dockerfile
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --prefer-dist --no-interaction

FROM node:22-alpine AS assets
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM php:8.4-fpm-alpine
RUN docker-php-ext-install pdo_mysql opcache bcmath
WORKDIR /var/www/html
COPY . .
COPY --from=vendor /app/vendor ./vendor
COPY --from=assets /app/public/build ./public/build
RUN composer dump-autoload --optimize --no-dev \
 && chown -R www-data:www-data storage bootstrap/cache
USER www-data
```

- **Multi-stage build** → image nhỏ, không chứa node/composer.
- Copy `composer.json/lock` trước để tận dụng **layer cache**.
- `.dockerignore` (`vendor`, `node_modules`, `.env`, `.git`).
- Không đưa `.env`/secret vào image; truyền qua biến môi trường.
- Chạy user không phải root; 1 process/container (php-fpm, nginx, queue worker tách riêng).

## [M] CI/CD là gì? Pipeline của bạn gồm những bước nào?

- **CI** (Continuous Integration): mỗi push/PR tự động build + test.
- **CD** (Continuous Delivery/Deployment): tự động đưa lên staging/production.

Pipeline điển hình (GitHub Actions / GitLab CI):
1. Checkout, cache Composer/npm.
2. `composer install`, `npm ci && npm run build`.
3. Lint: **Pint**, PHPStan/Larastan, ESLint.
4. Test: `php artisan test` (MySQL/Redis service container).
5. Security: `composer audit`.
6. Build Docker image → push registry.
7. Deploy staging → smoke test → (duyệt) → deploy production.
8. Thông báo Slack/Teams.

## [M] Quy trình deploy một ứng dụng Laravel lên production?

```bash
git pull origin main            # hoặc nhận artifact/image từ CI
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan migrate --force
php artisan optimize           # config, route, view, event cache
php artisan storage:link
php artisan queue:restart      # worker nạp code mới
sudo systemctl reload php8.4-fpm   # reset OPcache
```

Công cụ: **Laravel Forge**, Laravel Cloud, Envoyer, Deployer, Ploi, hoặc pipeline CI + Docker/Kubernetes.
Server cần: Nginx, PHP-FPM, MySQL, Redis, **Supervisor** (queue worker), cron cho scheduler, SSL, backup DB định kỳ, firewall (ufw), SSH key thay vì mật khẩu.

## [M] Zero-downtime deployment là gì? Thực hiện thế nào?

Triển khai mà người dùng không bị gián đoạn.
- **Symlink release** (Envoyer/Deployer): build vào `releases/20251123_1030`, chia sẻ `storage` và `.env`, xong chuyển symlink `current` → release mới (atomic), reload FPM. Rollback = trỏ symlink về release cũ.
- **Blue-Green**: 2 môi trường, chuyển traffic sang bản mới.
- **Rolling update** (Kubernetes): thay dần từng pod, có health check.
- Lưu ý **migration tương thích ngược** (expand/contract): code cũ và mới phải chạy được với schema mới trong lúc chuyển.

## [M] Supervisor dùng để làm gì trong Laravel?

Giữ các process chạy liên tục và tự khởi động lại khi chết: `queue:work`, `horizon`, `reverb:start`, `octane:start`.

```ini
[program:laravel-worker]
command=php /var/www/app/current/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
numprocs=4
autostart=true
autorestart=true
user=www-data
stopwaitsecs=3600
```

## [M] Load balancer là gì? Khi chạy nhiều server Laravel cần lưu ý gì?

Load balancer (Nginx, HAProxy, AWS ALB) phân phối request đến nhiều server (round-robin, least connections, IP hash), health check, SSL termination.

Ứng dụng phải **stateless**:
- Session, cache, lock → **Redis** dùng chung (không dùng `file`).
- File upload → **S3**/object storage thay vì đĩa local.
- Scheduler → `onOneServer()`.
- Cấu hình **TrustProxies** để lấy đúng IP client và https.

## [M] Monitoring và logging trên production?

- **Log**: Laravel log channel (daily, stack, stderr cho container), tập trung bằng ELK/OpenSearch, Grafana Loki, CloudWatch. Log có context (user_id, request_id), không log dữ liệu nhạy cảm.
- **Error tracking**: Sentry, Flare, Bugsnag, Laravel Nightwatch.
- **Metrics/APM**: Prometheus + Grafana, New Relic, Datadog, Laravel Pulse.
- **Uptime**: UptimeRobot, Better Stack. Cảnh báo qua Slack/Telegram.
- Các chỉ số chính: error rate, latency p95/p99, throughput, CPU/RAM, queue backlog, slow query.

## [M] Cloud cơ bản: bạn đã dùng dịch vụ AWS nào?

- **EC2** (máy ảo), **RDS** (MySQL quản lý sẵn), **ElastiCache** (Redis), **S3** (lưu file) + **CloudFront** (CDN), **SQS** (queue), **SES** (email), **Route 53** (DNS), **ALB** (load balancer), **IAM** (phân quyền), **CloudWatch** (log/metric).
- Ở Việt Nam cũng hay gặp: VPS (Vultr, DigitalOcean, BizFly, Viettel IDC), Cloudflare (DNS, CDN, chống DDoS).
- Trả lời trung thực mức độ đã dùng; nói được kiến trúc deploy dự án gần nhất là đủ ăn điểm.

## [S] Kubernetes là gì? Khi nào cần?

Hệ thống điều phối container: tự scale (HPA), tự phục hồi, rolling update, service discovery, quản lý config/secret.
Khái niệm: Pod, Deployment, Service, Ingress, ConfigMap, Secret, HPA, Namespace.
Không phải dự án nào cũng cần: với team nhỏ, VPS + Forge/Docker Compose hoặc PaaS (Laravel Cloud) rẻ và đơn giản hơn nhiều.

## [S] Backup và Disaster Recovery cho hệ thống?

- Backup DB tự động hằng ngày (mysqldump/xtrabackup, snapshot RDS), binlog cho point-in-time recovery; lưu **ở nơi khác** (S3 khác region). Package `spatie/laravel-backup`.
- **Kiểm tra restore định kỳ** — backup chưa từng restore thử coi như không có.
- Xác định **RPO** (mất tối đa bao nhiêu dữ liệu) và **RTO** (khôi phục trong bao lâu).
- Infrastructure as Code (Terraform/Ansible) để dựng lại hạ tầng nhanh.
