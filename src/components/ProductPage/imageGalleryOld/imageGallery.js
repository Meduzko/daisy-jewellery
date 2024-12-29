// ImageGallery.jsx
'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import styles from './styes.module.css';

const ImageGallery = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState(images[0]);

  const thumbnails = images.slice(1);

  const handleThumbnailClick = (image) => {
    setSelectedImage(image);
  };

  return (
    <div className={styles.imageGallery}>
      <div className={styles.mainImageContainer}>
        <Image
          src={selectedImage}
          alt="Product Image"
          // layout="fill"
          // objectFit="cover"
          fill={true}
          // sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          // width={460}
          // height={460}
          className={styles.mainImage}
          priority
        />
      </div>
      <div className={styles.thumbnailColumn}>
        {thumbnails.map((image, index) => (
          <div
            key={index}
            className={styles.thumbnailImage}
            onClick={() => handleThumbnailClick(image)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleThumbnailClick(image);
              }
            }}
          >
            <Image
              src={image}
              alt={`Thumbnail ${index + 1}`}
              width={320}
              height={320}
              // width={240}
              // height={240}
              // objectFit="cover"
              // fill={true}
              className={styles.secondaryImage}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;
