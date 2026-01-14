import { sendFacebookEvent } from '../../lib/facebookCapi';

export default async function handler(req, res) {
	try {
		if (req.method !== 'POST') {
			return res.status(405).json({ ok: false, error: 'Method not allowed' });
		}

		const { id, name, price, eventId } = req.body || {};
		if (!id) {
			return res.status(400).json({ ok: false, error: 'Missing id' });
		}

		const value = Number(price) || 0;
		const result = await sendFacebookEvent({
			eventName: 'ViewContent',
			eventId: eventId ? String(eventId) : undefined,
			customData: {
				currency: 'UAH',
				value,
				content_type: 'product',
				contents: [{ id, quantity: 1, item_price: value }]
			},
			eventSourceUrl: process.env.SITE_DOMAIN,
			req
		});

		return res.status(result.ok ? 200 : 500).json(result);
	} catch (e) {
		console.error('capi-viewcontent error', e);
		return res.status(500).json({ ok: false, error: 'Internal Server Error' });
	}
}


