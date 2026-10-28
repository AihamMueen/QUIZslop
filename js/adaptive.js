// Adaptive engine for Doomscroll: difficulty estimates, the player profile, question selection, events and scoring.
// Pure logic with no DOM access, so it also runs in Node (tests/adaptive.test.js). Randomness always comes from
// an injected rng() (see mulberry32), and question-bank objects are only read, never modified.
(function (root) {
  'use strict';

  const TUNING = {
    // Skill is an Elo-like rating on the same 1–5 scale as question difficulty.
    SKILL_START: 2, SKILL_MIN: 1, SKILL_MAX: 5,
    SKILL_K: 0.3,          // how far one answer can move skill (keeps changes gradual)
    SKILL_SLOPE: 1.2,      // how sharply expected success falls as difficulty exceeds skill
    SLOW_MS: 60000,        // a correct answer slower than this counts as 0.75 of a correct answer for skill
    SLOW_CREDIT: 0.75,
    // Each pick fills one slot. Struggling or cruising shifts the weights, quietly.
    SLOTS: { core: 0.55, stretch: 0.2, easy: 0.1, review: 0.15 },
    STRETCH: 1, EASE: 1.25,               // target offsets from skill for stretch / easy picks
    FORM_WINDOW: 6, STRUGGLE_ACC: 0.5, CRUISE_ACC: 0.85,
    NOISE: 0.9,            // random jitter added to candidate scores so the feed stays unpredictable
    RECENT_WINDOW: 30,     // a question won't come back within this many picks (scaled down for small pools)
    REVIEW_GAP: 4,         // answers before a missed concept can come back
    REVIEW_MAX: 40,        // missed concepts remembered
    MASTERY_ALPHA: 0.3, MASTERY_MIN_N: 3,
    // Events
    EVENT_CHANCE: 0.15, EVENT_GAP: 6, HOT_LEN: 3, COMEBACK_MIN: 3, COMEBACK_CHANCE: 0.5,
    EVENT_MULT: { boss: 3, check: 1.5, mystery: 2, comeback: 1.5 },
    CLUE_COST: 0.5,
    // Scoring: no speed bonus, points come from difficulty, combo and events.
    BASE_POINTS: 100, DIFF_POINTS: 25,
    COMBO_TIERS: [[10, 4], [6, 3], [3, 2]],
    MILESTONES: { answered: [10, 25, 50, 100, 200], combo: [5, 10, 20], score: [2500, 10000, 25000, 50000] },
    RESUME_MS: 30 * 60 * 1000,
  };

  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const num = (x, fallback) => (typeof x === 'number' && isFinite(x) ? x : fallback);
  const count = (x) => Math.max(0, Math.floor(num(x, 0)));
  const entriesOf = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? Object.entries(o) : []);

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Short stable key for a question (djb2 of its text and code).
  function questionKey(q) {
    const s = String(q.question) + '\n' + (q.code || '');
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0;
    return h.toString(36) + s.length.toString(36);
  }

  // The bank has no difficulty tags, so estimate from what the question looks like: code to trace, long options,
  // a long explanation, a "challenge" quiz. Returns a raw score; buildPool spreads the scores over 1–5.
  function estimateDifficulty(q, quiz) {
    const text = String(q.question || '');
    const code = q.code || (text.includes('\n') ? text : '');
    const lines = code ? code.split('\n').length : 0;
    const opts = Array.isArray(q.options) ? q.options : [];
    const avgOpt = opts.length ? opts.reduce((n, o) => n + String(o).length, 0) / opts.length : 0;
    let d = 1;
    if (code) d += 1 + Math.min(lines, 12) * 0.08;
    d += Math.min(avgOpt, 60) / 40;
    d += Math.min(text.length, 200) / 400 + Math.min(String(q.explanation || '').length, 300) / 600;
    if (opts.length > 4) d += 0.25;
    if (quiz && /challenge|advanced|deep dive/i.test(quiz.title + ' ' + quiz.semester)) d += 0.5;
    return d;
  }

  // [{ q, quiz }] -> pool entries with difficulty d from 1 to 5 (steps of 0.5) by percentile within the pool.
  // The question and quiz are referenced, not copied or changed.
  function buildPool(entries) {
    const raw = entries.map(({ q, quiz }) => estimateDifficulty(q, quiz));
    const sorted = raw.slice().sort((a, b) => a - b);
    const rank = (x) => {
      let lo = 0, hi = sorted.length;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (sorted[mid] < x) lo = mid + 1; else hi = mid; }
      return sorted.length > 1 ? lo / (sorted.length - 1) : 0.5;
    };
    return entries.map(({ q, quiz }, i) => ({ q, quiz, key: questionKey(q), topic: quiz.id, d: Math.round((1 + 4 * rank(raw[i])) * 2) / 2 }));
  }

  // The player's own history nudges a question's difficulty: missed ones count as harder, mastered ones as easier.
  function effectiveDifficulty(item, profile) {
    const s = profile.seen[item.key];
    if (!s) return item.d;
    return clamp(item.d + clamp(0.4 * (s.n - s.c) - 0.2 * s.c, -1, 1), 1, 5);
  }

  // ---------- profile (persisted) and session ----------
  const newProfile = () => ({ v: 1, skill: TUNING.SKILL_START, total: 0, topics: {}, seen: {}, missed: {} });

  // Rebuilds a profile from stored data, dropping anything malformed.
  function sanitizeProfile(raw) {
    const p = newProfile();
    if (!raw || typeof raw !== 'object' || raw.v !== 1) return p;
    p.skill = clamp(num(raw.skill, p.skill), TUNING.SKILL_MIN, TUNING.SKILL_MAX);
    p.total = count(raw.total);
    for (const [k, t] of entriesOf(raw.topics)) {
      if (!t || typeof t !== 'object') continue;
      const n = count(t.n);
      p.topics[k] = { n, c: Math.min(n, count(t.c)), m: clamp(num(t.m, 0.5), 0, 1) };
    }
    for (const [k, s] of entriesOf(raw.seen)) {
      if (!s || typeof s !== 'object') continue;
      const n = count(s.n);
      p.seen[k] = { n, c: Math.min(n, count(s.c)), at: Math.min(p.total, count(s.at)) };
    }
    for (const [k, m] of entriesOf(raw.missed)) {
      if (m && typeof m.t === 'string') p.missed[k] = { t: m.t, at: Math.min(p.total, count(m.at)) };
    }
    return p;
  }

  const newSession = (feed) => ({
    feed, score: 0, combo: 0, bestCombo: 0, answered: 0, correct: 0,
    recent: [], shown: [], topics: {}, missedTopics: [], milestones: [],
    sinceEvent: 0, lastEvent: null, lastTopic: null, hot: 0, lostCombo: 0,
  });

  // A stored session resumes only for the same feed and if it is recent; event state starts fresh.
  function sanitizeSession(raw, feed, now) {
    if (!raw || typeof raw !== 'object' || raw.feed !== feed || !(now - num(raw.at, -Infinity) < TUNING.RESUME_MS)) return null;
    const s = newSession(feed);
    for (const k of ['score', 'combo', 'bestCombo', 'answered', 'correct']) s[k] = count(raw[k]);
    s.correct = Math.min(s.correct, s.answered);
    s.bestCombo = Math.max(s.bestCombo, s.combo);
    const strings = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === 'string') : []);
    s.shown = strings(raw.shown).slice(-200);
    s.missedTopics = strings(raw.missedTopics);
    s.milestones = strings(raw.milestones);
    s.recent = Array.isArray(raw.recent) ? raw.recent.filter((x) => typeof x === 'boolean').slice(-TUNING.FORM_WINDOW) : [];
    for (const [k, t] of entriesOf(raw.topics)) {
      if (t && typeof t === 'object') { const n = count(t.n); s.topics[k] = { n, c: Math.min(n, count(t.c)) }; }
    }
    return s;
  }

  // ---------- selection ----------
  function form(session) {
    const r = session.recent.slice(-TUNING.FORM_WINDOW);
    if (r.length < 4) return 'normal';
    const acc = r.filter(Boolean).length / r.length;
    return acc < TUNING.STRUGGLE_ACC ? 'struggling' : r.length >= TUNING.FORM_WINDOW && acc >= TUNING.CRUISE_ACC ? 'cruising' : 'normal';
  }

  function slotWeights(session, hasReview) {
    const w = { ...TUNING.SLOTS };
    const f = form(session);
    if (f === 'struggling') { w.easy += 0.25; w.stretch = 0.05; }
    else if (f === 'cruising') { w.stretch += 0.15; w.easy = 0.05; }
    if (!hasReview) w.review = 0;
    return w;
  }

  function weightedPick(weights, rng) {
    const list = Object.entries(weights).filter(([, w]) => w > 0);
    let r = rng() * list.reduce((n, [, w]) => n + w, 0);
    for (const [k, w] of list) { if ((r -= w) < 0) return k; }
    return list[list.length - 1][0];
  }

  // Random events (Knowledge Check is not one: it comes from the review slot).
  function rollEvent(profile, session, rng) {
    if (session.lostCombo >= TUNING.COMEBACK_MIN && rng() < TUNING.COMEBACK_CHANCE) return 'comeback';
    if (session.hot > 0 || session.sinceEvent < TUNING.EVENT_GAP || rng() >= TUNING.EVENT_CHANCE) return null;
    const options = ['mystery', 'quick'];
    if (session.combo >= 3) options.push('hot');
    if (session.answered >= 8 && (session.combo >= 4 || profile.skill >= 3)) options.push('boss');
    const choices = options.filter((e) => e !== session.lastEvent);
    return choices[Math.floor(rng() * choices.length)];
  }

  function scoreCandidate(item, target, profile, session, rng) {
    let s = -Math.abs(effectiveDifficulty(item, profile) - target);
    const seen = profile.seen[item.key];
    if (!seen) s += 0.4;
    else {
      const ago = profile.total - seen.at, span = TUNING.RECENT_WINDOW * 2;
      if (ago < span) s -= 1.5 * (1 - ago / span);
      if (seen.c >= 2 && seen.c === seen.n) s -= 0.5;
    }
    const topic = profile.topics[item.topic];
    if (topic && topic.n >= TUNING.MASTERY_MIN_N) s += (0.5 - topic.m) * 0.6;
    if (item.topic === session.lastTopic) s -= 0.4;
    return s + rng() * TUNING.NOISE;
  }

  function best(candidates, target, profile, session, rng) {
    let top = null, topScore = -Infinity;
    for (const it of candidates) {
      const s = scoreCandidate(it, target, profile, session, rng);
      if (s > topScore) { top = it; topScore = s; }
    }
    return top;
  }

  // Picks the next question. opts.exclude: keys never to pick; opts.strict: return null rather than repeat.
  // Returns { item, slot, event, target, restore?, reviewOf? } and records the pick in the session.
  function pickNext(pool, profile, session, rng, opts = {}) {
    const exclude = new Set(opts.exclude || []);
    const windowSize = Math.min(TUNING.RECENT_WINDOW, Math.floor(pool.length * 0.6));
    if (windowSize > 0) for (const k of session.shown.slice(-windowSize)) exclude.add(k);
    let avail = pool.filter((it) => !exclude.has(it.key));
    if (!avail.length) {
      if (opts.strict || !pool.length) return null;
      const last = session.shown[session.shown.length - 1];
      avail = pool.length > 1 ? pool.filter((it) => it.key !== last) : pool;
    }

    session.sinceEvent++;
    const skill = profile.skill;
    let event = rollEvent(profile, session, rng);
    const pick = { slot: 'event', event, target: skill };
    if (session.lostCombo) { pick.restore = event === 'comeback' ? session.lostCombo : undefined; session.lostCombo = 0; }

    let candidates = avail;
    if (event === 'boss') pick.target = Math.max(skill + 1.5, 4);
    else if (event === 'comeback') pick.target = skill - 0.5;
    else {
      const due = entriesOf(profile.missed)
        .filter(([key, m]) => profile.total - m.at >= TUNING.REVIEW_GAP &&
          avail.some((it) => it.topic === m.t && (it.key !== key || profile.total - m.at >= TUNING.REVIEW_GAP * 3)));
      pick.slot = weightedPick(slotWeights(session, due.length > 0), rng);
      if (pick.slot === 'review') {
        const [key, m] = due[Math.floor(rng() * due.length)];
        candidates = avail.filter((it) => it.topic === m.t && it.key !== key);
        if (!candidates.length) candidates = avail.filter((it) => it.key === key);
        pick.reviewOf = key;
        event = pick.event = 'check';
      } else {
        pick.target = pick.slot === 'stretch' ? skill + TUNING.STRETCH : pick.slot === 'easy' ? skill - TUNING.EASE : skill;
      }
    }
    if (event && event !== 'check') { session.sinceEvent = 0; session.lastEvent = event; }

    pick.item = best(candidates, pick.target, profile, session, rng);
    session.shown.push(pick.item.key);
    if (session.shown.length > 200) session.shown.splice(0, session.shown.length - 200);
    session.lastTopic = pick.item.topic;
    return pick;
  }

  // ---------- answering and scoring ----------
  function multiplierFor(combo) {
    for (const [n, m] of TUNING.COMBO_TIERS) if (combo >= n) return m;
    return 1;
  }

  const eventMultiplier = (event, clues = 0) => Math.max(1, (TUNING.EVENT_MULT[event] || 1) - (event === 'mystery' ? clues * TUNING.CLUE_COST : 0));

  function pointsFor({ d, combo, event, clues, hot }) {
    const base = TUNING.BASE_POINTS + TUNING.DIFF_POINTS * Math.round((d - 1) * 2);
    return Math.round(base * multiplierFor(combo) * eventMultiplier(event, clues) * (hot ? 2 : 1));
  }

  // Updates profile and session for an answer to `pick` (from pickNext; may carry .clues).
  // Returns what happened, for feedback: { points, multiplier, combo, hotApplied, hotLit, restored, learned, milestones }.
  function recordAnswer(profile, session, pick, { correct, ms = 0 }) {
    const T = TUNING, item = pick.item;
    const d = effectiveDifficulty(item, profile);
    const credit = correct ? (ms > T.SLOW_MS ? T.SLOW_CREDIT : 1) : 0;
    const expected = 1 / (1 + Math.exp(-T.SKILL_SLOPE * (profile.skill - d)));
    profile.skill = clamp(profile.skill + T.SKILL_K * (pick.event === 'quick' ? 0.5 : 1) * (credit - expected), T.SKILL_MIN, T.SKILL_MAX);

    const topic = profile.topics[item.topic] || (profile.topics[item.topic] = { n: 0, c: 0, m: 0.5 });
    topic.n++; topic.c += correct ? 1 : 0;
    topic.m = clamp(topic.m + T.MASTERY_ALPHA * ((correct ? 1 : 0) - topic.m), 0, 1);
    const seen = profile.seen[item.key] || (profile.seen[item.key] = { n: 0, c: 0, at: 0 });
    seen.n++; seen.c += correct ? 1 : 0; seen.at = profile.total;
    profile.total++;

    let learned = false;
    if (correct) {
      delete profile.missed[item.key];
      if (pick.reviewOf && profile.missed[pick.reviewOf]) { delete profile.missed[pick.reviewOf]; learned = true; }
    } else {
      profile.missed[item.key] = { t: item.topic, at: profile.total };
      const keys = Object.keys(profile.missed);
      if (keys.length > T.REVIEW_MAX) {
        keys.sort((a, b) => profile.missed[a].at - profile.missed[b].at).slice(0, keys.length - T.REVIEW_MAX).forEach((k) => delete profile.missed[k]);
      }
    }

    const st = session.topics[item.topic] || (session.topics[item.topic] = { n: 0, c: 0 });
    st.n++; st.c += correct ? 1 : 0;
    session.answered++;
    session.recent.push(!!correct);
    if (session.recent.length > T.FORM_WINDOW) session.recent.shift();

    let points = 0, restored = 0, hotApplied = false, hotLit = false;
    if (correct) {
      session.correct++;
      if (pick.restore) { restored = Math.floor(pick.restore / 2); session.combo = Math.max(session.combo, restored); }
      session.combo++;
      hotApplied = session.hot > 0;
      if (hotApplied) session.hot--;
      points = pointsFor({ d, combo: session.combo, event: pick.event, clues: pick.clues, hot: hotApplied });
      if (pick.event === 'hot') { session.hot = T.HOT_LEN; hotLit = true; }
    } else {
      if (session.combo >= T.COMEBACK_MIN) session.lostCombo = session.combo;
      session.combo = 0;
      session.hot = 0;
      if (!session.missedTopics.includes(item.topic)) session.missedTopics.push(item.topic);
    }
    session.score += points;
    session.bestCombo = Math.max(session.bestCombo, session.combo);

    const milestones = [];
    const hit = (id, value) => { if (!session.milestones.includes(id)) { session.milestones.push(id); milestones.push({ id, kind: id.split(':')[0], value }); } };
    for (const n of T.MILESTONES.answered) if (session.answered === n) hit('answered:' + n, n);
    for (const n of T.MILESTONES.combo) if (session.combo === n) hit('combo:' + n, n);
    for (const n of T.MILESTONES.score) if (session.score >= n && session.score - points < n) hit('score:' + n, n);

    return { points, multiplier: correct ? multiplierFor(session.combo) : 1, combo: session.combo, hotApplied, hotLit, restored, learned, milestones };
  }

  // ---------- helpers for presentation ----------
  const masteryOf = (profile, topicId) => {
    const t = profile.topics[topicId];
    return t && t.n >= TUNING.MASTERY_MIN_N ? t.m : null;
  };

  // Progress toward the next "answered" milestone, as { from, to } (to is null past the last one).
  function nextMilestone(session) {
    const list = TUNING.MILESTONES.answered;
    const to = list.find((n) => n > session.answered) ?? null;
    const from = [...list].reverse().find((n) => n <= session.answered) ?? 0;
    return { from, to };
  }

  // Topics the session went well / badly on, best first. Returns topic ids.
  function recap(session) {
    const list = Object.entries(session.topics).map(([id, t]) => ({ id, n: t.n, c: t.c, acc: t.c / t.n }));
    return {
      strengths: list.filter((t) => t.n >= 2 && t.acc >= 0.75).sort((a, b) => b.c - a.c || b.acc - a.acc).map((t) => t.id),
      improve: list.filter((t) => t.c < t.n).sort((a, b) => (b.n - b.c) - (a.n - a.c) || a.acc - b.acc).map((t) => t.id),
    };
  }

  // Splits an explanation into a first-sentence summary and the rest, for a short default with optional detail.
  function splitExplanation(text) {
    const s = String(text || '').trim();
    const m = /^([\s\S]{20,}?[.!?])\s+(?=[A-Z`("'])/.exec(s);
    if (s.length < 140 || !m || (m[1].split('`').length - 1) % 2) return { brief: s, more: '' };
    return { brief: m[1], more: s.slice(m[0].length) };
  }

  // A True/False version of a question: claim one of its options is the answer (the right one about half the time).
  function makeQuickTake(q, rng) {
    const wrong = q.options.map((_, i) => i).filter((i) => i !== q.correctIndex);
    const isTrue = !wrong.length || rng() < 0.5;
    return { claim: isTrue ? q.correctIndex : wrong[Math.floor(rng() * wrong.length)], isTrue };
  }

  const api = {
    TUNING, mulberry32, questionKey, estimateDifficulty, buildPool, effectiveDifficulty,
    newProfile, sanitizeProfile, newSession, sanitizeSession, form, pickNext,
    multiplierFor, eventMultiplier, pointsFor, recordAnswer, masteryOf, nextMilestone, recap, splitExplanation, makeQuickTake,
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Adaptive = api;
})(this);
