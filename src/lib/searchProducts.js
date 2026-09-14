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
  offset = 0
} = {}) => {
  const query = String(title || '').trim();

  if (query.length < 2) {
    return { products: [], hasMore: false };
  }

  const ROOT_URI = process.env.API_ROOT_URI;
  const API_KEY = process.env.API_KEY;

  if (!ROOT_URI || !API_KEY) {
    const error = new Error('DNTrade API is not configured');
    error.status = 500;
    throw error;
  }

  const params = new URLSearchParams({
    title: query,
    website_synch: '1',
    limit: String(limit),
    offset: String(offset)
  });

  const response = await fetch(`${ROOT_URI}/products/list?${params.toString()}`, {
    method: 'POST',
    headers: {
      ApiKey: API_KEY,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = new Error('Failed to search products');
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const products = Array.isArray(data?.products) ? data.products.map(toSearchResult) : [];

  return {
    products,
    hasMore: products.length === limit
  };
};
