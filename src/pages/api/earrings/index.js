export default async function handler(req, res) {
  const ROOT_URI = process.env.API_ROOT_URI;
  const API_KEY = process.env.API_KEY;

  try {
    const baseURL = `${ROOT_URI}/products/list?`
    const { categoryId = '76767FD2-9C64-40B5-BE48-BFAC32FB25C4', modifiedFrom = '2024-10-23 10:22:48', code } = req.body || {};
    const params = new URLSearchParams({ category_id: categoryId });

    if (code) {
      params.set('code', code);
    }

    if (modifiedFrom) {
      params.set('modified_from', modifiedFrom);
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
      const filteredProducts = data.products.filter(p => p.image_path); // Corrected filtering.
      return res.status(200).json(filteredProducts);
    } else {
      return res.status(404).json({ error: 'No products found' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}