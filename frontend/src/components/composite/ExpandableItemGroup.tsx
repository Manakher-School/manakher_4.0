"use client";

import { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableItemGroupProps {
  id: string;
  isOpen: boolean;
  onToggle: () => void;
  header: ReactNode;
  count?: number;
  countLabel?: string;
  children: ReactNode;
  isDashed?: boolean;
}

/**
 * Reusable expandable/accordion item group
 * Used by: admin/students (sections), student/materials (by section)
 * Reduces ~40+ lines per group
 */
export function ExpandableItemGroup({
  id,
  isOpen,
  onToggle,
  header,
  count,
  countLabel = "items",
  children,
  isDashed = false,
}: ExpandableItemGroupProps) {
  const borderClass = isDashed
    ? "border-dashed border-[var(--color-border)]"
    : "border-[var(--color-border)]";

  return (
    <div
      className={`rounded-[var(--radius-xl)] border ${borderClass} bg-[var(--color-surface-card)] overflow-hidden shadow-[var(--shadow-xs)]`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-start transition-colors hover:bg-[var(--color-surface-hover)]"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 flex-wrap">
          {header}
          {count !== undefined && (
            <span className="text-xs font-semibold text-[var(--color-ink-secondary)] bg-[var(--color-surface-sunken)] rounded-full px-2 py-0.5">
              {count} {countLabel}
            </span>
          )}
        </div>
        <span className="text-[var(--color-ink-secondary)] shrink-0">
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-[var(--color-border-subtle)]">{children}</div>
      )}
    </div>
  );
}
