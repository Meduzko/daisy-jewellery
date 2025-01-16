import { getItemTranslations } from '../../../../../dictionaries';
import Breadcrumbs from '../../../../../components/Breadcrumbs';
import { fetchProduct } from '../../../../../actions/fetchProduct';
import { notFound } from 'next/navigation';

export default async function Layout({ children, params }) {
  const data = await fetchProduct({
    code: params.item,
    categoryId: process.env.BRACER_CATEGORY_ID,
  });

  if (!data || !data.length) {
    return notFound();
  }

  const [product] = data;
  const tk = await getItemTranslations({ lang: 'ru', categoryName: 'braslety', code: product.code });

  const segments = [
    { name: 'Головна', href: '/ru' },
    { name: 'Браслеты', href: '/ru/braslety/1' },
    { name: tk?.title || product?.title, href: `/ru/braslety/kupit-serebryanyy-braslet/${params.item}` },
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      {children}
    </>
  );
}