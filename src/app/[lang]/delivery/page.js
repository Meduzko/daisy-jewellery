import { getDefaultMetaData } from '../../../helpers';
import styles from './styles.module.css';
import Image from 'next/image';

export async function generateMetadata(props) {
  const params = await props.params;
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const title = lang === 'ru'
    ? 'Доставка и оплата | Daisy Jewellery'
    : 'Доставка та оплата | Daisy Jewellery';
  const description = lang === 'ru'
    ? 'Бесплатная доставка при заказе от 2500 грн. Доставка Новой Почтой на отделение или курьером. Оплата при получении или на счет.'
    : 'Безкоштовна доставка при замовленні від 2500 грн. Доставка Новою Поштою на відділення або кур\'єром. Оплата при отриманні або на рахунок.';
  return getDefaultMetaData({ pagePath: 'delivery', title, description, lang });
}

const COPY = {
  uk: {
    title: 'Доставка та оплата',
    delivery: 'Доставка',
    deliveryOptions: ['На відділення/поштомат;', 'Адресна доставка кур’єром.'],
    freeDelivery: 'Безкоштовна доставка при замовленні на суму від 2 500 грн.',
    payment: 'Варіанти оплати: ',
    cod: 'Оплата при отриманні замовлення. Відправляємо післяплатою з частковою передоплатою 150 грн, залишок суми при отриманні на Новій пошті. Комісія Нової пошти за переказ коштів 20 грн.+2% від суми замовлення.',
    prepaid: 'Повна оплата на рахунок.',
    imageAlt: ['Срібні сережки та каблучка «Клевер» з оніксом на тлі фірмових коробочок Daisy Jewellery', 'Срібні каблучка, сережки та кольє з рожевими каменями у формі серця'],
  },
  ru: {
    title: 'Доставка и оплата',
    delivery: 'Доставка',
    deliveryOptions: ['В отделение/почтомат;', 'Адресная доставка курьером.'],
    freeDelivery: 'Бесплатная доставка при заказе на сумму от 2 500 грн.',
    payment: 'Варианты оплаты: ',
    cod: 'Оплата при получении заказа. Отправляем наложенным платежом с частичной предоплатой 150 грн, остаток суммы — при получении на Новой почте. Комиссия Новой почты за перевод средств 20 грн + 2% от суммы заказа.',
    prepaid: 'Полная оплата на счёт.',
    imageAlt: ['Серебряные серьги и кольцо «Клевер» с ониксом на фоне фирменных коробочек Daisy Jewellery', 'Серебряные кольцо, серьги и колье с розовыми камнями в форме сердца'],
  },
};

export default async function DeliveryPage(props) {
  const params = await props.params;
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const t = COPY[lang];
  return (
    <div className={styles.deliveryWrapper}>
      <h1 className={styles.title}>{t.title}</h1>
      <div className={styles.content}>
        <div className={styles.deliveryBlock}>
          <Image src="/delivery_2.jpg" alt={t.imageAlt[0]} width={350} height={350} />
          <div className={styles.deliveryTextBlock}>
            <h2>{t.delivery}</h2>
            <ul>
              {t.deliveryOptions.map((option) => (
                <li key={option} className={styles.li}>{option}</li>
              ))}
            </ul>
            <p>{t.freeDelivery}</p>
          </div>
        </div>
        <div className={styles.deliveryBlock}>
          <div className={styles.deliveryTextBlock}>
            <h2>{t.payment}</h2>
            <ul>
              <li className={styles.li}>{t.cod}</li>
              <li className={styles.li}>{t.prepaid}</li>
            </ul>
          </div>
          <Image src="/delivery_1.jpg" alt={t.imageAlt[1]} width={350} height={350} />
        </div>
      </div>
    </div>
  )
}
