export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST allowed' });
  }

  try {
    const { sku, categoryId} = req.body; 
    const ROOT_URI = process.env.API_ROOT_URI;
    const baseURL = `${ROOT_URI}/products/list?`;
  
    const params = new URLSearchParams({
      category_id: categoryId,
      sku,
      limit: 20,
      offset: 0,
      website_synch: 0
    });
  
    const url = `${baseURL}${params.toString()}`;
  
    const apiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'ApiKey': process.env.API_KEY,
        'Content-Type': 'application/json',
      }
    });
  
    const data = await apiRes.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}