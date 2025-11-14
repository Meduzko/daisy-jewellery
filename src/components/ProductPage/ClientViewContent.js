"use client";

import { useEffect } from 'react';
import { trackFacebookEvent } from '../../helpers/fbpixel';

export default function ClientViewContent({ id, name, price }) {
	useEffect(() => {
		if (!id) return;
		try {
			trackFacebookEvent('ViewContent', {
				content_ids: [id],
				content_type: 'product',
				content_name: name,
				value: Number(price) || 0,
				currency: 'UAH'
			});
		} catch {}
		// run once
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);
	return null;
}


