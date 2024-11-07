export default async function handler(req, res) {
  console.log('PRODUCT HANDLER');
  const ROOT_URI = process.env.API_ROOT_URI;
  const API_KEY = process.env.API_KEY;

  try {
    const baseURL = `${ROOT_URI}/products/list?`
    console.log('PRODUCT HANDLER INSIDE TRY');
    const { categoryId, code, limit = 20, offset } = req.body || {};
    const params = new URLSearchParams({ category_id: categoryId, website_synch: 1, limit });

    if (offset) {
      params.set('offset', offset);
    }

    if (code) {
      params.set('code', Number(code));
    }

    const url = `${baseURL}${params.toString()}`;

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

    const data = await response.json(); // Corrected here: Parse the response correctly.

    if (data?.products) {
      return res.status(200).json(data.products);
    } else {
      return res.status(404).json({ error: 'No products found' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}