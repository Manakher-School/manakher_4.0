"use client";

import { ReactNode } from "react";

interface TableContainerProps {
  /** Container wrapper for table/list content */
  children: ReactNode;
  /** Optional className for custom styling */
  className?: string;
  /** Whether the table is empty */
  isEmpty?: boolean;
  /** Empty state message */
  emptyMessage?: string;
}

/**
 * Reusable table/list container component
 * Consolidates: container styling, empty state handling, consistent borders/shadows
 * Reduces ~20 lines per list page
 */
export function TableContainer({
  children,
  className = "",
  isEmpty = false,
  emptyMessage = "No items found",
}: TableContainerProps) {
  return (
    <div
      className={`rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-card)] overflow-hidden shadow-[var(--shadow-sm)] ${className}`}
    >
      {isEmpty ? (
        <div className="flex items-center justify-center p-8 text-center">
          <p className="text-sm text-[var(--color-ink-secondary)]">{emptyMessage}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
