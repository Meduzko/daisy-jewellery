import Image from 'next/image';
import Link from 'next/link';
import { getCachedProductFamily, getCachedRelatedProducts } from '../../lib/dataCache';
import { getCategoryTranslations } from '../../dictionaries';
import ProductCard from '../Category/ProductCard';
import { toCardModel } from '../Category/cardModel';
import { getCategoryConfig } from '../Category/config';
import ClientViewContent from './ClientViewContent';
import ProductGallery from './ProductGallery';
import PurchasePanel from './PurchasePanel';
import { getVariantFacet } from '../../helpers/productFamily';
import { getProductCopy } from './copy';
import { toProductModel } from './productModel';
import styles from './ProductPage.module.css';

const GIFT_IMAGE = '/category/service-boxes.webp';

async function loadFamily(category, item, lang) {
  try {
    return await getCachedProductFamily(category, item, lang);
  } catch (error) {
    console.error('[product page] family:', error);
    return { variants: [], set: [] };
  }
}

async function loadRelated(options) {
  try {
    return await getCachedRelatedProducts(options);
  } catch (error) {
    console.error('[product page] related:', error);
    return [];
  }
}

const SET_ORDER = ['necklace', 'earring', 'bracer', 'ring'];

/**
 * «Доповніть образ»: one card per other category, preferring the version with the
 * same stone and plating as this product (e.g. the mother-of-pearl necklace for
 * the mother-of-pearl ring).
 */
function pickSet(products, facet, lang) {
  const score = (p) => {
    const f = getVariantFacet(p.title, lang);
    return (f.stone && f.stone === facet.stone ? 2 : 0) + (f.gilded === facet.gilded ? 1 : 0);
  };
  const picked = [];
  for (const key of SET_ORDER) {
    const candidates = products.filter((p) => p.category === key);
    if (!candidates.length) continue;
    picked.push(candidates.reduce((best, p) => (score(p) > score(best) ? p : best), candidates[0]));
  }
  return picked.slice(0, 3);
}

async function toCards(products, lang) {
  const keys = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const dictionaries = {};
  await Promise.all(
    keys.map(async (key) => {
      const dictionaryKey = getCategoryConfig(key)?.dictionaryKey?.[lang];
      dictionaries[key] = dictionaryKey ? await getCategoryTranslations({ lang, categoryName: dictionaryKey }).catch(() => undefined) : undefined;
    })
  );
  return products.map((p) => ({ card: toCardModel(p, { lang, translations: dictionaries[p.category] }), category: p.category }));
}

/**
 * Product detail page (approved design «Daisy Jewellery — Product Page Concept»,
 * Desktop 1440 / Mobile 390). Server component: the route passes the product,
 * its sizes and dictionary overrides; family, set and related cards are loaded here.
 * Header and footer come from the [lang] layout.
 *
 * @param {{ item: object, productSizes?: number[], t?: object, lang?: 'uk'|'ru', category: string }} props
 */
export default async function ProductPageNew({ item = {}, productSizes, t, lang = 'uk', category }) {
  const locale = lang === 'ru' ? 'ru' : 'uk';
  const categoryKey = category || item.category || 'ring';
  const copy = getProductCopy(locale);

  const family = await loadFamily(categoryKey, item, locale);
  const model = toProductModel(item, { lang: locale, category: categoryKey, sizes: productSizes || [], t, family });
  const related = await loadRelated({
    category: categoryKey,
    product: item,
    locale,
    stem: model.collection?.stem || null,
    exclude: family.variants.map((p) => p.code),
    limit: 4,
  });
  const facet = getVariantFacet(`${model.title} ${item.title || ''}`, locale);
  const setProducts = pickSet(family.set, facet, locale);
  const setMatchesStone = Boolean(facet.stone) && setProducts.every((p) => getVariantFacet(p.title, locale).stone === facet.stone);
  const [setCards, relatedCards] = await Promise.all([toCards(setProducts, locale), toCards(related, locale)]);
  const setKicker = [copy.setKicker(model.collection?.name), setMatchesStone ? getVariantFacet(item.title, locale).label.split(' · ')[0].toLowerCase() : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label={copy.breadcrumb}>
        <ol>
          <li className={styles.crumbHome}><Link href={`/${locale}`}>{copy.home}</Link></li>
          {model.categoryName ? <li><Link href={model.categoryHref}>{model.categoryName}</Link></li> : null}
          {model.collection ? <li><Link href={model.collection.href}>{model.collection.name}</Link></li> : null}
          <li className={styles.crumbCurrent} aria-current="page">{model.title}</li>
        </ol>
      </nav>

      <div className={styles.product}>
        <ProductGallery images={model.images} title={model.title} lang={locale} />
        <PurchasePanel model={model} lang={locale} />
      </div>

      <section className={styles.gift} aria-labelledby="pdp-gift-title">
        <div className={styles.giftMedia}>
          <Image src={GIFT_IMAGE} alt={copy.giftImageAlt} fill sizes="(min-width: 1024px) 50vw, 100vw" className={styles.giftImage} />
        </div>
        <div className={styles.giftBody}>
          <p className={`${styles.label} ${styles.giftKicker}`}>{copy.giftKicker}</p>
          <h2 id="pdp-gift-title" className={styles.giftTitle}>{copy.giftTitle}</h2>
          <p className={styles.giftLead}>{copy.giftLead}</p>
          <dl className={styles.giftRows}>
            {copy.giftRows.map(([label, text]) => (
              <div key={label} className={styles.giftRow}>
                <dt className={styles.label}>{label}</dt>
                <dd>{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {setCards.length ? (
        <section className={styles.set} aria-labelledby="pdp-set-title">
          <div className={styles.setHead}>
            <p className={`${styles.label} ${styles.setKicker}`}>{setKicker}</p>
            <h2 id="pdp-set-title" className={styles.setTitle}>{copy.setTitle}</h2>
          </div>
          <div className={styles.setRow}>
            {setCards.map(({ card, category: cardCategory }) => (
              <div key={card.id} className={styles.setItem}>
                <ProductCard card={card} lang={locale} showSizes={Boolean(getCategoryConfig(cardCategory)?.showSizes)} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {relatedCards.length ? (
        <section className={styles.related} aria-labelledby="pdp-related-title">
          <div className={styles.relatedHead}>
            <h2 id="pdp-related-title" className={styles.relatedTitle}>{copy.relatedTitle}</h2>
            {model.categoryName ? (
              <Link href={model.categoryHref} className={`${styles.label} ${styles.relatedLink}`}>{copy.allOf(model.categoryName)}</Link>
            ) : null}
          </div>
          <div className={styles.relatedGrid}>
            {relatedCards.map(({ card, category: cardCategory }) => (
              <ProductCard key={card.id} card={card} lang={locale} showSizes={Boolean(getCategoryConfig(cardCategory)?.showSizes)} />
            ))}
          </div>
          {model.categoryName ? (
            <Link href={model.categoryHref} className={`${styles.label} ${styles.relatedButton}`}>{copy.allOf(model.categoryName)}</Link>
          ) : null}
        </section>
      ) : null}

      <ClientViewContent id={item.sku || item.code || item.product_id} name={model.title} price={model.price} />
    </main>
  );
}
