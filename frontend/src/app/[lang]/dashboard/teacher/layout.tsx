"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/context/locale-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { LayoutGrid, Users, BookOpen, FileText, Bell, ClipboardList, UserCircle } from "lucide-react";
import type { ReactNode } from "react";

type NavKey = "overview" | "sections" | "materials" | "homework" | "announcements" | "quizzes" | "profile";

interface NavItem {
  key: NavKey;
  href: string;
  icon: ReactNode;
}

export default function TeacherLayout({ children }: { children: ReactNode }) {
  const { dict, locale } = useLocale();
  const pathname = usePathname();
  const t = dict.dashboard.teacher.nav;

  const base = `/${locale}/dashboard/teacher`;

   const navItems: NavItem[] = [
     { key: "overview",       href: base,                       icon: <LayoutGrid className="h-6 w-6" /> },
     { key: "sections",       href: `${base}/sections`,         icon: <Users className="h-6 w-6" /> },
     { key: "materials",      href: `${base}/materials`,        icon: <BookOpen className="h-6 w-6" /> },
     { key: "homework",       href: `${base}/homework`,         icon: <FileText className="h-6 w-6" /> },
     { key: "announcements",  href: `${base}/announcements`,    icon: <Bell className="h-6 w-6" /> },
     { key: "quizzes",        href: `${base}/quizzes`,          icon: <ClipboardList className="h-6 w-6" /> },
     { key: "profile",        href: `${base}/profile`,           icon: <UserCircle className="h-6 w-6" /> },
   ];

    // Mobile-sized icons for bottom tab bar
    const mobileNavItems: NavItem[] = [
      { key: "overview",       href: base,                       icon: <LayoutGrid className="h-7 w-7" /> },
      { key: "sections",       href: `${base}/sections`,         icon: <Users className="h-7 w-7" /> },
      { key: "materials",      href: `${base}/materials`,        icon: <BookOpen className="h-7 w-7" /> },
      { key: "homework",       href: `${base}/homework`,         icon: <FileText className="h-7 w-7" /> },
      { key: "announcements",  href: `${base}/announcements`,    icon: <Bell className="h-7 w-7" /> },
      { key: "quizzes",        href: `${base}/quizzes`,          icon: <ClipboardList className="h-7 w-7" /> },
      { key: "profile",        href: `${base}/profile`,           icon: <UserCircle className="h-7 w-7" /> },
    ];

  return (
    <div className="flex gap-6">
      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col gap-1 pt-1">
        {navItems.map(({ key, href, icon }) => {
          const isActive = key === "overview"
            ? pathname === href
            : pathname.startsWith(href);
          return (
            <Link
              key={key}
              href={href}
              className={[
                "flex items-center gap-3 rounded-[var(--radius-lg)] px-3 py-2.5 text-sm font-semibold transition-colors",
                isActive
                  ? "bg-[var(--color-role-teacher-bg)] text-[var(--color-role-teacher-text)]"
                  : "text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-ink)]",
              ].join(" ")}
            >
              <span className={isActive ? "text-[var(--color-role-teacher-bold)]" : ""}>{icon}</span>
              {t[key]}
            </Link>
          );
        })}
      </aside>

       {/* ── Mobile tab bar ── */}
       <div className="lg:hidden fixed bottom-0 inset-x-0 z-20 flex border-t border-[var(--color-border)] bg-[var(--color-surface-card)] px-1 pb-safe">
         {mobileNavItems.map(({ key, href, icon }) => {
           const isActive = key === "overview"
             ? pathname === href
             : pathname.startsWith(href);
           return (
             <Link
               key={key}
               href={href}
               className={[
                 "flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors",
                 isActive
                   ? "text-[var(--color-role-teacher-bold)]"
                   : "text-[var(--color-ink-disabled)] hover:text-[var(--color-ink-secondary)]",
               ].join(" ")}
             >
               {icon}
               <span className="hidden xs:block">{t[key]}</span>
             </Link>
           );
        })}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 min-w-0 pb-20 lg:pb-0">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>
    </div>
  );
}
