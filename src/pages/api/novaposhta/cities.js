export default async function handler(req, res) {
  const { cityName } = req.query;

  const API_KEY = process.env.NOVA_POSHTA_API_KEY;

  try {
    const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: API_KEY,
        modelName: 'AddressGeneral',
        calledMethod: 'getSettlements',
        methodProperties: {
          FindByString : cityName,
          Warehouse: 1,
          Page : 1,
          Limit : 50,
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch departments');
    }

    const data = await response.json();
    const departments = data.data; // Extract departments
    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
