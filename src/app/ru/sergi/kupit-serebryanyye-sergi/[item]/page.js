import { getItemTranslations } from '../../../../../dictionaries';
import ProductPageNew from '../../../../../components/ProductPage';
import { fetchProduct } from '../../../../../actions/fetchProduct';
import { fetchAllProducts } from '../../../../../actions/fetchAllProducts';
import { getProductMetadata } from '../../../../../helpers';
import { getProductJsonLd, getLogoJsonLd } from '../../../../../helpers/getJsonLd';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const [product] = await fetchProduct({
    code: params.item,
    categoryId: process.env.EARING_CATEGORY_ID,
  });

  if (!product) {
    return;
  }

  return getProductMetadata({ product, categoryName: 'sergi', lang: 'ru' });
}

export async function generateStaticParams() {
  try {
    const products = await fetchAllProducts({
      categoryId: process.env.EARING_CATEGORY_ID,
    });

    if (!products || !products.length) {
      return;
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

export default async function EarringItem({ params }) {
  const [product] = await fetchProduct({ code: params.item, categoryId: process.env.EARING_CATEGORY_ID });

  if (!product) {
    return notFound();
  }

  const productJsonLd = await getProductJsonLd(product, 'sergi/kupit-serebryanyye-sergi', { categoryName: 'sergi', lang: 'ru' });
  const logoJsonLd = getLogoJsonLd({ lang: 'ru' });
  const tk = await getItemTranslations({ lang: 'ru', categoryName: 'sergi', code: product.code });

  return (
    <>
      <ProductPageNew item={product} t={tk} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(logoJsonLd) }}
      />
    </>
  )
}
