import Breadcrumbs from '../../../../components/Breadcrumbs';

export default async function Layout({ children }) {

  const segments = [
    { name: 'Головна', href: '/uk' },
    { name: 'Сережки', href: '/uk/serezhky/1' }
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      {children}
    </>
  );
}
