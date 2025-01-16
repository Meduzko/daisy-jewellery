import Breadcrumbs from '../../../../components/Breadcrumbs';

export default async function Layout({ children }) {

  const segments = [
    { name: 'Главная', href: '/ru' },
    { name: 'Серьги', href: '/ru/sergi/1' }
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      {children}
    </>
  );
}
