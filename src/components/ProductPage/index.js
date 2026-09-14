import React from 'react';
import { decode } from 'html-entities';
import ProductImageGallery from './ProductImageGallery/ProductImageGallery';
import SizeSelector from './sizeSelector/sizeSelector';
import CounterWithSubmit from './CounterWithSubmit/CounterWithSubmit';
import ClientViewContent from './ClientViewContent';
import { getDisplayPrices } from '../../helpers/productPricing';

import styles from './ProductPage.module.css';

const ProductPageNew = ({ item = {}, productSizes, t }) => {
  const {
    title,
    short_description: description,
    images,
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
  const { price: displayPrice, originalPrice, hasDiscount } = getDisplayPrices(item);

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
          {hasDiscount ? (
            <div className={styles.productPrice}>
              <div className={styles.productPriceValues}>
                <span className={styles.oldPrice}>{`${originalPrice} грн`}</span>
                <span className={styles.salePrice}>{`${displayPrice} грн`}</span>
              </div>
            </div>
          ) : (
            <div className={styles.productPrice}>{`${displayPrice} грн`}</div>
          )}

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
        price={displayPrice}
      />
    </>
  );
};

export default ProductPageNew;
