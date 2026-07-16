import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = (4 - (base64.length % 4)) % 4;
    const paddedBase64 = base64 + '='.repeat(pad);
    const jsonPayload = atob(paddedBase64);
    const payload = JSON.parse(jsonPayload);
    const exp = payload.exp;
    if (!exp) return false;
    // Check if token expires in less than 10 seconds
    return Date.now() >= exp * 1000 - 10000;
  } catch (e) {
    console.error('Error parsing token expiration inside middleware:', e);
    return true;
  }
}

async function refreshTokens(refreshToken: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3837/api';
  try {
    const res = await fetch(`${apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  // Bypass redirects for Next.js prefetch requests to prevent ReadableStream crash
  if (request.headers.get('x-middleware-prefetch') || request.headers.get('purpose') === 'prefetch') {
    return NextResponse.next();
  }

  let token = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === '/';
  
  // Protect exact paths and their subpaths
  const protectedPaths = ['/dashboard', '/users', '/settings'];
  const isProtectedPath = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  let didRefresh = false;
  let newAccessToken = '';
  let newRefreshToken = '';

  // If token is present but expired, check if we can refresh it
  if (token && isTokenExpired(token)) {
    if (refreshToken) {
      const refreshed = await refreshTokens(refreshToken);
      if (refreshed && refreshed.accessToken) {
        token = refreshed.accessToken;
        newAccessToken = refreshed.accessToken;
        newRefreshToken = refreshed.refreshToken;
        didRefresh = true;
      } else {
        token = undefined; // refresh failed
      }
    } else {
      token = undefined; // no refresh token
    }
  }

  // If token is missing, but refresh token exists, try refreshing it
  if (!token && refreshToken) {
    const refreshed = await refreshTokens(refreshToken);
    if (refreshed && refreshed.accessToken) {
      token = refreshed.accessToken;
      newAccessToken = refreshed.accessToken;
      newRefreshToken = refreshed.refreshToken;
      didRefresh = true;
    }
  }

  if (isLoginPage) {
    if (token) {
      // Logged in user tries to visit login page -> redirect to dashboard
      const response = NextResponse.redirect(new URL('/dashboard', request.nextUrl));
      if (didRefresh) {
        response.cookies.set('accessToken', newAccessToken);
        if (newRefreshToken) response.cookies.set('refreshToken', newRefreshToken);
      }
      return response;
    }
  } else if (isProtectedPath) {
    if (!token) {
      // Guest user tries to visit protected path -> redirect to login
      const response = NextResponse.redirect(new URL('/', request.nextUrl));
      response.cookies.delete('accessToken');
      response.cookies.delete('refreshToken');
      return response;
    }
  }

  const response = NextResponse.next();
  if (didRefresh) {
    response.cookies.set('accessToken', newAccessToken);
    if (newRefreshToken) response.cookies.set('refreshToken', newRefreshToken);
  }
  return response;
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/users/:path*',
    '/settings/:path*',
  ],
};
