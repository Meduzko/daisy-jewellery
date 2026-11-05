import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
// import { getItemTranslations } from '../../dictionaries';
import { getProductLink } from '../../helpers/getProductLink';
import { getDisplayPrices } from '../../helpers/productPricing';

import { translations } from './translations';
import styles from './styles.module.css';


// const getProductLink = product => {
//   const { category, code } = product;
//   const categoryMap = {
//     ring: 'kabluchki/kupyty-sribnu-kabluchku',
//     earring: 'serezhky/kupyty-serezhky-sribni',
//     necklace: 'kolye/kupyty-sribne-kolye',
//     bracer: 'braslety/kupyty-sribnyy-braslet',
//   }
//   const cat = categoryMap[category];
//   const productLink = `/${cat}/${code}`;

//   return productLink;
// }

const categoryMapper = {
  uk: {
    ring: 'ring',
    earring: 'earring',
    necklace: 'necklace',
    bracer: 'bracer'
  },
  ru: {
    ring: 'koltsa',
    earring: 'sergi',
    necklace: 'kolye',
    bracer: 'braslety'
  }
};

export default function ProductItem({ product, lang }) {
  const { product_id, title, short_description, code, image_path, category } = product;
  // const cat = categoryMap[category];
  // const productLink = `/${cat}/${code}`;
  const productLink = getProductLink(product, lang);
  const tk = translations?.[lang]?.[code];
  const tkTitle = tk?.title || title;
  const { price, originalPrice, hasDiscount } = getDisplayPrices(product);

  return (
    <div className={styles.item} key={product_id}>
      <Link href={productLink} className={styles.itemLink}>
        <div className={styles.itemContentCnt}>
          <div className={styles.itemImageCnt}>
            <Image
                src={image_path}
                alt={`Зображення ${tkTitle} при наведенні`}
                fill={true}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
                className={styles.itemImage}
              />
          </div>
        </div>
      </Link>
      <div className={styles.itemBottomInfo}>
        <div className={styles.infoCtn}>
        <Link href={productLink}>
          <p className={styles.itemTitle}>{tkTitle}</p>
        </Link>
          {/* <p className={styles.itemDescription} dangerouslySetInnerHTML={{ __html: short_description }} /> */}
        </div>
        <div className={styles.priceCnt}>
          {hasDiscount ? (
            <span className={styles.priceValues}>
              <span className={styles.oldPrice}>{originalPrice} грн</span>
              <span className={styles.salePrice}>{price} грн</span>
            </span>
          ) : (
            <span>{price} грн</span>
          )}
        </div>
      </div>
    </div>
  );
};
