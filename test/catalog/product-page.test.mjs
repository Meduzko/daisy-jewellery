import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getArticleBase, getVariantFacet } from '../../src/helpers/productFamily.js';
import { isProductAvailable } from '../../src/helpers/productAvailability.js';

describe('product family helpers', () => {
  test('article base = leading letters + digits, lower-cased', () => {
    assert.equal(getArticleBase('508'), '508');
    assert.equal(getArticleBase('508-позолота '), '508');
    assert.equal(getArticleBase('508/1 бр.-родовано'), '508');
    assert.equal(getArticleBase('9510197ч'), '9510197');
    assert.equal(getArticleBase('ГР297-К'), 'гр297');
    assert.equal(getArticleBase('2025 р'), '2025');
    assert.equal(getArticleBase('E7'), null); // too short to be reliable
    assert.equal(getArticleBase(''), null);
    assert.equal(getArticleBase(null), null);
  });

  test('variant facet comes from what the title states', () => {
    assert.equal(getVariantFacet('Каблучка з перламутром та куб.цирконієм Клевер').label, 'Перламутр');
    assert.equal(getVariantFacet('Срібна каблучка 925° Клевер з сердоліком').label, 'Сердолік');
    const gilded = getVariantFacet('Срібна жіноча каблучка Клевер у позолоті куб.цирконій');
    assert.equal(gilded.label, 'Фіаніти · позолота');
    assert.equal(gilded.gilded, true);
    assert.equal(getVariantFacet('Срібна каблучка перламутр Клевер 1,5 см').label, 'Перламутр · 1.5 см');
    assert.equal(getVariantFacet('Cрібна каблучка жіноча мінімалістична').label, 'Срібло');
    assert.equal(getVariantFacet('Кольцо с перламутром', 'ru').label, 'Перламутр');
    assert.equal(getVariantFacet('Срібна каблучка у позолоті').label, 'Позолота');
  });
});

describe('availability', () => {
  test('out of stock only when every variant is tracked and sold out', () => {
    assert.equal(isProductAvailable({}), true); // DNTrade: no stock data
    assert.equal(isProductAvailable({ variants: [] }), true);
    assert.equal(isProductAvailable({ variants: [{ in_stock: false }, { in_stock: true }] }), true);
    assert.equal(isProductAvailable({ variants: [{ in_stock: false }, { in_stock: false }] }), false);
  });
});
