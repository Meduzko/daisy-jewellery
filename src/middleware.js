// middleware.ts
import { NextResponse } from 'next/server';

// export function middleware(request) {
//   const userAgent = request.headers.get('user-agent') || '';
//   const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);

//   if (request.nextUrl.pathname === '/') {
//     const url = request.nextUrl.clone();
//     url.pathname = '/uk';
//     return NextResponse.redirect(url);
//   }

//   // Pass through everything else without a custom redirect
//   const response = NextResponse.next();
//   response.headers.set('x-device-type', isMobile ? 'mobile' : 'desktop');
//   return response;
// }

export function middleware(request) {
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);

  const { pathname } = request.nextUrl;

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

  // 2) If path already starts with /uk or /ru, just pass through
  if (pathname.startsWith('/uk') || pathname.startsWith('/ru')) {
    const response = NextResponse.next();
    response.headers.set('x-device-type', isMobile ? 'mobile' : 'desktop');
    return response;
  }

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
