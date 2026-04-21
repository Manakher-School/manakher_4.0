import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, record } = body;

    if (!token || !record) {
      return NextResponse.json(
        { error: "Missing token or record" },
        { status: 400 }
      );
    }

    const cookieValue = encodeURIComponent(
      JSON.stringify({ token, record })
    );

    const response = NextResponse.json({ success: true });

    // Set the pb_auth cookie via Set-Cookie header — this is the most
    // reliable way to set cookies and works across all browsers/devices,
    // including mobile browsers accessing via IP address where document.cookie
    // can be unreliable.
    response.cookies.set({
      name: "pb_auth",
      value: cookieValue,
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: "lax",
      httpOnly: false, // Must be accessible by client-side JS for PocketBase SDK
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}