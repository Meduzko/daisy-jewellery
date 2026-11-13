/* eslint-disable no-console */
// Merges the owner's Google-Sheets exports into the DNTrade category CSVs (Phase 1 of the
// product-data migration). Read-only for the inputs; writes 4 merged CSVs + log + summary.
//
//   node db/import/merge-source-sheets.js --sheets=<folder with the 4 sheet CSVs> \
//        [--old=db/products_csv] [--out=db/products_csv/merged-<date>]
// Review merge-summary.md / merge-log.csv, then copy the 4 merged CSVs over db/products_csv/.
//
// Rules
// - Match key: «Код» (Артикул is shared by several products, so it is never used as the key).
// - A sheet value replaces the old value only when it differs in substance. Empty / «Same» / «-»
//   keeps the old value; formatting-only differences (2200 vs 2200,00, 3,01г vs 3,01 г, spaces,
//   -/–) keep the old formatting.
// - «Артикул» is an identifier (ring sizes, DNTrade): never changed here. Sheet values that are
//   Google-Sheets numeric coercions (0698,10 → 698,1) are logged as format_only, real
//   differences as conflict.
// - «#довжина» (bracelet/necklace length) is kept as it is: a range such as «16–19 см» would drop the
//   numeric variant size and break the size filter. Differences are logged as kept_old.
// - Invalid sheet values (price / weight that do not parse) are not written and are logged as invalid.
// - «Same» in «Опис товару (SEO)» means «same text as the product with the same Артикул» (owner,
//   2026-11-13): the description of that product's sheet row is used when exactly one such row has
//   a real text; otherwise the old value is kept and the cell is logged as a placeholder.
// - Products only in the old file are kept; products only in the sheet are appended and logged.
// - Duplicate codes (inside a file or across categories) or unknown sheet columns abort the run.
const fs = require('fs');
const path = require('path');
const {
  parseCsv, oneLine, cleanText, parseWeight, parsePrice, normSizeLabel,
} = require('./lib/catalog-values');

const ROOT = path.resolve(__dirname, '../..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, '').split('=');
  return [k, v.length ? v.join('=') : true];
}));
const today = new Date().toISOString().slice(0, 10);
const OLD_DIR = path.resolve(ROOT, args.old || 'db/products_csv');
if (!args.sheets) { console.error('--sheets=<folder with the owner\'s sheet CSVs> is required'); process.exit(1); }
const SHEETS_DIR = path.resolve(ROOT, args.sheets);
const OUT_DIR = path.resolve(ROOT, args.out || `db/products_csv/merged-${today}`);

const nfc = (s) => s.normalize('NFC');
const PLACEHOLDER_RE = /^(same|-|–|—)?$/i;
const isPlaceholder = (v) => PLACEHOLDER_RE.test(oneLine(v));

// Sheet column → old column, per category. null = known column that is deliberately not merged.
const COMMON = {
  'Код': 'Код', 'Артикул': 'Артикул', 'Ціна': 'Ціна', 'Опис товару (SEO)': 'Опис',
  'Вставка': '#вставка', 'Колір вставки': 'Колір вставки', 'Матеріал': 'Матеріал',
  'Покриття': 'Покриття', 'Середня вага': 'Середня вага',
};
const CATEGORIES = [
  { key: 'bracelets', old: 'браслети', sheet: 'браслет',
    map: { ...COMMON, 'Фото': 'Зображ.', 'Зображ.': null /* holds the legacy name */, 'Нова назва (SEO)': 'Назва', 'Розмір браслета': '#довжина' } },
  { key: 'rings', old: 'каблучки', sheet: 'каблучки',
    map: { ...COMMON, 'Нове фото': 'Зображ.', 'Зображ.': 'Зображ.', 'Назва': null, 'Нова назва': 'Назва' } },
  { key: 'necklaces', old: 'кольє', sheet: 'кольє',
    map: { ...COMMON, 'Зображ.': 'Зображ.', 'Назва': null, 'Нова назва (SEO)': 'Назва', 'Розмір': '#довжина' } },
  { key: 'earrings', old: 'сережки', sheet: 'сережки',
    map: { ...COMMON, 'Фото': 'Зображ.', 'Назва товару': null, 'Нова назва (SEO)': 'Назва', 'Тип защібки': 'Тип застібки' } },
];

// Field kinds: how to compare and how to write a new value.
const KIND = {
  'Ціна': 'price', 'Середня вага': 'weight', '#довжина': 'size', 'Опис': 'text', 'Артикул': 'article',
};
// Columns never changed by the merge (see the header comment).
const PROTECTED = ['#довжина'];
const fmtPrice = (p) => p.replace('.', ',');                       // "1400.00" → "1400,00"
const fmtWeight = (w) => `${Number(w).toFixed(2).replace('.', ',')} г`; // "1.700" → "1,70 г"
function canon(kind, v) {
  switch (kind) {
    case 'price': return parsePrice(v);
    case 'weight': return parseWeight(v);
    case 'size': return normSizeLabel(v);
    case 'text': return cleanText(v);
    case 'article': return oneLine(v).replace(/^0+(?=\d)/, '').replace(/(,\d*?)0+$/, '$1').replace(/,$/, '');
    default: return oneLine(v).replace(/[-–—]/g, '–');
  }
}
function render(kind, v) {
  switch (kind) {
    case 'price': return fmtPrice(parsePrice(v));
    case 'weight': return fmtWeight(parseWeight(v));
    case 'size': return normSizeLabel(v);
    case 'text': return cleanText(v);
    default: return oneLine(v);
  }
}

function findFile(dir, needle) {
  const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.csv')
    && fs.statSync(path.join(dir, f)).isFile() && nfc(f).toLowerCase().includes(nfc(needle)));
  if (files.length !== 1) throw new Error(`${dir}: expected 1 CSV containing «${needle}», found ${files.length}: ${files.join(', ')}`);
  return path.join(dir, files[0]);
}
const read = (p) => parseCsv(fs.readFileSync(p, 'utf8'));
const csvCell = (v) => (/[;"\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const toCsv = (header, rows) => `﻿${[header, ...rows.map((r) => header.map((h) => r[h] ?? ''))]
  .map((r) => r.map(csvCell).join(';')).join('\n')}\n`;

function mergeCategory(cat, log, errors) {
  const oldPath = findFile(OLD_DIR, cat.old);
  const sheetPath = findFile(SHEETS_DIR, cat.sheet);
  const oldCsv = read(oldPath);
  const sheet = read(sheetPath);

  const unknown = sheet.header.filter((h) => !(h in cat.map));
  if (unknown.length) errors.push(`${cat.key}: unknown sheet columns ${JSON.stringify(unknown)} — add them to the mapping`);
  const missingTarget = Object.values(cat.map).filter((c) => c && !oldCsv.header.includes(c));
  if (missingTarget.length) errors.push(`${cat.key}: old file lacks columns ${JSON.stringify(missingTarget)}`);

  const index = (rows, label) => {
    const m = new Map();
    for (const r of rows) {
      const code = oneLine(r['Код']);
      if (!/^\d+$/.test(code)) errors.push(`${cat.key} ${label} line ${r.line}: invalid Код «${r['Код']}»`);
      else if (m.has(code)) errors.push(`${cat.key} ${label}: duplicate Код ${code} (lines ${m.get(code).line}, ${r.line})`);
      else m.set(code, r);
    }
    return m;
  };
  const oldBy = index(oldCsv.rows, 'old');
  const newBy = index(sheet.rows, 'sheet');

  const stats = { old: oldBy.size, sheet: newBy.size, updated: 0, unchanged: 0, added: 0, onlyOld: [], onlyNew: [], fields: {} };
  const out = [];
  const entry = (code, article, column, type, oldV, newV, decision) =>
    log.push({ category: cat.key, code, article, column, type, old: oldV, new: newV, decision });

  const sheetCols = Object.entries(cat.map).filter(([s, o]) => o && s !== 'Код' && sheet.header.includes(s));
  // «Нове фото» (rings) has priority over «Зображ.» when both map to the same column.
  sheetCols.sort(([a], [b]) => (a === 'Нове фото') - (b === 'Нове фото'));

  for (const [code, o] of oldBy) {
    const row = Object.fromEntries(oldCsv.header.map((h) => [h, o[h] ?? '']));
    const n = newBy.get(code);
    if (!n) { stats.onlyOld.push({ code, article: o['Артикул'], name: o['Назва'] }); out.push(row); stats.unchanged++; continue; }
    let changed = false;
    const done = new Set();
    for (const [sCol, oCol] of [...sheetCols].reverse()) { // priority column first
      if (done.has(oCol)) continue;
      let nv = n[sCol] ?? '';
      if (/^same$/i.test(oneLine(nv)) && oCol === 'Опис') {
        const art = canon('article', n['Артикул'] ?? row['Артикул']);
        const donors = [...newBy.values()].filter((d) => d !== n && art
          && canon('article', d['Артикул'] ?? '') === art && !isPlaceholder(d[sCol] ?? ''));
        if (donors.length === 1) {
          entry(code, row['Артикул'], oCol, 'same_article', row[oCol], `Same → Код ${oneLine(donors[0]['Код'])}`, 'description of the product with the same Артикул');
          nv = donors[0][sCol];
        }
      }
      if (isPlaceholder(nv)) {
        if (oneLine(nv) && oneLine(nv) !== oneLine(row[oCol])) entry(code, row['Артикул'], oCol, 'placeholder', row[oCol], nv, 'kept old');
        continue; // empty: try the next sheet column for the same target
      }
      done.add(oCol);
      const kind = KIND[oCol];
      const ov = row[oCol];
      const cn = canon(kind, nv);
      if (cn === undefined) { entry(code, row['Артикул'], oCol, 'invalid', ov, nv, 'kept old — invalid sheet value'); continue; }
      if (nv === ov || cn === canon(kind, ov)) {
        if (nv !== ov) entry(code, row['Артикул'], oCol, 'format_only', ov, nv, 'kept old formatting');
        continue;
      }
      if (kind === 'article') { entry(code, row['Артикул'], oCol, 'conflict', ov, nv, 'kept old — identifier'); continue; }
      if (PROTECTED.includes(oCol)) { entry(code, row['Артикул'], oCol, 'kept_old', ov, nv, 'kept old — protected column'); continue; }
      const value = render(kind, nv);
      entry(code, row['Артикул'], oCol, oneLine(ov) ? 'updated' : 'filled', ov, value, 'sheet value');
      stats.fields[oCol] = (stats.fields[oCol] || 0) + 1;
      row[oCol] = value;
      changed = true;
    }
    if (changed) stats.updated++; else stats.unchanged++;
    out.push(row);
  }
  for (const [code, n] of newBy) {
    if (oldBy.has(code)) continue;
    const row = Object.fromEntries(oldCsv.header.map((h) => [h, '']));
    row['Код'] = code;
    for (const [sCol, oCol] of sheetCols) if (!isPlaceholder(n[sCol]) && canon(KIND[oCol], n[sCol]) !== undefined) row[oCol] = render(KIND[oCol], n[sCol]);
    out.push(row);
    stats.added++;
    stats.onlyNew.push({ code, article: row['Артикул'], name: row['Назва'] });
    entry(code, row['Артикул'], '*', 'new_only', '', '', 'appended — Веб/Створення/Роздрібна empty, needs DNTrade data');
  }
  return { cat, oldPath, sheetPath, header: oldCsv.header, rows: out, stats, sheetRows: newBy, oldRows: oldBy };
}

function validate(res, errors) {
  const outPath = path.join(OUT_DIR, path.basename(res.oldPath));
  const back = read(outPath);
  const checks = [];
  const ok = (cond, msg) => { checks.push({ ok: !!cond, msg }); if (!cond) errors.push(`${res.cat.key}: validation — ${msg}`); };
  const codes = back.rows.map((r) => oneLine(r['Код']));
  const expected = new Set([...res.oldRows.keys(), ...res.sheetRows.keys()]);
  ok(back.rows.length === expected.size, `rows ${back.rows.length} = old ∪ sheet ${expected.size}`);
  ok(new Set(codes).size === codes.length, 'codes unique');
  ok(codes.every((c) => expected.has(c)), 'every code comes from an input');
  ok(JSON.stringify(back.header) === JSON.stringify(res.header), 'header unchanged');
  let priceOk = 0; const priceBad = [];
  for (const r of back.rows) {
    const code = oneLine(r['Код']);
    const s = res.sheetRows.get(code);
    const o = res.oldRows.get(code);
    if (s && !isPlaceholder(s['Ціна']) && parsePrice(s['Ціна']) !== undefined) {
      (parsePrice(r['Ціна']) === parsePrice(s['Ціна']) ? priceOk++ : priceBad.push(code));
    }
    if (o) for (const h of [...PROTECTED, 'Артикул', 'Веб', 'Створення', 'Роздрібна', '#бейдж', '#постачальник', '#виробник', 'Примітка', '#розмір']) {
      if (r[h] !== o[h]) { ok(false, `${code} ${h} changed`); }
    }
    if (o && r['Ціна'] && parsePrice(r['Ціна']) === undefined) ok(false, `${code} invalid Ціна «${r['Ціна']}»`);
  }
  ok(priceBad.length === 0, `prices equal to the sheet: ${priceOk} ok${priceBad.length ? `, mismatch ${priceBad.join(',')}` : ''}`);
  const noPrice = back.rows.filter((r) => !parsePrice(r['Ціна']) && !parsePrice(r['Роздрібна'])).map((r) => r['Код']);
  checks.push({ ok: true, msg: `no price (hidden on site): ${noPrice.join(', ') || '—'}` });
  return checks;
}

function main() {
  const log = []; const errors = [];
  const results = CATEGORIES.map((c) => mergeCategory(c, log, errors));
  const all = new Map();
  for (const r of results) for (const code of [...r.oldRows.keys(), ...r.sheetRows.keys()]) {
    if (all.has(code) && all.get(code) !== r.cat.key) errors.push(`Код ${code} is in both ${all.get(code)} and ${r.cat.key}`);
    all.set(code, r.cat.key);
  }
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const r of results) fs.writeFileSync(path.join(OUT_DIR, path.basename(r.oldPath)), toCsv(r.header, r.rows));
  const checks = Object.fromEntries(results.map((r) => [r.cat.key, validate(r, errors)]));

  const logHeader = ['Категорія', 'Код', 'Артикул', 'Колонка', 'Тип', 'Старе значення', 'Нове значення', 'Рішення'];
  fs.writeFileSync(path.join(OUT_DIR, 'merge-log.csv'), toCsv(logHeader,
    log.map((e) => Object.fromEntries(logHeader.map((h, i) => [h, String(Object.values(e)[i] ?? '')])))));

  const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
  const md = [`# Product CSV merge — ${today}`, '',
    `Old: \`${rel(OLD_DIR)}/\` · sheets: \`${rel(SHEETS_DIR)}/\` · script: \`db/import/merge-source-sheets.js\`. Inputs not modified.`, '',
    '| Category | Old | Sheet | Merged | Updated | Unchanged | Added | Only in old | Field updates |', '|---|---|---|---|---|---|---|---|---|',
    ...results.map(({ cat, stats: s, rows }) => `| ${cat.key} | ${s.old} | ${s.sheet} | ${rows.length} | ${s.updated} | ${s.unchanged} | ${s.added} | ${s.onlyOld.map((x) => `${x.code} (${x.article})`).join(', ') || '—'} | ${Object.entries(s.fields).map(([k, v]) => `${k} ${v}`).join(', ') || '—'} |`),
    '', '## Log entries by type', '',
    ...Object.entries(log.reduce((a, e) => ({ ...a, [`${e.category} / ${e.type}`]: (a[`${e.category} / ${e.type}`] || 0) + 1 }), {})).map(([k, v]) => `- ${k}: ${v}`),
    '', '## Price changes', '',
    ...(log.filter((e) => e.column === 'Ціна' && ['updated', 'filled'].includes(e.type)).map((e) => `- ${e.category} ${e.code} (${e.article}): ${e.old || '∅'} → ${e.new}`)),
    '', '## Validation', '',
    ...Object.entries(checks).flatMap(([k, cs]) => cs.map((c) => `- ${c.ok ? '✔' : '✘'} ${k}: ${c.msg}`)),
    '', errors.length ? `## ERRORS\n\n${errors.map((e) => `- ${e}`).join('\n')}` : 'No errors.', ''];
  fs.writeFileSync(path.join(OUT_DIR, 'merge-summary.md'), md.join('\n'));
  console.log(md.join('\n'));
  if (errors.length) process.exit(1);
}

main();
