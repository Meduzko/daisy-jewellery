import React from 'react';
import Image from 'next/image';
import styles from './styes.module.css';

const ProductImageGallery = ({ images, title }) => {
  const firstImage = images[0];
  const thumbnails = images.slice(1);

  return (
    <div className={styles.imageGallery}>
      <div className={`${styles.imgContainer} ${styles.transparentImgContainer}`}>
        {firstImage && <Image
          src={firstImage}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={styles.image}
        />}
      </div>
      {thumbnails && thumbnails.map((image, index) => (
        <div
          key={index}
          className={styles.imgContainer}
          tabIndex={0}
        >
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={styles.image}
            loading="eager"
          />
        </div>
      ))}
    </div>
  );
};

export default ProductImageGallery;
