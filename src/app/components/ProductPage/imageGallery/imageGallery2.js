// ImageGallery.jsx
"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import styles from './styes.module.css';

const ImageGallery2 = ({ images }) => {
  const thumbnails = images.slice(1);

  return (
    <div className={styles.imageGallery}>
      <div className={`${styles.imgContainer} ${styles.transparentImgContainer}`}>
        <img src={images[0]} alt="Product Image" className={`${styles.img} ${styles.transparentImg}`} />
      </div>
      {thumbnails.map((image, index) => (
        <div
          key={index}
          className={styles.imgContainer}
          tabIndex={0}
        >
          <img src={image} alt={`Thumbnail ${index + 1}`} className={styles.img} />
        </div>
      ))}
    </div>
  );
};

export default ImageGallery2;
