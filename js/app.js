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
    return null;
  }

  // ---------- views ----------
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
          </div>
        </a>`;
    };

    app.innerHTML = `
      <section class="hero">
        <h1>Choose a Quiz</h1>
        <p class="muted">Select a quiz to test your knowledge</p>
      </section>
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
        <a class="card quiz-card speed-entry" href="#/speedrun">
          <div class="quiz-card-top"><h3>${icons.bolt} Speedrun</h3></div>
          <p class="muted">Race the clock in Sprint, Time Attack or Sudden Death. Can you beat your personal best?</p>
          <div class="meta"><span>${icons.clock}3 game modes</span></div>
        </a>
      </div>
      ${groups.map((g) => `
        <h2 class="group-title">${esc(g.name)}</h2>
        <div class="grid">${g.items.map((z) => card(z)).join('')}</div>`).join('')}
    `;

    app.querySelectorAll('[data-subject]').forEach((btn) =>
      btn.addEventListener('click', () => { store.set('subject', btn.dataset.subject); renderHome(); }));
  }

  function renderModeSelect(quiz) {
    const opts = store.get('options', { shuffleQuestions: false, shuffleOptions: true });
    const count = quiz.pickCount || quiz.questions.length;
    app.innerHTML = `
      <a href="#/" class="back-link">${icons.back} Back to quizzes</a>
      <div class="card mode-card">
        <span class="badge badge-${quiz.subject}">${subjectOf(quiz.subject).icon}</span>
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
        ${code ? `<pre class="code"><code>${esc(code)}</code></pre>` : ''}
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
          ${code ? `<pre class="code"><code>${esc(code)}</code></pre>` : ''}
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

  // Every question for a subject, with the original site's repeated questions removed.
  function speedPool(subjectId) {
    const seen = new Set();
    return quizzes.filter((z) => subjectId === 'all' || z.subject === subjectId).flatMap((z) => z.questions)
      .filter((q) => { const k = q.question + '\n' + (q.code || ''); return !seen.has(k) && seen.add(k); });
  }

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
      ${code ? `<pre class="code"><code>${esc(code)}</code></pre>` : ''}
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

  // ---------- routing ----------
  function route() {
    const hash = location.hash || '#/';
    const m = /^#\/quiz\/([\w-]+)/.exec(hash);
    const sr = /^#\/speedrun(?:\/(\w+)\/(\w+))?\/?$/.exec(hash);
    session = null; clearInterval(timerId); confirmSubmit = false;
    stopRun();
    if (sr) {
      if (sr[1] && SPEED_MODES[sr[1]] && speedSubjectOf(sr[2])) startRun(sr[1], sr[2]);
      else renderSpeedHome();
    } else if (m) {
      const quiz = getQuiz(m[1]);
      if (quiz) renderModeSelect(quiz);
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
