export async function fetchProducts({ offset, limit, categoryId }) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        categoryId,
        limit,
        offset
      }),
      next: { revalidate: 1800 }
    });
  
    if (!res.ok) {
      throw new Error('Failed to fetch products');
    }
  
    const data = await res.json();
  
    const hasMore = data.length === limit;
  
    return { products: data, hasMore };
  } catch (error) {
    console.log(error);
  }
}


export async function fetchAllProducts({ categoryId }) {
  try {
    const ROOT_URI = process.env.API_ROOT_URI;
    const API_KEY = process.env.API_KEY;

    const params = new URLSearchParams({
      category_id: categoryId,
      website_synch: 1
    });

    const baseURL = `${ROOT_URI}/products/list?`;
    const url = `${baseURL}${params.toString()}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'ApiKey': API_KEY,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 1800 }
    });
  
    if (!res.ok) {
      throw new Error('Failed to fetch products');
    }
  
    const data = await res.json();

    return data.products;
    // return data;
  } catch (error) {
    console.log(error);
  }
}
