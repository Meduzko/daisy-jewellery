import Breadcrumbs from '../../../../../components/Breadcrumbs';

export default async function Layout({ children }) {

  const segments = [
    { name: 'Головна', href: '/' },
    { name: 'Сережки', href: '/category/earring/page/1' }
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      {children}
    </>
  );
}