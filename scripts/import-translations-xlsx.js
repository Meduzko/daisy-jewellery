/*
  Import translations from an Excel (.xlsx) file and generate locale JSON files.

  Expected Excel structure (first row is headers):
    key | uk | ru

  Example keys:
    products.koltsa.2125.title
    products.koltsa.2125.description
    item.buy

  Usage:
    npm run i18n:import -- --file=./i18n-import.xlsx --sheet=translations

  Args:
    --file   Path to the .xlsx file (default: i18n-import.xlsx at project root)
    --sheet  Optional sheet name (default: first sheet)
*/

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

function getArgValue(flag, fallback) {
  const found = process.argv.find((a) => a.startsWith(`${flag}=`));
  if (!found) return fallback;
  return found.slice(flag.length + 1);
}

function setDeep(obj, dottedPath, value) {
  const parts = dottedPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const p = parts[i];
    if (typeof cur[p] !== 'object' || cur[p] === null) {
      cur[p] = {};
    }
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

function normalizeHeader(h) {
  return String(h || '').trim().toLowerCase();
}

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const defaultFile = path.join(projectRoot, 'i18n-import.xlsx');
  const filePath = path.resolve(getArgValue('--file', defaultFile));
  const sheetName = getArgValue('--sheet', undefined);

  if (!fs.existsSync(filePath)) {
    console.error(`Input file not found: ${filePath}`);
    process.exit(1);
  }

  const workbook = xlsx.readFile(filePath);
  const targetSheetName = sheetName || workbook.SheetNames[0];
  const sheet = workbook.Sheets[targetSheetName];
  if (!sheet) {
    console.error(`Sheet not found: ${targetSheetName}`);
    process.exit(1);
  }

  // Convert to rows, first row as headers
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  if (!rows.length) {
    console.error('No data rows found in the sheet.');
    process.exit(1);
  }

  // Determine locale columns dynamically, require a 'key' column
  const headerKeys = Object.keys(rows[0]).map(normalizeHeader);
  const originalHeader = Object.keys(rows[0]);
  let keyColIdx = headerKeys.indexOf('key');
  if (keyColIdx === -1) {
    console.error("Header must contain a 'key' column");
    process.exit(1);
  }

  // Map header name to normalized name
  const normalizedByOriginal = {};
  for (let i = 0; i < originalHeader.length; i += 1) {
    normalizedByOriginal[originalHeader[i]] = headerKeys[i];
  }

  // Identify locale columns (all except 'key')
  const localeColumns = originalHeader
    .filter((h) => normalizedByOriginal[h] !== 'key')
    .map((h) => ({ code: normalizedByOriginal[h], header: h }))
    .filter((c) => c.code); // non-empty

  if (!localeColumns.length) {
    console.error('No locale columns found. Expected at least one (e.g., uk, ru).');
    process.exit(1);
  }

  const locales = {};
  for (const { code } of localeColumns) {
    locales[code] = {};
  }

  for (const row of rows) {
    const key = String(row[originalHeader[keyColIdx]] || '').trim();
    if (!key) continue;
    for (const { code, header } of localeColumns) {
      const value = row[header];
      if (value === undefined || value === null || String(value).length === 0) continue;
      setDeep(locales[code], key, String(value));
    }
  }

  const dictDir = path.join(projectRoot, 'src', 'dictionaries');
  if (!fs.existsSync(dictDir)) {
    fs.mkdirSync(dictDir, { recursive: true });
  }

  const pretty = (obj) => JSON.stringify(obj, null, 2) + '\n';
  for (const [locale, data] of Object.entries(locales)) {
    const outPath = path.join(dictDir, `${locale}.json`);
    fs.writeFileSync(outPath, pretty(data), 'utf8');
    console.log(`Wrote ${outPath}`);
  }

  console.log('Import completed.');
}

try {
  main();
} catch (err) {
  console.error('Import failed:', err);
  process.exitCode = 1;
}


