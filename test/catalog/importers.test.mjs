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
const sizeTag = (...sizes) => ({ id: 2, title: 'розмір', items: sizes.map((s, i) => ({ id: i, title: s, status: 1 })) });

const API_SNAPSHOT = {
  products: [
    // cards
    { product_id: 'GUID-20', code: 20, sku: '2069р', website_synch: 1, title: 'x', price: '1200.00',
      short_description: '<p>Новий опис</p>', description: '<p>Повний опис 20</p>',
      image_path: 'https://cdn.example/20-a.jpg', images: ['https://cdn.example/20-a.jpg', 'https://cdn.example/20-c.jpg'], tags: [] },
    { product_id: 'OTHER-GUID', code: 100, sku: '2069р', website_synch: 1, title: 'x', price: '9999.00',
      short_description: '<p>&nbsp;</p>', description: '', image_path: '', images: [], tags: [] },
    { product_id: 'GUID-5', code: 5, sku: 'X2', website_synch: 1, title: 'x', price: '650,00', images: [],
      tags: [{ id: 9, title: 'бейдж', items: [{ id: 1, title: 'знижка/10', status: 1 }, { id: 2, title: 'популярне', status: 1 }] }] },
    { product_id: 'GUID-555', code: 555, sku: 'none', website_synch: 1, title: 'not in db', images: [], tags: [] },
    // ring pieces
    { product_id: 'P1', code: 9001, sku: '2069Р ', website_synch: 0, title: '2069р#Каблучка 925 срібло 2,40г', balance: 1, barcode: '111', tags: [sizeTag('19,5')] },
    { product_id: 'P2', code: 9002, sku: '2069р', website_synch: 0, title: '2069р#Каблучка 925 срібло 2г', balance: -1, tags: [sizeTag('20', '21')] },
    { product_id: 'P3', code: 9003, sku: 'UNKNOWN', website_synch: 0, title: 'orphan', balance: 1, tags: [sizeTag('17')] },
    { product_id: 'P1', code: 9001, sku: '2069р', website_synch: 0, title: 'duplicate page entry', balance: 1, tags: [] },
  ],
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

describe('import-dntrade-api', () => {
  test('dry run changes nothing', async () => {
    const before = await db('product_variants').count({ n: '*' }).first();
    const out = run('import-dntrade-api.js', `--file=${writeJson('api.json', API_SNAPSHOT)}`, '--dry-run');
    assert.match(out, /DRY RUN/);
    const after = await db('product_variants').count({ n: '*' }).first();
    assert.equal(after.n, before.n);
    assert.equal((await db('products').where('legacy_code', '20').first()).legacy_id, null);
  });

  test('fills only missing data and attaches ring pieces', async () => {
    run('import-dntrade-api.js', `--file=${writeJson('api.json', API_SNAPSHOT)}`);

    const p20 = await db('products').where('legacy_code', '20').first();
    assert.equal(p20.legacy_id, 'GUID-20');
    const p100 = await db('products').where('legacy_code', '100').first();
    assert.equal(p100.legacy_id, 'GUID-100', 'existing GUID is not overwritten');
    assert.equal(p100.price, '1600.00', 'existing price is not overwritten');
    const p5 = await db('products').where('legacy_code', '5').first();
    assert.equal(p5.price, '650.00', 'missing price is filled');
    assert.equal(p5.sale_price, '585.00', 'знижка/10 badge → sale price');
    const popular = await repo.listProducts(db, { collection: 'popular' });
    assert.deepEqual(popular.products.map((p) => String(p.code)).sort(), ['20', '5']);

    const t20 = await db('product_translations').where({ product_id: p20.id, locale: 'uk' }).first();
    assert.equal(t20.short_description, '<p>Опис 20</p>', 'existing description kept');
    assert.equal(t20.description, '<p>Повний опис 20</p>', 'missing description filled');

    const images = await db('product_images').where('product_id', p20.id).orderBy('sort_order').pluck('url');
    assert.deepEqual(images, ['https://cdn.example/20-a.jpg', 'https://cdn.example/20-b.jpg', 'https://cdn.example/20-c.jpg']);

    const pieces = await db('product_variants').whereNotNull('legacy_id').orderBy('legacy_id');
    assert.deepEqual(
      pieces.map((v) => [v.legacy_id, v.product_id, v.size_label, v.size, v.weight_g, v.stock_qty, v.legacy_code]),
      [
        ['P1', seed.ids['20'], '19,5', '19.50', '2.400', 1, '9001'],
        ['P2', seed.ids['20'], '20', '20.00', '2.000', 0, '9002'],
        ['P2#21', seed.ids['20'], '21', '21.00', '2.000', 0, null],
      ]
    );
    assert.deepEqual(await repo.getSizesByArticle(db, { article: '2069р' }), [16.5, 17, 17.5, 18, 19.5, 20, 21]);

    const [report] = fs.readdirSync(path.join(ROOT, 'db/import/reports'))
      .filter((f) => f.startsWith('dntrade-api-') && !f.includes('dry-run')).sort().reverse();
    const r = JSON.parse(fs.readFileSync(path.join(ROOT, 'db/import/reports', report), 'utf8'));
    assert.equal(r.cards.not_in_db.length, 1);
    assert.equal(r.pieces.orphans.length, 1);
    assert.equal(r.pieces.ambiguous.length, 2);
    assert.equal(r.pieces.negative_balance.length, 1);
    assert.ok(r.conflicts.some((c) => c.field === 'legacy_id'));
    assert.ok(r.conflicts.some((c) => c.field === 'price'));
    assert.ok(r.conflicts.some((c) => c.field === 'short_description'));
  });

  test('re-run is idempotent', async () => {
    const snapshot = async () => ({
      v: await db('product_variants').count({ n: '*' }).first(),
      i: await db('product_images').count({ n: '*' }).first(),
    });
    const before = await snapshot();
    const out = run('import-dntrade-api.js', `--file=${writeJson('api.json', API_SNAPSHOT)}`);
    assert.match(out, /inserted: 0/);
    assert.deepEqual(await snapshot(), before);
  });

  test('live mode without credentials fails clearly', () => {
    assert.throws(
      () => execFileSync(process.execPath, [path.join(ROOT, 'db/import/import-dntrade-api.js'), '--env=test'], {
        cwd: ROOT, stdio: 'pipe', env: { ...process.env, API_ROOT_URI: '', API_KEY: '' },
      }),
      (e) => /API_ROOT_URI/.test(String(e.stderr))
    );
  });
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
