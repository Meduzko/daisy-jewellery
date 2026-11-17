import { toCategoryKey } from '../../lib/catalog/categories';

// Ring sizes for the client-side size dialog (src/actions/fetchProduct.js → getProductSizes).
// Returns only { sizes } (no raw supplier data).
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST allowed' });
  }

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
