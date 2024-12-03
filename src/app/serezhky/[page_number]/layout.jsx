import Breadcrumbs from '../../../components/Breadcrumbs';

export default async function Layout({ children }) {

  const segments = [
    { name: 'Головна', href: '/' },
    { name: 'Сережки', href: '/serezhky/1' }
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      {children}
    </>
  );
}
