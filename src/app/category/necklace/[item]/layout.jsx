import Breadcrumbs from '../../../../components/Breadcrumbs';
import { fetchProduct } from '../../../../actions/fetchProduct';

export default async function Layout({ children, params }) {
  const [product] = await fetchProduct({
    code: params.item,
    categoryId: process.env.NECKLACE_CATEGORY_ID,
  });

  const segments = [
    { name: 'Головна', href: '/' },
    { name: 'Кольє', href: '/category/necklace/page/1' },
    { name: product.title, href: `/category/necklace/${params.item}` },
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      {children}
    </>
  );
}