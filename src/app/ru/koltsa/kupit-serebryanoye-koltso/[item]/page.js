import { getItemTranslations } from '../../../../../dictionaries';
import Breadcrumbs from '../../../../../components/Breadcrumbs';
import ProductPageNew from '../../../../../components/ProductPage';
import { fetchProduct, getServerProductSizes } from '../../../../../actions/fetchProduct';
import { fetchAllProducts } from '../../../../../actions/fetchAllProducts';
import { getProductMetadata } from '../../../../../helpers';
import { getProductJsonLd, getLogoJsonLd } from '../../../../../helpers/getJsonLd';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  if (!params?.item) {
    return notFound();
  }

  try {
    const response = await fetchProduct({
      code: params.item,
      categoryId: process.env.RING_CATEGORY_ID,
    });

    if (!response || response?.length === 0) {
      return notFound();
    }

    const [product] = response;
    return getProductMetadata({ product, categoryName: 'koltsa', lang: 'ru' });
  } catch (error) {
    console.error('Error generating koltsa metadata:', error);
    return notFound();
  }
}

export async function generateStaticParams() {
  try {
    const products = await fetchAllProducts({
      categoryId: process.env.RING_CATEGORY_ID,
    });

    if (!products || !products?.length) {
      return notFound();
    }

    const productCodes = products.map((product) => ({
      item: product.code.toString(),
    }));

    return productCodes;
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    return [];
  }
}

export default async function Page({ params }) {
  const [product] = await fetchProduct({
    code: params.item,
    categoryId: process.env.RING_CATEGORY_ID,
  });

  if (!product) {
    return notFound();
  }

  // Fetch prodcuts for sizes
  const productSizes = await getServerProductSizes(product.sku, process.env.RING_CATEGORY_ID);

  const productJsonLd = await getProductJsonLd(product, 'koltsa/kupit-serebryanoye-koltso', { categoryName: 'koltsa', lang: 'ru' });
  const logoJsonLd = getLogoJsonLd({ lang: 'ru' });
  const tk = await getItemTranslations({ lang: 'ru', categoryName: 'koltsa', code: product.code });

  const segments = [
    { name: 'Главная', href: '/' },
    { name: 'Кольца', href: '/ru/koltsa/1' },
    { name: tk?.title || product?.title, href: `/koltsa/kupit-serebryanoye-koltso/${params.item}` },
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      <ProductPageNew item={product} productSizes={productSizes} t={tk} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(logoJsonLd) }}
      />
    </>
  );
}
