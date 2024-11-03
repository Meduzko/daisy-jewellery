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
      })
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
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        categoryId
        // limit: 2,
        // offset: 0
      })
    });
  
    if (!res.ok) {
      throw new Error('Failed to fetch products');
    }
  
    const data = await res.json();
  
    return data;
  } catch (error) {
    console.log(error);
  }
}
