import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cityName = searchParams.get('cityName');
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
          FindByString: cityName,
          Warehouse: 1,
          Page: 1,
          Limit: 50,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch departments');
    }

    const data = await response.json();
    const departments = data.data;
    return NextResponse.json(departments);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
