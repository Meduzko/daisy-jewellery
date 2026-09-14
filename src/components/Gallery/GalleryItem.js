// import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from "next/link"
import BuyButton from './BuyButton';
import { getProductLink } from '../../helpers/getProductLink';
import {
  BADGE_CLASS,
  applyProductDiscount,
  getBadgeLabel,
  getDisplayPrices,
} from '../../helpers/productPricing';
import styles from './styles.module.css';

// const LazyImage = dynamic(() => import('next/image'), { ssr: false });

export default async function GalleryItem({ item, baseURL = '/', t, showSizes, lang }) {
  const {
    code,
    title,
    short_description,
    image_path = '/',
  } = item;
  const priceSymbol = 'грн';
  const href = item.category && lang
    ? getProductLink(item, lang)
    : `${baseURL}/${code}`;
  const tk = t?.[code];
  const tkTitle = tk?.title || title;
  const rawDescription = tk?.description || short_description || '';
  // Strip outer <p> tags to avoid nested paragraphs and normalize content
  const tkDescription = rawDescription.replace(/^<p>|<\/p>$/gi, '').trim();
  const hasDescription = tkDescription.length > 0;
  const discountedItem = applyProductDiscount(item);
  const { price, originalPrice, hasDiscount, badges } = getDisplayPrices(discountedItem);

  return (
      <article className={styles.itemWrapper}>
        <Link href={href} aria-label={`Переглянути ${tkTitle}`}>
          <div className={styles.galleryItem}>
            <div className={styles.itemBackground} />
            <div className={styles.imgContainer}>
              {image_path && (
                <Image
                  src={image_path}
                  alt={`Зображення ${tkTitle}`}
                  width={600}
                  height={800}
                  className={`${styles.defaultImg} ${styles.itemImg}`}
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                />
              )}
              {badges.length > 0 && (
                <ul className={styles.badges}>
                  {badges.map((badge) => (
                    <li
                      key={badge.id}
                      className={`${styles.badge} ${styles[BADGE_CLASS[badge.type]]}`}
                      style={badge.color ? { background: badge.color } : undefined}
                    >
                      {getBadgeLabel(badge, lang)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Link>
        <div className={styles.itemInfo}>
          <header className={styles.titleContainer}>
            <h2 className={styles.title}>
              <Link href={href}>{tkTitle}</Link>
            </h2>
            <p
              className={styles.subTitle}
              dangerouslySetInnerHTML={{ __html: hasDescription ? tkDescription : '&nbsp;' }}
            />
          </header>
          <div className={styles.itemBottomCnt}>
            <div className={styles.priceCnt}>
              {hasDiscount ? (
                <>
                  <span className={styles.oldPrice}>{`${originalPrice} ${priceSymbol}`}</span>
                  <span className={`${styles.price} ${styles.salePrice}`}>{`${price} ${priceSymbol}`}</span>
                </>
              ) : (
                <span className={styles.price}>{`${price} ${priceSymbol}`}</span>
              )}
            </div>
            <BuyButton item={discountedItem} showSizes={showSizes} lang={lang} />
          </div>
        </div>
      </article>
  );
}
