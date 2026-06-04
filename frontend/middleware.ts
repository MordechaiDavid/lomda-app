import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/dashboard'];
const adminPaths = ['/dashboard/admin'];

function getTokenPayload(token: string): { id: string; email: string; role: string; exp: number } | null {
  try {
    const base64Payload = token.split('.')[1];
    const decoded = Buffer.from(base64Payload, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!protectedPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const tokenCookie = request.cookies.get('token');
  if (!tokenCookie) {
    const dest = request.nextUrl.clone();
    dest.pathname = '/login';
    return NextResponse.redirect(dest);
  }

  if (adminPaths.some((path) => pathname.startsWith(path))) {
    const payload = getTokenPayload(tokenCookie.value);
    if (!payload || payload.role !== 'admin') {
      const dest = request.nextUrl.clone();
      dest.pathname = '/dashboard';
      return NextResponse.redirect(dest);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*']
};
