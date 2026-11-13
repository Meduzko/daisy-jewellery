import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDb, resetSchema } from '../helpers/db.mjs';
import { seedCatalog } from '../helpers/seed.mjs';
import * as repo from '../../src/lib/catalog/repository.js';

let db;
let seed;

before(async () => {
  db = createTestDb();
  await resetSchema(db);
  seed = await seedCatalog(db);
});
after(async () => {
  await db?.destroy();
});

const codes = (list) => list.map((p) => String(p.code));

describe('visibility', () => {
  test('only active, priced products of active categories are listed', async () => {
    const { products, total } = await repo.listProducts(db, { limit: 100 });
    assert.deepEqual(codes(products).sort(), ['100', '20', '3', '6', '7', '9'].sort());
    assert.equal(total, 6);
    // draft (4), price NULL (5), inactive category (8) are hidden
    for (const hidden of ['4', '5', '8']) {
      assert.equal(await repo.getProductByCode(db, { code: hidden }), null, `code ${hidden} must be hidden`);
    }
  });

  test('category filter accepts storefront keys and DB codes', async () => {
    const a = await repo.listProducts(db, { category: 'ring', limit: 100 });
    const b = await repo.listProducts(db, { category: 'rings', limit: 100 });
    assert.deepEqual(codes(a.products), codes(b.products));
    assert.deepEqual(codes(a.products), ['3', '20', '100']);
    const none = await repo.listProducts(db, { category: 'unknown' });
    assert.equal(none.total, 0);
  });
});

describe('pagination and sorting', () => {
  test('default order is numeric by code, with total and hasMore', async () => {
    const p1 = await repo.listProducts(db, { limit: 4, offset: 0 });
    assert.deepEqual(codes(p1.products), ['3', '6', '7', '9']);
    assert.equal(p1.hasMore, true);
    assert.equal(p1.total, 6);
    const p2 = await repo.listProducts(db, { limit: 4, offset: 4 });
    assert.deepEqual(codes(p2.products), ['20', '100']);
    assert.equal(p2.hasMore, false);
  });

  test('limit/offset are clamped', async () => {
    const r = await repo.listProducts(db, { limit: 10000, offset: -5 });
    assert.equal(r.limit, repo.MAX_LIMIT);
    assert.equal(r.offset, 0);
    const bad = await repo.listProducts(db, { limit: 'abc' });
    assert.equal(bad.limit, 16);
  });

  test('price sorts use the effective (sale) price', async () => {
    const asc = await repo.listProducts(db, { category: 'ring', sort: 'price_asc' });
    assert.deepEqual(codes(asc.products), ['20', '100', '3']); // 900 (sale), 1600, 2200
    const desc = await repo.listProducts(db, { category: 'ring', sort: 'price_desc' });
    assert.deepEqual(codes(desc.products), ['3', '100', '20']);
  });

  test('newest sorts by original creation date', async () => {
    const r = await repo.listProducts(db, { sort: 'newest', limit: 3 });
    assert.deepEqual(codes(r.products), ['7', '20', '6']);
  });

  test('unknown sort falls back to default', async () => {
    const r = await repo.listProducts(db, { category: 'ring', sort: 'DROP TABLE' });
    assert.deepEqual(codes(r.products), ['3', '20', '100']);
  });
});

describe('localization', () => {
  test('ru uses the Russian row when present, Ukrainian otherwise', async () => {
    const ru = await repo.getProductByCode(db, { code: '100', locale: 'ru' });
    assert.equal(ru.title, 'Серебряное кольцо Клевер');
    assert.equal(ru.is_fallback, false);
    // ru row without short_description: field-level fallback to uk
    assert.equal(ru.short_description, '<p>Опис 100</p>');

    const fallback = await repo.getProductByCode(db, { code: '20', locale: 'ru' });
    assert.equal(fallback.title, 'Каблучка Серце з фіанітами');
    assert.equal(fallback.is_fallback, true);
  });

  test('unsupported locales are served in Ukrainian', async () => {
    const p = await repo.getProductByCode(db, { code: '100', locale: 'en' });
    assert.equal(p.title, 'Срібна каблучка Клевер');
    assert.equal(p.locale, 'uk');
  });

  test('category texts fall back too', async () => {
    const ru = await repo.getCategory(db, { category: 'necklace', locale: 'ru' });
    assert.equal(ru.name, 'Кольє');
    assert.equal(ru.is_fallback, true);
    const ok = await repo.getCategory(db, { category: 'ring', locale: 'ru' });
    assert.equal(ok.name, 'Кольца');
    assert.equal(await repo.getCategory(db, { category: 'bracer' }), null); // inactive
  });
});

describe('product detail', () => {
  test('lookup by code is restricted to the category of the URL', async () => {
    assert.ok(await repo.getProductByCode(db, { code: '6', category: 'earring' }));
    assert.equal(await repo.getProductByCode(db, { code: '6', category: 'ring' }), null);
  });

  test('invalid codes are rejected without querying', async () => {
    for (const code of ['', null, "1' OR '1'='1", 'a'.repeat(50)]) {
      assert.equal(await repo.getProductByCode(db, { code }), null);
    }
  });

  test('images are ordered, variants are public-only', async () => {
    const p = await repo.getProductByCode(db, { code: '100' });
    assert.equal(p.image_path, 'https://cdn.example/100-a.jpg');
    assert.deepEqual(p.images, ['https://cdn.example/100-a.jpg', 'https://cdn.example/100-b.jpg']);
    assert.equal(p.variants.length, 3);
    for (const v of p.variants) {
      assert.deepEqual(Object.keys(v).sort(), ['id', 'in_stock', 'price', 'size', 'size_label', 'weight_g']);
    }
    assert.deepEqual(p.variants.map((v) => v.in_stock), [true, true, false]); // 16.5 (untracked), 17 (1), 17.5 (0)
  });

  test('no internal fields leak into storefront products', async () => {
    const { products } = await repo.listProducts(db, { limit: 100 });
    const json = JSON.stringify(products);
    for (const secret of ['cost_price', '123.45', 'Secret Supplier', '+380000000000', 'supplier']) {
      assert.ok(!json.includes(secret), `leaked: ${secret}`);
    }
  });

  test('products by codes keep the requested order and skip hidden ones', async () => {
    const list = await repo.getProductsByCodes(db, { codes: [9, '4', 100, 'nope', 6] });
    assert.deepEqual(codes(list), ['9', '100', '6']);
  });
});

describe('filters', () => {
  test('collection (active only)', async () => {
    const clover = await repo.listProducts(db, { collection: 'clover' });
    assert.deepEqual(codes(clover.products), ['6', '9', '100']);
    const hidden = await repo.listProducts(db, { collection: 'hidden' });
    assert.equal(hidden.total, 0);
  });

  test('attributes (OR inside one attribute)', async () => {
    const onyx = await repo.listProducts(db, { attributes: { insertion: ['oniks'] } });
    assert.deepEqual(codes(onyx.products), ['3', '6', '100']);
    const both = await repo.listProducts(db, { category: 'ring', attributes: { insertion: ['oniks', 'fianit'] } });
    assert.deepEqual(codes(both.products), ['3', '20', '100']);
    const empty = await repo.listProducts(db, { attributes: { insertion: [] } });
    assert.equal(empty.total, 6);
  });

  test('price range on effective price', async () => {
    const r = await repo.listProducts(db, { priceMin: 900, priceMax: 1600 });
    assert.deepEqual(codes(r.products), ['6', '20', '100']);
  });

  test('in stock and sizes', async () => {
    const inStock = await repo.listProducts(db, { inStock: true, limit: 100 });
    assert.ok(!codes(inStock.products).includes('7')); // only variant has stock 0
    assert.ok(codes(inStock.products).includes('6')); // untracked stock counts as available
    const size17 = await repo.listProducts(db, { sizes: [17] });
    assert.deepEqual(codes(size17.products), ['100']); // 20 has 17 but sold out
  });
});

describe('search', () => {
  test('matches every word, case-insensitive, in title / article / code', async () => {
    assert.deepEqual(codes((await repo.listProducts(db, { q: 'клевер' })).products), ['6', '9', '100']);
    assert.deepEqual(codes((await repo.listProducts(db, { q: 'КЛЕВЕР онікс' })).products), ['6']);
    assert.deepEqual(codes((await repo.listProducts(db, { q: '508-РОДОВАНО' })).products), ['3', '6']);
    // exact code, plus article «2069р» containing «20»
    assert.deepEqual(codes((await repo.listProducts(db, { q: '20' })).products), ['20', '100']);
  });

  test('Russian queries match Russian titles and Ukrainian titles still match in ru', async () => {
    assert.deepEqual(codes((await repo.listProducts(db, { q: 'серебряное', locale: 'ru' })).products), ['100']);
    assert.deepEqual(codes((await repo.listProducts(db, { q: 'каблучка срібна', locale: 'ru' })).products), ['100']);
  });

  test('LIKE wildcards are escaped', async () => {
    assert.deepEqual(codes((await repo.listProducts(db, { q: '100%' })).products), ['3']);
    assert.deepEqual(codes((await repo.listProducts(db, { q: 'срібло_925' })).products), ['3']);
    assert.equal((await repo.listProducts(db, { q: '%' })).total, 1); // only the title containing "%"
    assert.equal((await repo.listProducts(db, { q: '_' })).total, 1);
  });
});

describe('sizes, related, facets, refs', () => {
  test('sizes are shared by article (trimmed, case-insensitive) within the category', async () => {
    assert.deepEqual(await repo.getSizesByArticle(db, { article: '2069р' }), [16.5, 17, 17.5, 18]);
    assert.deepEqual(await repo.getSizesByArticle(db, { article: ' 2069Р ' }), [16.5, 17, 17.5, 18]);
    assert.deepEqual(await repo.getSizesByArticle(db, { article: '2069р', inStockOnly: true }), [16.5, 17, 18]);
    assert.deepEqual(await repo.getSizesByArticle(db, { article: '508-родовано', category: 'ring' }), [19]);
    assert.deepEqual(await repo.getSizesByArticle(db, { article: '' }), []);
  });

  test('related products: same category, shared attributes first, never itself', async () => {
    const related = await repo.getRelatedProducts(db, { productId: seed.ids['100'] });
    assert.deepEqual(codes(related), ['3', '20']); // 3 shares «онікс»
    const none = await repo.getRelatedProducts(db, { productId: 999999 });
    assert.deepEqual(none, []);
  });

  test('product family: same article base in any category, never itself or hidden products', async () => {
    // 100 «2069р» and 20 «2069р » share the base «2069»
    assert.deepEqual(codes(await repo.getProductFamily(db, { productId: seed.ids['100'] })), ['20']);
    // ring 3 and earrings 6 share «508-родовано» → base «508»
    const family = await repo.getProductFamily(db, { productId: seed.ids['3'] });
    assert.deepEqual(codes(family), ['6']);
    assert.equal(family[0].category, 'earring');
    // no article base (too short / none) → empty
    assert.deepEqual(await repo.getProductFamily(db, { productId: seed.ids['7'] }), []);
    assert.deepEqual(await repo.getProductFamily(db, { productId: 999999 }), []);
  });

  test('facets list filterable attribute values with counts, price range and sizes', async () => {
    const f = await repo.getFacets(db, { category: 'ring', locale: 'ru' });
    assert.deepEqual(f.price, { min: 900, max: 2200 });
    assert.equal(f.attributes.length, 1);
    assert.equal(f.attributes[0].name, 'Вставка (ru)');
    assert.deepEqual(f.attributes[0].values, [
      { slug: 'oniks', value: 'оникс', count: 2 },
      { slug: 'fianit', value: 'фіаніт', count: 1 },
    ]);
    assert.deepEqual(f.sizes, [16.5, 17, 18]);
  });

  test('refs for sitemap / static params', async () => {
    const refs = await repo.listProductRefs(db);
    assert.equal(refs.length, 6);
    assert.deepEqual(refs.find((r) => r.code === '9').category, 'necklace');
    assert.equal(await repo.countProducts(db, { category: 'earring' }), 2);
  });
});
