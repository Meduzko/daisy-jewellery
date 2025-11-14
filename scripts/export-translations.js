/*
  Export existing locale dictionaries to a CSV suitable for Excel.

  Output file: i18n-export.csv (at project root)
  Columns: key, uk, ru

  Keys are flattened using dot-notation, e.g. products.koltsa.2125.title
*/

const fs = require('fs');
const path = require('path');

function readJson(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(text);
}

function flattenObject(obj, prefix = '', out = {}) {
  if (obj === null || obj === undefined) return out;
  const isObject = (v) => typeof v === 'object' && v !== null;

  if (!isObject(obj)) {
    out[prefix] = obj;
    return out;
  }

  const entries = Array.isArray(obj) ? obj.entries() : Object.entries(obj);
  for (const [key, value] of entries) {
    const nextKey = prefix ? `${prefix}.${key}` : String(key);
    if (isObject(value)) {
      flattenObject(value, nextKey, out);
    } else {
      out[nextKey] = value;
    }
  }
  return out;
}

function csvEscape(value) {
  const s = value === undefined || value === null ? '' : String(value);
  // Always quote, escape quotes by doubling
  return '"' + s.replace(/"/g, '""') + '"';
}

function main() {
  const baseDir = path.resolve(__dirname, '..');
  const dictDir = path.join(baseDir, 'src', 'dictionaries');
  const ukPath = path.join(dictDir, 'uk.json');
  const ruPath = path.join(dictDir, 'ru.json');

  const uk = fs.existsSync(ukPath) ? readJson(ukPath) : {};
  const ru = fs.existsSync(ruPath) ? readJson(ruPath) : {};

  const flatUk = flattenObject(uk);
  const flatRu = flattenObject(ru);

  const keys = new Set([...Object.keys(flatUk), ...Object.keys(flatRu)]);
  const sortedKeys = Array.from(keys).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  const rows = [];
  rows.push(['key', 'uk', 'ru']);
  for (const key of sortedKeys) {
    rows.push([key, flatUk[key] ?? '', flatRu[key] ?? '']);
  }

  const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n') + '\n';
  const outPath = path.join(baseDir, 'i18n-export.csv');
  fs.writeFileSync(outPath, csv, 'utf8');
  console.log(`Wrote ${outPath} (${rows.length - 1} rows)`);
}

try {
  main();
} catch (err) {
  console.error('Export failed:', err);
  process.exitCode = 1;
}


