"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { CircularProgress, IconButton } from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { getProductLink } from '../../../helpers/getProductLink';

import styles from './styles.module.css';

const COPY = {
  uk: {
    placeholder: 'Шукати прикраси...',
    empty: 'Нічого не знайдено',
    allResults: 'Усі результати',
    ariaOpen: 'Відкрити пошук',
    ariaClose: 'Закрити пошук',
    ariaSubmit: 'Шукати'
  },
  ru: {
    placeholder: 'Искать украшения...',
    empty: 'Ничего не найдено',
    allResults: 'Все результаты',
    ariaOpen: 'Открыть поиск',
    ariaClose: 'Закрыть поиск',
    ariaSubmit: 'Искать'
  }
};

const Search = ({ lang = 'uk' }) => {
  const locale = lang === 'ru' ? 'ru' : 'uk';
  const t = COPY[locale];
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  const close = () => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setSearched(false);
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    const onPointerDown = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        close();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    const title = query.trim();

    if (!open || title.length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, limit: 8 }),
          signal: controller.signal
        });
        const data = await response.json();
        setResults(Array.isArray(data?.products) ? data.products : []);
        setSearched(true);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setResults([]);
          setSearched(true);
        }
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [open, query]);

  const goToSearchPage = () => {
    const title = query.trim();
    if (title.length < 2) return;
    router.push(`/${locale}/search?q=${encodeURIComponent(title)}`);
    close();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    goToSearchPage();
  };

  return (
    <div className={styles.search} ref={panelRef}>
      <IconButton
        className={styles.searchButton}
        aria-label={t.ariaOpen}
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <SearchOutlinedIcon className={styles.searchIcon} />
      </IconButton>

      {open && (
        <>
          <div className={styles.backdrop} />
          <div className={styles.panel} role="dialog" aria-label={t.placeholder}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <SearchOutlinedIcon className={styles.inputIcon} />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.placeholder}
                className={styles.input}
                autoComplete="off"
              />
              {loading && <CircularProgress size={18} className={styles.loader} />}
              <IconButton type="button" aria-label={t.ariaClose} onClick={close} className={styles.closeButton}>
                <CloseRoundedIcon />
              </IconButton>
            </form>

            {query.trim().length >= 2 && (
              <div className={styles.results}>
                {!loading && searched && results.length === 0 && (
                  <p className={styles.empty}>{t.empty}</p>
                )}
                {results.map((product) => {
                  const href = getProductLink(product, locale);
                  return (
                    <Link
                      key={product.product_id || product.code}
                      href={href}
                      className={styles.resultItem}
                      onClick={close}
                    >
                      <span className={styles.resultImage}>
                        {product.image_path ? (
                          <Image
                            src={product.image_path}
                            alt={product.title || ''}
                            width={56}
                            height={72}
                          />
                        ) : null}
                      </span>
                      <span className={styles.resultInfo}>
                        <span className={styles.resultTitle}>{product.title}</span>
                        {product.price != null && (
                          <span className={styles.resultPrice}>{product.price} грн</span>
                        )}
                      </span>
                    </Link>
                  );
                })}
                {results.length > 0 && (
                  <button type="button" className={styles.allResults} onClick={goToSearchPage}>
                    {t.allResults}
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Search;
