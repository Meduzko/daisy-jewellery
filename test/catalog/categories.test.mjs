// Categories managed in Directus (migration 20261119000001): DB rules (codes, slugs, URL prefixes,
// status, deletion), the storefront list (repository.listCategories) and the pure route / SEO helpers.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createTestDb, resetSchema, ROOT } from '../helpers/db.mjs';
import { seedCatalog } from '../helpers/seed.mjs';
import * as repo from '../../src/lib/catalog/repository.js';
import {
  categoryPaths, resolveCategoryPath, navigationItems, categoryStaticParams, splitSeoText, toCategoryKey,
} from '../../src/lib/catalog/categories.js';
import { getProductLink } from '../../src/helpers/getProductLink.js';
import { buildAlternates } from '../../src/helpers/seo.js';

const require = createRequire(import.meta.url);
const { CATEGORY_TEXTS, fillCategoryTexts } = require('../../db/reference/categories.js');

process.env.NEXT_PUBLIC_IMAGE_BASE_URL ||= 'https://images.example.test';

let db;
let seed;

before(async () => {
  db = createTestDb();
  await resetSchema(db);
  seed = await seedCatalog(db);
  // the real prefixes of the original categories (the seed leaves them to the trigger)
  await db('category_translations').where({ category_id: seed.cat.rings, locale: 'uk' }).update({ url_prefix: 'kabluchki/kupyty-sribnu-kabluchku' });
  await db('category_translations').where({ category_id: seed.cat.rings, locale: 'ru' }).update({ url_prefix: 'koltsa/kupit-serebryanoye-koltso' });
});
after(async () => {
  await db?.destroy();
});

const createCategory = async (fields = {}, texts = {}) => {
  const [row] = await db('categories').insert({ sort_order: 10, ...fields }).returning('*');
  for (const [locale, t] of Object.entries(texts)) {
    await db('category_translations').insert({ category_id: row.id, locale, ...t });
  }
  return row;
};
const translation = (categoryId, locale) => db('category_translations').where({ category_id: categoryId, locale }).first();
const published = async () => repo.listCategories(db);

describe('existing categories', () => {
  test('static texts are copied into empty fields only, idempotently', async () => {
    await db('category_translations').where({ category_id: seed.cat.rings, locale: 'uk' }).update({ h1: 'Відредаговано в Directus' });
    await fillCategoryTexts(db);
    await fillCategoryTexts(db);
    const uk = await translation(seed.cat.rings, 'uk');
    assert.equal(uk.h1, 'Відредаговано в Directus'); // manual edit kept
    assert.equal(uk.seo_title, CATEGORY_TEXTS.rings.uk.seo_title);
    assert.equal(uk.description, CATEGORY_TEXTS.rings.uk.description);
    assert.equal((await translation(seed.cat.earrings, 'ru')).seo_bottom_text, CATEGORY_TEXTS.earrings.ru.seo_bottom_text);
    // no ru row for necklaces in the seed: nothing is invented
    assert.equal(await translation(seed.cat.necklaces, 'ru'), undefined);
  });

  test('ids, codes, slugs and URLs are unchanged; storefront keys still map', async () => {
    const ring = (await published()).find((c) => c.id === seed.cat.rings);
    assert.equal(ring.code, 'rings');
    assert.equal(ring.key, 'ring');
    assert.equal(ring.uk.slug, 'kabluchki');
    assert.equal(ring.ru.slug, 'koltsa');
    assert.equal(ring.uk.urlPrefix, 'kabluchki/kupyty-sribnu-kabluchku');
    assert.equal(ring.ru.urlPrefix, 'koltsa/kupit-serebryanoye-koltso');
    assert.equal(ring.showInNavigation, true);
  });

  test('editing the name keeps the slug; a manual slug change moves the URL prefix, keeping its item part', async () => {
    await db('category_translations').where({ category_id: seed.cat.rings, locale: 'uk' }).update({ name: 'Каблучки срібні' });
    assert.equal((await translation(seed.cat.rings, 'uk')).slug, 'kabluchki');
    await db('category_translations').where({ category_id: seed.cat.rings, locale: 'ru' }).update({ slug: 'koltsa-new' });
    assert.equal((await translation(seed.cat.rings, 'ru')).url_prefix, 'koltsa-new/kupit-serebryanoye-koltso');
    await db('category_translations').where({ category_id: seed.cat.rings, locale: 'ru' }).update({ slug: 'koltsa' });
    assert.equal((await translation(seed.cat.rings, 'ru')).url_prefix, 'koltsa/kupit-serebryanoye-koltso');
  });
});

describe('creating and editing categories', () => {
  test('code, slugs and URL prefixes are generated; new categories start as hidden drafts', async () => {
    const c = await createCategory({}, { uk: { name: 'Підвіски' }, ru: { name: 'Подвески', slug: null } });
    assert.equal(c.code, `category-${c.id}`);
    assert.equal(c.status, 'draft');
    assert.equal(c.show_in_navigation, true);
    assert.equal(c.show_on_homepage, false);
    assert.deepEqual([(await translation(c.id, 'uk')).slug, (await translation(c.id, 'uk')).url_prefix], ['pidvisky', 'pidvisky/kupyty-pidvisky']);
    assert.deepEqual([(await translation(c.id, 'ru')).slug, (await translation(c.id, 'ru')).url_prefix], ['podveski', 'podveski/kupit-podveski']);
    assert.equal((await published()).some((x) => x.id === c.id), false);
  });

  test('generated slugs are unique per locale and avoid reserved page names', async () => {
    const a = await createCategory({}, { uk: { name: 'Ланцюжки' } });
    const b = await createCategory({}, { uk: { name: 'Ланцюжки' } });
    const s = await createCategory({}, { uk: { name: 'Search' } });
    assert.equal((await translation(a.id, 'uk')).slug, 'lantsiuzhky');
    assert.equal((await translation(b.id, 'uk')).slug, 'lantsiuzhky-2');
    assert.equal((await translation(s.id, 'uk')).slug, 'search-2');
  });

  test('invalid values are rejected by the database', async () => {
    const c = await createCategory({}, { uk: { name: 'Тест' } });
    await assert.rejects(db('category_translations').where({ category_id: c.id }).update({ slug: 'about' }), /category_translations_slug_check/);
    await assert.rejects(db('category_translations').where({ category_id: c.id }).update({ slug: 'Bad Slug' }), /category_translations_slug_check/);
    await assert.rejects(db('category_translations').where({ category_id: c.id }).update({ slug: 'kabluchki' }), /unique/);
    await assert.rejects(createCategory({ code: 'ring' }), /categories_code_check/); // storefront key of «rings»
    await assert.rejects(db('categories').where({ id: c.id }).update({ status: 'archived' }), /categories_status_check/);
  });

  test('explicit code is kept; parent cycles are refused', async () => {
    const parent = await createCategory({ code: 'chains' });
    const child = await createCategory({ parent_id: parent.id });
    assert.equal(parent.code, 'chains');
    await assert.rejects(db('categories').where({ id: parent.id }).update({ parent_id: child.id }), /own parent/);
    await assert.rejects(db('categories').where({ id: parent.id }).update({ parent_id: parent.id }), /own parent|categories_parent_not_self/);
  });
});

describe('publishing, visibility and products', () => {
  let cat;
  before(async () => {
    cat = await createCategory({ code: 'pendants', sort_order: 0, show_on_homepage: true, image_r2_key: 'cms/abc.webp' },
      { uk: { name: 'Кулони', h1: 'Срібні кулони', seo_bottom_text: 'Перший абзац.\n\nДругий.\nТретій рядок.' } });
    // move an existing product (rings, code 3) into the new category
    await db('products').where({ id: seed.ids['3'] }).update({ category_id: cat.id });
  });

  test('a draft category hides its products everywhere', async () => {
    assert.equal((await repo.listProducts(db, { category: 'pendants' })).total, 0);
    assert.equal(await repo.getProductByCode(db, { code: '3', category: 'pendants' }), null);
  });

  test('published: listed in order with flags, image and uk fallback texts for ru', async () => {
    await db('categories').where({ id: cat.id }).update({ status: 'published' });
    const list = await published();
    assert.equal(list[0].code, 'pendants'); // sort_order 0
    const c = list[0];
    assert.equal(c.key, 'pendants');
    assert.equal(c.showOnHomepage, true);
    assert.match(c.image, /^https:\/\/[^/]+\/cms\/abc\.webp$/); // R2 base from NEXT_PUBLIC_IMAGE_BASE_URL
    assert.equal(c.ru.name, 'Кулони');
    assert.equal(c.ru.isFallback, true);
    assert.deepEqual(categoryPaths(c), { uk: 'uk/kulony', ru: null }); // ru canonicalizes to uk
    assert.ok(navigationItems(list, 'uk').some((i) => i.link === '/uk/kulony'));
    assert.equal(list.some((x) => x.code === 'bracelets'), false); // draft in the seed
  });

  test('products follow their category: listing, lookup, URLs; other categories lose them', async () => {
    const { products, total } = await repo.listProducts(db, { category: 'pendants' });
    assert.equal(total, 1);
    assert.equal(products[0].category, 'pendants');
    assert.deepEqual(products[0].category_paths, { uk: 'kulony/kupyty-kulony', ru: 'kulony/kupyty-kulony' });
    assert.equal(getProductLink(products[0], 'uk'), '/uk/kulony/kupyty-kulony/3');
    assert.ok(await repo.getProductByCode(db, { code: '3', category: 'pendants' }));
    assert.equal(await repo.getProductByCode(db, { code: '3', category: 'ring' }), null);
    assert.equal((await repo.listProducts(db, { category: 'ring', limit: 100 })).products.some((p) => String(p.code) === '3'), false);
    const ring = (await repo.listProducts(db, { category: 'ring', limit: 1 })).products[0];
    assert.equal(getProductLink(ring, 'ru'), `/ru/koltsa/kupit-serebryanoye-koltso/${ring.code}`);
  });

  test('a published category without visible products is not linked (its page would be 404)', async () => {
    const empty = await createCategory({ status: 'published', show_on_homepage: true }, { uk: { name: 'Без товарів' } });
    const c = (await published()).find((x) => x.id === empty.id);
    assert.equal(c.productCount, 0);
    assert.equal(navigationItems([c], 'uk').length, 0);
    assert.equal((await published()).find((x) => x.code === 'pendants').productCount, 1);
    await db('categories').where({ id: empty.id }).del();
  });

  test('a category with products cannot be deleted; an empty one can (texts go with it)', async () => {
    await assert.rejects(db('categories').where({ id: cat.id }).del(), /У категорії «Кулони» 1 товар\(ів\) — спершу перенесіть/);
    const empty = await createCategory({}, { uk: { name: 'Порожня' } });
    await db('categories').where({ id: empty.id }).del();
    assert.equal(await translation(empty.id, 'uk'), undefined);
  });

  test('hiding from navigation / homepage only changes the flags', async () => {
    await db('categories').where({ id: cat.id }).update({ show_in_navigation: false, show_on_homepage: false });
    const c = (await published()).find((x) => x.id === cat.id);
    assert.equal(navigationItems([c], 'uk').length, 0);
    assert.equal(c.showOnHomepage, false);
    assert.ok(categoryStaticParams([c]).some((p) => p.category === 'kulony')); // page itself still exists
  });

  test('unpublishing removes the category from the storefront list again', async () => {
    await db('categories').where({ id: cat.id }).update({ status: 'draft' });
    assert.equal((await published()).some((x) => x.id === cat.id), false);
  });
});

describe('✕ in a category\'s product list (category_id = NULL, migration 20261119000003)', () => {
  const product = (id) => db('products').where({ id }).first();

  test('returns the product, with its sizes, to its previous category', async () => {
    const [p] = await db('products').insert({ category_id: seed.cat.rings, price: '1000.00', status: 'active' }).returning('*');
    const [size] = await db('sizes').insert({ category_id: seed.cat.rings, label: '24' }).returning('*');
    const [v] = await db('product_variants').insert({ product_id: p.id, size_id: size.id }).returning('*');
    const sale = await createCategory({}, { uk: { name: 'Розпродаж тест' } });

    await db('products').where({ id: p.id }).update({ category_id: sale.id });
    assert.deepEqual([(await product(p.id)).category_id, (await product(p.id)).previous_category_id], [sale.id, seed.cat.rings]);

    await db('products').where({ id: p.id }).update({ category_id: null }); // what Directus sends for ✕
    assert.deepEqual([(await product(p.id)).category_id, (await product(p.id)).previous_category_id], [seed.cat.rings, sale.id]);
    assert.equal((await db('product_variants').where({ id: v.id }).first()).size_id, size.id);
  });

  test('without a previous category, or on insert, NULL is refused with a readable message', async () => {
    const c = await createCategory({}, { uk: { name: 'Нова тест' } });
    const [p] = await db('products').insert({ category_id: c.id, price: '1000.00', status: 'active' }).returning('*');
    await assert.rejects(db('products').where({ id: p.id }).update({ category_id: null }), /не має попередньої категорії/);
    await assert.rejects(db('products').insert({ category_id: null, price: '1.00' }), /Оберіть категорію товару/);
    assert.equal((await product(p.id)).category_id, c.id);
  });
});

describe('category showing a collection (categories.collection_id, migration 20261119000004)', () => {
  let sale;
  let coll;
  before(async () => {
    [coll] = await db('collections').insert({ code: 'sale-test' }).returning('*');
    await db('collection_products').insert([{ collection_id: coll.id, product_id: seed.ids['100'] }, { collection_id: coll.id, product_id: seed.ids['6'] }]);
    sale = await createCategory({ code: 'sale', status: 'published', collection_id: coll.id }, { uk: { name: 'Акції' } });
  });

  test('lists the collection\'s products, which keep their own category and URLs', async () => {
    const { products, total } = await repo.listProducts(db, { category: 'sale' });
    assert.equal(total, 2);
    const byCode = Object.fromEntries(products.map((p) => [String(p.code), p]));
    assert.equal(byCode['100'].category, 'ring');
    assert.equal(byCode['6'].category, 'earring');
    assert.equal(getProductLink(byCode['100'], 'ru'), '/ru/koltsa/kupit-serebryanoye-koltso/100');
    assert.equal((await db('products').where({ id: seed.ids['100'] }).first()).category_id, seed.cat.rings); // unchanged
    // still in their own categories too
    assert.ok((await repo.listProducts(db, { category: 'ring', limit: 100 })).products.some((p) => String(p.code) === '100'));
  });

  test('filters, facets and counts work on it; product pages and sitemap refs are never under it', async () => {
    assert.equal((await repo.listProducts(db, { category: 'sale', q: 'сережки' })).total, 1);
    assert.ok(await repo.getFacets(db, { category: 'sale' }));
    assert.equal((await published()).find((c) => c.code === 'sale').productCount, 2);
    assert.equal((await published()).find((c) => c.code === 'sale').collectionId, coll.id);
    assert.equal(await repo.getProductByCode(db, { code: '100', category: 'sale' }), null);
    assert.equal((await repo.listProductRefs(db, { category: 'sale' })).length, 0);
  });

  test('an inactive collection empties it; clearing the field brings back its own products', async () => {
    await db('collections').where({ id: coll.id }).update({ is_active: false });
    assert.equal((await repo.listProducts(db, { category: 'sale' })).total, 0);
    assert.equal((await published()).find((c) => c.code === 'sale').productCount, 0);
    await db('collections').where({ id: coll.id }).update({ is_active: true });
    await db('categories').where({ id: sale.id }).update({ collection_id: null });
    assert.equal((await repo.listProducts(db, { category: 'sale' })).total, 0); // it has no own products
    await db('categories').where({ id: sale.id }).update({ status: 'draft' });
  });
});

describe('localized URLs and SEO (pure helpers)', () => {
  const ring = {
    key: 'ring',
    uk: { slug: 'kabluchki', urlPrefix: 'kabluchki/kupyty-sribnu-kabluchku', isFallback: false },
    ru: { slug: 'koltsa', urlPrefix: 'koltsa/kupit-serebryanoye-koltso', isFallback: false },
  };
  const kolye = {
    key: 'necklace',
    uk: { slug: 'kolye', urlPrefix: 'kolye/kupyty-sribne-kolye', isFallback: false },
    ru: { slug: 'kolye', urlPrefix: 'kolye/kupit-serebryanoye-kolye', isFallback: false },
  };
  const list = [ring, kolye];

  test('slugs and product prefixes resolve per locale; the other locale redirects; unknown is 404', () => {
    assert.deepEqual(resolveCategoryPath(list, 'uk', 'kabluchki'), { category: ring, redirect: false });
    assert.deepEqual(resolveCategoryPath(list, 'ru', 'kabluchki'), { category: ring, redirect: true });
    assert.deepEqual(resolveCategoryPath(list, 'ru', 'kolye'), { category: kolye, redirect: false });
    assert.deepEqual(resolveCategoryPath(list, 'ru', 'koltsa/kupit-serebryanoye-koltso'), { category: ring, redirect: false });
    assert.deepEqual(resolveCategoryPath(list, 'uk', 'koltsa/kupit-serebryanoye-koltso'), { category: ring, redirect: true });
    assert.equal(resolveCategoryPath(list, 'uk', 'kabluchki/kupit-serebryanoye-koltso'), null); // mixed prefix
    assert.equal(resolveCategoryPath(list, 'uk', 'nope'), null);
  });

  test('canonical + hreflang of a category page', () => {
    const a = buildAlternates('ru', categoryPaths(ring));
    assert.match(a.canonical, /\/ru\/koltsa$/);
    assert.match(a.languages['uk-UA'], /\/uk\/kabluchki$/);
    assert.match(a.languages['ru-UA'], /\/ru\/koltsa$/);
    assert.match(a.languages['x-default'], /\/uk\/kabluchki$/);
  });

  test('static params cover both locales', () => {
    assert.deepEqual(categoryStaticParams([ring]), [{ lang: 'uk', category: 'kabluchki' }, { lang: 'ru', category: 'koltsa' }]);
  });

  test('SEO bottom text: first paragraph visible, the rest collapsed', () => {
    assert.deepEqual(splitSeoText('Lead.\n\nMore 1.\n\nMore 2.'), { lead: 'Lead.', more: 'More 1.\n\nMore 2.' });
    assert.deepEqual(splitSeoText('Only lead.'), { lead: 'Only lead.', more: null });
    assert.deepEqual(splitSeoText(''), { lead: '', more: null });
  });

  test('product link without category paths falls back to home', () => {
    assert.equal(getProductLink({ code: 5 }, 'ru'), '/ru');
    assert.equal(toCategoryKey('bracelets'), 'bracer');
  });
});

describe('cache invalidation wiring', () => {
  // Next.js caches can't run under node:test; this guards the wiring the purge depends on.
  const src = (file) => readFileSync(path.join(ROOT, file), 'utf8');

  test('the category list is cached under the catalog tags that /api/catalog/revalidate purges', () => {
    assert.match(src('src/lib/catalog/index.js'), /getCatalogCategories = cached\(/);
    assert.match(src('src/lib/catalog/index.js'), /tags: CATALOG_CACHE_TAGS/);
    assert.match(src('src/app/api/catalog/revalidate/route.js'), /\.\.\.CATALOG_CACHE_TAGS/);
  });

  test('the Directus Flow fires on category, category text and product changes', () => {
    const flow = src('db/directus/configure.mjs').match(/const FLOW_COLLECTIONS = \[([\s\S]*?)\];/)[1];
    for (const c of ['categories', 'category_translations', 'products']) assert.match(flow, new RegExp(`'${c}'`));
  });
});
