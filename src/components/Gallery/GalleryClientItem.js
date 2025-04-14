'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import BuyButton from './BuyButton';

// import styles from './styles.module.css';
import styles from './styles-client.module.css';

export default function GalleryClientItem({ item, baseURL = '/', t }) {
  const {
    product_id,
    code,
    title,
    short_description,
    price,
    image_path = '/',
    images,
  } = item;

  const priceSymbol = 'грн';
  const tk = t[code];
  const tkTitle = tk?.title || title;
  const tkDescription = tk?.description || short_description;

  const [isHovered, setIsHovered] = useState(false);

  const primaryImage = image_path;
  const hoverImage = images?.[1];

  return (
    <article className={styles.itemWrapper}>
      <Link
        href={`${baseURL}/${code}`}
        aria-label={`Переглянути ${tkTitle}`}
        className={styles.galleryItem}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={styles.itemBackground} />
        <div className={styles.imgContainer}>
          <Image
            src={isHovered && hoverImage ? hoverImage : primaryImage}
            alt={`Зображення ${tkTitle}`}
            width={784}
            height={1176}
            loading="lazy"
            // className={styles.itemImg}
            className={`${styles.defaultImg} ${styles.itemImg}`}
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            quality={70}
            placeholder="empty"
          />
        </div>
      </Link>

      <div className={styles.itemInfo}>
        <header className={styles.titleContainer}>
          <h2 className={styles.title}>
            <Link href={`${baseURL}/${code}`}>{tkTitle}</Link>
          </h2>
          <Link
            href={`${baseURL}/${code}`}
            className={styles.subTitle}
            dangerouslySetInnerHTML={{ __html: tkDescription }}
          />
        </header>

        <div className={styles.itemBottomCnt}>
          <div className={styles.price}>{`${price} ${priceSymbol}`}</div>
          <BuyButton item={item} />
        </div>
      </div>
    </article>
  );
}
