// Tests for js/adaptive.js. Run with `node --test` (no dependencies).
const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../js/adaptive.js');
const { loadBank } = require('./load-bank');

const { QuizBank } = loadBank();
const realPool = A.buildPool(QuizBank.quizzes.flatMap((quiz) => quiz.questions.map((q) => ({ q, quiz }))));

// A synthetic pool: `topics` quizzes with `per` questions each, difficulties spread 1–5.
function fakePool(topics = 5, per = 20) {
  const entries = [];
  for (let t = 0; t < topics; t++) {
    const quiz = { id: 'topic' + t, title: 'Topic ' + t, semester: 'Test', subject: 'python' };
    for (let i = 0; i < per; i++) {
      entries.push({ quiz, q: { question: `t${t} q${i}`, code: null, options: ['a', 'b', 'c', 'd'], correctIndex: 1, explanation: 'x', wrongExplanations: [] } });
    }
  }
  return A.buildPool(entries).map((it, i) => ({ ...it, d: 1 + (i % 9) * 0.5 }));
}

// Answers `n` picks, correct when answer(pick) is true. Returns the picks.
function play(pool, profile, session, rng, n, answer, opts) {
  const picks = [];
  for (let i = 0; i < n; i++) {
    const pick = A.pickNext(pool, profile, session, rng, opts);
    if (!pick) break;
    picks.push(pick);
    A.recordAnswer(profile, session, pick, { correct: answer(pick, i), ms: 5000 });
  }
  return picks;
}

const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

test('difficulty estimates cover 1–5 and code-tracing questions rate harder than one-liners', () => {
  const ds = realPool.map((it) => it.d);
  assert.equal(Math.min(...ds), 1);
  assert.equal(Math.max(...ds), 5);
  assert.ok(ds.every((d) => d * 2 === Math.round(d * 2)));
  const withCode = realPool.filter((it) => it.q.code || it.q.question.includes('\n'));
  const without = realPool.filter((it) => !(it.q.code || it.q.question.includes('\n')));
  assert.ok(avg(withCode.map((it) => it.d)) > avg(without.map((it) => it.d)) + 0.5);
});

test('question keys are stable and unique enough across the bank', () => {
  const keys = new Set(realPool.map((it) => it.key));
  const texts = new Set(realPool.map((it) => it.q.question + '\n' + (it.q.code || '')));
  assert.equal(keys.size, texts.size);
  assert.equal(A.questionKey(realPool[0].q), realPool[0].key);
});

test('skill rises gradually with correct answers and falls with wrong ones', () => {
  const pool = fakePool();
  const profile = A.newProfile();
  const session = A.newSession('all');
  const rng = A.mulberry32(1);
  const before = profile.skill;
  play(pool, profile, session, rng, 1, () => true);
  assert.ok(profile.skill > before && profile.skill - before < 0.35, 'one answer moves skill a little');
  play(pool, profile, session, rng, 30, () => true);
  assert.ok(profile.skill > before + 1.2, 'a long run of correct answers raises skill');
  const high = profile.skill;
  play(pool, profile, session, rng, 30, () => false);
  assert.ok(profile.skill < high - 1, 'a long run of misses lowers skill');
  assert.ok(profile.skill >= A.TUNING.SKILL_MIN);
});

test('skill never jumps: every single answer changes it by at most SKILL_K', () => {
  const pool = fakePool();
  const profile = A.newProfile();
  const session = A.newSession('all');
  const rng = A.mulberry32(2);
  for (let i = 0; i < 200; i++) {
    const s = profile.skill;
    const pick = A.pickNext(pool, profile, session, rng);
    A.recordAnswer(profile, session, pick, { correct: rng() < 0.6 });
    assert.ok(Math.abs(profile.skill - s) <= A.TUNING.SKILL_K + 1e-9);
  }
});

test('a stronger player is served harder questions', () => {
  const pool = fakePool();
  const served = (skill, seed) => {
    const profile = { ...A.newProfile(), skill };
    const session = A.newSession('all');
    const rng = A.mulberry32(seed);
    const ds = [];
    for (let i = 0; i < 300; i++) ds.push(A.pickNext(pool, profile, session, rng).item.d);
    return avg(ds);
  };
  assert.ok(served(4.5, 3) > served(1.5, 3) + 1.5);
});

test('struggling quietly shifts picks easier, but not to all-easy', () => {
  const pool = fakePool();
  const run = (correct) => {
    const profile = { ...A.newProfile(), skill: 3 };
    const session = A.newSession('all');
    session.recent = Array(6).fill(correct);
    const rng = A.mulberry32(4);
    const picks = [];
    for (let i = 0; i < 300; i++) picks.push(A.pickNext(pool, profile, session, rng));
    return picks;
  };
  const struggling = run(false), cruising = run(true);
  assert.equal(A.form({ recent: Array(6).fill(false) }), 'struggling');
  assert.ok(avg(struggling.map((p) => p.target)) < avg(cruising.map((p) => p.target)));
  assert.ok(struggling.some((p) => p.slot === 'core'), 'core questions still appear');
});

test('no question repeats within the recent window on a large pool', () => {
  const pool = fakePool(5, 20);
  const profile = A.newProfile();
  const session = A.newSession('all');
  const picks = play(pool, profile, session, A.mulberry32(5), 300, (p, i) => i % 3 !== 0);
  const keys = picks.map((p) => p.item.key);
  for (let i = 0; i < keys.length; i++) {
    assert.ok(!keys.slice(Math.max(0, i - A.TUNING.RECENT_WINDOW), i).includes(keys[i]), `repeat at ${i}`);
  }
});

test('small pools still work and never serve the same question twice in a row', () => {
  for (const size of [1, 2, 3]) {
    const pool = fakePool(1, size);
    const profile = A.newProfile();
    const session = A.newSession('all');
    const picks = play(pool, profile, session, A.mulberry32(6), 20, () => false);
    assert.equal(picks.length, 20);
    if (size > 1) for (let i = 1; i < picks.length; i++) assert.notEqual(picks[i].item.key, picks[i - 1].item.key);
  }
  assert.equal(A.pickNext([], A.newProfile(), A.newSession('all'), A.mulberry32(1)), null);
});

test('strict mode (the saved feed) serves each question once, then returns null', () => {
  const pool = fakePool(2, 4);
  const shown = new Set();
  const session = A.newSession('saved');
  const profile = A.newProfile();
  const rng = A.mulberry32(7);
  let pick;
  while ((pick = A.pickNext(pool, profile, session, rng, { exclude: shown, strict: true }))) {
    assert.ok(!shown.has(pick.item.key));
    shown.add(pick.item.key);
    A.recordAnswer(profile, session, pick, { correct: false });
  }
  assert.equal(shown.size, pool.length);
});

test('a missed concept comes back as a knowledge check with a different question on that topic', () => {
  const pool = fakePool(6, 15);
  const profile = A.newProfile();
  const session = A.newSession('all');
  const rng = A.mulberry32(8);
  const first = A.pickNext(pool, profile, session, rng);
  A.recordAnswer(profile, session, first, { correct: false });
  assert.ok(profile.missed[first.item.key]);
  const picks = play(pool, profile, session, rng, 40, (p) => p.item.topic !== first.item.topic);
  const check = picks.find((p) => p.event === 'check' && p.reviewOf === first.item.key);
  assert.ok(check, 'knowledge check happened');
  assert.equal(check.item.topic, first.item.topic);
  assert.notEqual(check.item.key, first.item.key);
  assert.ok(picks.indexOf(check) >= A.TUNING.REVIEW_GAP - 1, 'not immediately');
});

test('answering a knowledge check correctly clears the missed concept', () => {
  const pool = fakePool(3, 10);
  const profile = A.newProfile();
  const session = A.newSession('all');
  const missed = { item: pool[0], event: null };
  A.recordAnswer(profile, session, missed, { correct: false });
  const res = A.recordAnswer(profile, session, { item: pool[1], event: 'check', reviewOf: pool[0].key }, { correct: true });
  assert.equal(res.learned, true);
  assert.equal(profile.missed[pool[0].key], undefined);
});

test('the missed queue is capped', () => {
  const pool = fakePool(5, 20);
  const profile = A.newProfile();
  const session = A.newSession('all');
  for (const item of pool) A.recordAnswer(profile, session, { item }, { correct: false });
  assert.equal(Object.keys(profile.missed).length, A.TUNING.REVIEW_MAX);
});

test('combo multiplier tiers and points', () => {
  assert.deepEqual([0, 1, 2, 3, 5, 6, 9, 10, 50].map(A.multiplierFor), [1, 1, 1, 2, 2, 3, 3, 4, 4]);
  const base = A.pointsFor({ d: 1, combo: 1 });
  assert.equal(base, A.TUNING.BASE_POINTS);
  assert.ok(A.pointsFor({ d: 5, combo: 1 }) > base, 'harder questions are worth more');
  assert.equal(A.pointsFor({ d: 1, combo: 1, event: 'boss' }), base * 3);
  assert.equal(A.pointsFor({ d: 1, combo: 3 }), base * 2);
  assert.equal(A.pointsFor({ d: 1, combo: 1, event: 'mystery', clues: 1 }), base * 1.5);
  assert.equal(A.pointsFor({ d: 1, combo: 1, event: 'mystery', clues: 5 }), base, 'clues never drop below ×1');
});

test('combos build, wrong answers reset them and score nothing; speed earns no points', () => {
  const pool = fakePool();
  const profile = A.newProfile();
  const session = A.newSession('all');
  const item = pool[0];
  let res;
  for (let i = 0; i < 4; i++) res = A.recordAnswer(profile, session, { item }, { correct: true, ms: 100 });
  assert.equal(session.combo, 4);
  assert.equal(res.multiplier, 2);
  const slow = A.recordAnswer(A.newProfile(), A.newSession('all'), { item }, { correct: true, ms: 50000 });
  const fast = A.recordAnswer(A.newProfile(), A.newSession('all'), { item }, { correct: true, ms: 500 });
  assert.equal(slow.points, fast.points);
  const scoreBefore = session.score;
  res = A.recordAnswer(profile, session, { item }, { correct: false });
  assert.equal(res.points, 0);
  assert.equal(session.score, scoreBefore);
  assert.equal(session.combo, 0);
  assert.equal(session.bestCombo, 4);
  assert.equal(session.lostCombo, 4, 'a broken combo of 3+ makes a comeback possible');
});

test('comeback restores half the lost combo', () => {
  const pool = fakePool();
  const session = A.newSession('all');
  const profile = A.newProfile();
  const res = A.recordAnswer(profile, session, { item: pool[0], event: 'comeback', restore: 6 }, { correct: true });
  assert.equal(res.restored, 3);
  assert.equal(session.combo, 4);
});

test('hot streak doubles the next HOT_LEN correct answers and ends on a miss', () => {
  const pool = fakePool();
  const item = { ...pool[0], d: 1 };
  const session = A.newSession('all');
  const profile = A.newProfile();
  const lit = A.recordAnswer(profile, session, { item, event: 'hot' }, { correct: true });
  assert.equal(lit.hotLit, true);
  assert.equal(session.hot, A.TUNING.HOT_LEN);
  const next = A.recordAnswer(profile, session, { item }, { correct: true });
  assert.equal(next.hotApplied, true);
  assert.equal(next.points, A.pointsFor({ d: 1, combo: 2 }) * 2);
  A.recordAnswer(profile, session, { item }, { correct: false });
  assert.equal(session.hot, 0);
  assert.equal(A.recordAnswer(profile, session, { item }, { correct: true }).hotApplied, false);
});

test('milestones fire once each', () => {
  const pool = fakePool();
  const profile = A.newProfile();
  const session = A.newSession('all');
  const all = [];
  for (let i = 0; i < 30; i++) all.push(...A.recordAnswer(profile, session, { item: pool[i % pool.length] }, { correct: true }).milestones.map((m) => m.id));
  assert.ok(all.includes('answered:10') && all.includes('answered:25') && all.includes('combo:5') && all.includes('combo:10'));
  assert.equal(new Set(all).size, all.length);
  assert.deepEqual(A.nextMilestone(session), { from: 25, to: 50 });
});

test('events are rare, varied and spaced out', () => {
  const profile = { ...A.newProfile(), skill: 3.5 };
  const session = A.newSession('all');
  const picks = play(realPool, profile, session, A.mulberry32(9), 600, (p, i) => i % 5 !== 4);
  const random = picks.map((p, i) => ({ e: p.event, i })).filter((x) => x.e && x.e !== 'check');
  const kinds = new Set(random.map((x) => x.e));
  assert.ok(random.length / picks.length < 0.3, `events stay rare (${random.length}/${picks.length})`);
  for (const k of ['boss', 'hot', 'mystery', 'quick']) assert.ok(kinds.has(k), `${k} appears`);
  for (let i = 1; i < random.length; i++) {
    if (random[i].e !== 'comeback') assert.ok(random[i].i - random[i - 1].i >= A.TUNING.EVENT_GAP, 'events are spaced');
  }
  const bosses = picks.filter((p) => p.event === 'boss');
  assert.ok(avg(bosses.map((p) => p.item.d)) >= 4, 'boss posts are hard');
});

test('the same seed gives the same feed', () => {
  const run = () => play(realPool, A.newProfile(), A.newSession('all'), A.mulberry32(42), 50, (p, i) => i % 2 === 0).map((p) => p.item.key + p.event);
  assert.deepEqual(run(), run());
});

test('the question bank is never modified', () => {
  const freeze = (o) => { Object.freeze(o); for (const v of Object.values(o)) if (v && typeof v === 'object' && !Object.isFrozen(v)) freeze(v); return o; };
  const quiz = { id: 'z', title: 'Z', semester: 'S', subject: 'c' };
  const entries = Array.from({ length: 12 }, (_, i) => ({ quiz, q: { question: 'q' + i, code: null, options: ['a', 'b', 'c'], correctIndex: 0, explanation: '', wrongExplanations: [] } }));
  freeze(entries);
  const pool = A.buildPool(entries);
  play(pool, A.newProfile(), A.newSession('all'), A.mulberry32(10), 60, (p, i) => i % 2 === 0);
});

test('corrupted saved data is repaired, valid data survives a JSON round trip', () => {
  for (const bad of [null, undefined, 'x', 42, [], { v: 2 }, { v: 1, skill: 'high', topics: [1], seen: 'no', missed: { a: 5, b: { t: 7 } } }]) {
    const p = A.sanitizeProfile(bad);
    assert.equal(p.skill, A.TUNING.SKILL_START);
    assert.deepEqual(p.missed, {});
  }
  const odd = A.sanitizeProfile({ v: 1, skill: 99, total: -3, topics: { t: { n: 2, c: 9, m: 7 } }, seen: { k: { n: 'x' } } });
  assert.equal(odd.skill, A.TUNING.SKILL_MAX);
  assert.equal(odd.total, 0);
  assert.deepEqual(odd.topics.t, { n: 2, c: 2, m: 1 });
  assert.deepEqual(odd.seen.k, { n: 0, c: 0, at: 0 });

  const profile = A.newProfile();
  const session = A.newSession('python');
  play(fakePool(), profile, session, A.mulberry32(11), 20, (p, i) => i % 3 !== 0);
  assert.deepEqual(A.sanitizeProfile(JSON.parse(JSON.stringify(profile))), profile);
  const now = 1e12;
  const stored = JSON.parse(JSON.stringify({ ...session, at: now - 1000 }));
  const resumed = A.sanitizeSession(stored, 'python', now);
  for (const k of ['score', 'combo', 'bestCombo', 'answered', 'correct']) assert.equal(resumed[k], session[k]);
  assert.deepEqual(resumed.shown, session.shown);
  assert.equal(resumed.hot, 0);
  assert.equal(A.sanitizeSession(stored, 'c', now), null, 'other feed');
  assert.equal(A.sanitizeSession(stored, 'python', now + A.TUNING.RESUME_MS), null, 'too old');
  assert.equal(A.sanitizeSession({ feed: 'python' }, 'python', now), null, 'no timestamp');
  assert.equal(A.sanitizeSession('garbage', 'python', now), null);
  assert.deepEqual(A.sanitizeSession({ feed: 'python', at: now, score: 'x', correct: 9, answered: 2, shown: [1, 'a'] }, 'python', now).shown, ['a']);
});

test('explanations split into a short summary and optional detail', () => {
  const long = 'Promise callbacks run as microtasks, before the next timer task. That is why "promise" prints before "timeout" here, even though setTimeout was called first in the code above.';
  const { brief, more } = A.splitExplanation(long);
  assert.equal(brief, 'Promise callbacks run as microtasks, before the next timer task.');
  assert.ok(more.startsWith('That is why'));
  assert.deepEqual(A.splitExplanation('Short one. Two.'), { brief: 'Short one. Two.', more: '' });
  assert.deepEqual(A.splitExplanation(undefined), { brief: '', more: '' });
});

test('quick takes claim the right answer about half the time', () => {
  const q = { options: ['a', 'b', 'c', 'd'], correctIndex: 2 };
  const rng = A.mulberry32(12);
  let trues = 0;
  for (let i = 0; i < 400; i++) {
    const t = A.makeQuickTake(q, rng);
    assert.equal(t.isTrue, t.claim === 2);
    trues += t.isTrue;
  }
  assert.ok(trues > 150 && trues < 250);
});
