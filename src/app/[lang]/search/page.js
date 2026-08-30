import { getDefaultMetaData } from '../../../helpers';
import { searchProductsByTitle } from '../../../lib/searchProducts';
import Gallery from '../../../components/Gallery';
import styles from './styles.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params, searchParams }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const query = String(searchParams?.q || searchParams?.query || '').trim();
  const title = query
    ? (lang === 'ru' ? `Поиск: ${query} | Daisy Jewellery` : `Пошук: ${query} | Daisy Jewellery`)
    : (lang === 'ru' ? 'Поиск | Daisy Jewellery' : 'Пошук | Daisy Jewellery');
  const description = lang === 'ru'
    ? 'Поиск серебряных украшений Daisy Jewellery'
    : 'Пошук срібних прикрас Daisy Jewellery';

  return getDefaultMetaData({ pagePath: 'search', title, description, lang });
}

export default async function SearchPage({ params, searchParams }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const query = String(searchParams?.q || searchParams?.query || '').trim();
  const { products } = query.length >= 2
    ? await searchProductsByTitle({ title: query, limit: 20 })
    : { products: [] };

  const title = query
    ? (lang === 'ru' ? `Результаты поиска: «${query}»` : `Результати пошуку: «${query}»`)
    : (lang === 'ru' ? 'Поиск' : 'Пошук');

  const emptyText = query.length < 2
    ? (lang === 'ru' ? 'Введите хотя бы 2 символа для поиска.' : 'Введіть щонайменше 2 символи для пошуку.')
    : (lang === 'ru' ? 'По вашему запросу ничего не найдено.' : 'За вашим запитом нічого не знайдено.');

  return (
    <div className={styles.page}>
      <h1 className="category-title">{title}</h1>
      {products.length > 0 ? (
        <Gallery items={products} lang={lang} />
      ) : (
        <p className={styles.empty}>{emptyText}</p>
      )}
    </div>
  );
}
