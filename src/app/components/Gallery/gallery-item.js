import Image from 'next/image';
import Link from "next/link"
import BuyButton from './BuyButton';
import styles from './styles.module.css';

export default async function GalleryItem({ item, itemLinkBaseURL = '/category/ring' }) {
  const {
    id,
    product_id,
    code,

    title,

    imageUrl,
    image_path,

    hoverImageUrl,
    images
  } = item;
  const shortDescription = 'Срібло фіаніти';
  const price = 750;
  const priceSymbol = '₴';

  return (
      <div className={styles.itemWrapper}>
        <Link href={`${itemLinkBaseURL}/${id || code}`}>
          <div className={styles.galleryItem}>
            <div className={styles.itemBackground} />
            <div className={styles.imgContainer}>
              <Image
                src={imageUrl || image_path}
                alt={title}
                fill={true}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={true}
                className={`${styles.defaultImg} ${styles.itemImg}`}
              />
              <Image
                src={hoverImageUrl || images[1]}
                alt={`${title} hover`}
                fill={true}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={false}
                className={`${styles.hoverImg} ${styles.itemImg}`}
              />
            </div>
          </div>
        </Link>
        <div className={styles.itemInfo}>
            <div className={styles.titleContainer}>
              <Link href={`${itemLinkBaseURL}/${id}`} className={styles.title}>{title}</Link>
              <Link href={`${itemLinkBaseURL}/${id}`} className={styles.subTitle}>{shortDescription}</Link>
              <div className={styles.price}>{`${price} ${priceSymbol}`}</div>
            </div>
            <div className={styles.itemBottomCnt}>
              <div>
                <BuyButton item={item} />
              </div>
            </div>
          </div>
      </div>
  );
}