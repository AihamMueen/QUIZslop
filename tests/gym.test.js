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
const Sandbox = require('../js/sandbox.js').core();

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
  for (const f of ['data/gym-output.js', 'data/gym-bugs.js', 'data/gym-trace.js', 'data/gym-repair.js']) assert.ok(scripts.indexOf(f) > gym, f);
});

test('every challenge is well formed and has a unique id', () => {
  assert.ok(gymData.length >= 3);
  for (const ch of G.challenges) assert.deepEqual(G.problems(ch), [], ch.id);
  assert.equal(pool.length, G.challenges.length, 'no challenge dropped from the pool');
});

test('the bank has at least 25 output, 20 bug, 15 trace and 10 repair challenges, mostly beginner/intermediate', () => {
  const by = (k, v) => pool.filter((ch) => ch[k] === v).length;
  assert.ok(by('type', 'output') >= 25);
  assert.ok(by('type', 'bug') >= 20);
  assert.ok(by('type', 'trace') >= 15);
  assert.ok(by('type', 'repair') >= 10);
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
  for (const ch of pool.filter((c) => !G.isLineBug(c) && !G.isRepair(c))) {
    assert.equal(new Set(ch.o.map(norm)).size, ch.o.length, ch.id);
  }
  for (const ch of pool.filter(G.isLineBug)) assert.equal(new Set(ch.dx.o.map(norm)).size, ch.dx.o.length, ch.id + ' diagnoses');
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

test('repair challenges: the broken code fails a test, every accepted fix passes them all, and bad fixes fail', async () => {
  const list = pool.filter(G.isRepair);
  for (const ch of list) {
    const opts = { setup: ch.setup || '' };
    const broken = await Sandbox.evaluate(ch.c, ch.tests, opts);
    assert.ok(!broken.error, `${ch.id} broken code should parse: ${broken.error}`);
    assert.ok(broken.results.some((r) => !r.pass), ch.id + ' broken code passes every test');
    for (const [what, code] of [['solution', ch.solution], ...(ch.alts || []).map((c, i) => ['alt ' + i, c])]) {
      const res = await Sandbox.evaluate(code, ch.tests, opts);
      for (const r of res.results) assert.ok(r.pass, `${ch.id} ${what}: ${r.run} gave ${r.error || r.got}, want ${r.want}`);
    }
    for (const [i, code] of (ch.bad || []).entries()) {
      const res = await Sandbox.evaluate(code, ch.tests, opts);
      assert.ok(res.results.some((r) => !r.pass), `${ch.id} bad fix ${i} passes every test`);
    }
  }
});

test('every challenge has three progressive hints, and the second narrows down without giving the line away', () => {
  for (const ch of pool) {
    const hints = G.hintsFor(ch);
    assert.equal(hints.length, 3, ch.id);
    for (const h of hints) assert.ok(typeof h === 'string' && h.length > 10, ch.id + ': ' + h);
    assert.equal(new Set(hints).size, 3, ch.id + ' hints repeat');
    if (G.isLineBug(ch) && G.lines(ch).length > 3) {
      const [, lo, hi] = /lines (\d+)–(\d+)/.exec(hints[1]).map(Number);
      assert.ok(lo <= ch.a + 1 && ch.a + 1 <= hi && hi - lo === 2, ch.id + ' window ' + hints[1]);
    }
  }
  // The window is not always centred on the bug.
  const offsets = pool.filter((ch) => G.isLineBug(ch) && G.lines(ch).length > 3).map((ch) => ch.a + 1 - +/lines (\d+)/.exec(G.hintsFor(ch)[1])[1]);
  assert.ok(new Set(offsets).size >= 2, 'offsets ' + offsets);
});

test('every challenge teaches: a rule, and for bugs and repairs how to spot it; line bugs ask for a diagnosis', () => {
  for (const ch of pool) {
    assert.ok(ch.rule.length > 20, ch.id);
    if (ch.type === 'bug' || G.isRepair(ch)) assert.ok(ch.spot.length > 20, ch.id);
    if (G.isLineBug(ch)) assert.ok(ch.dx.o.length >= 3 && ch.dx.w, ch.id);
    if (ch.at != null) assert.ok(G.lines(ch)[ch.at].trim(), ch.id + ' focus line is blank');
  }
});

test('the bank covers the core debugging topics with several challenge types', () => {
  const ids = new Set(pool.map((ch) => ch.id));
  for (const id of ['fix-add-inputs', 'bug-loose-zero', 'fix-is-even', 'fix-sum-all', 'fix-last-item', 'fix-counter',
    'fix-sorted-copy', 'fix-format-price', 'fix-total-stock', 'fix-remove-listener', 'bug-handler-called']) assert.ok(ids.has(id), id);
  for (const c of ['dom', 'errors', 'edge-cases', 'async', 'closures']) {
    const types = new Set(pool.filter((ch) => ch.concept === c).map((ch) => ch.type));
    assert.ok(types.size >= 2, c + ' has ' + [...types]);
  }
  assert.ok(pool.filter((ch) => ch.also && ch.also.length).length >= 6, 'some challenges combine concepts (boss material)');
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
  const repair = pool.find(G.isRepair);
  assert.equal(G.choiceCount(repair), 0);
  assert.equal(G.isCorrect(repair, 0), false, 'a repair is judged by its tests, never by a choice');
  assert.equal(G.triesFor(4), G.TUNING.MAX_TRIES);
  assert.equal(G.triesFor(2), 1, 'no retry on a two-way choice');
});

test('applyFix keeps indentation, and an empty fix deletes the line', () => {
  const ch = { c: 'if (x) {\n  bad();\n}' };
  assert.equal(G.applyFix(ch, 1, 'good();'), 'if (x) {\n  good();\n}');
  assert.equal(G.applyFix(ch, 1, ''), 'if (x) {\n}');
});

test('malformed challenges are left out of the pool', () => {
  const good = pool[0];
  const list = [good, { ...good, id: 'x1', a: 99 }, { ...good, id: 'x2', concept: 'nope' }, { ...good }, null, { ...good, id: 'x3', o: ['a', 'a'] },
    { ...good, id: 'x4', rule: '' }, { ...good, id: 'x5', at: 99 }, { ...good, id: 'x6', also: ['nope'] }, { ...good, id: 'x7', steps: [{ l: 99, t: 'x' }] }];
  assert.deepEqual(G.buildPool(list).map((c) => c.id), [good.id]);
  const line = pool.find(G.isLineBug);
  assert.deepEqual(G.problems({ ...line, dx: undefined }), ['diagnosis']);
  assert.deepEqual(G.problems({ ...line, dx: { ...line.dx, a: 9 } }), ['diagnosis']);
  assert.deepEqual(G.problems({ ...line, spot: '' }), ['spot']);
  const repair = pool.find(G.isRepair);
  assert.deepEqual(G.problems({ ...repair, tests: [] }), ['tests']);
  assert.deepEqual(G.problems({ ...repair, tests: [{ run: 'f()' }] }), ['tests'], 'a test needs an expected value');
  assert.deepEqual(G.problems({ ...repair, solution: repair.c }), ['solution']);
  assert.deepEqual(G.problems({ ...repair, at: undefined, hints: undefined, concept: repair.concept }).filter((x) => x !== 'three hints'), []);
  assert.deepEqual(G.buildPool([]), []);
});

// ---------- adaptive engine ----------
const rngOf = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const answer = (ch, right) => (right ? ch.a : (ch.a + 1) % G.choiceCount(ch));
const nonRepair = (pred = () => true) => pool.filter((ch) => !G.isRepair(ch) && pred(ch));

// Plays n picks; right(pick, i) says whether to answer correctly. Returns the picks.
function play(profile, session, rng, n, right, opts) {
  const picks = [];
  for (let i = 0; i < n; i++) {
    const pick = G.pickNext(pool, profile, session, rng, opts);
    if (!pick) break;
    picks.push(pick);
    G.recordAnswer(profile, session, pick, { correct: !!right(pick, i) });
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
    G.recordAnswer(profile, session, missed, { correct: false });
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
  const [a, b] = nonRepair((ch) => ch.concept === 'loops');
  G.recordAnswer(profile, session, { item: a }, { choice: answer(a, false) });
  const res = G.recordAnswer(profile, session, { item: b }, { choice: b.a });
  assert.equal(res.relearned, true);
  assert.equal(res.xp, G.xpFor({ d: b.d, correct: true, streak: 1, relearned: true }));
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
  const loops = nonRepair((ch) => ch.concept === 'loops');
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

test('each hint keeps a little less XP, but solving with every hint and a retry still beats a miss', () => {
  const T = G.TUNING;
  const xs = [0, 1, 2, 3].map((hints) => G.xpFor({ d: 2, correct: true, streak: 1, hints }));
  assert.equal(xs[0], T.XP[1] + T.SOLO_XP, 'solo bonus without hints');
  assert.equal(xs[1], Math.round(T.XP[1] * T.HINT_FACTORS[1]));
  for (let i = 1; i < xs.length; i++) assert.ok(xs[i] < xs[i - 1], 'more hints, less XP: ' + xs);
  assert.ok(G.xpFor({ d: 2, correct: true, attempts: 2 }) < G.xpFor({ d: 2, correct: true, hints: 1 }));
  for (let d = 1; d <= 3; d++) assert.ok(G.xpFor({ d, correct: true, hints: 3, attempts: 2 }) > T.MISS_XP, 'a solve beats a miss');
  assert.equal(G.xpFor({ d: 1, correct: true, hinted: true }), G.xpFor({ d: 1, correct: true, hints: 1 }), 'hinted means one hint');
});

test('a solve with hints or a retry counts as right but holds the concept where it is, and brings it back soon', () => {
  const profile = G.newProfile(), session = G.newSession('all');
  const ch = nonRepair((c) => c.d === 2)[0];
  const res = G.recordAnswer(profile, session, { item: ch }, { correct: true, hints: 2 });
  const cs = profile.concepts[ch.concept];
  assert.equal(res.correct, true);
  assert.equal(res.solo, false);
  assert.equal(cs.box, 0);
  assert.equal(cs.c, 1);
  assert.equal(cs.streak, 0, 'only solo solves build towards mastery');
  assert.ok(cs.due - profile.total <= G.TUNING.REVIEW_DELAY * 2);
  assert.equal(session.streak, 1, 'the session streak is not broken by asking for help');
  assert.equal(session.clean, 0);
  assert.equal(session.hints, 1);
  const retry = G.recordAnswer(profile, session, { item: ch }, { correct: true, attempts: 2 });
  assert.equal(retry.solo, false);
  assert.equal(cs.box, 0);
  const solo = G.recordAnswer(profile, session, { item: ch }, { correct: true });
  assert.equal(solo.solo, true);
  assert.equal(cs.box, 1);
  assert.equal(session.clean, 1);
});

test('repairs get free test runs before a run counts as a retry', () => {
  const repair = pool.find(G.isRepair);
  const p = () => [G.newProfile(), G.newSession('all')];
  assert.equal(G.recordAnswer(...p(), { item: repair }, { correct: true, attempts: G.TUNING.REPAIR_FREE_RUNS }).solo, true);
  assert.equal(G.recordAnswer(...p(), { item: repair }, { correct: true, attempts: G.TUNING.REPAIR_FREE_RUNS + 1 }).solo, false);
});

test('a concept missed twice in a row comes back as an easier example with a refresher', () => {
  let refreshers = 0;
  for (let seed = 1; seed <= 15; seed++) {
    const profile = G.newProfile(), session = G.newSession('all'), rng = rngOf(seed);
    play(profile, session, rng, 30, () => true);
    const hard = nonRepair((c) => c.concept === 'closures' && c.d >= 2);
    for (const ch of hard.slice(0, 2)) G.recordAnswer(profile, session, { item: ch }, { correct: false });
    assert.equal(profile.concepts.closures.fails, 2);
    const after = play(profile, session, rng, 12, (p) => p.concept !== 'closures');
    const back = after.find((p) => p.concept === 'closures' && p.slot === 'review');
    if (!back) continue;
    assert.equal(back.refresher, true);
    assert.equal(back.item.d, Math.min(...pool.filter((c) => c.concept === 'closures').map((c) => c.d)), 'the easiest level there is');
    refreshers++;
  }
  assert.ok(refreshers >= 10, 'refreshers ' + refreshers);
});

test('after three solo solves in a row the next pick is a stretch when one is available', () => {
  let forced = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const profile = G.newProfile(), session = G.newSession('all'), rng = rngOf(seed);
    const picks = play(profile, session, rng, 40, () => true);
    picks.forEach((p, i) => {
      if (i > 0 && (i % G.TUNING.STRETCH_AFTER === 0) && p.slot === 'stretch') forced++;
    });
  }
  assert.ok(forced >= 20, 'forced stretches ' + forced);
});

test('a slow solo solve does not unlock stretch picks for that concept', () => {
  const profile = G.newProfile(), session = G.newSession('all');
  const loops = nonRepair((c) => c.concept === 'loops');
  for (const ch of loops.slice(0, 3)) G.recordAnswer(profile, session, { item: ch }, { correct: true, ms: 1000 });
  assert.equal(profile.concepts.loops.slow, false);
  G.recordAnswer(profile, session, { item: loops[3] }, { correct: true, ms: 10 * 60 * 1000 });
  assert.equal(profile.concepts.loops.slow, true);
  for (let i = 0; i < 30; i++) {
    const s = { ...G.newSession('all'), clean: 3 };
    const pick = G.pickNext(pool, profile, s, rngOf(i), { boss: false });
    assert.ok(!(pick.slot === 'stretch' && pick.concept === 'loops'));
  }
});

test('boss challenges come every BOSS_EVERY answers, are hard, and only use concepts already met', () => {
  const profile = G.newProfile(), session = G.newSession('all'), rng = rngOf(21);
  const picks = play(profile, session, rng, 80, () => true);
  const bosses = picks.map((p, i) => [p, i]).filter(([p]) => p.boss);
  assert.ok(bosses.length >= 5, 'bosses ' + bosses.length);
  for (const [p, i] of bosses) {
    assert.ok(p.item.d === 3 || p.item.also, p.item.id);
    const before = new Set(picks.slice(0, i).map((x) => x.concept));
    for (const c of [p.item.concept, ...(p.item.also || [])]) assert.ok(before.has(c), `${p.item.id} uses unmet ${c}`);
  }
  for (let k = 1; k < bosses.length; k++) assert.ok(bosses[k][1] - bosses[k - 1][1] > G.TUNING.BOSS_EVERY - 1);
  assert.equal(profile.bosses, bosses.length);
  const res = G.recordAnswer(G.newProfile(), G.newSession('all'), { item: bosses[0][0].item, boss: true }, { correct: true });
  assert.equal(res.xp, G.xpFor({ d: bosses[0][0].item.d, correct: true, streak: 1 }) * G.TUNING.BOSS_FACTOR);
  // A struggling player gets no boss.
  const s2 = { ...G.newSession('all'), sinceBoss: 99, recent: [false, false, false, false] };
  for (let i = 0; i < 10; i++) assert.notEqual(G.pickNext(pool, profile, { ...s2, shown: [] }, rngOf(i)).slot, 'boss');
});

test('the daily challenge is the same for everyone on a day, played once, and builds a streak on consecutive days', () => {
  const day = '2026-10-29';
  const a = G.dailyPick(pool, G.newProfile(), G.newSession('all'), day);
  const b = G.dailyPick(pool, G.newProfile(), G.newSession('all'), day);
  assert.equal(a.item.id, b.item.id);
  assert.ok(['bug', 'repair'].includes(a.item.type) && a.item.d >= 2);
  const days = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07'];
  assert.ok(new Set(days.map((d) => G.dailyPick(pool, G.newProfile(), G.newSession('all'), d).item.id)).size >= 3, 'varies by day');

  const profile = G.newProfile(), session = G.newSession('all');
  const res = G.recordAnswer(profile, session, G.dailyPick(pool, profile, session, '2026-10-28'), { correct: true });
  assert.equal(res.daily, true);
  assert.equal(res.dailyStreak, 1);
  assert.equal(res.xp, G.xpFor({ d: res.xp && G.challenges.find((c) => c.id === session.shown[0]).d, correct: true, streak: 1, daily: true }));
  assert.equal(G.dailyPick(pool, profile, session, '2026-10-28'), null, 'once a day');
  G.recordAnswer(profile, session, G.dailyPick(pool, profile, session, '2026-10-29'), { correct: false });
  assert.equal(profile.dailyStreak, 2, 'playing counts even when missed');
  G.recordAnswer(profile, session, G.dailyPick(pool, profile, session, '2026-11-02'), { correct: true });
  assert.equal(profile.dailyStreak, 1, 'a gap resets the streak');
  assert.equal(G.dailyPick(pool, profile, session, 'garbage'), null);
  assert.equal(G.dayBefore('2026-03-01'), '2026-02-28');
  assert.equal(G.today(new Date(2026, 0, 5)), '2026-01-05');
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
  const solo = G.TUNING.SOLO_XP;
  assert.equal(G.xpFor({ d: 1, correct: true, streak: 1 }), 10 + solo);
  assert.equal(G.xpFor({ d: 1, correct: true, streak: 3 }), 14 + solo);
  assert.equal(G.xpFor({ d: 3, correct: true, streak: 50 }), 25 + G.TUNING.STREAK_XP_MAX * G.TUNING.STREAK_XP + solo);
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
  assert.deepEqual(p.concepts.loops, { n: 3, c: 3, streak: 3, box: 4, due: 32, miss: null, wins: ['a'], fails: 0, slow: false });
  const d = G.sanitizeProfile({ v: 1, daily: '2026-10-29', dailyStreak: 4.5, bosses: -1, concepts: { loops: { n: 4, c: 1, fails: 9, slow: 'yes' } } });
  assert.equal(d.daily, '2026-10-29');
  assert.equal(d.dailyStreak, 4);
  assert.equal(d.bosses, 0);
  assert.equal(d.concepts.loops.fails, 3, 'no more fails than misses');
  assert.equal(d.concepts.loops.slow, false);
  assert.equal(G.sanitizeProfile({ v: 1, daily: 'today', dailyStreak: 3 }).dailyStreak, 0);
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
