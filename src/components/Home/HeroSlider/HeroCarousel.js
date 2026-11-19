'use client';

import { Children, useCallback, useEffect, useRef, useState } from 'react';
import styles from './HeroSlider.module.css';

const SWIPE_MIN_PX = 48;

const fill = (template, vars) => template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));

function Chevron({ dir }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d={dir === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayPause({ paused }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      {paused
        ? <path d="M4 2.5v9l7.5-4.5z" fill="currentColor" />
        : <path d="M4.25 2.5v9M9.75 2.5v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
    </svg>
  );
}

/**
 * Crossfade carousel shell for the homepage hero. Slides are server-rendered children;
 * this component only decides which one is visible.
 * - auto-advances every `interval` ms and loops; manual navigation restarts the timer
 * - pauses while the tab is hidden, while keyboard focus is inside, or via the pause button
 * - prefers-reduced-motion: starts paused (the user can still start it) and switches without animation
 * - images of inactive slides are not fetched until the page has loaded and is idle (or the user navigates)
 */
export default function HeroCarousel({ children, names = [], labels, interval = 10000 }) {
  const slides = Children.toArray(children);
  const count = slides.length;

  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(0); // bumped on manual navigation → restarts the timer
  const [warm, setWarm] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);

  const rootRef = useRef(null);
  const swipeRef = useRef(null);
  const suppressClickUntil = useRef(0);

  const running = count > 1 && !userPaused && !focusPaused && !tabHidden;

  const goTo = useCallback((next) => {
    setIndex(((next % count) + count) % count);
    setCycle((c) => c + 1);
    setWarm(true);
  }, [count]);

  const step = useCallback((delta) => {
    setIndex((i) => (((i + delta) % count) + count) % count);
    setCycle((c) => c + 1);
    setWarm(true);
  }, [count]);

  // Autoplay: one timeout per shown slide; re-armed on every slide change or manual navigation.
  useEffect(() => {
    if (!running) return undefined;
    const id = window.setTimeout(() => {
      setWarm(true);
      setIndex((i) => (i + 1) % count);
    }, interval);
    return () => window.clearTimeout(id);
  }, [running, index, cycle, interval, count]);

  // Pause while the browser tab is in the background.
  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Reduced motion: no automatic transitions unless the user presses play.
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setUserPaused(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Let the other slides' images load only once the page (and the LCP image) is done.
  useEffect(() => {
    if (warm) return undefined;
    let idleId;
    let timeoutId;
    const start = () => {
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(() => setWarm(true), { timeout: 3000 });
      } else {
        timeoutId = window.setTimeout(() => setWarm(true), 1500);
      }
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => {
      window.removeEventListener('load', start);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [warm]);

  const onKeyDown = (e) => {
    if (count < 2) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  };

  // Keyboard focus inside the carousel pauses autoplay (mouse clicks don't).
  const onFocus = (e) => {
    if (e.target.matches?.(':focus-visible')) setFocusPaused(true);
  };
  const onBlur = (e) => {
    if (!rootRef.current?.contains(e.relatedTarget)) setFocusPaused(false);
  };

  // Horizontal swipe on touch / pen; vertical scrolling stays native (touch-action: pan-y).
  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' || count < 2) return;
    swipeRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e) => {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start || start.id !== e.pointerId) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.3) {
      suppressClickUntil.current = Date.now() + 400;
      step(dx < 0 ? 1 : -1);
    }
  };
  const onPointerCancel = () => { swipeRef.current = null; };
  const onClickCapture = (e) => {
    if (Date.now() < suppressClickUntil.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <section
      ref={rootRef}
      className={styles.root}
      aria-roledescription="carousel"
      aria-label={labels.carousel}
      data-warm={warm ? 'true' : undefined}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClickCapture={onClickCapture}
    >
      <div className={styles.track} aria-live={running ? 'off' : 'polite'}>
        {slides.map((slide, i) => {
          const active = i === index;
          return (
            <div
              key={slide.key ?? i}
              className={`${styles.slide} ${active ? styles.active : ''}`}
              role="group"
              aria-roledescription="slide"
              aria-label={fill(labels.slideOf, { n: i + 1, total: count })}
              aria-hidden={active ? undefined : true}
              inert={!active}
              data-active={active ? 'true' : 'false'}
            >
              {slide}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <div className={styles.controls}>
          <button type="button" className={styles.arrow} onClick={() => step(-1)} aria-label={labels.prev}>
            <Chevron dir="prev" />
          </button>
          <div className={styles.dots}>
            {slides.map((slide, i) => {
              const active = i === index;
              return (
                <button
                  key={slide.key ?? i}
                  type="button"
                  className={styles.dot}
                  onClick={() => goTo(i)}
                  aria-label={fill(labels.goTo, { n: i + 1, name: names[i] ?? '' })}
                  aria-current={active ? 'true' : undefined}
                >
                  <span className={styles.dotTrack}>
                    {active && (
                      <span
                        key={`${index}-${cycle}`}
                        className={`${styles.dotFill} ${running ? styles.dotFillRunning : ''}`}
                        style={{ '--slide-ms': `${interval}ms` }}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <button type="button" className={styles.arrow} onClick={() => step(1)} aria-label={labels.next}>
            <Chevron dir="next" />
          </button>
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setUserPaused((p) => !p)}
            aria-label={userPaused ? labels.play : labels.pause}
          >
            <PlayPause paused={userPaused} />
          </button>
        </div>
      )}
    </section>
  );
}
