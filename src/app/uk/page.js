import { headers } from 'next/headers';
import Banner from '../../components/Banner/page';
import RingsSlider from '../../components/RingsSlider/index';
import Categories from '../../components/Categories/categories';
import HowToOreder from '../../components/HowToOrder/page';
import WhyWe from '../../components/WhyWe/WhyWe';
import { getLogoJsonLd, getBussinesJsonLd, getWebSiteJsonLd } from '../../helpers/getJsonLd';

export default function Home() {
  const deviceType = headers().get('x-device-type');
  const isMobile = deviceType === 'mobile';
  const logoJsonLd = getLogoJsonLd();
  const structuredDataBussines = getBussinesJsonLd();
  const structuredDataWebSite = getWebSiteJsonLd();

  return (
    <>
      <main className="main">
        <Banner />
        <RingsSlider />
        <Categories />
        <WhyWe />
        <HowToOreder isMobile={isMobile} />
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
      {/* <ClientJsonLd id="structured-data-organzation" jsonData={structuredDataOrg} /> */}
      {/* <ClientJsonLd id="structured-data-localBusiness" jsonData={structuredDataBussines} /> */}
      {/* <ClientJsonLd id="structured-data-webSite" jsonData={structuredDataWebSite} /> */}
    </>
  );
}
