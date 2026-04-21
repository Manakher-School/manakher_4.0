import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side auth callback that sets the pb_auth cookie via Set-Cookie
 * header and redirects to the dashboard.
 *
 * This is the most reliable way to set cookies — via a full page response
 * (302 redirect from a form POST), not a fetch() response. Some mobile
 * browsers (especially on Android accessing via IP address) don't reliably
 * process Set-Cookie headers in fetch() responses.
 *
 * Flow:
 * 1. Client calls authWithPassword() → gets token + record from PocketBase
 * 2. Client submits a hidden form POSTing to /api/auth/callback
 * 3. This route sets the pb_auth cookie via Set-Cookie header
 * 4. This route redirects (302) to /{locale}/dashboard/{role}
 * 5. Browser follows the redirect WITH the cookie set → proxy sees auth → allows through
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get("token") as string;
    const recordStr = formData.get("record") as string;
    const locale = formData.get("locale") as string;
    const role = formData.get("role") as string;

    if (!token || !recordStr || !locale || !role) {
      // Missing required fields — redirect to login
      const loginUrl = new URL(`/${locale || "ar"}/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }

    let record: Record<string, unknown>;
    try {
      record = JSON.parse(recordStr);
    } catch {
      // Invalid record JSON — redirect to login
      const loginUrl = new URL(`/${locale}/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Determine dashboard path based on role
    const dashboardPath = `/${locale}/dashboard/${role}`;
    const redirectUrl = new URL(dashboardPath, request.url);

    // Set the pb_auth cookie via Set-Cookie header and redirect to dashboard
    const cookieValue = encodeURIComponent(JSON.stringify({ token, record }));

    const response = NextResponse.redirect(redirectUrl);

    response.cookies.set({
      name: "pb_auth",
      value: cookieValue,
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: "lax",
      httpOnly: false, // Must be readable by client-side JS for PocketBase SDK
    });

    return response;
  } catch {
    // Invalid request — redirect to login
    const loginUrl = new URL("/ar/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
}