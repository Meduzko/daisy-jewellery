import { headers } from 'next/headers';
import Banner from '../../components/Banner/page';
import RingsSlider from '../../components/RingsSlider/index';
import Categories from '../../components/Categories/categories';
import HowToOreder from '../../components/HowToOrder/page';
import WhyWe from '../../components/WhyWe/WhyWe';
import { getLogoJsonLd, getBussinesJsonLd, getWebSiteJsonLd } from '../../helpers/getJsonLd';

export default async function Home({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const deviceType = headers().get('x-device-type');
  const isMobile = deviceType === 'mobile';
  const logoJsonLd = getLogoJsonLd({ lang });
  const structuredDataBussines = getBussinesJsonLd();
  const structuredDataWebSite = getWebSiteJsonLd({ lang });

  return (
    <>
      <main className="main">
        <Banner lang={lang} />
        <RingsSlider lang={lang} />
        <Categories lang={lang} />
        <WhyWe lang={lang} />
        <HowToOreder isMobile={isMobile} lang={lang} />
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(logoJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredDataBussines) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredDataWebSite) }}
      />
    </>
  );
}


