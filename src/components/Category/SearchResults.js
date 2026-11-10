import Link from 'next/link';
import CategoryCatalog from './CategoryCatalog';
import { CATEGORIES, getCategoryUrls } from './config';
import { getCategoryCopy } from './copy';
import styles from './CategoryPage.module.css';

/**
 * Search results page (/{lang}/search?q=…) in the category page design: same title
 * block, toolbar, product cards and «Показати ще»; category chips / «Категорія»
 * filter instead of collections and attribute filters. No editorial, service or SEO
 * blocks (search pages are not landing pages).
 */
export default function SearchResults({ lang, query, total, hasMore, cards, categoryOptions }) {
  const copy = getCategoryCopy(lang);
  const baseURL = `/${lang}/search`;
  const searchable = query.length >= 2;

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label={copy.breadcrumb}>
        <ol>
          <li>
            <Link href={`/${lang}`}>{copy.home}</Link>
          </li>
          <li aria-current="page">{copy.search}</li>
        </ol>
      </nav>

      <header className={styles.intro}>
        {searchable ? <p className={styles.searchKicker}>{copy.searchResults}</p> : null}
        <h1 className={styles.title}>{searchable ? `«${query}»` : copy.search}</h1>
        {searchable && total > 0 ? (
          <p className={styles.meta}>
            {copy.silver} · {copy.items(total)}
          </p>
        ) : null}
      </header>

      {searchable && cards.length > 0 ? (
        <CategoryCatalog
          lang={lang}
          category={null}
          name={copy.searchResults}
          baseURL={baseURL}
          total={total}
          hasMore={hasMore}
          cards={cards}
          facets={null}
          quickLinks={[]}
          collectionOptions={[]}
          priceChip={null}
          showSizes="auto"
          sizeGuideHref={null}
          editorial={null}
          searchQuery={query}
          categoryOptions={categoryOptions}
        />
      ) : (
        <div className={styles.searchEmpty}>
          <p>{searchable ? copy.searchEmpty : copy.searchShort}</p>
          {searchable ? (
            <ul>
              {Object.values(CATEGORIES).map((config) => (
                <li key={config.key}>
                  <Link className={styles.btnOutline} href={getCategoryUrls(config, lang).baseURL}>
                    {config.name[lang]}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </main>
  );
}
