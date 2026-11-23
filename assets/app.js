(() => {
    'use strict';

    // ================== DATA ==================
    const BANK = JSON.parse(document.getElementById('bank').textContent);
    const CATS = BANK.categories;
    const CAT = Object.fromEntries(CATS.map(c => [c.key, c]));
    const ALL = [];
    const BY_ID = {};
    CATS.forEach(c => c.questions.forEach(q => { q.cat = c.key; ALL.push(q); BY_ID[q.id] = q; }));

    const LEVELS = { junior: 'Junior', middle: 'Middle', senior: 'Senior' };
    const STATUS = { known: 'Đã thuộc', unsure: 'Chưa chắc', unknown: 'Chưa biết' };

    // ================== STORAGE ==================
    const KEY = 'ipv-v1';
    let DB = { status: {}, star: {}, quizBest: {}, mockHistory: [] };
    try { Object.assign(DB, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { /* ignore */ }
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { /* ignore */ } };
    const statusOf = id => DB.status[id] || '';
    const setStatus = (id, s) => {
        if (s) DB.status[id] = s; else delete DB.status[id];
        save();
        renderSidebar();
    };
    const toggleStar = id => {
        if (DB.star[id]) delete DB.star[id]; else DB.star[id] = 1;
        save();
        return !!DB.star[id];
    };

    // ================== HELPERS ==================
    const $ = (s, r = document) => r.querySelector(s);
    const app = $('#app');
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const plain = html => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent || ''; };
    const fold = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
    const searchText = q => (q._s ??= fold(plain(q.q) + ' ' + plain(q.html)));
    const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
    const fmtTime = sec => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

    function counts(list) {
        const c = { known: 0, unsure: 0, unknown: 0, total: list.length };
        list.forEach(q => { const s = statusOf(q.id); if (s) c[s]++; });
        c.todo = c.total - c.known - c.unsure - c.unknown;
        return c;
    }

    const bar = c => `<div class="bar" title="${c.known} thuộc · ${c.unsure} chưa chắc · ${c.unknown} chưa biết">
        <i class="k" style="width:${pct(c.known, c.total)}%"></i>
        <i class="u" style="width:${pct(c.unsure, c.total)}%"></i>
        <i class="x" style="width:${pct(c.unknown, c.total)}%"></i></div>`;

    // Thứ tự học thông minh: chưa biết → chưa chắc → chưa học → đã thuộc, xáo trộn trong từng nhóm
    function smartOrder(list) {
        const rank = { unknown: 0, unsure: 1, '': 2, known: 3 };
        const groups = [[], [], [], []];
        list.forEach(q => groups[rank[statusOf(q.id)]].push(q));
        return groups.flatMap(g => shuffle(g));
    }

    // ================== CLEANUP (timer, key handlers) ==================
    let cleanups = [];
    const onCleanup = fn => cleanups.push(fn);
    const runCleanup = () => { cleanups.forEach(fn => fn()); cleanups = []; };
    const isTyping = e => e.target instanceof Element && !!e.target.closest('input, textarea, select');
    const onKey = handler => {
        const fn = e => {
            if (isTyping(e) || e.ctrlKey || e.metaKey || e.altKey) return;
            handler(e);
        };
        document.addEventListener('keydown', fn);
        onCleanup(() => document.removeEventListener('keydown', fn));
    };

    // ================== SIDEBAR ==================
    function renderSidebar() {
        const { parts } = parseHash();
        const cur = '#/' + parts.join('/');
        const link = (href, icon, label, extra = '') =>
            `<a class="nav-link ${cur === href ? 'active' : ''}" href="${href}"><span>${icon}</span><span>${esc(label)}</span>${extra}</a>`;

        const review = ALL.filter(q => ['unknown', 'unsure'].includes(statusOf(q.id)) || DB.star[q.id]).length;
        let html = link('#/', '🏠', 'Tổng quan');
        if (BANK.guides.length) {
            html += '<h4>Hướng dẫn</h4>' + BANK.guides.map(g => link('#/guide/' + g.key, g.icon, g.title)).join('');
        }
        html += '<h4>Luyện tập</h4>'
            + link('#/flash', '🃏', 'Flashcard')
            + link('#/mock', '🎤', 'Phỏng vấn thử')
            + link('#/quiz', '✅', 'Trắc nghiệm', `<span class="count">${BANK.quiz.length}</span>`)
            + link('#/review', '🔁', 'Cần ôn lại', `<span class="count">${review}</span>`);

        const groups = {};
        CATS.forEach(c => (groups[c.group] ??= []).push(c));
        for (const [g, cats] of Object.entries(groups)) {
            html += `<h4>${esc(g)}</h4>`;
            html += cats.map(c => {
                const k = counts(c.questions);
                return link('#/c/' + c.key, c.icon, c.title,
                    `<span class="count">${c.questions.length}</span><span class="mini-bar"><i style="width:${pct(k.known, k.total)}%"></i></span>`);
            }).join('');
        }
        $('#sidebar').innerHTML = html;
    }

    // ================== ROUTER ==================
    function parseHash() {
        const h = location.hash.replace(/^#\/?/, '');
        const [path, qs] = h.split('?');
        return { parts: path.split('/').filter(Boolean).map(decodeURIComponent), params: new URLSearchParams(qs || '') };
    }

    function route() {
        runCleanup();
        document.body.classList.remove('nav-open');
        const { parts, params } = parseHash();
        const [p0, p1] = parts;
        const views = {
            undefined: () => viewHome(),
            c: () => (CAT[p1] ? viewCategory(CAT[p1], params) : viewNotFound()),
            guide: () => viewGuide(p1),
            flash: () => viewFlash(params),
            mock: () => viewMock(),
            quiz: () => viewQuiz(),
            review: () => viewReview(),
            search: () => viewSearch(params.get('q') || ''),
        };
        (views[p0] || viewNotFound)();
        renderSidebar();
        document.querySelectorAll('#tabbar [data-tab]').forEach(el => {
            el.classList.toggle('active', el.dataset.tab === (p0 || '') || (el.dataset.tab === 'menu' && ['c', 'review', 'search', 'guide'].includes(p0)));
        });
        window.scrollTo(0, 0);
        app.focus({ preventScroll: true });
    }

    const viewNotFound = () => { app.innerHTML = '<div class="empty">Không tìm thấy trang. <a href="#/">Về trang chủ</a></div>'; };

    // ================== HOME ==================
    function viewHome() {
        const c = counts(ALL);
        const groups = {};
        CATS.forEach(cat => (groups[cat.group] ??= []).push(cat));
        const lastMock = DB.mockHistory[DB.mockHistory.length - 1];

        app.innerHTML = `
            <h1>Ôn phỏng vấn PHP Fullstack 🇻🇳</h1>
            <p class="lead">${c.total} câu hỏi tự luận + ${BANK.quiz.length} câu trắc nghiệm: PHP, Laravel, MySQL, HTML/CSS, JavaScript, bảo mật, DevOps, thiết kế hệ thống, nghiệp vụ và HR.
            Đánh dấu từng câu là <b style="color:var(--ok)">Đã thuộc</b> / <b style="color:var(--warn)">Chưa chắc</b> / <b style="color:var(--bad)">Chưa biết</b>, app sẽ ưu tiên những câu bạn còn yếu.</p>

            <div class="stats">
                <div class="card stat"><div class="num">${pct(c.known, c.total)}%</div><div class="label">Mức độ sẵn sàng</div></div>
                <div class="card stat ok"><div class="num">${c.known}</div><div class="label">Đã thuộc</div></div>
                <div class="card stat warn"><div class="num">${c.unsure}</div><div class="label">Chưa chắc</div></div>
                <div class="card stat bad"><div class="num">${c.unknown}</div><div class="label">Chưa biết</div></div>
                <div class="card stat"><div class="num">${c.todo}</div><div class="label">Chưa học</div></div>
            </div>
            ${bar(c)}

            <div class="actions">
                ${BANK.guides[0] ? `<a class="btn" href="#/guide/${BANK.guides[0].key}">🗺️ Xem lộ trình ôn</a>` : ''}
                <a class="btn primary" href="#/flash">🃏 Flashcard thông minh</a>
                <a class="btn" href="#/mock">🎤 Phỏng vấn thử</a>
                <a class="btn" href="#/quiz">✅ Trắc nghiệm nhanh</a>
                <a class="btn" href="#/review">🔁 Ôn câu yếu</a>
            </div>
            ${lastMock ? `<p class="muted small">Lần phỏng vấn thử gần nhất: ${esc(lastMock.date)} — điểm <b>${lastMock.score}%</b> (${lastMock.n} câu)</p>` : ''}

            ${Object.entries(groups).map(([g, cats]) => `
                <h2>${esc(g)}</h2>
                <div class="grid">${cats.map(cat => {
                    const k = counts(cat.questions);
                    return `<a class="card cat-card" href="#/c/${cat.key}">
                        <div class="head"><span class="icon">${cat.icon}</span>${esc(cat.title)}</div>
                        <div class="desc">${esc(cat.desc)}</div>
                        ${bar(k)}
                        <div class="meta"><span>${cat.questions.length} câu</span><span>${pct(k.known, k.total)}% đã thuộc</span></div>
                    </a>`;
                }).join('')}</div>`).join('')}

            <hr>
            <p class="muted small">Tiến độ được lưu trong trình duyệt (localStorage).
                <button class="btn small" data-act="export">⬇️ Sao lưu tiến độ</button>
                <button class="btn small" data-act="import">⬆️ Khôi phục</button>
                <button class="btn small bad" data-act="reset">Xoá toàn bộ tiến độ</button>
            </p>`;
    }

    // ================== QUESTION LIST ==================
    function qItem(q, i, showCat) {
        const st = statusOf(q.id);
        return `<details class="q" data-id="${q.id}">
            <summary>
                <span class="status-dot ${st}" title="${STATUS[st] || 'Chưa học'}"></span>
                <span class="num">${i + 1}.</span>
                <span class="qt">${q.q} ${showCat ? `<span class="tag">${CAT[q.cat].icon} ${esc(CAT[q.cat].title)}</span>` : ''}</span>
                <span class="lvl ${q.level}">${LEVELS[q.level]}</span>
                <button class="star ${DB.star[q.id] ? 'on' : ''}" data-act="star" data-id="${q.id}" title="Đánh dấu sao">★</button>
            </summary>
            <div class="answer md">${q.html}</div>
            <div class="rate">
                <span class="hint">Bạn tự trả lời được câu này chưa?</span>
                ${rateButtons(q.id, st)}
            </div>
        </details>`;
    }

    const rateButtons = (id, st) => `
        <button class="btn small ${st === 'known' ? 'ok' : ''}" data-act="rate" data-s="known" data-id="${id}">✅ Đã thuộc</button>
        <button class="btn small ${st === 'unsure' ? 'warn' : ''}" data-act="rate" data-s="unsure" data-id="${id}">🤔 Chưa chắc</button>
        <button class="btn small ${st === 'unknown' ? 'bad' : ''}" data-act="rate" data-s="unknown" data-id="${id}">❌ Chưa biết</button>`;

    function filterList(list, f) {
        const terms = fold(f.q || '').split(/\s+/).filter(Boolean);
        return list.filter(q =>
            (!f.lvl || q.level === f.lvl) &&
            (!f.st || (f.st === 'todo' ? !statusOf(q.id) : f.st === 'star' ? DB.star[q.id] : statusOf(q.id) === f.st)) &&
            terms.every(t => searchText(q).includes(t)));
    }

    function listToolbar(f, extra = '') {
        const chip = (key, val, label) => `<button class="chip ${f[key] === val ? 'on' : ''}" data-act="filter" data-k="${key}" data-v="${val}">${label}</button>`;
        return `<div class="toolbar">
            ${chip('lvl', '', 'Mọi level')}${chip('lvl', 'junior', 'Junior')}${chip('lvl', 'middle', 'Middle')}${chip('lvl', 'senior', 'Senior')}
            <span class="sep"></span>
            ${chip('st', '', 'Tất cả')}${chip('st', 'todo', 'Chưa học')}${chip('st', 'unknown', '❌')}${chip('st', 'unsure', '🤔')}${chip('st', 'known', '✅')}${chip('st', 'star', '★')}
            <span class="grow"></span>
            <button class="btn small" data-act="expand">Mở tất cả</button>
            <button class="btn small" data-act="collapse">Đóng tất cả</button>
            ${extra}
        </div>`;
    }

    function mountFilterableList(headerHtml, source, f, opts = {}) {
        const render = () => {
            const list = filterList(source, f);
            app.innerHTML = headerHtml() + listToolbar(f, opts.extra || '') +
                (list.length
                    ? `<div class="qlist">${list.map((q, i) => qItem(q, i, opts.showCat)).join('')}</div>`
                    : `<div class="empty">Không có câu hỏi nào khớp bộ lọc.</div>`);
        };
        app.onFilter = (k, v) => { f[k] = f[k] === v ? '' : v; render(); };
        render();
    }

    function viewCategory(cat, params) {
        const f = { lvl: params.get('lvl') || '', st: '', q: '' };
        mountFilterableList(() => {
            const k = counts(cat.questions);
            return `<h1>${cat.icon} ${esc(cat.title)}</h1>
                <p class="lead">${esc(cat.desc)}</p>
                ${bar(k)}
                <div class="actions">
                    <a class="btn primary" href="#/flash?c=${cat.key}">🃏 Flashcard chủ đề này</a>
                    <a class="btn" href="#/mock">🎤 Phỏng vấn thử</a>
                    <span class="muted small" style="align-self:center">${k.known}/${k.total} đã thuộc</span>
                </div>`;
        }, cat.questions, f);
    }

    function viewReview() {
        const src = ALL.filter(q => ['unknown', 'unsure'].includes(statusOf(q.id)) || DB.star[q.id]);
        const f = { lvl: '', st: '', q: '' };
        mountFilterableList(() => `<h1>🔁 Cần ôn lại</h1>
            <p class="lead">Các câu bạn đánh dấu ❌ Chưa biết, 🤔 Chưa chắc hoặc ★. Ôn hết danh sách này trước buổi phỏng vấn.</p>
            <div class="actions">${src.length ? '<a class="btn primary" href="#/flash?c=review">🃏 Flashcard các câu này</a>' : ''}</div>`,
        src, f, { showCat: true });
    }

    function viewSearch(q) {
        $('#searchInput').value = q;
        const f = { lvl: '', st: '', q };
        const n = filterList(ALL, f).length;
        mountFilterableList(() => `<h1>🔎 Kết quả cho “${esc(q)}”</h1><p class="lead">${n} câu hỏi khớp (tìm cả trong đáp án, không cần gõ dấu).</p>`,
            ALL, f, { showCat: true });
    }

    function viewGuide(key) {
        const g = BANK.guides.find(x => x.key === key);
        if (!g) return viewNotFound();
        app.innerHTML = `<h1>${g.icon} ${esc(g.title)}</h1><p class="lead">${esc(g.desc)}</p><div class="card md">${g.html}</div>`;
    }

    // ================== FLASHCARD ==================
    function deckFrom(params) {
        const c = params.get('c') || 'all';
        let list = c === 'all' ? ALL
            : c === 'review' ? ALL.filter(q => ['unknown', 'unsure'].includes(statusOf(q.id)) || DB.star[q.id])
            : (CAT[c]?.questions || []);
        const lvl = params.get('lvl');
        if (lvl) list = list.filter(q => q.level === lvl);
        return { list, c, lvl };
    }

    function viewFlash(params) {
        const { list, c, lvl } = deckFrom(params);
        const title = c === 'all' ? 'Tất cả chủ đề' : c === 'review' ? 'Câu cần ôn lại' : `${CAT[c]?.icon} ${CAT[c]?.title}`;
        const deck = smartOrder(list);
        let idx = 0;
        let revealed = false;
        const tally = { known: 0, unsure: 0, unknown: 0 };

        const picker = `<div class="toolbar picker">
            <select id="deckCat">
                <option value="all">🌐 Tất cả chủ đề</option>
                <option value="review" ${c === 'review' ? 'selected' : ''}>🔁 Câu cần ôn lại</option>
                ${CATS.map(x => `<option value="${x.key}" ${x.key === c ? 'selected' : ''}>${x.icon} ${esc(x.title)}</option>`).join('')}
            </select>
            <select id="deckLvl">
                <option value="">Mọi level</option>
                ${Object.entries(LEVELS).map(([k, v]) => `<option value="${k}" ${k === lvl ? 'selected' : ''}>${v}</option>`).join('')}
            </select>
        </div>`;

        const render = () => {
            if (!deck.length) {
                app.innerHTML = `<h1>🃏 Flashcard</h1>${picker}<div class="empty">Bộ thẻ trống. Chọn chủ đề khác nhé.</div>`;
                return;
            }
            if (idx >= deck.length) {
                const done = tally.known + tally.unsure + tally.unknown;
                app.innerHTML = `<h1>🎉 Xong bộ thẻ!</h1>
                    <div class="card"><p>Bạn đã đi qua <b>${deck.length}</b> thẻ (${done} thẻ đã chấm).</p>
                    <p>✅ ${tally.known} · 🤔 ${tally.unsure} · ❌ ${tally.unknown}</p>
                    <div class="actions"><button class="btn primary" data-act="restart">Học lại (ưu tiên câu yếu)</button>
                    <a class="btn" href="#/review">Xem danh sách cần ôn</a></div></div>`;
                return;
            }
            const q = deck[idx];
            const st = statusOf(q.id);
            app.innerHTML = `<div class="flash-wrap">
                <h1>🃏 Flashcard</h1>${picker}
                <div class="flash-top">
                    <span>Thẻ ${idx + 1}/${deck.length}</span>
                    <div class="progress">${bar({ known: idx, unsure: 0, unknown: 0, total: deck.length })}</div>
                    <span class="lvl ${q.level}">${LEVELS[q.level]}</span>
                    <span class="tag">${CAT[q.cat].icon} ${esc(CAT[q.cat].title)}</span>
                    ${st ? `<span class="tag">Lần trước: ${STATUS[st]}</span>` : ''}
                </div>
                <div class="card flash">
                    <div class="front">${q.q}</div>
                    ${revealed
                        ? `<div class="back md">${q.html}</div>
                           <div class="actions">
                              <button class="btn ok" data-act="fc-rate" data-s="known">✅ Đã thuộc <kbd>1</kbd></button>
                              <button class="btn warn" data-act="fc-rate" data-s="unsure">🤔 Chưa chắc <kbd>2</kbd></button>
                              <button class="btn bad" data-act="fc-rate" data-s="unknown">❌ Chưa biết <kbd>3</kbd></button>
                           </div>`
                        : `<p class="muted">💬 Tự trả lời thành tiếng trước (như đang ngồi trước interviewer), rồi mới lật thẻ.</p>
                           <div class="reveal"><button class="btn primary" data-act="fc-reveal">Lật thẻ <kbd>Space</kbd></button></div>`}
                </div>
                <div class="actions">
                    <button class="btn small" data-act="fc-prev" ${idx === 0 ? 'disabled' : ''}>← Trước</button>
                    <button class="btn small" data-act="fc-next">Bỏ qua →</button>
                </div>
                <div class="kbd-hint">Phím tắt: <kbd>Space</kbd> lật thẻ · <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> chấm điểm · <kbd>←</kbd><kbd>→</kbd> chuyển thẻ</div>
            </div>`;
        };

        app.flash = {
            reveal: () => { revealed = true; render(); },
            rate: s => { setStatus(deck[idx].id, s); tally[s]++; idx++; revealed = false; render(); window.scrollTo(0, 0); },
            next: () => { if (idx < deck.length) { idx++; revealed = false; render(); } },
            prev: () => { if (idx > 0) { idx--; revealed = false; render(); } },
            restart: () => route(),
        };

        onKey(e => {
            if (idx >= deck.length) return;
            if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!revealed) app.flash.reveal(); }
            else if (revealed && ['1', '2', '3'].includes(e.key)) app.flash.rate(['known', 'unsure', 'unknown'][+e.key - 1]);
            else if (e.key === 'ArrowRight') app.flash.next();
            else if (e.key === 'ArrowLeft') app.flash.prev();
        });

        render();
    }

    // ================== MOCK INTERVIEW ==================
    function viewMock() {
        const defaults = CATS.filter(c => c.key !== 'coding').map(c => c.key);
        const setup = () => {
            const hist = DB.mockHistory.slice(-8).reverse();
            app.innerHTML = `<h1>🎤 Phỏng vấn thử</h1>
                <p class="lead">Mô phỏng buổi phỏng vấn: câu hỏi ngẫu nhiên, có đồng hồ. Hãy <b>nói to câu trả lời</b> (hoặc ghi âm lại bằng điện thoại) rồi mới xem gợi ý, sau đó tự chấm điểm thật lòng.</p>
                <div class="card setup">
                    <div class="row"><b>Chủ đề</b>
                        ${CATS.map(c => `<label class="check"><input type="checkbox" name="cat" value="${c.key}" ${defaults.includes(c.key) ? 'checked' : ''}> ${c.icon} ${esc(c.title)}</label>`).join('')}
                    </div>
                    <div class="row"><b>Cấu hình</b>
                        <select id="mkN"><option value="5">5 câu (~15 phút)</option><option value="10" selected>10 câu (~30 phút)</option><option value="15">15 câu (~45 phút)</option><option value="20">20 câu (~60 phút)</option></select>
                        <select id="mkT"><option value="120">2 phút/câu</option><option value="180" selected>3 phút/câu</option><option value="300">5 phút/câu</option></select>
                        <select id="mkL"><option value="">Mọi level</option><option value="junior">Tối đa Junior</option><option value="middle">Tối đa Middle</option></select>
                    </div>
                    <div class="row"><label class="check"><input type="checkbox" id="mkWeak"> Ưu tiên câu mình còn yếu</label></div>
                    <button class="btn primary" data-act="mock-start">Bắt đầu phỏng vấn ▶</button>
                </div>
                ${hist.length ? `<h2>Lịch sử</h2><div class="card"><table class="md" style="width:100%"><thead><tr><th>Ngày</th><th>Số câu</th><th>Điểm</th></tr></thead><tbody>
                    ${hist.map(h => `<tr><td>${esc(h.date)}</td><td>${h.n}</td><td><b>${h.score}%</b></td></tr>`).join('')}</tbody></table></div>` : ''}`;
        };

        let s = null;
        let timer = null;
        const stopTimer = () => { clearInterval(timer); timer = null; };
        onCleanup(stopTimer);

        const start = () => {
            const cats = [...app.querySelectorAll('input[name=cat]:checked')].map(i => i.value);
            const n = +$('#mkN').value;
            const limit = +$('#mkT').value;
            const lvl = $('#mkL').value;
            const weak = $('#mkWeak').checked;
            const allowed = lvl === 'junior' ? ['junior'] : lvl === 'middle' ? ['junior', 'middle'] : ['junior', 'middle', 'senior'];
            let pool = ALL.filter(q => cats.includes(q.cat) && allowed.includes(q.level));
            if (!pool.length) { alert('Chọn ít nhất 1 chủ đề nhé!'); return; }
            pool = weak ? smartOrder(pool) : shuffle(pool);
            // HR thường hỏi đầu tiên ("giới thiệu bản thân"), nên đẩy 1 câu HR lên đầu nếu có
            let picked = pool.slice(0, n);
            const intro = ALL.find(q => q.cat === 'hr' && /giới thiệu/i.test(plain(q.q)));
            if (intro && cats.includes('hr')) picked = [intro, ...picked.filter(q => q !== intro)].slice(0, n);
            s = { list: picked, idx: 0, limit, revealed: false, results: [], t0: Date.now() };
            showQ();
        };

        const showQ = () => {
            stopTimer();
            if (s.idx >= s.list.length) return finish();
            const q = s.list[s.idx];
            app.innerHTML = `<div class="flash-wrap">
                <div class="flash-top">
                    <span>Câu ${s.idx + 1}/${s.list.length}</span>
                    <div class="progress">${bar({ known: s.idx, unsure: 0, unknown: 0, total: s.list.length })}</div>
                    <span class="lvl ${q.level}">${LEVELS[q.level]}</span>
                    <span class="tag">${CAT[q.cat].icon} ${esc(CAT[q.cat].title)}</span>
                    <span class="timer" id="timer">00:00</span>
                </div>
                <div class="card flash">
                    <div class="muted small">👔 Interviewer hỏi:</div>
                    <div class="front">${q.q}</div>
                    <div id="mkBack">${s.revealed ? mockBack(q) : `<p class="muted">Trả lời thành tiếng. Gợi ý cấu trúc: <b>định nghĩa → ví dụ thực tế trong dự án → ưu/nhược điểm</b>.</p>
                        <div class="reveal"><button class="btn primary" data-act="mock-reveal">Mình trả lời xong, xem gợi ý <kbd>Space</kbd></button></div>`}</div>
                </div>
                <div class="actions"><button class="btn small" data-act="mock-quit">Kết thúc sớm</button></div>
            </div>`;
            s.qStart ??= Date.now();
            const tick = () => {
                const el = $('#timer');
                if (!el) return;
                const sec = Math.floor((Date.now() - s.qStart) / 1000);
                el.textContent = `${fmtTime(sec)} / ${fmtTime(s.limit)}`;
                el.classList.toggle('late', sec > s.limit);
            };
            tick();
            if (!s.revealed) timer = setInterval(tick, 1000);
        };

        const mockBack = q => `<div class="back md">${q.html}</div>
            <div class="actions">
                <button class="btn ok" data-act="mock-rate" data-s="known">✅ Trả lời tốt <kbd>1</kbd></button>
                <button class="btn warn" data-act="mock-rate" data-s="unsure">🤔 Được một phần <kbd>2</kbd></button>
                <button class="btn bad" data-act="mock-rate" data-s="unknown">❌ Không trả lời được <kbd>3</kbd></button>
            </div>`;

        const finish = () => {
            stopTimer();
            const r = s.results;
            if (!r.length) { setup(); return; }
            const score = Math.round((r.reduce((a, x) => a + (x.s === 'known' ? 1 : x.s === 'unsure' ? 0.5 : 0), 0) / r.length) * 100);
            const totalSec = Math.round((Date.now() - s.t0) / 1000);
            DB.mockHistory.push({ date: new Date().toLocaleString('vi-VN'), n: r.length, score });
            DB.mockHistory = DB.mockHistory.slice(-30);
            save();
            const verdict = score >= 80 ? '🔥 Rất tốt, bạn đã sẵn sàng!' : score >= 60 ? '👍 Khá ổn, ôn thêm các câu ❌/🤔 là đậu.' : '💪 Cần ôn thêm — xem lại danh sách bên dưới.';
            app.innerHTML = `<h1>Kết quả phỏng vấn thử</h1>
                <div class="card"><div class="result-big">${score}%</div><p>${verdict}</p>
                <p class="muted">${r.length} câu · tổng thời gian ${fmtTime(totalSec)} · trung bình ${fmtTime(Math.round(r.reduce((a, x) => a + x.sec, 0) / r.length))}/câu</p>
                <div class="actions"><button class="btn primary" data-act="mock-again">Phỏng vấn lại</button><a class="btn" href="#/review">Ôn câu yếu</a></div></div>
                <h2>Chi tiết</h2>
                <div class="qlist">${r.map((x, i) => qItem(BY_ID[x.id], i, true).replace('<span class="qt">', `<span class="qt">${x.s === 'known' ? '✅' : x.s === 'unsure' ? '🤔' : '❌'} <span class="muted small">(${fmtTime(x.sec)})</span> `)).join('')}</div>`;
            s = null;
        };

        app.mock = {
            start,
            reveal: () => { if (!s || s.revealed) return; s.revealed = true; s.revealSec = Math.floor((Date.now() - s.qStart) / 1000); showQ(); },
            rate: st => {
                const q = s.list[s.idx];
                setStatus(q.id, st);
                s.results.push({ id: q.id, s: st, sec: s.revealSec ?? 0 });
                s.idx++; s.revealed = false; s.qStart = null; s.revealSec = null;
                showQ(); window.scrollTo(0, 0);
            },
            quit: () => finish(),
            again: () => setup(),
        };

        onKey(e => {
            if (!s) return;
            if ((e.key === ' ' || e.key === 'Enter') && !s.revealed) { e.preventDefault(); app.mock.reveal(); }
            else if (s.revealed && ['1', '2', '3'].includes(e.key)) app.mock.rate(['known', 'unsure', 'unknown'][+e.key - 1]);
        });

        setup();
    }

    // ================== QUIZ ==================
    function viewQuiz() {
        const quizCats = [...new Set(BANK.quiz.map(q => q.cat))];
        const catName = k => (CAT[k] ? `${CAT[k].icon} ${CAT[k].title}` : k);
        let s = null;

        const setup = () => {
            app.innerHTML = `<h1>✅ Trắc nghiệm nhanh</h1>
                <p class="lead">Câu hỏi trắc nghiệm kiểu bài test online / vòng lọc kỹ thuật (nhiều công ty VN dùng TestDome, HackerRank, Google Form). Có giải thích sau mỗi câu.</p>
                <div class="card setup">
                    <div class="row"><b>Chủ đề</b>${quizCats.map(c => `<label class="check"><input type="checkbox" name="qcat" value="${c}" checked> ${esc(catName(c))} <span class="muted small">(${BANK.quiz.filter(q => q.cat === c).length})</span>${DB.quizBest[c] != null ? ` <span class="tag">best ${DB.quizBest[c]}%</span>` : ''}</label>`).join('')}</div>
                    <div class="row"><b>Số câu</b><select id="qzN"><option value="10">10</option><option value="20" selected>20</option><option value="40">40</option><option value="9999">Tất cả</option></select></div>
                    <button class="btn primary" data-act="quiz-start">Bắt đầu ▶</button>
                </div>`;
        };

        const start = () => {
            const cats = [...app.querySelectorAll('input[name=qcat]:checked')].map(i => i.value);
            const pool = shuffle(BANK.quiz.filter(q => cats.includes(q.cat))).slice(0, +$('#qzN').value);
            if (!pool.length) { alert('Chọn ít nhất 1 chủ đề nhé!'); return; }
            s = {
                cats,
                list: pool.map(q => ({ q, order: shuffle(q.options.map((_, i) => i)) })),
                idx: 0, picked: null, correct: 0, wrong: [],
            };
            show();
        };

        const show = () => {
            if (s.idx >= s.list.length) return finish();
            const { q, order } = s.list[s.idx];
            const answered = s.picked !== null;
            app.innerHTML = `<div class="flash-wrap">
                <div class="flash-top"><span>Câu ${s.idx + 1}/${s.list.length}</span>
                    <div class="progress">${bar({ known: s.correct, unsure: 0, unknown: s.wrong.length, total: s.list.length })}</div>
                    <span class="tag">${esc(catName(q.cat))}</span></div>
                <div class="card">
                    <div class="front md" style="font-weight:600;font-size:18px">${q.q}</div>
                    <div class="options">${order.map((oi, pos) => {
                        let cls = '';
                        if (answered && oi === q.answer) cls = 'correct';
                        else if (answered && oi === s.picked) cls = 'wrong';
                        return `<button class="option md ${cls}" data-act="quiz-pick" data-i="${oi}" ${answered ? 'disabled' : ''}><span class="letter">${'ABCD'[pos]}</span><span>${q.options[oi]}</span></button>`;
                    }).join('')}</div>
                    ${answered ? `<div class="explain md">${s.picked === q.answer ? '✅ <b>Chính xác!</b>' : '❌ <b>Chưa đúng.</b>'} ${q.explain}</div>
                        <div class="actions sticky-actions"><button class="btn primary" data-act="quiz-next">Câu tiếp <kbd>Enter</kbd></button></div>` : ''}
                </div>
                <div class="kbd-hint">Phím tắt: <kbd>A</kbd>–<kbd>D</kbd> hoặc <kbd>1</kbd>–<kbd>4</kbd> để chọn · <kbd>Enter</kbd> câu tiếp</div>
            </div>`;
        };

        const finish = () => {
            const score = pct(s.correct, s.list.length);
            s.cats.forEach(c => {
                if (s.cats.length === 1) DB.quizBest[c] = Math.max(DB.quizBest[c] ?? 0, score);
            });
            save();
            app.innerHTML = `<h1>Kết quả trắc nghiệm</h1>
                <div class="card"><div class="result-big">${s.correct}/${s.list.length}</div>
                <p>${score >= 80 ? '🔥 Xuất sắc!' : score >= 60 ? '👍 Ổn, xem lại các câu sai bên dưới.' : '💪 Ôn lại lý thuyết rồi làm lại nhé.'}</p>
                <div class="actions"><button class="btn primary" data-act="quiz-again">Làm bài mới</button></div></div>
                ${s.wrong.length ? `<h2>Các câu sai</h2>${s.wrong.map(q => `<div class="card md" style="margin-bottom:10px"><p><b>${q.q}</b></p>
                    <p>Đáp án: <b style="color:var(--ok)">${q.options[q.answer]}</b></p><p class="muted">${q.explain}</p></div>`).join('')}` : ''}`;
            s = null;
        };

        app.quiz = {
            start,
            pick: i => {
                if (!s || s.picked !== null) return;
                s.picked = i;
                const q = s.list[s.idx].q;
                if (i === q.answer) s.correct++; else s.wrong.push(q);
                show();
            },
            next: () => { if (s && s.picked !== null) { s.idx++; s.picked = null; show(); window.scrollTo(0, 0); } },
            again: () => setup(),
        };

        onKey(e => {
            if (!s) return;
            const k = e.key.toLowerCase();
            const map = { a: 0, b: 1, c: 2, d: 3, 1: 0, 2: 1, 3: 2, 4: 3 };
            if (s.picked === null && k in map) {
                const ord = s.list[s.idx].order;
                if (map[k] < ord.length) app.quiz.pick(ord[map[k]]);
            } else if (s.picked !== null && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); app.quiz.next(); }
        });

        setup();
    }

    // ================== EVENTS ==================
    app.addEventListener('click', e => {
        const el = e.target.closest('[data-act]');
        if (!el) return;
        const act = el.dataset.act;
        const id = el.dataset.id;

        switch (act) {
            case 'star': {
                e.preventDefault();
                el.classList.toggle('on', toggleStar(id));
                renderSidebar();
                break;
            }
            case 'rate': {
                const cur = statusOf(id);
                const s = cur === el.dataset.s ? '' : el.dataset.s;
                setStatus(id, s);
                const box = el.closest('.q');
                box.querySelector('.status-dot').className = 'status-dot ' + s;
                box.querySelector('.rate').innerHTML = '<span class="hint">Bạn tự trả lời được câu này chưa?</span>' + rateButtons(id, s);
                break;
            }
            case 'filter': app.onFilter?.(el.dataset.k, el.dataset.v); break;
            case 'expand': app.querySelectorAll('details.q').forEach(d => { d.open = true; }); break;
            case 'collapse': app.querySelectorAll('details.q').forEach(d => { d.open = false; }); break;
            case 'fc-reveal': app.flash.reveal(); break;
            case 'fc-rate': app.flash.rate(el.dataset.s); break;
            case 'fc-next': app.flash.next(); break;
            case 'fc-prev': app.flash.prev(); break;
            case 'restart': app.flash.restart(); break;
            case 'mock-start': app.mock.start(); break;
            case 'mock-reveal': app.mock.reveal(); break;
            case 'mock-rate': app.mock.rate(el.dataset.s); break;
            case 'mock-quit': app.mock.quit(); break;
            case 'mock-again': app.mock.again(); break;
            case 'quiz-start': app.quiz.start(); break;
            case 'quiz-pick': app.quiz.pick(+el.dataset.i); break;
            case 'quiz-next': app.quiz.next(); break;
            case 'quiz-again': app.quiz.again(); break;
            case 'reset':
                if (confirm('Xoá toàn bộ tiến độ học? Không thể hoàn tác.')) {
                    DB = { status: {}, star: {}, quizBest: {}, mockHistory: [] }; save(); route();
                }
                break;
            case 'export': {
                const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `tien-do-on-pv-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(a.href);
                break;
            }
            case 'import': {
                const inp = document.createElement('input');
                inp.type = 'file'; inp.accept = 'application/json';
                inp.onchange = async () => {
                    try {
                        const data = JSON.parse(await inp.files[0].text());
                        if (!data || typeof data.status !== 'object') throw new Error('Sai định dạng');
                        DB = Object.assign({ status: {}, star: {}, quizBest: {}, mockHistory: [] }, data);
                        save(); route();
                    } catch (err) { alert('Không đọc được file: ' + err.message); }
                };
                inp.click();
                break;
            }
        }
    });

    app.addEventListener('change', e => {
        if (e.target.id === 'deckCat' || e.target.id === 'deckLvl') {
            const c = $('#deckCat').value;
            const l = $('#deckLvl').value;
            location.hash = `#/flash?c=${c}${l ? '&lvl=' + l : ''}`;
        }
    });

    $('#searchForm').addEventListener('submit', e => {
        e.preventDefault();
        const q = $('#searchInput').value.trim();
        $('#searchInput').blur(); // đóng bàn phím trên điện thoại
        if (q) location.hash = '#/search?q=' + encodeURIComponent(q);
    });

    document.addEventListener('keydown', e => {
        if (e.key === '/' && !isTyping(e)) { e.preventDefault(); $('#searchInput').focus(); }
    });

    // Màu thanh trạng thái (iPhone/Android) theo theme đang dùng
    const syncThemeColor = () => {
        const bg = getComputedStyle(document.body).getPropertyValue('--surface').trim() || '#ffffff';
        document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', bg));
    };
    if (document.documentElement.dataset.theme) syncThemeColor();

    $('#themeBtn').addEventListener('click', () => {
        const root = document.documentElement;
        const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
        root.dataset.theme = dark ? 'light' : 'dark';
        try { localStorage.setItem('ipv-theme', root.dataset.theme); } catch (err) { /* ignore */ }
        syncThemeColor();
    });

    $('#menuBtn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
    $('#tabMenu').addEventListener('click', () => document.body.classList.toggle('nav-open'));
    $('#backdrop').addEventListener('click', () => document.body.classList.remove('nav-open'));

    window.addEventListener('hashchange', route);
    route();
})();
