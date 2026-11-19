import { notFound, permanentRedirect } from 'next/navigation';
import ProductPageNew from '../../../../../components/ProductPage';
import {
  getCachedCategories,
  getCachedProductByCode,
  getCachedProductSizes,
} from '../../../../../lib/dataCache';
import { categoryHref, resolveCategoryPath } from '../../../../../lib/catalog/categories';
import { getProductMetadata } from '../../../../../helpers';
import { getProductJsonLd, getLogoJsonLd } from '../../../../../helpers/getJsonLd';
import { getItemTranslations } from '../../../../../dictionaries';
import { getCategoryExtras } from '../../../../../components/Category/config';

// Product page: /{lang}/{category URL prefix}/{code}, e.g. /uk/kabluchki/kupyty-sribnu-kabluchku/828.
// The prefix (category_translations.url_prefix) and the code must belong together: a product of
// another category, a draft category or an unknown prefix is 404; the other locale's prefix 301s.

export const revalidate = 900;

export async function generateStaticParams() {
  const { getCatalogProductRefs } = await import('../../../../../lib/catalog');
  const categories = await getCachedCategories();
  const params = [];
  for (const category of categories) {
    const refs = await getCatalogProductRefs(category.key);
    for (const lang of ['uk', 'ru']) {
      const [slug, sub] = category[lang].urlPrefix.split('/');
      for (const ref of refs) params.push({ lang, category: slug, sub, item: ref.code });
    }
  }
  return params;
}

async function resolve(props) {
  const params = await props.params;
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const hit = resolveCategoryPath(await getCachedCategories(), lang, `${params.category}/${params.sub}`);
  if (!hit) notFound();
  if (hit.redirect) permanentRedirect(`/${lang}/${hit.category[lang].urlPrefix}/${params.item}`);
  const product = await getCachedProductByCode(hit.category.key, params.item, lang);
  if (!product) notFound();
  return { lang, category: hit.category, product };
}

export async function generateMetadata(props) {
  const { lang, category, product } = await resolve(props);
  return getProductMetadata({ product, category, lang });
}

export default async function ProductRoute(props) {
  const { lang, category, product } = await resolve(props);
  const extras = getCategoryExtras(category.key);
  const dictionaryKey = extras.dictionaryKey[lang];

  const [productSizes, productJsonLd, t] = await Promise.all([
    // size picker: rings as before; categories created in Directus ('auto') show the product's own
    // sizes if it has any (e.g. rings moved there); earrings/necklaces/bracelets stay without, as before
    extras.showSizes !== false ? getCachedProductSizes(category.key, product) : undefined,
    getProductJsonLd(product, category, { lang }),
    dictionaryKey ? getItemTranslations({ lang, categoryName: dictionaryKey, code: product.code }).catch(() => undefined) : undefined,
  ]);
  const logoJsonLd = getLogoJsonLd({ lang });

  return (
    <>
      <ProductPageNew
        item={product}
        productSizes={productSizes}
        t={t}
        lang={lang}
        category={category.key}
        categoryInfo={{ name: category[lang].name, href: categoryHref(category, lang) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(logoJsonLd) }} />
    </>
  );
}
