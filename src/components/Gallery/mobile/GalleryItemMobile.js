import Image from 'next/image';
import Link from "next/link"
import BuyButton from '../BuyButton';

import styles from './styles.module.css';

export default async function GalleryItemMobile({ item, baseURL = '/', t }) {
  const {
    code,
    title,
    short_description,
    imageUrl,
    image_path,
    price
  } = item;
  const priceSymbol = 'грн';
  const tk = t[code];
  const tkTitle = tk?.title || title;
  const tkDescription = tk?.description || short_description;

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
                loading="lazy"
                className={`${styles.defaultImg} ${styles.itemImg}`}
              />
            </div>
          </div>
        </Link>
        <div className={styles.itemInfo}>
            <div className={styles.titleContainer}>
              <Link href={`${baseURL}/${code}`} className={styles.title}>{tkTitle}</Link>
              <Link href={`${baseURL}/${code}`} className={styles.subTitle} dangerouslySetInnerHTML={{ __html: tkDescription }} />
            </div>
            <div className={styles.itemBottomCnt}>
              <div className={styles.price}>{`${price} ${priceSymbol}`}</div>
              <BuyButton item={item} />
            </div>
          </div>
      </div>
  );
}