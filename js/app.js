(function () {
  const { subjects, quizzes } = window.QuizBank;
  const app = document.getElementById('app');
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  const SECONDS_PER_QUESTION = 35;
  const MIX_SIZE = 20;

  // ---------- storage helpers (never required for the app to work) ----------
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem('popquiz-' + key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('popquiz-' + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
    },
  };

  // ---------- utils ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const estTime = (n) => Math.max(1, Math.round((n * SECONDS_PER_QUESTION) / 60)) + ' mins';
  const fmtClock = (ms) => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const subjectOf = (id) => subjects.find((s) => s.id === id);

  // Code blocks are highlighted in the language of the question's subject.
  const subjectOfQuestion = new Map(quizzes.flatMap((z) => z.questions.map((q) => [q, z.subject])));
  const codeBlock = (code, q) => `<pre class="code"><code>${window.Highlight.code(code, subjectOfQuestion.get(q.source || q))}</code></pre>`;

  // Inline `code` inside text -> <code>
  const rich = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');

  // Questions in the original data embed code directly in the question text.
  // If the text spans multiple lines, show the first prose-looking line as the prompt and the rest as code.
  function splitQuestion(q) {
    if (q.code) return { text: q.question, code: q.code };
    const lines = q.question.split('\n');
    if (lines.length === 1) return { text: q.question, code: null };
    const first = lines[0];
    const prose = /[?:]\s*$/.test(first) && /\s/.test(first) && !/[=;{(]\s*$/.test(first);
    if (prose) return { text: first, code: lines.slice(1).join('\n') };
    return { text: 'What is the output / result of this code?', code: q.question };
  }

  const icons = {
    list: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
    clock: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
    down: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 6 5 5 5-5"/><path d="m7 13 5 5 5-5"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/></svg>',
  };

  // ---------- quiz lookup (including generated "random mix" quizzes) ----------
  function getQuiz(id) {
    const found = quizzes.find((z) => z.id === id);
    if (found) return found;
    const m = /^mix-(\w+)$/.exec(id);
    if (m && subjectOf(m[1])) {
      const pool = quizzes.filter((z) => z.subject === m[1]).flatMap((z) => z.questions);
      return {
        id, subject: m[1], semester: 'Practice', random: true,
        title: subjectOf(m[1]).name + ' Random Mix',
        description: `${MIX_SIZE} random questions drawn from every ${subjectOf(m[1]).name} quiz — different each time.`,
        questions: pool, pickCount: Math.min(MIX_SIZE, pool.length),
      };
    }
    const mm = /^mistakes-(\w+)$/.exec(id);
    if (mm && subjectOf(mm[1])) {
      const keys = mistakeKeys();
      const pool = uniqueQuestions(mm[1]).map((x) => x.q).filter((q) => keys.has(qKey(q)));
      return {
        id, subject: mm[1], semester: 'Practice', random: true, mistakes: true,
        title: subjectOf(mm[1]).name + ' Mistakes',
        description: `Questions you got wrong in quizzes, speedruns and the feed. Answer one right and it leaves the deck.`,
        questions: pool, pickCount: Math.min(MIX_SIZE, pool.length),
      };
    }
    const sm = /^search\/(.+)$/.exec(id);
    if (sm) {
      let term = '';
      try { term = decodeURIComponent(sm[1]); } catch (e) { /* malformed URL: no matches */ }
      const found = searchQuestions(term);
      const pool = found.map((x) => x.q);
      const subs = [...new Set(found.map((x) => x.quiz.subject))];
      return {
        id, subject: subs.length === 1 ? subs[0] : 'all', semester: 'Practice', random: true,
        title: `Search: “${term}”`,
        description: `${pool.length} matching question${pool.length === 1 ? '' : 's'}` + (pool.length > MIX_SIZE ? `, ${MIX_SIZE} picked at random each time.` : '.'),
        questions: pool, pickCount: Math.min(MIX_SIZE, pool.length),
      };
    }
    return null;
  }

  // ---------- mistakes deck ----------
  // `popquiz-mistakes` is a list of qKey()s for questions answered wrong; a right answer anywhere removes it.
  const MISTAKES_MAX = 500;
  const mistakeKeys = () => { const v = store.get('mistakes', []); return new Set(Array.isArray(v) ? v.filter((k) => typeof k === 'string') : []); };
  function recordResults(results) {
    const keys = mistakeKeys();
    for (const { q, ok } of results) {
      const k = qKey(q.source || q);
      keys.delete(k);
      if (!ok) keys.add(k); // re-adding moves it to the end, so the cap drops the oldest
    }
    store.set('mistakes', [...keys].slice(-MISTAKES_MAX));
  }
  const mistakeCount = (subjectId) => { const keys = mistakeKeys(); return uniqueQuestions(subjectId).filter(({ q }) => keys.has(qKey(q))).length; };

  // ---------- search ----------
  // Every whitespace-separated word must appear in the question, its code or its options (case-insensitive).
  function searchQuestions(term) {
    const words = term.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return uniqueQuestions('all').filter(({ q }) => {
      const hay = (q.question + '\n' + (q.code || '') + '\n' + q.options.join('\n')).toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }

  // ---------- views ----------
  let homeQuery = ''; // kept while the page is open, so "Back to quizzes" returns to the same search
  const SEARCH_PREVIEW = 30;

  function renderHome() {
    const current = store.get('subject', 'python');
    const subject = subjectOf(current) || subjects[0];
    const best = store.get('best', {});
    const totals = Object.fromEntries(subjects.map((s) => [s.id, quizzes.filter((z) => z.subject === s.id).reduce((n, z) => n + z.questions.length, 0)]));
    const list = quizzes.filter((z) => z.subject === subject.id);
    const groups = [];
    for (const z of list) {
      let g = groups.find((x) => x.name === z.semester);
      if (!g) groups.push((g = { name: z.semester, items: [] }));
      g.items.push(z);
    }

    const card = (z, extraClass = '') => {
      const b = best[z.id];
      const count = z.pickCount || z.questions.length;
      return `
        <a class="card quiz-card ${extraClass}" href="#/quiz/${z.id}">
          <div class="quiz-card-top">
            <h3>${esc(z.title)}</h3>
            ${b != null ? `<span class="pill ${b >= 70 ? 'good' : b >= 40 ? 'mid' : 'low'}" title="Best score">Best ${b}%</span>` : ''}
          </div>
          <p class="muted">${esc(z.description)}</p>
          <div class="meta">
            <span>${icons.list}${count} questions</span>
            <span>${icons.clock}${estTime(count)}</span>
            ${z.added ? `<span class="pill new">+${z.added} new</span>` : ''}
            ${z.mistakes ? `<span class="pill low">${z.questions.length} to fix</span>` : ''}
          </div>
        </a>`;
    };
    const mistakes = getQuiz('mistakes-' + subject.id);

    app.innerHTML = `
      <section class="hero">
        <h1>Choose a Quiz</h1>
        <p class="muted">Select a quiz to test your knowledge</p>
      </section>
      <div class="search">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="search" id="search" placeholder="Search every question… (press /)" aria-label="Search questions" value="${esc(homeQuery)}" autocomplete="off" />
      </div>
      <div id="search-results" hidden></div>
      <div id="browse">
      <nav class="tabs" role="tablist">
        ${subjects.map((s) => `
          <button role="tab" class="tab ${s.id === subject.id ? 'active' : ''}" data-subject="${s.id}" aria-selected="${s.id === subject.id}">
            <span class="badge badge-${s.id}">${s.icon}</span>
            <span>${s.name}</span>
            <span class="tab-count">${totals[s.id]}</span>
          </button>`).join('')}
      </nav>
      <p class="muted subject-blurb">${esc(subject.blurb)} ${list.length} quizzes · ${totals[subject.id]} questions.</p>
      <div class="grid">
        ${card(getQuiz('mix-' + subject.id), 'mix-card')}
        ${mistakes.questions.length ? card(mistakes, 'mistakes-card') : ''}
        <a class="card quiz-card speed-entry" href="#/speedrun">
          <div class="quiz-card-top"><h3>${icons.bolt} Speedrun</h3></div>
          <p class="muted">Race the clock in Sprint, Time Attack or Sudden Death. Can you beat your personal best?</p>
          <div class="meta"><span>${icons.clock}3 game modes</span></div>
        </a>
        <a class="card quiz-card scroll-entry" href="#/scroll">
          <div class="quiz-card-top"><h3>${icons.phone} Doomscroll</h3></div>
          <p class="muted">An endless feed of questions. Swipe, answer, repeat. Like doomscrolling, but you learn something.</p>
          <div class="meta"><span>${icons.down}Never ends</span></div>
        </a>
      </div>
      ${groups.map((g) => `
        <h2 class="group-title">${esc(g.name)}</h2>
        <div class="grid">${g.items.map((z) => card(z)).join('')}</div>`).join('')}
      </div>
    `;

    const input = app.querySelector('#search');
    input.addEventListener('input', () => { homeQuery = input.value; renderSearch(card); });
    if (homeQuery) renderSearch(card);

    app.querySelectorAll('[data-subject]').forEach((btn) =>
      btn.addEventListener('click', () => { store.set('subject', btn.dataset.subject); renderHome(); }));
  }

  // Replaces the quiz browser with matching quizzes and questions while the search box has text.
  function renderSearch(card) {
    const term = homeQuery.trim();
    const box = app.querySelector('#search-results');
    box.hidden = !term;
    app.querySelector('#browse').hidden = !!term;
    if (!term) return;
    const lower = term.toLowerCase();
    const quizHits = quizzes.filter((z) => (z.title + ' ' + z.description).toLowerCase().includes(lower));
    const found = searchQuestions(term);
    const practice = found.length ? getQuiz('search/' + encodeURIComponent(term)) : null;
    box.innerHTML = `
      <p class="muted subject-blurb">${found.length} question${found.length === 1 ? '' : 's'} and ${quizHits.length} quiz${quizHits.length === 1 ? '' : 'zes'} match “${esc(term)}”.</p>
      ${practice || quizHits.length ? `<div class="grid">
        ${practice ? card(practice, 'mix-card') : ''}
        ${quizHits.map((z) => card(z)).join('')}
      </div>` : '<p class="muted center">Nothing matches. Try a shorter or different word, like <code>pointer</code> or <code>closure</code>.</p>'}
      ${found.length ? `
        <h2 class="group-title">Matching questions</h2>
        <ul class="search-list">
          ${found.slice(0, SEARCH_PREVIEW).map(({ q, quiz }) => `
            <li><a href="#/quiz/${quiz.id}">
              <span class="badge badge-${quiz.subject}">${subjectOf(quiz.subject).icon}</span>
              <span class="search-q">${rich(splitQuestion(q).text)}</span>
              <span class="muted small">${esc(quiz.title)}</span>
            </a></li>`).join('')}
        </ul>
        ${found.length > SEARCH_PREVIEW ? `<p class="muted small center">Showing ${SEARCH_PREVIEW} of ${found.length}. Practise them all with the card above.</p>` : ''}` : ''}`;
  }

  function renderModeSelect(quiz) {
    const opts = store.get('options', { shuffleQuestions: false, shuffleOptions: true });
    const count = quiz.pickCount || quiz.questions.length;
    app.innerHTML = `
      <a href="#/" class="back-link">${icons.back} Back to quizzes</a>
      <div class="card mode-card">
        <span class="badge badge-${quiz.subject}">${speedSubjectOf(quiz.subject).icon}</span>
        <h1>${esc(quiz.title)}</h1>
        <p class="muted">${esc(quiz.description)}</p>
        <div class="meta center">
          <span>${icons.list}${count} questions</span>
          <span>${icons.clock}${estTime(count)}</span>
        </div>
        <h2 class="mode-q">How would you like to take this quiz?</h2>
        <div class="mode-grid">
          <button class="mode-btn" data-mode="step">
            <strong>One by One</strong>
            <span class="muted">See the answer &amp; explanation after each question</span>
          </button>
          <button class="mode-btn" data-mode="full">
            <strong>Full Quiz</strong>
            <span class="muted">Answer all questions, then see your score &amp; explanations at the end</span>
          </button>
        </div>
        <div class="toggles">
          ${quiz.random ? '' : `<label class="toggle"><input type="checkbox" id="opt-sq" ${opts.shuffleQuestions ? 'checked' : ''}/> Shuffle question order</label>`}
          <label class="toggle"><input type="checkbox" id="opt-so" ${opts.shuffleOptions ? 'checked' : ''}/> Shuffle answer options</label>
        </div>
      </div>`;

    app.querySelectorAll('[data-mode]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const sq = app.querySelector('#opt-sq');
        const next = { shuffleQuestions: sq ? sq.checked : opts.shuffleQuestions, shuffleOptions: app.querySelector('#opt-so').checked };
        store.set('options', next);
        startQuiz(quiz, btn.dataset.mode, next);
      }));
  }

  // ---------- quiz session ----------
  let session = null;
  let timerId = null;

  function prepareQuestion(q, shuffleOpts) {
    const order = q.options.map((_, i) => i);
    const perm = shuffleOpts ? shuffle(order) : order;
    return {
      ...q,
      options: perm.map((i) => q.options[i]),
      wrongExplanations: perm.map((i) => q.wrongExplanations[i] || ''),
      correctIndex: perm.indexOf(q.correctIndex),
      source: q,
    };
  }

  function startQuiz(quiz, mode, opts, onlyQuestions) {
    let qs = onlyQuestions || quiz.questions;
    if (quiz.random && !onlyQuestions) qs = shuffle(qs).slice(0, quiz.pickCount);
    else if (opts.shuffleQuestions) qs = shuffle(qs);
    session = {
      quiz, mode, opts,
      retry: !!onlyQuestions,
      questions: qs.map((q) => prepareQuestion(q, opts.shuffleOptions)),
      answers: new Array(qs.length).fill(null),
      index: 0,
      startedAt: Date.now(),
      finishedAt: null,
    };
    clearInterval(timerId);
    timerId = setInterval(() => {
      const el = document.getElementById('timer');
      if (el && session && !session.finishedAt) el.textContent = fmtClock(Date.now() - session.startedAt);
    }, 1000);
    renderQuestion();
  }

  function renderQuestion() {
    const s = session;
    const q = s.questions[s.index];
    const n = s.questions.length;
    const chosen = s.answers[s.index];
    const revealed = s.mode === 'step' && chosen != null;
    const answeredCount = s.answers.filter((a) => a != null).length;
    const { text, code } = splitQuestion(q);

    const optionHtml = q.options.map((opt, i) => {
      let cls = '';
      if (revealed) {
        if (i === q.correctIndex) cls = 'correct';
        else if (i === chosen) cls = 'wrong';
        else cls = 'dim';
      } else if (i === chosen) cls = 'selected';
      const mark = revealed && i === q.correctIndex ? icons.check : revealed && i === chosen ? icons.x : LETTERS[i];
      return `<button class="option ${cls}" data-opt="${i}" ${revealed ? 'disabled' : ''}>
          <span class="letter">${mark}</span><span class="opt-text">${rich(opt)}</span></button>`;
    }).join('');

    let feedback = '';
    if (revealed) {
      const ok = chosen === q.correctIndex;
      feedback = `
        <div class="feedback ${ok ? 'ok' : 'bad'}">
          <div class="feedback-title">${ok ? icons.check + ' Correct!' : icons.x + ' Not quite'}</div>
          ${!ok && q.wrongExplanations[chosen] ? `<p><strong>Why your answer is wrong:</strong> ${rich(q.wrongExplanations[chosen])}</p>` : ''}
          <p><strong>Explanation:</strong> ${rich(q.explanation)}</p>
        </div>`;
    }

    const isLast = s.index === n - 1;
    let nav;
    if (s.mode === 'step') {
      nav = `<div></div><button class="btn primary" id="next" ${revealed ? '' : 'disabled'}>${isLast ? 'See results' : 'Next question'}</button>`;
    } else {
      nav = `
        <button class="btn" id="prev" ${s.index === 0 ? 'disabled' : ''}>Previous</button>
        ${isLast ? `<button class="btn primary" id="submit">Submit quiz</button>` : `<button class="btn primary" id="next">Next</button>`}`;
    }

    const dots = s.mode === 'full' ? `
      <div class="dots">${s.questions.map((_, i) =>
        `<button class="dot ${i === s.index ? 'current' : ''} ${s.answers[i] != null ? 'answered' : ''}" data-goto="${i}" title="Question ${i + 1}">${i + 1}</button>`).join('')}
      </div>` : '';

    app.innerHTML = `
      <div class="quiz-head">
        <a href="#/quiz/${s.quiz.id}" class="back-link">${icons.back} Quit</a>
        <span class="quiz-title">${esc(s.quiz.title)}${s.retry ? ' · retry' : ''}</span>
        <span class="timer">${icons.clock}<span id="timer">${fmtClock(Date.now() - s.startedAt)}</span></span>
      </div>
      <div class="progress-row muted">
        <span>Question ${s.index + 1} of ${n}</span>
        <span>${s.mode === 'step' ? `${s.answers.filter((a, i) => a != null && a === s.questions[i].correctIndex).length} correct` : `${answeredCount} answered`}</span>
      </div>
      <div class="progress"><div style="width:${((s.mode === 'step' ? answeredCount : s.index + 1) / n) * 100}%"></div></div>
      <div class="card question-card">
        <div class="q-top"><span class="muted small">1 mark</span></div>
        <h2 class="q-text">${rich(text)}</h2>
        ${code ? codeBlock(code, q) : ''}
        <div class="options">${optionHtml}</div>
        ${feedback}
        <p class="unanswered-warning" id="warn" hidden></p>
        <div class="nav-row">${nav}</div>
      </div>
      ${dots}
      <p class="muted small hint">Tip: press 1–${q.options.length} or A–${LETTERS[q.options.length - 1]} to answer, Enter / → for next${s.mode === 'full' ? ', ← for previous' : ''}.</p>`;

    app.querySelectorAll('[data-opt]').forEach((b) => b.addEventListener('click', () => choose(+b.dataset.opt)));
    app.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => { s.index = +b.dataset.goto; renderQuestion(); }));
    const next = app.querySelector('#next'); if (next) next.addEventListener('click', goNext);
    const prev = app.querySelector('#prev'); if (prev) prev.addEventListener('click', goPrev);
    const submit = app.querySelector('#submit'); if (submit) submit.addEventListener('click', trySubmit);
    if (revealed) app.querySelector('.feedback').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function choose(i) {
    const s = session;
    if (s.mode === 'step' && s.answers[s.index] != null) return;
    s.answers[s.index] = i;
    renderQuestion();
  }

  function goNext() {
    const s = session;
    if (s.mode === 'step' && s.answers[s.index] == null) return;
    if (s.index < s.questions.length - 1) { s.index++; renderQuestion(); window.scrollTo({ top: 0 }); }
    else if (s.mode === 'step') finish();
    else trySubmit();
  }

  function goPrev() {
    if (session.mode === 'full' && session.index > 0) { session.index--; renderQuestion(); }
  }

  let confirmSubmit = false;
  function trySubmit() {
    const missing = session.answers.filter((a) => a == null).length;
    if (missing && !confirmSubmit) {
      confirmSubmit = true;
      const w = app.querySelector('#warn');
      w.hidden = false;
      w.textContent = `You have ${missing} unanswered question${missing === 1 ? '' : 's'} (shown as plain numbers below). Press Submit again to finish anyway.`;
      return;
    }
    confirmSubmit = false;
    finish();
  }

  function finish() {
    const s = session;
    s.finishedAt = Date.now();
    clearInterval(timerId);
    const total = s.questions.length;
    const marks = s.answers.filter((a, i) => a === s.questions[i].correctIndex).length;
    const pct = Math.round((marks / total) * 100);
    recordResults(s.questions.map((q, i) => ({ q, ok: s.answers[i] === q.correctIndex })));
    if (!s.retry && !s.quiz.random) {
      const best = store.get('best', {});
      if (best[s.quiz.id] == null || pct > best[s.quiz.id]) { best[s.quiz.id] = pct; store.set('best', best); }
    }
    renderResults(marks, total, pct);
  }

  function renderResults(marks, total, pct, filter = 'all') {
    const s = session;
    const wrong = s.questions.filter((q, i) => s.answers[i] !== q.correctIndex);
    const msg = pct === 100 ? 'Perfect score!' : pct >= 80 ? 'Great job!' : pct >= 50 ? 'Good effort — keep practising.' : 'Keep going — review the explanations below.';

    const review = s.questions.map((q, i) => {
      const a = s.answers[i];
      if (filter === 'wrong' && a === q.correctIndex) return '';
      return reviewCard(q, a, i + 1);
    }).join('');

    app.innerHTML = `
      <div class="card result-card">
        <div class="ring" style="--pct:${pct}"><span>${pct}%</span></div>
        <h1>${msg}</h1>
        <p class="muted">You scored ${pct}% • ${marks} mark${marks !== 1 ? 's' : ''} out of ${total} • time ${fmtClock(s.finishedAt - s.startedAt)}</p>
        <div class="result-actions">
          <button class="btn primary" id="again">${icons.shuffle} Retake quiz</button>
          ${wrong.length && wrong.length < total ? `<button class="btn" id="retry-wrong">Retry ${wrong.length} wrong</button>` : ''}
          <a class="btn" href="#/">All quizzes</a>
        </div>
      </div>
      <div class="review-bar">
        <h2>Detailed Review</h2>
        <div class="seg">
          <button class="${filter === 'all' ? 'active' : ''}" data-filter="all">All (${total})</button>
          <button class="${filter === 'wrong' ? 'active' : ''}" data-filter="wrong">Incorrect (${wrong.length})</button>
        </div>
      </div>
      ${review || '<p class="muted center">Nothing to show — every answer was correct.</p>'}`;

    app.querySelector('#again').addEventListener('click', () => startQuiz(s.quiz, s.mode, s.opts));
    const rw = app.querySelector('#retry-wrong');
    if (rw) rw.addEventListener('click', () => startQuiz(s.quiz, s.mode, s.opts, wrong.map((q) => q.source)));
    app.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => renderResults(marks, total, pct, b.dataset.filter)));
  }

  // One question in a results review. `a` is the chosen option index, or null if unanswered.
  function reviewCard(q, a, n) {
    const ok = a === q.correctIndex;
    const { text, code } = splitQuestion(q);
    return `
        <div class="card review-item ${ok ? 'ok' : 'bad'}">
          <div class="review-head">
            <span class="status">${ok ? icons.check : icons.x}</span>
            <h3>Q${n}. ${rich(text)}</h3>
          </div>
          ${code ? codeBlock(code, q) : ''}
          <ul class="review-options">
            ${q.options.map((o, j) => `<li class="${j === q.correctIndex ? 'correct' : j === a ? 'wrong' : ''}"><span class="letter">${LETTERS[j]}</span><span>${rich(o)}</span>${j === q.correctIndex ? '<em>correct answer</em>' : j === a ? '<em>your answer</em>' : ''}</li>`).join('')}
          </ul>
          ${a == null ? '<p class="muted small">You did not answer this question.</p>' : ''}
          ${!ok && a != null && q.wrongExplanations[a] ? `<p class="why"><strong>Why your answer is wrong:</strong> ${rich(q.wrongExplanations[a])}</p>` : ''}
          <p class="explain"><strong>Explanation:</strong> ${rich(q.explanation)}</p>
        </div>`;
  }

  // ---------- speedrun ----------
  const SPRINT_SIZE = 20, SPRINT_PENALTY = 5, ATTACK_SECONDS = 60, ATTACK_PENALTY = 3, SURVIVAL_SECONDS = 15;
  const SPEED_MODES = {
    sprint: { name: 'Sprint', blurb: `Answer ${SPRINT_SIZE} questions as fast as you can. Every wrong answer adds a ${SPRINT_PENALTY}s penalty. Lowest time wins.` },
    attack: { name: 'Time Attack', blurb: `${ATTACK_SECONDS} seconds on the clock. Get as many right as you can — each wrong answer costs ${ATTACK_PENALTY}s.` },
    survival: { name: 'Sudden Death', blurb: `How long a streak can you build? One wrong answer ends the run, and you get ${SURVIVAL_SECONDS}s per question.` },
  };
  const speedSubjects = [...subjects, { id: 'all', name: 'All subjects', icon: '★' }];
  const speedSubjectOf = (id) => speedSubjects.find((s) => s.id === id);
  const fmtRun = (ms) => { ms = Math.max(0, ms); return fmtClock(ms) + '.' + Math.floor((ms % 1000) / 100); };
  const fmtBest = (mode, v) => mode === 'sprint' ? fmtRun(v) : v + (mode === 'attack' ? ' correct' : ' streak');

  // Every question for a subject (or 'all') with the quiz it came from, with the original site's repeated questions removed.
  const qKey = (q) => q.question + '\n' + (q.code || '');
  function uniqueQuestions(subjectId) {
    const seen = new Set();
    return quizzes.filter((z) => subjectId === 'all' || z.subject === subjectId).flatMap((quiz) => quiz.questions.map((q) => ({ q, quiz })))
      .filter(({ q }) => { const k = qKey(q); return !seen.has(k) && seen.add(k); });
  }
  const speedPool = (subjectId) => uniqueQuestions(subjectId).map((x) => x.q);

  let run = null;
  let runTimer = null;
  function stopRun() {
    clearInterval(runTimer);
    if (run) clearTimeout(run.pending);
    run = null;
  }

  function renderSpeedHome() {
    const sel = store.get('speed-subject', store.get('subject', 'python'));
    const subject = speedSubjectOf(sel) || speedSubjects[0];
    const bests = store.get('speedrun', {});
    const poolSize = speedPool(subject.id).length;
    app.innerHTML = `
      <a href="#/" class="back-link">${icons.back} Back to quizzes</a>
      <section class="hero">
        <h1>Speedrun</h1>
        <p class="muted">Race the clock. Personal bests are saved on this device.</p>
      </section>
      <nav class="tabs" role="tablist">
        ${speedSubjects.map((s) => `
          <button role="tab" class="tab ${s.id === subject.id ? 'active' : ''}" data-speed-subject="${s.id}" aria-selected="${s.id === subject.id}">
            <span class="badge badge-${s.id}">${s.icon}</span>
            <span>${s.name}</span>
          </button>`).join('')}
      </nav>
      <p class="muted subject-blurb">${poolSize} questions in the ${esc(subject.name)} pool, shuffled every run.</p>
      <div class="grid">
        ${Object.entries(SPEED_MODES).map(([id, m]) => {
          const b = bests[id + ':' + subject.id];
          return `
          <a class="card quiz-card speed-mode" href="#/speedrun/${id}/${subject.id}">
            <div class="quiz-card-top">
              <h3>${icons.bolt} ${m.name}</h3>
              ${b != null ? `<span class="pill good" title="Personal best">Best ${fmtBest(id, b)}</span>` : ''}
            </div>
            <p class="muted">${m.blurb}</p>
          </a>`;
        }).join('')}
      </div>`;
    app.querySelectorAll('[data-speed-subject]').forEach((btn) =>
      btn.addEventListener('click', () => { store.set('speed-subject', btn.dataset.speedSubject); renderSpeedHome(); }));
  }

  function startRun(mode, subjectId) {
    run = {
      mode, subjectId,
      pool: shuffle(speedPool(subjectId)), next: 0,
      q: null, answered: 0, correct: 0, missed: [], penalty: 0,
      startedAt: 0, qStartedAt: 0, endedAt: null, locked: true, pending: null,
    };
    countdown(3);
  }

  function countdown(n) {
    app.innerHTML = `
      <div class="card center speed-countdown">
        <p class="muted">${SPEED_MODES[run.mode].name} · ${esc(speedSubjectOf(run.subjectId).name)}</p>
        <div class="count">${n || 'Go!'}</div>
      </div>`;
    run.pending = setTimeout(() => (n ? countdown(n - 1) : beginRun()), n ? 700 : 400);
  }

  function beginRun() {
    const m = SPEED_MODES[run.mode];
    app.innerHTML = `
      <div class="quiz-head">
        <a href="#/speedrun" class="back-link">${icons.back} Quit</a>
        <span class="quiz-title">${m.name} · ${esc(speedSubjectOf(run.subjectId).name)}</span>
        <span class="timer run-clock">${icons.clock}<span id="run-clock"></span></span>
      </div>
      <div class="progress-row muted">
        <span id="run-left"></span>
        <span class="speed-flash" id="run-flash"></span>
        <span id="run-right"></span>
      </div>
      <div class="progress" id="run-progress"><div id="run-bar"></div></div>
      <div class="card question-card" id="run-q"></div>
      <p class="muted small hint">Tip: press 1–4 or A–D to answer.</p>`;
    run.startedAt = performance.now();
    nextQuestion();
    runTimer = setInterval(tickRun, 100);
  }

  function nextQuestion() {
    if (run.next >= run.pool.length) {
      if (run.mode === 'survival') return finishRun(true);
      run.pool = shuffle(run.pool);
      run.next = 0;
    }
    run.q = prepareQuestion(run.pool[run.next++], true);
    run.qStartedAt = performance.now();
    run.locked = false;
    const q = run.q;
    const { text, code } = splitQuestion(q);
    app.querySelector('#run-q').innerHTML = `
      <h2 class="q-text">${rich(text)}</h2>
      ${code ? codeBlock(code, q) : ''}
      <div class="options">${q.options.map((opt, i) =>
        `<button class="option" data-run-opt="${i}"><span class="letter">${LETTERS[i]}</span><span class="opt-text">${rich(opt)}</span></button>`).join('')}
      </div>`;
    app.querySelectorAll('[data-run-opt]').forEach((b) => b.addEventListener('click', () => answerRun(+b.dataset.runOpt)));
    tickRun();
  }

  // Clock, status text and progress bar. Also ends the run when time is up.
  function tickRun() {
    if (!run || !run.startedAt) return;
    const now = run.endedAt ?? performance.now();
    const elapsed = now - run.startedAt;
    let clock, left, right, pct;
    if (run.mode === 'sprint') {
      clock = fmtRun(elapsed + run.penalty);
      left = `Question ${Math.min(run.answered + 1, SPRINT_SIZE)} of ${SPRINT_SIZE}`;
      right = run.penalty ? `+${run.penalty / 1000}s penalty` : `${run.correct} correct`;
      pct = (run.answered / SPRINT_SIZE) * 100;
    } else if (run.mode === 'attack') {
      const remaining = ATTACK_SECONDS * 1000 - elapsed - run.penalty;
      if (remaining <= 0 && !run.endedAt) return finishRun();
      clock = fmtRun(remaining);
      left = `${run.correct} correct`;
      right = `${run.missed.length} wrong`;
      pct = (remaining / (ATTACK_SECONDS * 1000)) * 100;
    } else {
      const qLeft = SURVIVAL_SECONDS * 1000 - (now - run.qStartedAt);
      if (qLeft <= 0 && !run.locked) return answerRun(null);
      clock = fmtRun(elapsed);
      left = `Streak ${run.correct}`;
      right = run.locked ? '' : `${Math.ceil(Math.max(0, qLeft) / 1000)}s left`;
      if (!run.locked) pct = (qLeft / (SURVIVAL_SECONDS * 1000)) * 100;
    }
    app.querySelector('#run-clock').textContent = clock;
    app.querySelector('#run-left').textContent = left;
    app.querySelector('#run-right').textContent = right;
    if (pct != null) {
      app.querySelector('#run-bar').style.width = Math.max(0, pct) + '%';
      app.querySelector('#run-progress').classList.toggle('low', run.mode !== 'sprint' && pct < 25);
    }
  }

  // `i` is the chosen option index, or null when the Sudden Death timer runs out.
  function answerRun(i) {
    if (!run || run.locked) return;
    run.locked = true;
    const q = run.q;
    const ok = i === q.correctIndex;
    run.answered++;
    recordResults([{ q, ok }]);
    let flash;
    if (ok) {
      run.correct++;
      flash = '+1';
    } else {
      run.missed.push({ q, chosen: i });
      if (run.mode === 'sprint') { run.penalty += SPRINT_PENALTY * 1000; flash = `+${SPRINT_PENALTY}s`; }
      else if (run.mode === 'attack') { run.penalty += ATTACK_PENALTY * 1000; flash = `−${ATTACK_PENALTY}s`; }
      else flash = i == null ? "Time's up!" : 'Out!';
    }
    app.querySelectorAll('[data-run-opt]').forEach((b) => {
      const j = +b.dataset.runOpt;
      b.disabled = true;
      b.classList.add(j === q.correctIndex ? 'correct' : j === i ? 'wrong' : 'dim');
    });
    const f = app.querySelector('#run-flash');
    f.textContent = flash;
    f.className = 'speed-flash ' + (ok ? 'ok' : 'bad');
    void f.offsetWidth; // restart the animation for back-to-back answers
    f.classList.add('show');

    const done = (run.mode === 'sprint' && run.answered >= SPRINT_SIZE) || (run.mode === 'survival' && !ok);
    if (done) run.endedAt = performance.now();
    tickRun();
    run.pending = setTimeout(() => (done ? finishRun() : nextQuestion()), ok ? 250 : 900);
  }

  function finishRun(cleared = false) {
    clearInterval(runTimer);
    clearTimeout(run.pending);
    const r = run;
    r.endedAt = r.endedAt ?? performance.now();
    r.locked = true;
    const elapsed = r.endedAt - r.startedAt;
    const value = r.mode === 'sprint' ? Math.round(elapsed + r.penalty) : r.correct;
    const key = r.mode + ':' + r.subjectId;
    const bests = store.get('speedrun', {});
    const prev = bests[key];
    const isBest = (r.mode === 'sprint' || value > 0) && (prev == null || (r.mode === 'sprint' ? value < prev : value > prev));
    if (isBest) { bests[key] = value; store.set('speedrun', bests); }

    const m = SPEED_MODES[r.mode];
    let headline, stats;
    if (r.mode === 'sprint') {
      headline = fmtRun(value);
      stats = `${r.correct}/${SPRINT_SIZE} correct · ${r.missed.length} × ${SPRINT_PENALTY}s penalty · ${(value / SPRINT_SIZE / 1000).toFixed(1)}s per question`;
    } else if (r.mode === 'attack') {
      headline = `${r.correct} correct`;
      stats = `${r.answered} answered · ${r.answered ? Math.round((r.correct / r.answered) * 100) : 0}% accuracy`;
    } else {
      headline = `${r.correct} streak`;
      stats = cleared ? 'You cleared every question in the pool!' : `${r.answered} answered in ${fmtRun(elapsed)}`;
    }
    const title = isBest ? (prev == null ? 'First run on the board!' : 'New personal best!') : prev != null ? `Personal best: ${fmtBest(r.mode, prev)}` : 'Run complete';

    app.innerHTML = `
      <div class="card result-card">
        <p class="muted">${m.name} · ${esc(speedSubjectOf(r.subjectId).name)}</p>
        <div class="speed-score">${headline}</div>
        <h1>${title}</h1>
        <p class="muted">${stats}</p>
        <div class="result-actions">
          <a class="btn primary" href="#/speedrun/${r.mode}/${r.subjectId}">${icons.bolt} Run again</a>
          <a class="btn" href="#/speedrun">Change mode</a>
          <a class="btn" href="#/">All quizzes</a>
        </div>
      </div>
      ${r.missed.length ? `
        <div class="review-bar"><h2>Missed questions (${r.missed.length})</h2></div>
        ${r.missed.map((x, n) => reviewCard(x.q, x.chosen, n + 1)).join('')}` : ''}`;
    run = null;
  }

  // ---------- doomscroll ----------
  // An endless, snap-scrolling feed. js/adaptive.js decides which question comes next (from the player's skill,
  // topic mastery and missed concepts) and does the scoring; this section renders reels and handles input.
  // Reels are picked only a couple ahead of the current one, so the feed keeps adapting as you answer.
  const Adaptive = window.Adaptive;
  const SCROLL_AHEAD = 2, SCROLL_BREAK_EVERY = 25;
  // Auto-scroll delay after answering; wrong answers wait longer so there's time to read why.
  const SCROLL_AUTO_OK_MS = 2500, SCROLL_AUTO_BAD_MS = 6000;
  const SCROLL_FEEDS = [...speedSubjects, { id: 'saved', name: 'Saved', icon: '♥' }];
  const BREAK_QUIPS = [
    'Your posture called. It would like a word.',
    'Blink twice. Drink some water. Then one more. Just one.',
    'Touch grass? Grass doesn\'t come with explanations.',
    'Still the most productive doomscroll on the internet.',
    'Your streak is proud of you. Your neck is not.',
  ];
  const EVENTS = {
    boss: { icon: '👑', name: 'Boss Post', blurb: 'One of the toughest questions in the bank. ×3 points.' },
    hot: { icon: '🔥', name: 'Hot Streak', blurb: `Get this right and your next ${Adaptive.TUNING.HOT_LEN} correct answers score double.` },
    comeback: { icon: '↩', name: 'Comeback', blurb: 'Get this right to win back half of the combo you just lost.' },
    check: { icon: '🎯', name: 'Knowledge Check', blurb: 'You missed this topic earlier. Here\'s another question on it. ×1.5 points.' },
    mystery: { icon: '❔', name: 'Mystery Post', blurb: 'Topic hidden, ×2 points. Clues help, but each one costs ×0.5.' },
    quick: { icon: '⚡', name: 'Quick Take', blurb: 'True or false?' },
  };
  const MILESTONE_TEXT = {
    answered: (n) => `${n} questions answered`,
    combo: (n) => `${n} in a row`,
    score: (n) => `${n.toLocaleString()} points`,
  };
  const fmtNum = (n) => n.toLocaleString();

  let feed = null;
  function stopFeed() {
    if (feed) { feed.observer.disconnect(); cancelAutoScroll(); }
    feed = null;
    document.body.classList.remove('doomscroll');
  }
  const savedKeys = () => new Set(store.get('saved', []));
  const setTopbarHeight = () => document.documentElement.style.setProperty('--topbar-h', document.querySelector('.topbar').offsetHeight + 'px');
  window.addEventListener('resize', () => { if (feed) setTopbarHeight(); });

  // `popquiz-scroll` holds { best: best streak, bestScore: { <feed>: score } }.
  function scrollStats() {
    const raw = store.get('scroll', {});
    const s = raw && typeof raw === 'object' ? raw : {};
    const bestScore = s.bestScore && typeof s.bestScore === 'object' ? s.bestScore : {};
    return { best: Number.isFinite(s.best) ? s.best : 0, bestScore };
  }
  const saveSession = () => store.set('scroll-session', { ...feed.session, at: Date.now() });

  function startFeed(feedId) {
    store.set('scroll-subject', feedId);
    const saved = savedKeys();
    const entries = feedId === 'saved' ? uniqueQuestions('all').filter(({ q }) => saved.has(qKey(q))) : uniqueQuestions(feedId);
    const session = Adaptive.sanitizeSession(store.get('scroll-session', null), feedId, Date.now());
    document.body.classList.add('doomscroll');
    setTopbarHeight();
    app.innerHTML = `
      <div class="scroll-view">
        <div class="feed-bar">
          <nav class="feed-chips">
            ${SCROLL_FEEDS.map((s) => `<a class="chip ${s.id === feedId ? 'active' : ''}" href="#/scroll/${s.id}">${esc(s.icon)} ${s.name}${s.id === 'saved' ? ` <span class="tab-count">${saved.size}</span>` : ''}</a>`).join('')}
          </nav>
          <div class="feed-side">
            <div class="feed-stats small" id="feed-stats"></div>
            <button class="chip" id="feed-recap" title="Session recap" aria-label="Session recap">${icons.list}<span class="lbl">Recap</span></button>
            <button class="chip" id="feed-auto" title="Scroll to the next question after answering"></button>
          </div>
        </div>
        <div class="momentum" id="momentum"><span></span></div>
        <div class="feed" id="feed" tabindex="-1"></div>
      </div>`;
    const el = app.querySelector('#feed');
    feed = {
      id: feedId, el, pool: Adaptive.buildPool(entries), strict: feedId === 'saved', shownAll: new Set(),
      rng: Adaptive.mulberry32((Date.now() ^ (Math.random() * 2 ** 32)) >>> 0),
      profile: Adaptive.sanitizeProfile(store.get('scroll-profile', null)),
      session: session || Adaptive.newSession(feedId), resumed: !!(session && session.answered),
      items: [], current: null, done: false,
      auto: store.get('scroll-auto', true), autoTimer: null,
      // A reel is "current" while it crosses the middle of the feed.
      observer: new IntersectionObserver((list) => {
        for (const e of list) if (e.isIntersecting) onReelVisible(e.target);
      }, { root: el, rootMargin: '-50% 0px -50% 0px' }),
    };
    el.addEventListener('click', onFeedClick);
    el.addEventListener('dblclick', onFeedDblClick);
    // Opening "Explain more" means you're reading: don't scroll away.
    el.addEventListener('toggle', (e) => { if (e.target.open) cancelAutoScroll(); }, true);
    app.querySelector('#feed-recap').addEventListener('click', showRecap);
    app.querySelector('#feed-auto').addEventListener('click', () => {
      feed.auto = !feed.auto;
      store.set('scroll-auto', feed.auto);
      if (!feed.auto) cancelAutoScroll();
      renderAutoToggle();
    });
    renderAutoToggle();
    if (!feed.pool.length) {
      el.innerHTML = `<section class="reel"><div class="card reel-card break-card">
        <div class="big">${icons.heart}</div><h2>Nothing saved yet</h2>
        <p class="muted">Tap the heart (or double-tap a question) to save it here for later.</p>
        <a class="btn primary" href="#/scroll/all">Start scrolling</a></div></section>`;
    } else {
      ensureAhead();
    }
    updateFeedStats();
    el.focus({ preventScroll: true });
  }

  // Keeps SCROLL_AHEAD reels queued after the current one.
  function ensureAhead() {
    const f = feed;
    const cur = f.current ? [...f.el.children].indexOf(f.current) : 0;
    while (!f.done && f.el.children.length - 1 - cur < SCROLL_AHEAD) appendReel();
  }

  function appendReel() {
    const f = feed;
    const pick = Adaptive.pickNext(f.pool, f.profile, f.session, f.rng, f.strict ? { exclude: f.shownAll, strict: true } : {});
    if (!pick) {
      f.done = true;
      f.el.insertAdjacentHTML('beforeend', `<section class="reel"><div class="card reel-card break-card">
        <div class="big">${icons.check}</div><h2>You're all caught up</h2>
        <p class="muted">That's every saved question.</p>
        <div class="result-actions"><a class="btn primary" href="#/scroll/saved">${icons.shuffle} Go again</a><button class="btn" data-recap>Session recap</button></div>
        </div></section>`);
      return;
    }
    f.shownAll.add(pick.item.key);
    const it = { ...pick, q: prepareQuestion(pick.item.q, true), chosen: null, shownAt: 0, clues: 0 };
    if (it.event === 'quick') it.quick = Adaptive.makeQuickTake(it.q, f.rng);
    f.items.push(it);
    let html = reelHtml(f.items.length - 1);
    if (f.items.length % SCROLL_BREAK_EVERY === 0) {
      const k = f.items.length / SCROLL_BREAK_EVERY;
      html += `<section class="reel"><div class="card reel-card break-card">
        <div class="big">${icons.phone}</div><h2>${f.items.length} questions deep</h2>
        <p class="muted">${BREAK_QUIPS[(k - 1) % BREAK_QUIPS.length]}</p>
        <div class="result-actions"><button class="btn" data-recap>${icons.list} How am I doing?</button></div>
        <p class="muted small swipe-hint">Keep scrolling ${icons.down}</p></div></section>`;
    }
    f.el.insertAdjacentHTML('beforeend', html);
    f.el.querySelectorAll('.reel:not([data-watched])').forEach((r) => { r.dataset.watched = ''; f.observer.observe(r); });
  }

  const pips = (d) => `<span class="diff" title="Difficulty ${d} / 5" aria-label="Difficulty ${d} of 5">${[1, 2, 3, 4, 5].map((n) => `<i class="${d >= n ? 'on' : d >= n - 0.5 ? 'half' : ''}"></i>`).join('')}</span>`;

  function masteryHtml(topicId) {
    const m = Adaptive.masteryOf(feed.profile, topicId);
    if (m == null) return '';
    const pct = Math.round(m * 100);
    return `<span class="mastery" title="Topic mastery ${pct}%" aria-label="Topic mastery ${pct}%"><span style="width:${pct}%"></span></span>`;
  }

  const topicHtml = (quiz) => `<span class="badge badge-${quiz.subject}">${subjectOf(quiz.subject).icon}</span>
    <a class="muted small" href="#/quiz/${quiz.id}">${esc(quiz.title)}</a>${masteryHtml(quiz.id)}`;

  function reelHtml(i) {
    const it = feed.items[i];
    const { q, item } = it;
    const ev = it.event && EVENTS[it.event];
    const { text, code } = splitQuestion(q);
    const saved = savedKeys().has(qKey(q.source));
    const options = it.quick ? ['True', 'False'] : q.options;
    return `
      <section class="reel ${it.event ? 'event-' + it.event : ''}" data-reel="${i}">
        <div class="card reel-card">
          ${ev ? `<div class="event-banner"><span class="event-icon" aria-hidden="true">${ev.icon}</span><div><strong>${ev.name}</strong><span class="muted small" data-event-blurb>${esc(ev.blurb)}</span></div></div>` : ''}
          <div class="reel-meta">
            <span class="reel-topic" data-topic>${it.event === 'mystery' ? '<span class="badge badge-mystery">?</span><span class="muted small">Topic hidden</span>' : topicHtml(item.quiz)}</span>
            ${pips(item.d)}
          </div>
          <h2 class="q-text">${rich(text)}</h2>
          ${code ? codeBlock(code, q) : ''}
          ${it.quick ? `<p class="quick-claim">The answer is <strong>${rich(q.options[it.quick.claim])}</strong></p>` : ''}
          <div class="options ${it.quick ? 'two-up' : ''}">${options.map((opt, j) =>
            `<button class="option" data-feed-opt="${j}"><span class="letter">${it.quick ? opt[0] : LETTERS[j]}</span><span class="opt-text">${it.quick ? opt : rich(opt)}</span></button>`).join('')}
          </div>
          ${it.event === 'mystery' ? `<div class="clues"><span class="muted small">Clues:</span>
            <button class="chip" data-clue="topic">Reveal topic</button>
            ${q.options.length > 2 ? '<button class="chip" data-clue="cut">Remove a wrong answer</button>' : ''}</div>` : ''}
          <div class="reel-feedback" aria-live="polite"></div>
        </div>
        <div class="reel-rail">
          <button class="rail-btn ${saved ? 'on' : ''}" data-save title="Save (S)" aria-pressed="${saved}">${icons.heart}<span>${saved ? 'Saved' : 'Save'}</span></button>
          <button class="rail-btn" data-step title="Next (↓)">${icons.down}<span>Next</span></button>
        </div>
      </section>`;
  }

  function onReelVisible(reel) {
    if (reel !== feed.current) cancelAutoScroll();
    feed.current = reel;
    const it = reel.dataset.reel != null && feed.items[+reel.dataset.reel];
    if (it && !it.shownAt) it.shownAt = performance.now();
    ensureAhead();
  }

  function onFeedClick(e) {
    if (e.target.closest('[data-recap]')) return showRecap();
    const reel = e.target.closest('.reel');
    if (!reel || reel.dataset.reel == null) return;
    const opt = e.target.closest('[data-feed-opt]');
    const clue = e.target.closest('[data-clue]');
    if (opt) answerReel(reel, +opt.dataset.feedOpt);
    else if (clue) useClue(reel, clue);
    else if (e.target.closest('[data-save]')) toggleSave(reel);
    else if (e.target.closest('[data-step]')) stepFeed(1, reel);
    else if (e.target.closest('[data-stay]')) cancelAutoScroll();
  }

  function renderAutoToggle() {
    const btn = app.querySelector('#feed-auto');
    btn.classList.toggle('active', feed.auto);
    btn.setAttribute('aria-pressed', feed.auto);
    btn.setAttribute('aria-label', `Auto-scroll ${feed.auto ? 'on' : 'off'}`);
    btn.innerHTML = `${icons.down}<span class="lbl">Auto ${feed.auto ? 'on' : 'off'}</span>`;
  }

  function startAutoScroll(reel, ms) {
    cancelAutoScroll();
    feed.autoTimer = setTimeout(() => {
      feed.autoTimer = null;
      reel.querySelector('.auto-hint')?.remove();
      if (feed.current === reel && !app.querySelector('.recap')) stepFeed(1, reel);
    }, ms);
  }

  // Stops a pending auto-scroll and puts the normal "scroll for the next one" hint back.
  function cancelAutoScroll() {
    if (!feed || !feed.autoTimer) return;
    clearTimeout(feed.autoTimer);
    feed.autoTimer = null;
    const hint = feed.el.querySelector('.auto-hint');
    if (hint) hint.outerHTML = `<p class="muted small swipe-hint">Scroll for the next one ${icons.down}</p>`;
  }

  // Double-tap a question to save it, like liking a post.
  function onFeedDblClick(e) {
    const reel = e.target.closest('.reel');
    if (!reel || reel.dataset.reel == null || e.target.closest('button, a, details')) return;
    window.getSelection()?.removeAllRanges();
    if (!reel.querySelector('[data-save]').classList.contains('on')) toggleSave(reel);
    const pop = document.createElement('span');
    pop.className = 'heart-pop';
    pop.innerHTML = icons.heart;
    reel.querySelector('.reel-card').appendChild(pop);
    pop.addEventListener('animationend', () => pop.remove());
  }

  function toggleSave(reel) {
    const key = qKey(feed.items[+reel.dataset.reel].q.source);
    const saved = store.get('saved', []);
    const on = !saved.includes(key);
    store.set('saved', on ? [...saved, key] : saved.filter((k) => k !== key));
    const btn = reel.querySelector('[data-save]');
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-pressed', on);
    btn.querySelector('span').textContent = on ? 'Saved' : 'Save';
    const count = app.querySelector('.chip[href="#/scroll/saved"] .tab-count');
    if (count) count.textContent = on ? saved.length + 1 : saved.length - 1;
  }

  // Mystery post clues: reveal the topic, or knock out one wrong answer. Each lowers the points multiplier.
  function useClue(reel, btn) {
    const it = feed.items[+reel.dataset.reel];
    if (it.chosen != null || btn.disabled) return;
    btn.disabled = true;
    it.clues++;
    if (btn.dataset.clue === 'topic') {
      reel.querySelector('[data-topic]').innerHTML = topicHtml(it.item.quiz);
    } else {
      const left = [...reel.querySelectorAll('[data-feed-opt]:not(:disabled)')].map((b) => +b.dataset.feedOpt).filter((j) => j !== it.q.correctIndex);
      const j = left[Math.floor(feed.rng() * left.length)];
      const b = reel.querySelector(`[data-feed-opt="${j}"]`);
      b.disabled = true;
      b.classList.add('cut');
    }
    reel.querySelector('[data-event-blurb]').textContent = `Clues used: ${it.clues}. Now worth ×${Adaptive.eventMultiplier('mystery', it.clues)} points.`;
  }

  function answerReel(reel, j) {
    const f = feed;
    const it = f.items[+reel.dataset.reel];
    const btn = reel.querySelector(`[data-feed-opt="${j}"]`);
    if (it.chosen != null || !btn || btn.disabled) return;
    it.chosen = j;
    const q = it.q;
    const correctIdx = it.quick ? (it.quick.isTrue ? 0 : 1) : q.correctIndex;
    const ok = j === correctIdx;
    const prevScoreBest = scrollStats().bestScore[f.id] || 0;
    const res = Adaptive.recordAnswer(f.profile, f.session, it, { correct: ok, ms: it.shownAt ? performance.now() - it.shownAt : 0 });
    // A right quick take ("false" to a wrong claim) doesn't show you know the answer, so it only ever adds a mistake.
    if (!it.quick || !ok) recordResults([{ q, ok }]);
    store.set('scroll-profile', f.profile);
    saveSession();
    const stats = scrollStats();
    const newBestStreak = f.session.combo > stats.best;
    const newBestScore = f.session.score > prevScoreBest;
    if (newBestStreak || newBestScore) {
      store.set('scroll', { ...stats, best: Math.max(stats.best, f.session.combo), bestScore: { ...stats.bestScore, [f.id]: Math.max(prevScoreBest, f.session.score) } });
    }

    reel.querySelectorAll('[data-feed-opt]').forEach((b) => {
      const k = +b.dataset.feedOpt;
      b.disabled = true;
      b.classList.add(k === correctIdx ? 'correct' : k === j ? 'wrong' : 'dim');
      if (k === correctIdx) b.querySelector('.letter').innerHTML = icons.check;
      else if (k === j) b.querySelector('.letter').innerHTML = icons.x;
    });
    reel.querySelectorAll('[data-clue]').forEach((b) => { b.disabled = true; });
    if (it.event === 'mystery' && !it.clues) reel.querySelector('[data-topic]').innerHTML = topicHtml(it.item.quiz);

    // For a quick take, "why your answer is wrong" is about the claimed option.
    const shown = it.quick ? it.quick.claim : j;
    const whyNot = !ok || (it.quick && !it.quick.isTrue) ? q.wrongExplanations[shown] : '';
    const { brief, more } = Adaptive.splitExplanation(q.explanation);
    const others = q.wrongExplanations.map((w, k) => (w && k !== shown && k !== q.correctIndex ? `<li><strong>${rich(q.options[k])}</strong>: ${rich(w)}</li>` : '')).join('');
    const notes = [
      res.restored ? `${icons.check} Comeback! Combo restored to ${res.combo}.` : '',
      res.learned ? `🎯 Concept relearned: ${esc(it.item.quiz.title)}.` : '',
      res.hotLit ? `🔥 Hot streak lit: your next ${Adaptive.TUNING.HOT_LEN} correct answers score double.` : '',
      !ok && it.event === 'hot' ? 'The hot streak fizzled. Another chance will come.' : '',
      !ok ? 'Noted. This topic will come back later as a knowledge check.' : '',
      ...res.milestones.map((m) => `🏅 Milestone: ${MILESTONE_TEXT[m.kind](m.value)}`),
      newBestScore && f.session.answered > 1 && prevScoreBest > 0 && res.points ? '⭐ New personal best score!' : '',
    ].filter(Boolean);
    const title = ok
      ? `${icons.check} ${res.combo > 2 ? `${res.combo} in a row!` : 'Correct!'} <span class="points">+${fmtNum(res.points)}</span>${res.multiplier > 1 ? `<span class="mult">×${res.multiplier} combo</span>` : ''}${res.hotApplied ? '<span class="mult hot">×2 hot</span>' : ''}`
      : `${icons.x} Not quite`;
    reel.querySelector('.reel-feedback').innerHTML = `
      <div class="feedback ${ok ? 'ok' : 'bad'}">
        <div class="feedback-title">${title}</div>
        ${it.quick ? `<p class="key">It's <strong>${it.quick.isTrue ? 'true' : 'false'}</strong>. The answer is <strong>${rich(q.options[q.correctIndex])}</strong>.</p>`
          : !ok ? `<p class="key"><strong>Answer:</strong> ${rich(q.options[q.correctIndex])}</p>` : ''}
        ${whyNot ? `<p><strong>Why not ${it.quick ? rich(q.options[shown]) : LETTERS[j]}:</strong> ${rich(whyNot)}</p>` : ''}
        <p>${rich(brief)}</p>
        ${more || others ? `<details class="more"><summary>Explain more</summary>${more ? `<p>${rich(more)}</p>` : ''}${others ? `<ul>${others}</ul>` : ''}</details>` : ''}
        ${notes.map((n) => `<p class="note">${n}</p>`).join('')}
      </div>
      ${f.auto
        ? `<div class="auto-hint"><div class="auto-bar"><span style="animation-duration:${ok ? SCROLL_AUTO_OK_MS : SCROLL_AUTO_BAD_MS}ms"></span></div>
            <p class="muted small">Next question coming up · <button class="link-btn" data-stay>Stay here</button></p></div>`
        : `<p class="muted small swipe-hint">Scroll for the next one ${icons.down}</p>`}`;

    const card = reel.querySelector('.reel-card');
    card.classList.remove('pop-ok', 'pop-bad');
    void card.offsetWidth;
    card.classList.add(ok ? 'pop-ok' : 'pop-bad');
    if (res.points) {
      const float = document.createElement('span');
      float.className = 'points-float';
      float.textContent = '+' + fmtNum(res.points);
      card.appendChild(float);
      float.addEventListener('animationend', () => float.remove());
    }
    if (f.auto) startAutoScroll(reel, ok ? SCROLL_AUTO_OK_MS : SCROLL_AUTO_BAD_MS);
    updateFeedStats(ok);
    ensureAhead();
  }

  function updateFeedStats(bump) {
    const s = feed.session;
    const best = scrollStats().bestScore[feed.id] || 0;
    const mult = Adaptive.multiplierFor(s.combo);
    app.querySelector('#feed-stats').innerHTML = `
      <span class="hud-score ${bump ? 'bump' : ''}" title="Session score${feed.resumed ? ' (resumed)' : ''}">⭐ ${fmtNum(s.score)}</span>
      <span class="${s.combo > 2 ? 'hot' : ''}" title="Current streak">🔥 ${s.combo}${mult > 1 ? ` <b class="mult">×${mult}</b>` : ''}</span>
      ${s.hot ? `<span class="hot" title="Hot streak: correct answers score double">×2 · ${s.hot} left</span>` : ''}
      <span class="muted secondary" title="Personal best score for this feed">Best ${fmtNum(Math.max(best, s.score))}</span>
      <span class="muted secondary" title="Correct / answered">${s.correct}/${s.answered}</span>`;
    const { from, to } = Adaptive.nextMilestone(s);
    const bar = app.querySelector('#momentum');
    bar.title = to ? `${s.answered} / ${to} answered to the next milestone` : `${s.answered} answered`;
    bar.firstElementChild.style.width = to ? `${((s.answered - from) / (to - from)) * 100}%` : '100%';
  }

  function topicRow(id) {
    const quiz = quizzes.find((z) => z.id === id);
    const t = feed.session.topics[id];
    return quiz ? `<li><span class="badge badge-${quiz.subject}">${subjectOf(quiz.subject).icon}</span><span class="grow">${esc(quiz.title)}</span>
      <span class="muted small">${t.c}/${t.n}</span>${masteryHtml(id)}</li>` : '';
  }

  // The session recap opens over the feed, only when asked for.
  function showRecap() {
    if (!feed || app.querySelector('.recap')) return;
    cancelAutoScroll();
    const s = feed.session;
    const { strengths, improve } = Adaptive.recap(s);
    const best = scrollStats().bestScore[feed.id] || 0;
    const queued = Object.keys(feed.profile.missed).length;
    const acc = s.answered ? Math.round((s.correct / s.answered) * 100) : 0;
    app.querySelector('.scroll-view').insertAdjacentHTML('beforeend', `
      <div class="recap" role="dialog" aria-modal="true" aria-labelledby="recap-title">
        <div class="card recap-card">
          <h2 id="recap-title">Session recap</h2>
          ${s.answered ? `
          <div class="recap-stats">
            <div><b>${fmtNum(s.score)}</b><span>score${s.score && s.score >= best ? ' · best!' : ''}</span></div>
            <div><b>${acc}%</b><span>${s.correct}/${s.answered} correct</span></div>
            <div><b>${s.bestCombo}</b><span>best combo</span></div>
          </div>
          ${strengths.length ? `<h3>Going well</h3><ul class="topic-list">${strengths.slice(0, 4).map(topicRow).join('')}</ul>` : ''}
          ${improve.length ? `<h3>Worth another look</h3><ul class="topic-list">${improve.slice(0, 4).map(topicRow).join('')}</ul>` : ''}
          ${queued ? `<p class="muted small">${queued} missed question${queued === 1 ? '' : 's'} queued. Their topics come back as knowledge checks.</p>` : ''}`
          : '<p class="muted">Answer a few questions and your recap shows up here.</p>'}
          <div class="result-actions">
            <button class="btn primary" data-recap-close>Keep scrolling</button>
            ${s.answered ? '<button class="btn" data-recap-reset>Start a new session</button>' : ''}
          </div>
        </div>
      </div>`);
    const panel = app.querySelector('.recap');
    panel.addEventListener('click', (e) => {
      if (e.target === panel || e.target.closest('[data-recap-close]')) closeRecap();
      else if (e.target.closest('[data-recap-reset]')) {
        feed.session = Adaptive.newSession(feed.id);
        feed.resumed = false;
        saveSession();
        updateFeedStats();
        closeRecap();
      }
    });
    panel.querySelector('[data-recap-close]').focus();
  }

  function closeRecap() {
    app.querySelector('.recap')?.remove();
    feed?.el.focus({ preventScroll: true });
  }

  function stepFeed(d, from = feed.current) {
    const target = from && (d > 0 ? from.nextElementSibling : from.previousElementSibling);
    if (target) target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  document.addEventListener('keydown', (e) => {
    if (!feed || e.ctrlKey || e.metaKey || e.altKey) return;
    if (app.querySelector('.recap')) { if (e.key === 'Escape') { e.preventDefault(); closeRecap(); } return; }
    if (e.target.closest && e.target.closest('summary, .link-btn') && (e.key === 'Enter' || e.key === ' ')) return;
    const k = e.key.toUpperCase();
    if (e.key === 'ArrowDown' || k === 'J') { e.preventDefault(); stepFeed(1); return; }
    if (e.key === 'ArrowUp' || k === 'K') { e.preventDefault(); stepFeed(-1); return; }
    const reel = feed.current;
    if (!reel || reel.dataset.reel == null) return;
    if (k === 'S') { e.preventDefault(); toggleSave(reel); return; }
    const it = feed.items[+reel.dataset.reel];
    const idx = it.quick && (k === 'T' || k === 'F') ? (k === 'T' ? 0 : 1) : /^[1-9]$/.test(k) ? +k - 1 : LETTERS.indexOf(k);
    if (idx >= 0 && idx < (it.quick ? 2 : it.q.options.length)) { e.preventDefault(); answerReel(reel, idx); }
  });

  // ---------- keyboard ----------
  document.addEventListener('keydown', (e) => {
    if (!run || run.locked || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toUpperCase();
    const idx = /^[1-9]$/.test(k) ? +k - 1 : LETTERS.indexOf(k);
    if (idx >= 0 && idx < run.q.options.length) { e.preventDefault(); answerRun(idx); }
  });

  document.addEventListener('keydown', (e) => {
    if (!session || session.finishedAt || !app.querySelector('.question-card')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const q = session.questions[session.index];
    const k = e.key.toUpperCase();
    let idx = -1;
    if (/^[1-9]$/.test(k)) idx = +k - 1;
    else if (LETTERS.includes(k)) idx = LETTERS.indexOf(k);
    if (idx >= 0 && idx < q.options.length) { e.preventDefault(); choose(idx); return; }
    if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
  });

  // "/" focuses the home search; Esc clears it.
  document.addEventListener('keydown', (e) => {
    const input = document.getElementById('search');
    if (!input) return;
    if (e.key === '/' && document.activeElement !== input && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
      e.preventDefault(); input.focus(); input.select();
    } else if (e.key === 'Escape' && document.activeElement === input && input.value) {
      input.value = ''; input.dispatchEvent(new Event('input'));
    }
  });

  // ---------- routing ----------
  function route() {
    const hash = location.hash || '#/';
    const m = /^#\/quiz\/([\w-]+(?:\/.+)?)/.exec(hash);
    const sr = /^#\/speedrun(?:\/(\w+)\/(\w+))?\/?$/.exec(hash);
    const ds = /^#\/scroll(?:\/(\w+))?\/?$/.exec(hash);
    session = null; clearInterval(timerId); confirmSubmit = false;
    stopRun();
    stopFeed();
    if (ds) {
      const fallback = store.get('scroll-subject', 'all');
      const id = [ds[1], fallback, 'all'].find((x) => SCROLL_FEEDS.some((s) => s.id === x));
      if (id !== ds[1]) return void location.replace('#/scroll/' + id);
      startFeed(id);
    } else if (sr) {
      if (sr[1] && SPEED_MODES[sr[1]] && speedSubjectOf(sr[2])) startRun(sr[1], sr[2]);
      else renderSpeedHome();
    } else if (m) {
      const quiz = getQuiz(m[1]);
      if (quiz && !quiz.questions.length) {
        app.innerHTML = quiz.mistakes
          ? `<div class="card center notfound"><h1>All clear</h1><p class="muted">No ${esc(subjectOf(quiz.subject).name)} mistakes left to fix.</p><a class="btn primary" href="#/">Back to quizzes</a></div>`
          : `<div class="card center notfound"><h1>No matches</h1><p class="muted">No question matches that search.</p><a class="btn primary" href="#/">Back to quizzes</a></div>`;
      } else if (quiz) renderModeSelect(quiz);
      else app.innerHTML = `<div class="card center notfound"><h1>404</h1><p class="muted">Oops! Page not found</p><a class="btn primary" href="#/">Return to Home</a></div>`;
    } else {
      renderHome();
    }
    window.scrollTo({ top: 0 });
  }
  window.addEventListener('hashchange', route);
  // Links to the current hash (e.g. "Quit" back to the mode screen) don't fire hashchange.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (a && a.getAttribute('href') === (location.hash || '#/')) { e.preventDefault(); route(); }
  });

  // ---------- theme ----------
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('popquiz-theme', root.dataset.theme); } catch (e) { /* ignore */ }
  });

  route();
})();
