import Hero from '../../components/Home/Hero/Hero';
import NewArrivals from '../../components/Home/NewArrivals/NewArrivals';
import Categories from '../../components/Home/Categories/Categories';
import CollectionSet from '../../components/Home/CollectionSet/CollectionSet';
import WhyDaisy from '../../components/Home/WhyDaisy/WhyDaisy';
import Instagram from '../../components/Home/Instagram/Instagram';
import SeoBlock from '../../components/Category/SeoBlock';
import categoryStyles from '../../components/Category/CategoryPage.module.css';
import { getHomeCopy } from '../../components/Home/copy';
import { getLogoJsonLd, getWebSiteJsonLd } from '../../helpers/getJsonLd';
import { getDefaultMetaData } from '../../helpers';

export const revalidate = 900;

export async function generateMetadata(props) {
  const params = await props.params;
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const meta = lang === 'ru'
    ? {
      title: 'Серебряные украшения 925 пробы — интернет-магазин Daisy Jewellery',
      description: 'Интернет-магазин серебряных украшений Daisy Jewellery: кольца, серьги, колье и браслеты из серебра 925 пробы. Бесплатная подарочная упаковка, доставка Новой Почтой по Украине.',
    }
    : {
      title: 'Срібні прикраси 925 проби — інтернет-магазин Daisy Jewellery',
      description: 'Інтернет-магазин срібних прикрас Daisy Jewellery: каблучки, сережки, кольє та браслети зі срібла 925 проби. Безкоштовне подарункове пакування, доставка Новою Поштою по Україні.',
    };
  return getDefaultMetaData({ pagePath: '', lang, ...meta });
}

export default async function Home(props) {
  const params = await props.params;
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const { seo } = getHomeCopy(lang);

  return (
    <>
      <main className="main">
        <Hero lang={lang} />
        <NewArrivals lang={lang} />
        <Categories lang={lang} />
        <CollectionSet lang={lang} />
        <WhyDaisy lang={lang} />
        <Instagram lang={lang} />
        {/* .page supplies the --cat-pad gutter and fonts SeoBlock's styles rely on */}
        <div className={categoryStyles.page}>
          <SeoBlock lang={lang} title={seo.title} lead={seo.lead} more={seo.more} />
        </div>
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([getLogoJsonLd(), getWebSiteJsonLd({ lang })]) }}
      />
    </>
  );
}
