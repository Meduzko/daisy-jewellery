/*
  Sync translations from Google Sheets into locale JSON files.

  Expected Google Sheet structure (first row is headers):
    key | uk | ru
  Where `key` is a dot-notated path, e.g.:
    products.koltsa.2125.title
    products.koltsa.2125.description
    item.buy

  Environment variables required:
    GOOGLE_SHEETS_ID
    GOOGLE_SERVICE_ACCOUNT_EMAIL
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY  (with \n newlines or escaped)

  Usage:
    node scripts/sync-translations.js
*/

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

function getEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function normalizePrivateKey(key) {
  // Handle both raw multiline and single-line with \n
  if (key.includes('\\n')) {
    return key.replace(/\\n/g, '\n');
  }
  return key;
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

async function fetchRows() {
  const spreadsheetId = getEnv('GOOGLE_SHEETS_ID');
  const clientEmail = getEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKey = normalizePrivateKey(getEnv('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY'));

  const jwt = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth: jwt });

  // Read the first sheet entire range; adjust range if you want a named sheet or A:C
  // e.g., range: 'translations!A:C'
  const range = process.env.GOOGLE_SHEETS_RANGE || 'A:C';
  const sheetName = process.env.GOOGLE_SHEETS_SHEET || undefined; // optional
  const readRange = sheetName ? `${sheetName}!${range}` : range;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: readRange,
  });

  const rows = res.data.values || [];
  if (rows.length === 0) {
    throw new Error('No rows found in the spreadsheet.');
  }

  return rows;
}

function rowsToLocales(rows) {
  const header = rows[0].map((h) => String(h).trim());
  const colIndex = (name) => header.indexOf(name);

  const keyIdx = colIndex('key');
  if (keyIdx === -1) {
    throw new Error("Header must contain a 'key' column");
  }

  const locales = {};
  const localeColumns = header
    .filter((h) => h && h !== 'key')
    .map((h) => ({ code: h, index: colIndex(h) }))
    .filter((c) => c.index !== -1);

  // Initialize locale objects
  for (const { code } of localeColumns) {
    locales[code] = {};
  }

  for (let r = 1; r < rows.length; r += 1) {
    const row = rows[r];
    if (!row) continue;
    const key = String(row[keyIdx] || '').trim();
    if (!key) continue;

    for (const { code, index } of localeColumns) {
      const raw = row[index];
      if (raw === undefined || raw === null || String(raw).length === 0) continue;
      const value = String(raw);
      setDeep(locales[code], key, value);
    }
  }

  return locales;
}

function writeLocaleFiles(locales) {
  const outDir = path.resolve(__dirname, '..', 'src', 'dictionaries');
  // The actual project path puts dictionaries in src/dictionaries/
  const targetDir = path.resolve(__dirname, '..', 'src', 'dictionaries');

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const pretty = (obj) => JSON.stringify(obj, null, 2) + '\n';

  for (const [locale, data] of Object.entries(locales)) {
    const filePath = path.join(targetDir, `${locale}.json`);
    fs.writeFileSync(filePath, pretty(data), 'utf8');
    console.log(`Wrote ${filePath}`);
  }
}

(async () => {
  try {
    const rows = await fetchRows();
    const locales = rowsToLocales(rows);
    writeLocaleFiles(locales);
    console.log('Translation sync completed.');
  } catch (err) {
    console.error('Translation sync failed:', err.message);
    process.exitCode = 1;
  }
})();


