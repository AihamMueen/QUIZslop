# POPQuiz — project context

A recreation of https://pythonquizs.vercel.app/ (a Python/C practice-quiz site) as a
**dependency-free static site**, extended with a **JavaScript** section and many extra questions.
No build step, no framework: open `index.html` or serve the folder (`python3 -m http.server`).

## Layout

```
index.html          Shell: top bar, theme toggle, <main id="app">, and the <script> load order
styles.css          All styling. Colour tokens on :root, dark mode via prefers-color-scheme + [data-theme]
js/bank.js          window.QuizBank registry: subjects list, addQuizzes(), addQuestions(), normalize()
js/app.js           The whole UI: hash router, home/tabs, mode select, quiz session, results, speedrun, keyboard, theme
data/original.js    Quizzes scraped from the original site (quiz1–quiz5 Python, quiz6–quiz13 C). Don't edit content
data/python-extra.js  Extra questions appended to quiz1–quiz5 via addQuestions()
data/python-new.js    New Python quizzes (semester "Extra Practice")
data/c-extra.js       Extra questions appended to quiz6–quiz13 (8 each)
data/c-new.js         New C quizzes: pointers, strings, structs & memory, output challenge
data/javascript-1.js  JS Fundamentals: basics, operators/coercion, control flow, functions
data/javascript-2.js  JS Core: arrays, objects, strings & numbers, scope/closures/this, classes
data/javascript-3.js  JS Advanced: async, DOM & events, ES6+, errors, output challenge
```

Script order in `index.html` matters: `bank.js` first, then `original.js` (creates quiz1–13),
then the extra/new files, then `app.js` last. **A new data file must be added to `index.html`.**

## Data format

```js
QuizBank.addQuizzes([{ id, subject: 'python'|'c'|'javascript', semester, title, description, questions: [...] }]);
QuizBank.addQuestions('quiz6', [ ...questions ]);   // append to an existing quiz; shows a "+N new" pill
```

A question uses either the long form (`question, code, options, correctIndex, explanation, wrongExplanations`,
as in original.js) or the short form used by every hand-written file:

```js
{ q: 'What is printed?', c: 'code snippet (optional)', o: ['A', 'B', 'C', 'D'], a: 1,
  e: 'Why the right answer is right.',
  w: ['why A is wrong', '', 'why C is wrong', 'why D is wrong'] }   // '' at the correct index
```

- Backticks in `q`, `o`, `e` and `w` render as inline `<code>`. `c` renders as a code block.
- Original questions embed code in the question text. `splitQuestion()` in app.js splits those into a prompt and a code block.
- `semester` is the heading the quiz is grouped under on the home page (e.g. "Semester 1", "Extra Practice",
  "JavaScript Fundamentals", "JavaScript Core", "JavaScript Advanced").
- Subjects (name, icon, blurb) live in `js/bank.js`. Badge colours are `.badge-<subject>` in styles.css.

## Features (app.js)

- Subject tabs with question counts. The chosen tab is remembered.
- A generated "Random Mix" quiz per subject (`#/quiz/mix-<subject>`): 20 random questions from all of that subject's quizzes.
- Two modes, as on the original site: **One by One** (instant feedback) and **Full Quiz** (score at the end, numbered dots to jump between questions).
- Options to shuffle question order and answer order. Answer shuffling is on by default.
- Timer, progress bar, keyboard shortcuts (1–9 / A–F to answer, Enter/→ for next, ← for previous).
- Results ring, "Retry N wrong", a review filtered to all or incorrect answers, and "why your answer is wrong" text.
- **Speedrun** (`#/speedrun`, linked from the top bar and a home-page card). The code is the "speedrun" section of app.js.
  Pick a subject (Python / C / JavaScript / All, with repeated questions removed) and a mode:
  - *Sprint*: 20 questions, +5s for each wrong answer, lowest time wins.
  - *Time Attack*: 60s on the clock, −3s for each wrong answer, most correct wins.
  - *Sudden Death*: 15s per question, the first wrong answer or timeout ends the run, longest streak wins.
  Each run starts with a 3-2-1 countdown and shows quick feedback (+1 / +5s / −3s). The results screen lists the missed questions with explanations.
  A run's URL is `#/speedrun/<mode>/<subject>`, and reloading it starts a fresh run. Tuning constants (SPRINT_SIZE etc.) are at the top of the section.
  Personal bests live in localStorage `popquiz-speedrun` as `{ "<mode>:<subject>": value }` (ms for sprint, a count otherwise).
- `reviewCard()` renders one reviewed question and is shared by quiz results and speedrun results.
- Best score per quiz, dark/light toggle. localStorage keys are prefixed `popquiz-`, and every access is wrapped in try/catch.

## Current totals (Oct 2026)

| Subject    | Quizzes | Questions |
|------------|---------|-----------|
| Python     | 10      | 181       |
| C          | 12      | 207       |
| JavaScript | 14      | 178       |

## Conventions / gotchas

- Every question needs 4 options (2–6 work), a valid `a`, and an explanation. `w` should have one entry per option, with `''` at the correct index.
- Avoid questions whose answer depends on undefined behaviour (C: `x++ + ++x`) or on the environment (JS: sloppy-mode `this` in a browser is `window`, and `window.name` is `""`).
- The hand-written files put most correct answers at index 1. That's fine while answer shuffling is on, but spread them out when adding new ones.
- The original data repeats some questions across quizzes (16 duplicates). That is faithful to the source, so leave them.
- Validate after editing data: load bank.js + all data files in Node's `vm` and check each question
  (a validator snippet is easy to rewrite: run each `<script src>` from index.html, except app.js, in one context and inspect `QuizBank.quizzes`).
  Verify "what is printed" answers by actually running them (`node -e`, `gcc`, `python3`).

## Ideas not done yet

- Deploy (e.g. Vercel). The site is fully static, so it needs no configuration.
- More JS: regex, modules in depth, Node.js basics, fetch/JSON practice.
- Per-question difficulty tags or a search/filter on the home page.
