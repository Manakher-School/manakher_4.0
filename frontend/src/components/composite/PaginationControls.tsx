"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when next page is clicked */
  onNextPage: () => void;
  /** Callback when previous page is clicked */
  onPrevPage: () => void;
  /** Optional text to show items per page info */
  itemsInfo?: string;
  /** Whether pagination controls are disabled (loading) */
  isDisabled?: boolean;
}

/**
 * Reusable pagination controls component
 * Consolidates: previous/next buttons, page info display, disable states
 * Reduces ~25 lines per paginated page
 */
export function PaginationControls({
  currentPage,
  totalPages,
  onNextPage,
  onPrevPage,
  itemsInfo,
  isDisabled = false,
}: PaginationControlsProps) {
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-[var(--color-border-subtle)] px-4 py-3 sm:flex-row sm:gap-6">
      {/* Items info */}
      {itemsInfo && (
        <p className="text-xs text-[var(--color-ink-secondary)] md:text-sm">
          {itemsInfo}
        </p>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={onPrevPage}
          disabled={!canGoPrev || isDisabled}
          className="rounded-[var(--radius-md)] p-2 text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="px-3 py-2 text-xs font-semibold text-[var(--color-ink)]">
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={onNextPage}
          disabled={!canGoNext || isDisabled}
          className="rounded-[var(--radius-md)] p-2 text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
