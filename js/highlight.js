// Tiny syntax highlighter for the quiz code blocks (no DOM). Highlight.code(src, lang) returns escaped HTML
// with <span class="tok-*"> around comments, strings, numbers, keywords, built-ins and calls.
// It's a single-pass regex tokenizer: good enough for short snippets, not a parser.
(function (root) {
  const words = (s) => s.split(' ');
  const LANGS = {
    python: {
      comment: /#[^\n]*/,
      string: /[rRbBfFuU]{0,2}(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')/,
      keywords: words('and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield'),
      literals: words('True False None self'),
      builtins: words('print len range int str float list dict set tuple bool type input sorted reversed enumerate zip map filter sum min max abs round open isinstance super any all ord chr id iter next'),
    },
    c: {
      comment: /\/\/[^\n]*|\/\*[\s\S]*?\*\/|#\s*\w+[^\n]*/,
      string: /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/,
      keywords: words('auto break case const continue default do else enum extern for goto if inline register return sizeof static struct switch typedef union volatile while'),
      literals: words('NULL true false EOF'),
      builtins: words('int char float double long short unsigned signed void bool size_t FILE printf scanf malloc calloc realloc free strlen strcpy strcmp strcat puts gets fgets putchar getchar sqrt pow abs exit'),
    },
    javascript: {
      comment: /\/\/[^\n]*|\/\*[\s\S]*?\*\//,
      string: /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\[\s\S]|[^`\\])*`/,
      keywords: words('async await break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new of return static super switch throw try typeof var void while with yield get set'),
      literals: words('true false null undefined NaN Infinity this'),
      builtins: words('console Math JSON Object Array String Number Boolean Promise Symbol Map Set WeakMap Date Error RegExp document window setTimeout setInterval parseInt parseFloat'),
    },
  };

  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const span = (cls, s) => `<span class="tok-${cls}">${esc(s)}</span>`;

  const tokenizers = {};
  function tokenizer(lang) {
    if (tokenizers[lang]) return tokenizers[lang];
    const L = LANGS[lang];
    // Order matters: comments and strings first so keywords inside them are left alone.
    const re = new RegExp([
      '(' + L.comment.source + ')',
      '(' + L.string.source + ')',
      '(\\b(?:0[xX][\\da-fA-F]+|\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)[a-zA-Z]*\\b)',
      '([A-Za-z_$][\\w$]*)',
    ].join('|'), 'g');
    return (tokenizers[lang] = { re, keywords: new Set(L.keywords), literals: new Set(L.literals), builtins: new Set(L.builtins) });
  }

  function code(src, lang) {
    src = String(src);
    if (!LANGS[lang]) return esc(src);
    const { re, keywords, literals, builtins } = tokenizer(lang);
    let out = '', last = 0, m;
    re.lastIndex = 0;
    while ((m = re.exec(src))) {
      out += esc(src.slice(last, m.index));
      last = re.lastIndex;
      const [tok, comment, string, number, word] = m;
      if (comment) out += span('comment', comment);
      else if (string) out += span('string', string);
      else if (number) out += span('number', number);
      else if (keywords.has(word)) out += span('keyword', word);
      else if (literals.has(word)) out += span('literal', word);
      else if (builtins.has(word)) out += span('builtin', word);
      else if (/^\s*\(/.test(src.slice(last))) out += span('call', word);
      else out += esc(tok);
    }
    return out + esc(src.slice(last));
  }

  const api = { code, LANGS };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Highlight = api;
})(this);
