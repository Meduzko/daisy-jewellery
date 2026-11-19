import { notFound, permanentRedirect } from 'next/navigation';
import { getCategoryTranslations } from '../../../dictionaries';
import { getLogoJsonLd, getCategoryJsonLd } from '../../../helpers/getJsonLd';
import { generateCategoryMetadata } from '../../../helpers';
import {
  getCachedCategories,
  getCachedProducts,
  getCachedFacets,
  getCachedQuickLinkPreviews,
  getCachedListing,
} from '../../../lib/dataCache';
import { categoryHref, categoryStaticParams, resolveCategoryPath, splitSeoText } from '../../../lib/catalog/categories';
import { getCategoryCopy } from '../../../components/Category/copy';
import CategoryPage from '../../../components/Category/CategoryPage';
import { getCategoryExtras } from '../../../components/Category/config';
import { toCardModel } from '../../../components/Category/cardModel';
import { PAGE_SIZE } from '../../../components/Category/listingParams';

// Category listing (/{lang}/{slug}) for every published category in PostgreSQL (edited in
// Directus). Static routes (about, blog, search…) win over this segment; the DB forbids those
// slugs. The server renders the first PAGE_SIZE products and «Показати ще» loads the rest from
// /api/catalog/products. Old numbered URLs (/{lang}/{slug}/N) 301 here (next.config.mjs).
// A slug of the other locale 301s to this locale's slug; drafts and unknown slugs are 404.

export const revalidate = 900;

// «Добірка» collections offered in the filter panel (collections.code).
const COLLECTIONS = ['new', 'popular'];

export async function generateStaticParams() {
  return categoryStaticParams(await getCachedCategories());
}

async function resolve(props) {
  const params = await props.params;
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const hit = resolveCategoryPath(await getCachedCategories(), lang, params.category);
  if (!hit) notFound();
  if (hit.redirect) permanentRedirect(categoryHref(hit.category, lang));
  return { lang, category: hit.category };
}

export async function generateMetadata(props) {
  const { lang, category } = await resolve(props);
  return generateCategoryMetadata({ category, lang });
}

export default async function Page(props) {
  const { lang, category } = await resolve(props);
  const key = category.key;
  const t = category[lang];
  const extras = getCategoryExtras(key);
  const baseURL = categoryHref(category, lang);
  const { products, hasMore, total } = await getCachedProducts({ category: key, offset: 0, limit: PAGE_SIZE, locale: lang });

  if (!products || !products.length) notFound();

  const [translations, facets, previews, collectionCounts] = await Promise.all([
    extras.dictionaryKey[lang]
      ? getCategoryTranslations({ lang, categoryName: extras.dictionaryKey[lang] }).catch(() => undefined)
      : undefined,
    getCachedFacets(key, lang).catch(() => null),
    getCachedQuickLinkPreviews(key, extras.quickLinks.map((l) => l.q), lang).catch(() => []),
    Promise.all(
      COLLECTIONS.map((code) =>
        getCachedListing({ category: key, limit: 1, locale: lang, filters: { collection: code } })
          .then((r) => ({ code, count: r.total }))
          .catch(() => ({ code, count: 0 }))
      )
    ),
  ]);
  const collectionNames = getCategoryCopy(lang).collectionNames;
  const collectionOptions = collectionCounts
    .filter((c) => c.count > 0)
    .map((c) => ({ code: c.code, label: collectionNames[c.code], count: c.count }));

  const cards = products
    .filter((item) => item.image_path)
    .map((item) => toCardModel(item, { lang, translations }));

  const quickLinks = extras.quickLinks
    .map((link) => {
      const preview = previews.find((p) => p.q === link.q);
      return preview ? { q: link.q, label: link[lang], image: preview.image, count: preview.total } : null;
    })
    .filter(Boolean);

  const logoJsonLd = getLogoJsonLd();
  const categoryJsonLd = getCategoryJsonLd({
    name: t.h1,
    description: t.seoDescription || t.description,
    path: baseURL,
    lang,
    items: cards.map((card) => ({ name: card.name, path: card.href })),
  });

  const { editorial, service } = extras;
  const seo = splitSeoText(t.seoBottomText);

  return (
    <>
      <CategoryPage
        lang={lang}
        category={key}
        name={t.name}
        h1={t.h1}
        intro={t.description}
        baseURL={baseURL}
        total={total ?? cards.length}
        hasMore={hasMore}
        cards={cards}
        facets={facets}
        quickLinks={quickLinks}
        collectionOptions={collectionOptions}
        priceChip={extras.priceChip}
        showSizes={extras.showSizes}
        sizeGuideHref={extras.sizeGuideHref ? extras.sizeGuideHref(lang) : null}
        editorial={editorial ? {
          image: editorial.image,
          imagePosition: editorial.imagePosition,
          kicker: editorial.kicker[lang],
          title: editorial.title[lang],
          text: editorial.text[lang],
          cta: editorial.cta[lang],
          href: editorial.href(lang),
        } : null}
        service={{
          image: service.image,
          imageAlt: service.imageAlt[lang],
          kicker: service.kicker[lang],
          title: service.title[lang],
          steps: service.steps[lang],
          cta: service.cta[lang],
          href: service.href(lang),
        }}
        seoBlock={seo.lead ? { title: `${t.h1} Daisy Jewellery`, lead: seo.lead, more: seo.more } : null}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(logoJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }} />
    </>
  );
}
