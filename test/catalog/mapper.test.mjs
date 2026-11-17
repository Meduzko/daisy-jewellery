import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mapProduct, mapVariant, buildBadgeTags, salePercent } from '../../src/lib/catalog/mapper.js';
import { applyProductDiscount, getDisplayPrices, getLinePrices } from '../../src/helpers/productPricing.js';
import { toCategoryKey, toCategoryDbCode } from '../../src/lib/catalog/categories.js';

const row = (over = {}) => ({
  id: 7, legacy_code: '7723', article: '0647.10 р', price: '4200.00', sale_price: '3780.00',
  category_code: 'bracelets', locale: 'uk', title: 'Браслет', slug: 'braslet-7723', short_description: null,
  description: null, is_fallback: false, image_keys: ['7_1/a.jpg', 'b.jpg'], collection_codes: ['popular'], ...over,
});

test('maps to the storefront product shape', () => {
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL = 'https://images.example';
  const p = mapProduct(row());
  assert.equal(p.code, 7723);
  assert.equal(p.product_id, 'pg-7');
  assert.equal(p.sku, '0647.10 р');
  assert.equal(p.category, 'bracer');
  assert.equal(p.image_path, 'https://images.example/7_1/a.jpg');
  assert.equal(p.short_description, ''); // never null: ProductPage calls .replace() on it
  assert.equal(p.price, '4200.00');
  assert.equal(mapProduct(row({ image_keys: [] })).image_path, null);
  assert.equal(mapProduct(null), null);
});

test('explicit sale price wins in the existing pricing helpers', () => {
  const p = mapProduct(row({ price: '1000.00', sale_price: '777.00', collection_codes: [] }));
  const applied = applyProductDiscount(p);
  assert.equal(applied.price, 777);
  assert.equal(applied.originalPrice, 1000);
  assert.deepEqual(applied.badges.map((b) => [b.type, b.value]), [['sale', '22']]);
  // idempotent (GalleryItem / cart apply it repeatedly)
  assert.equal(applyProductDiscount(applyProductDiscount(p)).price, 777);
  assert.equal(getDisplayPrices(p).hasDiscount, true);
  assert.equal(getLinePrices({ ...applied, quantity: 2 }).price, 1554);
});

test('DNTrade products keep badge-based discounts', () => {
  const dn = { price: '4200.00', tags: [{ title: 'бейдж', items: [{ id: 1, title: 'знижка/10', status: 1 }] }] };
  assert.equal(applyProductDiscount(dn).price, 3780);
});

test('badges: sale percent and collections', () => {
  assert.equal(salePercent('4200.00', '3780.00'), 10);
  assert.equal(salePercent('100', '100'), null);
  assert.equal(salePercent(null, '1'), null);
  const tags = buildBadgeTags(row());
  assert.deepEqual(tags[0].items.map((i) => i.title), ['знижка/10', 'популярне']);
  assert.deepEqual(buildBadgeTags(row({ sale_price: null, collection_codes: ['clover'] })), []);
  const applied = applyProductDiscount(mapProduct(row({ sale_price: null })));
  assert.deepEqual(applied.badges.map((b) => b.type), ['popular']);
  assert.equal(applied.price, 4200);
});

test('variants expose public fields only', () => {
  const v = mapVariant({ id: 1, size: '17.50', size_label: '17,5', weight_g: '2.400', price: null, stock_qty: 0, cost_price: '1' });
  assert.deepEqual(v, { id: 1, size: 17.5, size_label: '17,5', weight_g: 2.4, price: null, in_stock: false });
});

test('category key mapping', () => {
  assert.equal(toCategoryKey('rings'), 'ring');
  assert.equal(toCategoryKey('ring'), 'ring');
  assert.equal(toCategoryKey('x'), null);
  assert.equal(toCategoryDbCode('bracer'), 'bracelets');
});

describe('mapAttributes', async () => {
  const { mapAttributes } = await import('../../src/lib/catalog/mapper.js');
  test('groups sorted rows by attribute', () => {
    assert.deepEqual(mapAttributes([
      { code: 'insertion', name: 'Вставка', slug: 'oniks', value: 'Онікс' },
      { code: 'insertion', name: 'Вставка', slug: 'fianit', value: 'Фіаніт' },
      { code: 'coating', name: 'Покриття', slug: 'rodii', value: 'Родій' },
    ]), [
      { code: 'insertion', name: 'Вставка', values: [{ slug: 'oniks', value: 'Онікс' }, { slug: 'fianit', value: 'Фіаніт' }] },
      { code: 'coating', name: 'Покриття', values: [{ slug: 'rodii', value: 'Родій' }] },
    ]);
  });
});
