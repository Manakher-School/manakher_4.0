import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear the pb_auth cookie by setting maxAge to 0
  response.cookies.set({
    name: "pb_auth",
    value: "",
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    httpOnly: false,
  });

  return response;
}