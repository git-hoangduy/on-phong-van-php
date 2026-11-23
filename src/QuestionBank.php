<?php

declare(strict_types=1);

require_once __DIR__ . '/Markdown.php';

/**
 * Đọc toàn bộ data/*.md (câu hỏi + hướng dẫn) và data/quiz/*.json (trắc nghiệm).
 *
 * File câu hỏi:
 *   ---
 *   key: php
 *   title: PHP Core
 *   icon: 🐘
 *   group: Kỹ thuật
 *   desc: Mô tả ngắn
 *   ---
 *   ## [J] Câu hỏi ...      (J = Junior, M = Middle, S = Senior)
 *   Câu trả lời dạng Markdown...
 *
 * File có `type: guide` sẽ được hiển thị như một trang tài liệu (không tách câu hỏi).
 */
final class QuestionBank
{
    private const LEVELS = ['J' => 'junior', 'M' => 'middle', 'S' => 'senior'];

    public function __construct(private readonly string $dataDir)
    {
    }

    /** @return array{categories: list<array>, guides: list<array>, quiz: list<array>, stats: array} */
    public function load(): array
    {
        $categories = [];
        $guides = [];

        foreach (glob($this->dataDir . '/*.md') ?: [] as $file) {
            [$meta, $body] = $this->splitFrontMatter((string) file_get_contents($file));
            $key = $meta['key'] ?? pathinfo($file, PATHINFO_FILENAME);
            $base = [
                'key' => $key,
                'title' => $meta['title'] ?? $key,
                'icon' => $meta['icon'] ?? '📘',
                'desc' => $meta['desc'] ?? '',
                'group' => $meta['group'] ?? 'Khác',
                'order' => (int) ($meta['order'] ?? 99),
            ];

            if (($meta['type'] ?? '') === 'guide') {
                $guides[] = $base + ['html' => Markdown::toHtml($body)];
                continue;
            }

            $categories[] = $base + ['questions' => $this->parseQuestions($key, $body)];
        }

        usort($categories, fn ($a, $b) => [$a['order'], $a['title']] <=> [$b['order'], $b['title']]);
        usort($guides, fn ($a, $b) => [$a['order'], $a['title']] <=> [$b['order'], $b['title']]);

        $quiz = [];
        foreach (glob($this->dataDir . '/quiz/*.json') ?: [] as $file) {
            $items = json_decode((string) file_get_contents($file), true);
            if (!is_array($items)) {
                throw new RuntimeException('JSON không hợp lệ: ' . basename($file) . ' — ' . json_last_error_msg());
            }
            $cat = pathinfo($file, PATHINFO_FILENAME);
            foreach ($items as $idx => $item) {
                $quiz[] = [
                    'id' => $cat . '-' . $idx,
                    'cat' => $cat,
                    'q' => Markdown::inline($item['q']),
                    'options' => array_map([Markdown::class, 'inline'], $item['options']),
                    'answer' => (int) $item['answer'],
                    'explain' => Markdown::inline($item['explain'] ?? ''),
                ];
            }
        }

        $total = array_sum(array_map(fn ($c) => count($c['questions']), $categories));

        return [
            'categories' => $categories,
            'guides' => $guides,
            'quiz' => $quiz,
            'stats' => ['questions' => $total, 'quiz' => count($quiz)],
        ];
    }

    /** @return array{0: array<string,string>, 1: string} */
    private function splitFrontMatter(string $raw): array
    {
        $raw = preg_replace('/^\xEF\xBB\xBF/', '', $raw) ?? $raw;
        if (!preg_match('/^---\R(.*?)\R---\R(.*)$/s', $raw, $m)) {
            return [[], $raw];
        }
        $meta = [];
        foreach (preg_split('/\R/', $m[1]) ?: [] as $line) {
            if (preg_match('/^(\w+)\s*:\s*(.*)$/', $line, $mm)) {
                $meta[$mm[1]] = trim($mm[2]);
            }
        }
        return [$meta, $m[2]];
    }

    /** @return list<array> */
    private function parseQuestions(string $key, string $body): array
    {
        $chunks = preg_split('/^## /m', $body) ?: [];
        array_shift($chunks); // phần trước câu hỏi đầu tiên
        $questions = [];
        $seen = [];

        foreach ($chunks as $chunk) {
            [$heading, $answer] = array_pad(explode("\n", $chunk, 2), 2, '');
            $heading = trim($heading);
            $level = 'middle';
            if (preg_match('/^\[([JMS])\]\s*(.+)$/u', $heading, $m)) {
                $level = self::LEVELS[$m[1]];
                $heading = $m[2];
            }
            $id = $key . '-' . substr(md5($heading), 0, 8);
            if (isset($seen[$id])) {
                $id .= '-' . count($questions);
            }
            $seen[$id] = true;

            $questions[] = [
                'id' => $id,
                'q' => Markdown::inline($heading),
                'level' => $level,
                'html' => Markdown::toHtml(trim($answer)),
            ];
        }

        return $questions;
    }
}
