'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import Drawer from '@mui/material/Drawer';
import Slider from '@mui/material/Slider';
import { formatPrice, getCategoryCopy } from './copy';
import { ChevronDown, CloseIcon } from './icons';
import { SORT_KEYS, emptyFilters, hasActiveFilters, serializeListingParams } from './listingParams';
import styles from './FilterDrawer.module.css';

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const PRICE_STEP = 50;

function Section({ title, value, defaultOpen = false, collapsible = true, aside, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  if (!collapsible) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>{title}</h3>
          {aside}
        </div>
        {children}
      </div>
    );
  }
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionHeading}>
        <button
          type="button"
          className={styles.sectionHead}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={styles.sectionTitle}>{title}</span>
          <span className={styles.sectionAside}>
            {value ? <span className={styles.sectionValue}>{value}</span> : null}
            <ChevronDown size={12} up={open} />
          </span>
        </button>
      </h3>
      <div id={`${id}-panel`} className={styles.panel} hidden={!open}>
        {children}
      </div>
    </div>
  );
}

/**
 * Filter panel: right drawer on desktop (480px), full-screen sheet with sorting on
 * mobile. Edits a draft; «Показати N прикрас» applies it, the count is live.
 */
export default function FilterDrawer({ open, onClose, ...props }) {
  const titleId = useId();
  // New panel instance (fresh draft from the applied filters) every time it opens;
  // the previous one stays mounted during the closing transition.
  const [session, setSession] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSession((n) => n + 1);
  }
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ className: styles.paper, square: true, elevation: 0, role: 'dialog', 'aria-labelledby': titleId, 'aria-modal': true }}
      BackdropProps={{ className: styles.backdrop }}
    >
      {session > 0 ? <FilterPanel key={session} {...props} onClose={onClose} titleId={titleId} /> : null}
    </Drawer>
  );
}

function FilterPanel({
  onClose,
  titleId,
  lang,
  filters,
  facets,
  quickLinks,
  collectionOptions,
  categoryOptions = [],
  labels,
  sizeGuideHref,
  total,
  onApply,
  fetchCount,
}) {
  const copy = getCategoryCopy(lang);
  const [draft, setDraft] = useState(filters);
  const [fetched, setFetched] = useState({ key: null, count: null });

  // Live result count for the draft (debounced); the applied filters' count is known.
  const draftKey = serializeListingParams({ ...draft, sort: 'default' });
  const appliedKey = serializeListingParams({ ...filters, sort: 'default' });
  useEffect(() => {
    if (draftKey === appliedKey) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      fetchCount(draft)
        .then((n) => !cancelled && setFetched({ key: draftKey, count: n }))
        .catch(() => !cancelled && setFetched({ key: draftKey, count: null }));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, appliedKey]);
  const count = draftKey === appliedKey ? total : fetched.key === draftKey ? fetched.count : undefined;

  const priceFacet = facets?.price;
  const priceRange = useMemo(() => {
    if (priceFacet?.min == null || priceFacet?.max == null || priceFacet.max <= priceFacet.min) return null;
    return {
      min: Math.floor(priceFacet.min / PRICE_STEP) * PRICE_STEP,
      max: Math.ceil(priceFacet.max / PRICE_STEP) * PRICE_STEP,
    };
  }, [priceFacet]);

  const attributes = (facets?.attributes || []).filter(
    (a) => ['insertion', 'coating'].includes(a.code) && a.values.length > 0
  );
  const sizes = facets?.sizes || [];

  const selection = draft.collection
    ? { kind: 'collection', value: draft.collection }
    : draft.q
      ? { kind: 'q', value: draft.q }
      : null;
  const selectionLabel = selection
    ? selection.kind === 'collection'
      ? labels.collection[selection.value]
      : labels.q[selection.value] || capitalize(selection.value)
    : null;

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const toggleIn = (list, value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const priceLabel = (min, max) => {
    if (min != null && max != null) return `${formatPrice(min)} – ${formatPrice(max)} ${copy.currency}`;
    if (max != null) return copy.upTo(max);
    if (min != null) return copy.from(min);
    return null;
  };

  // Removable chips of the draft (drawer header).
  const chips = [];
  if (draft.category) {
    chips.push({ key: 'cat', label: labels.category?.[draft.category] || draft.category, remove: () => set({ category: '' }) });
  }
  if (selection) chips.push({ key: 'sel', label: selectionLabel, remove: () => set({ q: '', collection: '' }) });
  for (const attribute of attributes) {
    for (const slug of draft.attributes[attribute.code] || []) {
      chips.push({
        key: `${attribute.code}:${slug}`,
        label: capitalize(labels.attributes[`${attribute.code}:${slug}`] || slug),
        remove: () => set({ attributes: { ...draft.attributes, [attribute.code]: draft.attributes[attribute.code].filter((s) => s !== slug) } }),
      });
    }
  }
  for (const size of draft.sizes) {
    chips.push({ key: `size:${size}`, label: copy.sizeChip(size), remove: () => set({ sizes: draft.sizes.filter((s) => s !== size) }) });
  }
  const priceChipLabel = priceLabel(draft.priceMin, draft.priceMax);
  if (priceChipLabel) chips.push({ key: 'price', label: priceChipLabel, remove: () => set({ priceMin: null, priceMax: null }) });

  const sliderValue = priceRange
    ? [draft.priceMin ?? priceRange.min, draft.priceMax ?? priceRange.max]
    : [0, 0];

  const showLabel =
    count === undefined ? copy.loading : count == null ? copy.filters : count === 0 ? copy.showNone : copy.show(count);

  return (
    <>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <h2 id={titleId} className={styles.title}>{copy.filters}</h2>
          <button type="button" className={styles.close} aria-label={copy.closeFilters} onClick={onClose}>
            <CloseIcon size={16} />
          </button>
        </div>
        {chips.length > 0 ? (
          <div className={styles.chips}>
            {chips.map((chip) => (
              <button key={chip.key} type="button" className={styles.chip} aria-label={copy.removeFilter(chip.label)} onClick={chip.remove}>
                {chip.label}
                <CloseIcon size={12} strokeWidth={1.8} />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className={styles.body}>
        <fieldset className={styles.sortGroup}>
          <legend className={styles.groupLabel}>{copy.sort}</legend>
          {SORT_KEYS.map((key) => (
            <label key={key} className={styles.radio}>
              <input
                type="radio"
                name="dj-sort"
                value={key}
                checked={draft.sort === key}
                onChange={() => set({ sort: key })}
              />
              <span className={styles.dot} aria-hidden="true" />
              {copy.sortOptions[key]}
            </label>
          ))}
        </fieldset>

        {categoryOptions.length > 0 ? (
          <Section title={copy.category} value={draft.category ? labels.category?.[draft.category] : null} defaultOpen>
            <fieldset className={styles.options}>
              <legend className={styles.srOnly}>{copy.category}</legend>
              <label className={styles.option}>
                <input type="radio" name="dj-category" checked={!draft.category} onChange={() => set({ category: '' })} />
                <span className={styles.radioBox} aria-hidden="true" />
                {copy.allCategories}
              </label>
              {categoryOptions.map((option) => (
                <label key={option.key} className={styles.option}>
                  <input
                    type="radio"
                    name="dj-category"
                    checked={draft.category === option.key}
                    onChange={() => set({ category: option.key })}
                  />
                  <span className={styles.radioBox} aria-hidden="true" />
                  {option.label}
                  <span className={styles.count}>{option.count}</span>
                </label>
              ))}
            </fieldset>
          </Section>
        ) : null}

        {collectionOptions.length + quickLinks.length > 0 ? (
          <Section title={copy.collection} value={selectionLabel}>
            <fieldset className={styles.options}>
              <legend className={styles.srOnly}>{copy.collection}</legend>
              {collectionOptions.map((option) => (
                <label key={`c:${option.code}`} className={styles.option}>
                  <input
                    type="radio"
                    name="dj-collection"
                    checked={selection?.kind === 'collection' && selection.value === option.code}
                    onChange={() => set({ collection: option.code, q: '' })}
                  />
                  <span className={styles.radioBox} aria-hidden="true" />
                  {option.label}
                  <span className={styles.count}>{option.count}</span>
                </label>
              ))}
              {quickLinks.map((link) => (
                <label key={`q:${link.q}`} className={styles.option}>
                  <input
                    type="radio"
                    name="dj-collection"
                    checked={selection?.kind === 'q' && selection.value === link.q}
                    onChange={() => set({ q: link.q, collection: '' })}
                  />
                  <span className={styles.radioBox} aria-hidden="true" />
                  {link.label}
                  <span className={styles.count}>{link.count}</span>
                </label>
              ))}
            </fieldset>
          </Section>
        ) : null}

        {attributes.map((attribute, index) => {
          const selected = draft.attributes[attribute.code] || [];
          const value = selected.length
            ? selected.map((slug) => capitalize(labels.attributes[`${attribute.code}:${slug}`] || slug)).join(', ')
            : null;
          return (
            <Section key={attribute.code} title={attribute.name} value={value} defaultOpen={index === 0}>
              <fieldset className={styles.options}>
                <legend className={styles.srOnly}>{attribute.name}</legend>
                {attribute.values.map((option) => (
                  <label key={option.slug} className={styles.option}>
                    <input
                      type="checkbox"
                      checked={selected.includes(option.slug)}
                      onChange={() =>
                        set({ attributes: { ...draft.attributes, [attribute.code]: toggleIn(selected, option.slug) } })
                      }
                    />
                    <span className={styles.box} aria-hidden="true">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M2 6.2l2.6 2.6L10 3.4" />
                      </svg>
                    </span>
                    {capitalize(option.value)}
                    <span className={styles.count}>{option.count}</span>
                  </label>
                ))}
              </fieldset>
            </Section>
          );
        })}

        {sizes.length > 0 ? (
          <Section
            title={copy.size}
            collapsible={false}
            aside={
              sizeGuideHref ? (
                <a href={sizeGuideHref} className={styles.guide}>
                  {copy.howToMeasure}
                </a>
              ) : null
            }
          >
            <div className={styles.sizes} role="group" aria-label={copy.size}>
              {sizes.map((size) => {
                const on = draft.sizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    className={styles.size}
                    aria-pressed={on}
                    onClick={() => set({ sizes: toggleIn(draft.sizes, size) })}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </Section>
        ) : null}

        {priceRange ? (
          <div className={`${styles.section} ${styles.priceSection}`}>
            <div className={styles.sectionHead}>
              <h3 className={styles.sectionTitle}>{copy.price}</h3>
              <span className={`${styles.sectionValue} ${styles.priceInline}`}>
                {`${formatPrice(sliderValue[0])} – ${formatPrice(sliderValue[1])} ${copy.currency}`}
              </span>
            </div>
            <div className={styles.pricePills} aria-hidden="true">
              <span>{`${formatPrice(sliderValue[0])} ${copy.currency}`}</span>
              <span>{`${formatPrice(sliderValue[1])} ${copy.currency}`}</span>
            </div>
            <Slider
              className={styles.slider}
              value={sliderValue}
              min={priceRange.min}
              max={priceRange.max}
              step={PRICE_STEP}
              disableSwap
              onChange={(_, value) => {
                const [lo, hi] = value;
                set({
                  priceMin: lo <= priceRange.min ? null : lo,
                  priceMax: hi >= priceRange.max ? null : hi,
                });
              }}
              getAriaLabel={(index) => (index === 0 ? copy.priceMin : copy.priceMax)}
              getAriaValueText={(value) => `${formatPrice(value)} ${copy.currency}`}
              classes={{ rail: styles.sliderRail, track: styles.sliderTrack, thumb: styles.sliderThumb }}
            />
          </div>
        ) : null}
      </div>

      <div className={styles.foot}>
        <button
          type="button"
          className={styles.secondary}
          disabled={!hasActiveFilters(draft) && draft.sort === 'default'}
          onClick={() => setDraft({ ...emptyFilters() })}
        >
          <span className={styles.clearLong}>{copy.clearAll}</span>
          <span className={styles.clearShort}>{copy.clear}</span>
        </button>
        <button type="button" className={styles.primary} disabled={count === 0 || count === undefined} onClick={() => onApply(draft)}>
          {showLabel}
        </button>
      </div>
    </>
  );
}
