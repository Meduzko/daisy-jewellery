import { getDefaultMetaData } from '../../../helpers';
import styles from './styles.module.css';
import OrderForm from '../../../components/Form/Order/Order';

export async function generateMetadata({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const title = lang === 'ru'
    ? 'Магазин серебряных украшений - Daisy Jewellery | Оформление заказа'
    : 'Магазин срібних прикрас - Daisy Jewellery | Оформлення замовлення';
  return getDefaultMetaData({ pagePath: 'order', title, lang });
}

export default function OrderPage({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  return (
    <div className={styles.container}>
      <OrderForm />
    </div>
  );
}


