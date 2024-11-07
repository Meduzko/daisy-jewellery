import Banner from '../components/Banner/page';
import RingsSlider from '../components/RingsSlider/index';
import Categories from '../components/Categories/categories';
import HowToOreder from '../components/HowToOrder/page';
import WhyWe from '../components/WhyWe/WhyWe';
import { headers } from 'next/headers';

export default function Home() {
  const deviceType = headers().get('x-device-type');
  const isMobile = deviceType === 'mobile';

  return (
    <>
      <main className="main">
        <Banner />
        <RingsSlider />
        <Categories />
        <WhyWe />
        <HowToOreder isMobile={isMobile} />
      </main>
    </>
  );
}
