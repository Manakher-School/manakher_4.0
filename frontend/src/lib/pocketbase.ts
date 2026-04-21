import PocketBase from "pocketbase";

const pb = new PocketBase(
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090"
);

// Disable auto-cancellation to prevent request collisions
pb.autoCancellation(false);

// Sync authStore to a cookie so that proxy.ts (server-side) can read it.
// Uses the server-side API route for reliability — document.cookie can
// silently fail on mobile browsers accessing via IP address.
if (typeof window !== "undefined") {
  pb.authStore.onChange(() => {
    const isValid = pb.authStore.isValid;
    if (isValid) {
      const token = pb.authStore.token;
      const record = pb.authStore.record;
      // Fire-and-forget: set cookie via server-side API route
      fetch("/api/auth/set-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, record }),
      }).catch(() => {
        // Fallback to document.cookie if the API route fails
        const cookieValue = JSON.stringify({ token, record });
        document.cookie = `pb_auth=${encodeURIComponent(cookieValue)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      });
    } else {
      // Fire-and-forget: clear cookie via server-side API route
      fetch("/api/auth/clear-cookie", { method: "POST" }).catch(() => {
        document.cookie = "pb_auth=; path=/; max-age=0; SameSite=Lax";
      });
    }
  }, true);
}

export default pb;

/** Named export for use in components that prefer named imports. */
export function getPocketBase() {
  return pb;
}