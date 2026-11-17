import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { productImageUrl } from '../../src/lib/catalog/images.js';
import { mapProduct } from '../../src/lib/catalog/mapper.js';

const { planMappings } = createRequire(import.meta.url)('../../scripts/map-r2-images.js');

const U = (n) => `https://cdn.dntrade.com.ua/S/${n}.jpg`;
const file = (url, local_path, size = 10) => ({ url, local_path, size, status: 'verified' });
const entry = (product_id, url, role = 'gallery') => ({ product_id, url, role });

test('planMappings maps only verified, unambiguous rows and never reorders', () => {
  const products = [
    { id: 100, legacy_code: '7648' }, { id: 2, legacy_code: '55' }, { id: 3, legacy_code: '66' },
    { id: 4, legacy_code: '77' }, { id: 5, legacy_code: '77' }, { id: 6, legacy_code: '88' },
  ];
  const rows = [
    { id: 1, product_id: 100, url: U('a'), sort_order: 0, r2_key: null },
    { id: 2, product_id: 100, url: U('b'), sort_order: 1, r2_key: null },
    { id: 3, product_id: 2, url: U('a'), sort_order: 0, r2_key: null }, // shared URL, file under 100_7648
    { id: 4, product_id: 3, url: U('new'), sort_order: 0, r2_key: null }, // added after the download
    { id: 5, product_id: 4, url: U('dup'), sort_order: 0, r2_key: null }, // code 77 is on two products
    { id: 6, product_id: 6, url: U('moved'), sort_order: 0, r2_key: 'gone/x.jpg' }, // URL moved to this product
    { id: 7, product_id: 3, url: U('lost'), sort_order: 1, r2_key: null }, // never uploaded
    { id: 8, product_id: 2, url: U('v'), sort_order: 1, r2_key: null }, // file saved as product 100's variant image
  ];
  const manifest = {
    files: [
      file(U('a'), '100_7648/00_a.jpg'), file(U('b'), '100_7648/01_b.png'), file(U('dup'), '4_77/00_dup.jpg'),
      file(U('moved'), '9_99/00_moved.jpg'), file(U('lost'), '3_66/01_lost.jpg'), file(U('v'), '100_7648/variants/v.jpeg'),
    ],
    images: [
      entry(100, U('a')), entry(100, U('b')), entry(2, U('a')), entry(4, U('dup')), entry(9, U('moved')),
      entry(3, U('lost')), { ...entry(100, U('v'), 'variant'), product_code: '7648' }, entry(2, U('v')),
    ],
  };
  const objects = [
    { key: '100_7648/00_a.jpg', size: 10 }, { key: '100_7648/01_b.png', size: 12 }, { key: '4_77/00_dup.jpg', size: 10 },
    { key: '9_99/00_moved.jpg', size: 10 }, { key: '100_7648/variants/v.jpeg', size: 10 },
    { key: '7_123/00_orphan.webp', size: 10 }, { key: '7_123/readme.txt', size: 10 },
    { key: 'cms/0b8f3c3e-0000-4000-8000-000000000000.webp', size: 10 }, // Directus upload: not planned here
  ];
  const plan = planMappings({ objects, manifest, products, rows });
  const keyOf = Object.fromEntries(plan.planned.map((p) => [p.id, p.r2_key]));

  assert.deepEqual(keyOf, { 1: '100_7648/00_a.jpg', 2: '100_7648/01_b.png', 3: '100_7648/00_a.jpg', 8: '100_7648/variants/v.jpeg' });
  assert.deepEqual(plan.details.ambiguous_rows.map((r) => r.id).sort(), [5, 6]);
  assert.deepEqual(plan.details.unmapped_rows.map((r) => r.id).sort(), [4, 7]);
  assert.deepEqual(plan.details.size_mismatches, [{ key: '100_7648/01_b.png', r2_size: 12, downloaded_size: 10 }]);
  assert.deepEqual(plan.details.unmatched_r2_images.map((o) => [o.key, o.reason]), [
    ['4_77/00_dup.jpg', 'ambiguous, see ambiguous_rows'],
    ['9_99/00_moved.jpg', 'ambiguous, see ambiguous_rows'],
    ['7_123/00_orphan.webp', 'not in the download manifest'],
  ]);
  assert.deepEqual(plan.details.invalid_r2_objects.map((o) => o.key), ['7_123/readme.txt']);
  assert.deepEqual(plan.details.variant_r2_images_not_used_by_site, []);
  // stale stored key is reported and cleared back to the DNTrade fallback
  assert.deepEqual(plan.storedProblems.map((p) => p.id), [6]);
  assert.deepEqual(plan.changes.find((c) => c.id === 6), { id: 6, product_id: 6, from: 'gone/x.jpg', to: null });
  assert.equal(plan.summary.products_whose_main_image_stays_on_dntrade, 3); // products 3, 4, 6
  assert.equal(plan.summary.directus_uploads_skipped, 1);

  // idempotent: once applied, nothing left to change
  const applied = rows.map((r) => ({ ...r, r2_key: keyOf[r.id] ?? null }));
  assert.equal(planMappings({ objects, manifest, products, rows: applied }).changes.length, 0);
});

test('productImageUrl builds the R2 URL from the key', () => {
  const env = { ...process.env };
  try {
    process.env.NEXT_PUBLIC_IMAGE_BASE_URL = 'https://images.daisy-jewellery.com.ua/';
    assert.equal(productImageUrl('cms/abc.webp'), 'https://images.daisy-jewellery.com.ua/cms/abc.webp');
    assert.equal(productImageUrl(null), null);
    assert.equal(productImageUrl('1_8829/00_508-нефрит Б+1.jpg'),
      'https://images.daisy-jewellery.com.ua/1_8829/00_508-%D0%BD%D0%B5%D1%84%D1%80%D0%B8%D1%82%20%D0%91%2B1.jpg');

    const p = mapProduct({ id: 1, legacy_code: '1', category_code: 'rings', image_keys: ['1_1/00_a.jpg', null, 'cms/c.png'] });
    assert.deepEqual(p.images, ['https://images.daisy-jewellery.com.ua/1_1/00_a.jpg', 'https://images.daisy-jewellery.com.ua/cms/c.png']);
    assert.equal(p.image_path, p.images[0]);
  } finally {
    process.env = env;
  }
});
