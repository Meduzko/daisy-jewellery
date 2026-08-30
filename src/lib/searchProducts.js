import { resolveProductCategory } from '../helpers/resolveProductCategory';

const toSearchResult = (product) => ({
  product_id: product.product_id,
  title: product.title,
  price: product.price,
  code: product.code,
  sku: product.sku,
  image_path: product.image_path,
  images: product.images,
  short_description: product.short_description,
  category: resolveProductCategory(product)
});

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
