import PocketBase from "pocketbase";

const pb = new PocketBase(
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090"
);

// Disable auto-cancellation to prevent request collisions
pb.autoCancellation(false);

// Sync authStore to a cookie so that proxy.ts (server-side) can read it.
// The primary auth flow (login) sets the cookie server-side via /api/auth/login.
// This onChange listener keeps the cookie in sync for subsequent auth changes
// (e.g., token refresh, profile updates, logout).
if (typeof window !== "undefined") {
  pb.authStore.onChange(() => {
    const isValid = pb.authStore.isValid;
    if (isValid) {
      // Update the cookie to match the current auth state
      const cookieValue = JSON.stringify({
        token: pb.authStore.token,
        record: pb.authStore.record,
      });
      document.cookie = `pb_auth=${encodeURIComponent(cookieValue)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

      // Also try the server-side route as a backup
      fetch("/api/auth/set-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: pb.authStore.token, record: pb.authStore.record }),
      }).catch(() => {
        // Silently ignore — document.cookie fallback above already handled it
      });
    } else {
      // Clear the cookie on logout
      document.cookie = "pb_auth=; path=/; max-age=0; SameSite=Lax";

      fetch("/api/auth/clear-cookie", { method: "POST" }).catch(() => {
        // Silently ignore — document.cookie fallback above already handled it
      });
    }
  }, true);
}

export default pb;

/** Named export for use in components that prefer named imports. */
export function getPocketBase() {
  return pb;
}