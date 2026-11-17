import { resolveProductCategory } from '../helpers/resolveProductCategory';
import { applyProductDiscount } from '../helpers/productPricing';

const toSearchResult = (product) => {
  const discounted = applyProductDiscount(product);

  return {
    product_id: discounted.product_id,
    title: discounted.title,
    price: discounted.price,
    originalPrice: discounted.originalPrice,
    salePrice: discounted.salePrice,
    catalogSalePrice: discounted.catalogSalePrice,
    code: discounted.code,
    sku: discounted.sku,
    image_path: discounted.image_path,
    images: discounted.images,
    short_description: discounted.short_description,
    category: resolveProductCategory(product),
    tags: discounted.tags,
    badges: discounted.badges
  };
};

export const searchProductsByTitle = async ({
  title,
  limit = 20,
  offset = 0,
  locale = 'uk'
} = {}) => {
  const query = String(title || '').trim();

  if (query.length < 2) {
    return { products: [], hasMore: false };
  }

  const { searchCatalog } = await import('./catalog');
  const result = await searchCatalog(query.slice(0, 100), { limit, offset, locale });
  return { products: result.products.map(toSearchResult), hasMore: result.hasMore };
};
