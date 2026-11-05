'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ProductCard from '../ProductCard/ProductCard';
import ui from '../ui.module.css';
import styles from './NewArrivals.module.css';

const FILTERS = ['all', 'ring', 'earring'];
const MAX_ITEMS = 8;

export default function NewArrivalsGrid({ products, labels, currency, heading }) {
  const [filter, setFilter] = useState('all');

  const visible = useMemo(() => {
    const list = filter === 'all' ? products : products.filter((p) => p.category === filter);
    return list.slice(0, MAX_ITEMS);
  }, [filter, products]);

  return (
    <>
      <div className={styles.head}>
        {heading}
        <div className={styles.chips} role="group" aria-label={labels.filterLabel}>
          {FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              className={`${styles.chip} ${filter === key ? styles.chipActive : ''}`}
              aria-pressed={filter === key}
              aria-controls="novynky-grid"
              onClick={() => setFilter(key)}
            >
              {labels.filters[key]}
            </button>
          ))}
        </div>
      </div>

      <div id="novynky-grid" className={styles.grid}>
        {visible.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            currency={currency}
            sizes="(max-width: 767px) 50vw, (max-width: 1199px) 33vw, 25vw"
            className={styles.item}
          />
        ))}
        {!visible.length && <p className={styles.empty}>{labels.empty}</p>}
      </div>

      <div className={styles.more}>
        <Link href="#kategorii" className={`${ui.btn} ${ui.btnOutline} ${styles.moreBtn}`}>
          <span className={ui.onlyWide}>{labels.cta}</span>
          <span className={ui.onlyNarrow}>{labels.ctaShort}</span>
        </Link>
      </div>
    </>
  );
}
