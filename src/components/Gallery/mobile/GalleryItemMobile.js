import Image from 'next/image';
import Link from "next/link"
import BuyButton from '../BuyButton';

import styles from './styles.module.css';

export default async function GalleryItemMobile({ item, baseURL = '/', t, showSizes }) {
  const {
    code,
    title,
    short_description,
    imageUrl,
    image_path,
    price,
    lang
  } = item;
  const priceSymbol = 'грн';
  const tk = t[code];
  const tkTitle = tk?.title || title;
  const tkDescription = tk?.description || short_description || '';
  const hasDescription = tkDescription && tkDescription.trim().length > 0;

  return (
      <div className={styles.itemWrapper}>
        <Link href={`${baseURL}/${code}`}>
          <div className={styles.galleryItem}>
            <div className={styles.itemBackground} />
            <div className={styles.imgContainer}>
              <Image
                src={imageUrl || image_path}
                alt={tkTitle}
                fill={true}
                className={`${styles.defaultImg} ${styles.itemImg}`}
              />
            </div>
          </div>
        </Link>
        <div className={styles.itemInfo}>
            <div className={styles.titleContainer}>
              <Link href={`${baseURL}/${code}`} className={styles.title}>{tkTitle}</Link>
              {hasDescription && (
                <span className={styles.subTitle} dangerouslySetInnerHTML={{ __html: tkDescription }} />
              )}
            </div>
            <div className={styles.itemBottomCnt}>
              <div className={styles.price}>{`${price} ${priceSymbol}`}</div>
              <BuyButton item={item} showSizes={showSizes} lang={lang} />
            </div>
          </div>
      </div>
  );
}