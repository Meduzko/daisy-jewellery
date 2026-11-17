import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getVariantFacet } from '../src/helpers/productFamily.js';

test('catalog insertion with a colour drives label and swatch', () => {
  const f = getVariantFacet('Каблучка з топазом', 'uk', [{ slug: 'topaz', value: 'Топаз', color: '#3FA9D6' }]);
  assert.equal(f.label, 'Топаз');
  assert.equal(f.stone, 'topaz');
  assert.match(f.swatch, /#3FA9D6/);
});

test('insertion without a colour keeps the title stone colour, else no swatch (photo)', () => {
  assert.match(getVariantFacet('Каблучка з ониксом', 'ru', [{ slug: 'onyx', value: 'Оникс', color: null }]).swatch, /#121212/);
  assert.equal(getVariantFacet('Каблучка', 'uk', [{ slug: 'topaz', value: 'Топаз', color: null }]).swatch, null);
});

test('no insertions → title regex fallback (DNTrade source)', () => {
  const f = getVariantFacet('Каблучка нефрит позолота', 'uk');
  assert.equal(f.stone, 'jade');
  assert.equal(f.label, 'Нефрит · позолота');
});
