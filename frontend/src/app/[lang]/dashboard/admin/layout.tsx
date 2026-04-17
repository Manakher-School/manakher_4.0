"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/context/locale-context";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  LayoutGrid, Layers, BookOpen, Users, Settings
} from "lucide-react";
import type { ReactNode } from "react";

type NavKey = "overview" | "classes" | "subjects_exams" | "users" | "settings";

interface NavItem {
  key: NavKey;
  href: string;
  icon: ReactNode;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { dict, locale } = useLocale();
  const pathname = usePathname();
  const t = dict.dashboard.admin.nav;

   const navItems: NavItem[] = [
     { key: "overview",       href: `/${locale}/dashboard/admin`,                    icon: <LayoutGrid className="h-6 w-6" /> },
     { key: "classes",        href: `/${locale}/dashboard/admin/sections`,           icon: <Layers className="h-6 w-6" /> },
     { key: "subjects_exams", href: `/${locale}/dashboard/admin/subjects_exams`,    icon: <BookOpen className="h-6 w-6" /> },
     { key: "users",          href: `/${locale}/dashboard/admin/users`,              icon: <Users className="h-6 w-6" /> },
     { key: "settings",       href: `/${locale}/dashboard/admin/settings`,           icon: <Settings className="h-6 w-6" /> },
   ];

   // Mobile-sized icons for bottom tab bar
   const mobileNavItems: NavItem[] = [
     { key: "overview",       href: `/${locale}/dashboard/admin`,                    icon: <LayoutGrid className="h-7 w-7" /> },
     { key: "classes",        href: `/${locale}/dashboard/admin/sections`,           icon: <Layers className="h-7 w-7" /> },
     { key: "subjects_exams", href: `/${locale}/dashboard/admin/subjects_exams`,    icon: <BookOpen className="h-7 w-7" /> },
     { key: "users",          href: `/${locale}/dashboard/admin/users`,              icon: <Users className="h-7 w-7" /> },
     { key: "settings",       href: `/${locale}/dashboard/admin/settings`,           icon: <Settings className="h-7 w-7" /> },
   ];

  return (
    <div className="flex gap-6">
      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col gap-1 pt-1 relative z-10" role="navigation" aria-label="Main navigation">
        {navItems.map(({ key, href, icon }) => {
          const isActive = key === "overview"
            ? pathname === href
            : pathname.startsWith(href);
          return (
            <Link
              key={key}
              href={href}
              aria-label={t[key]}
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex items-center gap-3 rounded-[var(--radius-lg)] px-3 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] relative z-10 pointer-events-auto",
                isActive
                  ? "bg-[var(--color-role-admin-bg)] text-[var(--color-role-admin-text)]"
                  : "text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-ink)]",
              ].join(" ")}
            >
              <span className={isActive ? "text-[var(--color-role-admin-bold)]" : ""}>{icon}</span>
              {t[key]}
            </Link>
          );
        })}
      </aside>

       {/* ── Mobile tab bar ── */}
       <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 flex border-t border-[var(--color-border)] bg-[var(--color-surface-card)] px-1 pb-safe pointer-events-auto" aria-label="Mobile navigation">
         {mobileNavItems.map(({ key, href, icon }) => {
           const isActive = key === "overview"
             ? pathname === href
             : pathname.startsWith(href);
           return (
              <Link
                key={key}
                href={href}
                aria-label={t[key]}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] relative z-20 pointer-events-auto",
                  isActive
                    ? "text-[var(--color-role-admin-bold)]"
                    : "text-[var(--color-ink-disabled)] hover:text-[var(--color-ink-secondary)]",
                ].join(" ")}
              >
               {icon}
               <span className="hidden xs:block">{t[key]}</span>
             </Link>
           );
         })}
       </nav>

      {/* ── Content ── */}
      <div className="flex-1 min-w-0 pb-20 lg:pb-0">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>
    </div>
  );
}
