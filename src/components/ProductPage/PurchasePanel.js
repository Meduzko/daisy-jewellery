'use client';

import { useContext, useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CartContext } from '../../context/CartContext';
import { trackFacebookEvent } from '../../helpers/fbpixel';
import { formatPrice } from '../Category/copy';
import { getProductCopy, PHONE } from './copy';
import { formatSize } from './sizeFormat';
import { ExchangeIcon, GiftIcon, TruckIcon } from './icons';
import useMediaQuery from './useMediaQuery';
import styles from './ProductPage.module.css';

const price = (value, copy) => `${formatPrice(value)} ${copy.currency}`;

/**
 * Purchase column of the product page (approved design): collection → title →
 * material → price → variant swatches → sizes → add to cart → service → accordions.
 * On phones a sticky bar with price and the button appears once the main button
 * has scrolled out of view.
 */
export default function PurchasePanel({ model, lang }) {
  const copy = getProductCopy(lang);
  const { cartItems, addToCart, addToItemSize, getItemSize, setCartOpen } = useContext(CartContext);
  const item = model.cartItem;
  const hasSizes = model.sizes.length > 0;

  const [pickedSize, setPickedSize] = useState(null);
  const [sizeError, setSizeError] = useState(false);
  const [open, setOpen] = useState({ desc: true, specs: null, delivery: false, returns: false });
  const [showBar, setShowBar] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)', true);

  const ctaRef = useRef(null);
  const sizesRef = useRef(null);
  const ids = useId();

  // A size chosen earlier (kept with the cart) is shown as selected.
  const storedSize = Number(getItemSize(item));
  const size = pickedSize ?? (hasSizes && model.sizes.includes(storedSize) ? storedSize : null);
  const inCart = cartItems.some((c) => c.product_id === item.product_id);

  // Sticky bar (phones): shown once the main button has scrolled above the viewport.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = ctaRef.current;
      if (el) setShowBar(el.getBoundingClientRect().bottom < 0);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const pickSize = (value) => {
    setPickedSize(value);
    setSizeError(false);
    // keep the cart line in sync when the product is already in the cart
    if (inCart) addToItemSize(item, value);
  };

  const focusSizes = () => {
    sizesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    sizesRef.current?.querySelector('button')?.focus({ preventScroll: true });
  };

  const handleAdd = () => {
    if (!model.available) return;
    if (hasSizes && size == null) {
      setSizeError(true);
      focusSizes();
      return;
    }
    if (hasSizes) addToItemSize(item, size);
    if (!inCart) {
      addToCart(item, 1);
      try {
        trackFacebookEvent('AddToCart', {
          content_ids: [item.sku || item.code || item.product_id].filter(Boolean),
          content_type: 'product',
          content_name: item.title,
          value: Number(model.price) || 0,
          currency: 'UAH',
        });
      } catch {}
    }
    setCartOpen(true);
  };

  const ctaLabel = !model.priceKnown
    ? copy.priceOnRequest
    : model.soldOut
      ? copy.outOfStock
      : hasSizes && size == null
        ? copy.chooseSize
        : `${copy.addToCart} · ${price(model.price, copy)}`;

  const toggle = (key, current) => setOpen((o) => ({ ...o, [key]: !current }));
  const specsOpen = open.specs ?? isDesktop;
  const variantLabel = model.swatchKind === 'insert' ? copy.insert : copy.variant;

  const accordion = (key, label, isOpen, body) => (
    <div className={styles.acc}>
      <h2 className={styles.accHeading}>
        <button
          type="button"
          className={styles.accButton}
          aria-expanded={isOpen}
          aria-controls={`${ids}-${key}`}
          onClick={() => toggle(key, isOpen)}
        >
          <span className={styles.label}>{label}</span>
          <span className={styles.accSign} aria-hidden="true">{isOpen ? '−' : '+'}</span>
        </button>
      </h2>
      <div id={`${ids}-${key}`} className={styles.accBody} hidden={!isOpen}>
        {body}
      </div>
    </div>
  );

  return (
    <section className={styles.panel} aria-labelledby={`${ids}-title`}>
      {model.collection ? (
        <Link href={model.collection.href} className={`${styles.label} ${styles.kicker}`}>
          {copy.collection} {model.collection.name}
        </Link>
      ) : model.categoryName ? (
        <Link href={model.categoryHref} className={`${styles.label} ${styles.kicker}`}>
          {model.categoryName}
        </Link>
      ) : null}

      <h1 id={`${ids}-title`} className={styles.title}>{model.title}</h1>
      <p className={styles.descriptor}>{model.descriptor}</p>

      <div className={styles.priceRow}>
        <p className={styles.price}>
          {!model.priceKnown ? (
            copy.priceOnRequest
          ) : model.hasDiscount ? (
            <>
              <s className={styles.oldPrice}>{price(model.originalPrice, copy)}</s>
              <span>{price(model.price, copy)}</span>
            </>
          ) : (
            price(model.price, copy)
          )}
        </p>
        <p className={styles.code}>{copy.code} {model.code}</p>
      </div>

      {model.swatches.length > 1 ? (
        <div className={styles.variants}>
          <p className={styles.optionLine}>
            <span className={`${styles.label} ${styles.optionLabel}`}>{variantLabel}</span>
            {model.currentLabel}
          </p>
          <ul className={styles.swatches} aria-label={copy.variants}>
            {model.swatches.map((s) => (
              <li key={s.code}>
                <Link
                  href={s.href}
                  className={s.current ? `${styles.swatch} ${styles.swatchOn}` : styles.swatch}
                  aria-current={s.current ? 'page' : undefined}
                  aria-label={s.price && !s.current ? `${s.label}, ${price(s.price, copy)}` : s.label}
                  title={s.label}
                  scroll={false}
                >
                  <span
                    className={`${styles.dot} ${s.gilded ? styles.dotGilded : ''}`}
                    style={s.swatch ? { background: s.swatch } : undefined}
                    aria-hidden="true"
                  >
                    {!s.swatch && s.image ? <Image src={s.image} alt="" fill sizes="30px" className={styles.dotImage} /> : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasSizes ? (
        <div className={model.swatches.length > 1 ? styles.sizeBlock : `${styles.sizeBlock} ${styles.sizeBlockFirst}`}>
          <div className={styles.sizeHead}>
            <p className={styles.optionLine} id={`${ids}-size-label`}>
              <span className={`${styles.label} ${styles.optionLabel}`}>{copy.size}</span>
              {size != null ? `${formatSize(size)} ${copy.sizeUnit}` : copy.chooseSize}
            </p>
            {model.sizeGuideHref ? (
              <Link href={model.sizeGuideHref} className={styles.underline}>{copy.sizeGuide}</Link>
            ) : null}
          </div>
          <div
            ref={sizesRef}
            className={styles.sizes}
            role="radiogroup"
            aria-labelledby={`${ids}-size-label`}
            aria-describedby={sizeError ? `${ids}-size-error` : undefined}
          >
            {model.sizes.map((s) => {
              const checked = s === size;
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  tabIndex={checked || (size == null && s === model.sizes[0]) ? 0 : -1}
                  className={checked ? `${styles.size} ${styles.sizeOn}` : styles.size}
                  onClick={() => pickSize(s)}
                  onKeyDown={(event) => {
                    const i = model.sizes.indexOf(s);
                    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
                    if (!step) return;
                    event.preventDefault();
                    const next = model.sizes[(i + step + model.sizes.length) % model.sizes.length];
                    pickSize(next);
                    event.currentTarget.parentElement?.children[model.sizes.indexOf(next)]?.focus();
                  }}
                >
                  {formatSize(s)}
                </button>
              );
            })}
          </div>
          {sizeError ? (
            <p id={`${ids}-size-error`} className={styles.sizeError} role="alert">{copy.chooseSizeHint}</p>
          ) : null}
        </div>
      ) : null}

      <button
        ref={ctaRef}
        type="button"
        className={styles.cta}
        onClick={handleAdd}
        disabled={!model.available}
        aria-describedby={!model.available ? `${ids}-unavailable` : undefined}
      >
        {ctaLabel}
      </button>
      {model.available ? (
        <p className={styles.payLine}>
          {copy.payLine}
        </p>
      ) : (
        <p id={`${ids}-unavailable`} className={styles.payLine}>
          {copy.outOfStockNote} <a href={PHONE.href} className={styles.underline}>{PHONE.label}</a>
        </p>
      )}

      <ul className={styles.service}>
        <li><GiftIcon />{copy.service[0]}</li>
        <li><TruckIcon />{copy.service[1]}</li>
        <li><ExchangeIcon />{copy.service[2]}</li>
      </ul>

      <div className={styles.accordions}>
        {model.description.length
          ? accordion('desc', copy.description, open.desc, (
            <div className={styles.descText}>
              {model.description.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          ))
          : null}
        {accordion('specs', copy.specs, specsOpen, (
          <dl className={styles.specs}>
            {model.specs.map((row) => (
              <div key={row.label} className={styles.spec}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        ))}
        {accordion('delivery', copy.delivery, open.delivery, (
          <div className={styles.descText}>
            {copy.deliveryText.map((p) => <p key={p}>{p}</p>)}
            <p><Link href={copy.deliveryHref(lang)} className={styles.underline}>{copy.more}</Link></p>
          </div>
        ))}
        {accordion('returns', copy.returns, open.returns, (
          <div className={styles.descText}>
            {copy.returnsText.map((p) => <p key={p}>{p}</p>)}
            <p><Link href={copy.returnsHref(lang)} className={styles.underline}>{copy.more}</Link></p>
          </div>
        ))}
      </div>

      {model.available ? (
        <div className={showBar ? `${styles.stickyBar} ${styles.stickyBarOn}` : styles.stickyBar} aria-hidden={!showBar} inert={!showBar}>
          <div className={styles.stickyRow}>
            <span className={styles.stickyThumb}>
              {model.images[0] ? <Image src={model.images[0]} alt="" fill sizes="48px" className={styles.stickyThumbImage} /> : null}
            </span>
            <span className={styles.stickyText}>
              <span className={styles.stickyName}>{model.title}</span>
              <span className={styles.stickyMeta}>
                {[model.swatches.length > 1 ? model.currentLabel : null, hasSizes ? (size != null ? `${copy.size.toLowerCase()} ${formatSize(size)}` : copy.chooseSize) : null]
                  .filter(Boolean)
                  .join(' · ')}
                {hasSizes ? (
                  <>
                    {' · '}
                    <button type="button" className={styles.stickyChange} onClick={focusSizes}>{copy.change}</button>
                  </>
                ) : null}
              </span>
            </span>
            <span className={styles.stickyPrice}>{price(model.price, copy)}</span>
          </div>
          <button type="button" className={styles.stickyCta} onClick={handleAdd}>
            {hasSizes && size == null ? copy.chooseSize : copy.addToCart}
          </button>
        </div>
      ) : null}
    </section>
  );
}
