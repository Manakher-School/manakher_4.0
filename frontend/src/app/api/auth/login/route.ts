import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side login route that authenticates with PocketBase,
 * sets the pb_auth cookie via Set-Cookie header, and redirects.
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
      return NextResponse.redirect(new URL(`/${locale}/login?error=missing`, request.url));
    }

    // Authenticate with PocketBase server-side
    const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";
    const authRes = await fetch(`${pbUrl}/api/collections/users/auth-with-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity: email, password }),
    });

    if (!authRes.ok) {
      return NextResponse.redirect(new URL(`/${locale}/login?error=invalid`, request.url));
    }

    const authData = await authRes.json();
    const token = authData.token;
    const record = authData.record;

    if (!token || !record?.role) {
      return NextResponse.redirect(new URL(`/${locale}/login?error=invalid`, request.url));
    }

    // Determine dashboard path based on role
    const role = record.role as string;
    const dashboardPath = `/${locale}/dashboard/${role}`;

    // Set the pb_auth cookie via Set-Cookie header and redirect to dashboard
    const cookieValue = encodeURIComponent(JSON.stringify({ token, record }));
    const response = NextResponse.redirect(new URL(dashboardPath, request.url));

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
    return NextResponse.redirect(new URL("/ar/login?error=server", request.url));
  }
}