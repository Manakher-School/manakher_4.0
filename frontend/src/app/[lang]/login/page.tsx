"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/context/locale-context";
import { useSettings } from "@/context/settings-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, Loader2, AlertCircle } from "lucide-react";
import pb from "@/lib/pocketbase";
import { getRoleDashboardPath } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { dict, locale, switchLocale } = useLocale();
  const { settings } = useSettings();

  // Check for error query param from server-side redirect
  // (read once on mount, then clear from URL)
  const [serverError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      // Clear error from URL so it doesn't persist on refresh
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
    return err;
  });

  // Show server error on first render if present
  if (serverError && !error) {
    if (serverError === "invalid") {
      // Will be shown below
    } else if (serverError === "server") {
      // Will be shown below
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Primary auth: use PocketBase SDK client-side
      // This works reliably because the browser calls PocketBase directly
      // (no CORS issues since PocketBase is configured for it)
      const authData = await pb.collection("users").authWithPassword(email, password);
      const user = authData.record;

      if (!user?.role) {
        setError(dict.login.invalidCredentials);
        return;
      }

      // Auth succeeded — the onChange listener in pocketbase.ts will sync
      // the cookie to document.cookie. Also explicitly set it here for reliability.
      if (typeof document !== "undefined") {
        const cookieValue = JSON.stringify({
          token: pb.authStore.token,
          record: pb.authStore.record,
        });
        document.cookie = `pb_auth=${encodeURIComponent(cookieValue)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      }

      // Navigate to the dashboard
      window.location.href = getRoleDashboardPath(user.role, locale);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : dict.login.invalidCredentials);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Determine display error (from server redirect or client-side)
  const displayError = error || (serverError === "invalid" ? dict.login.invalidCredentials : serverError === "server" ? (locale === "ar" ? "حدث خطأ في الخادم. حاول مرة أخرى." : "Server error. Please try again.") : serverError === "missing" ? dict.login.invalidCredentials : "");

  const t = dict.login;
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">

      {/* ── Left decorative panel ───────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[46%] flex-col items-center justify-center relative overflow-hidden"
        style={{ background: "linear-gradient(150deg, #4c1d95 0%, #5b21b6 45%, #7c3aed 100%)" }}
      >
        {/* Background circles — give depth */}
        <div className="absolute rounded-full opacity-[0.12]" style={{ width: 520, height: 520, background: "#fff", top: -140, insetInlineEnd: -160 }} />
        <div className="absolute rounded-full opacity-[0.08]" style={{ width: 320, height: 320, background: "#fff", bottom: 20, insetInlineStart: -80 }} />
        <div className="absolute rounded-full opacity-[0.14]" style={{ width: 200, height: 200, background: "#c4b5fd", bottom: 180, insetInlineEnd: 40 }} />
        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />

        {/* Brand content */}
        <div className="relative z-10 text-center px-14">
          {/* Large brand mark */}
          <div
            className="inline-flex h-28 w-28 items-center justify-center rounded-[var(--radius-2xl)] mb-8 shadow-[var(--shadow-lg)]"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "2px solid rgba(255,255,255,0.22)" }}
          >
            <span className="text-5xl font-black text-white" style={{ letterSpacing: "-2px" }}>م</span>
          </div>

          {/* School name — the real identity */}
          <h1 className="text-2xl font-black text-white leading-tight mb-2" style={{ letterSpacing: "-0.5px" }}>
            {t.title}
          </h1>
          <div className="mx-auto mb-5 h-0.5 w-16 rounded-full bg-violet-300 opacity-60" />
          <p className="text-violet-200 text-sm leading-relaxed">
            {t.subtitle}
          </p>

          {/* Decorative dots row */}
          <div className="flex items-center justify-center gap-2 mt-10">
            <span className="h-2 w-10 rounded-full bg-white opacity-70" />
            <span className="h-2 w-2 rounded-full bg-white opacity-35" />
            <span className="h-2 w-2 rounded-full bg-white opacity-35" />
          </div>
        </div>
      </div>

      {/* ── Right form panel ────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 relative bg-surface-dotted">

        {/* Language switcher */}
        <div className="absolute top-5 end-5">
          <button
            onClick={() => switchLocale(nextLocale)}
            className="text-xs font-bold text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors rounded-[var(--radius-full)] px-3 py-1.5 border border-[var(--color-border)] bg-[var(--color-surface-card)] hover:bg-[var(--color-surface-hover)] shadow-[var(--shadow-xs)]"
          >
            {dict.common.switchLang}
          </button>
        </div>

        {/* Mobile brand — only on small screens */}
        <div className="lg:hidden mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] mb-3" style={{ background: "linear-gradient(135deg, #4c1d95, #7c3aed)" }}>
            <span className="text-2xl font-black text-white">م</span>
          </div>
          <h1 className="text-base font-black text-[var(--color-ink)] leading-snug">{t.title}</h1>
        </div>

        {/* Form container */}
        <div className="w-full max-w-[400px]">

          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-2xl font-black text-[var(--color-ink)]" style={{ letterSpacing: "-0.5px" }}>
              {locale === "ar" ? "أهلاً بك" : "Welcome back"}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-ink-secondary)]">
              {locale === "ar" ? "سجّل دخولك للمتابعة" : "Sign in to continue"}
            </p>
          </div>

          {/* Card */}
          <div className="bg-[var(--color-surface-card)] border border-[var(--color-border)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-md)] p-8">
            {displayError && (
              <div className="mb-5 flex items-start gap-3 rounded-[var(--radius-lg)] bg-[var(--color-danger-subtle)] border border-red-100 p-3.5 text-sm text-[var(--color-danger-text)]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger)]" />
                <span>{displayError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Input
                id="email"
                label={t.emailLabel}
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (displayError) setError(""); }}
                required
                autoComplete="email"
                placeholder={t.emailPlaceholder}
              />
              <Input
                id="password"
                label={t.passwordLabel}
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (displayError) setError(""); }}
                required
                autoComplete="current-password"
                placeholder={t.passwordPlaceholder}
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 w-full py-3 text-base rounded-[var(--radius-lg)]"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                {isSubmitting ? t.submittingButton : t.submitButton}
              </Button>
            </form>
          </div>

          {/* Footer note */}
          <p className="mt-5 text-center text-xs text-[var(--color-ink-disabled)] font-medium">
            {locale === "ar" ? settings.schoolNameAr : settings.schoolNameEn}
          </p>
        </div>
      </div>
    </div>
  );
}