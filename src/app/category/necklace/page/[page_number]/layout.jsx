import Breadcrumbs from '../../../../../components/Breadcrumbs';
// import { fetchProduct } from '../../../../../actions/fetchProduct';

export default async function Layout({ children, params }) {
  // const [product] = await fetchProduct({
  //   code: params.item,
  //   categoryId: process.env.RING_CATEGORY_ID,
  // });

  const segments = [
    { name: 'Головна', href: '/' },
    { name: 'Кольє', href: '/category/necklace/page/1' }
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      {children}
    </>
  );
}