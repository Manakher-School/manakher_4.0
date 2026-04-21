import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side login route that authenticates with PocketBase,
 * sets the pb_auth cookie via Set-Cookie header, and redirects.
 *
 * This is the most reliable way to handle authentication because:
 * 1. No CORS issues — the browser POSTs to the same origin
 * 2. Cookie is set via Set-Cookie header in a redirect response — guaranteed to work on all browsers
 * 3. No client-side PocketBase SDK call needed — eliminates dependency on client-side JS for auth
 * 4. Works on mobile devices accessing via IP address where document.cookie and fetch() Set-Cookie can fail
 *
 * Flow:
 * 1. Login form POSTs email + password + locale to /api/auth/login
 * 2. This route authenticates with PocketBase server-side
 * 3. On success: sets pb_auth cookie via Set-Cookie header, redirects to dashboard
 * 4. On failure: redirects back to login page with error query param
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const locale = (formData.get("locale") as string) || "ar";

    if (!email || !password) {
      const loginUrl = new URL(`/${locale}/login?error=missing`, request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticate with PocketBase server-side
    const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";
    const authRes = await fetch(`${pbUrl}/api/collections/users/auth-with-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity: email, password }),
    });

    if (!authRes.ok) {
      const loginUrl = new URL(`/${locale}/login?error=invalid`, request.url);
      return NextResponse.redirect(loginUrl);
    }

    const authData = await authRes.json();
    const token = authData.token;
    const record = authData.record;

    if (!token || !record?.role) {
      const loginUrl = new URL(`/${locale}/login?error=invalid`, request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Determine dashboard path based on role
    const role = record.role as string;
    const dashboardPath = `/${locale}/dashboard/${role}`;
    const redirectUrl = new URL(dashboardPath, request.url);

    // Set the pb_auth cookie via Set-Cookie header and redirect
    const cookieValue = encodeURIComponent(JSON.stringify({ token, record }));
    const response = NextResponse.redirect(redirectUrl);

    response.cookies.set({
      name: "pb_auth",
      value: cookieValue,
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: "lax",
      httpOnly: false,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    const loginUrl = new URL("/ar/login?error=server", request.url);
    return NextResponse.redirect(loginUrl);
  }
}