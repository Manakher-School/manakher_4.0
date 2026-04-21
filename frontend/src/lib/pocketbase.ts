import PocketBase from "pocketbase";

const pb = new PocketBase(
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090"
);

// Disable auto-cancellation to prevent request collisions
pb.autoCancellation(false);

// ─── Sync cookie → localStorage on page load ───────────────────────────────
// The server-side login route (/api/auth/login) sets the pb_auth cookie via
// Set-Cookie header. But PocketBase SDK reads from localStorage, which is
// empty after a server-side login. If we don't sync, pb.authStore.isValid
// will be false, and the onChange listener will clear the cookie.
if (typeof window !== "undefined") {
  const cookieMatch = document.cookie.match(/(?:^|;\s*)pb_auth=([^;]*)/);
  if (cookieMatch) {
    try {
      const authData = JSON.parse(decodeURIComponent(cookieMatch[1]));
      if (authData.token && authData.record) {
        // Populate PocketBase authStore from the cookie BEFORE registering
        // the onChange listener. This ensures isValid=true on page load.
        pb.authStore.save(authData.token, authData.record);
      }
    } catch {
      // Invalid cookie data — clear it
      document.cookie = "pb_auth=; path=/; max-age=0; SameSite=Lax";
    }
  }
}

// ─── Sync authStore changes back to cookie ─────────────────────────────────
// The primary auth flow (login) sets the cookie server-side. This listener
// keeps the cookie in sync for subsequent changes (token refresh, profile
// update, logout). We do NOT use the `true` (fire-immediately) parameter
// because we've already synced from cookie → localStorage above.
if (typeof window !== "undefined") {
  pb.authStore.onChange(() => {
    const isValid = pb.authStore.isValid;
    if (isValid) {
      const cookieValue = JSON.stringify({
        token: pb.authStore.token,
        record: pb.authStore.record,
      });
      document.cookie = `pb_auth=${encodeURIComponent(cookieValue)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    } else {
      document.cookie = "pb_auth=; path=/; max-age=0; SameSite=Lax";
    }
  });
}

export default pb;

/** Named export for use in components that prefer named imports. */
export function getPocketBase() {
  return pb;
}