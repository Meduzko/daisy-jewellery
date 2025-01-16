import Image from 'next/image';
import Link from "next/link"
import BuyButton from './BuyButton';
import styles from './styles.module.css';

export default async function GalleryItem({ item, baseURL = '/', t, lang }) {
  const {
    product_id,
    code,
    title,
    short_description,
    price,
    image_path,
    images
  } = item;
  const priceSymbol = 'грн';
  const tk = t[code];
  const tkTitle = tk?.title || title;
  const tkDescription = tk?.description || short_description;

  return (
      <article  className={styles.itemWrapper}>
        <Link href={`${baseURL}/${code}`} aria-label={`Переглянути ${tkTitle}`}>
          <div className={styles.galleryItem}>
            <div className={styles.itemBackground} />
            <div className={styles.imgContainer}>
              {image_path && <Image
                src={image_path}
                alt={`Зображення ${tkTitle}`}
                fill={true}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
                className={`${styles.defaultImg} ${styles.itemImg}`}
              />}
              {
                images[1] && <Image
                  src={images[1]}
                  alt={`Зображення ${tkTitle} при наведенні`}
                  fill={true}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  loading="lazy"
                  className={`${styles.hoverImg} ${styles.itemImg}`}
                />
              }
            </div>
          </div>
        </Link>
        <div className={styles.itemInfo}>
          <header className={styles.titleContainer}>
            <h2 className={styles.title}>
              <Link href={`${baseURL}/${code}`}>{tkTitle}</Link>
            </h2>
            <Link href={`${baseURL}/${code}`} className={styles.subTitle} dangerouslySetInnerHTML={{ __html: tkDescription }} />
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