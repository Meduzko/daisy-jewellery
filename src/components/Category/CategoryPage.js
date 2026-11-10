import Image from 'next/image';
import Link from 'next/link';
import CategoryCatalog from './CategoryCatalog';
import SeoBlock from './SeoBlock';
import { getCategoryCopy } from './copy';
import styles from './CategoryPage.module.css';

const NUMERALS = ['i.', 'ii.', 'iii.', 'iv.', 'v.'];

/**
 * Shared layout of the four category pages (approved design, Desktop 1440 / Mobile 390):
 * breadcrumb → title → collection links → toolbar → grid (+ editorial) → load more →
 * service band → SEO copy. Header and footer come from the [lang] layout.
 */
export default function CategoryPage({
  lang,
  category,
  name,
  h1,
  intro,
  baseURL,
  total,
  hasMore,
  cards,
  facets,
  quickLinks,
  collectionOptions,
  priceChip,
  showSizes,
  sizeGuideHref,
  editorial,
  service,
  seoBlock,
}) {
  const copy = getCategoryCopy(lang);

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label={copy.breadcrumb}>
        <ol>
          <li>
            <Link href={`/${lang}`}>{copy.home}</Link>
          </li>
          <li aria-current="page">{name}</li>
        </ol>
      </nav>

      <header className={styles.intro}>
        <h1 className={styles.title}>{h1}</h1>
        <p className={styles.meta}>
          {copy.silver} · {copy.items(total)}
        </p>
        <p className={styles.lead}>{intro}</p>
      </header>

      <CategoryCatalog
        lang={lang}
        category={category}
        name={name}
        baseURL={baseURL}
        total={total}
        hasMore={hasMore}
        cards={cards}
        facets={facets}
        quickLinks={quickLinks}
        collectionOptions={collectionOptions}
        priceChip={priceChip}
        showSizes={showSizes}
        sizeGuideHref={sizeGuideHref}
        editorial={editorial}
      />

      <section className={styles.service} aria-labelledby="category-service-title">
        <div className={styles.serviceMedia}>
          <Image src={service.image} alt={service.imageAlt} fill sizes="(min-width: 1024px) 50vw, 16px" className={styles.serviceImage} />
        </div>
        <div className={styles.serviceBody}>
          <p className={styles.kicker}>{service.kicker}</p>
          <h2 id="category-service-title" className={styles.serviceTitle}>{service.title}</h2>
          <ol className={styles.steps}>
            {service.steps.map((step, index) => (
              <li key={step}>
                <span className={styles.numeral} aria-hidden="true">{NUMERALS[index]}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <Link href={service.href} className={styles.serviceCta}>
            {service.cta}
          </Link>
        </div>
      </section>

      <SeoBlock lang={lang} title={seoBlock.title} lead={seoBlock.lead} more={seoBlock.more} />
    </main>
  );
}
