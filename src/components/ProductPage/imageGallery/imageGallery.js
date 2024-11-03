// ImageGallery.jsx
"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import styles from './styes.module.css';

const ImageGallery = ({ images }) => {
  const thumbnails = images.slice(1);

  return (
    <div className={styles.imageGallery}>
      <div className={styles.mainImageContainer}>
        {/* <Image
          src={images[0]}
          alt="Product Image"
          fill={true}
          className={styles.mainImage}
          // onClick={() => handleThumbnailClick(images[0], true)}
          priority
        /> */}
        <img src={images[0]} alt="Product Image" className={styles.mainImage} />
      </div>
      <div className={styles.thumbnailColumn}>
        {thumbnails.map((image, index) => (
          <div
            key={index}
            className={styles.thumbnailImage}
            tabIndex={0}
          >
            {/* <Image
              src={image}
              alt={`Thumbnail ${index + 1}`}
              width={320}
              height={320}
              className={styles.secondaryImage}
            /> */}
            <img src={image} alt={`Thumbnail ${index + 1}`} className={styles.secondaryImage} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;
