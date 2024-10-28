export const fetchRings = async () => {
  const ROOT_URI = process.env.API_ROOT_URI;
  const API_KEY = process.env.API_KEY;

  const categoryId = '19752BCE-1FE4-4941-B53C-9A42DF10888B';
  const storeId = '833a605c-fa32-46b6-9735-067239c68634';
  const params = `products/list?category_id=${categoryId}&store_id=${storeId}`;
  const url = `${ROOT_URI}/${params}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'ApiKey': API_KEY,
    }
  });

  if (!res.ok) {
    console.error('Something went wrong');
  }

  const response = await res.json();

  if (response.products) {
    const filteredRes = response.products.filter(p => p.image_path);

    return filteredRes;
  }
};
