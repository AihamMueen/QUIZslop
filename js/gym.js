// Code Gym: the challenge registry and its adaptive engine (no DOM). Data files call CodeGym.add([...]).
// Like adaptive.js it is pure logic: randomness comes from an injected rng(), stored state is sanitized on load,
// and challenge objects are only read. It runs in Node too (tests/gym.test.js).
//
// A challenge:
//   { id, type: 'output'|'bug'|'trace'|'repair', concept, d: 1|2|3, q, c (code), e (explanation),
//     rule (the general principle), hint (the key insight: the last of three hints),
//     hints?: [concept, where to look, insight] (overrides; see hintsFor), at?: index of the line that matters,
//     also?: [other concept ids it combines] (boss picks), steps?: [string | { l: line, t: text, v?: { var: value } }],
//     w?: [why each option is wrong, '' at the answer] }
// plus, by kind:
//   output / trace and bug with m: 'fix':  o: [options], a: index of the right option
//   bug and repair:      spot (how to catch this kind of bug yourself)
//   bug with m: 'fix':   line: index of the code line the options replace (options are written without indentation)
//   bug with m: 'line':  a: index of the faulty line, fix: what that line should be ('' = delete it),
//                        dx: { o: [diagnoses], a, w? } (after finding the line: what is wrong with it?)
//   repair:              tests: [{ run: 'expression', expect: value }] (shown to the player and run in js/sandbox.js),
//                        solution: the reference fix; test-only: alts (other fixes that must pass), bad (plausible
//                        fixes that must fail a test, e.g. ones that miss an edge case)
// Test-only fields (tests/gym.test.js runs every snippet): out (expected output when it differs from o[a]),
// verify (code that prints the answer of a trace), expect (what a fixed bug snippet prints).
(function (root) {
  'use strict';

  const TYPES = {
    output: { name: 'Predict the output', short: 'Output', icon: '▶' },
    bug: { name: 'Find the bug', short: 'Debug', icon: '🐞' },
    trace: { name: 'Trace the code', short: 'Trace', icon: '👣' },
    repair: { name: 'Fix the code', short: 'Fix', icon: '🔧' },
  };
  // Curriculum order: new concepts are introduced roughly in this order.
  // `hint` is the first, concept-level hint for challenges that don't have their own. `tip` is the short refresher
  // shown before an easier example when a player keeps missing the concept.
  const CONCEPTS = [
    { id: 'variables', name: 'Variables & types',
      hint: 'Think about what each variable actually holds at this point: a value, a copy, or nothing yet.',
      tip: 'Primitives (numbers, strings, booleans) are copied when assigned. `typeof` returns a string such as "number" or "object", and `typeof null` is "object".' },
    { id: 'operators', name: 'Operators',
      hint: 'Check exactly what each operator does, and in which order they run.',
      tip: '`%` is the remainder, `**` is a power, and `x++` gives the old value before adding 1. Floating-point maths is not exact: 0.1 + 0.2 is not 0.3.' },
    { id: 'conditionals', name: 'Conditionals',
      hint: 'Evaluate each condition by hand with these exact values. Which branch is reached first?',
      tip: 'Conditions are checked from top to bottom and the first true one wins. `=` assigns and `===` compares. `&&` needs both sides to be true, `||` only one.' },
    { id: 'loops', name: 'Loops',
      hint: 'Count the iterations: what are the first and last values of the loop variable?',
      tip: 'A loop over n items from index 0 runs while `i < n`, so the last index is n − 1. Write down the first and last iteration to catch off-by-one errors.' },
    { id: 'strings', name: 'Strings',
      hint: 'Strings are compared character by character and are never changed in place.',
      tip: 'String methods return new strings. Indexes start at 0, and the last character is at `length - 1`. Comparisons are case-sensitive.' },
    { id: 'functions', name: 'Functions & returns',
      hint: 'Follow what the function returns. Does every path actually `return` a value?',
      tip: 'A function without `return` gives `undefined`. An arrow function with a `{ }` body needs an explicit `return`, and `return` followed by a line break returns nothing.' },
    { id: 'errors', name: 'Errors & exceptions',
      hint: 'Which line would throw, and what kind of error would it be?',
      tip: 'A TypeError means you used a value the wrong way (like calling `undefined`). A ReferenceError means a name does not exist yet. `try`/`catch` only catches errors thrown while its block runs.' },
    { id: 'arrays', name: 'Arrays',
      hint: 'Check the indexes: where does the array start and end, and does anything change its length?',
      tip: 'Indexes run from 0 to `length - 1`. Reading past the end gives `undefined` instead of an error. `push`, `splice` and `sort` change the array in place.' },
    { id: 'objects', name: 'Objects & references',
      hint: 'Is this a new object, or another name for the same one?',
      tip: 'Assigning an object or array copies the reference, not the contents. Spread (`{ ...obj }`) copies only one level deep. `===` on objects checks identity.' },
    { id: 'coercion', name: 'Type coercion',
      hint: 'What type is each value really? Look for strings that look like numbers.',
      tip: 'If either side of `+` is a string, `+` joins strings. `-`, `*` and `/` convert to numbers. `==` converts types and `===` does not, so prefer `===`.' },
    { id: 'array-methods', name: 'map, filter & reduce',
      hint: 'What does each array method return: a new array, one value, or nothing?',
      tip: '`map` returns a new array of the same length, `filter` a shorter array of the items that pass, and `reduce` a single value. Give `reduce` a starting value.' },
    { id: 'dom', name: 'DOM & events',
      hint: 'When does each handler run, and which exact function was registered?',
      tip: '`addEventListener` needs a function, not the result of calling one. To remove a listener you must pass the very same function. The page only changes when your code updates it.' },
    { id: 'scope', name: 'Scope & hoisting',
      hint: 'Which declaration does each name refer to at this point?',
      tip: '`let` and `const` belong to the nearest `{ }` block. Declaring the same name inside a block hides (shadows) the outer one. `var` is hoisted and starts as `undefined`.' },
    { id: 'closures', name: 'Closures',
      hint: 'A function remembers variables, not values. Which variable does each function see when it finally runs?',
      tip: 'A closure keeps a live link to the variables around it. A `let` loop variable is a fresh binding each iteration, while a `var` one is shared by every closure.' },
    { id: 'edge-cases', name: 'Edge cases',
      hint: 'Try the smallest and strangest inputs: an empty array, zero, a negative number, a single item.',
      tip: 'Most code works on the "normal" example. Check the empty case, the one-item case, zero and negatives, duplicates, and the first and last positions.' },
    { id: 'async', name: 'Promises & the event loop',
      hint: 'Which code runs now, and which runs later? Is anything waiting for a promise?',
      tip: 'Async functions always return a promise. `await` pauses only the current async function. Promise callbacks (microtasks) run before timers once the current code finishes.' },
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
    STRETCH_AFTER: 3,      // every 3 solo solves in a row, the next pick is a stretch if one is available
    STUCK_MISSES: 2,       // misses in a row on one concept before it comes back as an easier example with a refresher
    BOSS_EVERY: 10,        // answers between boss challenges (hard ones that combine concepts you have already seen)
    BOSS_MIN_CONCEPTS: 3,
    // Time is only a secondary signal: a solo solve slower than this (by level) does not unlock stretch picks.
    SLOW_MS: [60000, 90000, 150000], REPAIR_SLOW_FACTOR: 3,
    REPAIR_FREE_RUNS: 2,   // test runs on a repair before it counts as a retry
    // XP: earned for every answer, more for harder challenges and for consistency. No speed bonus.
    // Each hint shown keeps a little less XP and a retry keeps 60%, but a solve always beats a miss.
    XP: [10, 15, 25], STREAK_XP: 2, STREAK_XP_MAX: 5, MISS_XP: 2, RELEARN_XP: 5,
    HINT_FACTORS: [1, 0.8, 0.65, 0.5], RETRY_FACTOR: 0.6, SOLO_XP: 5, BOSS_FACTOR: 2, DAILY_XP: 20,
    MAX_TRIES: 2,          // attempts on a multiple-choice step (when it has more than two choices)
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
  const isRepair = (ch) => ch.type === 'repair';
  // Number of choices: options, or the code's lines for "tap the faulty line". Repairs have none (you edit the code).
  const choiceCount = (ch) => (isRepair(ch) ? 0 : isLineBug(ch) ? lines(ch).length : Array.isArray(ch.o) ? ch.o.length : 0);
  const isCorrect = (ch, choice) => !isRepair(ch) && Number.isInteger(choice) && choice === ch.a;
  // Attempts allowed on a multiple-choice step: a retry only makes sense with more than two choices.
  const triesFor = (n) => (n > 2 ? TUNING.MAX_TRIES : 1);
  const hash = (str) => { let h = 2166136261; for (const ch of String(str)) h = Math.imul(h ^ ch.codePointAt(0), 16777619); return h >>> 0; };

  // The three progressive hints: the concept, where to look, then the key insight. Each can be written per
  // challenge (hints[k]); otherwise the first comes from the concept and the second from the line that matters.
  function hintsFor(ch) {
    const own = Array.isArray(ch.hints) ? ch.hints : [];
    const n = lines(ch).length;
    let where = '';
    if (isLineBug(ch) && n > 3) {
      // A three-line window that contains the bug, not always centred on it.
      const lo = clamp(ch.a - (hash(ch.id) % 3), 0, n - 3);
      where = `The bug is somewhere in lines ${lo + 1}–${lo + 3}.`;
    } else if (ch.m === 'fix') where = `Line ${ch.line + 1} (highlighted) is the one to change. Read it piece by piece and compare it with what the question asks for.`;
    else if (Number.isInteger(ch.at)) where = `Look closely at line ${ch.at + 1}.`;
    const concept = conceptOf(ch.concept);
    return [own[0] || (concept && concept.hint) || '', own[1] || where, own[2] || ch.hint || ''].map((h) => (typeof h === 'string' ? h : ''));
  }
  // The line a hint or the explanation points at, if any.
  const focusLine = (ch) => (isLineBug(ch) ? ch.a : ch.m === 'fix' ? ch.line : Number.isInteger(ch.at) ? ch.at : -1);

  const optionList = (o) => Array.isArray(o) && o.length >= 2 && o.length <= 6 && o.every((x) => typeof x === 'string' && x) && new Set(o).size === o.length;

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
    if (typeof ch.rule !== 'string' || !ch.rule) p.push('rule');
    if ((ch.type === 'bug' || isRepair(ch)) && (typeof ch.spot !== 'string' || !ch.spot)) p.push('spot');
    if (ch.type === 'bug' && ch.m !== 'line' && ch.m !== 'fix') p.push('bug mode');
    const n = lines(ch).length;
    if (isRepair(ch)) {
      if (!Array.isArray(ch.tests) || !ch.tests.length || ch.tests.length > 12
        || ch.tests.some((t) => !t || typeof t.run !== 'string' || !t.run || !('expect' in t))) p.push('tests');
      if (typeof ch.solution !== 'string' || !ch.solution || ch.solution === ch.c) p.push('solution');
    } else if (isLineBug(ch)) {
      if (typeof ch.fix !== 'string') p.push('fix');
      const dx = ch.dx;
      if (!dx || !optionList(dx.o) || !(Number.isInteger(dx.a) && dx.a >= 0 && dx.a < dx.o.length)
        || (dx.w != null && !(Array.isArray(dx.w) && dx.w.length === dx.o.length && dx.w[dx.a] === ''))) p.push('diagnosis');
    } else {
      if (!Array.isArray(ch.o) || ch.o.length < 2 || ch.o.length > 6 || ch.o.some((o) => typeof o !== 'string')) p.push('options');
      else if (new Set(ch.o).size !== ch.o.length) p.push('duplicate options');
      if (ch.m === 'fix' && !(Number.isInteger(ch.line) && ch.line >= 0 && ch.line < n)) p.push('fix line');
    }
    if (!isRepair(ch) && !(Number.isInteger(ch.a) && ch.a >= 0 && ch.a < choiceCount(ch))) p.push('answer');
    if (ch.w != null && !(Array.isArray(ch.w) && ch.w.length === choiceCount(ch) && ch.w[ch.a] === '')) p.push('wrong explanations');
    if (ch.at != null && !(Number.isInteger(ch.at) && ch.at >= 0 && ch.at < n)) p.push('focus line');
    if (ch.also != null && !(Array.isArray(ch.also) && ch.also.every((id) => conceptOf(id) && id !== ch.concept))) p.push('also');
    if (ch.hints != null && !(Array.isArray(ch.hints) && ch.hints.length <= 3 && ch.hints.every((h) => typeof h === 'string'))) p.push('hints');
    else if (!p.includes('concept') && hintsFor(ch).some((h) => !h)) p.push('three hints');
    const stepOk = (s) => typeof s === 'string' || (s && typeof s.t === 'string' && (s.l == null || (Number.isInteger(s.l) && s.l >= 0 && s.l < n))
      && (s.v == null || (typeof s.v === 'object' && Object.values(s.v).every((x) => typeof x === 'string'))));
    if (ch.steps != null && !(Array.isArray(ch.steps) && ch.steps.length && ch.steps.every(stepOk))) p.push('steps');
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
  // fails: misses in a row on the concept; slow: the last solo solve took longer than SLOW_MS.
  const newConcept = () => ({ n: 0, c: 0, streak: 0, box: 0, due: 0, miss: null, wins: [], fails: 0, slow: false });
  // daily: the date ('YYYY-MM-DD') of the last daily challenge played; dailyStreak: days in a row; bosses: bosses beaten.
  const newProfile = () => ({ v: 1, xp: 0, total: 0, bestStreak: 0, concepts: {}, types: {}, seen: {}, daily: null, dailyStreak: 0, bosses: 0 });
  const isDay = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);

  // Rebuilds a profile from stored data, dropping anything malformed.
  function sanitizeProfile(raw) {
    const p = newProfile();
    if (!raw || typeof raw !== 'object' || raw.v !== 1) return p;
    p.xp = count(raw.xp);
    p.total = count(raw.total);
    p.bestStreak = count(raw.bestStreak);
    p.daily = isDay(raw.daily) ? raw.daily : null;
    p.dailyStreak = p.daily ? count(raw.dailyStreak) : 0;
    p.bosses = count(raw.bosses);
    for (const [k, t] of entriesOf(raw.concepts)) {
      if (!conceptOf(k) || !t || typeof t !== 'object') continue;
      const n = count(t.n), c = Math.min(n, count(t.c));
      p.concepts[k] = {
        n, c, streak: Math.min(c, count(t.streak)), box: clamp(count(t.box), 0, TUNING.INTERVALS.length - 1),
        due: Math.min(p.total + TUNING.INTERVALS[TUNING.INTERVALS.length - 1], count(t.due)),
        miss: typeof t.miss === 'string' ? t.miss : null, wins: strings(t.wins).slice(-10),
        fails: Math.min(n - c, count(t.fails)), slow: t.slow === true,
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

  // clean: solo solves in a row (no hints, no retry); solo: solo solves this session; sinceBoss: answers since the last boss.
  const newSession = (filter) => ({
    filter, xp: 0, answered: 0, correct: 0, streak: 0, bestStreak: 0, hints: 0, clean: 0, solo: 0, sinceBoss: 0, bosses: 0,
    concepts: {}, types: {}, learned: [], mastered: [], shown: [], recent: [], milestones: [], lastConcept: null,
  });

  // A stored session resumes only for the same filter and if it is recent.
  function sanitizeSession(raw, filter, now) {
    if (!raw || typeof raw !== 'object' || raw.filter !== filter || !(now - num(raw.at, -Infinity) < TUNING.RESUME_MS)) return null;
    const s = newSession(filter);
    for (const k of ['xp', 'answered', 'correct', 'streak', 'bestStreak', 'hints', 'clean', 'solo', 'sinceBoss', 'bosses']) s[k] = count(raw[k]);
    s.correct = Math.min(s.correct, s.answered);
    s.streak = Math.min(s.streak, s.correct);
    s.solo = Math.min(s.solo, s.correct);
    s.clean = Math.min(s.clean, s.solo);
    s.bosses = Math.min(s.bosses, s.correct);
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
  const matchesType = (ch, type) => !type || type === 'all' || ch.type === type;
  const remember = (session, item, concept) => {
    session.shown.push(item.id);
    if (session.shown.length > 200) session.shown.splice(0, session.shown.length - 200);
    session.lastConcept = concept;
  };

  // A boss challenge: a hard one (level 3, or one that combines concepts) built only from concepts the player has
  // already met and is not currently reviewing. Comes every BOSS_EVERY answers, never while struggling.
  function bossCandidates(avail, profile, session) {
    const met = (id) => conceptStats(profile, id).n > 0 && !conceptStats(profile, id).miss;
    if (session.sinceBoss < TUNING.BOSS_EVERY || form(session) === 'struggling') return [];
    if (Object.keys(profile.concepts).filter(met).length < TUNING.BOSS_MIN_CONCEPTS) return [];
    return avail.filter((ch) => (ch.d === 3 || (ch.also && ch.also.length)) && [ch.concept, ...(ch.also || [])].every(met));
  }

  // Picks the next challenge. opts.type limits it to one activity type ('all' or missing for every type).
  // The rules, in order:
  //   1. Skip challenges shown recently.
  //   2. A boss challenge if one is due (see bossCandidates).
  //   3. Choose a slot: review (a missed concept that is due, with a different example), practice (the weakest
  //      concept that is due or not yet mastered), fresh (the next unseen concept in curriculum order) or
  //      stretch (a harder challenge in a concept that is going well). A new player starts with fresh concepts;
  //      a struggling one gets fewer new concepts and no stretch. Every STRETCH_AFTER solo solves in a row, the
  //      next pick is a stretch (unless a review is due). A concept missed STUCK_MISSES times in a row comes back at beginner level with
  //      a refresher (pick.refresher).
  //   4. Within the concept, take the challenge closest to the concept's target level, preferring unseen ones.
  // Returns { item, slot, concept, target, prevConcept, boss?, refresher? } or null when there is nothing to pick.
  function pickNext(pool, profile, session, rng, opts = {}) {
    const typed = pool.filter((ch) => matchesType(ch, opts.type));
    let avail = typed;
    if (!avail.length) return null;
    const t = profile.total;
    const last = session.shown[session.shown.length - 1];
    const recentN = Math.min(TUNING.RECENT, Math.floor(avail.length / 2));
    const recent = new Set(recentN > 0 ? session.shown.slice(-recentN) : []);
    const notRecent = avail.filter((ch) => !recent.has(ch.id));
    if (notRecent.length) {
      avail = notRecent;
      // A due review may reuse a recent challenge if its concept has nothing else left (never the missed one itself).
      const dueMiss = (id) => { const s = profile.concepts[id]; return s && s.miss && s.due <= t ? s.miss : null; };
      const has = new Set(avail.map((ch) => ch.concept));
      avail = avail.concat(typed.filter((ch) => !has.has(ch.concept) && dueMiss(ch.concept) && ch.id !== dueMiss(ch.concept) && ch.id !== last));
    } else if (avail.length > 1) avail = avail.filter((ch) => ch.id !== last);

    const prevConcept = session.lastConcept;

    const bosses = opts.boss === false ? [] : bossCandidates(avail, profile, session);
    if (bosses.length) {
      let item = null, top = -Infinity;
      for (const ch of bosses) {
        const s = (profile.seen[ch.id] ? 0 : 2) + (ch.also ? ch.also.length * 0.5 : 0) + rng();
        if (s > top) { top = s; item = ch; }
      }
      remember(session, item, item.concept);
      return { item, slot: 'boss', boss: true, concept: item.concept, target: item.d, prevConcept };
    }

    const byConcept = {};
    for (const ch of avail) (byConcept[ch.concept] = byConcept[ch.concept] || []).push(ch);
    const ids = CONCEPTS.map((c) => c.id).filter((id) => byConcept[id]);
    const cs = (id) => conceptStats(profile, id);
    const notLast = (list) => (list.length > 1 ? list.filter((id) => id !== session.lastConcept) : list);
    const unseen = ids.filter((id) => !cs(id).n);
    const review = ids.filter((id) => cs(id).miss && cs(id).due <= t);
    const practice = notLast(ids.filter((id) => cs(id).n && !cs(id).miss && (cs(id).due <= t || !isMastered(cs(id)))));
    const stretch = notLast(ids.filter((id) => cs(id).n && !cs(id).miss && !cs(id).slow && cs(id).box >= TUNING.LUCKY_BOX && targetLevel(cs(id)) < 3));
    const struggling = form(session) === 'struggling';

    let slot;
    if (t < TUNING.WARMUP && unseen.length) slot = 'fresh';
    else if (stretch.length && !review.length && !struggling && session.clean && session.clean % TUNING.STRETCH_AFTER === 0) slot = 'stretch';
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
    const refresher = slot === 'review' && stats.fails >= TUNING.STUCK_MISSES;
    if (slot === 'review') {
      const missed = pool.find((ch) => ch.id === stats.miss);
      if (missed) target = Math.min(target, missed.d);
      if (refresher) target = 1;
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

    remember(session, item, concept);
    const pick = { item, slot, concept, target, prevConcept };
    if (refresher) pick.refresher = true;
    return pick;
  }

  // Today's daily challenge: the same bug or repair for everyone on a given day ('YYYY-MM-DD'), or null if this
  // profile already played it (or the pool has none). It counts like any other pick.
  function dailyPick(pool, profile, session, day, opts = {}) {
    if (!isDay(day) || profile.daily === day) return null;
    const list = pool.filter((ch) => (ch.type === 'bug' || isRepair(ch)) && ch.d >= 2 && matchesType(ch, opts.type)).sort((a, b) => (a.id < b.id ? -1 : 1));
    if (!list.length) return null;
    const item = list[hash('daily:' + day) % list.length];
    const prevConcept = session.lastConcept;
    remember(session, item, item.concept);
    return { item, slot: 'daily', daily: day, concept: item.concept, target: item.d, prevConcept };
  }
  const dayBefore = (day) => new Date(Date.parse(day + 'T00:00:00Z') - 864e5).toISOString().slice(0, 10);
  const today = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Takes back the most recent pick (a card that was queued but never shown), so the next pick can adapt.
  function unpick(session, pick) {
    const i = session.shown.lastIndexOf(pick.item.id);
    if (i >= 0) session.shown.splice(i, 1);
    session.lastConcept = pick.prevConcept ?? null;
  }

  // ---------- answering ----------
  // XP for an answer. A miss still earns a little (you read why). A solve earns more for harder challenges and
  // streaks; each hint and a retry keep a little less, but never less than a miss. Solving solo (no hints, first try)
  // adds a bonus, a boss doubles it and the daily challenge adds a flat bonus. No speed bonus.
  function xpFor({ d, correct, streak = 0, hints = 0, hinted = false, attempts = 1, relearned = false, boss = false, daily = false }) {
    const T = TUNING;
    if (!correct) return T.MISS_XP;
    const h = clamp(Math.floor(num(hints, 0)) || (hinted ? 1 : 0), 0, T.HINT_FACTORS.length - 1);
    const retried = attempts > 1;
    const base = T.XP[d - 1] + Math.min(Math.max(0, streak - 1), T.STREAK_XP_MAX) * T.STREAK_XP;
    let xp = Math.round(base * T.HINT_FACTORS[h] * (retried ? T.RETRY_FACTOR : 1));
    xp = Math.max(xp, T.MISS_XP + 1) + (!h && !retried ? T.SOLO_XP : 0) + (relearned ? T.RELEARN_XP : 0);
    if (boss) xp *= T.BOSS_FACTOR;
    return xp + (daily ? T.DAILY_XP : 0);
  }

  // Updates profile and session for a finished challenge (`pick` from pickNext or dailyPick).
  // Options: correct (or choice, checked with isCorrect), hints (how many were shown), attempts (tries on the
  // challenge, or test runs on a repair), ms (time on the card). A solo solve moves the concept up; a solve with
  // hints or a retry counts as right but holds the concept where it is, so guessing until right can't level it up.
  // Returns { correct, solo, xp, streak, relearned, mastered, boss, daily, dailyStreak, milestones } for feedback.
  function recordAnswer(profile, session, pick, { choice, correct, hints, hinted = false, attempts = 1, ms = 0 } = {}) {
    const T = TUNING, item = pick.item;
    correct = typeof correct === 'boolean' ? correct : isCorrect(item, choice);
    hints = Math.max(0, Math.floor(num(hints, hinted ? 1 : 0)));
    attempts = Math.max(1, Math.floor(num(attempts, 1)));
    if (isRepair(item)) attempts = Math.max(1, attempts - (T.REPAIR_FREE_RUNS - 1));
    const solo = correct && !hints && attempts === 1;
    const cs = profile.concepts[item.concept] || (profile.concepts[item.concept] = newConcept());
    const wasMastered = isMastered(cs);
    let relearned = false;

    cs.n++;
    profile.total++;
    if (correct) {
      cs.c++;
      cs.fails = 0;
      if (solo) {
        cs.streak++;
        if (!cs.wins.includes(item.id)) cs.wins.push(item.id);
        // Past LUCKY_BOX it takes two different wins to move up.
        if (cs.box < T.LUCKY_BOX || cs.wins.length >= 2) cs.box = Math.min(cs.box + 1, T.INTERVALS.length - 1);
        if (cs.miss && cs.miss !== item.id) relearned = true;
        if (cs.miss) cs.miss = null;
        const slow = T.SLOW_MS[item.d - 1] * (isRepair(item) ? T.REPAIR_SLOW_FACTOR : 1);
        cs.slow = num(ms, 0) > slow;
        cs.due = profile.total + T.INTERVALS[cs.box];
      } else {
        // Solved with help: it counts, nothing drops, but the concept comes back soon to check it stuck.
        cs.due = profile.total + (cs.miss ? T.REVIEW_DELAY : Math.min(T.INTERVALS[cs.box], T.REVIEW_DELAY * 2));
      }
    } else {
      cs.streak = 0;
      cs.wins = [];
      cs.box = Math.max(0, cs.box - 2);
      cs.fails++;
      cs.miss = item.id;
      cs.due = profile.total + T.REVIEW_DELAY;
    }
    const mastered = !wasMastered && isMastered(cs);

    const ty = profile.types[item.type] || (profile.types[item.type] = { n: 0, c: 0 });
    ty.n++; ty.c += correct ? 1 : 0;
    const seen = profile.seen[item.id] || (profile.seen[item.id] = { n: 0, c: 0, at: 0 });
    seen.n++; seen.c += correct ? 1 : 0; seen.at = profile.total;

    session.answered++;
    if (hints) session.hints++;
    for (const [key, id] of [['concepts', item.concept], ['types', item.type]]) {
      const st = session[key][id] || (session[key][id] = { n: 0, c: 0 });
      st.n++; st.c += correct ? 1 : 0;
    }
    session.recent.push(correct);
    if (session.recent.length > T.FORM_WINDOW) session.recent.shift();
    if (correct) { session.correct++; session.streak++; } else session.streak = 0;
    if (solo) { session.solo++; session.clean++; } else session.clean = 0;
    session.bestStreak = Math.max(session.bestStreak, session.streak);
    profile.bestStreak = Math.max(profile.bestStreak, session.streak);
    if (relearned && !session.learned.includes(item.concept)) session.learned.push(item.concept);
    if (mastered && !session.mastered.includes(item.concept)) session.mastered.push(item.concept);

    const boss = !!pick.boss;
    if (boss) session.sinceBoss = 0; else session.sinceBoss++;
    if (boss && correct) { session.bosses++; profile.bosses++; }
    const daily = isDay(pick.daily) ? pick.daily : null;
    if (daily && profile.daily !== daily) {
      profile.dailyStreak = profile.daily === dayBefore(daily) ? profile.dailyStreak + 1 : 1;
      profile.daily = daily;
    }

    const xp = xpFor({ d: item.d, correct, streak: session.streak, hints, attempts, relearned, boss, daily: !!daily });
    profile.xp += xp;
    session.xp += xp;

    const milestones = T.MILESTONES.filter((n) => session.answered === n && !session.milestones.includes('answered:' + n));
    for (const n of milestones) session.milestones.push('answered:' + n);
    return { correct, solo, xp, streak: session.streak, relearned, mastered, boss, daily: !!daily, dailyStreak: profile.dailyStreak, milestones };
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
    TYPES, CONCEPTS, LEVELS, TUNING, challenges, add, problems, buildPool, applyFix, lines, isLineBug, isRepair, choiceCount, isCorrect,
    triesFor, hintsFor, focusLine, newProfile, sanitizeProfile, newSession, sanitizeSession, conceptOf, conceptStats, conceptState,
    conceptProgress, isMastered, form, pickNext, dailyPick, today, dayBefore, unpick, xpFor, recordAnswer, recap,
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CodeGym = api;
})(this);
