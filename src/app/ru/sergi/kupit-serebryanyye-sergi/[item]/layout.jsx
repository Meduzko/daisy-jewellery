import { getItemTranslations } from '../../../../../dictionaries';
import Breadcrumbs from '../../../../../components/Breadcrumbs';
import { fetchProduct } from '../../../../../actions/fetchProduct';
import { notFound } from 'next/navigation';

export default async function Layout({ children, params }) {
  const data = await fetchProduct({
    code: params.item,
    categoryId: process.env.EARING_CATEGORY_ID,
  });

  if (!data || !data.length) {
    return notFound();
  }

  const [product] = data;
  const tk = await getItemTranslations({ lang: 'ru', categoryName: 'sergi', code: product.code });

  const segments = [
    { name: 'Главная', href: '/ru' },
    { name: 'Серьги', href: '/ru/sergi/1' },
    { name: tk?.title || product?.title, href: `/ru/sergi/kupit-serebryanyye-sergi/${params.item}` },
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      {children}
    </>
  );
}