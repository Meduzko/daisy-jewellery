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
  try {
    const ROOT_URI = process.env.API_ROOT_URI;
    const API_KEY = process.env.API_KEY;
    if (!ROOT_URI || !API_KEY || !categoryId) {
      return [];
    }

    const params = new URLSearchParams({
      category_id: categoryId,
      website_synch: 1
    });

    const baseURL = `${ROOT_URI}/products/list?`;
    const url = `${baseURL}${params.toString()}`;

    let res;
    let attempt = 0;
    const maxAttempts = 3;
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
      if (!shouldRetry) return [];
      const backoffMs = 300 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, backoffMs));
      attempt += 1;
    }

    if (!res || !res.ok) return [];
  
    const data = await res.json();

    return data.products;
    // return data;
  } catch (error) {
    console.log(error);
    return [];
  }
}
