import { NextResponse } from 'next/server';

const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
  'msclkid',
  'ref',
];

function hasTrackingParams(searchParams) {
  return TRACKING_PARAMS.some(param => searchParams.has(param));
}

function stripTrackingParams(url) {
  const cleanUrl = new URL(url);
  TRACKING_PARAMS.forEach(param => cleanUrl.searchParams.delete(param));
  return cleanUrl;
}

export function middleware(request) {
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
  const { pathname, searchParams } = request.nextUrl;

  // 1) Ignore internal Next.js assets, static files, or /api
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname.startsWith('/api')
  ) {
    const response = NextResponse.next();
    response.headers.set('x-device-type', isMobile ? 'mobile' : 'desktop');
    return response;
  }

  // 2) Strip tracking params and redirect to clean URL (301)
  // This prevents duplicate content from UTM/tracking params
  if (hasTrackingParams(searchParams)) {
    const cleanUrl = stripTrackingParams(request.nextUrl);
    return NextResponse.redirect(cleanUrl, { status: 301 });
  }

  // 3) If path already starts with /uk or /ru, just pass through
  if (pathname.startsWith('/uk') || pathname.startsWith('/ru')) {
    const response = NextResponse.next();
    response.headers.set('x-device-type', isMobile ? 'mobile' : 'desktop');
    return response;
  }

  // 4) Redirect root and non-localized paths to /uk
  const newUrl = request.nextUrl.clone();
  if (pathname === '/') {
    newUrl.pathname = '/uk';
  } else {
    newUrl.pathname = '/uk' + pathname;
  }

  return NextResponse.redirect(newUrl, { status: 301 });
}

export const config = {
  matcher: '/:path*',
};
