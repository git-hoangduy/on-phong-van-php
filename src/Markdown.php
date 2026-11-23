<?php

declare(strict_types=1);

/**
 * Bộ chuyển Markdown -> HTML tối giản, đủ dùng cho ngân hàng câu hỏi.
 * Hỗ trợ: code fence, heading ###, bảng, blockquote, list (lồng 1 cấp), **bold**, *italic*, `code`, [link](url).
 */
final class Markdown
{
    public static function toHtml(string $md): string
    {
        $lines = preg_split('/\R/', $md) ?: [];
        $n = count($lines);
        $out = [];
        $i = 0;

        while ($i < $n) {
            $line = $lines[$i];

            // Code fence
            if (preg_match('/^\s*```([\w+-]*)\s*$/', $line, $m)) {
                $lang = $m[1] !== '' ? $m[1] : 'text';
                $buf = [];
                $i++;
                while ($i < $n && !preg_match('/^\s*```\s*$/', $lines[$i])) {
                    $buf[] = $lines[$i];
                    $i++;
                }
                $i++;
                $out[] = '<pre data-lang="' . self::e($lang) . '"><code>' . self::e(implode("\n", $buf)) . '</code></pre>';
                continue;
            }

            if (trim($line) === '') {
                $i++;
                continue;
            }

            // Heading
            if (preg_match('/^(#{3,6})\s+(.+)$/', $line, $m)) {
                $lvl = strlen($m[1]);
                $out[] = "<h{$lvl}>" . self::inline($m[2]) . "</h{$lvl}>";
                $i++;
                continue;
            }

            // Table
            if (self::isTableRow($line) && $i + 1 < $n && preg_match('/^\s*\|?\s*:?-{3,}/', $lines[$i + 1])) {
                $head = self::cells($line);
                $i += 2;
                $rows = [];
                while ($i < $n && self::isTableRow($lines[$i])) {
                    $rows[] = self::cells($lines[$i]);
                    $i++;
                }
                $html = '<div class="table-wrap"><table><thead><tr>';
                foreach ($head as $c) {
                    $html .= '<th>' . self::inline($c) . '</th>';
                }
                $html .= '</tr></thead><tbody>';
                foreach ($rows as $r) {
                    $html .= '<tr>';
                    foreach ($r as $c) {
                        $html .= '<td>' . self::inline($c) . '</td>';
                    }
                    $html .= '</tr>';
                }
                $out[] = $html . '</tbody></table></div>';
                continue;
            }

            // Blockquote
            if (preg_match('/^\s*>/', $line)) {
                $buf = [];
                while ($i < $n && preg_match('/^\s*>\s?(.*)$/', $lines[$i], $m)) {
                    $buf[] = $m[1];
                    $i++;
                }
                $out[] = '<blockquote>' . self::toHtml(implode("\n", $buf)) . '</blockquote>';
                continue;
            }

            // List
            if (preg_match('/^(\s*)([-*]|\d+\.)\s+/', $line, $m)) {
                $ordered = ctype_digit(rtrim($m[2], '.'));
                $baseIndent = strlen($m[1]);
                $items = [];
                while ($i < $n) {
                    $l = $lines[$i];
                    if (preg_match('/^(\s*)([-*]|\d+\.)\s+(.*)$/', $l, $mm)) {
                        $indent = strlen($mm[1]);
                        if ($indent > $baseIndent) {
                            $items[count($items) - 1]['sub'][] = $mm[3];
                        } else {
                            $items[] = ['text' => $mm[3], 'sub' => []];
                        }
                        $i++;
                    } elseif (trim($l) !== '' && preg_match('/^\s{2,}\S/', $l) && $items) {
                        // dòng tiếp nối của item
                        $last = count($items) - 1;
                        if ($items[$last]['sub']) {
                            $items[$last]['sub'][count($items[$last]['sub']) - 1] .= ' ' . trim($l);
                        } else {
                            $items[$last]['text'] .= ' ' . trim($l);
                        }
                        $i++;
                    } else {
                        break;
                    }
                }
                $tag = $ordered ? 'ol' : 'ul';
                $html = "<{$tag}>";
                foreach ($items as $it) {
                    $text = preg_replace(['/^\[ \]\s*/', '/^\[x\]\s*/i'], ['☐ ', '☑ '], $it['text']) ?? $it['text'];
                    $html .= '<li>' . self::inline($text);
                    if ($it['sub']) {
                        $html .= '<ul>';
                        foreach ($it['sub'] as $s) {
                            $html .= '<li>' . self::inline($s) . '</li>';
                        }
                        $html .= '</ul>';
                    }
                    $html .= '</li>';
                }
                $out[] = $html . "</{$tag}>";
                continue;
            }

            // Paragraph
            $buf = [];
            while ($i < $n && trim($lines[$i]) !== '' && !self::isBlockStart($lines[$i])) {
                $buf[] = trim($lines[$i]);
                $i++;
            }
            if ($buf) {
                $out[] = '<p>' . self::inline(implode(' ', $buf)) . '</p>';
            } else {
                $i++;
            }
        }

        return implode("\n", $out);
    }

    public static function inline(string $text): string
    {
        $codes = [];
        $text = preg_replace_callback('/`([^`]+)`/', function ($m) use (&$codes) {
            $codes[] = '<code>' . self::e($m[1]) . '</code>';
            return "\x00" . (count($codes) - 1) . "\x00";
        }, $text) ?? $text;

        $text = self::e($text);
        $text = preg_replace('/\*\*(.+?)\*\*/', '<strong>$1</strong>', $text) ?? $text;
        $text = preg_replace('/(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])/', '<em>$1</em>', $text) ?? $text;
        $text = preg_replace(
            '/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/',
            '<a href="$2" target="_blank" rel="noopener">$1</a>',
            $text
        ) ?? $text;

        return preg_replace_callback('/\x00(\d+)\x00/', fn ($m) => $codes[(int) $m[1]], $text) ?? $text;
    }

    private static function isBlockStart(string $line): bool
    {
        return (bool) preg_match('/^\s*(```|#{3,6}\s|>|([-*]|\d+\.)\s+)/', $line) || self::isTableRow($line);
    }

    private static function isTableRow(string $line): bool
    {
        $t = trim($line);
        return $t !== '' && $t[0] === '|';
    }

    /** @return list<string> */
    private static function cells(string $line): array
    {
        $t = trim(trim($line), '|');
        // cho phép \| bên trong ô
        $parts = preg_split('/(?<!\\\\)\|/', $t) ?: [];
        return array_map(fn ($c) => str_replace('\|', '|', trim($c)), $parts);
    }

    public static function e(string $s): string
    {
        return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}
