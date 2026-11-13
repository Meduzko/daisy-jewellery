import Link from 'next/link';
import { getDefaultMetaData } from '../../../helpers';
import { getCategoryLinks } from '../../../components/Home/copy';
import styles from './styles.module.css';

export async function generateMetadata(props) {
  const params = await props.params;
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const title = lang === 'ru'
    ? 'О нас | Daisy Jewellery - магазин серебряных украшений'
    : 'Про нас | Daisy Jewellery - магазин срібних прикрас';
  const description = lang === 'ru'
    ? 'Daisy Jewellery - украинский магазин серебряных украшений 925 пробы. Серьги, кольца, колье и браслеты на любой вкус с бесплатной подарочной упаковкой.'
    : 'Daisy Jewellery - український магазин срібних прикрас 925 проби. Сережки, каблучки, кольє та браслети на будь-який смак з безкоштовним подарунковим пакуванням.';
  return getDefaultMetaData({ pagePath: 'about', title, description, lang });
}

export default async function AboutPage(props) {
  const params = await props.params;
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const links = getCategoryLinks(lang);
  if (lang === 'ru') {
    return (
      <div className={styles.container}>
        <h1 className={styles.mainTitle}>О нас</h1>
        <p>Daisy Jewellery — это магазин серебряных украшений на любой вкус. В нашем магазине представлены ювелирные изделия из серебра 925 пробы от украинского производителя.</p>
        <p>В ассортименте вы найдёте <Link href={links.earring}>серебряные серьги</Link>, <Link href={links.necklace}>серебряные колье</Link>, <Link href={links.ring}>серебряные кольца</Link>, <Link href={links.bracer}>серебряные браслеты</Link> и другие украшения для любого случая.</p>
        <p>{`Мы также предлагаем бесплатную подарочную упаковку для каждого заказа — она отлично подойдёт для подарка кому-то или себе. :)`}</p>
      </div>
    );
  }
  return (
    <div className={styles.container}>
      <h1 className={styles.mainTitle}>Про нас</h1>
      <p>Daisy Jewellery - це магазин срібних прикрас на будь-який смак. У нашому магазині представлені ювелірні вироби зі срібла 925 проби від українського виробника. </p>
      <p>У асортименті ви знайдете <Link href={links.earring}>срібні сережки</Link>, <Link href={links.necklace}>срібні кольє</Link>, <Link href={links.ring}>срібні каблучки</Link>, <Link href={links.bracer}>срібні браслети</Link> та інші прикраси для будь-якої нагоди.</p>
      <p>{`Ми також пропонуємо безкоштовне подарункове пакування для кожного замовлення, що чудово підійде на подарунок комусь або собі. :)`}</p>
    </div>
  )
}


