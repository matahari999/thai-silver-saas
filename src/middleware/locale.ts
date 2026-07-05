import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOCALES = ['en', 'th'] as const;
const DEFAULT_LOCALE = 'th';

export function getLocale(request: NextRequest): string {
  const pathLocale = LOCALES.find(loc =>
    request.nextUrl.pathname.startsWith(`/${loc}`)
  );
  if (pathLocale) return pathLocale;

  const acceptLang = request.headers.get('accept-language') || '';
  for (const lang of acceptLang.split(',')) {
    const code = lang.trim().split(';')[0].split('-')[0].toLowerCase();
    if (code === 'th') return 'th';
    if (code === 'en') return 'en';
  }

  return DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathHasLocale = LOCALES.some(loc =>
    pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`
  );

  if (pathHasLocale) return NextResponse.next();

  const locale = getLocale(request);
  const newUrl = new URL(`/${locale}${pathname}`, request.url);
  return NextResponse.redirect(newUrl);
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|icons|manifest.json|sw.js).*)'],
};
