import React from 'react';
import ImageGallery from './ImageGallery';
import SizeSelector from './sizeSelector/sizeSelector';
import CounterWithSubmit from './CounterWithSubmit/CounterWithSubmit';

import styles from './ProductPage.module.css';

const ProductPageNew = ({ item = {} }) => {
  const {
    product_id,
    code,
    title,
    short_description: description,
    image_path,
    images,
    price,
    sizes = [55, 56, 57, 58, 59]
  } = item;

  const handleSizeChange = (size) => {
    console.log('Selected size:', size);
    // Handle size selection
  };

  const handleCountChange = (count) => {
    console.log('Selected quantity:', count);
    // Handle quantity change
  };

  const handleBuyNow = () => {
    // Handle buy action
    console.log('Buy now clicked');
  };

  const siteName = 'Daisy Jewellery';

  return (
    <>
      <div className={styles.productPageContainer}>
        {/* Left Section: Images */}
        <section className={styles.leftSection}>
          <ImageGallery images={images} title={title} />
        </section>

        {/* Right Section: Product Details */}
        <section className={styles.rightSection}>
          <h1 className={styles.productTitle}>{title}</h1>
          <p className={styles.productDescription} dangerouslySetInnerHTML={{ __html: description }} />
          <div className={styles.productPrice}>{`${price} грн`}</div>

          <div className={styles.productInfoContainer}>
            <h3>Розмір:</h3>
            <SizeSelector sizes={sizes} />
          </div>

          <CounterWithSubmit product={item} />
        </section>
      </div>
    </>
  );
};

export default ProductPageNew;
