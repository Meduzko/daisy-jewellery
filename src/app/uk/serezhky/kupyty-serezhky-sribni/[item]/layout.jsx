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

  const segments = [
    { name: 'Головна', href: '/uk' },
    { name: 'Сережки', href: '/uk/serezhky/1' },
    { name: product.title, href: `/uk/serezhky/kupyty-serezhky-sribni/${params.item}` },
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      {children}
    </>
  );
}