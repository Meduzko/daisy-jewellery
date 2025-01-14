import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getProductLink } from '../../helpers/getProductLink';

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



export default function ProductItem({ product }) {
  const { product_id, title, short_description, price, code, image_path, category } = product;
  // const cat = categoryMap[category];
  // const productLink = `/${cat}/${code}`;
  const productLink = getProductLink(product);

  return (
    <div className={styles.item} key={product_id}>
      <Link href={productLink} className={styles.itemLink}>
        <div className={styles.itemContentCnt}>
          <div className={styles.itemImageCnt}>
            <Image
                src={image_path}
                alt={`Зображення ${title} при наведенні`}
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
          <p className={styles.itemTitle}>{title}</p>
        </Link>
          {/* <p className={styles.itemDescription} dangerouslySetInnerHTML={{ __html: short_description }} /> */}
        </div>
        <div className={styles.priceCnt}>
          <span>{price} грн</span>
        </div>
      </div>
    </div>
  );
};
