import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/dashboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    const token = request.cookies.get('token');

    if (!token) {
      const destination = request.nextUrl.clone();
      destination.pathname = '/login';
      return NextResponse.redirect(destination);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*']
};
