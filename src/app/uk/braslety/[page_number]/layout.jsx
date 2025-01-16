import Breadcrumbs from '../../../../components/Breadcrumbs';

export default async function RingCategoryLayout({ children, params }) {
  const segments = [
    { name: 'Головна', href: '/uk' },
    { name: 'Браслети', href: '/uk/braslety/1' }
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      {children}
    </>
  );
}