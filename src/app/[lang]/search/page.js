import { getDefaultMetaData } from '../../../helpers';
import { getCachedSearchListing } from '../../../lib/dataCache';
import SearchResults from '../../../components/Category/SearchResults';
import { CATEGORIES } from '../../../components/Category/config';
import { toCardModel } from '../../../components/Category/cardModel';
import { PAGE_SIZE } from '../../../components/Category/listingParams';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const query = String(searchParams?.q || searchParams?.query || '').trim();
  const title = query
    ? (lang === 'ru' ? `Поиск: ${query} | Daisy Jewellery` : `Пошук: ${query} | Daisy Jewellery`)
    : (lang === 'ru' ? 'Поиск | Daisy Jewellery' : 'Пошук | Daisy Jewellery');
  const description = lang === 'ru'
    ? 'Поиск серебряных украшений Daisy Jewellery'
    : 'Пошук срібних прикрас Daisy Jewellery';

  return getDefaultMetaData({ pagePath: 'search', title, description, lang });
}

// Search results in the category page design (src/components/Category/SearchResults.js).
// The first PAGE_SIZE results are rendered here; sorting, the category filter and
// «Показати ще» use GET /api/catalog/products?search=….
export default async function SearchPage(props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const query = String(searchParams?.q || searchParams?.query || '').trim().slice(0, 100);

  let result = { products: [], total: 0, hasMore: false };
  let categoryOptions = [];

  if (query.length >= 2) {
    const [first, counts] = await Promise.all([
      getCachedSearchListing({ search: query, offset: 0, limit: PAGE_SIZE, locale: lang }).catch((error) => {
        console.error('[search]', error);
        return result;
      }),
      Promise.all(
        Object.values(CATEGORIES).map((config) =>
          getCachedSearchListing({ search: query, category: config.key, limit: 1, locale: lang })
            .then((r) => ({ key: config.key, label: config.name[lang], count: r.total }))
            .catch(() => ({ key: config.key, label: config.name[lang], count: 0 }))
        )
      ),
    ]);
    result = first;
    // Category filter only helps when results span more than one category.
    const present = counts.filter((c) => c.count > 0);
    categoryOptions = present.length > 1 ? present : [];
  }

  const cards = result.products
    .filter((product) => product.image_path)
    .map((product) => toCardModel(product, { lang }));

  return (
    <SearchResults
      lang={lang}
      query={query}
      total={result.total ?? cards.length}
      hasMore={result.hasMore}
      cards={cards}
      categoryOptions={categoryOptions}
    />
  );
}
