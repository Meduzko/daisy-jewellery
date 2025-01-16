import Breadcrumbs from '../../../../components/Breadcrumbs';

export default async function RingCategoryLayout({ children, params }) {
  const segments = [
    { name: 'Главная', href: '/ru' },
    { name: 'Кольца', href: '/ru/koltsa/1' }
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      {children}
    </>
  );
}