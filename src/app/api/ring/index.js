export const fetchRings = async () => {
  const ROOT_URI = 'https://api.dntrade.com.ua';
  const categoryId = '19752BCE-1FE4-4941-B53C-9A42DF10888B';
  const storeId = '833a605c-fa32-46b6-9735-067239c68634';
  const params = `products/list?category_id=${categoryId}&store_id=${storeId}`;
  const url = 'https://api.dntrade.com.ua/products/list?store_id=833a605c-fa32-46b6-9735-067239c68634&category_id=D085B1A4-F45B-412D-B6B4-581EC8AC9AF4';
  const url1 = `${ROOT_URI}/${params}`;

  const res = await fetch(url1, {
    method: 'POST',
    headers: {
      // 'Content-Type': 'application/json',
      'ApiKey': '0mf6c8e7bc3b79l9wi536594icvvgzfejexbdtvzu9v6y10eszm9x3',
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

  // console.log('response', response);

  // return response;
};
