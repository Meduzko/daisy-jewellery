export async function fetchProduct({
  code,
  categoryId,
  limit = 20,
  offset = 0,
  paginated,
  sku,
  title,
  website_synch = 1,
  revalidate
}) {
  try {
    const ROOT_URI = process.env.API_ROOT_URI;
    const API_KEY = process.env.API_KEY;
    const baseURL = `${ROOT_URI}/products/list?`;
  
    const params = new URLSearchParams({
      category_id: categoryId,
      limit,
      offset
    });

    if (website_synch) {
      params.set('website_synch', website_synch);
    }

    if (code) {
      params.set('code', Number(code));
    }

    if (title) {
      params.set('title', title);
    }

    if (sku) {
      params.set('sku', sku);
    }

    const url = `${baseURL}${params.toString()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'ApiKey': API_KEY,
        'Content-Type': 'application/json'
      },
      next: { revalidate: revalidate || 900 }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const data = await response.json();
  
    if (paginated) {
      const hasMore = data?.products?.length === limit;
      return { products: data?.products || [], hasMore };
    }

    return data.products;
  } catch (error) {
    console.error(error);
  }
}

// Server side fetch only.
export const getServerProductSizes = async (sku, categoryId) => {
  const products = await fetchProduct({
    sku,
    categoryId,
    website_synch: 0
  });

  if (!Array.isArray(products) || products?.length === 0) {
    console.warn('No products returned for SKU:', sku);
    return [];
  }

  const sizes = getSizes(products);

  return sizes;
};


// Client fetch only.
export const getProductSizes = async (sku, categoryId) => {
  try {
    const response = await fetch(`/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sku,
        categoryId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const data = await response.json() || {};
    const products = data?.products;

    if (!Array.isArray(products) || products?.length === 0) {
      console.warn('No products returned for SKU:', sku);
      return [];
    }

    const sizes = getSizes(products);

    return sizes;
  } catch (error) {
    console.error('Error in getProductSizes:', error);
    return [];
  }
};

const getSizes = (products) => {
  const sizes = [];

  for (const product of products) {
    const sizeTag = product.tags?.find(tag => tag.title === 'розмір');

    if (!sizeTag || !Array.isArray(sizeTag.items)) continue;

    const productSizes = sizeTag.items
      .map(item => {
        const rawTitle = item?.title?.replace(',', '.');
        const parsedSize = parseFloat(rawTitle);
        return !isNaN(parsedSize) ? parsedSize : null;
      })
      .filter(size => size !== null);

    sizes.push(...productSizes);
  }

  if (sizes.length) {
    return [...new Set(sizes)].sort((a, b) => a - b);
  }

  return sizes;
};
