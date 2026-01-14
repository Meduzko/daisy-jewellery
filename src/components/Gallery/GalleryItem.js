// import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from "next/link"
import BuyButton from './BuyButton';
import styles from './styles.module.css';

// const LazyImage = dynamic(() => import('next/image'), { ssr: false });

export default async function GalleryItem({ item, baseURL = '/', t, showSizes, lang }) {
  const {
    product_id,
    code,
    title,
    short_description,
    price,
    image_path = '/',
    images
  } = item;
  const priceSymbol = 'грн';
  const tk = t[code];
  const tkTitle = tk?.title || title;
  const tkDescription = tk?.description || short_description || '';
  const hasDescription = tkDescription && tkDescription.trim().length > 0;

  return (
      <article className={styles.itemWrapper}>
        <Link href={`${baseURL}/${code}`} aria-label={`Переглянути ${tkTitle}`}>
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
              {images?.[1] && (
                <Image
                  src={images[1]}
                  alt={`Зображення ${tkTitle} при наведенні`}
                  width={600}
                  height={800}
                  className={`${styles.hoverImg} ${styles.itemImg}`}
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                />
              )}
            </div>
          </div>
        </Link>
        <div className={styles.itemInfo}>
          <header className={styles.titleContainer}>
            <h2 className={styles.title}>
              <Link href={`${baseURL}/${code}`}>{tkTitle}</Link>
            </h2>
            {hasDescription && (
              <p className={styles.subTitle} dangerouslySetInnerHTML={{ __html: tkDescription }} />
            )}
          </header>
          <div className={styles.itemBottomCnt}>
            <span className={styles.price}>{`${price} ${priceSymbol}`}</span>
            <BuyButton item={item} showSizes={showSizes} lang={lang} />
          </div>
        </div>
      </article>
  );
}