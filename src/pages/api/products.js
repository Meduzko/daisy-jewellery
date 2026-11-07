import { getCatalogSource } from '../../lib/catalog/source';
import { toCategoryKey } from '../../lib/catalog/categories';

// Ring sizes for the client-side size dialog (src/actions/fetchProduct.js → getProductSizes).
// PostgreSQL: returns only { sizes } (no raw supplier data). DNTrade (rollback): proxies the API as before.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST allowed' });
  }

  if (getCatalogSource() === 'postgres') {
    try {
      const { sku, category } = req.body || {};
      const article = String(sku || '').trim().slice(0, 100);
      if (!article) {
        return res.status(400).json({ message: 'sku is required', products: [], sizes: [] });
      }
      const { getCatalogSizes } = await import('../../lib/catalog');
      const sizes = await getCatalogSizes(article, toCategoryKey(category) || 'ring');
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
      return res.status(200).json({ products: [], sizes });
    } catch (error) {
      console.error('Catalog sizes error:', error);
      return res.status(500).json({ message: 'Internal server error', products: [], sizes: [] });
    }
  }

  try {
    const { sku, categoryId} = req.body; 
    const ROOT_URI = process.env.API_ROOT_URI;
    const API_KEY = process.env.API_KEY;
    const baseURL = `${ROOT_URI}/products/list?`;
  
    const params = new URLSearchParams({
      category_id: categoryId,
      sku,
      limit: 20,
      offset: 0,
      website_synch: 0
    });
  
    const url = `${baseURL}${params.toString()}`;
  
    console.log('get products request url', url);
    const apiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'ApiKey': API_KEY,
        'Content-Type': 'application/json',
      }
    });

    console.log('get products request apiRes', apiRes);
  
    const data = await apiRes.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}