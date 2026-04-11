"use client";

import { ReactNode } from "react";
import { StatCard } from "@/components/ui/stat-card";

interface StatItem {
  icon: ReactNode;
  label: string;
  value: string | number;
}

interface PageStatsLayoutProps {
  title: string;
  greeting: string;
  schoolName: string;
  stats: StatItem[];
  children?: ReactNode;
  gradientBg?: string;
}

/**
 * Reusable page layout with welcome banner and stat cards
 * Used by: admin/page, teacher/page, student/page
 * Reduces ~80+ lines per page
 */
export function PageStatsLayout({
  title,
  greeting,
  schoolName,
  stats,
  children,
  gradientBg = "linear-gradient(135deg, #4c1d95 0%, #5b21b6 60%, #7c3aed 100%)",
}: PageStatsLayoutProps) {
  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div
        className="relative overflow-hidden rounded-[var(--radius-2xl)] p-7 shadow-[var(--shadow-md)]"
        style={{ background: gradientBg }}
      >
        <div
          className="absolute rounded-full opacity-10"
          style={{
            width: 260,
            height: 260,
            background: "#fff",
            top: -80,
            insetInlineEnd: -60,
          }}
        />
        <div
          className="absolute rounded-full opacity-[0.07]"
          style={{
            width: 140,
            height: 140,
            background: "#fff",
            bottom: -40,
            insetInlineStart: 40,
          }}
        />
        <div className="relative z-10">
          <p className="text-white text-sm font-semibold mb-1">{greeting}</p>
          <h2
            className="text-white text-2xl font-black"
            style={{ letterSpacing: "-0.5px" }}
          >
            {title}
          </h2>
          <p className="text-white text-xs mt-2 font-medium opacity-90">
            {schoolName}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div>
        <h3
          className="text-base font-black text-[var(--color-ink)] mb-4"
          style={{ letterSpacing: "-0.2px" }}
        >
          نظرة عامة / Overview
        </h3>
        <div className="stat-card-group grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
            />
          ))}
        </div>
      </div>

      {/* Additional content */}
      {children && <div>{children}</div>}
    </div>
  );
}
