// Client fetch only: ring sizes of an article for the size dialog (POST /api/products).
export const getProductSizes = async (sku) => {
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku, category: 'ring' })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sizes');
    }

    const data = (await response.json()) || {};
    return Array.isArray(data.sizes) ? data.sizes : [];
  } catch (error) {
    console.error('Error in getProductSizes:', error);
    return [];
  }
};
