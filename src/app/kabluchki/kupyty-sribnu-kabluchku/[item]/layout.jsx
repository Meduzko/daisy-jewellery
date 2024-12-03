import Breadcrumbs from '../../../../components/Breadcrumbs';
import { fetchProduct } from '../../../../actions/fetchProduct';

export default async function Layout({ children, params }) {
  const [product] = await fetchProduct({
    code: params.item,
    categoryId: process.env.RING_CATEGORY_ID,
  });

  const segments = [
    { name: 'Головна', href: '/' },
    { name: 'Каблучки', href: '/kabluchki/1' },
    { name: product.title, href: `/kabluchki/kupyty-sribnu-kabluchku/${params.item}` },
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      {children}
    </>
  );
}