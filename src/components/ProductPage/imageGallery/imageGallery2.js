// ImageGallery.jsx
import React from 'react';
import Image from 'next/image';
import styles from './styes.module.css';

const ImageGallery2 = ({ images, title }) => {
  const thumbnails = images.slice(1);

  return (
    <div className={styles.imageGallery}>
      <div className={`${styles.imgContainer} ${styles.transparentImgContainer}`}>
        <img src={images[0]} alt={title} />
      </div>
      {thumbnails.map((image, index) => (
        <div
          key={index}
          className={styles.imgContainer}
          tabIndex={0}
        >
          <img src={image} alt={title} />
        </div>
      ))}
    </div>
  );
};

export default ImageGallery2;
