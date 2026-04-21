import { NextRequest, NextResponse } from "next/server";
import type { NextProxy } from "next/server";

const PB_AUTH_COOKIE = "pb_auth";
const LOCALES = ["ar", "en"] as const;
type Locale = (typeof LOCALES)[number];
const DEFAULT_LOCALE: Locale = "ar";

const publicPathSegments = ["login"];

// Role -> dashboard path suffix (without locale prefix)
const rolePaths: Record<string, string> = {
  "/dashboard/admin": "admin",
  "/dashboard/teacher": "teacher",
  "/dashboard/student": "student",
};

function getLocaleFromPathname(pathname: string): Locale | null {
  const segment = pathname.split("/")[1];
  return LOCALES.includes(segment as Locale) ? (segment as Locale) : null;
}

function stripLocale(pathname: string, locale: Locale): string {
  return pathname.slice(`/${locale}`.length) || "/";
}

function getAuthFromCookie(
  request: NextRequest
): { token: string; role: string; expired: boolean } | null {
  const authCookie = request.cookies.get(PB_AUTH_COOKIE);
  if (!authCookie?.value) return null;

  try {
    const decoded = decodeURIComponent(authCookie.value);
    const authData = JSON.parse(decoded);
    const token = authData?.token;
    const role = authData?.record?.role;

    if (!token || !role) return null;

    const payload = JSON.parse(atob(token.split(".")[1]));
    const expired = payload.exp ? payload.exp * 1000 < Date.now() : false;

    return { token, role, expired };
  } catch {
    return null;
  }
}

export const proxy: NextProxy = (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // --- Step 0: Bypass API routes entirely ---
  // API routes don't need locale prefixes or auth checks.
  // They must be handled BEFORE locale detection, otherwise the proxy
  // would redirect /api/auth/set-cookie to /ar/api/auth/set-cookie
  // which doesn't match any Next.js API route.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // --- Step 1: Locale detection / redirect ---
  const locale = getLocaleFromPathname(pathname);

  if (!locale) {
    // No locale prefix — redirect to default locale
    const redirectUrl = new URL(
      `/${DEFAULT_LOCALE}${pathname}`,
      request.url
    );
    return NextResponse.redirect(redirectUrl);
  }

  // --- Step 2: Strip locale to get the logical path ---
  const logicalPath = stripLocale(pathname, locale);

  // Allow public paths (login)
  if (publicPathSegments.some((seg) => logicalPath.startsWith(`/${seg}`))) {
    return NextResponse.next();
  }

  // --- Step 3: Auth check ---
  const auth = getAuthFromCookie(request);

  if (!auth || auth.expired) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // --- Step 4: Role-based route enforcement ---
  for (const [pathPrefix, requiredRole] of Object.entries(rolePaths)) {
    if (logicalPath.startsWith(pathPrefix) && auth.role !== requiredRole) {
      const correctPath = `/${locale}/dashboard/${auth.role}`;
      return NextResponse.redirect(new URL(correctPath, request.url));
    }
  }

  return NextResponse.next();
};

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
