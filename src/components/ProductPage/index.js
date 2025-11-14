import React from 'react';
import { decode } from 'html-entities';
import ProductImageGallery from './ProductImageGallery/ProductImageGallery';
import SizeSelector from './sizeSelector/sizeSelector';
import CounterWithSubmit from './CounterWithSubmit/CounterWithSubmit';
import ClientViewContent from './ClientViewContent';

import styles from './ProductPage.module.css';

const ProductPageNew = ({ item = {}, productSizes, t }) => {
  const {
    title,
    short_description: description,
    images,
    price,
    code,
    sku,
    product_id
  } = item;

  // const plainTextDescription = description.replace(/<[^>]*>/g, "");
  const plainTextDescription = decode(
    description.replace(/<[^>]*>/g, '')
  );
  const tkTitle = t?.title || title;
  const tkDescription = t?.description || plainTextDescription;

  return (
    <>
      <div className={styles.productPageContainer}>
        {/* Left Section: Images */}
        <section className={styles.leftSection}>
          <ProductImageGallery images={images} title={tkTitle} />
        </section>

        {/* Right Section: Product Details */}
        <section className={styles.rightSection}>
          <h1 className={styles.productTitle}>{tkTitle}</h1>
          {/* <p className={styles.productDescription} dangerouslySetInnerHTML={{ __html: description }} /> */}
          <p className={styles.productDescription}>{tkDescription}</p>
          <div className={styles.productPrice}>{`${price} грн`}</div>

          {productSizes && <div className={styles.productInfoContainer}>
            <h3>Розмір:</h3>
            <SizeSelector item={item} sizes={productSizes} />
          </div>}

          <CounterWithSubmit product={item} />
        </section>
      </div>
      <ClientViewContent
        id={sku || code || product_id}
        name={tkTitle}
        price={price}
      />
    </>
  );
};

export default ProductPageNew;
