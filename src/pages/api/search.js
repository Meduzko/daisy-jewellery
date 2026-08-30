import { searchProductsByTitle } from '../../lib/searchProducts';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST allowed' });
  }

  try {
    const { title, limit = 8, offset = 0 } = req.body || {};
    const query = String(title || '').trim();

    if (query.length < 2) {
      return res.status(400).json({ message: 'Query is too short', products: [] });
    }

    const result = await searchProductsByTitle({
      title: query,
      limit: Math.min(Number(limit) || 8, 20),
      offset: Number(offset) || 0
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Search proxy error:', error);
    return res.status(error.status || 500).json({
      message: 'Internal server error',
      products: []
    });
  }
}
