'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import ProductCard from './ProductCard';
import EditorialTile from './EditorialTile';
import SortMenu from './SortMenu';
import FilterDrawer from './FilterDrawer';
import { getCategoryCopy } from './copy';
import { FilterIcon, ChevronDown } from './icons';
import {
  emptyFilters,
  hasActiveFilters,
  isDefaultListing,
  parseListingParams,
  serializeListingParams,
} from './listingParams';
import styles from './CategoryPage.module.css';

const EDITORIAL_AFTER = 4; // editorial tile follows the 4th product (row 2 on desktop)
const QUICK_CHIPS = 3;

async function fetchListing({ category, searchQuery, lang, page, filters, count = false }) {
  const qs = serializeListingParams(filters);
  const scope = searchQuery ? `search=${encodeURIComponent(searchQuery)}` : `category=${category}`;
  const url = `/api/catalog/products?${scope}&lang=${lang}&page=${page}${count ? '&count=1' : ''}${qs ? `&${qs}` : ''}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Listing request failed: ${response.status}`);
  return response.json();
}

/**
 * Interactive part of the category page: collection quick links, sort / filter
 * toolbar, product grid with the editorial tile, «Показати ще» with progress.
 * The server renders the first PAGE_SIZE unfiltered products (SEO, ISR) at the
 * single category URL; sort and filters are kept in its query string, and further
 * products are loaded from GET /api/catalog/products.
 * Search results reuse it with `searchQuery` (no category; `categoryOptions`
 * become the toolbar chips and a «Категорія» filter; the page URL keeps ?q=).
 */
export default function CategoryCatalog({
  lang,
  category,
  name,
  baseURL,
  total: initialTotal,
  hasMore: initialHasMore,
  cards: initialCards,
  facets,
  collectionOptions,
  quickLinks,
  priceChip,
  showSizes,
  sizeGuideHref,
  editorial,
  searchQuery = '',
  categoryOptions = [],
}) {
  const copy = getCategoryCopy(lang);
  const [filters, setFilters] = useState(emptyFilters);
  const [cards, setCards] = useState(initialCards);
  const [total, setTotal] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('idle'); // idle | loading | more | error
  const [drawer, setDrawer] = useState(null); // null | 'filters' | 'sort'
  const requestId = useRef(0);
  const gridRef = useRef(null);

  const isDefault = isDefaultListing(filters);
  const shown = cards.length;

  const syncUrl = useCallback(
    (next) => {
      if (typeof window === 'undefined') return;
      const query = [searchQuery ? `q=${encodeURIComponent(searchQuery)}` : '', serializeListingParams(next)]
        .filter(Boolean)
        .join('&');
      window.history.replaceState(window.history.state, '', query ? `${baseURL}?${query}` : baseURL);
    },
    [baseURL, searchQuery]
  );

  const applyFilters = useCallback(
    async (next, { scroll = false } = {}) => {
      setFilters(next);
      syncUrl(next);
      const id = ++requestId.current;

      if (isDefaultListing(next)) {
        setCards(initialCards);
        setTotal(initialTotal);
        setHasMore(initialHasMore);
        setPage(1);
        setStatus('idle');
        return;
      }

      setStatus('loading');
      try {
        const data = await fetchListing({ category, searchQuery, lang, page: 1, filters: next });
        if (id !== requestId.current) return;
        setCards(data.cards);
        setTotal(data.total);
        setHasMore(data.hasMore);
        setPage(1);
        setStatus('idle');
        if (scroll && gridRef.current) {
          const top = gridRef.current.getBoundingClientRect().top + window.scrollY - 160;
          if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' });
        }
      } catch (error) {
        if (id !== requestId.current) return;
        console.error(error);
        setStatus('error');
      }
    },
    [category, searchQuery, lang, initialCards, initialTotal, initialHasMore, syncUrl]
  );

  // Restore sort / filters from a shared or reloaded URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (searchQuery) params.delete('q'); // ?q= is the search query itself, not a motif filter
    const restored = parseListingParams(params);
    if (!isDefaultListing(restored)) applyFilters(restored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = async () => {
    if (status !== 'idle' || !hasMore) return;
    const id = ++requestId.current;
    setStatus('more');
    try {
      const data = await fetchListing({ category, searchQuery, lang, page: page + 1, filters });
      if (id !== requestId.current) return;
      setCards((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        return prev.concat(data.cards.filter((c) => !seen.has(c.id)));
      });
      setTotal(data.total);
      setHasMore(data.hasMore);
      setPage(page + 1);
      setStatus('idle');
    } catch (error) {
      if (id !== requestId.current) return;
      console.error(error);
      setStatus('error');
    }
  };

  const toggleQuick = (q) => applyFilters({ ...filters, q: filters.q === q ? '' : q }, { scroll: true });
  const togglePrice = () =>
    applyFilters({ ...filters, priceMin: null, priceMax: filters.priceMax === priceChip ? null : priceChip }, { scroll: true });

  const labels = useMemo(() => {
    const map = { q: {}, collection: {}, attributes: {}, category: {} };
    for (const option of categoryOptions) map.category[option.key] = option.label;
    for (const link of quickLinks) map.q[link.q] = link.label;
    for (const option of collectionOptions) map.collection[option.code] = option.label;
    for (const attribute of facets?.attributes || []) {
      for (const value of attribute.values) map.attributes[`${attribute.code}:${value.slug}`] = value.value;
    }
    return map;
  }, [quickLinks, collectionOptions, facets, categoryOptions]);

  const editorialIndex = isDefault && editorial ? EDITORIAL_AFTER : -1;
  const progress = total > 0 ? Math.min(1, shown / total) : 0;
  const quickChips = quickLinks.slice(0, QUICK_CHIPS);

  return (
    <>
      {quickLinks.length > 0 ? (
        <nav className={styles.collections} aria-label={copy.collections(name)}>
          <ul className={styles.collectionsList}>
            {quickLinks.map((link) => (
              <li key={link.q}>
                <a
                  className={styles.collection}
                  href={`${baseURL}?q=${encodeURIComponent(link.q)}`}
                  aria-current={filters.q === link.q ? 'true' : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    toggleQuick(link.q);
                  }}
                >
                  <span className={styles.collectionImage}>
                    {link.image ? (
                      <Image src={link.image} alt="" fill sizes="(min-width: 1024px) 184px, 120px" />
                    ) : null}
                  </span>
                  <span className={styles.collectionLabel}>{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {/* Desktop / tablet toolbar */}
      <div className={styles.toolbar} role="toolbar" aria-label={copy.toolbar}>
        <SortMenu lang={lang} value={filters.sort} onChange={(sort) => applyFilters({ ...filters, sort }, { scroll: true })} />
        <div className={styles.toolbarMiddle}>
          <span className={styles.toolbarCount} aria-live="polite">{copy.items(total)}</span>
          <div className={styles.quickChips}>
            {quickChips.map((link) => (
              <button
                key={link.q}
                type="button"
                className={styles.qchip}
                aria-pressed={filters.q === link.q}
                onClick={() => toggleQuick(link.q)}
              >
                {link.label}
              </button>
            ))}
            {categoryOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                className={styles.qchip}
                aria-pressed={filters.category === option.key}
                onClick={() =>
                  applyFilters({ ...filters, category: filters.category === option.key ? '' : option.key }, { scroll: true })
                }
              >
                {option.label}
              </button>
            ))}
            {priceChip ? (
              <button
                type="button"
                className={styles.qchip}
                aria-pressed={filters.priceMax === priceChip && filters.priceMin == null}
                onClick={togglePrice}
              >
                {copy.upTo(priceChip)}
              </button>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          className={`${styles.tool} ${styles.toolFilters}`}
          aria-haspopup="dialog"
          aria-expanded={drawer === 'filters'}
          onClick={() => setDrawer('filters')}
        >
          <span className={styles.label}>{copy.filters}</span>
          {hasActiveFilters(filters) ? <span className={styles.activeDot} aria-hidden="true" /> : null}
          <FilterIcon />
        </button>
      </div>

      {/* Mobile toolbar */}
      <div className={styles.mobileToolbar} role="toolbar" aria-label={copy.toolbar}>
        <button type="button" aria-haspopup="dialog" aria-expanded={drawer === 'sort'} onClick={() => setDrawer('sort')}>
          <span className={styles.label}>{copy.sort}</span>
          <ChevronDown />
        </button>
        <button type="button" aria-haspopup="dialog" aria-expanded={drawer === 'filters'} onClick={() => setDrawer('filters')}>
          <span className={styles.label}>{copy.filters}</span>
          {hasActiveFilters(filters) ? <span className={styles.activeDot} aria-hidden="true" /> : null}
          <FilterIcon width={16} height={12} />
        </button>
      </div>

      <section
        ref={gridRef}
        className={styles.grid}
        aria-label={name}
        aria-busy={status === 'loading'}
        data-loading={status === 'loading' || undefined}
      >
        {cards.map((card, index) => (
          <FragmentWithEditorial key={card.id} show={index === editorialIndex} editorial={editorial}>
            <ProductCard
              card={card}
              lang={lang}
              showSizes={showSizes === 'auto' ? card.item?.category === 'ring' : showSizes}
              priority={index < 3}
            />
          </FragmentWithEditorial>
        ))}
      </section>

      {cards.length === 0 && status !== 'loading' ? (
        <div className={styles.empty}>
          <p>{copy.empty}</p>
          <button type="button" className={styles.btnOutline} onClick={() => applyFilters({ ...emptyFilters(), sort: filters.sort })}>
            {copy.resetFilters}
          </button>
        </div>
      ) : null}

      {status === 'error' ? (
        <p className={styles.error} role="alert">
          {copy.error}
        </p>
      ) : null}

      {cards.length > 0 ? (
        <div className={styles.more}>
          <p className={styles.seen}>{copy.seen(shown, total)}</p>
          <div className={styles.progress} aria-hidden="true">
            <span style={{ width: `${progress * 100}%` }} />
          </div>
          {hasMore ? (
            <button type="button" className={`${styles.btnOutline} ${styles.loadMore}`} onClick={loadMore} aria-busy={status === 'more'}>
              {status === 'more' ? copy.loading : copy.loadMore}
            </button>
          ) : null}
        </div>
      ) : null}

      <FilterDrawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        lang={lang}
        category={category}
        filters={filters}
        facets={facets}
        quickLinks={quickLinks}
        collectionOptions={collectionOptions}
        categoryOptions={categoryOptions}
        labels={labels}
        sizeGuideHref={sizeGuideHref}
        total={total}
        onApply={(next) => {
          setDrawer(null);
          applyFilters(next, { scroll: true });
        }}
        fetchCount={(draft) => fetchListing({ category, searchQuery, lang, page: 1, filters: draft, count: true }).then((d) => d.total)}
      />
    </>
  );
}

function FragmentWithEditorial({ show, editorial, children }) {
  return (
    <>
      {show ? <EditorialTile {...editorial} /> : null}
      {children}
    </>
  );
}
