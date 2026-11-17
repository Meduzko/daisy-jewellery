import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createTestDb, resetSchema, ROOT } from '../helpers/db.mjs';
import { seedCatalog } from '../helpers/seed.mjs';
import * as repo from '../../src/lib/catalog/repository.js';

let db;
let seed;
let tmp;

const run = (script, ...args) =>
  execFileSync(process.execPath, [path.join(ROOT, 'db/import', script), '--env=test', ...args], {
    cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  });
const writeJson = (name, data) => {
  const file = path.join(tmp, name);
  fs.writeFileSync(file, JSON.stringify(data));
  return file;
};
before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'daisy-import-'));
  db = createTestDb();
  await resetSchema(db);
  seed = await seedCatalog(db);
});
after(async () => {
  await db?.destroy();
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('import-ru-translations', () => {
  test('adds missing Russian rows, keeps existing ones', async () => {
    const file = writeJson('ru.json', {
      products: {
        koltsa: {
          20: { title: 'Кольцо Сердце', description: 'Описание 20' },
          100: { title: 'Другое название', description: 'Описание 100' },
          777: { title: 'Нет в базе', description: '' },
        },
      },
    });
    run('import-ru-translations.js', `--file=${file}`);
    const p20 = await repo.getProductByCode(db, { code: '20', locale: 'ru' });
    assert.equal(p20.title, 'Кольцо Сердце');
    assert.equal(p20.short_description, 'Описание 20');
    assert.equal(p20.is_fallback, false);
    const p100 = await repo.getProductByCode(db, { code: '100', locale: 'ru' });
    assert.equal(p100.title, 'Серебряное кольцо Клевер', 'existing title kept');
    assert.equal(p100.short_description, 'Описание 100', 'missing field filled');
    const slug = await db('product_translations').where({ product_id: seed.ids['20'], locale: 'ru' }).first();
    assert.equal(slug.slug, 'koltso-serdtse-20');

    const again = run('import-ru-translations.js', `--file=${file}`);
    assert.match(again, /inserted: 0/);
  });
});

describe('import-product-content', () => {
  const csv = (rows) => rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  let dir;
  before(() => {
    dir = fs.mkdtempSync(path.join(tmp, 'content-'));
    // rings sheet: header as in «Товари_каблучки - Каблучки.csv»
    fs.writeFileSync(path.join(dir, 'Товари_каблучки - Каблучки.csv'), '﻿' + csv([
      ['Код', 'Артикул', 'Нове фото', 'Зображ.', 'Ціна', 'Назва', 'Нова назва', 'Опис товару (SEO)', 'Вставка', 'Колір вставки', 'Матеріал', 'Покриття', 'Середня вага'],
      ['20', '2069р', '', 'https://cdn.example/20-a.jpg', '1300', 'old', 'Срібна каблучка «Серце» з фіанітами', '\n\nПерший абзац.\n\nДругий   абзац.', 'Фіаніти', 'Прозорий', 'Срібло 925° ', 'Родій', '2,40 г'],
      ['3', '508-родовано', '', '', '2200', 'old', 'Same', 'Same', '', '', 'Срібло 925° ', 'Позолота', ''],
      ['999', 'X', '', '', '100', 'not in db', 'Нова', 'Опис', '', '', '', '', ''],
    ]));
    // earrings sheet: clasp column (typo as in the source), comma-separated insertions
    fs.writeFileSync(path.join(dir, 'Сайт_сережки - Сережки.csv'), csv([
      ['Код', 'Артикул', 'Фото', 'Ціна', 'Назва товару', 'Нова назва (SEO)', 'Опис товару (SEO)', 'Вставка', 'Колір вставки', 'Матеріал', 'Покриття', 'Середня вага', 'Тип защібки'],
      ['6', '508-родовано', 'https://cdn.example/6-a.jpg', '1500', 'old', 'Срібні сережки «Клевер» з оніксом', 'Опис сережок.', 'Куб.цикроній, онікс', 'Чорний', 'Срібло 925° ', 'Родій', '4.20 г', 'Англійська защібка'],
    ]));
    fs.writeFileSync(path.join(dir, 'Сайт_кольє - Кольє.csv'), csv([
      ['Код', 'Артикул', 'Зображ.', 'Ціна', 'Назва ', 'Нова назва (SEO)', 'Опис товару (SEO)', 'Вставка', 'Колір вставки', 'Матеріал', 'Покриття', 'Середня вага', 'Розмір'],
      ['9', 'N9', '', '3000', 'old', 'Срібне кольє «Клевер»', 'Опис кольє.', 'Без вставок', 'Без вставок', 'Срібло 925° ', 'Родій, позолота', 'abc', '40-45 см '],
    ]));
    // a DNTrade export in the same folder is ignored
    fs.writeFileSync(path.join(dir, 'Товари-каблучки-новий.csv'), 'Код;Назва\r\n1;x\r\n');
  });

  test('refuses to run before the schema patch, patch is idempotent', async () => {
    await db.raw('ALTER TABLE products DROP CONSTRAINT products_avg_weight_check');
    await db.raw('ALTER TABLE products DROP COLUMN avg_weight_g');
    assert.throws(() => run('import-product-content.js', `--dir=${dir}`), (e) => /db:patch:specs/.test(String(e.stderr)));
    const patch = (...a) => execFileSync(process.execPath, [path.join(ROOT, 'db/patches/20261112_product_specs.js'), '--env=test', ...a], { cwd: ROOT, encoding: 'utf8' });
    assert.match(patch(), /avg_weight_g added/);
    assert.match(patch(), /nothing to do/);
  });

  test('dry run changes nothing', async () => {
    const out = run('import-product-content.js', `--dir=${dir}`, '--dry-run');
    assert.match(out, /DRY RUN/);
    const p = await repo.getProductByCode(db, { code: '20', locale: 'uk' });
    assert.equal(p.title, 'Каблучка Серце з фіанітами');
  });

  test('overwrites texts, weight, size and spec attributes; «Same» keeps', async () => {
    const before3 = await repo.getProductByCode(db, { code: '3', locale: 'uk' });
    const out = run('import-product-content.js', `--dir=${dir}`);
    assert.match(out, /total 5 \| updated 4 \| unchanged 0 \| skipped 1 \| failed 0/);
    assert.match(out, /validation: 4\/4 rows match DB/);

    const p20 = await repo.getProductByCode(db, { code: '20', locale: 'uk' });
    assert.equal(p20.title, 'Срібна каблучка «Серце» з фіанітами');
    assert.equal(p20.description, 'Перший абзац.\n\nДругий абзац.');
    assert.equal(p20.short_description, '', 'old DNTrade short description cleared');
    assert.equal(p20.avg_weight_g, 2.4);
    assert.equal(p20.slug, 'uk-20', 'slug (and URL) unchanged');
    const attrs = Object.fromEntries(p20.attributes.map((a) => [a.code, a.values.map((v) => v.value)]));
    assert.deepEqual(attrs, { insertion: ['Фіаніт'], metal: ['Срібло 925°'], coating: ['Родій'], insertion_color: ['Прозорий'] });
    assert.equal(p20.price, '1200.00', 'existing price kept (conflict reported)');

    const p3 = await repo.getProductByCode(db, { code: '3', locale: 'uk' });
    assert.equal(p3.title, before3.title, '«Same» keeps the title');
    assert.equal(p3.short_description, before3.short_description, '«Same» keeps the texts');
    assert.deepEqual(p3.attributes.find((a) => a.code === 'insertion').values.map((v) => v.slug), ['oniks'], 'empty cell keeps links');

    const p6 = await repo.getProductByCode(db, { code: '6', locale: 'ru' });
    const ru = Object.fromEntries(p6.attributes.map((a) => [a.code, a.values.map((v) => v.value)]));
    assert.deepEqual(ru.insertion, ['Оникс', 'Кубический цирконий'], 'normalised, ru texts, display order');
    assert.deepEqual(ru.clasp, ['Английский замок']);
    assert.equal(p6.title, 'Серьги Клевер оникс', 'ru texts untouched');

    const p9 = await db('products').where({ legacy_code: '9' }).first();
    assert.equal(p9.avg_weight_g, null, 'invalid weight not imported');
    const v9 = await db('product_variants').where({ product_id: p9.id });
    assert.deepEqual(v9.map((v) => [v.size_label, v.size]), [['40–45 см', null]]);
    const n9 = await repo.getProductAttributes(db, { productId: p9.id, locale: 'uk' });
    assert.deepEqual(n9.find((a) => a.code === 'coating').values.map((v) => v.value), ['Родій', 'Позолота']);
    assert.equal(n9.find((a) => a.code === 'insertion_color'), undefined, '«Без вставок» colour → no link');

    const report = JSON.parse(fs.readFileSync(path.join(ROOT, 'db/import/reports', fs.readdirSync(path.join(ROOT, 'db/import/reports')).filter((f) => f.startsWith('content-') && !f.includes('dry')).sort().pop()), 'utf8'));
    assert.ok(report.conflicts.some((c) => c.code === '20' && c.field === 'products.price'));
    assert.ok(report.warnings.some((w) => w.code === '9' && w.field === 'weight'));
    assert.ok(report.ignored_files.includes('Товари-каблучки-новий.csv'));
    const audit = await db('audit_logs').where({ action: 'import.product_content' }).orderBy('id', 'desc').first();
    assert.ok(audit.before.some((c) => c.code === '20' && c.field === 'title' && c.before === 'Каблучка Серце з фіанітами'));
  });

  test('re-run is idempotent', async () => {
    assert.match(run('import-product-content.js', `--dir=${dir}`), /updated 0 \| unchanged 4/);
    const p20 = await db('product_translations').where({ product_id: seed.ids['20'], locale: 'uk' }).first();
    assert.equal(p20.short_description, null);
    assert.equal(p20.description, 'Перший абзац.\n\nДругий абзац.');
  });

  test('listing rows carry insertion/coating terms for the card descriptor', async () => {
    const [p] = await repo.getProductsByCodes(db, { codes: ['6'], locale: 'uk' });
    assert.deepEqual(p.spec_terms, ['Онікс', 'Кубічний цирконій', 'Родій']);
  });
});

describe('import-product-content — merged DNTrade exports (2026-11-13)', () => {
  const HEADER = 'Код;Назва;Опис;Зображ.;Артикул;#вставка;Колір вставки;Матеріал;Покриття;Середня вага;#довжина;#розмір;Тип застібки;#постачальник;#виробник;#бейдж;Веб;Примітка;Створення;Ціна;Роздрібна';
  let dir;
  const write = (note, price) => fs.writeFileSync(path.join(dir, 'Товари-каблучки-новий-07-11-2026 15_06_49-веб-так.csv'),
    `﻿${HEADER}\n20;Срібна каблучка «Серце» з фіанітами;Перший абзац.;;2069р;;;;;;;;;;;;Так;${note};01-01-2024 10:00;${price};9999,00\n`);
  before(() => { dir = fs.mkdtempSync(path.join(tmp, 'merged-')); });

  test('products.note exists (migration 20261113000001) and is nullable', async () => {
    const col = await db('information_schema.columns').where({ table_name: 'products', column_name: 'note' }).first();
    assert.equal(col.data_type, 'text');
    assert.equal(col.is_nullable, 'YES');
  });

  test('--update-prices overwrites price from «Ціна» (not «Роздрібна»), «Примітка» → note', async () => {
    write('Під замовлення', '1400,00');
    const out = run('import-product-content.js', `--dir=${dir}`, '--update-prices');
    assert.match(out, /failed 0/);
    const p = await db('products').where({ legacy_code: '20' }).first();
    assert.equal(p.price, '1400.00');
    assert.equal(p.note, 'Під замовлення');
    assert.match(run('import-product-content.js', `--dir=${dir}`, '--update-prices'), /updated 0 \| unchanged 1/);
  });

  test('empty «Примітка» keeps the stored note; without --update-prices the price is kept', async () => {
    write('', '1500,00');
    run('import-product-content.js', `--dir=${dir}`);
    const p = await db('products').where({ legacy_code: '20' }).first();
    assert.equal(p.note, 'Під замовлення');
    assert.equal(p.price, '1400.00');
  });
});
