import OrderForm from '../components/Form/Order/Order';
import OrderList from './OrderList/OrderList';

import styles from './styles.module.css';

export default function OrderPage() {
  return (
    <div className={styles.wrapper}>
      <h1>Оформлення замовлення</h1>
      <div className={styles.container}>
        <OrderForm />
        {/* <OrderList /> */}
      </div>
    </div>
  )
}