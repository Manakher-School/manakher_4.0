"use client";

import { useAuth } from "@/context/auth-context";
import { useLocale } from "@/context/locale-context";
import { useSettings } from "@/context/settings-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { getRoleDashboardPath, getDisplayName } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { ErrorBoundary } from "@/components/error-boundary";
import { LogOut, Loader2 } from "lucide-react";

const roleHeaderAccent: Record<string, string> = {
  admin:   "from-[var(--color-role-admin-bold)] to-[#7c3aed]",
  teacher: "from-[var(--color-role-teacher-bold)] to-[#0891b2]",
  student: "from-[var(--color-role-student-bold)] to-[#f59e0b]",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const { dict, locale, switchLocale } = useLocale();
  const { settings } = useSettings();
  const router = useRouter();
  const pathname = usePathname();

  const nextLocale = locale === "ar" ? "en" : "ar";

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push(`/${locale}/login`); return; }
    const allowedPath = getRoleDashboardPath(user.role, locale);
    if (!pathname.startsWith(allowedPath)) router.replace(allowedPath);
  }, [isLoading, user, router, pathname, locale]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-dotted">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
      </div>
    );
  }

  if (!user) return null;

  const allowedPath = getRoleDashboardPath(user.role, locale);
  if (!pathname.startsWith(allowedPath)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-dotted">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
      </div>
    );
  }

  const role = user.role as "admin" | "teacher" | "student";
  const accentGradient = roleHeaderAccent[role] ?? roleHeaderAccent.admin;
  const displayName = getDisplayName(user, locale);

  return (
    <div className="flex min-h-screen flex-col bg-surface-dotted">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[var(--color-surface-card)] border-b border-[var(--color-border)] shadow-[var(--shadow-sm)]">
        {/* Role accent strip */}
        <div className={`h-[3px] w-full bg-gradient-to-r ${accentGradient}`} />

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">

          {/* Brand block */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-gradient-to-br ${accentGradient} shadow-[var(--shadow-sm)]`}>
              <span className="text-lg font-black text-white leading-none">م</span>
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-sm font-black text-[var(--color-ink)] truncate" style={{ letterSpacing: "-0.3px" }}>
                {dict.common.appName}
              </span>
              <span className="hidden sm:block text-[11px] text-[var(--color-ink-secondary)] font-medium truncate">
                {locale === "ar" ? settings.schoolNameAr : settings.schoolNameEn}
              </span>
            </div>
            <Badge variant={role}>{dict.roles[role]}</Badge>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* User name */}
            <span className="hidden md:block text-sm font-semibold text-[var(--color-ink-secondary)] px-2 truncate max-w-[160px]">
              {displayName}
            </span>

            {/* Language switcher */}
            <button
              onClick={() => switchLocale(nextLocale)}
              aria-label={`Switch language to ${nextLocale === 'ar' ? 'العربية' : 'English'}`}
              className="rounded-[var(--radius-full)] px-3 py-1.5 text-xs font-bold text-[var(--color-ink-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-ink)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            >
              {dict.common.switchLang}
            </button>

            {/* Sign out */}
            <button
              onClick={() => { logout(); router.push(`/${locale}/login`); }}
              aria-label="Sign out"
              className="flex items-center gap-1.5 rounded-[var(--radius-full)] px-3 py-1.5 text-xs font-bold text-[var(--color-ink-secondary)] hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger-text)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-danger)]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{dict.common.signOut}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Page content ───────────────────────────────────────────────── */}
      <ErrorBoundary>
        <main role="main" aria-label="Main content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
      </ErrorBoundary>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] py-3">
        <p className="text-center text-xs text-[var(--color-ink-disabled)] font-medium">
          {locale === "ar" ? settings.schoolNameAr : settings.schoolNameEn}
        </p>
      </footer>
    </div>
  );
}
