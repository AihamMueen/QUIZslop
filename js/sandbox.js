// Runs player-written code for "Fix the code" challenges against the challenge's tests, away from the page.
// The code is untrusted: it runs only inside a dedicated Web Worker (no DOM, no localStorage, no access to the app's
// variables), created fresh for each run and terminated afterwards. Network and storage APIs are removed from the
// worker before any player code runs. The worker is killed after a time limit, so infinite loops can't hang the page.
// Challenge code that the app itself ships is never executed in the browser: its outputs are precomputed and
// checked by tests/gym.test.js.
//
// A test is { run, expect }: `run` is an expression, or statements ending in a `return` (e.g. 'const a = [1]; f(a); return a;').
// Optional `setup` is trusted helper code from the challenge (e.g. a stand-in button), run before the player's code.
//
// Sandbox.run(code, tests, { timeout, setup }) → Promise of
//   { ok, results: [{ run, pass, got, want, error, ms }], logs: [string], error: string | null, timedOut }
// `ok` is true only when every test ran and passed. Sandbox.core() gives the pure evaluator for Node tests.
(function (root) {
  'use strict';

  // Everything the worker needs, as one function whose source is shipped to the worker. It must not refer to
  // anything outside itself. Called with a worker scope it installs the message handler; called with null it just
  // returns the helpers (used in Node tests).
  function workerMain(scope) {
    const MAX_LOGS = 40, MAX_LEN = 300, TEST_MS = 1500;

    // A short, console.log-like rendering of a value: strings are quoted inside arrays and objects.
    function show(v, depth = 0, seen = []) {
      if (typeof v === 'string') return depth ? JSON.stringify(v) : v;
      if (v === undefined) return 'undefined';
      if (typeof v === 'number') return Object.is(v, -0) ? '-0' : String(v);
      if (typeof v === 'bigint') return v + 'n';
      if (typeof v === 'function') return `[Function${v.name ? ': ' + v.name : ''}]`;
      if (typeof v === 'symbol') return v.toString();
      if (v === null || typeof v !== 'object') return String(v);
      if (seen.includes(v)) return '[Circular]';
      if (depth > 4) return Array.isArray(v) ? '[Array]' : '[Object]';
      const next = seen.concat([v]);
      if (Array.isArray(v)) return '[' + v.map((x) => show(x, depth + 1, next)).join(', ') + ']';
      if (v instanceof Error) return `${v.name}: ${v.message}`;
      if (v instanceof Map) return `Map(${v.size}) {${[...v].map(([k, x]) => ` ${show(k, depth + 1, next)} => ${show(x, depth + 1, next)}`).join(',')} }`;
      if (v instanceof Set) return `Set(${v.size}) {${[...v].map((x) => ' ' + show(x, depth + 1, next)).join(',')} }`;
      if (typeof v.then === 'function') return 'Promise { … }';
      const keys = Object.keys(v);
      if (!keys.length) return '{}';
      const key = (k) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k));
      return '{ ' + keys.map((k) => `${key(k)}: ${show(v[k], depth + 1, next)}`).join(', ') + ' }';
    }

    // Structural equality for test results: same type, same keys, same values. NaN equals NaN.
    function same(a, b) {
      if (Object.is(a, b) || (a === 0 && b === 0)) return true;
      if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      const ka = Object.keys(a), kb = Object.keys(b);
      return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && same(a[k], b[k]));
    }

    const AsyncFunction = (async () => {}).constructor;
    const clip = (s) => (s.length > MAX_LEN ? s.slice(0, MAX_LEN) + '…' : s);
    const errText = (e) => clip(e && typeof e === 'object' && 'message' in e ? `${e.name || 'Error'}: ${e.message}` : 'Thrown: ' + show(e));

    const body = (run) => (/(^|[;{}\s])return\b/.test(run) ? run : `return (${run});`);

    // Runs each test against a fresh copy of the code, so one test's mutations can't leak into the next.
    // onResult(i, result) is called as each test finishes. Returns { results, logs, error }.
    async function evaluate(code, tests, { setup = '', onResult = () => {} } = {}) {
      const logs = [];
      const log = (...args) => { if (logs.length < MAX_LOGS) logs.push(clip(args.map((a) => show(a)).join(' '))); };
      const fakeConsole = { log, info: log, warn: log, error: log, debug: log };
      let error = null;
      try {
        new AsyncFunction('console', `${setup}\n${code}`); // eslint-disable-line no-new
      } catch (e) {
        error = errText(e);
      }
      const results = [];
      for (let i = 0; i < tests.length; i++) {
        const t = tests[i];
        // Results show strings quoted (depth 1), so "5" and 5 look different.
        const res = { run: t.run, pass: false, got: '', want: show(t.expect, 1), error: null, ms: 0 };
        if (error) res.error = error;
        else {
          const start = Date.now();
          let timer;
          try {
            const fn = new AsyncFunction('console', `${setup}\n${code}\n;${body(t.run)}`);
            const value = await Promise.race([
              fn(fakeConsole),
              new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`no result after ${TEST_MS / 1000}s (a promise that never settles?)`)), TEST_MS); }),
            ]);
            res.got = show(value, 1);
            res.pass = same(value, t.expect);
          } catch (e) {
            res.error = errText(e);
          } finally {
            clearTimeout(timer);
          }
          res.ms = Date.now() - start;
        }
        results.push(res);
        onResult(i, res);
      }
      return { results, logs, error };
    }

    if (!scope) return { show, same, evaluate };

    // ---- inside the worker: lock it down, then wait for one job ----
    const post = scope.postMessage.bind(scope);
    const blocked = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'indexedDB', 'caches',
      'BroadcastChannel', 'Worker', 'SharedWorker', 'navigator', 'postMessage', 'close', 'onmessage', 'Request', 'WebTransport'];
    for (const name of blocked) {
      for (let o = scope; o; o = Object.getPrototypeOf(o)) {
        try { if (Object.prototype.hasOwnProperty.call(o, name)) delete o[name]; } catch (e) { /* not configurable */ }
      }
      try { Object.defineProperty(scope, name, { value: undefined, writable: false, configurable: false }); } catch (e) { /* ignore */ }
    }
    let started = false;
    scope.addEventListener('unhandledrejection', (e) => e.preventDefault());
    scope.addEventListener('message', async (e) => {
      if (started || !e.data || typeof e.data.code !== 'string' || !Array.isArray(e.data.tests)) return;
      started = true;
      const { nonce, code, tests, setup } = e.data;
      const out = await evaluate(code, tests, { setup: typeof setup === 'string' ? setup : '', onResult: (i, result) => post({ nonce, kind: 'test', i, result }) });
      post({ nonce, kind: 'done', logs: out.logs, error: out.error });
    });
    return null;
  }

  const TIMEOUT_MS = 3000;
  let source = null;

  // Runs code against tests in a fresh worker. Never rejects: problems come back as { error }.
  function run(code, tests, { timeout = TIMEOUT_MS, setup = '' } = {}) {
    return new Promise((resolve) => {
      const results = new Array(tests.length).fill(null);
      const finish = (extra) => {
        clearTimeout(timer);
        try { worker && worker.terminate(); } catch (e) { /* ignore */ }
        if (url) URL.revokeObjectURL(url);
        const filled = results.map((r, i) => r || { run: tests[i].run, pass: false, got: '', want: '', error: extra.timedOut ? 'did not finish' : 'did not run', ms: 0 });
        resolve({ ok: !extra.error && !extra.timedOut && filled.every((r) => r.pass), results: filled, logs: [], error: null, timedOut: false, ...extra });
      };
      let worker = null, url = null, timer = null;
      const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
      try {
        source = source || `(${workerMain.toString()})(self);`;
        url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
        worker = new Worker(url);
      } catch (e) {
        finish({ error: 'Could not start the code sandbox in this browser, so the tests were not run.', unavailable: true });
        return;
      }
      timer = setTimeout(() => finish({ timedOut: true, error: `Stopped after ${timeout / 1000}s. Is there a loop that never ends?` }), timeout);
      worker.onmessage = (e) => {
        const m = e.data;
        if (!m || m.nonce !== nonce) return;
        if (m.kind === 'test' && Number.isInteger(m.i) && m.i >= 0 && m.i < tests.length) results[m.i] = m.result;
        else if (m.kind === 'done') finish({ logs: Array.isArray(m.logs) ? m.logs : [], error: m.error || null });
      };
      worker.onerror = (e) => { e.preventDefault(); finish({ error: e.message || 'The sandbox crashed.' }); };
      worker.postMessage({ nonce, code, setup, tests: tests.map((t) => ({ run: t.run, expect: t.expect })) });
    });
  }

  const api = { run, core: () => workerMain(null), TIMEOUT_MS };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Sandbox = api;
})(this);
