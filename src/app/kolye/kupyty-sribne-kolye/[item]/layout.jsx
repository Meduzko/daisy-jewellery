import { notFound } from 'next/navigation';
import Breadcrumbs from '../../../../components/Breadcrumbs';
import { fetchProduct } from '../../../../actions/fetchProduct';

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
    { name: 'Головна', href: '/' },
    { name: 'Кольє', href: '/kolye/1' },
    { name: product.title, href: `/kolye/kupyty-sribne-kolye/${params.item}` },
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      {children}
    </>
  );
}
