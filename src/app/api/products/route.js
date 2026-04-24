import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { sku, categoryId } = await request.json();
    const ROOT_URI = process.env.API_ROOT_URI;
    const API_KEY = process.env.API_KEY;
    const baseURL = `${ROOT_URI}/products/list?`;

    const params = new URLSearchParams({
      category_id: categoryId,
      sku,
      limit: 20,
      offset: 0,
      website_synch: 0,
    });

    const url = `${baseURL}${params.toString()}`;

    console.log('get products request url', url);
    const apiRes = await fetch(url, {
      method: 'POST',
      headers: {
        ApiKey: API_KEY,
        'Content-Type': 'application/json',
      },
    });

    console.log('get products request apiRes', apiRes);

    const data = await apiRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
