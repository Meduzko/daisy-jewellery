'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * `true` while the media query matches. The server (and the hydration pass)
 * use `serverValue`, then the real value is applied without a mismatch.
 */
export default function useMediaQuery(query, serverValue = true) {
  const subscribe = useCallback(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query]
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue
  );
}
