import React from 'react';
import styles from './ProductPage.module.css';
import ImageGallery from './imageGallery/imageGallery';
import ImageGallery2 from './imageGallery/imageGallery2';
import SizeSelector from './sizeSelector/sizeSelector';
// import ProductCounter from './counter/productCounter';
// import ProductBuyButton from '../Buttons/ProductBuy/ProductBuy';

import CounterWithSubmit from './CounterWithSubmit/CounterWithSubmit';

const ProductPageNew = ({ item = {} }) => {

  const {
    product_id,
    code,
    title,
    short_description,
    image_path,
    images,
    price
  } = item;
  // Sample data
  const product = {
    id: product_id || item,
    title: title || `Elegant Silver Ring ${item}`,
    description: short_description || 'A beautifully crafted silver ring perfect for any occasion.',
    price: Number(price) || 99.99,
    images: images || [
      '/images/productLarge2.webp',
      '/images/productSmall4.webp',
      '/images/productSmall4.webp',
    ],
    sizes: [55, 56, 57, 58, 59],
  };

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

  return (
    <div className={styles.productPageContainer}>
      {/* Left Section: Images */}
      <section className={styles.leftSection}>
        <ImageGallery2 images={product.images} />
      </section>

      {/* Right Section: Product Details */}
      <section className={styles.rightSection}>
        <h1 className={styles.productTitle}>{product.title}</h1>
        <p className={styles.productDescription}>{product.description}</p>
        <div className={styles.productPrice}>{`$${product.price}`}</div>

        <div className={styles.productInfoContainer}>
          <h3>Розмір:</h3>
          <SizeSelector sizes={product.sizes} />
        </div>

        <CounterWithSubmit product={product} />
      </section>
    </div>
  );
};

export default ProductPageNew;
