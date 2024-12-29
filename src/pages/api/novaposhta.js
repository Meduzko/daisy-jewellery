export default async function handler(req, res) {
  const { cityName, search } = req.query;

  if (!cityName) {
    return res.status(400).json({ error: 'City name is required' });
  }

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
        calledMethod: 'getWarehouses',
        methodProperties: {
          FindByString: search,
          CityName: cityName,
          Page: 1,
          Limit: 50,
          Language: 'UA',
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch departments');
    }

    const data = await response.json();
    const departments = data.data; // Extract departments
    return res.status(200).json(departments);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
