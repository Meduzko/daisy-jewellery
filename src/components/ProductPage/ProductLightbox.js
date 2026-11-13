'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Dialog from '@mui/material/Dialog';
import { CloseIcon } from '../Category/icons';
import { getProductCopy } from './copy';
import { ArrowIcon, ZoomIcon } from './icons';
import styles from './ProductLightbox.module.css';

const ZOOM = 2.2;
const DOUBLE_TAP_MS = 300;

/**
 * Full-screen photo viewer (approved «Zoom · Desktop» / «Zoom · Mobile» boards).
 * Desktop: thumbnails | stage | controls; click toggles ×2.2 zoom that follows the
 * cursor; arrow keys switch photos. Touch: swipe between photos, double tap
 * zooms in (pan by dragging the enlarged photo) and out.
 */
export default function ProductLightbox({ images, title, lang, initialIndex = 0, onClose }) {
  const copy = getProductCopy(lang);
  const count = images.length;
  const [index, setIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const [touchZoom, setTouchZoom] = useState(false); // zoom entered by touch → pan by scrolling
  const trackRef = useRef(null);
  const zoomLayerRef = useRef(null);
  const lastTap = useRef(0);
  const pendingScroll = useRef(null);

  // Keep the swipe track on the current photo (opening, arrows, thumbnails).
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'instant' });
  }, [index]);

  // Touch zoom: centre the enlarged photo on the tapped point.
  useEffect(() => {
    const layer = zoomLayerRef.current;
    const point = pendingScroll.current;
    if (!touchZoom || !layer || !point) return;
    layer.scrollLeft = point.x * layer.scrollWidth - layer.clientWidth / 2;
    layer.scrollTop = point.y * layer.scrollHeight - layer.clientHeight / 2;
    pendingScroll.current = null;
  }, [touchZoom]);

  const go = (next) => {
    setZoomed(false);
    setTouchZoom(false);
    setIndex((next + count) % count);
  };

  const onTrackScroll = () => {
    const el = trackRef.current;
    if (!el || zoomed || !el.clientWidth) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    if (next !== index && next >= 0 && next < count) setIndex(next);
  };

  const setOrigin = (event) => {
    const layer = zoomLayerRef.current;
    if (!layer || touchZoom) return;
    const rect = layer.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    layer.style.setProperty('--zx', `${Math.min(100, Math.max(0, x))}%`);
    layer.style.setProperty('--zy', `${Math.min(100, Math.max(0, y))}%`);
  };

  const onStagePointerUp = (event) => {
    if (event.pointerType === 'mouse') {
      setTouchZoom(false);
      setZoomed((z) => !z);
      return;
    }
    // touch / pen: double tap
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0;
      if (zoomed) {
        setZoomed(false);
        setTouchZoom(false);
      } else {
        const rect = event.currentTarget.getBoundingClientRect();
        pendingScroll.current = {
          x: (event.clientX - rect.left) / rect.width,
          y: (event.clientY - rect.top) / rect.height,
        };
        setZoomed(true);
        setTouchZoom(true);
      }
    } else {
      lastTap.current = now;
    }
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      go(index - 1);
    }
  };

  const toggleZoomButton = () => {
    setTouchZoom(false);
    setZoomed((z) => !z);
  };

  return (
    <Dialog
      open
      fullScreen
      onClose={onClose}
      onKeyDown={onKeyDown}
      aria-label={`${title} — ${copy.photoOf(index + 1, count).toLowerCase()}`}
      PaperProps={{ className: styles.paper }}
      transitionDuration={{ enter: 200, exit: 150 }}
    >
      <div className={styles.viewer}>
        {count > 1 ? (
          <nav className={styles.thumbs} aria-label={copy.thumbnails}>
            {images.map((src, i) => (
              <button
                key={`${src}-thumb-${i}`}
                type="button"
                className={i === index ? `${styles.thumb} ${styles.thumbOn}` : styles.thumb}
                onClick={() => go(i)}
                aria-label={copy.photoOf(i + 1, count)}
                aria-current={i === index ? 'true' : undefined}
              >
                <Image src={src} alt="" fill sizes="72px" className={styles.thumbImage} />
              </button>
            ))}
          </nav>
        ) : (
          <span className={styles.thumbs} aria-hidden="true" />
        )}

        <div className={styles.stage}>
          <div className={styles.track} ref={trackRef} onScroll={onTrackScroll} aria-hidden={zoomed ? 'true' : undefined}>
            {images.map((src, i) => (
              <div key={`${src}-slide-${i}`} className={styles.slide} onPointerUp={i === index ? onStagePointerUp : undefined}>
                <Image
                  src={src}
                  alt={i === index ? title : ''}
                  fill
                  sizes="(min-width: 1024px) 70vw, 100vw"
                  quality={90}
                  priority={i === initialIndex}
                  className={styles.slideImage}
                />
              </div>
            ))}
          </div>

          {zoomed ? (
            <div
              ref={zoomLayerRef}
              className={touchZoom ? `${styles.zoomLayer} ${styles.zoomScroll}` : styles.zoomLayer}
              onMouseMove={setOrigin}
              onMouseEnter={setOrigin}
              onPointerUp={onStagePointerUp}
            >
              <div className={touchZoom ? styles.zoomCanvas : `${styles.zoomCanvas} ${styles.zoomTransform}`} style={{ '--zoom': ZOOM }}>
                <Image src={images[index]} alt={title} fill sizes={`${Math.round(ZOOM * 100)}vw`} quality={90} className={styles.slideImage} />
              </div>
            </div>
          ) : null}

          <div className={styles.topBar}>
            {count > 1 ? <span className={styles.counterPill}>{index + 1} / {count}</span> : <span />}
            <button type="button" className={styles.round} onClick={onClose} aria-label={copy.close}>
              <CloseIcon size={16} strokeWidth={1.4} />
            </button>
          </div>

          <div className={styles.bottomBar}>
            {count > 1 ? (
              <div className={styles.bars} aria-hidden="true">
                {images.map((src, i) => (
                  <span key={`${src}-b-${i}`} className={i === index ? styles.barOn : styles.bar} />
                ))}
              </div>
            ) : null}
            <span className={styles.hintPill}>
              <span className={styles.hintCount}>{index + 1} / {count}</span>
              <span className={styles.hintDivider} aria-hidden="true" />
              <span className={styles.hintDesktop}>{zoomed ? copy.zoomedHintDesktop : copy.zoomHintDesktop}</span>
              <span className={styles.hintMobile}>{zoomed ? copy.zoomedHintMobile : copy.zoomHintMobile}</span>
            </span>
          </div>
        </div>

        <div className={styles.controls}>
          <button type="button" className={styles.round} onClick={onClose} aria-label={copy.close}>
            <CloseIcon size={16} strokeWidth={1.4} />
          </button>
          {count > 1 ? (
            <div className={styles.arrows}>
              <button type="button" className={styles.round} onClick={() => go(index - 1)} aria-label={copy.prev}>
                <ArrowIcon dir="up" />
              </button>
              <button type="button" className={styles.round} onClick={() => go(index + 1)} aria-label={copy.next}>
                <ArrowIcon dir="down" />
              </button>
            </div>
          ) : <span />}
          <button
            type="button"
            className={styles.round}
            onClick={toggleZoomButton}
            aria-label={zoomed ? copy.zoomOut : copy.zoomIn}
            aria-pressed={zoomed}
          >
            <ZoomIcon size={18} minus={zoomed} />
          </button>
        </div>
      </div>
    </Dialog>
  );
}
