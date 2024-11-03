import React from 'react';
import Link from 'next/link';
// import Image from 'next/image';
import SizeSelector from './sizeSelector/sizeSelector';
import ProductCounter from './counter/productCounter';
import BuyButton from '../Buttons/Buy/BuyBtn';
import styles from './styles.module.css';

export default function ProductItemPage({ product }) {
  const availableSizes = [5, 6, 7, 8, 9];

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.productGallery}>
          <div>Image #1</div>
          <div>Image #2</div>
          <div>Image #3</div>
        </div>
        <div className={styles.productInfoContainer}>
          <h3>Item title</h3>
          <div>Price</div>
          <div className={styles.sizesContainer}>
            <SizeSelector sizes={availableSizes} />
          </div>
          <ProductCounter />
          <BuyButton />
        </div>
      </div>
    </div>
  )
};
