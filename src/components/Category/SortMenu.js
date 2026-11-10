'use client';

import { useId, useState } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { getCategoryCopy } from './copy';
import { ChevronDown } from './icons';
import { SORT_KEYS } from './listingParams';
import styles from './CategoryPage.module.css';

/** Desktop «Сортувати · Рекомендовані ▾» toolbar button with its option list. */
export default function SortMenu({ lang, value, onChange }) {
  const copy = getCategoryCopy(lang);
  const [anchor, setAnchor] = useState(null);
  const id = useId();
  const open = Boolean(anchor);

  return (
    <>
      <button
        type="button"
        id={`${id}-button`}
        className={styles.tool}
        aria-haspopup="listbox"
        aria-controls={open ? `${id}-menu` : undefined}
        aria-expanded={open}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <span className={styles.label}>{copy.sort}</span>
        <span className={styles.toolValue}>{copy.sortOptions[value] || copy.sortOptions.default}</span>
        <ChevronDown up={open} />
      </button>
      <Menu
        id={`${id}-menu`}
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ className: styles.sortPaper, square: true, elevation: 0 }}
        MenuListProps={{ 'aria-labelledby': `${id}-button`, role: 'listbox', className: styles.sortList }}
      >
        {SORT_KEYS.map((key) => (
          <MenuItem
            key={key}
            role="option"
            selected={value === key}
            aria-selected={value === key}
            className={styles.sortItem}
            onClick={() => {
              setAnchor(null);
              if (key !== value) onChange(key);
            }}
          >
            {copy.sortOptions[key]}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
