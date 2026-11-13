import { notFound } from 'next/navigation';
import { getCategoryTranslations } from '../../dictionaries';
import { getLogoJsonLd, getCategoryJsonLd } from '../../helpers/getJsonLd';
import { generateCategoryMetadata } from '../../helpers';
import {
  getCachedProducts,
  getCachedFacets,
  getCachedQuickLinkPreviews,
  getCachedListing,
} from '../../lib/dataCache';
import { getCategoryCopy } from './copy';
import CategoryPage from './CategoryPage';
import { getCategoryConfig, getCategoryUrls } from './config';
import { toCardModel } from './cardModel';
import { PAGE_SIZE } from './listingParams';

// Shared implementation of the category listing routes
// (src/app/[lang]/{koltsa,serezhky,sergi,kolye,braslety}/page.js).
// Each category has a single URL (/{lang}/{slug}); the server renders the first
// PAGE_SIZE products and «Показати ще» loads the rest from /api/catalog/products.
// Old numbered URLs (/{lang}/{slug}/N) 301-redirect here (next.config.mjs).
//
// @param {{ category: 'ring'|'earring'|'necklace'|'bracer', langs: ('uk'|'ru')[] }} options
//   langs: locales this route file serves. A single locale means the locale is fixed
//   (serezhky → uk, sergi → ru) regardless of the [lang] segment, as before.

// «Добірка» collections offered in the filter panel (collections.code).
const COLLECTIONS = ['new', 'popular'];

export function createCategoryRoute({ category, langs }) {
  const config = getCategoryConfig(category);
  const resolveLang = (params) =>
    langs.length === 1 ? langs[0] : params?.lang === 'ru' ? 'ru' : 'uk';

  async function generateStaticParams() {
    return langs.map((lang) => ({ lang }));
  }

  async function generateMetadata(props) {
    const params = await props.params;
    const lang = resolveLang(params);
    const { title, description, keywords } = config.seo[lang];
    const categorySlug = config.slugs[lang];

    return generateCategoryMetadata({
      title,
      description,
      categorySlug,
      keywords,
      lang,
    });
  }

  async function Page(props) {
    const params = await props.params;
    const lang = resolveLang(params);
    const { baseURL, itemBaseURL } = getCategoryUrls(config, lang);
    const { products, hasMore, total } = await getCachedProducts({ category, offset: 0, limit: PAGE_SIZE, locale: lang });

    if (!products || !products.length) notFound();

    const [translations, facets, previews, collectionCounts] = await Promise.all([
      config.dictionaryKey[lang]
        ? getCategoryTranslations({ lang, categoryName: config.dictionaryKey[lang] }).catch(() => undefined)
        : undefined,
      getCachedFacets(category, lang).catch(() => null),
      getCachedQuickLinkPreviews(category, config.quickLinks.map((l) => l.q), lang).catch(() => []),
      Promise.all(
        COLLECTIONS.map((code) =>
          getCachedListing({ category, limit: 1, locale: lang, filters: { collection: code } })
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
      .map((item) => toCardModel(item, { lang, translations, itemBaseURL }));

    const quickLinks = config.quickLinks
      .map((link) => {
        const preview = previews.find((p) => p.q === link.q);
        return preview ? { q: link.q, label: link[lang], image: preview.image, count: preview.total } : null;
      })
      .filter(Boolean);

    const logoJsonLd = getLogoJsonLd();
    const categoryJsonLd = getCategoryJsonLd({
      name: config.h1[lang],
      description: config.seo[lang].description,
      path: baseURL,
      lang,
      items: cards.map((card) => ({ name: card.name, path: card.href })),
    });

    const { editorial, service } = config;

    return (
      <>
        <CategoryPage
          lang={lang}
          category={category}
          name={config.name[lang]}
          h1={config.h1[lang]}
          intro={config.intro[lang]}
          baseURL={baseURL}
          total={total ?? cards.length}
          hasMore={hasMore}
          cards={cards}
          facets={facets}
          quickLinks={quickLinks}
          collectionOptions={collectionOptions}
          priceChip={config.priceChip}
          showSizes={config.showSizes}
          sizeGuideHref={config.sizeGuideHref ? config.sizeGuideHref(lang) : null}
          editorial={{
            image: editorial.image,
            imagePosition: editorial.imagePosition,
            kicker: editorial.kicker[lang],
            title: editorial.title[lang],
            text: editorial.text[lang],
            cta: editorial.cta[lang],
            href: editorial.href(lang),
          }}
          service={{
            image: service.image,
            imageAlt: service.imageAlt[lang],
            kicker: service.kicker[lang],
            title: service.title[lang],
            steps: service.steps[lang],
            cta: service.cta[lang],
            href: service.href(lang),
          }}
          seoBlock={{
            title: config.seoBlock.title[lang],
            lead: config.seoBlock.lead[lang],
            more: config.seoBlock.more?.[lang]
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(logoJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }} />
      </>
    );
  }

  return { generateStaticParams, generateMetadata, Page };
}
