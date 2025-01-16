import Breadcrumbs from '../../../../components/Breadcrumbs';

export default async function Layout({ children, params }) {
  const segments = [
    { name: 'Головна', href: '/uk' },
    { name: 'Кольє', href: '/uk/sribni-kolye/1' }
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      {children}
    </>
  );
}