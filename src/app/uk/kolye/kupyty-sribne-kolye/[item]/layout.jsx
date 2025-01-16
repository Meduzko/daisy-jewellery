import Breadcrumbs from '../../../../../components/Breadcrumbs';
import { fetchProduct } from '../../../../../actions/fetchProduct';
import { notFound } from 'next/navigation';

export default async function Layout({ children, params }) {
  const data = await fetchProduct({
    code: params.item,
    categoryId: process.env.NECKLACE_CATEGORY_ID,
  });

  if (!data || !data.length) {
    return notFound();
  }

  const [product] = data;

  const segments = [
    { name: 'Головна', href: '/uk' },
    { name: 'Кольє', href: '/uk/kolye/1' },
    { name: product.title, href: `/uk/kolye/kupyty-sribne-kolye/${params.item}` }
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      {children}
    </>
  );
}
