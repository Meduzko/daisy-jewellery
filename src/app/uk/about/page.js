import { getDefaultMetaData } from '../../../helpers';
import styles from './styles.module.css';

export async function generateMetadata({ params }) {
  const metadata = getDefaultMetaData({ pagePath: 'about', title: 'Магазин срібних прикрас - Daisy Jewellery | Про нас', lang: 'uk' });

  return metadata;
}

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.mainTitle}>Про нас</h1>
      <p>Daisy Jewellery - це магазин срібних прикрас на будь-який смак. У нашому магазині представлені ювелірні вироби зі срібла 925 проби від українського виробника. </p>
      <p>У асортименті ви знайдете срібні сережки, срібні кольє, срібні каблучки, срібні браслети та інші прикраси для будь-якої нагоди.</p>
      <p>{`Ми також пропонуємо безкоштовне подарункове пакування для кожного замовлення, що чудово підійде на подарунок комусь або собі. :)`}</p>
    </div>
  )
}
