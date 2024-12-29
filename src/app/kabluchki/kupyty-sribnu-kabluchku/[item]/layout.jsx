import { notFound } from 'next/navigation';
import Breadcrumbs from '../../../../components/Breadcrumbs';
import { fetchProduct } from '../../../../actions/fetchProduct';

export default async function Layout({ children, params }) {
  const data = await fetchProduct({
    code: params.item,
    categoryId: process.env.RING_CATEGORY_ID,
  });

  if (!data || !data.length) {
    return notFound();
  }

  const [product] = data;

  const segments = [
    { name: 'Головна', href: '/' },
    { name: 'Каблучки', href: '/kabluchki/1' },
    {
      name: product?.title,
      href: `/kabluchki/kupyty-sribnu-kabluchku/${params.item}`,
    },
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      {children}
    </>
  );
}
