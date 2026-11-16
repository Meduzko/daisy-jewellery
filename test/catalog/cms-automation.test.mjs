// DB-side CMS automation (migration 20261116000003): product codes, slugs, percentage discounts,
// attribute routing, sizes — plus the migration's backfill of existing data and the checkout quote.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb } from '../helpers/db.mjs';
import { seedCatalog } from '../helpers/seed.mjs';
import { quoteCart } from '../../src/lib/catalog/repository.js';

const MIGRATION = '20261116000003_cms_product_automation.js';
let db;
let seed;

before(async () => {
  db = createTestDb();
  // Migrate up to just before this migration, seed "existing" data, then apply it (backfill test).
  await db.raw('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  for (;;) {
    const [, pending] = await db.migrate.list();
    const next = pending[0]?.file ?? pending[0]?.name ?? pending[0];
    if (next === MIGRATION) break;
    await db.migrate.up();
  }
  seed = await seedCatalog(db);
  await db.migrate.latest();
});
after(async () => {
  await db?.destroy();
});

const product = (id) => db('products').where({ id }).first();
const insertProduct = async (fields = {}) => {
  const [row] = await db('products').insert({ category_id: seed.cat.rings, price: '1500.00', status: 'active', ...fields }).returning('*');
  return row;
};

describe('migration backfill', () => {
  test('discount percent derived from existing sale prices; effective prices unchanged', async () => {
    const p = await product(seed.ids['20']);
    assert.deepEqual([p.price, p.sale_price, p.discount_percent], ['1200.00', '900.00', '25.00']);
    assert.equal((await product(seed.ids['9'])).discount_percent, '10.00');
    assert.equal((await product(seed.ids['100'])).discount_percent, '0.00');
    assert.equal((await product(seed.ids['100'])).sale_price, null);
  });

  test('existing codes and slugs untouched', async () => {
    assert.equal((await product(seed.ids['100'])).legacy_code, '100');
    const t = await db('product_translations').where({ product_id: seed.ids['100'], locale: 'uk' }).first();
    assert.equal(t.slug, 'uk-100');
  });

  test('sizes created per category from variant labels and linked', async () => {
    const sizes = await db('sizes').orderBy(['category_id', 'sort_value']).select('category_id', 'label', 'value');
    assert.deepEqual(sizes.map((s) => [s.category_id, s.label, s.value]), [
      [seed.cat.rings, '16,5', '16.50'], [seed.cat.rings, '17', '17.00'], [seed.cat.rings, '17,5', '17.50'],
      [seed.cat.rings, '18', '18.00'], [seed.cat.rings, '19', '19.00'],
      [seed.cat.necklaces, '45 см', '45.00'],
    ]);
    const unlinked = await db('product_variants').whereNotNull('size_label').whereNull('size_id').count({ n: '*' });
    assert.equal(Number(unlinked[0].n), 0);
    // weight/stock/cost kept
    const v = await db('product_variants').where({ product_id: seed.ids['100'], size: 17 }).first();
    assert.equal(v.cost_price, '123.45');
    assert.equal(v.stock_qty, 1);
  });

  test('attribute links routed to their field columns', async () => {
    const rows = await db('product_attribute_values').where({ product_id: seed.ids['100'] }).orderBy('attribute_value_id');
    assert.ok(rows.some((r) => r.insertion_product_id === seed.ids['100'] && r.insertion_value_id === r.attribute_value_id && r.other_product_id === null));
    assert.ok(rows.some((r) => r.other_product_id === seed.ids['100'] && r.insertion_product_id === null)); // `internal`
  });
});

describe('product code', () => {
  test('generated when blank, starts above DNTrade codes, kept on update', async () => {
    const a = await insertProduct();
    const b = await insertProduct({ legacy_code: '' });
    assert.match(a.legacy_code, /^\d+$/);
    assert.ok(Number(a.legacy_code) >= 100000);
    assert.equal(Number(b.legacy_code), Number(a.legacy_code) + 1);
    await db('products').where({ id: a.id }).update({ price: '1600.00', article: 'NEW' });
    assert.equal((await product(a.id)).legacy_code, a.legacy_code);
  });

  test('explicit codes still work and are skipped by the generator', async () => {
    const { legacy_code: last } = await insertProduct();
    const taken = String(Number(last) + 1);
    await insertProduct({ legacy_code: taken });
    const next = await insertProduct();
    assert.equal(next.legacy_code, String(Number(taken) + 1));
  });

  test('concurrent inserts get distinct codes; uniqueness enforced by the DB', async () => {
    const rows = await Promise.all(Array.from({ length: 12 }, () => insertProduct()));
    assert.equal(new Set(rows.map((r) => r.legacy_code)).size, 12);
    await assert.rejects(insertProduct({ legacy_code: rows[0].legacy_code }), /products_legacy_code_unique/);
  });
});

describe('slug', () => {
  const addText = async (productId, locale, title, slug) =>
    (await db('product_translations').insert({ product_id: productId, locale, title, slug }).returning('*'))[0];

  test('uk and ru transliteration + code suffix, like the importers', async () => {
    const p = await insertProduct();
    const uk = await addText(p.id, 'uk', 'Срібна каблучка «Конюшина» з чорним оніксом у позолоті');
    const ru = await addText(p.id, 'ru', 'Серебряное кольцо «Сердце» с яшмой — щит, ёж, объём');
    assert.equal(uk.slug, `sribna-kabluchka-koniushyna-z-chornym-oniksom-u-pozoloti-${p.legacy_code}`);
    assert.equal(ru.slug, `serebryanoe-koltso-serdtse-s-yashmoy-shchit-ezh-obem-${p.legacy_code}`);
    const ukSpecial = await addText((await insertProduct()).id, 'uk', "Кольє ЇЖАК м'ята Ґудзик 925°");
    assert.match(ukSpecial.slug, /^kolie-izhak-miata-gudzyk-925-\d+$/);
  });

  test('duplicate gets a suffix; title edit keeps slug; blank slug regenerates; manual override kept', async () => {
    const p = await insertProduct();
    const first = await addText(p.id, 'uk', 'Каблучка');
    // another product whose generated slug would clash (manual slug equal to it)
    const q = await insertProduct();
    const manual = await addText(q.id, 'ru', 'X', `kabluchka-${p.legacy_code}`);
    assert.equal(manual.slug, `kabluchka-${p.legacy_code}`);
    const clash = await addText(p.id, 'ru', 'Kabluchka');
    assert.equal(clash.slug, `kabluchka-${p.legacy_code}-2`);

    await db('product_translations').where({ id: first.id }).update({ title: 'Нова назва' });
    assert.equal((await db('product_translations').where({ id: first.id }).first()).slug, first.slug);
    await db('product_translations').where({ id: first.id }).update({ slug: '' });
    assert.equal((await db('product_translations').where({ id: first.id }).first()).slug, `nova-nazva-${p.legacy_code}`);
  });
});

describe('discount', () => {
  test('1500 UAH − 20 % = 1200 UAH; recalculated on price / percent change', async () => {
    const p = await insertProduct({ discount_percent: 20 });
    assert.equal(p.sale_price, '1200.00');
    await db('products').where({ id: p.id }).update({ price: '2000.00' });
    assert.equal((await product(p.id)).sale_price, '1600.00');
    await db('products').where({ id: p.id }).update({ discount_percent: 12.5 });
    assert.equal((await product(p.id)).sale_price, '1750.00');
    await db('products').where({ id: p.id }).update({ discount_percent: 0 });
    assert.equal((await product(p.id)).sale_price, null);
  });

  test('rounding to kopecks, 100 % = 0, never negative, range checked', async () => {
    assert.equal((await insertProduct({ price: '999.99', discount_percent: 33.33 })).sale_price, '666.69');
    assert.equal((await insertProduct({ discount_percent: 100 })).sale_price, '0.00');
    await assert.rejects(insertProduct({ discount_percent: 101 }), /products_discount_percent_check/);
    await assert.rejects(insertProduct({ discount_percent: -1 }), /products_discount_percent_check/);
    assert.equal((await insertProduct({ price: null, discount_percent: 10 })).sale_price, null);
  });

  test('a written sale_price (importers) sets the percent; the CMS sale_price is never stale', async () => {
    const p = await insertProduct({ sale_price: '1350.00' });
    assert.equal(p.discount_percent, '10.00');
    await db('products').where({ id: p.id }).update({ sale_price: '1200.00' });
    assert.equal((await product(p.id)).discount_percent, '20.00');
    await db('products').where({ id: p.id }).update({ sale_price: null });
    assert.equal((await product(p.id)).discount_percent, '0.00');
  });

  test('a sale price no percentage gives exactly is refused, not changed', async () => {
    await assert.rejects(insertProduct({ price: '1000.00', sale_price: '333.33' }), /не відповідає жодному відсотку/);
  });
});

describe('attribute fields', () => {
  const valueOf = async (code) => (await db('attribute_values as av').join('attributes as a', 'a.id', 'av.attribute_id')
    .where('a.code', code).first('av.id')).id;

  test('a link written through a field column fills product_id (Directus)', async () => {
    const p = await insertProduct();
    const onyx = (await db('attribute_values').where({ slug: 'oniks' }).first()).id;
    const [row] = await db('product_attribute_values').insert({ insertion_product_id: p.id, insertion_value_id: onyx }).returning('*');
    assert.deepEqual([row.product_id, row.attribute_value_id], [p.id, onyx]);
  });

  test('a link written through product_id is routed to its column (importers)', async () => {
    const p = await insertProduct();
    const internal = await valueOf('internal');
    const [row] = await db('product_attribute_values').insert({ product_id: p.id, attribute_value_id: internal }).returning('*');
    assert.deepEqual([row.other_product_id, row.other_value_id, row.insertion_product_id, row.metal_value_id], [p.id, internal, null, null]);
  });

  test('a link without a product is refused', async () => {
    const onyx = (await db('attribute_values').where({ slug: 'oniks' }).first()).id;
    await assert.rejects(db('product_attribute_values').insert({ attribute_value_id: onyx }), /product_attribute_values_route_check/);
  });

  test('a value of another attribute is refused in a field', async () => {
    const p = await insertProduct();
    const onyx = (await db('attribute_values').where({ slug: 'oniks' }).first()).id;
    await assert.rejects(
      db('product_attribute_values').insert({ coating_product_id: p.id, coating_value_id: onyx }),
      /не належить до цього поля/
    );
  });
});

describe('sizes', () => {
  test('unique per product type ("15.5" = "15,5"); same label allowed for another type', async () => {
    await db('sizes').insert({ category_id: seed.cat.rings, label: '15,5' });
    await assert.rejects(db('sizes').insert({ category_id: seed.cat.rings, label: '15.5' }), /sizes_category_label_unique/);
    await db('sizes').insert({ category_id: seed.cat.bracelets, label: '15,5' });
    const [range] = await db('sizes').insert({ category_id: seed.cat.bracelets, label: '17–20 см' }).returning('*');
    assert.equal(range.value, null);
    assert.equal(range.sort_value, '17');
  });

  test('a variant with size_id gets label and numeric size; label edit propagates', async () => {
    const p = await insertProduct();
    const [s] = await db('sizes').insert({ category_id: seed.cat.rings, label: '21' }).returning('*');
    const [v] = await db('product_variants').insert({ product_id: p.id, size_id: s.id }).returning('*');
    assert.deepEqual([v.size_label, v.size], ['21', '21.00']);
    await db('sizes').where({ id: s.id }).update({ label: '21,5' });
    const after = await db('product_variants').where({ id: v.id }).first();
    assert.deepEqual([after.size_label, after.size], ['21,5', '21.50']);
    await assert.rejects(db('sizes').where({ id: s.id }).del(), /product_variants_size_id_foreign/);
  });

  test('a size of another product type is refused', async () => {
    const p = await insertProduct();
    const s = await db('sizes').where({ category_id: seed.cat.necklaces }).first();
    await assert.rejects(db('product_variants').insert({ product_id: p.id, size_id: s.id }), /іншому типу товару/);
    const [v] = await db('product_variants').insert({ product_id: p.id, size_id: (await db('sizes').where({ category_id: seed.cat.rings }).first()).id }).returning('id');
    assert.ok(v);
    await assert.rejects(db('products').where({ id: p.id }).update({ category_id: seed.cat.necklaces }), /іншого типу товару/);
  });
});

describe('checkout quote', () => {
  test('server total uses the sale price and quantities', async () => {
    // 20: 1200 → 900 (25 %), 100: 1600
    assert.equal(await quoteCart(db, [{ code: '20', quantity: 2 }, { code: 100, quantity: 1 }]), 3400);
  });

  test('hidden / unknown products and bad quantities give null', async () => {
    assert.equal(await quoteCart(db, [{ code: '4', quantity: 1 }]), null); // draft
    assert.equal(await quoteCart(db, [{ code: 'nope', quantity: 1 }]), null);
    assert.equal(await quoteCart(db, [{ code: '20', quantity: 0 }]), null);
    assert.equal(await quoteCart(db, []), null);
  });
});
