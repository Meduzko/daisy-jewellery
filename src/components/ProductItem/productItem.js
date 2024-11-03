import React from 'react';
import Link from 'next/link';
// import Image from 'next/image';
import styles from './styles.module.css';

export default function ProductItem({ id, title, description, price, imageLink }) {
  return (
    <div className={styles.item} key={id}>
      <Link href={`/item/${id}`} className={styles.itemLink}>
        <div className={styles.itemContentCnt}>
          <div className={styles.itemImageCnt}>
            <img src={imageLink} className={styles.itemImage} />
            {/* <Image
              src={imageLink} // Path to your image
              alt="Product item"
              className={styles.itemImage}
              width={300}
              height={600}
            /> */}
          </div>
        </div>
      </Link>
      <div className={styles.itemBottomInfo}>
        <div className={styles.infoCtn}>
        <Link href={`/item/${id}`}>
          <p className={styles.itemTitle}>{title}</p>
        </Link>
          <p className={styles.itemDescription}>{description}</p>
        </div>
        <div className={styles.priceCnt}>
          <span>{price} ₴</span>
        </div>
      </div>
      {/* <div className={styles.bottomGradient}></div> */}
    </div>
  );
};
