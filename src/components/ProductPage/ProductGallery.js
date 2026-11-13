'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { getProductCopy } from './copy';
import { ArrowIcon, ZoomIcon } from './icons';
import ProductLightbox from './ProductLightbox';
import styles from './ProductGallery.module.css';

/**
 * Product photos: one scroll-snap slider on every screen size — swipe (touch,
 * trackpad), 1 / N counter, progress bars and a zoom button; desktop adds
 * prev / next arrows and keeps the slider in view while the purchase column
 * scrolls. A click on a photo opens the full-screen viewer.
 */
export default function ProductGallery({ images = [], title, lang }) {
  const copy = getProductCopy(lang);
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);
  const [viewer, setViewer] = useState(null); // index shown in the full-screen viewer, or null
  const count = images.length;

  const onScroll = () => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    const slide = el.firstElementChild;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const step = (slide ? slide.getBoundingClientRect().width + gap : el.clientWidth) || el.clientWidth;
    const index = Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / step)));
    if (Number.isFinite(index) && index !== active) setActive(index);
  };

  if (!count) {
    return (
      <section className={styles.gallery} aria-label={copy.photos}>
        <div className={styles.empty}>
          <span>{copy.noPhoto}</span>
        </div>
      </section>
    );
  }

  const goTo = (index) => {
    const el = trackRef.current;
    if (!el) return;
    const next = (index + count) % count;
    const slide = el.children[next];
    if (slide) el.scrollTo({ left: slide.offsetLeft - el.firstElementChild.offsetLeft, behavior: 'smooth' });
  };

  return (
    <section className={styles.gallery} aria-label={copy.photos} aria-roledescription="carousel">
      <div className={styles.frame}>
        <div className={styles.track} ref={trackRef} onScroll={onScroll}>
          {images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              className={styles.shot}
              onClick={() => setViewer(index)}
              aria-label={copy.zoomPhoto(index + 1, count)}
            >
              <Image
                src={src}
                alt={index === 0 ? title : `${title} — ${copy.photoOf(index + 1, count).toLowerCase()}`}
                fill
                sizes="(min-width: 1024px) 56vw, (min-width: 600px) 62vw, 100vw"
                priority={index === 0}
                className={styles.image}
              />
            </button>
          ))}
        </div>

        {count > 1 ? (
          <>
            <button type="button" className={`${styles.arrow} ${styles.arrowPrev}`} onClick={() => goTo(active - 1)} aria-label={copy.prev}>
              <ArrowIcon dir="left" />
            </button>
            <button type="button" className={`${styles.arrow} ${styles.arrowNext}`} onClick={() => goTo(active + 1)} aria-label={copy.next}>
              <ArrowIcon dir="right" />
            </button>
          </>
        ) : null}

        {count > 1 ? (
          <span className={styles.counter} aria-live="polite">
            {active + 1} / {count}
          </span>
        ) : null}
        <button type="button" className={styles.zoomButton} onClick={() => setViewer(active)} aria-label={copy.zoom}>
          <ZoomIcon size={18} />
        </button>
      </div>

      {count > 1 ? (
        <div className={styles.bars} aria-hidden="true">
          {images.map((src, index) => (
            <span key={`${src}-bar-${index}`} className={index === active ? styles.barOn : styles.bar} />
          ))}
        </div>
      ) : null}

      {viewer != null ? (
        <ProductLightbox
          images={images}
          title={title}
          lang={lang}
          initialIndex={viewer}
          onClose={() => setViewer(null)}
        />
      ) : null}
    </section>
  );
}
