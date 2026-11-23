<?php

declare(strict_types=1);

require __DIR__ . '/src/QuestionBank.php';

try {
    $bank = (new QuestionBank(__DIR__ . '/data'))->load();
} catch (Throwable $e) {
    http_response_code(500);
    echo '<pre>Lỗi đọc dữ liệu: ' . htmlspecialchars($e->getMessage()) . '</pre>';
    exit;
}

$json = json_encode($bank, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_THROW_ON_ERROR);
$ver = substr(md5_file(__DIR__ . '/assets/app.js') . md5_file(__DIR__ . '/assets/app.css'), 0, 10);
?>
<!doctype html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>PV PHP Fullstack</title>
    <meta name="description" content="Ôn phỏng vấn PHP Fullstack: PHP, Laravel, MySQL, HTML/CSS, JS, DevOps, nghiệp vụ, HR — flashcard, phỏng vấn thử, trắc nghiệm.">
    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#171a23" media="(prefers-color-scheme: dark)">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="PV PHP">
    <meta name="format-detection" content="telephone=no">
    <link rel="manifest" href="manifest.webmanifest">
    <link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="192x192" href="assets/icons/icon-192.png">
    <link rel="stylesheet" href="assets/app.css?v=<?= $ver ?>">
    <script>
        try { const t = localStorage.getItem('ipv-theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
    </script>
</head>
<body>
<header class="topbar">
    <button class="icon-btn menu-btn" id="menuBtn" aria-label="Mở menu">☰</button>
    <a href="#/" class="brand">🎯 <span>PV PHP Fullstack</span></a>
    <form class="search" id="searchForm" role="search">
        <input type="search" id="searchInput" placeholder="Tìm câu hỏi…" autocomplete="off" enterkeyhint="search">
    </form>
    <button class="icon-btn" id="themeBtn" title="Đổi giao diện sáng/tối" aria-label="Đổi giao diện">🌓</button>
</header>
<div class="layout">
    <nav class="sidebar" id="sidebar"></nav>
    <main id="app" class="main" tabindex="-1"></main>
</div>
<div class="backdrop" id="backdrop"></div>

<nav class="tabbar" id="tabbar" aria-label="Điều hướng nhanh">
    <a href="#/" data-tab=""><span>🏠</span>Trang chủ</a>
    <a href="#/flash" data-tab="flash"><span>🃏</span>Flashcard</a>
    <a href="#/mock" data-tab="mock"><span>🎤</span>PV thử</a>
    <a href="#/quiz" data-tab="quiz"><span>✅</span>Trắc nghiệm</a>
    <button type="button" id="tabMenu" data-tab="menu"><span>📚</span>Chủ đề</button>
</nav>

<script id="bank" type="application/json"><?= $json ?></script>
<script src="assets/app.js?v=<?= $ver ?>"></script>
<script>
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
        window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
    }
</script>
</body>
</html>
