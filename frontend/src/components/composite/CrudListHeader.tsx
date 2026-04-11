"use client";

import { ReactNode } from "react";
import { Plus, Search } from "lucide-react";

interface CrudListHeaderProps {
  title: string;
  icon: ReactNode;
  onAddClick?: () => void;
  addButtonLabel?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  rightContent?: ReactNode;
}

/**
 * Reusable CRUD list header component
 * Consolidates: title + icon, add button, optional search box
 * Reduces ~30+ lines per page
 */
export function CrudListHeader({
  title,
  icon,
  onAddClick,
  addButtonLabel = "Add",
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  rightContent,
}: CrudListHeaderProps) {
  const showSearch = searchValue !== undefined && onSearchChange !== undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-role-admin-bg)]">
            {icon}
          </div>
          <h2 className="text-xl font-black text-[var(--color-ink)]">{title}</h2>
        </div>
        {onAddClick ? (
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-role-admin-bold)] px-4 py-2 text-sm font-bold text-white shadow-[var(--shadow-sm)] hover:bg-[var(--color-accent-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            aria-label={addButtonLabel}
          >
            <Plus className="h-4 w-4" />
            {addButtonLabel}
          </button>
        ) : (
          rightContent
        )}
      </div>

      {showSearch && (
        <div className="relative">
          <Search
            className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-ink-placeholder)]"
            style={{ insetInlineStart: "0.875rem" }}
          />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-card)] py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] shadow-[var(--shadow-xs)]"
            style={{ paddingInlineStart: "2.5rem", paddingInlineEnd: "1rem" }}
          />
        </div>
      )}
    </div>
  );
}
