// Code Gym: the challenge registry and its adaptive engine (no DOM). Data files call CodeGym.add([...]).
// Like adaptive.js it is pure logic: randomness comes from an injected rng(), stored state is sanitized on load,
// and challenge objects are only read. It runs in Node too (tests/gym.test.js).
//
// A challenge:
//   { id, type: 'output'|'bug'|'trace', concept, d: 1|2|3, q, c (code), e (explanation),
//     steps?: [execution trace lines], hint?, w?: [why each option is wrong, '' at the answer] }
// plus, by kind:
//   output / trace and bug with m: 'fix':  o: [options], a: index of the right option
//   bug with m: 'fix':   line: index of the code line the options replace (options are written without indentation)
//   bug with m: 'line':  a: index of the faulty line, fix: what that line should be ('' = delete it)
// Test-only fields (tests/gym.test.js runs every snippet): out (expected output when it differs from o[a]),
// verify (code that prints the answer of a trace), expect (what a fixed bug snippet prints).
(function (root) {
  'use strict';

  const TYPES = {
    output: { name: 'Predict the output', short: 'Output', icon: '▶' },
    bug: { name: 'Find the bug', short: 'Debug', icon: '🐞' },
    trace: { name: 'Trace the code', short: 'Trace', icon: '👣' },
  };
  // Curriculum order: new concepts are introduced roughly in this order.
  const CONCEPTS = [
    { id: 'variables', name: 'Variables & types' },
    { id: 'operators', name: 'Operators' },
    { id: 'conditionals', name: 'Conditionals' },
    { id: 'loops', name: 'Loops' },
    { id: 'strings', name: 'Strings' },
    { id: 'functions', name: 'Functions & returns' },
    { id: 'arrays', name: 'Arrays' },
    { id: 'objects', name: 'Objects & references' },
    { id: 'coercion', name: 'Type coercion' },
    { id: 'array-methods', name: 'map, filter & reduce' },
    { id: 'scope', name: 'Scope & hoisting' },
    { id: 'closures', name: 'Closures' },
    { id: 'async', name: 'Promises & the event loop' },
  ];
  const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

  const TUNING = {
    // Each concept sits in a Leitner-style box 0–4. A right answer moves it up a box, a miss moves it down two.
    // The box sets how long until the concept is due again (in answers) and which difficulty it is served at.
    INTERVALS: [2, 4, 8, 16, 32],
    LEVEL_AT_BOX: [1, 1, 2, 2, 3],
    LUCKY_BOX: 2,          // above this box, moving up needs right answers on at least 2 different challenges
    REVIEW_DELAY: 3,       // a missed concept comes back after this many other answers, with a different challenge
    MASTER_STREAK: 3,      // right answers in a row on different challenges before a concept counts as mastered
    MASTER_ACC: 0.75,
    WARMUP: 3,             // a brand-new player's first answers introduce new concepts at beginner level
    SLOTS: { review: 0.45, practice: 0.3, fresh: 0.25, stretch: 0.12 },
    FORM_WINDOW: 4, STRUGGLE_MISSES: 3,
    RECENT: 15,            // a challenge won't come back within this many cards (scaled down for small pools)
    NOISE: 0.3,
    // XP: earned for every answer, more for harder challenges and for consistency. No speed bonus.
    XP: [10, 15, 25], STREAK_XP: 2, STREAK_XP_MAX: 5, MISS_XP: 2, RELEARN_XP: 5, HINT_FACTOR: 0.5,
    MILESTONES: [5, 10, 25, 50, 100],
    RESUME_MS: 30 * 60 * 1000,
  };

  const challenges = [];
  const add = (list) => { challenges.push(...list); };

  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const num = (x, fallback) => (typeof x === 'number' && isFinite(x) ? x : fallback);
  const count = (x) => Math.max(0, Math.floor(num(x, 0)));
  const entriesOf = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? Object.entries(o) : []);
  const strings = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === 'string') : []);
  const conceptOf = (id) => CONCEPTS.find((c) => c.id === id);

  const lines = (ch) => String(ch.c || '').split('\n');
  const isLineBug = (ch) => ch.type === 'bug' && ch.m === 'line';
  // Number of choices: options, or the code's lines for "tap the faulty line".
  const choiceCount = (ch) => (isLineBug(ch) ? lines(ch).length : Array.isArray(ch.o) ? ch.o.length : 0);
  const isCorrect = (ch, choice) => Number.isInteger(choice) && choice === ch.a;

  // Problems with a challenge, as strings (empty when it is fine). Malformed challenges are left out of the pool.
  function problems(ch) {
    const p = [];
    if (!ch || typeof ch !== 'object') return ['not an object'];
    if (typeof ch.id !== 'string' || !ch.id) p.push('id');
    if (!TYPES[ch.type]) p.push('type');
    if (!conceptOf(ch.concept)) p.push('concept');
    if (![1, 2, 3].includes(ch.d)) p.push('difficulty');
    if (typeof ch.q !== 'string' || !ch.q) p.push('question');
    if (typeof ch.c !== 'string' || !ch.c) p.push('code');
    if (typeof ch.e !== 'string' || !ch.e) p.push('explanation');
    if (ch.type === 'bug' && ch.m !== 'line' && ch.m !== 'fix') p.push('bug mode');
    if (isLineBug(ch)) {
      if (typeof ch.fix !== 'string') p.push('fix');
    } else {
      if (!Array.isArray(ch.o) || ch.o.length < 2 || ch.o.length > 6 || ch.o.some((o) => typeof o !== 'string')) p.push('options');
      else if (new Set(ch.o).size !== ch.o.length) p.push('duplicate options');
      if (ch.m === 'fix' && !(Number.isInteger(ch.line) && ch.line >= 0 && ch.line < lines(ch).length)) p.push('fix line');
    }
    if (!(Number.isInteger(ch.a) && ch.a >= 0 && ch.a < choiceCount(ch))) p.push('answer');
    if (ch.w != null && !(Array.isArray(ch.w) && ch.w.length === choiceCount(ch) && ch.w[ch.a] === '')) p.push('wrong explanations');
    if (ch.steps != null && !(Array.isArray(ch.steps) && ch.steps.every((s) => typeof s === 'string'))) p.push('steps');
    return p;
  }

  // The code with one line replaced (a fix option or a line bug's fix), keeping that line's indentation.
  function applyFix(ch, lineIndex, replacement) {
    const ls = lines(ch);
    if (replacement === '') ls.splice(lineIndex, 1);
    else ls[lineIndex] = ls[lineIndex].match(/^\s*/)[0] + replacement.trim();
    return ls.join('\n');
  }

  // Valid challenges with unique ids; duplicates after the first are dropped.
  function buildPool(list = challenges) {
    const ids = new Set();
    return list.filter((ch) => !problems(ch).length && !ids.has(ch.id) && ids.add(ch.id));
  }

  // ---------- profile (persisted) and session ----------
  const newConcept = () => ({ n: 0, c: 0, streak: 0, box: 0, due: 0, miss: null, wins: [] });
  const newProfile = () => ({ v: 1, xp: 0, total: 0, bestStreak: 0, concepts: {}, types: {}, seen: {} });

  // Rebuilds a profile from stored data, dropping anything malformed.
  function sanitizeProfile(raw) {
    const p = newProfile();
    if (!raw || typeof raw !== 'object' || raw.v !== 1) return p;
    p.xp = count(raw.xp);
    p.total = count(raw.total);
    p.bestStreak = count(raw.bestStreak);
    for (const [k, t] of entriesOf(raw.concepts)) {
      if (!conceptOf(k) || !t || typeof t !== 'object') continue;
      const n = count(t.n), c = Math.min(n, count(t.c));
      p.concepts[k] = {
        n, c, streak: Math.min(c, count(t.streak)), box: clamp(count(t.box), 0, TUNING.INTERVALS.length - 1),
        due: Math.min(p.total + TUNING.INTERVALS[TUNING.INTERVALS.length - 1], count(t.due)),
        miss: typeof t.miss === 'string' ? t.miss : null, wins: strings(t.wins).slice(-10),
      };
    }
    for (const [k, t] of entriesOf(raw.types)) {
      if (TYPES[k] && t && typeof t === 'object') { const n = count(t.n); p.types[k] = { n, c: Math.min(n, count(t.c)) }; }
    }
    for (const [k, s] of entriesOf(raw.seen)) {
      if (!s || typeof s !== 'object') continue;
      const n = count(s.n);
      p.seen[k] = { n, c: Math.min(n, count(s.c)), at: Math.min(p.total, count(s.at)) };
    }
    return p;
  }

  const newSession = (filter) => ({
    filter, xp: 0, answered: 0, correct: 0, streak: 0, bestStreak: 0, hints: 0,
    concepts: {}, types: {}, learned: [], mastered: [], shown: [], recent: [], milestones: [], lastConcept: null,
  });

  // A stored session resumes only for the same filter and if it is recent.
  function sanitizeSession(raw, filter, now) {
    if (!raw || typeof raw !== 'object' || raw.filter !== filter || !(now - num(raw.at, -Infinity) < TUNING.RESUME_MS)) return null;
    const s = newSession(filter);
    for (const k of ['xp', 'answered', 'correct', 'streak', 'bestStreak', 'hints']) s[k] = count(raw[k]);
    s.correct = Math.min(s.correct, s.answered);
    s.streak = Math.min(s.streak, s.correct);
    s.bestStreak = Math.max(s.bestStreak, s.streak);
    s.learned = strings(raw.learned).filter(conceptOf);
    s.mastered = strings(raw.mastered).filter(conceptOf);
    s.shown = strings(raw.shown).slice(-200);
    s.milestones = strings(raw.milestones);
    s.recent = Array.isArray(raw.recent) ? raw.recent.filter((x) => typeof x === 'boolean').slice(-TUNING.FORM_WINDOW) : [];
    s.lastConcept = typeof raw.lastConcept === 'string' ? raw.lastConcept : null;
    for (const key of ['concepts', 'types']) {
      for (const [k, t] of entriesOf(raw[key])) {
        if (t && typeof t === 'object') { const n = count(t.n); s[key][k] = { n, c: Math.min(n, count(t.c)) }; }
      }
    }
    return s;
  }

  // ---------- concept state ----------
  const conceptStats = (profile, id) => profile.concepts[id] || newConcept();
  // Mastered means consistent: a streak on different challenges and good accuracy overall, not one lucky answer.
  const isMastered = (cs) => cs.streak >= TUNING.MASTER_STREAK && cs.wins.length >= TUNING.MASTER_STREAK && cs.c / cs.n >= TUNING.MASTER_ACC;

  // 'new' | 'review' (missed, coming back) | 'learning' | 'solid' | 'mastered'
  function conceptState(profile, id) {
    const cs = conceptStats(profile, id);
    if (!cs.n) return 'new';
    if (cs.miss) return 'review';
    if (isMastered(cs)) return 'mastered';
    return cs.streak >= 2 || cs.box >= TUNING.LUCKY_BOX ? 'solid' : 'learning';
  }
  // 0–1 for a progress bar: the box, discounted while a miss is outstanding.
  const conceptProgress = (profile, id) => {
    const cs = conceptStats(profile, id);
    return cs.n ? clamp((cs.box + (isMastered(cs) ? 1 : 0)) / TUNING.INTERVALS.length - (cs.miss ? 0.1 : 0), 0.05, 1) : 0;
  };
  const targetLevel = (cs) => TUNING.LEVEL_AT_BOX[cs.box];

  function form(session) {
    const r = session.recent.slice(-TUNING.FORM_WINDOW);
    return r.length >= TUNING.FORM_WINDOW && r.filter((x) => !x).length >= TUNING.STRUGGLE_MISSES ? 'struggling' : 'normal';
  }

  function weightedPick(weights, rng) {
    const list = Object.entries(weights).filter(([, w]) => w > 0);
    let r = rng() * list.reduce((n, [, w]) => n + w, 0);
    for (const [k, w] of list) { if ((r -= w) < 0) return k; }
    return list[list.length - 1][0];
  }

  // ---------- selection ----------
  // Picks the next challenge. opts.type limits it to one activity type ('all' or missing for every type).
  // The rules, in order:
  //   1. Skip challenges shown recently.
  //   2. Choose a slot: review (a missed concept that is due, with a different example), practice (the weakest
  //      concept that is due or not yet mastered), fresh (the next unseen concept in curriculum order) or
  //      stretch (a harder challenge in a concept that is going well). A new player starts with fresh concepts;
  //      a struggling one gets fewer new concepts and no stretch.
  //   3. Within the concept, take the challenge closest to the concept's target level, preferring unseen ones.
  // Returns { item, slot, concept, target, prevConcept } or null when there is nothing to pick.
  function pickNext(pool, profile, session, rng, opts = {}) {
    let avail = pool.filter((ch) => !opts.type || opts.type === 'all' || ch.type === opts.type);
    if (!avail.length) return null;
    const recentN = Math.min(TUNING.RECENT, Math.floor(avail.length / 2));
    const recent = new Set(recentN > 0 ? session.shown.slice(-recentN) : []);
    const notRecent = avail.filter((ch) => !recent.has(ch.id));
    if (notRecent.length) avail = notRecent;
    else if (avail.length > 1) avail = avail.filter((ch) => ch.id !== session.shown[session.shown.length - 1]);

    const t = profile.total;
    const prevConcept = session.lastConcept;
    const byConcept = {};
    for (const ch of avail) (byConcept[ch.concept] = byConcept[ch.concept] || []).push(ch);
    const ids = CONCEPTS.map((c) => c.id).filter((id) => byConcept[id]);
    const cs = (id) => conceptStats(profile, id);
    const notLast = (list) => (list.length > 1 ? list.filter((id) => id !== session.lastConcept) : list);
    const unseen = ids.filter((id) => !cs(id).n);
    const review = ids.filter((id) => cs(id).miss && cs(id).due <= t);
    const practice = notLast(ids.filter((id) => cs(id).n && !cs(id).miss && (cs(id).due <= t || !isMastered(cs(id)))));
    const stretch = notLast(ids.filter((id) => cs(id).n && !cs(id).miss && cs(id).box >= TUNING.LUCKY_BOX && targetLevel(cs(id)) < 3));
    const struggling = form(session) === 'struggling';

    let slot;
    if (t < TUNING.WARMUP && unseen.length) slot = 'fresh';
    else {
      const S = TUNING.SLOTS;
      const w = {
        review: review.length ? S.review : 0,
        practice: practice.length ? S.practice : 0,
        fresh: unseen.length ? S.fresh * (struggling ? 0.4 : 1) : 0,
        stretch: stretch.length && !struggling ? S.stretch : 0,
      };
      slot = Object.values(w).some((x) => x > 0) ? weightedPick(w, rng) : 'any';
    }

    let concept;
    if (slot === 'review') concept = review.reduce((a, b) => (cs(b).due < cs(a).due ? b : a));
    else if (slot === 'fresh') concept = unseen[unseen.length > 1 && rng() < 0.3 ? 1 : 0];
    else if (slot === 'stretch') concept = stretch[Math.floor(rng() * stretch.length)];
    else if (slot === 'practice') {
      // Weakest first: low accuracy and a low box. Mastered concepts only come back here once they are due.
      const weakness = (id) => cs(id).c / cs(id).n + cs(id).box * 0.15 + rng() * TUNING.NOISE;
      concept = practice.reduce((a, b) => (weakness(b) < weakness(a) ? b : a));
    } else {
      const open = notLast(ids);
      concept = open.reduce((a, b) => (cs(b).due < cs(a).due ? b : a));
    }

    const stats = cs(concept);
    let target = targetLevel(stats);
    if (slot === 'stretch') target = Math.min(3, target + 1);
    if (struggling) target = Math.max(1, target - 1);
    let candidates = byConcept[concept];
    if (slot === 'review') {
      const missed = pool.find((ch) => ch.id === stats.miss);
      if (missed) target = Math.min(target, missed.d);
      if (candidates.length > 1) candidates = candidates.filter((ch) => ch.id !== stats.miss);
    }
    let item = null, top = -Infinity;
    for (const ch of candidates) {
      const seen = profile.seen[ch.id];
      let s = -2 * Math.abs(ch.d - target) + rng() * TUNING.NOISE;
      if (!seen) s += 1;
      else s -= (seen.c ? 0.8 : 0) + Math.max(0, 1 - (t - seen.at) / 30);
      if (s > top) { top = s; item = ch; }
    }

    session.shown.push(item.id);
    if (session.shown.length > 200) session.shown.splice(0, session.shown.length - 200);
    session.lastConcept = concept;
    return { item, slot, concept, target, prevConcept };
  }

  // Takes back the most recent pick (a card that was queued but never shown), so the next pick can adapt.
  function unpick(session, pick) {
    const i = session.shown.lastIndexOf(pick.item.id);
    if (i >= 0) session.shown.splice(i, 1);
    session.lastConcept = pick.prevConcept ?? null;
  }

  // ---------- answering ----------
  // XP for an answer: a miss still earns a little (you read why), hints halve it, streaks add a consistency bonus.
  function xpFor({ d, correct, streak = 0, hinted = false, relearned = false }) {
    if (!correct) return TUNING.MISS_XP;
    const base = TUNING.XP[d - 1] + Math.min(Math.max(0, streak - 1), TUNING.STREAK_XP_MAX) * TUNING.STREAK_XP;
    return Math.round(base * (hinted ? TUNING.HINT_FACTOR : 1)) + (relearned ? TUNING.RELEARN_XP : 0);
  }

  // Updates profile and session for an answer to `pick` (from pickNext).
  // Returns { correct, xp, streak, relearned, mastered, milestones } for feedback.
  function recordAnswer(profile, session, pick, { choice, hinted = false }) {
    const T = TUNING, item = pick.item;
    const correct = isCorrect(item, choice);
    const cs = profile.concepts[item.concept] || (profile.concepts[item.concept] = newConcept());
    const wasMastered = isMastered(cs);
    let relearned = false;

    cs.n++;
    profile.total++;
    if (correct) {
      cs.c++;
      cs.streak++;
      if (!cs.wins.includes(item.id)) cs.wins.push(item.id);
      // A hinted answer counts for accuracy but doesn't move the concept up; past LUCKY_BOX it takes two different wins.
      if (!hinted && (cs.box < T.LUCKY_BOX || cs.wins.length >= 2)) cs.box = Math.min(cs.box + 1, T.INTERVALS.length - 1);
      if (cs.miss && cs.miss !== item.id) relearned = true;
      if (cs.miss && (relearned || cs.miss === item.id)) cs.miss = null;
      cs.due = profile.total + T.INTERVALS[cs.box];
    } else {
      cs.streak = 0;
      cs.wins = [];
      cs.box = Math.max(0, cs.box - 2);
      cs.miss = item.id;
      cs.due = profile.total + T.REVIEW_DELAY;
    }
    const mastered = !wasMastered && isMastered(cs);

    const ty = profile.types[item.type] || (profile.types[item.type] = { n: 0, c: 0 });
    ty.n++; ty.c += correct ? 1 : 0;
    const seen = profile.seen[item.id] || (profile.seen[item.id] = { n: 0, c: 0, at: 0 });
    seen.n++; seen.c += correct ? 1 : 0; seen.at = profile.total;

    session.answered++;
    if (hinted) session.hints++;
    for (const [key, id] of [['concepts', item.concept], ['types', item.type]]) {
      const st = session[key][id] || (session[key][id] = { n: 0, c: 0 });
      st.n++; st.c += correct ? 1 : 0;
    }
    session.recent.push(correct);
    if (session.recent.length > T.FORM_WINDOW) session.recent.shift();
    if (correct) { session.correct++; session.streak++; } else session.streak = 0;
    session.bestStreak = Math.max(session.bestStreak, session.streak);
    profile.bestStreak = Math.max(profile.bestStreak, session.streak);
    if (relearned && !session.learned.includes(item.concept)) session.learned.push(item.concept);
    if (mastered && !session.mastered.includes(item.concept)) session.mastered.push(item.concept);

    const xp = xpFor({ d: item.d, correct, streak: session.streak, hinted, relearned });
    profile.xp += xp;
    session.xp += xp;

    const milestones = T.MILESTONES.filter((n) => session.answered === n && !session.milestones.includes('answered:' + n));
    for (const n of milestones) session.milestones.push('answered:' + n);
    return { correct, xp, streak: session.streak, relearned, mastered, milestones };
  }

  // What the session went well / badly on, and what was learned. Concept ids.
  function recap(session) {
    const list = Object.entries(session.concepts).map(([id, t]) => ({ id, n: t.n, c: t.c, acc: t.c / t.n }));
    return {
      strengths: list.filter((t) => t.n >= 2 && t.acc >= 0.75).sort((a, b) => b.c - a.c || b.acc - a.acc).map((t) => t.id),
      improve: list.filter((t) => t.c < t.n).sort((a, b) => (b.n - b.c) - (a.n - a.c) || a.acc - b.acc).map((t) => t.id),
      learned: [...new Set([...session.mastered, ...session.learned])],
    };
  }

  const api = {
    TYPES, CONCEPTS, LEVELS, TUNING, challenges, add, problems, buildPool, applyFix, lines, isLineBug, choiceCount, isCorrect,
    newProfile, sanitizeProfile, newSession, sanitizeSession, conceptOf, conceptStats, conceptState, conceptProgress, isMastered,
    form, pickNext, unpick, xpFor, recordAnswer, recap,
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CodeGym = api;
})(this);
