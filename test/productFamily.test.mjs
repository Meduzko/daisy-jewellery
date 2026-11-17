import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getVariantFacet } from '../src/helpers/productFamily.js';

test('catalog insertion with a colour drives label and swatch', () => {
  const f = getVariantFacet('Каблучка з топазом', 'uk', { insertions: [{ slug: 'topaz', value: 'Топаз', color: '#3FA9D6' }] });
  assert.equal(f.label, 'Топаз');
  assert.equal(f.stone, 'topaz');
  assert.match(f.swatch, /#3FA9D6/);
});

test('insertion without a colour keeps the title stone colour, else no swatch (photo)', () => {
  assert.match(getVariantFacet('Каблучка з ониксом', 'ru', { insertions: [{ slug: 'onyx', value: 'Оникс', color: null }] }).swatch, /#121212/);
  assert.equal(getVariantFacet('Каблучка', 'uk', { insertions: [{ slug: 'topaz', value: 'Топаз', color: null }] }).swatch, null);
});

test('catalog coating overrides the plating named in the title', () => {
  const f = getVariantFacet('Каблучка нефрит позолота', 'uk', { coatings: [{ slug: 'rhodium', value: 'Родій' }] });
  assert.equal(f.gilded, false);
  assert.equal(f.label, 'Нефрит · родій');
  const g = getVariantFacet('Каблучка', 'uk', { coatings: [{ slug: 'gold', value: 'Позолота' }] });
  assert.equal(g.gilded, true);
  assert.equal(g.label, 'Позолота');
});

test('no attributes → title fallback (DNTrade source)', () => {
  const f = getVariantFacet('Каблучка нефрит позолота', 'uk');
  assert.equal(f.stone, 'jade');
  assert.equal(f.gilded, true);
  assert.equal(f.label, 'Нефрит · позолота');
});
