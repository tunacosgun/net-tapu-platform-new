import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── Route classification ────────────────────────────────────────────────

const ADMIN_ROLES = new Set(['admin', 'superadmin']);

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function isProtectedPath(pathname: string): boolean {
  // Auctions are publicly viewable; only bid/payment actions require auth and
  // are enforced server-side. Watching a live auction must not paywall users.
  return (
    pathname.startsWith('/profile') ||
    isAdminPath(pathname)
  );
}

// ── Middleware ───────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.get('nettapu_session')?.value === '1';

  // No session → redirect to login
  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes: check role cookie (httpOnly, set by /api/auth/session)
  // This is a frontend UX gate — backend RolesGuard is authoritative.
  if (isAdminPath(pathname)) {
    const role = request.cookies.get('nettapu_role')?.value ?? '';
    if (!ADMIN_ROLES.has(role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// ── Route matcher ───────────────────────────────────────────────────────
// Static assets (_next, favicon, images) excluded by matcher config.
// /login and / are NOT matched → no infinite redirect loops.

export const config = {
  matcher: ['/profile/:path*', '/admin/:path*'],
};
