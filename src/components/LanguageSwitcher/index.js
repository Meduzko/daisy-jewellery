'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import styles from './LanguageSwitcher.module.css';

const slugTranslations = {
  ru: {
    categories: {
      koltsa: 'kabluchki',
      sergi: 'serezhky',
      braslety: 'braslety',
      kolye: 'kolye',
    },
    products: {
      'kupit-serebryanoye-kolye': 'kupyty-sribne-kolye',
      'kupit-serebryanoye-koltso': 'kupyty-sribnu-kabluchku',
      'kupit-serebryanyye-sergi': 'kupyty-serezhky-sribni',
      'kupit-serebryanyy-braslet': 'kupyty-sribnyy-braslet',
    },
  },
  uk: {
    categories: {
      kabluchki: 'koltsa',
      serezhky: 'sergi',
      braslety: 'braslety',
      kolye: 'kolye',
    },
    products: {
      'kupyty-sribne-kolye': 'kupit-serebryanoye-kolye',
      'kupyty-sribnu-kabluchku': 'kupit-serebryanoye-koltso',
      'kupyty-serezhky-sribni': 'kupit-serebryanyye-sergi',
      'kupyty-sribnyy-braslet': 'kupit-serebryanyy-braslet',
    },
  },
};

const locales = [
  { code: 'uk', label: 'Укр' },
  { code: 'ru', label: 'Рус' },
];

const LanguageSwitcher = () => {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState('uk');

  const getCurrentLocale = () => {
    if (typeof window !== 'undefined') {
      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      return locales.find((locale) => locale.code === pathSegments[0])?.code || 'en';
    }
    return 'en'; // Default for server-side rendering
  };
  
  useEffect(() => {
    setCurrentLocale(getCurrentLocale());
  }, []);

  const availableLocales = locales.filter((locale) => locale.code !== currentLocale);
  const currentLocaleLabel = locales.find((locale) => locale.code === currentLocale)?.label || 'Select Language';


  const handleLanguageChange = (newLocale) => {
    // Get the current URL path
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    const segments = currentPath.split('/').filter(Boolean); // Remove empty segments

    if (segments.length > 1) {
      const currentLocale = segments[0]; // First segment is the current locale
      const translatedSegments = segments.map((segment, index) => {
        if (index === 0) {
          // Replace the locale
          return newLocale;
        }
        // Translate categories or products
        const categoryTranslation = slugTranslations[currentLocale]?.categories[segment];
        const productTranslation = slugTranslations[currentLocale]?.products[segment];

        return categoryTranslation || productTranslation || segment; // Keep the segment unchanged if no translation exists
      });

      // Construct the new path
      const newPath = `/${translatedSegments.join('/')}`;

      // Navigate to the new path
      router.push(newPath);
    } else {
      // If the path doesn't contain slugs, just switch the locale
      router.push(`/${newLocale}`);
    }

    setDropdownOpen(false);
  };

  return (
    <div className={styles.dropdown}>
      <button
        className={styles.dropdownToggle}
        onClick={() => setDropdownOpen((prev) => !prev)}
      >
        {currentLocaleLabel}
        <ArrowDropDownIcon />
      </button>
      {dropdownOpen && (
        <ul className={styles.dropdownMenu}>
          {availableLocales.map((locale) => (
            <li key={locale.code} className={styles.dropdownItem}>
              <button
                onClick={() => handleLanguageChange(locale.code)}
                className={`${styles.button} ${
                  router.locale === locale.code ? styles.active : ''
                }`}
              >
                {locale.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher;
