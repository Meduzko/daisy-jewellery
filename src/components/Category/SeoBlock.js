'use client';

import { useId, useState } from 'react';
import { getCategoryCopy } from './copy';
import styles from './CategoryPage.module.css';

/** SEO copy at the end of the page; the extra text stays in the HTML when collapsed. */
export default function SeoBlock({ lang, title, lead, more }) {
  const copy = getCategoryCopy(lang);
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <section className={styles.seo} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={styles.seoTitle}>{title}</h2>
      <div className={styles.seoText}>
        <p>{lead}</p>
        {more ? (
          <>
            <p id={`${id}-more`} className={styles.seoMore} data-open={open || undefined}>
              {more}
            </p>
            <button
              type="button"
              className={styles.textButton}
              aria-expanded={open}
              aria-controls={`${id}-more`}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? copy.readLess : copy.readMore}
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}
