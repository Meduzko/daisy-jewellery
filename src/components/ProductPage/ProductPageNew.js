import React from 'react';
// import Head from 'next/head';
import ImageGallery2 from './imageGallery/imageGallery2';
import SizeSelector from './sizeSelector/sizeSelector';
import CounterWithSubmit from './CounterWithSubmit/CounterWithSubmit';

import styles from './ProductPage.module.css';

{/* <Head>

<title>{`${title} | ${siteName}`}</title>
<meta name="description" content={description} />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="canonical" href={`https://www.example.com/product/productSlug`} />
<meta name="robots" content="index, follow" />


<meta property="og:title" content={`${title} | ${siteName}`} />
<meta property="og:description" content={description} />
<meta property="og:url" content={`https://www.example.com/product/productSlug`} />
<meta property="og:type" content="product" />
<meta property="og:image" content={image_path} />
<meta property="og:locale" content="en_US" />
<meta property="og:site_name" content={siteName} />
<meta property="og:image:alt" content={`Image of ${title}`} />


<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={`${title} | ${siteName}`} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={image_path} />
</Head> */}

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

  // const product = {
  //   id: product_id || item,
  //   title: title || `Elegant Silver Ring ${item}`,
  //   description: short_description || '',
  //   price: Number(price) || 99.99,
  //   images: images || [
  //     '/images/productLarge2.webp',
  //     '/images/productSmall4.webp',
  //     '/images/productSmall4.webp',
  //   ],
  //   sizes: [55, 56, 57, 58, 59],
  // };

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
          <ImageGallery2 images={images} title={title} />
        </section>

        {/* Right Section: Product Details */}
        <section className={styles.rightSection}>
          <h1 className={styles.productTitle}>{title}</h1>
          {/* <p className={styles.productDescription}>{product.description}</p> */}
          <p className={styles.productDescription} dangerouslySetInnerHTML={{ __html: description }} />
          <div className={styles.productPrice}>{`$${price}`}</div>

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
