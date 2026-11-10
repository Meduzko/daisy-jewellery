import { getCachedListing, getCachedSearchListing } from '../../../../lib/dataCache';
import { getCategoryTranslations } from '../../../../dictionaries';
import { getCategoryConfig, getCategoryUrls } from '../../../../components/Category/config';
import { toCardModel } from '../../../../components/Category/cardModel';
import { PAGE_SIZE, parseListingParams, toRepositoryFilters } from '../../../../components/Category/listingParams';

// Category listing for the redesigned category pages (src/components/Category):
// «Показати ще», sorting and filters fetch further pages here, so the category
// pages themselves stay statically generated (ISR) without reading searchParams.
//
//   GET /api/catalog/products?category=ring&lang=uk&page=2&sort=price_asc&insertion=oniks
//   GET /api/catalog/products?category=ring&lang=uk&count=1&…   → { total } only
//   GET /api/catalog/products?search=клевер&lang=uk&cat=ring&sort=… → search results page
//
// Responses are the card view models of cardModel.js (no internal product data).

export const dynamic = 'force-dynamic';

const MAX_PAGE = 200;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = String(searchParams.get('search') || '').trim();
  const config = getCategoryConfig(searchParams.get('category'));
  if (!config && search.length < 2) {
    return Response.json({ message: 'Unknown category' }, { status: 400 });
  }
  const lang = searchParams.get('lang') === 'ru' ? 'ru' : 'uk';
  const page = Math.min(Math.max(Number.parseInt(searchParams.get('page'), 10) || 1, 1), MAX_PAGE);
  const countOnly = searchParams.get('count') === '1';
  const { category: filterCategory, ...filters } = toRepositoryFilters(parseListingParams(searchParams));
  const offset = countOnly ? 0 : (page - 1) * PAGE_SIZE;
  const limit = countOnly ? 1 : PAGE_SIZE;

  try {
    const { products, total, hasMore } = config
      ? await getCachedListing({ category: config.key, offset, limit, locale: lang, filters })
      : await getCachedSearchListing({ search, category: filterCategory, offset, limit, locale: lang, filters });

    const headers = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600' };
    if (countOnly) return Response.json({ total }, { headers });

    const translations = config?.dictionaryKey[lang]
      ? await getCategoryTranslations({ lang, categoryName: config.dictionaryKey[lang] }).catch(() => undefined)
      : undefined;
    const itemBaseURL = config ? getCategoryUrls(config, lang).itemBaseURL : undefined;
    const cards = products
      .filter((p) => p.image_path)
      .map((p) => toCardModel(p, { lang, translations, itemBaseURL }));

    return Response.json({ cards, total, hasMore, page }, { headers });
  } catch (error) {
    console.error('[api/catalog/products]', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
