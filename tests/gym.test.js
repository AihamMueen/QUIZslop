// Tests for Code Gym: the challenge bank (every snippet is run in Node to check its answer key) and the
// adaptive engine in js/gym.js. Run with `node --test` (no dependencies).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFile } = require('child_process');
const { loadBank, ROOT } = require('./load-bank');
const Highlight = require('../js/highlight.js');
const G = require('../js/gym.js');

// The engine is required (so its objects belong to this realm); the gym data files run in a sandbox that sees it.
const { scripts } = loadBank();
const gymData = scripts.filter((src) => src.startsWith('data/gym-'));
const ctx = vm.createContext({ CodeGym: G });
for (const src of gymData) vm.runInContext(fs.readFileSync(path.join(ROOT, src), 'utf8'), ctx, { filename: src });
const pool = G.buildPool();

// ---------- running snippets ----------
// Runs code in a fresh Node process. Returns its output, plus the error name (e.g. "TypeError") if it threw.
function run(code) {
  return new Promise((resolve) => {
    execFile(process.execPath, ['-e', code], { timeout: 10000 }, (err, stdout, stderr) => {
      const thrown = err ? (/\b([A-Z]\w*Error)\b/.exec(stderr) || [, 'Error'])[1] : '';
      resolve((stdout + ' ' + thrown).trim());
    });
  });
}
// Compares output loosely: whitespace (Node's `[ 1, 2 ]` vs `[1, 2]`, line breaks vs spaces) and quote style don't matter.
const norm = (s) => String(s).replace(/"/g, "'").replace(/\s+/g, ' ').trim().replace(/ ?([[\]{}(),:]) ?/g, '$1');

// Runs many snippets a few at a time.
async function runAll(jobs, limit = 8) {
  const results = new Array(jobs.length);
  let next = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (next < jobs.length) { const i = next++; results[i] = await run(jobs[i]); }
  }));
  return results;
}

// ---------- the bank ----------
test('index.html loads js/gym.js before the gym data files', () => {
  const gym = scripts.indexOf('js/gym.js');
  assert.ok(gym > 0);
  for (const f of ['data/gym-output.js', 'data/gym-bugs.js', 'data/gym-trace.js']) assert.ok(scripts.indexOf(f) > gym, f);
});

test('every challenge is well formed and has a unique id', () => {
  assert.ok(gymData.length >= 3);
  for (const ch of G.challenges) assert.deepEqual(G.problems(ch), [], ch.id);
  assert.equal(pool.length, G.challenges.length, 'no challenge dropped from the pool');
});

test('the bank has at least 25 output, 20 bug and 15 trace challenges, mostly beginner/intermediate', () => {
  const by = (k, v) => pool.filter((ch) => ch[k] === v).length;
  assert.ok(by('type', 'output') >= 25);
  assert.ok(by('type', 'bug') >= 20);
  assert.ok(by('type', 'trace') >= 15);
  assert.ok(by('d', 3) >= 5, 'some advanced');
  assert.ok(by('d', 1) + by('d', 2) >= pool.length * 0.75, 'mostly beginner and intermediate');
  for (const c of G.CONCEPTS) assert.ok(pool.filter((ch) => ch.concept === c.id).length >= 2, c.id + ' has challenges');
  assert.ok(pool.some((ch) => ch.m === 'line') && pool.some((ch) => ch.m === 'fix'));
});

test('no snippet is repeated', () => {
  const codes = pool.map((ch) => ch.c.replace(/\s+/g, ''));
  assert.equal(new Set(codes).size, codes.length);
});

test('options are distinct after normalising, so only one can match', () => {
  for (const ch of pool.filter((c) => !G.isLineBug(c))) {
    assert.equal(new Set(ch.o.map(norm)).size, ch.o.length, ch.id);
  }
});

test('output challenges print exactly the right option and no other', async () => {
  const list = pool.filter((ch) => ch.type === 'output');
  const outs = await runAll(list.map((ch) => ch.c));
  list.forEach((ch, i) => {
    assert.equal(norm(outs[i]), norm(ch.out ?? ch.o[ch.a]), ch.id);
    ch.o.forEach((o, k) => { if (k !== ch.a) assert.notEqual(norm(o), norm(outs[i]), `${ch.id} option ${k}`); });
  });
});

test('trace challenges: the verify code prints the right option and the shown code runs', async () => {
  const list = pool.filter((ch) => ch.type === 'trace');
  for (const ch of list) assert.equal(typeof ch.verify, 'string', ch.id + ' needs verify');
  const outs = await runAll(list.map((ch) => ch.verify));
  const plain = await runAll(list.map((ch) => ch.c));
  list.forEach((ch, i) => {
    assert.equal(norm(outs[i]), norm(ch.o[ch.a]), ch.id);
    assert.ok(!/Error$/.test(plain[i]), ch.id + ' code throws: ' + plain[i]);
  });
});

test('bug challenges: the bug is real, the fix works, and wrong fixes do not', async () => {
  const list = pool.filter((ch) => ch.type === 'bug');
  const jobs = [], checks = [];
  for (const ch of list) {
    assert.equal(typeof ch.expect, 'string', ch.id + ' needs expect');
    jobs.push(ch.c); checks.push([ch, 'buggy', false]);
    if (G.isLineBug(ch)) {
      assert.notEqual(G.lines(ch)[ch.a].trim(), ch.fix.trim(), ch.id + ' fix changes the line');
      jobs.push(G.applyFix(ch, ch.a, ch.fix)); checks.push([ch, 'fixed', true]);
    } else {
      ch.o.forEach((o, k) => { jobs.push(G.applyFix(ch, ch.line, o)); checks.push([ch, 'option ' + k, k === ch.a]); });
    }
  }
  const outs = await runAll(jobs);
  checks.forEach(([ch, what, shouldMatch], i) => {
    const ok = norm(outs[i]) === norm(ch.expect);
    assert.equal(ok, shouldMatch, `${ch.id} ${what} printed: ${outs[i]}`);
  });
});

test('highlighting a snippet line by line keeps its text', () => {
  const strip = (html) => html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  for (const ch of pool) for (const line of G.lines(ch)) assert.equal(strip(Highlight.code(line, 'javascript')), line, ch.id);
});

// ---------- answer evaluation ----------
test('isCorrect accepts only the answer index', () => {
  const ch = pool.find((c) => c.type === 'output');
  assert.equal(G.isCorrect(ch, ch.a), true);
  assert.equal(G.isCorrect(ch, (ch.a + 1) % ch.o.length), false);
  assert.equal(G.isCorrect(ch, String(ch.a)), false);
  assert.equal(G.isCorrect(ch, null), false);
  const line = pool.find(G.isLineBug);
  assert.equal(G.choiceCount(line), G.lines(line).length);
  assert.equal(G.isCorrect(line, line.a), true);
});

test('applyFix keeps indentation, and an empty fix deletes the line', () => {
  const ch = { c: 'if (x) {\n  bad();\n}' };
  assert.equal(G.applyFix(ch, 1, 'good();'), 'if (x) {\n  good();\n}');
  assert.equal(G.applyFix(ch, 1, ''), 'if (x) {\n}');
});

test('malformed challenges are left out of the pool', () => {
  const good = pool[0];
  const list = [good, { ...good, id: 'x1', a: 99 }, { ...good, id: 'x2', concept: 'nope' }, { ...good }, null, { ...good, id: 'x3', o: ['a', 'a'] }];
  assert.deepEqual(G.buildPool(list).map((c) => c.id), [good.id]);
  assert.deepEqual(G.buildPool([]), []);
});

// ---------- adaptive engine ----------
const rngOf = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const answer = (ch, right) => (right ? ch.a : (ch.a + 1) % G.choiceCount(ch));

// Plays n picks; right(pick, i) says whether to answer correctly. Returns the picks.
function play(profile, session, rng, n, right, opts) {
  const picks = [];
  for (let i = 0; i < n; i++) {
    const pick = G.pickNext(pool, profile, session, rng, opts);
    if (!pick) break;
    picks.push(pick);
    G.recordAnswer(profile, session, pick, { choice: answer(pick.item, right(pick, i)) });
  }
  return picks;
}

test('a new player starts with beginner challenges on early concepts', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const picks = play(G.newProfile(), G.newSession('all'), rngOf(seed), G.TUNING.WARMUP, () => true);
    for (const p of picks) {
      assert.equal(p.slot, 'fresh');
      assert.equal(p.item.d, 1);
      assert.ok(G.CONCEPTS.findIndex((c) => c.id === p.concept) < 4, p.concept);
    }
  }
});

test('difficulty rises as the player keeps getting answers right', () => {
  const profile = G.newProfile(), session = G.newSession('all'), rng = rngOf(7);
  const picks = play(profile, session, rng, 60, () => true);
  const avgD = (ps) => ps.reduce((n, p) => n + p.item.d, 0) / ps.length;
  assert.ok(avgD(picks.slice(-20)) > avgD(picks.slice(0, 10)) + 0.4, `${avgD(picks.slice(0, 10))} → ${avgD(picks.slice(-20))}`);
});

test('a struggling player gets easier challenges and no stretch picks', () => {
  const profile = G.newProfile(), session = G.newSession('all'), rng = rngOf(3);
  play(profile, session, rng, 40, () => true);
  const struggling = play(profile, session, rng, 12, () => false).slice(4);
  assert.equal(G.form(session), 'struggling');
  assert.ok(struggling.every((p) => p.slot !== 'stretch'));
  assert.ok(struggling.filter((p) => p.item.d === 1).length >= struggling.length / 2);
});

test('a missed concept comes back after a delay with a different challenge', () => {
  let returned = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const profile = G.newProfile(), session = G.newSession('all'), rng = rngOf(seed);
    play(profile, session, rng, 6, () => true);
    const missed = G.pickNext(pool, profile, session, rng);
    G.recordAnswer(profile, session, missed, { choice: answer(missed.item, false) });
    assert.equal(G.conceptState(profile, missed.concept), 'review');
    const after = play(profile, session, rng, 15, () => true);
    const back = after.findIndex((p) => p.concept === missed.concept);
    assert.ok(back >= 0, 'missed concept came back');
    assert.ok(back >= G.TUNING.REVIEW_DELAY - 1, 'not immediately: ' + back);
    assert.notEqual(after[back].item.id, missed.item.id, 'a different example');
    if (after[back].slot === 'review') returned++;
    assert.notEqual(G.conceptState(profile, missed.concept), 'review', 'answering it right clears the review');
  }
  assert.ok(returned >= 15, 'usually through the review slot: ' + returned);
});

test('relearning a missed concept is reported and earns bonus XP', () => {
  const profile = G.newProfile(), session = G.newSession('all');
  const [a, b] = pool.filter((ch) => ch.concept === 'loops');
  G.recordAnswer(profile, session, { item: a }, { choice: answer(a, false) });
  const res = G.recordAnswer(profile, session, { item: b }, { choice: b.a });
  assert.equal(res.relearned, true);
  assert.equal(res.xp, G.xpFor({ d: b.d, correct: true, streak: 1 }) + G.TUNING.RELEARN_XP);
  assert.deepEqual(G.recap(session).learned, ['loops']);
});

test('concepts answered well come up less often than weak ones', () => {
  const profile = G.newProfile(), session = G.newSession('all'), rng = rngOf(11);
  const weak = new Set(['loops', 'async']);
  const picks = play(profile, session, rng, 200, (p) => !weak.has(p.concept));
  const late = picks.slice(100);
  const share = (id) => late.filter((p) => p.concept === id).length / late.length;
  const strong = G.CONCEPTS.map((c) => c.id).filter((id) => !weak.has(id));
  const avgStrong = strong.reduce((n, id) => n + share(id), 0) / strong.length;
  assert.ok(share('loops') > avgStrong * 1.5 && share('async') > avgStrong * 1.5, `weak ${share('loops')}, ${share('async')} vs strong ${avgStrong}`);
});

test('one lucky answer does not master a concept; consistent right answers on different challenges do', () => {
  const profile = G.newProfile(), session = G.newSession('all');
  const loops = pool.filter((ch) => ch.concept === 'loops');
  G.recordAnswer(profile, session, { item: loops[0] }, { choice: loops[0].a });
  assert.notEqual(G.conceptState(profile, 'loops'), 'mastered');
  // The same challenge three times proves less than three different ones.
  G.recordAnswer(profile, session, { item: loops[0] }, { choice: loops[0].a });
  G.recordAnswer(profile, session, { item: loops[0] }, { choice: loops[0].a });
  assert.notEqual(G.conceptState(profile, 'loops'), 'mastered');
  assert.ok(profile.concepts.loops.box <= G.TUNING.LUCKY_BOX, 'box held back by repeats');
  let res;
  for (const ch of loops.slice(1, 3)) res = G.recordAnswer(profile, session, { item: ch }, { choice: ch.a });
  assert.equal(G.conceptState(profile, 'loops'), 'mastered');
  assert.equal(res.mastered, true);
  assert.deepEqual(session.mastered, ['loops']);
});

test('hints halve XP and do not move a concept up', () => {
  const profile = G.newProfile(), session = G.newSession('all');
  const ch = pool.find((c) => c.d === 2);
  const res = G.recordAnswer(profile, session, { item: ch }, { choice: ch.a, hinted: true });
  assert.equal(res.xp, Math.round(G.TUNING.XP[1] * G.TUNING.HINT_FACTOR));
  assert.equal(profile.concepts[ch.concept].box, 0);
  assert.equal(session.hints, 1);
});

test('a wrong answer still earns a little XP and resets the streak', () => {
  const profile = G.newProfile(), session = G.newSession('all');
  const [a, b, c] = pool;
  G.recordAnswer(profile, session, { item: a }, { choice: a.a });
  G.recordAnswer(profile, session, { item: b }, { choice: b.a });
  assert.equal(session.streak, 2);
  const res = G.recordAnswer(profile, session, { item: c }, { choice: answer(c, false) });
  assert.equal(res.xp, G.TUNING.MISS_XP);
  assert.equal(session.streak, 0);
  assert.equal(session.bestStreak, 2);
  assert.equal(profile.bestStreak, 2);
  assert.equal(profile.xp, session.xp);
});

test('streaks add a capped consistency bonus', () => {
  assert.equal(G.xpFor({ d: 1, correct: true, streak: 1 }), 10);
  assert.equal(G.xpFor({ d: 1, correct: true, streak: 3 }), 14);
  assert.equal(G.xpFor({ d: 3, correct: true, streak: 50 }), 25 + G.TUNING.STREAK_XP_MAX * G.TUNING.STREAK_XP);
});

test('a type filter only picks that type, and an empty pool gives null', () => {
  const profile = G.newProfile(), session = G.newSession('bug');
  const picks = play(profile, session, rngOf(5), 40, (p, i) => i % 3 > 0, { type: 'bug' });
  assert.equal(picks.length, 40);
  assert.ok(picks.every((p) => p.item.type === 'bug'));
  assert.equal(G.pickNext([], profile, session, rngOf(1)), null);
});

test('recently shown challenges do not repeat', () => {
  const profile = G.newProfile(), session = G.newSession('trace'), rng = rngOf(9);
  const picks = play(profile, session, rng, 60, () => true, { type: 'trace' });
  const n = pool.filter((ch) => ch.type === 'trace').length;
  const gap = Math.min(G.TUNING.RECENT, Math.floor(n / 2));
  picks.forEach((p, i) => {
    const prev = picks.slice(Math.max(0, i - gap), i).map((x) => x.item.id);
    assert.ok(!prev.includes(p.item.id), `repeat of ${p.item.id} at ${i}`);
  });
});

test('unpick takes a queued pick back', () => {
  const profile = G.newProfile(), session = G.newSession('all');
  const pick = G.pickNext(pool, profile, session, rngOf(2));
  assert.deepEqual(session.shown, [pick.item.id]);
  G.unpick(session, pick);
  assert.deepEqual(session.shown, []);
});

test('picking is deterministic for a given seed', () => {
  const ids = (seed) => play(G.newProfile(), G.newSession('all'), rngOf(seed), 30, (p, i) => i % 4 !== 0).map((p) => p.item.id);
  assert.deepEqual(ids(42), ids(42));
});

// ---------- persistence ----------
test('a profile survives a JSON round trip and keeps picking the same way', () => {
  const profile = G.newProfile(), session = G.newSession('all');
  play(profile, session, rngOf(4), 30, (p, i) => i % 3 !== 0);
  const restored = G.sanitizeProfile(JSON.parse(JSON.stringify(profile)));
  assert.deepEqual(restored, profile);
  const s1 = JSON.parse(JSON.stringify(session)), s2 = JSON.parse(JSON.stringify(session));
  assert.equal(G.pickNext(pool, profile, s1, rngOf(8)).item.id, G.pickNext(pool, restored, s2, rngOf(8)).item.id);
});

test('malformed stored profiles are cleaned up', () => {
  assert.deepEqual(G.sanitizeProfile(null), G.newProfile());
  assert.deepEqual(G.sanitizeProfile('junk'), G.newProfile());
  assert.deepEqual(G.sanitizeProfile({ v: 2, xp: 50 }), G.newProfile());
  const p = G.sanitizeProfile({
    v: 1, xp: -5, total: 'x', bestStreak: 3.7,
    concepts: { loops: { n: 3, c: 9, streak: 8, box: 99, due: 1e9, miss: 5, wins: ['a', 1] }, bogus: { n: 1 }, async: null },
    types: { output: { n: 2, c: 1 }, nope: { n: 1, c: 1 } },
    seen: { a: { n: 1, c: 1, at: 50 }, b: 'x' },
  });
  assert.equal(p.xp, 0);
  assert.equal(p.total, 0);
  assert.equal(p.bestStreak, 3);
  assert.deepEqual(p.concepts.loops, { n: 3, c: 3, streak: 3, box: 4, due: 32, miss: null, wins: ['a'] });
  assert.deepEqual(Object.keys(p.concepts), ['loops']);
  assert.deepEqual(Object.keys(p.types), ['output']);
  assert.deepEqual(p.seen, { a: { n: 1, c: 1, at: 0 } });
  // A cleaned profile can be used straight away.
  assert.ok(G.pickNext(pool, p, G.newSession('all'), rngOf(1)));
});

test('sessions resume only for the same filter within the resume window, and are sanitized', () => {
  const now = 1e12;
  const session = G.newSession('all');
  play(G.newProfile(), session, rngOf(6), 10, () => true);
  const stored = { ...JSON.parse(JSON.stringify(session)), at: now - 1000 };
  assert.deepEqual(G.sanitizeSession(stored, 'all', now), session);
  assert.equal(G.sanitizeSession(stored, 'bug', now), null);
  assert.equal(G.sanitizeSession({ ...stored, at: now - G.TUNING.RESUME_MS - 1 }, 'all', now), null);
  assert.equal(G.sanitizeSession(null, 'all', now), null);
  const s = G.sanitizeSession({ filter: 'all', at: now, answered: 2, correct: 9, streak: 7, learned: ['loops', 'nope', 3], recent: [true, 'x'], concepts: { loops: { n: 1, c: 4 } } }, 'all', now);
  assert.equal(s.correct, 2);
  assert.equal(s.streak, 2);
  assert.deepEqual(s.learned, ['loops']);
  assert.deepEqual(s.recent, [true]);
  assert.deepEqual(s.concepts.loops, { n: 1, c: 1 });
});

test('recap lists strengths, topics to practise and what was learned', () => {
  const session = G.newSession('all');
  session.concepts = { loops: { n: 3, c: 3 }, async: { n: 3, c: 1 }, scope: { n: 1, c: 1 } };
  session.learned = ['scope'];
  session.mastered = ['loops'];
  const r = G.recap(session);
  assert.deepEqual(r.strengths, ['loops']);
  assert.deepEqual(r.improve, ['async']);
  assert.deepEqual(r.learned, ['loops', 'scope']);
});
