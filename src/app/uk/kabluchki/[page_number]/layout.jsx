import Breadcrumbs from '../../../../components/Breadcrumbs';

export default async function RingCategoryLayout({ children, params }) {
  const segments = [
    { name: 'Головна', href: '/uk' },
    { name: 'Каблучки', href: '/uk/kabluchki/1' }
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      {children}
    </>
  );
}