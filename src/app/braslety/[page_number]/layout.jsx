import Breadcrumbs from '../../../components/Breadcrumbs';

export default async function RingCategoryLayout({ children, params }) {
  const segments = [
    { name: 'Головна', href: '/' },
    { name: 'Браслети', href: '/braslety/1' },
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      {children}
    </>
  );
}
