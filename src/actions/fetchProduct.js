export async function fetchProduct({
  code,
  categoryId,
  limit = 20,
  offset = 0,
  paginated,
  sku,
  title,
  website_synch = 1,
  revalidate,
  throwOnError = false
}) {
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

  let response;
  let attempt = 0;
  const maxAttempts = 5;
  let lastError = null;

  while (attempt < maxAttempts) {
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'ApiKey': API_KEY,
          'Content-Type': 'application/json'
        },
        next: { revalidate: revalidate || 900 }
      });

      if (response.ok) break;

      const shouldRetry = response.status === 429 || (response.status >= 500 && response.status < 600);
      if (!shouldRetry) {
        console.error('Failed to fetch products', { status: response.status, url });
        if (paginated) return { products: [], hasMore: false };
        return [];
      }

      lastError = new Error(`API returned ${response.status}`);
    } catch (error) {
      lastError = error;
      console.error(`Fetch attempt ${attempt + 1} failed:`, error.message);
    }

    const backoffMs = 500 * Math.pow(2, attempt); // 500, 1000, 2000, 4000, 8000
    console.log(`Retrying in ${backoffMs}ms (attempt ${attempt + 1}/${maxAttempts})`);
    await new Promise((r) => setTimeout(r, backoffMs));
    attempt += 1;
  }

  if (!response || !response.ok) {
    const errorMsg = `Failed to fetch products after ${maxAttempts} retries: ${url}`;
    console.error(errorMsg);
    
    if (throwOnError) {
      throw new Error(errorMsg);
    }
    
    if (paginated) return { products: [], hasMore: false };
    return [];
  }

  try {
    const data = await response.json();
  
    if (paginated) {
      const hasMore = data?.products?.length === limit;
      return { products: data?.products || [], hasMore };
    }

    return data.products || [];
  } catch (error) {
    console.error('Failed to parse response:', error);
    if (throwOnError) {
      throw error;
    }
    if (paginated) {
      return { products: [], hasMore: false };
    }
    return [];
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
    const baseURL = isProduction() ? 'https://daisy-jewellery.com.ua' : '';

    const response = await fetch(`${baseURL}/api/products`, {
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

const isProduction = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'daisy-jewellery.com.ua';
};
