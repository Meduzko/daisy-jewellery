import { CATEGORY_KEYS, toCategoryKey, categoryHref } from './catalog/categories';

// Storefront product access used by pages (PostgreSQL catalog, ./catalog).
// `category` is a storefront key: 'ring' | 'earring' | 'necklace' | 'bracer'.

// ---------------------------------------------------------------- public API
/** Published categories with uk/ru texts and URLs (src/lib/catalog/categories.js has the helpers). */
export async function getCachedCategories() {
  const { getCatalogCategories } = await import('./catalog');
  return getCatalogCategories();
}

/** { [storefront key]: '/uk/kabluchki' } for links written into page copy; an unpublished category links home. */
export async function getCachedCategoryLinks(lang = 'uk') {
  const links = Object.fromEntries(CATEGORY_KEYS.map((key) => [key, `/${lang}`]));
  for (const c of await getCachedCategories()) links[c.key] = categoryHref(c, lang);
  return links;
}

export async function getCachedAllProducts(category, locale = 'uk') {
  const { getAllCatalogProducts } = await import('./catalog');
  const products = await getAllCatalogProducts(toCategoryKey(category), locale);
  // Throw instead of returning [] so an empty result is never cached or baked into ISR pages.
  if (!products.length) {
    throw new Error(`Catalog returned no products for category ${category}`);
  }
  return products;
}

export async function getCachedProducts({ category, offset = 0, limit = 16, locale = 'uk' }) {
  const { listCatalogProducts } = await import('./catalog');
  const { products, hasMore, total } = await listCatalogProducts({
    category: toCategoryKey(category),
    offset,
    limit,
    locale,
  });
  return { products, hasMore, total };
}

export async function getCachedProductByCode(category, code, locale = 'uk') {
  const { getCatalogProduct } = await import('./catalog');
  return getCatalogProduct(toCategoryKey(category), String(code), locale);
}

/** Ring sizes for the product page / size dialog (server side). */
export async function getCachedProductSizes(category, product) {
  const { getCatalogSizes } = await import('./catalog');
  return getCatalogSizes(product?.sku, toCategoryKey(category));
}

// ---------------------------------------------------------------- product page (redesign)

/**
 * Other cards of the same model (same article base, see helpers/productFamily.js),
 * in every category: `variants` = same category (swatches), `set` = cards of
 * the other categories («Доповніть образ»; the page picks one per category).
 * @returns {Promise<{ variants: object[], set: object[] }>}
 */
export async function getCachedProductFamily(category, product, locale = 'uk') {
  const key = toCategoryKey(category);
  if (!product?.id) return { variants: [], set: [] };
  const { getCatalogProductFamily } = await import('./catalog');
  const family = await getCatalogProductFamily(product.id, locale);

  const variants = family.filter((p) => p.category === key);
  const set = family.filter((p) => p.category && p.category !== key);
  return { variants, set };
}

/**
 * «Вам також сподобається»: same-category products. Cards matching `stem` (the
 * product's collection, e.g. «клевер») come first, then the catalog's related
 * ranking (shared collections / attributes, neighbouring codes).
 * @param {{ category: string, product: object, locale?: string, stem?: string|null, exclude?: string[], limit?: number }} options
 */
export async function getCachedRelatedProducts({ category, product, locale = 'uk', stem = null, exclude = [], limit = 4 }) {
  const skip = new Set([String(product.code), ...exclude.map(String)]);
  const picked = [];
  const take = (list) => {
    for (const p of list) {
      if (picked.length >= limit) return;
      if (skip.has(String(p.code))) continue;
      skip.add(String(p.code));
      picked.push(p);
    }
  };

  if (stem) {
    const { products } = await getCachedListing({ category, limit: limit + skip.size + 4, locale, filters: { q: stem } });
    take(products);
  }
  if (picked.length < limit) {
    if (product?.id) {
      const { getRelatedCatalogProducts } = await import('./catalog');
      take(await getRelatedCatalogProducts(product.id, locale, limit + skip.size + 4));
    }
  }
  return picked.map((p) => ({ ...p, category: p.category || toCategoryKey(category) }));
}

// ---------------------------------------------------------------- category listing (redesign)
// Sort + filters for the category pages (src/components/Category), done in SQL.

/**
 * One page of a category listing with sort and filters.
 * @param {{ category: string, offset?: number, limit?: number, locale?: string,
 *   filters?: { sort?, q?, collection?, attributes?, sizes?, priceMin?, priceMax? } }} options
 * @returns {Promise<{ products: object[], total: number, hasMore: boolean }>}
 */
export async function getCachedListing({ category, offset = 0, limit = 16, locale = 'uk', filters = {} }) {
  const { listCatalogProducts } = await import('./catalog');
  const { products, total, hasMore } = await listCatalogProducts({
    ...filters,
    category: toCategoryKey(category),
    offset,
    limit,
    locale,
  });
  return { products, total, hasMore };
}

/** Filter options of a category: { price: {min,max}, attributes: [{code,name,values}], sizes: number[] }. */
export async function getCachedFacets(category, locale = 'uk') {
  const { getCatalogFacets } = await import('./catalog');
  return getCatalogFacets(toCategoryKey(category), locale);
}

/**
 * Curated quick links of a category page: for each title-search stem, the number of
 * matching products and the image of the first one (links without matches are dropped).
 * @param {string} category
 * @param {string[]} stems
 */
export async function getCachedQuickLinkPreviews(category, stems, locale = 'uk') {
  const results = await Promise.all(
    stems.map(async (q) => {
      try {
        const { products, total } = await getCachedListing({ category, limit: 1, locale, filters: { q } });
        const product = products[0];
        return { q, total, image: product?.images?.[0] || product?.image_path || null };
      } catch {
        return { q, total: 0, image: null };
      }
    })
  );
  return results.filter((r) => r.total > 0);
}

/**
 * Search results (title / article / code, every word must match) with the category
 * listing's sort and filters, optionally narrowed to one category. Used by the
 * search page (/{lang}/search?q=…) and GET /api/catalog/products?search=….
 * @returns {Promise<{ products: object[], total: number, hasMore: boolean }>}
 */
export async function getCachedSearchListing({ search, category, offset = 0, limit = 16, locale = 'uk', filters = {} }) {
  const query = String(search || '').trim().slice(0, 100);
  if (query.length < 2) return { products: [], total: 0, hasMore: false };

  const { listCatalogProducts } = await import('./catalog');
  const { products, total, hasMore } = await listCatalogProducts({
    ...filters,
    q: [query, filters.q].filter(Boolean).join(' '),
    category: toCategoryKey(category) || undefined,
    offset,
    limit,
    locale,
  });
  return { products, total, hasMore };
}
