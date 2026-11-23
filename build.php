<?php

/**
 * Build bản tĩnh để deploy GitHub Pages (hoặc bất kỳ static hosting nào).
 *   php build.php            -> xuất ra thư mục dist/
 *   php build.php docs       -> xuất ra thư mục docs/
 */

declare(strict_types=1);

$root = __DIR__;
$out = $root . '/' . ($argv[1] ?? 'dist');

// Xoá build cũ
if (is_dir($out)) {
    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($out, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($it as $f) {
        $f->isDir() ? rmdir($f->getPathname()) : unlink($f->getPathname());
    }
}
@mkdir($out, 0777, true);

// 1. Render index.php -> index.html
ob_start();
include $root . '/index.php';
$html = ob_get_clean();
file_put_contents("$out/index.html", $html);

// 2. Copy file tĩnh
function copyItem(string $src, string $dst): void
{
    if (is_dir($src)) {
        foreach (array_diff(scandir($src), ['.', '..']) as $f) {
            copyItem("$src/$f", "$dst/$f");
        }
        return;
    }
    @mkdir(dirname($dst), 0777, true);
    copy($src, $dst);
}

foreach (['assets', 'manifest.webmanifest', 'sw.js'] as $item) {
    copyItem("$root/$item", "$out/$item");
}

// 3. Tắt Jekyll trên GitHub Pages; đổi tên cache SW theo bản build để cập nhật ngay
touch("$out/.nojekyll");
$sw = file_get_contents("$out/sw.js");
file_put_contents("$out/sw.js", str_replace("'pv-php-v1'", "'pv-php-" . substr(md5($html), 0, 8) . "'", $sw));

$kb = round(strlen($html) / 1024);
echo "✔ Build xong: $out (index.html {$kb} KB)\n";
