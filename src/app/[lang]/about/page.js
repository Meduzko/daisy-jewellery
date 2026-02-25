import { getDefaultMetaData } from '../../../helpers';
import styles from './styles.module.css';

export async function generateMetadata({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const title = lang === 'ru'
    ? 'О нас | Daisy Jewellery - магазин серебряных украшений'
    : 'Про нас | Daisy Jewellery - магазин срібних прикрас';
  const description = lang === 'ru'
    ? 'Daisy Jewellery - украинский магазин серебряных украшений 925 пробы. Серьги, кольца, колье и браслеты на любой вкус с бесплатной подарочной упаковкой.'
    : 'Daisy Jewellery - український магазин срібних прикрас 925 проби. Сережки, каблучки, кольє та браслети на будь-який смак з безкоштовним подарунковим пакуванням.';
  return getDefaultMetaData({ pagePath: 'about', title, description, lang });
}

export default function AboutPage({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  return (
    <div className={styles.container}>
      <h1 className={styles.mainTitle}>Про нас</h1>
      <p>Daisy Jewellery - це магазин срібних прикрас на будь-який смак. У нашому магазині представлені ювелірні вироби зі срібла 925 проби від українського виробника. </p>
      <p>У асортименті ви знайдете срібні сережки, срібні кольє, срібні каблучки, срібні браслети та інші прикраси для будь-якої нагоди.</p>
      <p>{`Ми також пропонуємо безкоштовне подарункове пакування для кожного замовлення, що чудово підійде на подарунок комусь або собі. :)`}</p>
    </div>
  )
}


