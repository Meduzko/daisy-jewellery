import Image from 'next/image';
import { List, ListItem, Divider } from '@mui/material';

import styles from './styles.module.css';

export default function DeliveryPage() {
  return (
    <div className={styles.deliveryWrapper}>
      <h1>Доставка та оплата</h1>
      <div>
        <div className={styles.deliveryBlock}>
          <Image src="/delivery_2.jpg" alt="coat_of_arms" width={250} height={250} />
          <div>
            <h3>Доставка</h3>
            <p>
              Доставка здійснюється:
            </p>
            <List>
              <ListItem>
                На відділення/поштомат;
              </ListItem>
              <ListItem>
                Адресна доставка кур’єром.
              </ListItem>
            </List>
            <p>Безкоштовна доставка при замовленні на суму від 2 500 грн.</p>
          </div>
        </div>
        <div className={styles.deliveryBlock}>
          <div>
            <h3>Варіанти оплати: </h3>
            <List>
              <ListItem>
                Оплата при отриманні замовлення.
                Відправляємо післяплатою з частковою передоплатою 150 грн, залишок суми при отриманні на Новій пошті.
                Комісія Нової пошти за переказ коштів 20 грн.+2% від суми замовлення.
              </ListItem>
              <ListItem>
                Повна оплата на рахунок.
              </ListItem>
            </List>
          </div>
          <Image src="/delivery_1.jpg" alt="coat_of_arms" width={250} height={250} />
        </div>
      </div>
    </div>

  )
}
