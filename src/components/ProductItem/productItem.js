import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
// import { getItemTranslations } from '../../dictionaries';
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

const translations = {
  ru: {
    "8774": {
      "title": "Серебряное колье с ониксом Клевер 3 вставки",
      "description": "Элегантное серебряное колье на три вставки с ониксом. Длина регулируется – 40-45 см. "
    },
    "8775": {
      "title": "Серебряный браслет оникс Клевер 3 вставки",
      "description": "Изысканный серебряный браслет с тремя вставками из оникса. Длина регулируется – 16-19 см."
    },
    "9090": {
      "title": "Серебряное кольцо перламутр и позолота Клевер",
      "description": "Изысканное серебряное кольцо в позолоте со вставкой перламутр и фианитами."
    },
    "8636": {
      "title": "Серебряные серьги с позолотой и перламутром Клевер",
      "description": "Серебряные серьги с позолотой и вставкой перламутр."
    },
    "8256": {},
    "8249": {
      "title": "Серебряное кольцо «Heart» ",
      "description": "Минималистичное женское кольцо из серебра 925 пробы."
    },
    "8291": {
      "title": "Серебряное женское кольцо с фианитами",
      "description": "Изысканное серебряное кольцо с россыпью фианитов."
    },
    "8631": {
      "title": "Пусеты серебро 925° с фианитами",
      "description": "Стильные серебряные пусеты с россыпью фианитов."
    },
    "5893": {
      "title": "Браслет серебро 925° с фианитами",
      "description": "Стильный серебряный браслет с тремя вставками, украшенными россыпью фианитов. Длина регулируется – 16-19 см."
    },
    "8544": {
      "title": "Кольцо серебро 925° с фианитами",
      "description": "Изысканное кольцо из серебра 925° украшено россыпью фианитов. "
    },
  }
};

export default function ProductItem({ product, lang }) {
  const { product_id, title, short_description, price, code, image_path, category } = product;
  // const cat = categoryMap[category];
  // const productLink = `/${cat}/${code}`;
  const productLink = getProductLink(product, lang);
  const tk = translations?.[lang]?.[code];
  const tkTitle = tk?.title || title;

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
          <span>{price} грн</span>
        </div>
      </div>
    </div>
  );
};
