import crypto from 'crypto';

function sha256(value) {
	if (!value) return undefined;
	try {
		return crypto.createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex');
	} catch {
		return undefined;
	}
}

function normalizePhone(phone) {
	if (!phone) return undefined;
	const digits = String(phone).replace(/\D/g, '');
	return digits || undefined;
}

function parseCookies(cookieHeader) {
	const map = {};
	if (!cookieHeader) return map;
	cookieHeader.split(';').forEach(part => {
		const idx = part.indexOf('=');
		if (idx > -1) {
			const k = part.slice(0, idx).trim();
			const v = part.slice(idx + 1).trim();
			map[k] = decodeURIComponent(v);
		}
	});
	return map;
}

export async function sendFacebookEvent({
	eventName,
	eventTime = Math.floor(Date.now() / 1000),
	eventId,
	userData = {},
	customData = {},
	actionSource = 'website',
	eventSourceUrl,
	req // optional: to auto-populate ip, ua and cookies
}) {
	const pixelId = process.env.FACEBOOK_PIXEL_ID || process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
	const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
	const testEventCode = process.env.FB_TEST_EVENT_CODE; // optional

	if (!pixelId || !accessToken) {
		console.error('Facebook CAPI: Missing FACEBOOK_PIXEL_ID or FACEBOOK_ACCESS_TOKEN');
		return { ok: false, error: 'Missing configuration' };
	}

	let fbp; let fbc; let clientIp; let clientUa;
	if (req) {
		const cookies = parseCookies(req.headers?.cookie || '');
		fbp = cookies?._fbp;
		fbc = cookies?._fbc;
		clientUa = req.headers['user-agent'];
		const xff = req.headers['x-forwarded-for'];
		clientIp = (Array.isArray(xff) ? xff[0] : (xff || '')).split(',')[0].trim() || req.socket?.remoteAddress;
	}

	const user_data = {
		em: userData.em ? userData.em : sha256(userData.email),
		ph: userData.ph ? userData.ph : (userData.phone ? sha256(normalizePhone(userData.phone)) : undefined),
		fn: userData.fn ? userData.fn : (userData.firstName ? sha256(userData.firstName) : undefined),
		ln: userData.ln ? userData.ln : (userData.lastName ? sha256(userData.lastName) : undefined),
		fbp: userData.fbp || fbp,
		fbc: userData.fbc || fbc,
		client_ip_address: userData.client_ip_address || clientIp,
		client_user_agent: userData.client_user_agent || clientUa
	};

	const payload = {
		data: [
			{
				event_name: eventName,
				event_time: eventTime,
				event_id: eventId ? String(eventId) : undefined,
				action_source: actionSource,
				event_source_url: eventSourceUrl,
				user_data,
				custom_data: customData
			}
		],
		...(testEventCode ? { test_event_code: testEventCode } : {})
	};

	const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});

	if (!res.ok) {
		const txt = await res.text();
		console.error('Facebook CAPI error:', res.status, txt);
		return { ok: false, status: res.status, body: txt };
	}
	const body = await res.json();
	return { ok: true, body };
}
