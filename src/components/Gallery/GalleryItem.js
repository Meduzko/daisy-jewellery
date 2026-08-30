// import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from "next/link"
import BuyButton from './BuyButton';
import { getProductLink } from '../../helpers/getProductLink';
import styles from './styles.module.css';

// const LazyImage = dynamic(() => import('next/image'), { ssr: false });

export default async function GalleryItem({ item, baseURL = '/', t, showSizes, lang }) {
  const {
    product_id,
    code,
    title,
    short_description,
    price,
    image_path = '/'
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
            <span className={styles.price}>{`${price} ${priceSymbol}`}</span>
            <BuyButton item={item} showSizes={showSizes} lang={lang} />
          </div>
        </div>
      </article>
  );
}