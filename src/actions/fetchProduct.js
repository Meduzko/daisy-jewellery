// export async function fetchProduct({ code, categoryId }) {
//   try {
//     console.log('fetchProduct action code', code);
//     const bodyString = JSON.stringify({
//       code,
//       categoryId,
//     });
  
//     console.log('fetchProduct action bodyString', bodyString);
    
//     // await new Promise(res => {
//     //   setTimeout(() => {
//     //     res();
//     //   }, 200);
//     // });

//     const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/product`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         code,
//         categoryId,
//       })
//     });

//     console.log('fetchProduct action after fetch', res);
  
//     if (!res.ok) {
//       throw new Error('Failed to fetch products');
//     }
  
//     const data = await res.json();
//     console.log('fetchProduct data json', data);
//     return data;
//   } catch (error) {
//     console.log(error);
//   }
// }



export async function fetchProduct({ code, categoryId, limit = 20, offset = 0, paginated }) {
  try {
    const ROOT_URI = process.env.API_ROOT_URI;
    const API_KEY = process.env.API_KEY;

    const baseURL = `${ROOT_URI}/products/list?`
    // const { categoryId, code, limit = 20, offset } = req.body || {};
    const params = new URLSearchParams({ category_id: categoryId, website_synch: 1, limit });

    if (offset) {
      params.set('offset', offset);
    }

    if (code) {
      params.set('code', Number(code));
    }

    const url = `${baseURL}${params.toString()}`;

    console.log('FETCH PRODUCT HANDLER URL', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'ApiKey': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const data = await response.json();
  
    if (paginated) {
      const hasMore = data.length === limit;
      return { products: data?.products, hasMore };
    } else if (data?.products) {
      return data.products;
    }
  } catch (error) {
    console.log(error);
  }
}
