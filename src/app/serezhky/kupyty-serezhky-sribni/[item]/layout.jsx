import Breadcrumbs from '../../../../components/Breadcrumbs';
import { fetchProduct } from '../../../../actions/fetchProduct';
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

  const segments = [
    { name: 'Головна', href: '/' },
    { name: 'Сережки', href: '/serezhky/1' },
    { name: product.title, href: `/serezhky/kupyty-serezhky-sribni/${params.item}` },
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      {children}
    </>
  );
}