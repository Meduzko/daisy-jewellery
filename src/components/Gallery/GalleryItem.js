import Image from 'next/image';
import Link from "next/link"
import BuyButton from './BuyButton';
import styles from './styles.module.css';

export default async function GalleryItem({ item, baseURL = '/category/ring' }) {
  const {
    product_id,
    code,
    title,
    short_description,
    price,
    imageUrl,
    image_path,
    hoverImageUrl,
    images
  } = item;
  const priceSymbol = 'грн';

  return (
      <article  className={styles.itemWrapper}>
        <Link href={`${baseURL}/${code}`} aria-label={`Переглянути ${title}`}>
          <div className={styles.galleryItem}>
            <div className={styles.itemBackground} />
            <div className={styles.imgContainer}>
              <Image
                src={imageUrl || image_path}
                alt={`Зображення ${title}`}
                fill={true}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
                className={`${styles.defaultImg} ${styles.itemImg}`}
              />
              <Image
                src={hoverImageUrl || images[1]}
                alt={`Зображення ${title} при наведенні`}
                fill={true}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
                className={`${styles.hoverImg} ${styles.itemImg}`}
              />
            </div>
          </div>
        </Link>
        <div className={styles.itemInfo}>
          <header className={styles.titleContainer}>
            <h2 className={styles.title}>
              <Link href={`${baseURL}/${code}`}>{title}</Link>
            </h2>
            <Link href={`${baseURL}/${code}`} className={styles.subTitle} dangerouslySetInnerHTML={{ __html: short_description }} />
            {/* <div className={styles.price}>{`${price} ${priceSymbol}`}</div> */}
          </header >
          <div className={styles.itemBottomCnt}>
            <div className={styles.price}>{`${price} ${priceSymbol}`}</div>
            <BuyButton item={item} />
          </div >
        </div>
      </article >
  );
}