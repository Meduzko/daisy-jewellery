import Breadcrumbs from '../../../../components/Breadcrumbs';
import { fetchProduct } from '../../../../actions/fetchProduct';

export default async function Layout({ children, params }) {
  const [product] = await fetchProduct({
    code: params.item,
    categoryId: process.env.BRACER_CATEGORY_ID,
  });

  const segments = [
    { name: 'Головна', href: '/' },
    { name: 'Браслети', href: '/category/bracer/page/1' },
    { name: product.title, href: `/category/bracer/${params.item}` },
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      {children}
    </>
  );
}