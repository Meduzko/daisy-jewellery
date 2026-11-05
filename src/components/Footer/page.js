"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { getMenuItems } from '../../helpers/menuItems';
import { getHomeCopy, SOCIAL } from '../Home/copy';
import styles from './styles.module.css';

const YEAR = 2026;

function FooterGroup({ id, title, open, onToggle, children, ariaLabel }) {
  return (
    <div className={`${styles.group} ${styles[`group_${id}`]}`}>
      <p className={styles.groupTitle}>{title}</p>
      <button
        type="button"
        className={styles.groupToggle}
        aria-expanded={open}
        aria-controls={`footer-${id}`}
        onClick={onToggle}
      >
        <span>{title}</span>
        <span className={styles.toggleIcon} aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      <nav
        id={`footer-${id}`}
        aria-label={ariaLabel || title}
        className={`${styles.groupBody} ${open ? styles.groupBodyOpen : ''}`}
      >
        {children}
      </nav>
    </div>
  );
}

function Socials({ className }) {
  return (
    <div className={`${styles.socials} ${className}`}>
      <a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>Instagram</a>
      <a href={SOCIAL.facebook} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>Facebook</a>
    </div>
  );
}

export default function Footer({ lang }) {
  const locale = lang === 'ru' ? 'ru' : 'uk';
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState(null);
  const t = getHomeCopy(locale).footer;
  const pagesWithoutFooter = [
    `/${locale}/order`,
    `/${locale}/returns`,
    `/${locale}/payment-success`,
    `/${locale}/about`,
    `/${locale}/contact`
  ];
  const isFooterHidden = pagesWithoutFooter.includes(pathname);
  const menuItems = getMenuItems(locale);

  if (isFooterHidden) {
    return null;
  }

  const toggle = (id) => () => setOpenGroup((current) => (current === id ? null : id));

  const info = [
    { href: `/${locale}/delivery`, label: t.delivery },
    { href: `/${locale}/returns`, label: t.returns },
    { href: `/${locale}/about`, label: t.about },
    { href: `/${locale}/blog`, label: t.blog },
    { href: `/${locale}/oferta`, label: t.oferta },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <Link href={`/${locale}`} className={styles.logoLink} aria-label="Daisy Jewellery">
              <Image
                src="/logo_wordmark_light.png"
                alt="Daisy Jewellery"
                width={900}
                height={350}
                className={styles.logo}
              />
            </Link>
            <p className={styles.tagline}>{t.tagline}</p>
          </div>

          <div className={styles.groups}>
            <FooterGroup id="categories" title={t.categories} open={openGroup === 'categories'} onToggle={toggle('categories')}>
              <ul className={styles.list}>
                {menuItems.map((item) => (
                  <li key={item.link}>
                    <Link href={item.link} className={styles.link}>{item.title}</Link>
                  </li>
                ))}
              </ul>
            </FooterGroup>

            <FooterGroup id="information" title={t.information} open={openGroup === 'information'} onToggle={toggle('information')}>
              <ul className={styles.list}>
                {info.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={styles.link}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </FooterGroup>

            <FooterGroup id="contacts" title={t.contacts} open={openGroup === 'contacts'} onToggle={toggle('contacts')}>
              <ul className={styles.list}>
                <li><a href={`tel:${SOCIAL.phone}`} className={styles.link}>{SOCIAL.phoneLabel}</a></li>
                <li><a href={`mailto:${SOCIAL.email}`} className={styles.link}>{SOCIAL.email}</a></li>
                <li className={styles.muted}>{t.address}</li>
              </ul>
              <Socials className={styles.socialsDesktop} />
            </FooterGroup>
          </div>
        </div>

        <Socials className={styles.socialsMobile} />

        <div className={styles.bottom}>
          <span>{`© ${YEAR} Daisy.Jewellery`}</span>
          <span className={styles.payments}>{t.payments}</span>
        </div>
      </div>
    </footer>
  );
}
