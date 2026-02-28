export async function fetchProducts({ offset, limit, categoryId }) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.SITE_DOMAIN || '';
    const res = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        categoryId,
        limit,
        offset
      }),
      next: { revalidate: 900 }
    });
  
    if (!res.ok) {
      return { products: [], hasMore: false };
    }
  
    const data = await res.json();
  
    const products = data?.products || [];
    const hasMore = products.length === limit;
  
    return { products, hasMore };
  } catch (error) {
    console.log(error);
    return { products: [], hasMore: false };
  }
}


export async function fetchAllProducts({ categoryId }) {
  const ROOT_URI = process.env.API_ROOT_URI;
  const API_KEY = process.env.API_KEY;
  if (!ROOT_URI || !API_KEY || !categoryId) {
    return [];
  }

  const allProducts = [];
  const limit = 100;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const params = new URLSearchParams({
        category_id: categoryId,
        website_synch: 1,
        limit: limit.toString(),
        offset: offset.toString()
      });

      const baseURL = `${ROOT_URI}/products/list?`;
      const url = `${baseURL}${params.toString()}`;

      let res;
      let attempt = 0;
      const maxAttempts = 5;
      
      while (attempt < maxAttempts) {
        res = await fetch(url, {
          method: 'POST',
          headers: {
            'ApiKey': API_KEY,
            'Content-Type': 'application/json'
          },
          next: { revalidate: 900 }
        });

        if (res.ok) break;

        const shouldRetry = res.status === 429 || (res.status >= 500 && res.status < 600);
        if (!shouldRetry) {
          console.error('fetchAllProducts failed with status:', res.status);
          return allProducts;
        }
        
        const backoffMs = 500 * Math.pow(2, attempt);
        console.log(`fetchAllProducts retry in ${backoffMs}ms (attempt ${attempt + 1}/${maxAttempts})`);
        await new Promise((r) => setTimeout(r, backoffMs));
        attempt += 1;
      }

      if (!res || !res.ok) {
        console.error('fetchAllProducts failed after retries');
        return allProducts;
      }

      const data = await res.json();
      const products = data?.products || [];
      
      allProducts.push(...products);
      
      hasMore = products.length === limit;
      offset += limit;

      if (hasMore) {
        await new Promise((r) => setTimeout(r, 200));
      }
    } catch (error) {
      console.error('fetchAllProducts error:', error);
      return allProducts;
    }
  }

  return allProducts;
}
