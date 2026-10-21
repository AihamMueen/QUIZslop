// Central registry for quiz data. Data files call QuizBank.addQuizzes / addQuestions.
//
// Question objects accept either the long form
//   { question, code, options, correctIndex, explanation, wrongExplanations }
// or the short form
//   { q, c, o, a, e, w }
(function () {
  const subjects = [
    { id: 'python', name: 'Python', icon: 'Py', blurb: 'Data structures, control flow, functions, OOP and more.' },
    { id: 'c', name: 'C', icon: 'C', blurb: 'Syntax, operators, branching, loops, I/O, functions, arrays and pointers.' },
    { id: 'javascript', name: 'JavaScript', icon: 'JS', blurb: 'Types, functions, closures, arrays, objects, DOM, async and ES6+.' },
  ];
  const quizzes = [];

  function normalize(q) {
    return {
      question: q.question ?? q.q,
      code: q.code ?? q.c ?? null,
      options: q.options ?? q.o,
      correctIndex: q.correctIndex ?? q.a,
      explanation: q.explanation ?? q.e ?? '',
      wrongExplanations: q.wrongExplanations ?? q.w ?? [],
    };
  }

  function addQuizzes(list) {
    for (const quiz of list) {
      quizzes.push({ ...quiz, questions: quiz.questions.map(normalize), added: 0 });
    }
  }

  function addQuestions(quizId, list) {
    const quiz = quizzes.find((z) => z.id === quizId);
    if (!quiz) throw new Error('Unknown quiz: ' + quizId);
    quiz.questions.push(...list.map(normalize));
    quiz.added += list.length;
  }

  window.QuizBank = { subjects, quizzes, addQuizzes, addQuestions };
})();
