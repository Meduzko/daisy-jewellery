'use client';

import { useContext, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import BuyButton from '../Gallery/BuyButton';
import { CartContext } from '../../context/CartContext';
import { getProductSizes } from '../../actions/fetchProduct';
import { formatPrice, getCategoryCopy } from './copy';
import { BagIcon } from './icons';
import styles from './ProductCard.module.css';

const RING_CATEGORY_ID = process.env.NEXT_PUBLIC_RING_CATEGORY_ID || '19752BCE-1FE4-4941-B53C-9A42DF10888B';
const MAX_QUICK_SIZES = 6;

/**
 * Product tile of the category page (approved design): 1:1 grey tile, serif name,
 * sans descriptor, price, one badge. Desktop hover: second photo, quick-add button
 * and (rings) a quick size picker. Touch: the bag button is always visible.
 */
export default function ProductCard({ card, lang, showSizes, priority = false }) {
  const copy = getCategoryCopy(lang);
  const { addToCart, addToItemSize, setCartOpen } = useContext(CartContext);
  const [sizes, setSizes] = useState(null);
  const loadingSizes = useRef(false);
  const badge = card.badges?.[0];

  const loadSizes = async () => {
    if (!showSizes || sizes || loadingSizes.current || !card.sku) return;
    loadingSizes.current = true;
    try {
      const result = await getProductSizes(card.sku, RING_CATEGORY_ID);
      setSizes(Array.isArray(result) ? result : []);
    } catch {
      setSizes([]);
    } finally {
      loadingSizes.current = false;
    }
  };

  const addWithSize = (size) => {
    addToItemSize(card.item, size);
    addToCart(card.item);
    setCartOpen(true);
  };

  const quickSizes = (sizes || []).slice(0, MAX_QUICK_SIZES);

  return (
    <article
      className={styles.card}
      onPointerEnter={showSizes ? loadSizes : undefined}
      onFocusCapture={showSizes ? loadSizes : undefined}
    >
      <div className={styles.media}>
        <Link href={card.href} className={styles.tile} tabIndex={-1} aria-hidden="true">
          {card.image ? (
            <Image
              src={card.image}
              alt=""
              fill
              sizes="(min-width: 768px) 31vw, 50vw"
              className={styles.image}
              priority={priority}
            />
          ) : null}
          {card.image2 ? (
            <Image
              src={card.image2}
              alt=""
              fill
              sizes="(min-width: 1024px) 31vw, 16px"
              className={`${styles.image} ${styles.imageAlt}`}
              loading="lazy"
            />
          ) : null}
          {badge ? <span className={`${styles.badge} ${styles[`badge_${badge.type}`] || ''}`}>{badge.label}</span> : null}
        </Link>

        <BuyButton
          item={card.item}
          showSizes={showSizes}
          lang={lang}
          variant="icon"
          className={styles.quickAdd}
          ariaLabel={copy.quickAdd(card.name)}
        >
          <BagIcon size={18} />
        </BuyButton>

        {showSizes && quickSizes.length > 0 ? (
          <div className={styles.sizes} role="group" aria-label={copy.quickSize(card.name)}>
            <span className={styles.sizesLabel}>{copy.size}</span>
            {quickSizes.map((size) => (
              <button key={size} type="button" className={styles.sizeChip} onClick={() => addWithSize(size)}>
                {size}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <Link href={card.href} className={styles.meta}>
        <h2 className={styles.name}>{card.name}</h2>
        {badge ? <span className={styles.srOnly}>{badge.label}</span> : null}
        <span className={styles.descriptor}>{card.descriptor}</span>
        <span className={styles.price}>
          {card.hasDiscount ? (
            <>
              <s className={styles.oldPrice}>{`${formatPrice(card.originalPrice)} ${copy.currency}`}</s>
              {`${formatPrice(card.price)} ${copy.currency}`}
            </>
          ) : (
            `${formatPrice(card.price)} ${copy.currency}`
          )}
        </span>
      </Link>
    </article>
  );
}
