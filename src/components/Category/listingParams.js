// Listing state (sort + filters) ⇄ URL query string. Shared by the category page
// client (CategoryCatalog), the listing Route Handler and the server data layer.
//
// Query parameters (all optional; the canonical URL of a category page never has them):
//   sort=newest|price_asc|price_desc        (default: recommended = numeric code order)
//   q=<motif stem>                          quick filter / «Добірка» motif (title search)
//   collection=new|popular                  «Добірка» collection
//   insertion=a,b   coating=a,b             attribute value slugs
//   size=16.5,17                            ring/bracelet sizes (in-stock variants)
//   price_min=550  price_max=2000           effective (sale) price, UAH
//   cat=ring|earring|necklace|bracer        category (search results page only)

export const SORT_KEYS = ['default', 'newest', 'price_asc', 'price_desc'];
export const ATTRIBUTE_KEYS = ['insertion', 'coating'];
export const PAGE_SIZE = 16;
export const CATEGORY_KEYS = ['ring', 'earring', 'necklace', 'bracer'];

const MAX_LIST = 20;
const cleanList = (value) =>
  String(value || '')
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v && /^[\p{L}\p{N}._-]{1,60}$/u.test(v))
    .slice(0, MAX_LIST);

const cleanNumber = (value) => {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
};

export const emptyFilters = () => ({
  sort: 'default',
  q: '',
  collection: '',
  attributes: { insertion: [], coating: [] },
  sizes: [],
  priceMin: null,
  priceMax: null,
  category: '',
});

/** URLSearchParams | Record<string,string> → normalized listing state. */
export function parseListingParams(input) {
  const get = (key) => {
    if (!input) return null;
    if (typeof input.get === 'function') return input.get(key);
    const v = input[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const state = emptyFilters();
  const sort = get('sort');
  if (SORT_KEYS.includes(sort)) state.sort = sort;
  const q = String(get('q') || '').trim().slice(0, 40);
  if (q) state.q = q;
  const collection = String(get('collection') || '').trim();
  if (/^[a-z0-9_-]{1,40}$/.test(collection)) state.collection = collection;
  for (const key of ATTRIBUTE_KEYS) state.attributes[key] = cleanList(get(key));
  state.sizes = cleanList(get('size')).map(Number).filter(Number.isFinite);
  state.priceMin = cleanNumber(get('price_min'));
  state.priceMax = cleanNumber(get('price_max'));
  const category = get('cat');
  if (CATEGORY_KEYS.includes(category)) state.category = category;
  return state;
}

/** Listing state → query string without "?" (empty for the default state). */
export function serializeListingParams(state) {
  const params = new URLSearchParams();
  if (state.sort && state.sort !== 'default') params.set('sort', state.sort);
  if (state.q) params.set('q', state.q);
  if (state.collection) params.set('collection', state.collection);
  for (const key of ATTRIBUTE_KEYS) {
    const values = state.attributes?.[key] || [];
    if (values.length) params.set(key, values.join(','));
  }
  if (state.sizes?.length) params.set('size', state.sizes.join(','));
  if (state.priceMin != null) params.set('price_min', String(state.priceMin));
  if (state.priceMax != null) params.set('price_max', String(state.priceMax));
  if (state.category) params.set('cat', state.category);
  return params.toString();
}

/** True when any filter (not the sort) narrows the listing. */
export function hasActiveFilters(state) {
  return Boolean(
    state.q ||
      state.collection ||
      ATTRIBUTE_KEYS.some((key) => state.attributes?.[key]?.length) ||
      state.sizes?.length ||
      state.priceMin != null ||
      state.priceMax != null ||
      state.category
  );
}

export const isDefaultListing = (state) => state.sort === 'default' && !hasActiveFilters(state);

/** Listing state → repository filter options (src/lib/catalog/repository.js applyFilters). */
export function toRepositoryFilters(state) {
  const attributes = {};
  for (const key of ATTRIBUTE_KEYS) {
    if (state.attributes?.[key]?.length) attributes[key] = state.attributes[key];
  }
  return {
    sort: state.sort === 'default' ? undefined : state.sort,
    q: state.q || undefined,
    collection: state.collection || undefined,
    attributes,
    sizes: state.sizes?.length ? state.sizes : undefined,
    priceMin: state.priceMin ?? undefined,
    priceMax: state.priceMax ?? undefined,
    category: state.category || undefined,
  };
}
