import { getDefaultMetaData } from '../../helpers';
import styles from './styles.module.css';

export async function generateMetadata({ params }) {
  const metadata = getDefaultMetaData({ pagePath: 'returns', title: 'Магазин срібних прикрас - Daisy Jewellery | Повернення' });

  return metadata;
}

export default function ReturnsPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.mainTitle}>Повернення та обмін</h1>
      <p>Згідно з нормами законодавства, ювелірні вироби належної якості обміну та поверненню не підлягають*.</p>
      <p>
        *Згідно з закону ювелірні вироби належної якості, зазначені в переліку непродовольчих товарів, затвердженому
        Постановою Кабінету Міністрів України від 19 березня 1994 року № 172, не підлягають поверненню та обміну.
      </p>

      <p>Однак ми йдемо назустріч нашим клієнтам та здійснюємо обмін та повернення у таких випадках:</p>
      <ul>
        <li className={styles.li}>вам не підійшов розмір;</li>
        <li className={styles.li}>ви отримали прикрасу з дефектом.</li>
      </ul>

      <h3>Обмін здійснюється протягом 14 днів з моменту покупки за таких умов:</h3>
      <ul>
        <li className={styles.li}>наявність та цілісність бірки;</li>
        <li className={styles.li}>відсутність механічних пошкоджень; </li>
        <li className={styles.li}>виріб не має ознак носіння.</li>
      </ul>

      <p>Хто оплачує витрати на доставку?</p>

      <p>Якщо не підійшов розмір, доставку у обидві сторони сплачує покупець.</p>
      <p>Ми сплачуємо доставку, якщо обмін чи повернення відбувається через брак або ж з нашої вини. </p>
    </div>
  )
}
