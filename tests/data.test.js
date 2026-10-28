// Checks every question in the bank is well formed (the validator described in CLAUDE.md).
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadBank } = require('./load-bank');

const { QuizBank, scripts } = loadBank();

test('index.html loads bank.js first and every data file', () => {
  assert.equal(scripts[0], 'js/bank.js');
  assert.ok(scripts.length >= 9);
});

test('every question has options, a valid answer and an explanation', () => {
  const ids = new Set();
  for (const quiz of QuizBank.quizzes) {
    assert.ok(!ids.has(quiz.id), 'duplicate quiz id ' + quiz.id);
    ids.add(quiz.id);
    assert.ok(QuizBank.subjects.some((s) => s.id === quiz.subject), quiz.id + ' subject');
    quiz.questions.forEach((q, i) => {
      const where = `${quiz.id} #${i + 1}`;
      assert.equal(typeof q.question, 'string', where);
      assert.ok(Array.isArray(q.options) && q.options.length >= 2 && q.options.length <= 6, where + ' options');
      assert.ok(Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < q.options.length, where + ' answer');
      assert.ok(q.explanation, where + ' explanation');
      assert.ok(q.wrongExplanations.length <= q.options.length, where + ' wrong explanations');
    });
  }
});
