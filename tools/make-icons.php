<?php

/**
 * Tạo icon PNG cho PWA / iPhone "Thêm vào MH chính".
 * Chạy 1 lần: php tools/make-icons.php  (cần extension gd + font TTF đậm)
 */

declare(strict_types=1);

$font = $argv[1] ?? 'C:/Windows/Fonts/segoeuib.ttf';
if (!is_file($font)) {
    exit("Không tìm thấy font: $font\n");
}
$out = dirname(__DIR__) . '/assets/icons';
@mkdir($out, 0777, true);

// [kích thước, bo góc?, padding an toàn cho maskable]
$specs = [
    'apple-touch-icon.png' => [180, false, 0.0],
    'icon-192.png' => [192, true, 0.0],
    'icon-512.png' => [512, true, 0.0],
    'icon-maskable-512.png' => [512, false, 0.12],
];

foreach ($specs as $name => [$size, $rounded, $pad]) {
    $s = 4; // vẽ to rồi thu nhỏ cho mịn
    $S = $size * $s;
    $img = imagecreatetruecolor($S, $S);
    imagesavealpha($img, true);
    imagefill($img, 0, 0, imagecolorallocatealpha($img, 0, 0, 0, 127));

    // nền gradient chéo indigo -> violet
    for ($y = 0; $y < $S; $y++) {
        $t = $y / $S;
        $c = imagecolorallocate($img, (int) (79 + (124 - 79) * $t), (int) (70 + (58 - 70) * $t), (int) (229 + (237 - 229) * $t));
        imageline($img, 0, $y, $S, $y, $c);
    }

    if ($rounded) {
        $r = (int) ($S * 0.22);
        $clear = imagecolorallocatealpha($img, 0, 0, 0, 127);
        imagealphablending($img, false);
        for ($y = 0; $y < $r; $y++) {
            for ($x = 0; $x < $r; $x++) {
                if (($r - $x) ** 2 + ($r - $y) ** 2 > $r ** 2) {
                    foreach ([[$x, $y], [$S - 1 - $x, $y], [$x, $S - 1 - $y], [$S - 1 - $x, $S - 1 - $y]] as [$px, $py]) {
                        imagesetpixel($img, $px, $py, $clear);
                    }
                }
            }
        }
        imagealphablending($img, true);
    }

    $white = imagecolorallocate($img, 255, 255, 255);
    $soft = imagecolorallocatealpha($img, 255, 255, 255, 70);
    $inner = $S * (1 - 2 * $pad);

    // chữ "PV"
    $fs = $inner * 0.36;
    $box = imagettfbbox($fs, 0, $font, 'PV');
    $tw = $box[2] - $box[0];
    imagettftext($img, $fs, 0, (int) (($S - $tw) / 2 - $box[0]), (int) ($S * 0.56), $white, $font, 'PV');

    // chữ "PHP" nhỏ bên dưới
    $fs2 = $inner * 0.12;
    $box2 = imagettfbbox($fs2, 0, $font, 'PHP');
    $tw2 = $box2[2] - $box2[0];
    imagettftext($img, $fs2, 0, (int) (($S - $tw2) / 2 - $box2[0]), (int) ($S * 0.76), $soft, $font, 'PHP');

    $final = imagecreatetruecolor($size, $size);
    imagesavealpha($final, true);
    imagefill($final, 0, 0, imagecolorallocatealpha($final, 0, 0, 0, 127));
    imagecopyresampled($final, $img, 0, 0, 0, 0, $size, $size, $S, $S);
    imagepng($final, "$out/$name");
    echo "✔ $name\n";
}
