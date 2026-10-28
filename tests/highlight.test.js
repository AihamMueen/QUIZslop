// Tests for js/highlight.js. Run with `node --test` (no dependencies).
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('../js/highlight.js');
const { loadBank } = require('./load-bank');

const { QuizBank } = loadBank();
const strip = (html) => html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

test('highlighting never changes the code text', () => {
  for (const quiz of QuizBank.quizzes) {
    for (const q of quiz.questions) {
      const src = q.code || q.question;
      assert.equal(strip(H.code(src, quiz.subject)), src, quiz.id + ': ' + q.question.slice(0, 40));
    }
  }
});

test('output is escaped', () => {
  assert.ok(!H.code('<script>alert(1)</script>', 'javascript').includes('<script>'));
  assert.equal(H.code('<b>', 'unknown'), '&lt;b&gt;');
});

test('keywords inside strings and comments are not highlighted as keywords', () => {
  assert.equal(H.code('"for if"', 'python'), '<span class="tok-string">&quot;for if&quot;</span>');
  assert.equal(H.code('// return x', 'c'), '<span class="tok-comment">// return x</span>');
  assert.match(H.code('x = 1 # while', 'python'), /tok-comment">#/);
});

test('each language gets its own tokens', () => {
  assert.match(H.code('def f(): pass', 'python'), /tok-keyword">def<.*tok-call">f</);
  assert.match(H.code('#include <stdio.h>', 'c'), /^<span class="tok-comment">#include/);
  assert.match(H.code('const s = `a ${b}`;', 'javascript'), /tok-keyword">const<.*tok-string">`a \$\{b\}`/);
  assert.match(H.code('let x = 0x1F;', 'javascript'), /tok-number">0x1F/);
});
