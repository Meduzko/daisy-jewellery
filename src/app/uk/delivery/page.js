import Image from 'next/image';
import { getDefaultMetaData } from '../../../helpers';
import styles from './styles.module.css';

export async function generateMetadata({ params }) {
  const metadata = getDefaultMetaData({ pagePath: 'delivery', title: 'Магазин срібних прикрас - Daisy Jewellery | Доставка', lang: 'uk' });

  return metadata;
}

export default function DeliveryPage() {
  return (
    <div className={styles.deliveryWrapper}>
      <h1 className={styles.title}>Доставка та оплата</h1>
      <div className={styles.content}>
        <div className={styles.deliveryBlock}>
          <Image src="/delivery_2.jpg" alt="Delivery image 1" width={350} height={350} />
          <div className={styles.deliveryTextBlock}>
            <h2>Доставка</h2>
            <ul>
              <li className={styles.li}>
                На відділення/поштомат;
              </li>
              <li className={styles.li}>
                Адресна доставка кур’єром.
              </li>
            </ul>
            <p>Безкоштовна доставка при замовленні на суму від 2 500 грн.</p>
          </div>
        </div>
        <div className={styles.deliveryBlock}>
          <div className={styles.deliveryTextBlock}>
            <h2>Варіанти оплати: </h2>
            <ul>
              <li className={styles.li}>
                Оплата при отриманні замовлення.
                Відправляємо післяплатою з частковою передоплатою 150 грн, залишок суми при отриманні на Новій пошті.
                Комісія Нової пошти за переказ коштів 20 грн.+2% від суми замовлення.
              </li>
              <li className={styles.li}>
                Повна оплата на рахунок.
              </li>
            </ul>
          </div>
          <Image src="/delivery_1.jpg" alt="Delivery image 2" width={350} height={350} />
        </div>
      </div>
    </div>
  )
}
