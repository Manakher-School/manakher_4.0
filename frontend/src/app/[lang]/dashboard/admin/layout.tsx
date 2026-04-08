"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/context/locale-context";
import {
  LayoutGrid, BookOpen, Users, GraduationCap, Layers, Calendar,
  Shield, Activity, Settings
} from "lucide-react";
import type { ReactNode } from "react";

type NavKey = "overview" | "sections" | "subjects" | "teachers" | "students" | "exams" | "moderation" | "monitoring" | "settings";

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
    { key: "overview",    href: `/${locale}/dashboard/admin`,             icon: <LayoutGrid className="h-4 w-4" /> },
    { key: "sections",    href: `/${locale}/dashboard/admin/sections`,    icon: <Layers className="h-4 w-4" /> },
    { key: "subjects",    href: `/${locale}/dashboard/admin/subjects`,    icon: <BookOpen className="h-4 w-4" /> },
    { key: "teachers",    href: `/${locale}/dashboard/admin/teachers`,    icon: <GraduationCap className="h-4 w-4" /> },
    { key: "students",    href: `/${locale}/dashboard/admin/students`,    icon: <Users className="h-4 w-4" /> },
    { key: "exams",       href: `/${locale}/dashboard/admin/exams`,       icon: <Calendar className="h-4 w-4" /> },
    { key: "moderation",  href: `/${locale}/dashboard/admin/moderation`,  icon: <Shield className="h-4 w-4" /> },
    { key: "monitoring",  href: `/${locale}/dashboard/admin/monitoring`,  icon: <Activity className="h-4 w-4" /> },
    { key: "settings",    href: `/${locale}/dashboard/admin/settings`,    icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="flex gap-6">
      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex w-52 shrink-0 flex-col gap-1 pt-1">
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
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-20 flex border-t border-[var(--color-border)] bg-[var(--color-surface-card)] px-1 pb-safe">
        {navItems.map(({ key, href }) => {
          const isActive = key === "overview"
            ? pathname === href
            : pathname.startsWith(href);
          
          // Mobile icons with larger size (h-6 w-6 = 24px)
          const mobileIcons: Record<NavKey, ReactNode> = {
            overview: <LayoutGrid className="h-6 w-6" />,
            sections: <Layers className="h-6 w-6" />,
            subjects: <BookOpen className="h-6 w-6" />,
            teachers: <GraduationCap className="h-6 w-6" />,
            students: <Users className="h-6 w-6" />,
            exams: <Calendar className="h-6 w-6" />,
            moderation: <Shield className="h-6 w-6" />,
            monitoring: <Activity className="h-6 w-6" />,
            settings: <Settings className="h-6 w-6" />,
          };
          
          return (
            <Link
              key={key}
              href={href}
              className={[
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors",
                isActive
                  ? "text-[var(--color-role-admin-bold)]"
                  : "text-[var(--color-ink-disabled)] hover:text-[var(--color-ink-secondary)]",
              ].join(" ")}
            >
              {mobileIcons[key]}
              <span className="hidden xs:block">{t[key]}</span>
            </Link>
          );
        })}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 min-w-0 pb-20 lg:pb-0">
        {children}
      </div>
    </div>
  );
}
