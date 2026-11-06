import Hero from '../../components/Home/Hero/Hero';
import NewArrivals from '../../components/Home/NewArrivals/NewArrivals';
import Categories from '../../components/Home/Categories/Categories';
import CollectionSet from '../../components/Home/CollectionSet/CollectionSet';
import WhyDaisy from '../../components/Home/WhyDaisy/WhyDaisy';
import Instagram from '../../components/Home/Instagram/Instagram';
import { getLogoJsonLd, getBussinesJsonLd, getWebSiteJsonLd } from '../../helpers/getJsonLd';

export const revalidate = 900;

export default async function Home(props) {
  const params = await props.params;
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const logoJsonLd = getLogoJsonLd({ lang });
  const structuredDataBussines = getBussinesJsonLd();
  const structuredDataWebSite = getWebSiteJsonLd({ lang });

  return (
    <>
      <main className="main">
        <Hero lang={lang} />
        <NewArrivals lang={lang} />
        <Categories lang={lang} />
        <CollectionSet lang={lang} />
        <WhyDaisy lang={lang} />
        <Instagram lang={lang} />
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
