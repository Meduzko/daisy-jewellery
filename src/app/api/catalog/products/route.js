import { getCachedCategories, getCachedListing, getCachedSearchListing } from '../../../../lib/dataCache';
import { findCategoryByKey } from '../../../../lib/catalog/categories';
import { getCategoryTranslations } from '../../../../dictionaries';
import { getCategoryExtras } from '../../../../components/Category/config';
import { toCardModel } from '../../../../components/Category/cardModel';
import { PAGE_SIZE, parseListingParams, toRepositoryFilters } from '../../../../components/Category/listingParams';

// Category listing for the redesigned category pages (src/components/Category):
// «Показати ще», sorting and filters fetch further pages here, so the category
// pages themselves stay statically generated (ISR) without reading searchParams.
//
//   GET /api/catalog/products?category=ring&lang=uk&page=2&sort=price_asc&insertion=oniks
//   GET /api/catalog/products?category=ring&lang=uk&count=1&…   → { total } only
//   GET /api/catalog/products?search=клевер&lang=uk&cat=ring,earring&sort=… → search results page
//
// Responses are the card view models of cardModel.js (no internal product data).

export const dynamic = 'force-dynamic';

const MAX_PAGE = 200;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = String(searchParams.get('search') || '').trim();
  // only published categories (drafts are not in the list)
  const category = findCategoryByKey(await getCachedCategories(), searchParams.get('category'));
  if (!category && search.length < 2) {
    return Response.json({ message: 'Unknown category' }, { status: 400 });
  }
  const lang = searchParams.get('lang') === 'ru' ? 'ru' : 'uk';
  const page = Math.min(Math.max(Number.parseInt(searchParams.get('page'), 10) || 1, 1), MAX_PAGE);
  const countOnly = searchParams.get('count') === '1';
  const filters = toRepositoryFilters(parseListingParams(searchParams));
  const offset = countOnly ? 0 : (page - 1) * PAGE_SIZE;
  const limit = countOnly ? 1 : PAGE_SIZE;

  try {
    const { products, total, hasMore } = category
      ? await getCachedListing({ category: category.key, offset, limit, locale: lang, filters })
      : await getCachedSearchListing({ search, offset, limit, locale: lang, filters });

    const headers = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600' };
    if (countOnly) return Response.json({ total }, { headers });

    const dictionaryKey = category ? getCategoryExtras(category.key).dictionaryKey[lang] : '';
    const translations = dictionaryKey
      ? await getCategoryTranslations({ lang, categoryName: dictionaryKey }).catch(() => undefined)
      : undefined;
    const cards = products
      .filter((p) => p.image_path)
      .map((p) => toCardModel(p, { lang, translations }));

    return Response.json({ cards, total, hasMore, page }, { headers });
  } catch (error) {
    console.error('[api/catalog/products]', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
