import pb from "./pocketbase";
import type { RecordModel } from "pocketbase";

export type UserRole = "admin" | "teacher" | "student";

export interface AuthUser extends RecordModel {
  email: string;
  name_ar: string;
  name_en: string;
  role: UserRole;
  avatar: string;
  verified: boolean;
  username?: string;
}

/** Returns the display name for a user in the given locale. */
export function getDisplayName(user: AuthUser, locale: string): string {
  return locale === "ar"
    ? user.name_ar || user.name_en || user.email
    : user.name_en || user.name_ar || user.email;
}

/**
 * Set the pb_auth cookie via a server-side API route.
 * This is more reliable than document.cookie, especially on mobile
 * browsers accessing the app over the network (e.g. Android at
 * http://192.168.1.19:3001) where document.cookie can silently fail.
 */
async function setAuthCookie(token: string, record: unknown): Promise<void> {
  try {
    await fetch("/api/auth/set-cookie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, record }),
    });
  } catch (e) {
    console.error("Failed to set auth cookie via API route:", e);
    // Fallback to document.cookie if the API route fails
    if (typeof document !== "undefined") {
      const cookieValue = JSON.stringify({ token, record });
      document.cookie = `pb_auth=${encodeURIComponent(cookieValue)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    }
  }
}

/**
 * Clear the pb_auth cookie via a server-side API route.
 */
async function clearAuthCookie(): Promise<void> {
  try {
    await fetch("/api/auth/clear-cookie", { method: "POST" });
  } catch (e) {
    console.error("Failed to clear auth cookie via API route:", e);
    // Fallback to document.cookie
    if (typeof document !== "undefined") {
      document.cookie = "pb_auth=; path=/; max-age=0; SameSite=Lax";
    }
  }
}

export async function login(
  email: string,
  password: string
): Promise<AuthUser> {
  const authData = await pb
    .collection("users")
    .authWithPassword(email, password);

  // Set the auth cookie via server-side API route for reliability
  await setAuthCookie(pb.authStore.token, pb.authStore.record);

  return authData.record as unknown as AuthUser;
}

export function logout(): void {
  pb.authStore.clear();
  // Clear the cookie via server-side API route (fire and forget)
  clearAuthCookie();
}

export function getCurrentUser(): AuthUser | null {
  if (!pb.authStore.isValid) {
    return null;
  }
  return pb.authStore.record as unknown as AuthUser | null;
}

export function isAuthenticated(): boolean {
  return pb.authStore.isValid;
}

export function getUserRole(): UserRole | null {
  const user = getCurrentUser();
  return user?.role ?? null;
}

export function getRoleDashboardPath(role: UserRole, locale = "ar"): string {
  switch (role) {
    case "admin":
      return `/${locale}/dashboard/admin`;
    case "teacher":
      return `/${locale}/dashboard/teacher`;
    case "student":
      return `/${locale}/dashboard/student`;
    default:
      return `/${locale}/login`;
  }
}