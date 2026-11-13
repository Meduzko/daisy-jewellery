// Product "family" helpers for the product page.
//
// The catalog has no explicit model/variant grouping: every stone or plating
// version of a model is its own product card. The DNTrade articles (SKUs) of one
// model share a base — the leading letters + digits:
//   508 · 508-родовано · 508-позолота · 508/1-родовано · 508/1 бр.-родовано → «508»
//   9510197ч · 9510197б → «9510197» · ГР297-К → «гр297»
// Cards of the same category with the same base are offered as variant swatches;
// cards of other categories with the same base form «Доповніть образ» (the set).

const BASE_RE = /^[\p{L}]*\d+/u;

/** Model base of an article, or null when it has none (or is too short to be reliable). */
export function getArticleBase(article) {
  const value = String(article ?? '').trim().toLowerCase();
  const match = value.match(BASE_RE);
  if (!match) return null;
  return match[0].length >= 3 ? match[0] : null;
}

// Stones named in titles, in priority order. `swatch` is the colour of the
// swatch dot (design: stone-coloured dot, gold rim for gilded versions).
const STONES = [
  { key: 'pearl', re: /перламутр/i, uk: 'Перламутр', ru: 'Перламутр', swatch: 'radial-gradient(circle at 35% 30%, #FFFFFF 0%, #ECEAE5 55%, #D3D0C9 100%)' },
  { key: 'carnelian', re: /сердолік|сердолик/i, uk: 'Сердолік', ru: 'Сердолик', swatch: 'radial-gradient(circle at 35% 30%, #C4553F 0%, #8E2A1E 70%)' },
  { key: 'jade', re: /нефрит/i, uk: 'Нефрит', ru: 'Нефрит', swatch: 'radial-gradient(circle at 35% 30%, #5E9A7C 0%, #275C44 70%)' },
  { key: 'malachite', re: /малахіт|малахит/i, uk: 'Малахіт', ru: 'Малахит', swatch: 'radial-gradient(circle at 35% 30%, #3E9A72 0%, #135A3D 70%)' },
  { key: 'onyx', re: /онікс|оникс/i, uk: 'Онікс', ru: 'Оникс', swatch: 'radial-gradient(circle at 35% 30%, #5A5957 0%, #121212 70%)' },
  { key: 'enamel', re: /емал|эмал/i, uk: 'Емаль', ru: 'Эмаль', swatch: null },
  { key: 'cz', re: /фіаніт|фианит|цирконі|цирконий|камінц|камешк/i, uk: 'Фіаніти', ru: 'Фианиты', swatch: 'radial-gradient(circle at 35% 30%, #FFFFFF 0%, #F1F1F0 50%, #D9D9D6 100%)' },
];

const GILDED_RE = /позолот/i;
const LENGTH_RE = /(\d+(?:[.,]\d+)?)\s*см/i;

/**
 * What distinguishes one card of a family from the others, derived only from
 * what its title states.
 * @returns {{ label: string, stone: string|null, gilded: boolean, swatch: string|null }}
 */
export function getVariantFacet(title, lang = 'uk') {
  const text = String(title || '');
  const l = lang === 'ru' ? 'ru' : 'uk';
  const stone = STONES.find((s) => s.re.test(text)) || null;
  const gilded = GILDED_RE.test(text);
  const length = text.match(LENGTH_RE)?.[1]?.replace(',', '.');

  const parts = [];
  if (stone) parts.push(stone[l]);
  if (gilded) parts.push(l === 'ru' ? 'позолота' : 'позолота');
  if (!parts.length) parts.push(l === 'ru' ? 'Серебро' : 'Срібло');
  if (length) parts.push(`${length} см`);
  const label = parts.join(' · ');

  return {
    label: label.charAt(0).toUpperCase() + label.slice(1),
    stone: stone?.key || null,
    gilded,
    swatch: stone?.swatch || null,
    // swatches of stone variants read «Вставка», others «Варіант»
    byStone: Boolean(stone),
  };
}
