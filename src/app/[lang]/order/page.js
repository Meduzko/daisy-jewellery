import styles from './styles.module.css';
import OrderForm from '../../../components/Form/Order/Order';

export async function generateMetadata(props) {
  const params = await props.params;
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const title = lang === 'ru'
    ? 'Оформление заказа | Daisy Jewellery'
    : 'Оформлення замовлення | Daisy Jewellery';
  
  return {
    title,
    robots: {
      index: false,
      follow: false,
      noarchive: true,
    },
  };
}

export default async function OrderPage(props) {
  const params = await props.params;
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  return (
    <div className={styles.container}>
      <OrderForm />
    </div>
  );
}


