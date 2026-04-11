"use client";

import { ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  ariaLabel?: string;
  icon?: ReactNode;
}

interface TabNavigationProps {
  /** Array of tab definitions */
  tabs: TabItem[];
  /** Currently active tab ID */
  activeTab: string;
  /** Callback when tab is clicked */
  onTabChange: (tabId: string) => void;
  /** Optional className for wrapper */
  className?: string;
}

/**
 * Reusable tab navigation component
 * Consolidates: tab button styling, active state, keyboard navigation support
 * Reduces ~30 lines per tabbed page
 */
export function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}: TabNavigationProps) {
  return (
    <div
      className={`flex gap-1 border-b border-[var(--color-border-subtle)] ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-accent)] ${
            activeTab === tab.id
              ? "border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]"
              : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
          }`}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-label={tab.ariaLabel || tab.label}
        >
          {tab.icon && <span className="h-4 w-4">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
