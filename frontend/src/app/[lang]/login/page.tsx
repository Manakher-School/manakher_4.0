"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/context/locale-context";
import { useSettings } from "@/context/settings-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, Loader2, AlertCircle } from "lucide-react";
import pb from "@/lib/pocketbase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { dict, locale, switchLocale } = useLocale();
  const { settings } = useSettings();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      // Authenticate with PocketBase
      await pb.collection("users").authWithPassword(email, password);

      // POST to server-side callback which sets the cookie via Set-Cookie
      // header and redirects to the dashboard in a single response. This is
      // the most reliable way to set cookies — Set-Cookie in a full page
      // redirect response is guaranteed to be processed by all browsers,
      // unlike fetch() responses or document.cookie which can silently fail
      // on mobile devices accessing via IP address.
      const token = pb.authStore.token;
      const record = pb.authStore.record;
      const role = record?.role;

      // Submit a hidden form that POSTs to /api/auth/callback
      // This triggers a full page navigation with Set-Cookie + 302 redirect
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/api/auth/callback";
      form.style.display = "none";

      const fields = {
        token,
        record: JSON.stringify(record),
        locale,
        role,
      };

      for (const [key, value] of Object.entries(fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : dict.login.invalidCredentials);
      setIsSubmitting(false);
    }
  }

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
            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-[var(--radius-lg)] bg-[var(--color-danger-subtle)] border border-red-100 p-3.5 text-sm text-[var(--color-danger-text)]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger)]" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Input
                id="email"
                label={t.emailLabel}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder={t.emailPlaceholder}
              />
              <Input
                id="password"
                label={t.passwordLabel}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
