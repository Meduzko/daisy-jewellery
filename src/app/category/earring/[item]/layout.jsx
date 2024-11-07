import Breadcrumbs from '../../../../components/Breadcrumbs';
import { fetchProduct } from '../../../../actions/fetchProduct';

export default async function Layout({ children, params }) {
  const [product] = await fetchProduct({
    code: params.item,
    categoryId: process.env.EARING_CATEGORY_ID,
  });

  const segments = [
    { name: 'Головна', href: '/' },
    { name: 'Сережки', href: '/category/earring/page/1' },
    { name: product.title, href: `/category/earring/${params.item}` },
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      {children}
    </>
  );
}