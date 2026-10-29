// Tests for the evaluator inside js/sandbox.js (the part that runs in the Web Worker). The worker plumbing itself
// (time limit, lockdown) needs a browser; this covers how tests are run, compared and reported.
const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluate, show, same } = require('../js/sandbox.js').core();

test('show renders values like console.log, quoting strings only inside structures', () => {
  assert.equal(show('hi'), 'hi');
  assert.equal(show(['a', 1, null, undefined]), '["a", 1, null, undefined]');
  assert.equal(show({ a: 1, 'b-c': [true] }), '{ a: 1, "b-c": [true] }');
  assert.equal(show({}), '{}');
  assert.equal(show(NaN), 'NaN');
  assert.equal(show(-0), '-0');
  assert.equal(show(function named() {}), '[Function: named]');
  assert.equal(show(new TypeError('x')), 'TypeError: x');
  const loop = { a: 1 }; loop.self = loop;
  assert.equal(show(loop), '{ a: 1, self: [Circular] }');
});

test('same compares by value', () => {
  assert.ok(same([1, { a: [2] }], [1, { a: [2] }]));
  assert.ok(same(NaN, NaN));
  assert.ok(same(0, -0));
  assert.ok(!same([1, 2], [2, 1]));
  assert.ok(!same({ a: 1 }, { a: 1, b: 2 }));
  assert.ok(!same([1], { 0: 1 }));
  assert.ok(!same('1', 1));
  assert.ok(!same(undefined, null));
});

test('expression and statement tests both work, and async results are awaited', async () => {
  const code = 'function f(a) { a.push(1); return a.length; }\nconst later = async (x) => x * 2;';
  const r = await evaluate(code, [
    { run: 'f([])', expect: 1 },
    { run: 'const a = [9]; f(a); return a;', expect: [9, 1] },
    { run: 'later(21)', expect: 42 },
    { run: 'f([5])', expect: 99 },
  ]);
  assert.equal(r.error, null);
  assert.deepEqual(r.results.map((x) => x.pass), [true, true, true, false]);
  assert.equal(r.results[3].got, '2');
  assert.equal(r.results[3].want, '99');
});

test('each test gets a fresh copy of the code, so mutations do not leak between tests', async () => {
  const r = await evaluate('const list = [];\nfunction add(x) { list.push(x); return list.length; }', [
    { run: 'add(1)', expect: 1 }, { run: 'add(1)', expect: 1 },
  ]);
  assert.deepEqual(r.results.map((x) => x.pass), [true, true]);
});

test('errors are reported per test, and a syntax error fails every test without running anything', async () => {
  const thrown = await evaluate('function f() { return undefined.x; }\nfunction g() { throw "plain"; }', [{ run: 'f()', expect: 1 }, { run: 'g()', expect: 1 }]);
  assert.match(thrown.results[0].error, /^TypeError: /);
  assert.equal(thrown.results[1].error, 'Thrown: plain');
  const syntax = await evaluate('function f( {', [{ run: 'f()', expect: 1 }, { run: '1', expect: 1 }]);
  assert.match(syntax.error, /^SyntaxError/);
  assert.ok(syntax.results.every((x) => !x.pass && /SyntaxError/.test(x.error)));
});

test('a promise that never settles fails that test instead of hanging', async () => {
  const r = await evaluate('const never = () => new Promise(() => {});', [{ run: 'never()', expect: 1 }, { run: '2', expect: 2 }]);
  assert.match(r.results[0].error, /never settles/);
  assert.equal(r.results[1].pass, true);
});

test('console output is captured, capped, and setup code runs before the player code', async () => {
  const r = await evaluate('console.log("hi", [1]);\nfor (let i = 0; i < 100; i++) console.log(i);\nconst y = x + 1;', [{ run: 'y', expect: 11 }], { setup: 'const x = 10;' });
  assert.equal(r.results[0].pass, true);
  assert.equal(r.logs[0], 'hi [1]');
  assert.ok(r.logs.length <= 40);
});

test('onResult reports each test as it finishes', async () => {
  const seen = [];
  await evaluate('', [{ run: '1', expect: 1 }, { run: '2', expect: 3 }], { onResult: (i, res) => seen.push([i, res.pass]) });
  assert.deepEqual(seen, [[0, true], [1, false]]);
});
