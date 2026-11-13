// Value parsing / normalisation shared by the product importers
// (import-products.js — fill-only, import-product-content.js — authoritative).
// Both must turn the same CSV cell into the same DB value, otherwise re-running
// one after the other would flip values back and forth.

// Canonical attribute values: [uk, ru, …source spellings (lower case)]. The list order is
// the display order (attribute_values.sort_order). Unknown spellings are created as written
// and reported as warnings.
const VALUES = {
  insertion: [
    ['Онікс', 'Оникс', 'онікс'],
    ['Нефрит', 'Нефрит', 'нефрит'],
    ['Сердолік', 'Сердолик', 'сердолік'],
    ['Перламутр', 'Перламутр', 'перламутр', 'перламутрм'],
    ['Малахіт', 'Малахит', 'малахіт'],
    ['Емаль', 'Эмаль', 'емаль', 'біла емаль', 'чорна емаль', 'блакитна емаль', 'рожева емаль', 'червона емаль'],
    ['Золото 375°', 'Золото 375°', 'золото 375°', 'золото 375 проби', 'золото 375'],
    ['Фіаніт', 'Фианит', 'фіаніт', 'фіаніти'],
    ['Кубічний цирконій', 'Кубический цирконий', 'кубічний цирконій', 'куб.цирконій', 'куб.цикроній', 'куб. цирконій'],
    ['Без вставок', 'Без вставок', 'без вставок', 'без вставки'],
  ],
  insertion_color: [
    ['Прозорий', 'Прозрачный', 'прозорий'],
    ['Білий', 'Белый', 'білий'],
    ['Чорний', 'Чёрный', 'чорний'],
    ['Зелений', 'Зелёный', 'зелений'],
    ['Червоний', 'Красный', 'червоний'],
    ['Рожевий', 'Розовый', 'рожевий'],
    ['Ніжно-рожевий', 'Нежно-розовый', 'ніжно-рожевий'],
    ['Блакитний', 'Голубой', 'блакитний'],
    ['Синій', 'Синий', 'синій'],
    ['Бірюзовий', 'Бирюзовый', 'бірюзовий'],
    ['Жовто-блакитний', 'Жёлто-голубой', 'жовто-блакитний'],
    ['Золотий', 'Золотой', 'золотий'],
    ['Перламутровий', 'Перламутровый', 'перламутр', 'перламутровий'],
    ['Різнокольоровий', 'Разноцветный', 'різнокольоровий'],
  ],
  metal: [
    ['Срібло 925°', 'Серебро 925°', 'срібло 925°', 'срібло 925', 'срібло 925 проби'],
  ],
  coating: [
    ['Родій', 'Родий', 'родій'],
    ['Позолота', 'Позолота', 'позолота'],
  ],
  clasp: [
    ['Англійська застібка', 'Английский замок', 'англійська защібка', 'англійська застібка'],
    ['Пусети', 'Пусеты', 'пусети'],
    ['Конго', 'Конго', 'конго'],
    ['Протяжки', 'Протяжки', 'протяжки'],
    ['Кафи', 'Каффы', 'кафи'],
  ],
};
// «Без вставок» in the colour column means «no colour» — no link.
const SKIP_VALUES = { insertion_color: ['без вставок', 'без вставки'] };

function detectDelimiter(text) {
  const first = text.split(/\r?\n/, 1)[0];
  return (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
}

function parseCsv(text) {
  text = text.replace(/^﻿/, '');
  const delimiter = detectDelimiter(text);
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === delimiter) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [header = [], ...data] = rows.filter((r) => r.some((v) => v.trim() !== ''));
  const names = header.map((h) => h.trim());
  return { header: names, rows: data.map((r, i) => ({ line: i + 2, ...Object.fromEntries(names.map((h, j) => [h, r[j] ?? ''])) })) };
}

const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i',
  й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh',
  ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', ы: 'y', э: 'e', ё: 'e', ъ: '', "'": '', '’': '',
};
const slugify = (s) =>
  [...s.toLowerCase()].map((c) => TRANSLIT[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const oneLine = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
const KEEP_RE = /^(same)?$/i; // empty or «Same» → keep the current value
const isKeep = (v) => KEEP_RE.test(oneLine(v));

/** Plain-text description: trimmed lines, paragraphs separated by one blank line. */
function cleanText(v) {
  return String(v ?? '')
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.split('\n').map((l) => l.replace(/[ \t ]+/g, ' ').trim()).filter(Boolean).join('\n'))
    .filter(Boolean)
    .join('\n\n');
}
// "1,20 г" / "3,03г" / "1.40 г" / "5,0 г" → "1.200"; invalid → undefined; empty → null
function parseWeight(v) {
  const t = oneLine(v).toLowerCase().replace(/\s*(г|гр|g)\.?$/, '').replace(',', '.');
  if (!t) return null;
  return /^\d+(\.\d+)?$/.test(t) && Number(t) > 0 && Number(t) < 1000 ? Number(t).toFixed(3) : undefined;
}
function parsePrice(v) {
  const t = oneLine(v).replace(/[\s ]/g, '').replace(',', '.');
  if (!t) return null;
  return /^\d+(\.\d{1,2})?$/.test(t) && Number(t) > 0 ? Number(t).toFixed(2) : undefined;
}
// "17-19 см " → "17–19 см"; "40–45 см" kept; numeric size only for a single number ("16 см")
function normSizeLabel(v) {
  return oneLine(v).replace(/(\d)\s*[-–—]\s*(\d)/g, '$1–$2').replace(/(\d)\s*см/i, '$1 см');
}
function parseSize(label) {
  const m = label?.match(/^(\d+(?:[.,]\d+)?)\s*(см)?$/i);
  return m ? Number(m[1].replace(',', '.')) : null;
}
const same = (a, b) => {
  const num = (x) => typeof x === 'number' || (typeof x === 'string' && /^-?\d+(\.\d+)?$/.test(x));
  if (num(a) && num(b)) return Number(a) === Number(b);
  return String(a ?? '') === String(b ?? '');
};

/** Split a cell into canonical values: [{ key, uk, ru, sort, known }] (deduplicated, source order). */
function parseValues(field, cell, warn) {
  const out = [];
  for (const raw of String(cell ?? '').split(/[,;]/)) {
    const spelling = oneLine(raw).toLowerCase();
    if (!spelling || (SKIP_VALUES[field] || []).includes(spelling)) continue;
    const list = VALUES[field] || [];
    const i = list.findIndex(([, , ...spellings]) => spellings.includes(spelling));
    let v;
    if (i >= 0) v = { uk: list[i][0], ru: list[i][1], sort: i + 1, known: true };
    else {
      const uk = oneLine(raw).charAt(0).toUpperCase() + oneLine(raw).slice(1);
      v = { uk, ru: null, sort: 100, known: false };
      warn(field, `unknown value "${oneLine(raw)}" — created as written, no ru translation`);
    }
    v.slug = slugify(v.uk);
    if (!out.some((o) => o.slug === v.slug)) out.push(v);
  }
  return out;
}

module.exports = {
  VALUES, SKIP_VALUES, parseCsv, slugify, oneLine, isKeep, cleanText,
  parseWeight, parsePrice, normSizeLabel, parseSize, same, parseValues,
};
