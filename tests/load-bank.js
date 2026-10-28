// Loads js/bank.js and every data file listed in index.html into a sandbox, the way the browser does.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function loadBank() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1])
    .filter((src) => src === 'js/bank.js' || src.startsWith('data/'));
  const ctx = vm.createContext({});
  ctx.window = ctx;
  for (const src of scripts) vm.runInContext(fs.readFileSync(path.join(ROOT, src), 'utf8'), ctx, { filename: src });
  return { QuizBank: ctx.QuizBank, scripts };
}

module.exports = { loadBank, ROOT };
