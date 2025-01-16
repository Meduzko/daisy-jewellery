import Breadcrumbs from '../../../../components/Breadcrumbs';

export default async function Layout({ children, params }) {
  const segments = [
    { name: 'Главная', href: '/ru' },
    { name: 'Колье', href: '/ru/kolye/1' }
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      {children}
    </>
  );
}