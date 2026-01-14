"use client";

import Link from 'next/link';

export default function TrackedLink(props) {
	const { href, track, children, onClick, ...rest } = props;

	const handleClick = (e) => {
		try {
			if (track && track.id) {
				const payload = { id: track.id, name: track.name, price: track.price };
				const body = JSON.stringify(payload);
				if (navigator.sendBeacon) {
					const blob = new Blob([body], { type: 'application/json' });
					navigator.sendBeacon('/api/capi-viewcontent', blob);
				} else {
					fetch('/api/capi-viewcontent', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body,
						keepalive: true
					});
				}
			}
		} catch {}
		if (onClick) onClick(e);
	};

	return (
		<Link href={href} onClick={handleClick} {...rest}>
			{children}
		</Link>
	);
}


