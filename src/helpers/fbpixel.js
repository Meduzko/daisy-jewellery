// Client-side Meta Pixel helper
export function trackFacebookEvent(eventName, params = {}, eventId) {
	if (typeof window === 'undefined') return;
	try {
		if (!window.fbq) return;
		if (eventId) {
			window.fbq('track', eventName, params, { eventID: String(eventId) });
		} else {
			window.fbq('track', eventName, params);
		}
	} catch (e) {
		// no-op
	}
}

export function getFacebookEventId(defaultId) {
	if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
		return window.crypto.randomUUID();
	}
	return String(defaultId || Date.now());
}


