export async function fetchProduct({ code, categoryId, limit = 20, offset = 0, paginated, sku, title }) {
  try {
    const ROOT_URI = process.env.API_ROOT_URI;
    const API_KEY = process.env.API_KEY;
    const baseURL = `${ROOT_URI}/products/list?`;
  
    const params = new URLSearchParams({
      category_id: categoryId,
      website_synch: 1,
      limit,
      offset
    });

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
      next: { revalidate: 1800 }
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
    console.log(error);
  }
}
