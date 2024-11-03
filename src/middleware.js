// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);

  // Set a custom header with the device type
  const response = NextResponse.next();
  response.headers.set('x-device-type', isMobile ? 'mobile' : 'desktop');

  return response;
}

export const config = {
  // matcher: '/',
  matcher: '/:path*',
};
