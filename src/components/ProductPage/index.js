import React from 'react';
import ProductImageGallery from './ProductImageGallery/ProductImageGallery';
import SizeSelector from './sizeSelector/sizeSelector';
import CounterWithSubmit from './CounterWithSubmit/CounterWithSubmit';

import styles from './ProductPage.module.css';

const ProductPageNew = ({ item = {}, productSizes }) => {
  const {
    title,
    short_description: description,
    images,
    price,
  } = item;

  const plainTextDescription = description.replace(/<[^>]*>/g, "");

  return (
    <>
      <div className={styles.productPageContainer}>
        {/* Left Section: Images */}
        <section className={styles.leftSection}>
          <ProductImageGallery images={images} title={title} />
        </section>

        {/* Right Section: Product Details */}
        <section className={styles.rightSection}>
          <h1 className={styles.productTitle}>{title}</h1>
          {/* <p className={styles.productDescription} dangerouslySetInnerHTML={{ __html: description }} /> */}
          <p className={styles.productDescription}>{plainTextDescription}</p>
          <div className={styles.productPrice}>{`${price} грн`}</div>

          {productSizes && <div className={styles.productInfoContainer}>
            <h3>Розмір:</h3>
            <SizeSelector item={item} sizes={productSizes} />
          </div>}

          <CounterWithSubmit product={item} />
        </section>
      </div>
    </>
  );
};

export default ProductPageNew;
