import { NextResponse } from 'next/server';
import { getCanonicalRedirect } from './helpers/seo.js';

export function middleware(request) {
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
  const { pathname } = request.nextUrl;

  // Internal Next.js assets, static files and /api are served as is. Everything
  // else gets one 301 to its canonical form (tracking params, locale prefix, slugs).
  if (!(pathname.startsWith('/_next') || pathname.includes('.') || pathname.startsWith('/api'))) {
    const target = getCanonicalRedirect(request.nextUrl);
    if (target) return NextResponse.redirect(target, { status: 301 });
  }

  const response = NextResponse.next();
  response.headers.set('x-device-type', isMobile ? 'mobile' : 'desktop');
  return response;
}

export const config = {
  matcher: '/:path*',
};
