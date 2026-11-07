import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { CATALOG_CACHE_TAGS } from '../../../../lib/catalog/tags';

// On-demand cache purge after catalog changes in PostgreSQL (imports, manual edits,
// future admin panel). Without it, pages pick up changes within 900 s (ISR window).
//
//   curl -X POST http://localhost:3000/api/catalog/revalidate \
//        -H "Authorization: Bearer $CATALOG_REVALIDATE_SECRET"
//
// Disabled (404) unless CATALOG_REVALIDATE_SECRET is set.

export const dynamic = 'force-dynamic';

function isAuthorized(request, secret) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request) {
  const secret = process.env.CATALOG_REVALIDATE_SECRET;
  if (!secret) {
    return Response.json({ message: 'Not found' }, { status: 404 });
  }
  if (!isAuthorized(request, secret)) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  for (const tag of CATALOG_CACHE_TAGS) {
    revalidateTag(tag, { expire: 0 });
  }
  return Response.json({ revalidated: CATALOG_CACHE_TAGS, at: new Date().toISOString() });
}
