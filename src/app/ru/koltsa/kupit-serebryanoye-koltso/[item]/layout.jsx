import { getItemTranslations } from '../../../../../dictionaries';
import Breadcrumbs from '../../../../../components/Breadcrumbs';
import { fetchProduct } from '../../../../../actions/fetchProduct';
import { notFound } from 'next/navigation';

export default async function Layout({ children, params }) {
  const data = await fetchProduct({
    code: params.item,
    categoryId: process.env.RING_CATEGORY_ID,
  });

  if (!data || !data.length) {
    return notFound();
  }

  const [product] = data;
  const tk = await getItemTranslations({ lang: 'ru', categoryName: 'koltsa', code: product.code });

  const segments = [
    { name: 'Главная', href: '/' },
    { name: 'Кольца', href: '/ru/koltsa/1' },
    { name: tk?.title || product?.title, href: `/koltsa/kupit-serebryanoye-koltso/${params.item}` },
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      {children}
    </>
  );
}